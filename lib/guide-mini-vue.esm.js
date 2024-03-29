function toDisplayString(value) {
    return String(value);
}

const extend = Object.assign;
const isObject = (value) => {
    return value !== null && typeof value === "object";
};
const isString = (value) => {
    return (typeof value === "string");
};
const EMPTY_OBJECT = {};
const hasChanged = (oldValue, newValue) => {
    return !Object.is(oldValue, newValue);
};
const capitalizer = (str) => {
    return str.slice(0, 1).toUpperCase() + str.slice(1);
};
const camelizer = (str) => {
    return str.replace(/-(\w)/g, (_, c) => {
        return c.toUpperCase();
    });
    //replace的正则表达式用法https://www.w3cschool.cn/regexp/qyh61pqc.html
};
const toHandlerKey = (str) => {
    return str ? "on" + capitalizer(str) : "";
};

const TO_DISPLAY_STRING = Symbol('toDisplayString');
const CREATE_ELEMENT_VNODE = Symbol('createElementVNode');
const helperMapName = {
    [TO_DISPLAY_STRING]: "toDisplayString",
    [CREATE_ELEMENT_VNODE]: "createElementVNode"
};

function generate(ast) {
    let context = createCodeContext();
    const { push } = context;
    if (ast.helpers.length > 0) {
        genFunctionPreamble(ast, context);
    }
    push('return ');
    const functionName = "render";
    let args = ["_ctx", "_cache"];
    let signature = args.join(', ');
    push(`function ${functionName}(${signature}){`);
    push('return ');
    genNode(ast.codegenNode, context);
    push('}');
    return { code: context.code };
}
function genFunctionPreamble(ast, context) {
    const { push } = context;
    const helpersAlias = (s) => { return `${helperMapName[s]}: _${helperMapName[s]}`; };
    const helpers = ast.helpers.map(helpersAlias).join(", ");
    push(`const {${helpers}} = Vue`);
    push("\n");
}
function createCodeContext() {
    const context = {
        code: "",
        push(content) { context.code += content; },
        helper(h) { return helperMapName[h]; }
    };
    return context;
}
function genNode(node, context) {
    if (node) {
        switch (node.type) {
            case 3 /* TEXT */:
                genText(node, context);
                break;
            case 1 /* INTERPOLATION */:
                genInterpolation(node, context);
                break;
            case 0 /* SIMPLE_EXPRESSION */:
                genExpression(node, context);
                break;
            case 2 /* ELEMENT */:
                genElement(node, context);
                break;
            case 5 /* COMPOUND_EXPRESSION */:
                genCompoundExpression(node, context);
                break;
        }
    }
}
function genCompoundExpression(node, context) {
    const { push } = context;
    const { children } = node;
    for (let i = 0; i < children.length; i++) {
        let child = children[i];
        if (isString(child)) {
            push(child);
        }
        else {
            genNode(child, context);
        }
    }
}
//Element下的children由于是类型5, 也就是混合类型, 它会直接
function genElement(node, context) {
    const { push, helper } = context;
    const { tag, props, children } = node;
    push(`_${helper(CREATE_ELEMENT_VNODE)}(`);
    genNodes(genNodeMap([tag, props, children]), context);
    // genNode(node.children,context)
    push(`)`);
}
function genNodeMap(args) {
    return args.map((s) => { return s ? s : "null"; });
}
function genNodes(nodes, context) {
    const { push } = context;
    for (let i = 0; i < nodes.length; i++) {
        if (isString(nodes[i])) {
            push(nodes[i]);
        }
        else {
            genNode(nodes[i], context);
        }
        if (i < nodes.length - 1) {
            push(', ');
        }
    }
}
function genText(node, context) {
    const { push } = context;
    push(`'${node.content}'`);
}
function genInterpolation(node, context) {
    const { push, helper } = context;
    push(`_${helper(TO_DISPLAY_STRING)}(`);
    genNode(node.content, context);
    push(`)`);
}
function genExpression(node, context) {
    const { push } = context;
    push(`${node.content}`);
}

function baseParse(content) {
    let context = createParsercontext(content);
    return createRoot(parseChildren(context, []));
}
function parseChildren(context, ancestors) {
    let nodes = [];
    let node;
    while (!isEnd(context, ancestors)) {
        node = undefined;
        if (context.source.startsWith("{{")) {
            console.log("Interpo");
            node = parseInterpolation(context);
        }
        else if (context.source.startsWith("<")) {
            console.log("Element");
            if (/[a-z]/i.test(context.source[1])) {
                node = parseElement(context, ancestors);
            }
        }
        if (!node) {
            console.log("text");
            node = parseText(context);
        }
        nodes.push(node);
    }
    return nodes;
}
function isEnd(context, ancestors) {
    if (ancestors.length > 0) {
        for (let i = ancestors.length - 1; i >= 0; i--) {
            if (startsWithEndTag(context, ancestors[i].tag)) {
                return true;
            }
        }
    }
    return !context.source; //有值时为false; 当context.source为""时, 本身为false,加上!会变为true
}
function parseText(context) {
    let endIndex = context.source.length;
    let endMarks = ["{{", "<"];
    //注: 不同点. 我这里用的是高阶函数. 也可以用回for方法
    let endMark = endMarks.map((s) => { return context.source.indexOf(s); }).sort((s1, s2) => { return s1 - s2; }).find((s) => { return s != -1; });
    //一定要把最近那个标号放前面来,然后再find
    if (endMark) {
        endIndex = endMark;
    }
    const content = parseTextData(context, endIndex);
    return {
        type: 3 /* TEXT */,
        content
    };
}
function parseTextData(context, length) {
    const content = context.source.slice(0, length);
    advanceBy(context, content.length);
    return content;
}
function parseElement(context, ancestors) {
    const element = parseTag(context, 0 /* START */);
    ancestors.push(element); //WRONG IN 20220524 放错地方. 是在拿到tag之后马上就需要给ancestors加进去, 在parseTag之前就弹出.
    element.children = parseChildren(context, ancestors);
    ancestors.pop();
    if (startsWithEndTag(context, element.tag)) {
        parseTag(context, 1 /* END */);
    }
    else {
        throw (`${element.tag} lacks of end tag`);
    }
    return element;
}
function startsWithEndTag(context, tag) {
    return context.source.startsWith("</") && context.source.slice(2, 2 + tag.length) === tag;
}
function parseTag(context, TagTypes) {
    const reg = /^<\/?([a-z]*)/i;
    const matchResult = reg.exec(context.source);
    let tag = matchResult[1];
    advanceBy(context, matchResult[0].length);
    advanceBy(context, 1);
    if (TagTypes = TagTypes.END) {
        return;
    }
    return {
        type: 2 /* ELEMENT */,
        tag
    };
}
function parseInterpolation(context) {
    const openDelemiter = "{{";
    const closeDelemiter = "}}";
    let closeIndex = context.source.indexOf(closeDelemiter, closeDelemiter.length); //找-找到闭合的index
    advanceBy(context, openDelemiter.length); //推-掉本次处理的前置符号
    let rawContent = parseTextData(context, closeIndex - closeDelemiter.length);
    //拿-拿到所需要的部分
    let content = rawContent.trim();
    advanceBy(context, closeDelemiter.length); //推-推至本次处理的后置部分
    return {
        type: 1 /* INTERPOLATION */,
        content: {
            type: 0 /* SIMPLE_EXPRESSION */,
            content: content
        }
    };
}
function advanceBy(context, advanceIndexStep) {
    context.source = context.source.slice(advanceIndexStep);
}
function createRoot(children) {
    return { children,
        type: 4 /* ROOT */
    };
}
function createParsercontext(content) {
    return { source: content };
}

function createVNodeCall(context, tag, props, children) {
    context.helper(CREATE_ELEMENT_VNODE);
    return {
        type: 2 /* ELEMENT */,
        tag: tag,
        props: props,
        children: children
    };
}

function transformElement(node, context) {
    if (node.type === 2 /* ELEMENT */) {
        return () => {
            const VNodeTag = `'${node.tag}'`;
            const VNodeProps = node.props;
            const children = node.children;
            const VNodeChildren = children[0];
            const VNodeElement = createVNodeCall(context, VNodeTag, VNodeProps, VNodeChildren);
            node.codegenNode = VNodeElement;
        };
    }
}

function transformExpression(node) {
    if (node.type === 1 /* INTERPOLATION */) {
        node.content = processExpression(node.content);
    }
}
function processExpression(node) {
    node.content = `_ctx.${node.content}`;
    return node;
}

function isText(node) {
    return node.type === 3 /* TEXT */ || node.type === 1 /* INTERPOLATION */;
}

function transformText(node, context) {
    return () => {
        const { children, content, tag, type } = node;
        if (children) {
            for (let i = 0; i < children.length; i++) {
                let child = children[i];
                let currentContainer;
                if (isText(child)) {
                    for (let j = i + 1; j < children.length; j++) {
                        let next = children[j];
                        if (isText(next)) {
                            if (!currentContainer) { //必须放j的判定之后， 因为只有连续2个子节点是符合isText才需要这个container。在i中写其实也还是要判断，多此一举，所以直接在j的循环中最合理。
                                currentContainer = children[i] = {
                                    type: 5 /* COMPOUND_EXPRESSION */,
                                    children: [child]
                                };
                            }
                            currentContainer.children.push(" + ");
                            currentContainer.children.push(next);
                            children.splice(j, 1);
                            j--;
                        }
                        else {
                            currentContainer = undefined;
                            break;
                        }
                    }
                }
            }
        }
    };
}

function transform(root, options = {}) {
    const context = createTransformContext(root, options);
    traverseNode(root, context);
    createRootCodegen(root);
    root.helpers = [...context.helpers.keys()];
}
function createRootCodegen(root) {
    let child = root.children[0];
    if (child.type === 2 /* ELEMENT */) {
        root.codegenNode = child.codegenNode; //WRONG IN  20220602 . 本身在子节点的codegenNode上的,  要提到root上
    } //注: 为什么要提到Element的根节点上呢? 因为在解析的时候, 用的是codegenNode, 是个入口, 而不是children. 而子节点的codegen是根据该子节点生成的, 它必须提到根节点上,才会继续往下解析. 
    else {
        root.codegenNode = root.children[0];
    }
}
function createTransformContext(root, options) {
    return {
        root,
        nodeTransfroms: options.nodeTransfroms || [],
        helpers: new Map(),
        helper(key) {
            this.helpers.set(key, 1);
        }
    };
}
function traverseNode(node, context) {
    let children = node.children;
    const { nodeTransfroms } = context;
    const exitFuntions = [];
    for (let i = 0; i < nodeTransfroms.length; i++) {
        let exitFunction = nodeTransfroms[i](node, context);
        if (exitFunction) {
            exitFuntions.push(exitFunction);
        }
    }
    switch (node.type) {
        case 1 /* INTERPOLATION */:
            context.helper(TO_DISPLAY_STRING);
            break;
        case 4 /* ROOT */:
        case 2 /* ELEMENT */:
            traverseChildren(children, context); //注: 在教程中， 插值的helper是从transform里面加的， 而Element的helper是在transform的插件中加的.
    }
    let i = exitFuntions.length;
    while (i--) {
        exitFuntions[i]();
    }
}
function traverseChildren(children, context) {
    //事实上它只是遍历一下, 找到符合的点就会改. 没符合就遍历过一下而已
    for (let i = 0; i < children.length; i++) {
        const node = children[i];
        traverseNode(node, context);
    }
}

function compile(template) {
    const ast = baseParse(template);
    transform(ast, { nodeTransfroms: [transformExpression, transformElement, transformText] });
    return generate(ast);
}

let activeEffect; //临时的全局变量
let shouldTrack = false;
class reactiveEffect {
    constructor(fn, scheduler) {
        this.deps = []; //装着依赖set的Array
        this.active = true;
        this._fn = fn;
        this.scheduler = scheduler;
    }
    run() {
        activeEffect = this; //一定要放上面。因为track是在run前和run后之间触发的(这是因为track在reactive.get的return之前)，如果放在后面，全局变量就会是undefine，然后track会把这个undefine收集进去。
        // console.log('run前')
        if (!this.active) {
            return this._fn();
        }
        shouldTrack = true;
        const result = this._fn(); //注:要先开了,再执行,这样就可以被track到了.
        shouldTrack = false;
        return result;
        //如果是写成this.fn，外面的runner会拿到[Function anonymous]，也就是说返回了一个函数。
        //如果是_fn，那么它返回的是放进来的那个函数。如果是_fn()，那么它就会返回放进来的函数的return的值，也就是"foo"。
        // console.log('run后')
    }
    stop() {
        if (this.active) {
            shouldTrack = false;
            stopEffect(this);
            if (this.onStop) {
                this.onStop();
            }
            this.active = false;
        }
    }
}
function stopEffect(effect) {
    effect.deps.forEach((dep) => { dep.delete(effect); });
    // console.log('清理前',effect.deps)
    effect.deps.length = 0;
    // console.log('清理后',effect.deps)
}
let targetMap = new Map();
function track(target, key) {
    if (isTracking() == false) {
        return;
    }
    // console.log('track')
    let depsMap = targetMap.get(target);
    if (!depsMap) {
        depsMap = new Map(); //这种判断没有后再赋值的方法，不要在内部重新用个let关键字，否则就会变成局部的变量，外部的变量仍然是undefine
        targetMap.set(target, depsMap);
    }
    let dep = depsMap.get(key);
    if (!dep) {
        dep = new Set();
        depsMap.set(key, dep);
    }
    //即使是完全一样的函数，放到Set里面也是两个元素。
    trackEffect(dep);
}
function isTracking() {
    return activeEffect !== undefined && shouldTrack == true; //WRONG IN 20220505. 不是!deps 而是 activeEffect
}
function trackEffect(dep) {
    if (dep.has(activeEffect)) {
        return;
    }
    dep.add(activeEffect); //记得依赖中全是effect,并且是属于reactiveEffect的实例
    activeEffect.deps.push(dep);
}
function trigger(target, key) {
    // console.log('trigger')
    let depsMap = targetMap.get(target);
    let dep = depsMap.get(key);
    triggerEffect(dep);
}
function triggerEffect(dep) {
    dep.forEach((effect) => {
        // console.log(effect)
        if (effect.scheduler) {
            effect.scheduler();
        }
        else {
            effect.run();
        }
    }); //性能会快点？
    // for(const effect of dep){
    //     if (effect.scheduler) { effect.scheduler() } else { effect.run() }
    // }
}
function effect(fn, options = {}) {
    console.log('this is effect');
    console.log(fn);
    const scheduler = options.scheduler;
    let _effect = new reactiveEffect(fn, scheduler);
    console.log(_effect);
    extend(_effect, options); //这里就把onStop等绑了进去
    _effect.run();
    const runner = _effect.run.bind(_effect); //不用bind会变全局变量
    runner.effect = _effect; //WRONG IN 220503, 只有给返回去的runner绑上effect, 才能在外部获取该effect
    return runner;
}

const get = createGetter();
const set = createSetter();
const readonlyGet = createGetter(true);
const shallowReadonlyGet = createGetter(true, true);
function createGetter(isReadonly = false, shallow = false) {
    return function get(target, key) {
        if (key === "__v_is_Reactive" /* IS_REACTIVE */) {
            return !isReadonly;
        }
        else if (key === "__v_is_Readonly" /* IS_READONLY */) {
            return isReadonly;
        }
        let res = Reflect.get(target, key);
        if (shallow === true) {
            return res;
        }
        if (!isReadonly) {
            track(target, key);
        }
        return res;
    };
}
function createSetter() {
    return function set(target, key, value) {
        let res = Reflect.set(target, key, value);
        trigger(target, key);
        return res;
    };
}
const mutableHandlers = {
    get,
    set
};
const readonlyHandlers = {
    get: readonlyGet,
    set(target, key, value) {
        console.warn(`READONLY: ${key} can not be set.`);
        return true;
    }
};
const shallowReadonlyHandlers = extend({}, readonlyHandlers, { get: shallowReadonlyGet });

function createReactiveObject(target, baseHandlers) {
    if (!isObject(target)) {
        console.warn(`目标 ${target} 必须是一个对象`);
        return target;
    }
    return new Proxy(target, baseHandlers);
}
function reactive(raw) {
    return createReactiveObject(raw, mutableHandlers);
}
function shallowReadonly(raw) {
    return createReactiveObject(raw, shallowReadonlyHandlers);
}

class Refimpl {
    constructor(value) {
        this.__v_isRef = true;
        this._rawValue = value;
        this._value = convert(value);
        this.dep = new Set();
    }
    get value() {
        if (isTracking()) {
            trackEffect(this.dep);
        }
        return this._value;
    }
    set value(newValue) {
        if (hasChanged(newValue, this._rawValue)) {
            this._rawValue = newValue; //WRONG IN 220506,逻辑没搞懂.set就是改值之后触发依赖而已.初始化怎么作这里就应该怎么做.
            this._value = convert(newValue); //WRONG IN 220506要先改值再触发依赖!
            triggerEffect(this.dep);
        }
    }
}
function convert(value) {
    return isObject(value) ? reactive(value) : value;
}
function ref(value) {
    return new Refimpl(value);
}
function isRef(ref) {
    return !!ref.__v_isRef;
}
function unRef(ref) {
    return isRef(ref) ? ref.value : ref; //注, 致命错误: 这个unref是在proxyRefs中调用了, 所以只有返回了reactive, 它才能继续被track. 由于proxyRefs中调用了这个函数, 若返回的是非reactive,则不会继续收集依赖, 感觉应该重新声明一个变量更加合适? 但是这又不完全符合unref的含义.
}
function proxyRefs(objectWithRef) {
    return new Proxy(objectWithRef, {
        get(target, key) {
            return unRef(Reflect.get(target, key)); //通过unRef之后,这个值就已经是拿到了ref.value了,而对不是ref的值又不影响
        },
        set(target, key, value) {
            if (isRef(target[key]) && !isRef(value)) { //这种情况下,只要把ref[key]的value改为新值即可.//WRONG IN 20220506 还没完全理解这个set
                return (target[key].value = value); //只有这种情况,ref[key]要修改的值和新的value不是同级的,因此要特殊拿出来.
            }
            else {
                return Reflect.set(target, key, value);
                //若ref[key]和value都是ref,那么他们都需要把[key].value修改(也就是同级的),因此也可以直接用set
                //若ref[key]不是ref,那么本身就是普通的变量,因此可以直接用.
                //若ref[key]不是ref,value是ref,那么就把新的ref赋予它即可.单测中有这种情况.
            }
        }
    });
}

function emit(instance, event, ...arg) {
    // console.log('event',event)
    const { props } = instance;
    //注: 开发流程中有TPP流程, 可以先把一个内容写死. 运行没问题之后, 再不断的泛化和重构.
    const handlerName = toHandlerKey(camelizer(event));
    const handler = props[handlerName];
    handler && handler(...arg);
}

function initProps(instance, rawProps) {
    instance.props = rawProps || {}; //因为第一层的props是undefined, 但是它仍然去调用了reactive, 所以是不合理的. 
}

const PublicPropertiesMap = {
    $el: (i) => i.vnode.el,
    $slots: (i) => i.slots,
    $props: (i) => i.props
};
const PublicInstanceProxyHandlers = {
    get({ _: instance }, key) {
        const { setupState, props } = instance;
        const hasOwn = (value, key) => Object.prototype.hasOwnProperty.call(value, key); //WRONG IN 20220512 原型,还要call~!!!还写反了!
        if (hasOwn(setupState, key)) {
            return setupState[key];
        }
        else if (hasOwn(props, key)) {
            return props[key];
        }
        const publicGetter = PublicPropertiesMap[key];
        if (publicGetter) {
            return publicGetter(instance);
        }
    }
};

function initSlots(instance, children) {
    const { vnode } = instance;
    if (vnode.shapeFlag & 16 /* SLOT_CHILDREN */) {
        normalizeObectSlots(children, instance.slots);
    }
}
function normalizeObectSlots(children, slots) {
    // instance.slots = Array.isArray(children)? children: [children];
    for (let key in children) {
        let value = children[key];
        slots[key] = (slots) => normalizeSlotValue(value(slots)); //代入之后运行才知道结果是否为array.
        //因为header:({age})=>h("p", {}, "header"+age) 所以这里也要做相应的变化.
    }
}
function normalizeSlotValue(value) {
    return Array.isArray(value) ? value : [value];
}

function createComponentInstance(vnode, parent) {
    const component = {
        vnode,
        next: null,
        update: () => { },
        type: vnode.type,
        setupState: {},
        props: {},
        slots: {},
        emit: () => { },
        isMounted: false,
        subTree: {},
        parent,
        provides: parent ? parent.provides : {}
    };
    component.emit = emit.bind(null, component); //注,这样写的话是可以指定第一个参数. 参考mozilla
    //https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Function/bind
    return component;
}
function setupComponent(instance) {
    initProps(instance, instance.vnode.props); //注:第一次是挂在vnode上的,在init之后才挂在实例上
    initSlots(instance, instance.vnode.children);
    setupStatefulComponent(instance);
}
function setupStatefulComponent(instance) {
    const Component = instance.type;
    instance.proxy = new Proxy({ _: instance }, PublicInstanceProxyHandlers);
    const { setup } = Component;
    if (setup) {
        setCurrentInstance(instance);
        const setupResult = setup(shallowReadonly(instance.props), { emit: instance.emit });
        setCurrentInstance(null);
        handleSetupResult(instance, setupResult);
    }
}
function handleSetupResult(instance, setupResult) {
    if (typeof setupResult === "object") {
        instance.setupState = proxyRefs(setupResult); //如果只是一个obj，他就给实例加上去
    }
    finishSetup(instance); //注:致命错误, 放在if里面的话, 子组件没办法继续解析, 所以子组件会变成undefined
}
function finishSetup(instance) {
    const Component = instance.type;
    if (Compiler && !Component.render) {
        if (Component.template) {
            Component.render = Compiler(Component.template);
        }
    }
    // if(Component.render){
    instance.render = Component.render;
    // }//这几步似乎都是在把vnode里面的属性拿到这个实例上。
}
//现在的instance，也就是这个Component大概是:
//{vnode,type,setupState=rootComponent.setup(),render=rootComponent.render()}
//以后肯定还会在各层增加相应的情况，特别是在这个setupCompnent和后续的几个调用中
let currentInstance = null;
function getCurrentInstance() {
    return currentInstance;
}
function setCurrentInstance(instance) {
    currentInstance = instance;
}
let Compiler;
function regeisterToCompiler(value) {
    Compiler = value;
}

function shouldUpdateComponent(prevVNode, nextVNode) {
    const { props: prevProps } = prevVNode;
    const { props: nextProps } = nextVNode;
    for (let key in nextProps) {
        if (nextProps[key] !== prevProps[key]) {
            return true;
        }
        else {
            return false;
        }
    }
}

const Fragment = Symbol("Fragment");
const Text = Symbol("Text");
function createVNode(type, props, children) {
    const vnode = {
        type,
        props,
        component: null,
        key: props && props.key,
        children,
        shapeFlag: getShapeFlag(type),
        el: null
    };
    if (typeof vnode.children === "string") {
        vnode.shapeFlag |= 4 /* TEXT_CHILDREN */;
    }
    else if (Array.isArray(children)) {
        vnode.shapeFlag |= 8 /* ARRAY_CHILDREN */;
    }
    if (vnode.shapeFlag & 2 /* STATEFUL_COMPONENT */) {
        if (typeof children == "object") {
            vnode.shapeFlag |= 16 /* SLOT_CHILDREN */;
        }
    }
    return vnode;
}
function createTextVNode(text) {
    return createVNode(Text, {}, text);
}
function getShapeFlag(type) {
    return typeof type === "string" ? 1 /* ELEMENT */ : 2 /* STATEFUL_COMPONENT */;
}

function createAppAPI(render) {
    return function createApp(rootComponent) {
        return {
            mount(rootContainer) {
                const VNode = createVNode(rootComponent);
                render(VNode, rootContainer, undefined); //注:??
            }
        };
    };
}

const queue = [];
let isFlushPending = false;
const P = Promise.resolve();
function nextTick(fn) {
    return fn ? P.then(fn) : P;
}
function addTaskInQueue(task) {
    if (!queue.includes(task)) {
        queue.push(task);
    }
    queueFlush();
}
function queueFlush() {
    if (isFlushPending) {
        return;
    }
    isFlushPending = true;
    nextTick(flushTasks);
}
function flushTasks() {
    isFlushPending = false;
    let task;
    while ((task = queue.shift())) {
        task && task();
    }
}

function createRenderer(options) {
    const { createElement: hostCreateElement, patchProps: hostPatchProps, insert: hostInsert, remove, setTextContent: hostSetTextContent } = options;
    function render(vnode, container) {
        patch(null, vnode, container, null, null);
    }
    function patch(n1, n2, container, parentComponent, anchor) {
        //WRONG IN 20220510 vnode.type，如果是虚拟节点就是Object，如果是Element，则其typeof是string，而其值就是需要创建的元素，比如div、p等。
        const { type, shapeFlag } = n2;
        switch (type) {
            case (Fragment):
                processFragment(n1, n2, container, parentComponent, anchor);
                break;
            case (Text):
                processTextVNode(n1, n2, container);
                break;
            default:
                if (shapeFlag & 1 /* ELEMENT */) {
                    processElement(n1, n2, container, parentComponent, anchor);
                }
                else if (shapeFlag & 2 /* STATEFUL_COMPONENT */) {
                    processComponent(n1, n2, container, parentComponent, anchor);
                }
                break;
        }
    }
    function processFragment(n1, n2, container, parentComponent, anchor) {
        //WRONG IN 20220515 const {children} = vnode, mountchildren已经是直接能渲染children了, 不用解出来
        mountChildren(n2.children, container, parentComponent, anchor);
    }
    function processTextVNode(n1, n2, container) {
        const { children } = n2;
        const textNode = n2.el = document.createTextNode(children);
        container.append(textNode);
    }
    function processElement(n1, n2, container, parentComponent, anchor) {
        if (!n1) {
            mountElement(n2, container, parentComponent, anchor);
        }
        else {
            patchElement(n1, n2, container, parentComponent, anchor);
        }
    }
    function patchElement(n1, n2, container, parentComponent, anchor) {
        console.log('patchElement,', 'n1:,\n', n1, 'n2:,\n', n2);
        const oldProps = n1.props || EMPTY_OBJECT;
        const newProps = n2.props || EMPTY_OBJECT;
        const el = (n2.el = n1.el); //el就是元素所在的容器, 比如div等.
        patchChildren(n1, n2, el, parentComponent, anchor);
        patchProp(el, oldProps, newProps);
    }
    function patchChildren(n1, n2, container, parentComponent, anchor) {
        const c1 = n1.children;
        const c2 = n2.children;
        const { shapeFlag } = n2;
        const prev_shapeFlag = n1.shapeFlag;
        if (shapeFlag & 4 /* TEXT_CHILDREN */) {
            if (prev_shapeFlag & 8 /* ARRAY_CHILDREN */) {
                unmountChildren(c1); //WRONG IN 20220517 结构问题, 把unmountChildren提出去外面有助于以后的使用
                hostSetTextContent(container, c2); //注: 属性是textContent !!!!
            }
            else if (c1 !== c2) {
                hostSetTextContent(container, c2);
            }
        }
        else {
            if (prev_shapeFlag & 4 /* TEXT_CHILDREN */) {
                hostSetTextContent(container, '');
                mountChildren(c2, container, parentComponent, anchor);
            }
            else {
                patchKeyedChildren(c1, c2, container, parentComponent, anchor);
            }
        }
    }
    function patchKeyedChildren(c1, c2, container, parentComponent, parentAnchor) {
        let i = 0; //指针，从左边开始
        let e1 = c1.length - 1; //老的数组最后的索引值
        let e2 = c2.length - 1; //新的数组最后的索引值
        //左右侧对比, 在这里, 左右侧对比仅仅只是为了让指针进行移动, 并不会修改值
        while (i <= e1 && i <= e2) { //WRONG IN 20220518 是小于等于!
            if (isSameVNodeType(c1[i], c2[i])) {
                patch(c1[i], c2[i], container, parentComponent, parentAnchor);
            }
            else {
                break;
            }
            i++;
        }
        //因为右侧对比是移动e1和e2, 因此它走的while逻辑是一样的, 但是记住不能像示例那样出现具体数字比如0.
        while (i <= e1 && i <= e2) {
            if (isSameVNodeType(c1[e1], c2[e2])) {
                patch(c1[e1], c2[e2], container, parentComponent, parentAnchor);
            }
            else {
                break;
            }
            e1--;
            e2--;
        }
        //记住,上面只是做了指针的移动, 并没有实际地去操作DOM. 接下来才会操作DOM
        //新的比老的多, 这时候记得i肯定是大于c1并小于等于c2的.
        if (i > e1) {
            if (i <= e2) {
                let nextPosition = e2 + 1;
                let anchor = nextPosition < c2.length ? c2[nextPosition].el : null; //注:这个地方非常棘手,这个方法主要是判断究竟是插入到左边还是右边
                //左侧相同的话, e2没动,+1的话就等于了c2.length(因为本身就-1), 所以会往后加.
                //右侧相同的话,e2至少-1, 因为本身就-1, 所以还是会比c2.length小,所以会往e2+1的位置加.
                while (i <= e2) {
                    patch(null, c2[i], container, parentComponent, anchor);
                    i++;
                }
            }
        }
        //以下为老的比新的多的情况
        else if (i > e2) {
            if (i <= e1) {
                while (i <= e1) {
                    remove(c1[i].el); //要穿元素进去.
                    i++;
                }
            }
        }
        else {
            //中间对比.
            const s1 = i; //老节点数组的开始
            const s2 = i; //新节点数组的开始
            //为了区别于全局的i的差异, 该部分内部的for循环的i值全改为了index, 以减少疑惑
            const needToPatch = e2 - s2 + 1; //WRONG IN 20220519, 是只要遍历新的节点的多出来的部分就可以了, 又因为两个都是index,所以需要+1来恢复成原来的状态.
            let patchedChildCount = 0;
            const keyToNewIndexMap = new Map();
            const newIndexToOldIndexMap = new Array(needToPatch);
            for (let i = 0; i < needToPatch; i++)
                newIndexToOldIndexMap[i] = 0;
            //用于判定是否需要移动
            let moved = false;
            let maxNewIndexSoFar = 0;
            //这个是给新节点数组做一个映射表，[key值, 新节点数组的序号index]
            for (let index = s2; index <= e2; index++) {
                let nextChild = c2[index];
                keyToNewIndexMap.set(nextChild.key, index);
            }
            for (let index = s1; index <= e1; index++) {
                let prevChild = c1[index];
                let newIndex; //注: 这个newIndex非常重要, 它是旧元素在新元素映射的位置. 它最后的值, 是新的节点的key或者是新的数组的index. 它是新的数组c2的index, 因此它是全长的index
                /*
                删除老节点的优化点:
                一旦新节点被遍历完，把老节点全部删除即可。
                */
                if (patchedChildCount >= needToPatch) {
                    remove(prevChild.el);
                    continue;
                }
                /*
                删除老节点:
                1.用key值查看该旧节点在不在新节点中
                2.如果没给key才开始遍历
                */
                if (prevChild.key !== null) {
                    //删除老节点的第1步，有key的情况下
                    newIndex = keyToNewIndexMap.get(prevChild.key);
                }
                else {
                    //删除老节点的第2步，无key的情况下
                    for (let j = s2; j <= e2; j++) {
                        if (isSameVNodeType(prevChild, c2[j])) {
                            /*注意这里的判断是否相等只有2个判断，
                             1. type是否一样
                             2. key是否一样
                             这就导致了如果内容不一样，但key是一样的话，它会被认为是同一个节点?
                            */
                            newIndex = j;
                            break; // WRONG IN 20220519 break写到判断外了
                        }
                    }
                }
                //注:下面这个判定必须是undefined,因为null和undefined是不同的，且newIndex是上面搜索的结果，如果没查到就是undefined。
                if (newIndex === undefined) { //WRONG IN 20220519 必须是undefined
                    remove(prevChild.el);
                }
                else {
                    //不用删除那就patch
                    if (newIndex >= maxNewIndexSoFar) {
                        maxNewIndexSoFar = newIndex;
                    }
                    else {
                        moved = true;
                    } //看看获取的新的内容的序号, 如果拿到了反不是单调增长的序列, 就需要去移动
                    //移动的前置步骤，给这个映射表赋值。newIndex是在整个(包括前后)的位置，要减掉s2才是中间部分。那么key就代表着该节点在新节点的位置。而值是index，是旧的数组该节点的位置。但是不能为0，因为0意味着没有创建映射关系。
                    newIndexToOldIndexMap[newIndex - s2] = index + 1; //i可能为0 //WRONG IN 20220519 下标搞错了
                    patch(prevChild, c2[newIndex], container, parentComponent, null);
                    patchedChildCount++;
                }
            }
            //patch完不需要删除的节点后，这个newIndexToOldIndexMap。现在这个变量存储的是，新节点的数组，但当中的值是旧节点的位置。
            const increasingNewIndexSequece = moved ? getSequence(newIndexToOldIndexMap) : [];
            let increasingSeq_Cursor = increasingNewIndexSequece.length - 1;
            for (let index = needToPatch - 1; index >= 0; index--) { //从后往前遍历, 这样才能确认新创建的内容的位置.
                let nextIndex = index + s2; //记得这几种转换. i和s2之类的, 它本身就是下标. 由于要拿到c2的内容, 因此要加个头// 因此nextIndex已经是全长了的
                let nextChild = c2[nextIndex];
                const anchor = nextIndex + 1 < c2.length ? c2[nextIndex + 1].el : null; //注: 这个地方还是很疑惑. 因为是InsertBefore, 所以传入的其实是当前节点的下一个, 插入到之前才是正确的. 判断这个c2.length主要是为了判断一旦超过就是往后加. 其实之前也是这么操作的.
                //注:通过计算得到, 在中间对比的情况下, c2.length永远会大于nextIndex+1, 这个判断是没意义的. 但是在之前的单端的比较当中, 就需要这样的判定.
                if (newIndexToOldIndexMap[index] === 0) { //WRONG IN 20200519 拿错东西了, 是要拿出映射的值. 最长增长序列怎么可能有0????
                    patch(null, nextChild, container, parentAnchor, anchor);
                }
                else if (moved) {
                    if (increasingSeq_Cursor < 0 || index !== increasingNewIndexSequece[increasingSeq_Cursor]) {
                        hostInsert(nextChild.el, container, anchor); //当没匹配上才需要移动
                    }
                    else {
                        increasingSeq_Cursor--;
                    }
                }
            }
        }
    }
    function isSameVNodeType(n1, n2) {
        return n1.type === n2.type && n1.key === n2.key;
    }
    function unmountChildren(children) {
        for (let i = 0; i < children.length; i++) {
            const el = children[i].el;
            remove(el);
        }
    }
    function patchProp(el, oldProps, newProps) {
        if (oldProps !== newProps) {
            for (let key in oldProps) {
                let prevValue = oldProps[key];
                let nextValue = newProps[key];
                if (prevValue !== nextValue) {
                    hostPatchProps(el, key, prevValue, nextValue);
                }
            }
        }
        if (oldProps !== EMPTY_OBJECT) {
            for (let key in newProps) {
                if (!(key in oldProps)) {
                    hostPatchProps(el, key, oldProps[key], null);
                }
            }
        }
    }
    function mountElement(vnode, container, parentComponent, anchor) {
        const el = vnode.el = hostCreateElement(vnode.type);
        const { children } = vnode;
        if (vnode.shapeFlag & 4 /* TEXT_CHILDREN */) {
            el.textContent = children;
        }
        else if (vnode.shapeFlag & 8 /* ARRAY_CHILDREN */) {
            mountChildren(vnode.children, el, parentComponent, anchor);
        }
        const { props } = vnode;
        for (let key in props) {
            let value = props[key];
            hostPatchProps(el, key, null, value);
        }
        hostInsert(el, container, anchor);
        // container.appendChild(el)
    }
    function mountChildren(children, container, parentComponent, anchor) {
        children.forEach((element) => {
            patch(null, element, container, parentComponent, anchor);
        });
    }
    function processComponent(n1, n2, container, parentComponent, anchor) {
        if (!n1) {
            mountComponent(n2, container, parentComponent, anchor);
        }
        else {
            updateComponent(n1, n2);
        }
    }
    function updateComponent(n1, n2) {
        const instance = (n2.component = n1.component);
        if (shouldUpdateComponent(n1, n2)) {
            instance.next = n2; //要更新, 才需要next, 
            instance.update(); //因为要instance.update, 所以应该把next赋值到instance上}
        }
        else { //不需要更新的话, 就需要把一些旧的可能变动的点赋值到新的虚拟节点中
            n2.el = n1.el; //这部分赋值内容与下方的render中更新组件的赋值是相同的. 虚拟节点的el要更新, 实例的vnode要更新
            instance.vnode = n2;
        }
    }
    function mountComponent(initialVNode, container, parentComponent, anchor) {
        const instance = (initialVNode.component = createComponentInstance(initialVNode, parentComponent)); //WRONG IN 20220521 component的赋值地方不应该在创建节点时,而是在创建实例时
        setupComponent(instance);
        setupRenderEffect(instance, initialVNode, container, anchor);
    }
    function setupRenderEffect(instance, initialVNode, container, anchor) {
        instance.update = effect(() => {
            if (!instance.isMounted) {
                const { proxy } = instance;
                const subTree = (instance.subTree = instance.render.call(proxy, proxy)); //由于这里指向了proxy,而render中的this.xx都会通过proxy拿到.而proxy虽然是个{},但是由于它get中可以返回对应的值,所以也就能拿到相应的值了.
                //第一个proxy是this, 第二个proxy是给的_ctx
                console.log("init, ", 'Component', initialVNode, 'instance', instance);
                patch(null, subTree, container, instance, anchor);
                initialVNode.el = subTree.el; //这个subTree的el就是上面Element的el. 也就是从把Element的el不断向上传,这样在外部才能获取到$el.}
                instance.isMounted = true;
            }
            else {
                const { proxy } = instance;
                const { next, vnode } = instance;
                console.log('next', next);
                if (next) {
                    next.el = vnode.el;
                    updateComponentPreRender(instance, next);
                }
                const subTree = instance.render.call(proxy, proxy); //注:更新组件之后才用render.call
                const prevSubTree = instance.subTree;
                instance.subTree = subTree;
                console.log("update, ", 'Component', initialVNode, 'instance', instance);
                console.log("prev: ", prevSubTree);
                console.log("curr: ", subTree);
                patch(prevSubTree, subTree, container, instance, anchor);
            }
        }, {
            scheduler() { addTaskInQueue(instance.update); }
        });
    }
    return { createApp: createAppAPI(render) };
}
function updateComponentPreRender(instance, nextVNode) {
    instance.vnode = nextVNode;
    instance.next = null;
    instance.props = nextVNode.props;
}
//拿到最长递增子序列的序号，比如[8,1,9,2,3,4]，拿到的事[1,3,4,5]
function getSequence(arr) {
    const p = arr.slice();
    const result = [0];
    let i, j, u, v, c;
    const len = arr.length;
    for (i = 0; i < len; i++) {
        const arrI = arr[i];
        if (arrI !== 0) {
            j = result[result.length - 1];
            if (arr[j] < arrI) {
                p[i] = j;
                result.push(i);
                continue;
            }
            u = 0;
            v = result.length - 1;
            while (u < v) {
                c = (u + v) >> 1;
                if (arr[result[c]] < arrI) {
                    u = c + 1;
                }
                else {
                    v = c;
                }
            }
            if (arrI < arr[result[u]]) {
                if (u > 0) {
                    p[i] = result[u - 1];
                }
                result[u] = i;
            }
        }
    }
    u = result.length;
    v = result[u - 1];
    while (u-- > 0) {
        result[u] = v;
        v = p[v];
    }
    return result;
}

function h(type, props, children) {
    return createVNode(type, props, children);
}

function renderSlots(slots, name, props) {
    const slot = slots[name];
    if (slot) {
        if (typeof slot === "function") {
            return createVNode(Fragment, {}, slot(props));
            //slots是在App.js中定义的,然后已经保存到instance.slots里面了.然后通过name拿出来,在传入props,即可完成.
            //根据({age})=>h("p", {}, "header"+age)和renderSlots(this.$slots,"header",{age})进行相应的变化.
            //这里slot已经变为了一个function,也就是h("p", {}, "header"+age) , props是{age}
            //然后所以把age解构出来代入到function中即可.
        }
    }
}

function provide(key, value) {
    const currentInstance = getCurrentInstance();
    if (currentInstance) {
        const parentInstance = currentInstance.parent;
        let parentProvides = parentInstance.provides;
        let { provides } = currentInstance;
        if (provides === parentProvides) {
            provides = currentInstance.provides = Object.create(parentProvides);
            //注,这种写法就是在继承原型链,详见mdn Object.create. 右侧表达式表示用当前的实例的provides的原型指向父实例的provides. 然后再对provides进行赋值.
            //注, 似乎在这种原型链继承问题的赋值 解构得到的值, 不完全等于 变量.值. 所以provides = provides = Object.create会出错. 但是 currentInstance.provides=currentInstance.provides=Object.create则没有错.
        }
        provides[key] = value;
    }
}
function inject(key, defaultValue) {
    const currentInstance = getCurrentInstance();
    if (currentInstance) {
        const { provides } = currentInstance.parent;
        if (key in provides) {
            return provides[key];
        }
        else {
            if (typeof defaultValue === "function") {
                return defaultValue();
            }
            return defaultValue;
        }
    }
}

function createElement(vnodeType) {
    return document.createElement(vnodeType);
}
function patchProps(el, key, prevValue, nextValue) {
    const isOn = (key) => { return /^on[A-Z]/.test(key); }; //注: 大部分JS的内容都可以表示为string. 因此需要巧妙使用正则表达式和slice等. 
    if (isOn(key)) {
        const event = key.slice(2).toLowerCase();
        el.addEventListener(event, nextValue);
    }
    else {
        if (nextValue === undefined || nextValue === null) {
            el.removeAttribute(key);
        }
        else {
            el.setAttribute(key, nextValue);
        }
    }
}
function insert(el, container, anchor) {
    container.insertBefore(el, anchor || null); //该api表示如果是null就相当于append, 否则就会插入到anchor所在元素之前的位置.
}
function remove(child) {
    const parent = child.parentNode; //WRONG IN 20220517 parentNode和removeChild这些必须记住!
    if (parent) {
        parent.removeChild(child);
    }
}
function setTextContent(el, text) {
    el.textContent = text;
}
const renderer = createRenderer({
    createElement, patchProps, insert, remove, setTextContent
});
function createApp(...args) {
    return renderer.createApp(...args);
}

var runtimeDom = /*#__PURE__*/Object.freeze({
    __proto__: null,
    createApp: createApp,
    h: h,
    renderSlots: renderSlots,
    createTextVNode: createTextVNode,
    createElementVNode: createVNode,
    getCurrentInstance: getCurrentInstance,
    regeisterToCompiler: regeisterToCompiler,
    provide: provide,
    inject: inject,
    createRenderer: createRenderer,
    nextTick: nextTick,
    toDisplayString: toDisplayString,
    ref: ref,
    proxyRefs: proxyRefs
});

function compileToFunction(template) {
    const { code } = compile(template);
    const fnc = new Function('Vue', code)(runtimeDom); //第一个是参数, 然后是代码. 后面是代入参数变量
    return fnc;
}
regeisterToCompiler(compileToFunction); //把这个函数传进component的全局中

export { createApp, createVNode as createElementVNode, createRenderer, createTextVNode, getCurrentInstance, h, inject, nextTick, provide, proxyRefs, ref, regeisterToCompiler, renderSlots, toDisplayString };
