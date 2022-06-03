import { generate } from "../codegen"
import { baseParse } from "../parse"
import { transformElement } from "../plugins/transformElement"
import { transformExpression } from "../plugins/transformExpression"
import { transformText } from "../plugins/transformText"
import { transform } from "../transform"

describe("code generator", () => {

    test("string", () => {
        const ast = baseParse('hi')
        transform(ast)
        const {code} = generate(ast)
        
        expect(code).toMatchSnapshot()


    })

    test("interpolation", () => {
        const ast = baseParse('{{message}}')
        transform(ast,{nodeTransfroms:[transformExpression]})
        const {code} = generate(ast)
        
        expect(code).toMatchSnapshot()


    })

    test("element", () => {
        const ast = baseParse('<div></div>')
        transform(ast,{nodeTransfroms:[transformElement]})
        const {code} = generate(ast)
        expect(code).toMatchSnapshot()
    })

    test("compound Element", () => {
        const ast = baseParse('<div>hi, {{message}}</div>')
        transform(ast,{nodeTransfroms:[transformExpression,transformElement,transformText]})
        console.log(ast)
        const {code} = generate(ast)
        expect(code).toMatchSnapshot()
    })
})