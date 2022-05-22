import { NodeTypes } from "../ast"
import { baseParse } from "../parse"

describe("Parse", () => {
    describe("Interpolation", () => {
        test("Simple Interpolation", () => {
            let ast = baseParse("{{ message }}")
            expect(ast.children[0]).toStrictEqual({
                type: NodeTypes.INTERPOLATION,
                content: {
                    type: NodeTypes.SIMPLE_EXPRESSION,
                    content: "message"
                }
            })
        })

    })
    describe("element", () => {
        test("simple Element DIV", () => {
            let ast = baseParse("<div></div>")
            expect(ast.children[0]).toStrictEqual({
                type: NodeTypes.ELEMENT,
                tag: "div",
            })
        })

    })


})