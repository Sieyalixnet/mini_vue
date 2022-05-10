import { createComponentInstance, setupComponent } from "./component"

export function render(vnode, container){
    patch(vnode, container)
}

function patch(vnode: any, container: any) {
    //TODO 判断是不是element,如果是element的话就处理element
    // processElement()
    processComponent(vnode,container)
}



function processComponent(vnode: any,container:any) {
   mountComponent(vnode,container)
}

function mountComponent(vnode: any,container:any) {
    const instance = createComponentInstance(vnode)
    setupComponent(instance)
    setupRenderEffect(instance,container)
}


function setupRenderEffect(instance: any, container: any) {
    const subTree = instance.render()
    //vnode-> patch
    //vnode -> element -> mountElement
    patch(subTree,container)
}

