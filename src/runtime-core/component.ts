import { shallowReadonly } from "../reactivity/reactive"
import { emit } from "./componentEmit"
import { initProps } from "./componentProps"
import { PublicInstanceProxyHandlers } from "./componentPublicInstance"
import { initSlots } from "./componentSlots"

export function createComponentInstance(vnode){
    
    const component = {
        vnode,
        type:vnode.type,
        setupState:{},//这个setupstate本来是后来赋值的,因为proxy的需要,就先给它建立一个,以免导致get时其错误.
        props:{},
        slots:{},
        emit:()=>{}
    }

    component.emit = emit.bind(null,component) as any//注,这样写的话是可以指定第一个参数. 参考mozilla
    //https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Function/bind
    return component

}


export function setupComponent(instance){
    initProps(instance,instance.vnode.props)//注:第一次是挂在vnode上的,在init之后才挂在实例上
    initSlots(instance,instance.vnode.children)
    setupStatefulComponent(instance)

}

function setupStatefulComponent(instance){
    const Component = instance.type
    
    instance.proxy = new Proxy({_:instance},PublicInstanceProxyHandlers)
    const {setup} = Component
    if(setup){
        const setupResult = setup(shallowReadonly(instance.props),{emit:instance.emit})
        handleSetupResult(instance,setupResult)
    }

}

function handleSetupResult(instance: any, setupResult: any) {
    if(typeof setupResult ==="object"){
        instance.setupState=setupResult//如果只是一个obj，他就给实例加上去
        
    }
    finishSetup(instance)//注:致命错误, 放在if里面的话, 子组件没办法继续解析, 所以子组件会变成undefined
}
function finishSetup(instance: any) {
    const Component = instance.type
    // if(Component.render){
        instance.render = Component.render
    // }//这几步似乎都是在把vnode里面的属性拿到这个实例上。
}

//现在的instance，也就是这个Component大概是:
//{vnode,type,setupState=rootComponent.setup(),render=rootComponent.render()}
//以后肯定还会在各层增加相应的情况，特别是在这个setupCompnent和后续的几个调用中