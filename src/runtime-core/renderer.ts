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

function mountComponent(vnode: any, container: any) {
    const instance = createComponentInstance(vnode)
    setupComponent(instance)
    setupRenderEffect(instance, container)
}


function setupRenderEffect(instance: any, container: any) {
    const subTree = instance.render()
    //vnode-> patch
    //vnode -> element -> mountElement
    patch(subTree, container)
}

