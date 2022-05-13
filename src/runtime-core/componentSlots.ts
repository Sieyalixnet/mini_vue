import { ShapeFlags } from "../shared/ShapeFlags";

export function initSlots(instance, children) {
    const {vnode} = instance
    if(vnode.shapeFlag & ShapeFlags.SLOT_CHILDREN){
    normalizeObectSlots(children, instance.slots)}
}

function normalizeObectSlots(children: any, slots: any) {
    // instance.slots = Array.isArray(children)? children: [children];

    for (let key in children) {
        let value = children[key]
        slots[key] = (slots)=> normalizeSlotValue(value(slots))//代入之后运行才知道结果是否为array.
        //因为header:({age})=>h("p", {}, "header"+age) 所以这里也要做相应的变化.
    }

}

function normalizeSlotValue(value) {
    return Array.isArray(value) ? value : [value];

}
