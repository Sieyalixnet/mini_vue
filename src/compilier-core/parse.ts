import { NodeTypes } from "./ast"

const enum TagTypes {
    START,
    END
}

export function baseParse(content) {

    let context = createParsercontext(content)
    return createRoot(parseChildren(context))

}

function parseChildren(context) {

    let nodes: any = []
    let node
    if (context.source.startsWith("{{")) {
        node = parseInterpolation(context)
    } else if (context.source.startsWith("<")) {
        if (/[a-z]/i.test(context.source[1])) {
            node = parseElement(context)
        }

    }
    nodes.push(node)

    return nodes;

}

function parseElement(context) {
    const element = parseTag(context, TagTypes.START)
    parseTag(context, TagTypes.END)
    return element
}

function parseTag(context, TagTypes) {

    const reg = /^<\/?([a-z]*)/i
    const matchResult: any = reg.exec(context.source)
    let tag = matchResult[1]
    advanceBy(context, matchResult[0].length)
    advanceBy(context, 1)
    if (TagTypes = TagTypes.END) { return; }
    return {
        type: NodeTypes.ELEMENT,
        tag
    }


}

function parseInterpolation(context) {

    const openDelemiter = "{{"
    const closeDelemiter = "}}"

    let closeIndex = context.source.indexOf(closeDelemiter, closeDelemiter.length)//找-找到闭合的index
    advanceBy(context, openDelemiter.length)//推-掉本次处理的前置符号
    let rawContent = context.source.slice(0, closeIndex - closeDelemiter.length)//拿-拿到所需要的部分
    let content = rawContent.trim()
    advanceBy(context, closeIndex + closeDelemiter.length)//推-推至本次处理的后置部分
    return {
        type: NodeTypes.INTERPOLATION,
        content: {
            type: NodeTypes.SIMPLE_EXPRESSION,
            content: content
        }

    }

}

function advanceBy(context, advanceIndexStep) {
    context.source = context.source.slice(advanceIndexStep)
}

function createRoot(children) {

    return { children }

}


function createParsercontext(content) {

    return { source: content }

}