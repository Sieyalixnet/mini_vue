const PublicPropertiesMap = {
    $el: (i)=>i.vnode.el,
    $slots: (i)=>i.slots,//WRONG IN 20220513, 老是吧instance和vnode上的属性搞混淆, 一定要注意!!, 挂在Component上的是instance上的,挂在vnode上的才需要访问实例的虚拟节点.

}

export const PublicInstanceProxyHandlers = {
    get({_:instance},key){
      const {setupState,props} = instance

      const hasOwn = (value,key) =>Object.prototype.hasOwnProperty.call(value,key)//WRONG IN 20220512 原型,还要call~!!!还写反了!

      if(hasOwn(setupState,key)){
        return setupState[key]
      } else if(hasOwn(props,key)) {return props[key]}
      const publicGetter = PublicPropertiesMap[key]
      if(publicGetter){return publicGetter(instance)}
    }

}