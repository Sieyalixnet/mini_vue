import { isTracking, trackEffect, triggerEffect } from "./effect";
import { reactive } from "./reactive";
import { hasChanged, isObject } from "./shared";

class Refimpl{
    private _rawValue:any;
    private _value: any;
    public __v_isRef=true;
    public dep;

    constructor(value){
        this._rawValue=value
        this._value= convert(value);
        this.dep=new Set();
    }
    get value(){//注:这个value就是外部访问的变量.value.
        if(isTracking()){
            trackEffect(this.dep)
        }
        return this._value
    }
    set value(newValue){
        if(hasChanged(newValue,this._rawValue)){
            this._rawValue=newValue//WRONG IN 220506,逻辑没搞懂.set就是改值之后触发依赖而已.初始化怎么作这里就应该怎么做.
            this._value=convert(newValue);//WRONG IN 220506要先改值再触发依赖!
        triggerEffect(this.dep)
        }
    }
}

function convert(value){
    return isObject(value)?reactive(value):value;

}

export function ref(value){
    return new Refimpl(value)

}

export function isRef(ref){
    return !!ref.__v_isRef
}

export function unRef(ref){
    return isRef(ref)?ref._rawValue:ref;

}

export function proxyRefs(objectWithRef){
    return new Proxy(objectWithRef,{
        get(target,key){
            return unRef(Reflect.get(target,key))//通过unRef之后,这个值就已经是拿到了ref.value了,而对不是ref的值又不影响
        },
        set(target,key,value){
            if(isRef(target[key])&& !isRef(value)){//这种情况下,只要把ref[key]的value改为新值即可.//WRONG IN 20220506 还没完全理解这个set
                return (target[key].value=value)//只有这种情况,ref[key]要修改的值和新的value不是同级的,因此要特殊拿出来.
            } else {
                return Reflect.set(target,key,value)
                //若ref[key]和value都是ref,那么他们都需要把[key].value修改(也就是同级的),因此也可以直接用set
                //若ref[key]不是ref,那么本身就是普通的变量,因此可以直接用.
                //若ref[key]不是ref,value是ref,那么就把新的ref赋予它即可.单测中有这种情况.
            }
        }

    })

}