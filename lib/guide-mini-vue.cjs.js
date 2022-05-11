'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

const isObject = (value) => {
    return value !== null && typeof value === "object";
};

const PublicPropertiesMap = {
    $el: (i) => i.vnode.el
};
const PublicInstanceProxyHandlers = {
    get({ _: instance }, key) {
        const { setupState } = instance;
        if (key in setupState) {
            return setupState[key];
        }
        const publicGetter = PublicPropertiesMap[key];
        if (publicGetter) {
            return publicGetter(instance);
        }
    }
};

function createComponentInstance(vnode) {
    const component = {
        vnode,
        type: vnode.type,
        setupState: {},
        el: null
    };
    return component;
}
function setupComponent(instance) {
    //TODO initProps, initSlots
    setupStatefulComponent(instance);
}
function setupStatefulComponent(instance) {
    const Component = instance.type;
    instance.proxy = new Proxy({ _: instance }, PublicInstanceProxyHandlers);
    const { setup } = Component;
    if (setup) {
        const setupResult = setup();
        handleSetupResult(instance, setupResult);
    }
}
function handleSetupResult(instance, setupResult) {
    if (typeof setupResult === "object") {
        instance.setupState = setupResult; //如果只是一个obj，他就给实例加上去
        finishSetup(instance);
    }
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

function render(vnode, container) {
    patch(vnode, container);
}
function patch(vnode, container) {
    //TODO 判断是不是element,如果是element的话就处理element
    debugger;
    //WRONG IN 20220510 vnode.type，如果是虚拟节点就是Object，如果是Element，则其typeof是string，而其值就是需要创建的元素，比如div、p等。
    if (typeof vnode.type == "string") {
        processElement(vnode, container);
    }
    else if (isObject(vnode.type)) {
        processComponent(vnode, container);
    }
}
function processElement(vnode, container) {
    mountElement(vnode, container);
}
function mountElement(vnode, container) {
    const el = document.createElement(vnode.type);
    vnode.el = el;
    const { children } = vnode;
    if (typeof children === "string") {
        el.textContent = children;
    }
    else if (Array.isArray(children)) {
        mountChildren(vnode, el);
    }
    const { props } = vnode;
    for (let key in props) {
        let value = props[key];
        el.setAttribute(key, value);
    }
    container.appendChild(el);
}
function mountChildren(vnode, container) {
    vnode.children.forEach(element => {
        patch(element, container);
    });
}
function processComponent(vnode, container) {
    //TODO 到时还需要有更新组件的功能
    mountComponent(vnode, container);
}
function mountComponent(vnode, container) {
    const instance = createComponentInstance(vnode);
    setupComponent(instance);
    setupRenderEffect(instance, vnode, container);
}
function setupRenderEffect(instance, vnode, container) {
    const { proxy } = instance;
    const subTree = instance.render.call(proxy); //由于这里指向了proxy,而render中的this.xx都会通过proxy拿到.而proxy虽然是个{},但是由于它get中可以返回对应的值,所以也就能拿到相应的值了.
    //vnode-> patch
    //vnode -> element -> mountElement
    patch(subTree, container);
    vnode.el = subTree.el;
}

function createVNode(type, props, children) {
    return {
        type,
        props,
        children,
    };
}

function createApp(rootComponent) {
    return {
        mount(rootContainer) {
            const VNode = createVNode(rootComponent);
            render(VNode, rootContainer);
        }
    };
}

function h(type, props, children) {
    return createVNode(type, props, children);
}

exports.createApp = createApp;
exports.h = h;
