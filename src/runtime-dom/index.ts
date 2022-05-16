import { createRenderer } from "../runtime-core/renderer"

function createElement(vnodeType) {
    return document.createElement(vnodeType)
}

function patchProps(el,key, value) {
    const isOn = (key: string) => { return /^on[A-Z]/.test(key) }//注: 大部分JS的内容都可以表示为string. 因此需要巧妙使用正则表达式和slice等. 
    if (isOn(key)) {
        const event = key.slice(2).toLowerCase()
        el.addEventListener(event, value)
    } else {
        el.setAttribute(key, value)
    }

}
function insert(el, container) {
    container.appendChild(el)
}

const renderer:any = createRenderer({
    createElement, patchProps, insert

})


export function createApp(...args){
    return renderer.createApp(...args)
}

export * from "../runtime-core"//越通用的越在下层, 由于这个比较专一, 所以应该放到上层. 而把runtime-core放到下层