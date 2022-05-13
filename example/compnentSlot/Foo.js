import { h ,renderSlots} from "../../lib/guide-mini-vue.esm.js"
export const Foo = {

    setup() {
        return {};
    },
    render() {
        const cfoo = h("p",{},"cfoo")
        const age = 18;
        return h("div",{},[renderSlots(this.$slots,"header",{age}),cfoo,renderSlots(this.$slots,"footer")])
    }


}