import { mutableHandlers, readonlyHandlers } from "./baseHandlers"


export const enum ReactiveFlags{
    IS_REACTIVE="__v_is_Reactive",
    IS_READONLY="__v_is_Readonly"
}

function createActiveObject(raw,baseHandlers){
    return new Proxy(raw, baseHandlers)

}

export function isReactive(value){
    return !!value[ReactiveFlags.IS_REACTIVE]//WRONG IN 20220505 因为传入的是个Proxy了,所以只要触发其get即可,而出发其get可以直接给它key值加上属性.
}

export function isReadonly(value){
    return !!value[ReactiveFlags.IS_READONLY]
}

export function reactive(raw) {
    return createActiveObject(raw, mutableHandlers)

}

export function readonly(raw) {
    return createActiveObject(raw, readonlyHandlers)
}