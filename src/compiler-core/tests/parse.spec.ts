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
        it("simple Element DIV", () => {
            let ast = baseParse("<div></div>")
            expect(ast.children[0]).toStrictEqual({
                type: NodeTypes.ELEMENT,
                tag: "div",
                children: []
            })
        })

    })

    describe("text", () => {
        it("simple text", () => {
            let ast = baseParse("some text")
            expect(ast.children[0]).toStrictEqual({
                type: NodeTypes.TEXT,
                content: "some text",
            })


        })


    })

    test("hello world", () => {
        let ast = baseParse("<div>hi,{{message}}, hi</div>")
        expect(ast.children[0]).toStrictEqual({
            type: NodeTypes.ELEMENT,
            tag: "div",
            children: [{
                type: NodeTypes.TEXT,
                content: "hi,",
            }, {
                type: NodeTypes.INTERPOLATION,
                content: {
                    type: NodeTypes.SIMPLE_EXPRESSION,
                    content: "message"
                }
            }
                , {
                type: NodeTypes.TEXT,
                content: ", hi",
            }
            ]
        })
    })

    test("nested Element", () => {
        let ast = baseParse("<div><p>hello</p>hi,{{message}}, hi</div>")
        expect(ast.children[0]).toStrictEqual({
            type: NodeTypes.ELEMENT,
            tag: "div",
            children: [
                {
                    type: NodeTypes.ELEMENT,
                    tag: "p",
                    children: [{
                        type: NodeTypes.TEXT,
                        content: "hello",
                    }]
                },
                {
                    type: NodeTypes.TEXT,
                    content: "hi,",
                }, {
                    type: NodeTypes.INTERPOLATION,
                    content: {
                        type: NodeTypes.SIMPLE_EXPRESSION,
                        content: "message"
                    }
                }
                , {
                    type: NodeTypes.TEXT,
                    content: ", hi",
                }
            ]
        })
    })

    test("shold throw error when it lacks of end tag",()=>{
        expect(()=>{
            baseParse("<div><span></div>")
        }).toThrow("span lacks of end tag")
        
    })
})