
import { generate } from "./codegen"
import { baseParse } from "./parse"
import { transformElement } from "./plugins/transformElement"
import { transformExpression } from "./plugins/transformExpression"
import { transformText } from "./plugins/transformText"
import { transform } from "./transform"

export function compile(template){
    const ast = baseParse(template)
    transform(ast,{nodeTransfroms:[transformExpression,transformElement,transformText]})
    return generate(ast)
}

