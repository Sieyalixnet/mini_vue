const PublicPropertiesMap = {
    $el: (i)=>i.vnode.el

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