import {ref} from '../../lib/guide-mini-vue.esm.js'
export const App = {
    name: "App",
    template: "<div>hi, {{a}}</div>",
    setup() {
        let a =window.a = ref(1)
        return {

            a

        }

    }
}