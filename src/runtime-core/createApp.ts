import { render } from "./renderer"
import { createVNode } from "./VNode"

export function createApp(rootComponent){
    return {
        mount(rootContainer){
            
            const VNode = createVNode(rootComponent)

            render(VNode,rootContainer)
        }

    }

}

