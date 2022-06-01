import { isString } from "../shared"
import { NodeTypes } from "./ast"
import { CREATE_ELEMENT_VNODE, helperMapName, TO_DISPLAY_STRING } from "./runtimeHelpers"
export function generate(ast) {
    let context = createCodeContext()
    const { push } = context

    if (ast.helpers.length > 0) {
        genFunctionPreamble(ast, context)
    }

    push('return ')
    const functionName = "render"
    let args = ["_ctx", "_cache"]
    let signature = args.join(', ')

    push(`function ${functionName}(${signature}){`)
    push('return ')
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
        push(content) { context.code += content },
        helper(h) { return helperMapName[h] }

    }

    return context
}

function genNode(node, context) {
    if (node) {
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
            case NodeTypes.ELEMENT:
                genElement(node, context)
                break;
            case NodeTypes.COMPOUND_EXPRESSION:
                genCompoundExpression(node, context);
                break;
            default:
                break;
        }
    }

}

function genCompoundExpression(node, context) {
    const { push } = context
    const { children } = node
    for (let i = 0; i < children.length; i++) {
        let child = children[i]
        if (isString(child)) {
            push(child)
        } else {
            genNode(child, context)
        }
    }
}

//Element下的children由于是类型5, 也就是混合类型, 它会直接

function genElement(node, context) {
    const { push, helper } = context
    const { tag, props, children } = node
    push(`_${helper(CREATE_ELEMENT_VNODE)}(`)
    genNodes(genNodeMap([tag, props, children]), context)
    // genNode(node.children,context)

    push(`)`)

}

function genNodeMap(args) {
    return args.map((s) => { return s ? s : "null" })
}

function genNodes(nodes, context) {
    const { push } = context
    for (let i = 0; i < nodes.length; i++) {
        if (isString(nodes[i])) { push(nodes[i]) 
        } else {
            genNode(nodes[i], context)
        }
        if(i<nodes.length-1){push(', ')}
    }

}

function genText(node, context) {
    const { push } = context
    push(`'${node.content}'`)

}

function genInterpolation(node, context) {
    const { push, helper } = context
    push(`_${helper(TO_DISPLAY_STRING)}(`)
    genNode(node.content, context)
    push(`)`)

}

function genExpression(node, context) {
    const { push } = context
    push(`${node.content}`)

}