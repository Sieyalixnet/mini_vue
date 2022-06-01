import { createVNodeCall, NodeTypes } from "../ast"

export function transformElement(node,context){//实际就是把content里的content拿出来, 然后在前面加一层ctx就完成了. 
    if(node.type===NodeTypes.ELEMENT){


        return ()=>{
            
        const VNodeTag = `'${node.tag}'`


        const VNodeProps = node.props
        
        const children = node.children
        const VNodeChildren = children[0]

        const VNodeElement= createVNodeCall(context, VNodeTag,VNodeProps,VNodeChildren)
        node.codegenNode= VNodeElement}
}
}
