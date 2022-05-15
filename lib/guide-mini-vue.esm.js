const extend = Object.assign;
const isObject = (value) => {
    return value !== null && typeof value === "object";
};
const capitalizer = (str) => {
    return str.slice(0, 1).toUpperCase() + str.slice(1);
};
const camelizer = (str) => {
    return str.replace(/-(\w)/g, (_, c) => {
        return c.toUpperCase();
    });
    //replace的正则表达式用法https://www.w3cschool.cn/regexp/qyh61pqc.html
};
const toHandlerKey = (str) => {
    return str ? "on" + capitalizer(str) : "";
};

const readonlyGet = createGetter(true);
const shallowReadonlyGet = createGetter(true, true);
function createGetter(isReadonly = false, shallow = false) {
    return function get(target, key) {
        if (key === "__v_is_Reactive" /* IS_REACTIVE */) {
            return !isReadonly;
        }
        else if (key === "__v_is_Readonly" /* IS_READONLY */) {
            return isReadonly;
        }
        let res = Reflect.get(target, key);
        if (shallow === true) {
            return res;
        }
        return res;
    };
}
const readonlyHandlers = {
    get: readonlyGet,
    set(target, key, value) {
        console.warn(`READONLY: ${key} can not be set.`);
        return true;
    }
};
const shallowReadonlyHandlers = extend({}, readonlyHandlers, { get: shallowReadonlyGet });

function createReactiveObject(target, baseHandlers) {
    if (!isObject(target)) {
        console.warn(`目标 ${target} 必须是一个对象`);
        return target;
    }
    return new Proxy(target, baseHandlers);
}
function shallowReadonly(raw) {
    return createReactiveObject(raw, shallowReadonlyHandlers);
}

function emit(instance, event, ...arg) {
    // console.log('event',event)
    const { props } = instance;
    //注: 开发流程中有TPP流程, 可以先把一个内容写死. 运行没问题之后, 再不断的泛化和重构.
    const handlerName = toHandlerKey(camelizer(event));
    const handler = props[handlerName];
    handler && handler(...arg);
}

function initProps(instance, rawProps) {
    instance.props = rawProps || {}; //因为第一层的props是undefined, 但是它仍然去调用了reactive, 所以是不合理的. 
}

const PublicPropertiesMap = {
    $el: (i) => i.vnode.el,
    $slots: (i) => i.slots, //WRONG IN 20220513, 老是吧instance和vnode上的属性搞混淆, 一定要注意!!, 挂在Component上的是instance上的,挂在vnode上的才需要访问实例的虚拟节点.
};
const PublicInstanceProxyHandlers = {
    get({ _: instance }, key) {
        const { setupState, props } = instance;
        const hasOwn = (value, key) => Object.prototype.hasOwnProperty.call(value, key); //WRONG IN 20220512 原型,还要call~!!!还写反了!
        if (hasOwn(setupState, key)) {
            return setupState[key];
        }
        else if (hasOwn(props, key)) {
            return props[key];
        }
        const publicGetter = PublicPropertiesMap[key];
        if (publicGetter) {
            return publicGetter(instance);
        }
    }
};

function initSlots(instance, children) {
    const { vnode } = instance;
    if (vnode.shapeFlag & 16 /* SLOT_CHILDREN */) {
        normalizeObectSlots(children, instance.slots);
    }
}
function normalizeObectSlots(children, slots) {
    // instance.slots = Array.isArray(children)? children: [children];
    for (let key in children) {
        let value = children[key];
        slots[key] = (slots) => normalizeSlotValue(value(slots)); //代入之后运行才知道结果是否为array.
        //因为header:({age})=>h("p", {}, "header"+age) 所以这里也要做相应的变化.
    }
}
function normalizeSlotValue(value) {
    return Array.isArray(value) ? value : [value];
}

function createComponentInstance(vnode, parent) {
    console.log('父组件', parent);
    const component = {
        vnode,
        type: vnode.type,
        setupState: {},
        props: {},
        slots: {},
        emit: () => { },
        parent,
        provides: parent ? parent.provides : {}
    };
    component.emit = emit.bind(null, component); //注,这样写的话是可以指定第一个参数. 参考mozilla
    //https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Function/bind
    return component;
}
function setupComponent(instance) {
    initProps(instance, instance.vnode.props); //注:第一次是挂在vnode上的,在init之后才挂在实例上
    initSlots(instance, instance.vnode.children);
    setupStatefulComponent(instance);
}
function setupStatefulComponent(instance) {
    const Component = instance.type;
    instance.proxy = new Proxy({ _: instance }, PublicInstanceProxyHandlers);
    const { setup } = Component;
    if (setup) {
        setCurrentInstance(instance);
        const setupResult = setup(shallowReadonly(instance.props), { emit: instance.emit });
        handleSetupResult(instance, setupResult);
    }
    setCurrentInstance(null);
}
function handleSetupResult(instance, setupResult) {
    if (typeof setupResult === "object") {
        instance.setupState = setupResult; //如果只是一个obj，他就给实例加上去
    }
    finishSetup(instance); //注:致命错误, 放在if里面的话, 子组件没办法继续解析, 所以子组件会变成undefined
}
function finishSetup(instance) {
    const Component = instance.type;
    // if(Component.render){
    instance.render = Component.render;
    // }//这几步似乎都是在把vnode里面的属性拿到这个实例上。
}
//现在的instance，也就是这个Component大概是:
//{vnode,type,setupState=rootComponent.setup(),render=rootComponent.render()}
//以后肯定还会在各层增加相应的情况，特别是在这个setupCompnent和后续的几个调用中
let currentInstance = null;
function getCurrentInstance() {
    return currentInstance;
}
function setCurrentInstance(instance) {
    currentInstance = instance;
}

const Fragment = Symbol("Fragment");
const Text = Symbol("Text");
function createVNode(type, props, children) {
    const vnode = {
        type,
        props,
        children,
        shapeFlag: getShapeFlag(type),
        el: null
    };
    if (typeof vnode.children === "string") {
        vnode.shapeFlag |= 4 /* TEXT_CHILDREN */;
    }
    else if (Array.isArray(children)) {
        vnode.shapeFlag |= 8 /* ARRAY_CHILDREN */;
    }
    if (vnode.shapeFlag & 2 /* STATEFUL_COMPONENT */) {
        if (typeof children == "object") {
            vnode.shapeFlag |= 16 /* SLOT_CHILDREN */;
        }
    }
    return vnode;
}
function createTextVNode(text) {
    return createVNode(Text, {}, text);
}
function getShapeFlag(type) {
    return typeof type === "string" ? 1 /* ELEMENT */ : 2 /* STATEFUL_COMPONENT */;
}

function render(vnode, container, parentComponent) {
    patch(vnode, container, parentComponent);
}
function patch(vnode, container, parentComponent) {
    //WRONG IN 20220510 vnode.type，如果是虚拟节点就是Object，如果是Element，则其typeof是string，而其值就是需要创建的元素，比如div、p等。
    const { type, shapeFlag } = vnode;
    switch (type) {
        case (Fragment):
            processFragment(vnode, container, parentComponent);
            break;
        case (Text):
            processTextVNode(vnode, container);
            break;
        default:
            if (shapeFlag & 1 /* ELEMENT */) {
                processElement(vnode, container, parentComponent);
            }
            else if (shapeFlag & 2 /* STATEFUL_COMPONENT */) {
                processComponent(vnode, container, parentComponent);
            }
    }
}
function processFragment(vnode, container, parentComponent) {
    //WRONG IN 20220515 const {children} = vnode, mountchildren已经是直接能渲染children了, 不用解出来
    mountChildren(vnode, container, parentComponent);
}
function processTextVNode(vnode, container) {
    const { children } = vnode;
    const textNode = vnode.el = document.createTextNode(children);
    container.append(textNode);
}
function processElement(vnode, container, parentComponent) {
    mountElement(vnode, container, parentComponent);
}
function mountElement(vnode, container, parentComponent) {
    const el = document.createElement(vnode.type);
    vnode.el = el;
    const { children } = vnode;
    if (vnode.shapeFlag & 4 /* TEXT_CHILDREN */) {
        el.textContent = children;
    }
    else if (vnode.shapeFlag & 8 /* ARRAY_CHILDREN */) {
        mountChildren(vnode, el, parentComponent);
    }
    const { props } = vnode;
    const isOn = (key) => { return /^on[A-Z]/.test(key); }; //注: 大部分JS的内容都可以表示为string. 因此需要巧妙使用正则表达式和slice等. 
    for (let key in props) {
        let value = props[key];
        if (isOn(key)) {
            const event = key.slice(2).toLowerCase();
            el.addEventListener(event, value);
        }
        else {
            el.setAttribute(key, value);
        }
    }
    container.appendChild(el);
}
function mountChildren(vnode, container, parentComponent) {
    vnode.children.forEach((element) => {
        patch(element, container, parentComponent);
    });
}
function processComponent(vnode, container, parentComponent) {
    //TODO 到时还需要有更新组件的功能
    mountComponent(vnode, container, parentComponent);
}
function mountComponent(initialVNode, container, parentComponent) {
    const instance = createComponentInstance(initialVNode, parentComponent);
    setupComponent(instance);
    setupRenderEffect(instance, initialVNode, container);
}
function setupRenderEffect(instance, initialVNode, container) {
    const { proxy } = instance;
    const subTree = instance.render.call(proxy); //由于这里指向了proxy,而render中的this.xx都会通过proxy拿到.而proxy虽然是个{},但是由于它get中可以返回对应的值,所以也就能拿到相应的值了.
    console.log('Component', initialVNode, 'instance', instance);
    //vnode-> patch
    //vnode -> element -> mountElement
    patch(subTree, container, instance);
    initialVNode.el = subTree.el; //这个subTree的el就是上面Element的el. 也就是从把Element的el不断向上传,这样在外部才能获取到$el.
}

function createApp(rootComponent) {
    return {
        mount(rootContainer) {
            const VNode = createVNode(rootComponent);
            render(VNode, rootContainer, undefined); //注:??
        }
    };
}

function h(type, props, children) {
    return createVNode(type, props, children);
}

function renderSlots(slots, name, props) {
    const slot = slots[name];
    if (slot) {
        if (typeof slot === "function") {
            return createVNode(Fragment, {}, slot(props));
            //slots是在App.js中定义的,然后已经保存到instance.slots里面了.然后通过name拿出来,在传入props,即可完成.
            //根据({age})=>h("p", {}, "header"+age)和renderSlots(this.$slots,"header",{age})进行相应的变化.
            //这里slot已经变为了一个function,也就是h("p", {}, "header"+age) , props是{age}
            //然后所以把age解构出来代入到function中即可.
        }
    }
}

function provide(key, value) {
    const currentInstance = getCurrentInstance();
    if (currentInstance) {
        const parentInstance = currentInstance.parent;
        let parentProvides = parentInstance.provides;
        let { provides } = currentInstance;
        if (provides === parentProvides) {
            provides = currentInstance.provides = Object.create(parentProvides);
            //注,这种写法就是在继承原型链,详见mdn Object.create. 右侧表达式表示用当前的实例的provides的原型指向父实例的provides. 然后再对provides进行赋值.
            //注, 解构得到的值, 不等于 变量.值. 所以provides = provides = Object.create会出错. 但是 currentInstance.provides=currentInstance.provides=Object.create则没有错.
        }
        provides[key] = value;
    }
}
function inject(key, defaultValue) {
    const currentInstance = getCurrentInstance();
    if (currentInstance) {
        const { provides } = currentInstance.parent;
        if (key in provides) {
            return provides[key];
        }
        else {
            if (typeof defaultValue === "function") {
                return defaultValue();
            }
            return defaultValue;
        }
    }
}

export { createApp, createTextVNode, getCurrentInstance, h, inject, provide, renderSlots };
