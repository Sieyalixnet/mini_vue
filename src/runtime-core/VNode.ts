import { ShapeFlags } from "../shared/ShapeFlags"
export const Fragment = Symbol("Fragment")
export const Text = Symbol("Text")

export {createVNode as createElementVNode}

export function createVNode(type, props?, children?) {
    const vnode = {
        type,
        props,
        component:null,
        key:props && props.key,//注: 是有props才去获取key,没有就不理.
        children,
        shapeFlag: getShapeFlag(type),
        el: null
    }
    if (typeof vnode.children === "string") { vnode.shapeFlag |= ShapeFlags.TEXT_CHILDREN }
    else if (Array.isArray(children)) { vnode.shapeFlag |= ShapeFlags.ARRAY_CHILDREN }

    if (vnode.shapeFlag & ShapeFlags.STATEFUL_COMPONENT){
        if(typeof children =="object"){
            vnode.shapeFlag|=ShapeFlags.SLOT_CHILDREN

        }

    }

    return vnode
}


export function createTextVNode(text:string){
    return createVNode(Text,{},text)
}

function getShapeFlag(type: any) {
    return typeof type === "string" ? ShapeFlags.ELEMENT : ShapeFlags.STATEFUL_COMPONENT
}

