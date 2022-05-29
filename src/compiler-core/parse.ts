import { NodeTypes } from "./ast"

const enum TagTypes {
    START,
    END
}

export function baseParse(content) {

    let context = createParsercontext(content)
    return createRoot(parseChildren(context, []))

}

function parseChildren(context, ancestors) {

    let nodes: any = []
    let node
    while (!isEnd(context, ancestors)) {
        node = undefined
        if (context.source.startsWith("{{")) {
            console.log("Interpo")
            node = parseInterpolation(context)
        } else if (context.source.startsWith("<")) {
            console.log("Element")
            if (/[a-z]/i.test(context.source[1])) {
                node = parseElement(context, ancestors)
            }
        }

        if (!node) {
            console.log("text")
            node = parseText(context)
        }
        nodes.push(node)
    }


    return nodes;

}

function isEnd(context, ancestors) {
    if (ancestors.length > 0) {
        for (let i = ancestors.length - 1; i >= 0; i--) {
            if (startsWithEndTag(context, ancestors[i].tag)) { return true }

        }
    }

    return !context.source //有值时为false; 当context.source为""时, 本身为false,加上!会变为true

}

function parseText(context) {
    let endIndex = context.source.length
    let endMarks = ["{{", "<"]
    //注: 不同点. 我这里用的是高阶函数. 也可以用回for方法
    let endMark = endMarks.map((s) => { return context.source.indexOf(s) }).sort((s1, s2) => { return s1 - s2 }).find((s) => { return s != -1 })
    //一定要把最近那个标号放前面来,然后再find
    if (endMark) {
        endIndex = endMark
    }

    const content = parseTextData(context, endIndex)
    return {
        type: NodeTypes.TEXT,
        content
    }

}

function parseTextData(context, length) {
    const content = context.source.slice(0, length)
    advanceBy(context, content.length)
    return content
}

function parseElement(context, ancestors) {
    const element: any = parseTag(context, TagTypes.START)
    ancestors.push(element)//WRONG IN 20220524 放错地方. 是在拿到tag之后马上就需要给ancestors加进去, 在parseTag之前就弹出.

    element.children = parseChildren(context, ancestors)
    ancestors.pop()
    if (startsWithEndTag(context, element.tag)) { parseTag(context, TagTypes.END) } else {
        throw (`${element.tag} lacks of end tag`)
    }

    return element
}

function startsWithEndTag(context, tag) {

    return context.source.startsWith("</") && context.source.slice(2, 2 + tag.length) === tag

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
    let rawContent = parseTextData(context, closeIndex - closeDelemiter.length)

    //拿-拿到所需要的部分
    let content = rawContent.trim()
    advanceBy(context, closeDelemiter.length)//推-推至本次处理的后置部分
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

    return { children,
    type:NodeTypes.ROOT
    }

}


function createParsercontext(content) {

    return { source: content }

}