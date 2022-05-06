import { computed } from "../computed"
import { reactive } from "../reactive"

describe("computed",()=>{

    it("happy path",()=>{
        //类似于ref
        //可以用.value来访问
        //强大的点在于它是缓存的.

        const user = reactive({age:1})
        const age = computed(()=>{return user.age})
        expect(age.value).toBe(1);

    })

    it("should compute lazily",()=>{
        const value =reactive({foo:1})
        const getter = jest.fn(()=>{return value.foo})
        const cValue=computed(getter)

        //lazy
        expect(getter).not.toHaveBeenCalled();
        expect(cValue.value).toBe(1);
        expect(getter).toHaveBeenCalledTimes(1);

        //should not compute again//get这个值的时候,不会再次出发运算.
        cValue.value;
        expect(getter).toHaveBeenCalledTimes(1)

        //should not compute until needed//仅当需要时再计算
        value.foo =2
        expect(getter).toHaveBeenCalledTimes(1)

        //should compute
        expect(cValue.value).toBe(2)
        expect(getter).toHaveBeenCalledTimes(2)

        //should not compute again
        cValue.value;
        expect(getter).toHaveBeenCalledTimes(2)
    })

})