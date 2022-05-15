import { ShapeFlags } from "../shared/ShapeFlags";
import { createComponentInstance, setupComponent } from "./component"
import { Fragment,Text } from "./VNode";

export function render(vnode, container,parentComponent) {
    patch(vnode, container,parentComponent)
}

function patch(vnode: any, container: any,parentComponent) {
    //WRONG IN 20220510 vnode.type，如果是虚拟节点就是Object，如果是Element，则其typeof是string，而其值就是需要创建的元素，比如div、p等。
    const {type,shapeFlag} = vnode

    switch(type){
    case(Fragment):
        processFragment(vnode, container,parentComponent)
    break;
    case(Text):
        processTextVNode(vnode, container)
    break;
    default:
        if (shapeFlag & ShapeFlags.ELEMENT) {
            processElement(vnode, container,parentComponent)
        } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
            processComponent(vnode, container,parentComponent)
        }}

}

function processFragment(vnode: any, container: any,parentComponent) {
    //WRONG IN 20220515 const {children} = vnode, mountchildren已经是直接能渲染children了, 不用解出来
    mountChildren(vnode, container,parentComponent);
}

function processTextVNode(vnode: any, container: any) {
    const {children} = vnode
    const textNode = vnode.el =  document.createTextNode(children)
    container.append(textNode)

}

function processElement(vnode: any, container: any,parentComponent) {
    mountElement(vnode, container,parentComponent);

}

function mountElement(vnode: any, container: any,parentComponent) {
    
    const el = document.createElement(vnode.type);
    vnode.el = el;
    const { children } = vnode;
    if (vnode.shapeFlag & ShapeFlags.TEXT_CHILDREN) {
        el.textContent = children
    } else if (vnode.shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        mountChildren(vnode,el,parentComponent)
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

function mountChildren(vnode,container,parentComponent){
    vnode.children.forEach((element) => {
        patch(element, container,parentComponent)
    });
}


function processComponent(vnode: any, container: any,parentComponent) {
    //TODO 到时还需要有更新组件的功能
    mountComponent(vnode, container,parentComponent)
}

function mountComponent(initialVNode: any, container: any, parentComponent) {
    const instance = createComponentInstance(initialVNode,parentComponent)
    setupComponent(instance)
    setupRenderEffect(instance, initialVNode,container)
}


function setupRenderEffect(instance: any, initialVNode:any ,container: any) {
    const {proxy} = instance;
    const subTree = instance.render.call(proxy)//由于这里指向了proxy,而render中的this.xx都会通过proxy拿到.而proxy虽然是个{},但是由于它get中可以返回对应的值,所以也就能拿到相应的值了.
    console.log('Component',initialVNode, 'instance',instance)

    //vnode-> patch
    //vnode -> element -> mountElement
    patch(subTree, container,instance)
    initialVNode.el = subTree.el//这个subTree的el就是上面Element的el. 也就是从把Element的el不断向上传,这样在外部才能获取到$el.
}

