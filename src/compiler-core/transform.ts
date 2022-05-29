import { NodeTypes } from "./ast"
import { TO_DISPLAY_STRING } from "./runtimeHelpers"


export function transform(root, options={}) {
    const context = createTransformContext(root, options)
    traverseNode(root, context)
    createRootCodegen(root)
    root.helpers = [...context.helpers.keys()]

}
function createRootCodegen(root){
    root.codegenNode =root.children[0]

}

function createTransformContext(root: any, options: any) {
    return {
        root,
        nodeTransfroms: options.nodeTransfroms || [],
        helpers:new Map(),
        helper(key){
            this.helpers.set(key,1)
        }
    }

}

function traverseNode(node, context) {
    let children = node.children
    const { nodeTransfroms } = context
    for (let i = 0; i < nodeTransfroms.length; i++) {
        nodeTransfroms[i](node)
    }
    switch (node.type) {
        case NodeTypes.INTERPOLATION:
            context.helper(TO_DISPLAY_STRING)
            break;
        case NodeTypes.ROOT:
        case NodeTypes.ELEMENT:
            traverseChildren(children, context)
        default:
            break;
    }
    

}

function traverseChildren(children, context) {
//事实上它只是遍历一下, 找到符合的点就会改. 没符合就遍历过一下而已
        for (let i = 0; i < children.length; i++) {
            const node = children[i]
            traverseNode(node, context)
        }
}