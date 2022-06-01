import { NodeTypes } from "./ast"
import { TO_DISPLAY_STRING } from "./runtimeHelpers"


export function transform(root, options={}) {
    const context = createTransformContext(root, options)
    traverseNode(root, context)
    createRootCodegen(root)
    root.helpers = [...context.helpers.keys()]

}
function createRootCodegen(root){

    let child = root.children[0]

    if(child.type===NodeTypes.ELEMENT){
        root.codegenNode=child.codegenNode//WRONG IN  20220602 . 本身在子节点的codegenNode上的,  要提到root上
    }//注: 为什么要提到Element的根节点上呢? 因为在解析的时候, 用的是codegenNode, 是个入口, 而不是children. 而子节点的codegen是根据该子节点生成的, 它必须提到根节点上,才会继续往下解析. 
    else{
    root.codegenNode =root.children[0]}

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
    const exitFuntions:any[] = []
    for (let i = 0; i < nodeTransfroms.length; i++) {
        let exitFunction= nodeTransfroms[i](node,context)
        if (exitFunction) {exitFuntions.push(exitFunction)}

    }
    switch (node.type) {
        case NodeTypes.INTERPOLATION:
            context.helper(TO_DISPLAY_STRING)
            break;
        case NodeTypes.ROOT:
        case NodeTypes.ELEMENT:
            traverseChildren(children, context)//注: 在教程中， 插值的helper是从transform里面加的， 而Element的helper是在transform的插件中加的.
        default:
            break;
    }
    let i = exitFuntions.length
    while(i--){
        exitFuntions[i]()
    }
    

}

function traverseChildren(children, context) {
//事实上它只是遍历一下, 找到符合的点就会改. 没符合就遍历过一下而已
        for (let i = 0; i < children.length; i++) {
            const node = children[i]
            traverseNode(node, context)
        }
}