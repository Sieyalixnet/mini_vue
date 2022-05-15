import { h,createTextVNode } from "../../lib/guide-mini-vue.esm.js"
import { Foo } from "./Foo.js"

window.self = null
export const App = {
    name: "App",
    render() {
        const app = h("div", {}, "App")
        const foo =h(Foo, {}, {
            header:({age})=>[h("p", {}, "header"+age),createTextVNode("你好呀")],
        footer:()=>h("p", {}, "footer")})//[h("p", {}, "123"),h("p", {}, "456")]
        return h("div", {}, [app, foo])
    },

    setup() {
        return {

        }
    }

}