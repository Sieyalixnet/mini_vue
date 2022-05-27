function testString(string) {
    let startIndex
    let endIndex

    function waitingforA(char) {
        if (char === "a") {
            startIndex=i
            return waitingforB
        }
        return waitingforA
    }

    function waitingforB(char) {
        if (char === "b") {
            return waitingforC
        }
        return waitingforA

    }
    function waitingforC(char) {
        if (char === "c") {
            endIndex=i
            return end
        }
        return waitingforA

    }
    function end() {
        return end
    }
    const EndState = Symbol('end')
    let currentState = waitingforA
    for (var i = 0; i < string.length; i++) {
        let nextState = currentState(string[i])//要拿东西接一下返回的函数
        currentState = nextState
        if (currentState == end) {
            console.log(startIndex,'   ',endIndex)
            currentState = waitingforA
        }
    }
    return false
}

testString('abcdddabc')