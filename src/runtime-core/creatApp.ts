import { render } from "./renderer"
import { createVNode } from "./VNode"

export function creatApp(rootComponent){
    return {
        mount(rootContainer){
            
            const VNode = createVNode(rootComponent)

            render(VNode,rootContainer)
        }

    }

}

