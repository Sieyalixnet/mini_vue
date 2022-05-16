import { createVNode } from "./VNode"

export function createAppAPI(render) {

    return function createApp(rootComponent) {
        return {
            mount(rootContainer) {

                const VNode = createVNode(rootComponent)
                render(VNode, rootContainer, undefined)//注:??
            }

        }

    }

}