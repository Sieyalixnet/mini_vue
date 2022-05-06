import { isReactive, isReadonly, shallowReadonly } from "../reactive";

describe("shallowReadonly",()=>{

    test("should not make non-reactive properties reactive",()=>{
        const props = shallowReadonly({n:{foo:1}})
        expect(isReadonly(props)).toBe(true);
        expect(isReadonly(props.n)).toBe(false);
        // console.log(isReactive(props.n))//false
        //只有外部是readonly,但是内部的数据不是.

    })
    it('warn when call set', () => {
        console.warn = jest.fn();
        const user = shallowReadonly({ age: 10 })

        user.age = 11;
        expect(console.warn).toBeCalled()
    })
})