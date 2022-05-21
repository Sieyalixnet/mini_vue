
const queue: any[] = []
let isFlushPending = false
const P = Promise.resolve()

export function nextTick(fn) {

    return fn ? P.then(fn) :P;
}

export function addTaskInQueue(task) {
    if (!queue.includes(task)) {
        queue.push(task)
    }
    queueFlush()
}

function queueFlush() {
    if (isFlushPending) { return; }
    isFlushPending = true
    nextTick(flushTasks)

}

function flushTasks() {
    isFlushPending=false
    let task
    while ((task = queue.shift())) {
        task && task()
    }

}