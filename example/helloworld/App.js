import {h} from "../../lib/guide-mini-vue.esm.js"

window.self=null
export const App = {
    render() {
        window.self=this
        return h("div",{id:"root",class:["red","hard"],onClick(){console.log("click")}},"hello mini-vue"+this.msg)// + this.msg
        //[h("p",{class}:"red","hi"),h("p",{class:"blue"},"mini-vue")]
        // "hello mini-vue"

    },

    setup() {
        return {
            msg: "mini-vue"

        }
    }

}