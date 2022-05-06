import {effect} from "../effect";
import { reactive,isReactive } from "../reactive";
import {isRef, proxyRefs, ref, unRef} from "../ref";

describe("ref",()=>{

    it("happy path",()=>{
        const a = ref(1);
        expect(a.value).toBe(1)

    });

    it("should be reactive",()=>{

        const a= ref(1);
        let dummy;
        let calls=0;
        effect(()=>{
            calls++;
            dummy = a.value;
        })
        expect(calls).toBe(1);
        expect(dummy).toBe(1);
        a.value=2
        expect(calls).toBe(2);
        expect(dummy).toBe(2);
        //same value should not trigger
        a.value=2
        expect(calls).toBe(2);
        expect(dummy).toBe(2);
    })

    it("should make nested properties reacitve",()=>{
        const a = ref({count:1,})
        let dummy;
        effect(()=>{
            dummy = a.value.count
        })
        expect(dummy).toBe(1);
        a.value.count=2;
        expect(dummy).toBe(2);

    })

    it('isRef',()=>{
            const a = ref(1)
            const user = reactive({age:1})
            expect(isRef(a)).toBe(true)
            expect(isRef(1)).toBe(false)
            expect(isRef(user)).toBe(false)

    })


    it('unRef',()=>{
        const a = ref(1)
        expect(unRef(a)).toBe(1)
        expect(unRef(1)).toBe(1)

        const user = {age:1}
        const userRef = ref(user)
        const unRefUser = unRef(userRef)
        // console.log(user,',',userRef,',',unRefUser)
        // console.log(isReactive(user))
        // console.log(isReactive(unRefUser))

})

    it('proxyRefs',()=>{
        const user = {
            age:ref(10),
            name:"xiaohong"
        }
        const proxyUser = proxyRefs(user);
        expect(user.age.value).toBe(10);
        expect(proxyUser.age).toBe(10);
        expect(proxyUser.name).toBe("xiaohong");
        //这是因为在setup返回了ref之后. 在template中,我们使用ref时不需要每次都调用 变量.value 来实现
        //ref->ref.value  ;  noRef -> var本身

        proxyUser.age = 20;
        expect(proxyUser.age).toBe(20);
        expect(user.age.value).toBe(20);
        //ref->修改ref.value  ;  noRef -> 修改var本身


        proxyUser.age = ref(10);
        expect(proxyUser.age).toBe(10);
        expect(user.age.value).toBe(10);        
        

    }
    

    )


})