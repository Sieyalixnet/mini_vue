import {createRenderer} from '../../lib/guide-mini-vue.esm.js'
import {App} from './App.js'
console.log(PIXI)

const game = new PIXI.Application({
    width:600,
    height:600
})

document.body.append(game.view)

function createElement(vnodeType) {
    if(vnodeType==="rect"){
        const rect = new PIXI.Graphics();
        rect.beginFill(0xff0000);
        rect.drawRect(0,0,100,100)
        rect.endFill()
        return rect
    }
}

function patchProps(el,key, value) {
    el[key]=value
}
function insert(el, container) {
    container.addChild(el)
}

const renderer = createRenderer({
    createElement,patchProps,insert
})

renderer.createApp(App).mount(game.stage)