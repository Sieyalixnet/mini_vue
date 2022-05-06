import { extend } from "./shared";

let activeEffect;//临时的全局变量
let shouldTrack;
export class reactiveEffect {
    private _fn: any;
    public scheduler: Function | undefined;
    deps = [];//装着依赖set的Array
    effect: any;
    private active = true;
    onStop?: () => void;//WRONG IN 220503, 这是个TypeScript的Class属性写法,应当注意该写法.
    constructor(fn, scheduler?: Function) {//用public的话，在外部可以访问到这个变量。scheduler已经被track放进set里面了。
        this._fn = fn
        this.scheduler = scheduler
    }
    run() {
        activeEffect = this//一定要放上面。因为track是在run前和run后之间触发的(这是因为track在reactive.get的return之前)，如果放在后面，全局变量就会是undefine，然后track会把这个undefine收集进去。
        // console.log('run前')
        if (!this.active) { return this._fn() }
        shouldTrack = true
        const result = this._fn()//注:要先开了,再执行,这样就可以被track到了.
        shouldTrack = false
        return result
        //如果是写成this.fn，外面的runner会拿到[Function anonymous]，也就是说返回了一个函数。
        //如果是_fn，那么它返回的是放进来的那个函数。如果是_fn()，那么它就会返回放进来的函数的return的值，也就是"foo"。
        // console.log('run后')
    }
    stop() {
        if (this.active) {
            shouldTrack = false
            stopEffect(this)
            if (this.onStop) {
                this.onStop()
            }
            this.active = false
        }
    }
}

function stopEffect(effect) {
    effect.deps.forEach((dep: any) => { dep.delete(effect) })
    // console.log('清理前',effect.deps)
    effect.deps.length = 0
    // console.log('清理后',effect.deps)
}

let targetMap = new Map()
export function track(target, key) {
    if(isTracking()==false){return;}
    // console.log('track')
    let depsMap = targetMap.get(target)
    if (!depsMap) {
        depsMap = new Map()//这种判断没有后再赋值的方法，不要在内部重新用个let关键字，否则就会变成局部的变量，外部的变量仍然是undefine
        targetMap.set(target, depsMap)
    }
    let dep = depsMap.get(key)
    if (!dep) {
        dep = new Set()
        depsMap.set(key, dep)
    }
    //即使是完全一样的函数，放到Set里面也是两个元素。
    trackEffect(dep)
}

export function isTracking(){
    return  activeEffect !== undefined && shouldTrack == true //WRONG IN 20220505. 不是!deps 而是 activeEffect

}

export function trackEffect(dep){
    if(dep.has(activeEffect)){return;}
    dep.add(activeEffect)//记得依赖中全是effect,并且是属于reactiveEffect的实例
    activeEffect.deps.push(dep)

}

export function trigger(target, key) {
    // console.log('trigger')
    let depsMap = targetMap.get(target)
    let dep = depsMap.get(key)
    triggerEffect(dep)
}

export function triggerEffect(dep){
    dep.forEach((effect) => {
        // console.log(effect)
        if (effect.scheduler) { effect.scheduler() } else { effect.run() }
    })//性能会快点？
    // for(const effect of dep){
    //     effect.run()
    // }

}

export function effect(fn: any, options: any = {}) {
    // console.log('this is effect')
    const scheduler = options.scheduler
    let _effect = new reactiveEffect(fn, scheduler);
    extend(_effect, options)//这里就把onStop等绑了进去
    _effect.run()
    const runner: any = _effect.run.bind(_effect)//不用bind会变全局变量
    runner.effect = _effect//WRONG IN 220503, 只有给返回去的runner绑上effect, 才能在外部获取该effect
    return runner
}

export function stop(runner) {
    runner.effect.stop()
}