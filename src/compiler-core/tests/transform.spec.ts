import { baseParse } from "../parse"
import { transform } from "../transform"
import { NodeTypes } from "../ast"

describe("transform", () => {

    test("happy path", () => {
        let ast = baseParse("<div>hi, {{message}}</div>")

        function transText(node) {
            console.log(node)
            if (node.type === NodeTypes.TEXT) { node.content += "mini-vue" }
        }

        let plugin = [transText]
        let options = { nodeTransfroms: plugin }
        transform(ast, options)
        let nodeText = ast.children[0].children[0]
        expect(nodeText.content).toBe('hi, mini-vue')


    })


})