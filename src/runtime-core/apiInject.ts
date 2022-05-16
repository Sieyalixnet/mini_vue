import { getCurrentInstance } from "./component";

export function provide(key, value) {
    const currentInstance: any = getCurrentInstance()

    if (currentInstance) {
        const parentInstance = currentInstance.parent
        let parentProvides = parentInstance.provides
        let { provides } = currentInstance

        if (provides === parentProvides) {
            provides = currentInstance.provides = Object.create(parentProvides)
            //注,这种写法就是在继承原型链,详见mdn Object.create. 右侧表达式表示用当前的实例的provides的原型指向父实例的provides. 然后再对provides进行赋值.
            //注, 似乎在这种原型链继承问题的赋值 解构得到的值, 不完全等于 变量.值. 所以provides = provides = Object.create会出错. 但是 currentInstance.provides=currentInstance.provides=Object.create则没有错.
        }
        provides[key] = value
    }

}

export function inject(key, defaultValue) {
    const currentInstance: any = getCurrentInstance()
    if (currentInstance) {
        const { provides } = currentInstance.parent
        if (key in provides) {
            return provides[key]
        }
        else {
            if (typeof defaultValue === "function") {
                return defaultValue()
            }
            return defaultValue
        }
    }

}