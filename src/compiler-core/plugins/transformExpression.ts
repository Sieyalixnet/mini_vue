import { NodeTypes } from "../ast"



export function transformInterpolation(node){
    if(node.type===NodeTypes.INTERPOLATION){
    node.content=processInterpolation(node.content)
}
}

function processInterpolation(node){
    node.content =  `_ctx.${node.content}`
    return node

}