import { CREATE_ELEMENT_VNODE } from "./runtimeHelpers"

export const enum NodeTypes {
    SIMPLE_EXPRESSION,
    INTERPOLATION,
    ELEMENT,
    TEXT,
    ROOT,
    COMPOUND_EXPRESSION
}

export function createVNodeCall(context, tag,props,children){
    context.helper(CREATE_ELEMENT_VNODE)
   return {
        type:NodeTypes.ELEMENT,
        tag:tag,
        props:props,
        children:children
    }

}