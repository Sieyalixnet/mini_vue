import {reactive} from "../reactive"
import {effect} from "../effect"
describe('effect',()=>{
    it('happy path',()=>{
        const user = reactive({
            age:10
        });
        let nextAge;
        effect(()=>{
            nextAge = user.age+1;
        })
        expect(nextAge).toBe(11);

        //update
        user.age++;
        user.age++;
        user.age++;
        expect(nextAge).toBe(14)

    });

    it('shold return runner when call effect',()=>{
        //调用 effect(fn)之后，会立即执行一次，并返回一个函数，被称为function(runner) 
        //再调用这个fn之后，会把值return出去。
        //如果没有这个功能，我们没办法拿到effect返回的值。
        let foo=10;
        const runner = effect(()=>{
            foo++
            return "foo"
        })
        expect(foo).toBe(11)
        //const r= runner()
        let r= runner;
        console.log(r)
        r= r()
        console.log(r)
        expect(foo).toBe(12)
        expect(r).toBe("foo")

    })

})

it("scheduler",()=>{
    //1. 通过effect的第二个参数给定 一个scheduler的fn
    //2. 当effect第一次执行时，会执行fn
    //3. 当响应式对象set update 时，不会执行fn而是执行 scheduler
    //4. 如果当执行runner时，就再执行fn
    let dummy;
    let run:any;
    const scheduler = jest.fn(()=>{run=runner;})
    const obj = reactive({foo:1})
    const runner = effect(()=>{dummy = obj.foo;},{scheduler})//单元测试中这个scheduler只是让这里的run函数等于一下整个runner。
    expect(scheduler).not.toHaveBeenCalled();
    expect(dummy).toBe(1);
    obj.foo++;//obj.foo已变成2，但是dummy没有，说明现在只执行了sheduler，而没执行runner
    expect(scheduler).toHaveBeenCalledTimes(1);
    expect(dummy).toBe(1);
    run();//这时候执行runner，这时候dummy才等于obj.foo，所以变为了2.
    //就是这个run()，它是直接执行类reactiveEffect的run函数，而没有经过Proxy的，所以它不会触发trigger，所以不会用到scheduler。
    expect(dummy).toBe(2);

})