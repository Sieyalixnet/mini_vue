const extend = Object.assign;
const isObject = (value) => {
    return value !== null && typeof value === "object";
};
const hasChanged = (oldValue, newValue) => {
    return !Object.is(oldValue, newValue);
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

let activeEffect; //临时的全局变量
let shouldTrack = false;
class reactiveEffect {
    constructor(fn, scheduler) {
        this.deps = []; //装着依赖set的Array
        this.active = true;
        this._fn = fn;
        this.scheduler = scheduler;
    }
    run() {
        activeEffect = this; //一定要放上面。因为track是在run前和run后之间触发的(这是因为track在reactive.get的return之前)，如果放在后面，全局变量就会是undefine，然后track会把这个undefine收集进去。
        // console.log('run前')
        if (!this.active) {
            return this._fn();
        }
        shouldTrack = true;
        const result = this._fn(); //注:要先开了,再执行,这样就可以被track到了.
        shouldTrack = false;
        return result;
        //如果是写成this.fn，外面的runner会拿到[Function anonymous]，也就是说返回了一个函数。
        //如果是_fn，那么它返回的是放进来的那个函数。如果是_fn()，那么它就会返回放进来的函数的return的值，也就是"foo"。
        // console.log('run后')
    }
    stop() {
        if (this.active) {
            shouldTrack = false;
            stopEffect(this);
            if (this.onStop) {
                this.onStop();
            }
            this.active = false;
        }
    }
}
function stopEffect(effect) {
    effect.deps.forEach((dep) => { dep.delete(effect); });
    // console.log('清理前',effect.deps)
    effect.deps.length = 0;
    // console.log('清理后',effect.deps)
}
let targetMap = new Map();
function track(target, key) {
    if (isTracking() == false) {
        return;
    }
    // console.log('track')
    let depsMap = targetMap.get(target);
    if (!depsMap) {
        depsMap = new Map(); //这种判断没有后再赋值的方法，不要在内部重新用个let关键字，否则就会变成局部的变量，外部的变量仍然是undefine
        targetMap.set(target, depsMap);
    }
    let dep = depsMap.get(key);
    if (!dep) {
        dep = new Set();
        depsMap.set(key, dep);
    }
    //即使是完全一样的函数，放到Set里面也是两个元素。
    trackEffect(dep);
}
function isTracking() {
    return activeEffect !== undefined && shouldTrack == true; //WRONG IN 20220505. 不是!deps 而是 activeEffect
}
function trackEffect(dep) {
    if (dep.has(activeEffect)) {
        return;
    }
    dep.add(activeEffect); //记得依赖中全是effect,并且是属于reactiveEffect的实例
    activeEffect.deps.push(dep);
}
function trigger(target, key) {
    // console.log('trigger')
    let depsMap = targetMap.get(target);
    let dep = depsMap.get(key);
    triggerEffect(dep);
}
function triggerEffect(dep) {
    dep.forEach((effect) => {
        // console.log(effect)
        if (effect.scheduler) {
            effect.scheduler();
        }
        else {
            effect.run();
        }
    }); //性能会快点？
    // for(const effect of dep){
    //     if (effect.scheduler) { effect.scheduler() } else { effect.run() }
    // }
}
function effect(fn, options = {}) {
    console.log('this is effect');
    console.log(fn);
    const scheduler = options.scheduler;
    let _effect = new reactiveEffect(fn, scheduler);
    console.log(_effect);
    extend(_effect, options); //这里就把onStop等绑了进去
    _effect.run();
    const runner = _effect.run.bind(_effect); //不用bind会变全局变量
    runner.effect = _effect; //WRONG IN 220503, 只有给返回去的runner绑上effect, 才能在外部获取该effect
    return runner;
}

const get = createGetter();
const set = createSetter();
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
        if (!isReadonly) {
            track(target, key);
        }
        return res;
    };
}
function createSetter() {
    return function set(target, key, value) {
        let res = Reflect.set(target, key, value);
        trigger(target, key);
        return res;
    };
}
const mutableHandlers = {
    get,
    set
};
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
function reactive(raw) {
    return createReactiveObject(raw, mutableHandlers);
}
function shallowReadonly(raw) {
    return createReactiveObject(raw, shallowReadonlyHandlers);
}

class Refimpl {
    constructor(value) {
        this.__v_isRef = true;
        this._rawValue = value;
        this._value = convert(value);
        this.dep = new Set();
    }
    get value() {
        if (isTracking()) {
            trackEffect(this.dep);
        }
        return this._value;
    }
    set value(newValue) {
        if (hasChanged(newValue, this._rawValue)) {
            this._rawValue = newValue; //WRONG IN 220506,逻辑没搞懂.set就是改值之后触发依赖而已.初始化怎么作这里就应该怎么做.
            this._value = convert(newValue); //WRONG IN 220506要先改值再触发依赖!
            triggerEffect(this.dep);
        }
    }
}
function convert(value) {
    return isObject(value) ? reactive(value) : value;
}
function ref(value) {
    return new Refimpl(value);
}
function isRef(ref) {
    return !!ref.__v_isRef;
}
function unRef(ref) {
    return isRef(ref) ? ref.value : ref; //注: 这个unref是在proxyRefs中调用了, 所以只有返回了reactive, 它才能继续被track. 
}
function proxyRefs(objectWithRef) {
    return new Proxy(objectWithRef, {
        get(target, key) {
            return unRef(Reflect.get(target, key)); //通过unRef之后,这个值就已经是拿到了ref.value了,而对不是ref的值又不影响
        },
        set(target, key, value) {
            if (isRef(target[key]) && !isRef(value)) { //这种情况下,只要把ref[key]的value改为新值即可.//WRONG IN 20220506 还没完全理解这个set
                return (target[key].value = value); //只有这种情况,ref[key]要修改的值和新的value不是同级的,因此要特殊拿出来.
            }
            else {
                return Reflect.set(target, key, value);
                //若ref[key]和value都是ref,那么他们都需要把[key].value修改(也就是同级的),因此也可以直接用set
                //若ref[key]不是ref,那么本身就是普通的变量,因此可以直接用.
                //若ref[key]不是ref,value是ref,那么就把新的ref赋予它即可.单测中有这种情况.
            }
        }
    });
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
        isMounted: false,
        subTree: {},
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
        setCurrentInstance(null);
        handleSetupResult(instance, setupResult);
    }
}
function handleSetupResult(instance, setupResult) {
    if (typeof setupResult === "object") {
        instance.setupState = proxyRefs(setupResult); //如果只是一个obj，他就给实例加上去
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

function createAppAPI(render) {
    return function createApp(rootComponent) {
        return {
            mount(rootContainer) {
                const VNode = createVNode(rootComponent);
                render(VNode, rootContainer, undefined); //注:??
            }
        };
    };
}

function createRenderer(options) {
    const { createElement, patchProps, insert } = options;
    function render(vnode, container) {
        patch(null, vnode, container, null);
    }
    function patch(n1, n2, container, parentComponent) {
        //WRONG IN 20220510 vnode.type，如果是虚拟节点就是Object，如果是Element，则其typeof是string，而其值就是需要创建的元素，比如div、p等。
        const { type, shapeFlag } = n2;
        switch (type) {
            case (Fragment):
                processFragment(n1, n2, container, parentComponent);
                break;
            case (Text):
                processTextVNode(n1, n2, container);
                break;
            default:
                if (shapeFlag & 1 /* ELEMENT */) {
                    processElement(n1, n2, container, parentComponent);
                }
                else if (shapeFlag & 2 /* STATEFUL_COMPONENT */) {
                    processComponent(n1, n2, container, parentComponent);
                }
                break;
        }
    }
    function processFragment(n1, n2, container, parentComponent) {
        //WRONG IN 20220515 const {children} = vnode, mountchildren已经是直接能渲染children了, 不用解出来
        mountChildren(n2, container, parentComponent);
    }
    function processTextVNode(n1, n2, container) {
        const { children } = n2;
        const textNode = n2.el = document.createTextNode(children);
        container.append(textNode);
    }
    function processElement(n1, n2, container, parentComponent) {
        if (!n1) {
            mountElement(n2, container, parentComponent);
        }
        else {
            patchElement(n1, n2);
        }
    }
    function patchElement(n1, n2, container) {
        console.log('patchElement,', 'n1:,\n', n1, 'n2:,\n', n2);
    }
    function mountElement(vnode, container, parentComponent) {
        const el = vnode.el = createElement(vnode.type);
        const { children } = vnode;
        if (vnode.shapeFlag & 4 /* TEXT_CHILDREN */) {
            el.textContent = children;
        }
        else if (vnode.shapeFlag & 8 /* ARRAY_CHILDREN */) {
            mountChildren(vnode, el, parentComponent);
        }
        const { props } = vnode;
        for (let key in props) {
            let value = props[key];
            patchProps(el, key, value);
        }
        insert(el, container);
        // container.appendChild(el)
    }
    function mountChildren(vnode, container, parentComponent) {
        vnode.children.forEach((element) => {
            patch(null, element, container, parentComponent);
        });
    }
    function processComponent(n1, n2, container, parentComponent) {
        //TODO 到时还需要有更新组件的功能
        mountComponent(n2, container, parentComponent);
    }
    function mountComponent(initialVNode, container, parentComponent) {
        const instance = createComponentInstance(initialVNode, parentComponent);
        setupComponent(instance);
        setupRenderEffect(instance, initialVNode, container);
    }
    function setupRenderEffect(instance, initialVNode, container) {
        effect(() => {
            if (!instance.isMounted) {
                const { proxy } = instance;
                const subTree = (instance.subTree = instance.render.call(proxy)); //由于这里指向了proxy,而render中的this.xx都会通过proxy拿到.而proxy虽然是个{},但是由于它get中可以返回对应的值,所以也就能拿到相应的值了.
                console.log("init, ", 'Component', initialVNode, 'instance', instance);
                patch(null, subTree, container, instance);
                initialVNode.el = subTree.el; //这个subTree的el就是上面Element的el. 也就是从把Element的el不断向上传,这样在外部才能获取到$el.}
                instance.isMounted = true;
            }
            else {
                const { proxy } = instance;
                const subTree = instance.render.call(proxy);
                const prevSubTree = instance.subTree;
                instance.subTree = subTree;
                console.log("update, ", 'Component', initialVNode, 'instance', instance);
                console.log("prev: ", prevSubTree);
                console.log("curr: ", subTree);
                patch(prevSubTree, subTree, container, instance);
            }
        });
    }
    return { createApp: createAppAPI(render) };
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
            //注, 似乎在这种原型链继承问题的赋值 解构得到的值, 不完全等于 变量.值. 所以provides = provides = Object.create会出错. 但是 currentInstance.provides=currentInstance.provides=Object.create则没有错.
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

function createElement(vnodeType) {
    return document.createElement(vnodeType);
}
function patchProps(el, key, value) {
    const isOn = (key) => { return /^on[A-Z]/.test(key); }; //注: 大部分JS的内容都可以表示为string. 因此需要巧妙使用正则表达式和slice等. 
    if (isOn(key)) {
        const event = key.slice(2).toLowerCase();
        el.addEventListener(event, value);
    }
    else {
        el.setAttribute(key, value);
    }
}
function insert(el, container) {
    container.appendChild(el);
}
const renderer = createRenderer({
    createElement, patchProps, insert
});
function createApp(...args) {
    return renderer.createApp(...args);
}

export { createApp, createRenderer, createTextVNode, getCurrentInstance, h, inject, provide, proxyRefs, ref, renderSlots };
