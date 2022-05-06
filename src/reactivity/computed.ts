import { reactiveEffect } from "./effect";

class computedRefImpl{
    private _getter;
    private _value;
    private _dirty:boolean=true;
    private _effect;

    constructor(getter){
        this._getter=getter;//WRONG IN 20220506 不过这里并不重要,在computed最初实现时,这个_getter是根本没用的.
        this._effect = new reactiveEffect(getter,()=>{if(!this._dirty){this._dirty=true}})
        //_effect实际之用到了run和scheduler,和该类不会去收集依赖.
        //收集依赖是和传进来的getter有关的,getter才是正经的reactive.

    }

    get value(){
        if(this._dirty){//巧妙的地方就是用到了scheduler和_dirty的锁.
            //传进来的getter中是对reactive的依赖,可以保证每次reactive更新时,都会后续通过get触发scheduler,以给该变量解锁,并调用和返回.
            this._dirty=false;
            this._value = this._effect.run()}
        return this._value
    }
}



export function computed(getter){
    return new computedRefImpl(getter)
}