import { createVNode } from "../VNode";

export function renderSlots(slots, name, props) {
    const slot = slots[name]
    if (slot) {
        if (typeof slot === "function") {
            return createVNode("div", {}, slot(props))
            //slots是在App.js中定义的,然后已经保存到instance.slots里面了.然后通过name拿出来,在传入props,即可完成.

            //根据({age})=>h("p", {}, "header"+age)和renderSlots(this.$slots,"header",{age})进行相应的变化.
            //这里slot已经变为了一个function,也就是h("p", {}, "header"+age) , props是{age}
            //然后所以把age解构出来代入到function中即可.
        }
    }
}