import { NodeTypes } from "./ast"
import { helperMapName, TO_DISPLAY_STRING} from "./runtimeHelpers"
export function generate(ast) {
    let context = createCodeContext()
    const { push } = context

    if(ast.helpers.length>0){
    genFunctionPreamble(ast, context)}

    push('return ')
    const functionName = "render"
    let args = ["_ctx", "_cache"]
    let signature = args.join(', ')

    push(`function ${functionName}(${signature}){`)
    genNode(ast.codegenNode, context)
    push('}')
    return { code: context.code }

}

function genFunctionPreamble(ast, context) {
    const { push } = context
    const VueBeinging = "Vue"
    const helpersAlias = (s) => { return `${helperMapName[s]}: _${helperMapName[s]}` }
    const helpers = ast.helpers.map(helpersAlias).join(", ")
    push(`const {${helpers}} = Vue`)
    push("\n")

}

function createCodeContext() {
    const context = {
        code: "",
        push(content) { context.code += content }

    }

    return context
}

function genNode(node, context) {
    switch (node.type) {
        case NodeTypes.TEXT:
            genText(node, context)
            break;
        case NodeTypes.INTERPOLATION:
            genInterpolation(node, context)       
            break;
        case NodeTypes.SIMPLE_EXPRESSION:
            genExpression(node, context)
            break;   
        default:
            break;
    }


}

function genText(node, context){
    const { push } = context
    push(`return '${node.content}'`)  

}

function genInterpolation(node, context){
    const { push } = context
    push(`return _${helperMapName[TO_DISPLAY_STRING]}(`)
    genNode(node.content,context)
    push(`)`)  

}

function genExpression(node, context){
    const { push } = context
    push(`${node.content}`)  

}