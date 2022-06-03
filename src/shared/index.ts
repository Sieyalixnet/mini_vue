export  * from "./toDisplayString";

export const extend = Object.assign;

export const isObject = (value) => {
    return value !== null && typeof value === "object";

}

export const isString = (value) =>{
    return (typeof value === "string")
}

export const EMPTY_OBJECT = {};

export const hasChanged = (oldValue, newValue) => {
    return !Object.is(oldValue, newValue)

}

export const capitalizer = (str: string) => {
    return str.slice(0, 1).toUpperCase() + str.slice(1);
}
export const camelizer = (str: string) => {
    return str.replace(/-(\w)/g, (_, c) => {
        return c.toUpperCase()
    })

    //replace的正则表达式用法https://www.w3cschool.cn/regexp/qyh61pqc.html

}
export const toHandlerKey = (str: string) => {
    return str ? "on" + capitalizer(str) : "";
}