

export function transform(ast, options) {
    const context = createTransformContext(ast, options)
    traverseNode(ast, context)
}

function createTransformContext(root: any, options: any) {
    return {
        root,
        nodeTransfroms: options.nodeTransfroms || []
    }

}

function traverseNode(node, context) {
    let children = node.children
    const { nodeTransfroms } = context
    for (let i = 0; i < nodeTransfroms.length; i++) {
        nodeTransfroms[i](node)
    }
    traverseChildren(children, context)

}

function traverseChildren(children, context) {

    if (children) {//事实上它只是遍历一下, 找到符合的点就会改. 没符合就遍历过一下而已
        for (let i = 0; i < children.length; i++) {
            const node = children[i]
            traverseNode(node, context)
        }
    }
}