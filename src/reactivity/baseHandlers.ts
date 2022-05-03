import { track, trigger } from "./effect"

const get =createGetter()
const set =createSetter()
const readonlyGet = createGetter(true)

function createGetter(isReadonly=false) {
    return function get(target, key) {
        let res = Reflect.get(target, key)
        if (!isReadonly) {
            track(target, key)
        }
        return res;
    }
}

function createSetter(){
    return function set(target, key, value) {
        let res = Reflect.set(target, key, value)
        trigger(target, key)
        return res
    }

}

export const mutableHandlers = {
    get,
    set}

export const readonlyHandlers ={
    get:readonlyGet,
    set(target, key:string, value) {
        console.warn(`READONLY: ${key} can not be set.`)
        return true
    }
}
