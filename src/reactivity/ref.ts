import { isTracking, trackEffect, triggerEffect } from "./effect";
import { reactive } from "./reactive";
import { hasChanged, isObject } from "./shared";

class Refimpl{
    private _rawValue:any;
    private _value: any;
    public dep;

    constructor(value){
        this._rawValue=value
        this._value= convert(value);
        this.dep=new Set();
    }
    get value(){
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