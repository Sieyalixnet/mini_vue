import { transform } from "./transform"


export function generate(ast) {
    let context = createCodeContext()
    const { push } = context
    push('return ')

    const functionName = "render"
    let args = ["_ctx", "_cache"]
    let signature = args.join(', ')

    push(`function ${functionName}(${signature}){`)
    genNode(ast.codegenNode,context)
    push('}')
    return {code:context.code}

}

function createCodeContext() {
    const context = {
        code: "",
        push(content) { context.code += content }

    }

    return context
}

function genNode(node, context){
    console.log(node)
    const {push} = context
    push(`return '${node.content}'`)
    return context

}