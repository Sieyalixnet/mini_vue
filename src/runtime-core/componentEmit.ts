import { camelizer, toHandlerKey } from "../shared/index"

export function emit(instance, event, ...arg) {
    // console.log('event',event)
    const { props } = instance

    //注: 开发流程中有TPP流程, 可以先把一个内容写死. 运行没问题之后, 再不断的泛化和重构.

    const handlerName = toHandlerKey(camelizer(event))
    const handler = props[handlerName]
    handler && handler(...arg)

}