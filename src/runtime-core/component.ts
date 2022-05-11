import { PublicInstanceProxyHandlers } from "./componentPublicInstance"

export function createComponentInstance(vnode){
    
    const component = {
        vnode,
        type:vnode.type,
        setupState:{},//这个setupstate本来是后来赋值的,因为proxy的需要,就先给它建立一个,以免导致get时其错误.
        el:null
    }
    return component

}


export function setupComponent(instance){
    //TODO initProps, initSlots
    setupStatefulComponent(instance)

}

function setupStatefulComponent(instance){
    const Component = instance.type
    
    instance.proxy = new Proxy({_:instance},PublicInstanceProxyHandlers)
    const {setup} = Component
    if(setup){
        const setupResult = setup()
        handleSetupResult(instance,setupResult)
    }

}

function handleSetupResult(instance: any, setupResult: any) {
    if(typeof setupResult ==="object"){
        instance.setupState=setupResult//如果只是一个obj，他就给实例加上去
        finishSetup(instance)
    }
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