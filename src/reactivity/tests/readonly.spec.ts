describe("readonly", () => {

    it("happy path", () => {
        const orginal = { foo: 1, bar: { baz: 2 } };
        const wrapped =readonly(orginal);
        expect(orginal).not.toBe(orginal);
        expect(orginal.foo).toBe(1);


    })

})