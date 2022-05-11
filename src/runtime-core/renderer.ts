import { isObject } from "../shared/index";
import { createComponentInstance, setupComponent } from "./component"

export function render(vnode, container) {
    patch(vnode, container)
}

function patch(vnode: any, container: any) {
    //TODO 判断是不是element,如果是element的话就处理element
    debugger;
    //WRONG IN 20220510 vnode.type，如果是虚拟节点就是Object，如果是Element，则其typeof是string，而其值就是需要创建的元素，比如div、p等。
    if (typeof vnode.type == "string") {
        processElement(vnode, container)
    } else if (isObject(vnode.type)) {
        processComponent(vnode, container)
    }
}

function processElement(vnode: any, container: any) {
    mountElement(vnode, container);

}

function mountElement(vnode: any, container: any) {
    
    const el = document.createElement(vnode.type);
    vnode.el = el;
    const { children } = vnode;
    if (typeof children === "string") {
        el.textContent = children
    } else if (Array.isArray(children)) {
        mountChildren(vnode,el)
    }
    const { props } = vnode;
    for (let key in props) {
        let value = props[key]
        el.setAttribute(key, value)
    }
    container.appendChild(el)

}

function mountChildren(vnode,container){
    vnode.children.forEach(element => {
        patch(element, container)
    });
}


function processComponent(vnode: any, container: any) {
    //TODO 到时还需要有更新组件的功能
    mountComponent(vnode, container)
}

function mountComponent(initialVNode: any, container: any) {
    const instance = createComponentInstance(initialVNode)
    setupComponent(instance)
    setupRenderEffect(instance, initialVNode,container)
}


function setupRenderEffect(instance: any, initialVNode:any ,container: any) {
    const {proxy} = instance;
    const subTree = instance.render.call(proxy)//由于这里指向了proxy,而render中的this.xx都会通过proxy拿到.而proxy虽然是个{},但是由于它get中可以返回对应的值,所以也就能拿到相应的值了.
    
    //vnode-> patch
    //vnode -> element -> mountElement
    patch(subTree, container)
    initialVNode.el = subTree.el//这个subTree的el就是上面Element的el. 也就是从把Element的el不断向上传,这样在外部才能获取到$el.
}

