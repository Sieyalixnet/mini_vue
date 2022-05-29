import { generate } from "../codegen"
import { baseParse } from "../parse"
import { transformInterpolation } from "../plugins/transformExpression"
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
        transform(ast,{nodeTransfroms:[transformInterpolation]})
        const {code} = generate(ast)
        
        expect(code).toMatchSnapshot()


    })
})