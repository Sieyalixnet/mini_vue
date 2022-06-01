import { NodeTypes } from "../ast"



export function transformExpression(node){//实际就是把content里的content拿出来, 然后在前面加一层ctx就完成了. 
    if(node.type===NodeTypes.INTERPOLATION){
    node.content=processExpression(node.content)
}
}

function processExpression(node){
    node.content =  `_ctx.${node.content}`
    return node

}