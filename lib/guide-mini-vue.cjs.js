'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

const isObject = (value) => {
    return value !== null && typeof value === "object";
};

function createComponentInstance(vnode) {
    const component = { vnode, type: vnode.type };
    return component;
}
function setupComponent(instance) {
    //TODO initProps, initSlots
    setupStatefulComponent(instance);
}
function setupStatefulComponent(instance) {
    const Component = instance.type;
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
    setupRenderEffect(instance, container);
}
function setupRenderEffect(instance, container) {
    const subTree = instance.render();
    //vnode-> patch
    //vnode -> element -> mountElement
    patch(subTree, container);
}

function createVNode(type, props, children) {
    return {
        type,
        props,
        children
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
