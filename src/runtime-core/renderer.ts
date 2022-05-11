import { ShapeFlags } from "../shared/ShapeFlags";
import { createComponentInstance, setupComponent } from "./component"

export function render(vnode, container) {
    patch(vnode, container)
}

function patch(vnode: any, container: any) {
    //WRONG IN 20220510 vnode.type，如果是虚拟节点就是Object，如果是Element，则其typeof是string，而其值就是需要创建的元素，比如div、p等。
    if (vnode.shapeFlag & ShapeFlags.ELEMENT) {
        processElement(vnode, container)
    } else if (vnode.shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
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
    if (vnode.shapeFlag & ShapeFlags.TEXT_CHILDREN) {
        el.textContent = children
    } else if (vnode.shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        mountChildren(vnode,el)
    }
    const { props } = vnode;
    const isOn = (key:string) => {return /^on[A-Z]/.test(key)}//注: 大部分JS的内容都可以表示为string. 因此需要巧妙使用正则表达式和slice等. 
    for (let key in props) {
        let value = props[key]
        if(isOn(key)){
            const event = key.slice(2).toLowerCase()
            el.addEventListener(event,value)
        }else{
        el.setAttribute(key, value)}
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

