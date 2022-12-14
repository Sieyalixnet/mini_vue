import { isReadonly, readonly,isProxy } from "../reactive";

describe("readonly", () => {

    it("happy path", () => {
        const orginal = { foo: 1, bar: { baz: 2 } };
        const wrapped = readonly(orginal);
        expect(wrapped).not.toBe(orginal);
        expect(isReadonly(wrapped)).toBe(true);
        expect(wrapped.foo).toBe(1);
        expect(isProxy(wrapped)).toBe(true)
    });

    it('warn when call set', () => {
        console.warn = jest.fn();
        const user = readonly({ age: 10 })

        user.age = 11;
        expect(console.warn).toBeCalled()
    })
})