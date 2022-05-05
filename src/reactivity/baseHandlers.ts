import { track, trigger } from "./effect"
import { ReactiveFlags } from "./reactive"
import { extend } from "./shared"

const get =createGetter()
const set =createSetter()
const readonlyGet = createGetter(true)
const shallowReadonlyGet = createGetter(true,true)

function createGetter(isReadonly=false,shallow=false) {
    return function get(target, key) {
        if(key===ReactiveFlags.IS_REACTIVE){
            return !isReadonly
        } else if(key===ReactiveFlags.IS_READONLY){
            return isReadonly
        }
        let res = Reflect.get(target, key)
        
        if(shallow===true){
            return res
        }

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

export const shallowReadonlyHandlers = extend({},readonlyHandlers,{get:shallowReadonlyGet})