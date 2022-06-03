import { effect } from "../reactivity/effect";
import { EMPTY_OBJECT } from "../shared";
import { ShapeFlags } from "../shared/ShapeFlags";
import { createComponentInstance, setupComponent } from "./component"
import { shouldUpdateComponent } from "./componentUpdateUtils";
import { createAppAPI } from "./createApp";
import { addTaskInQueue } from "./scheduler";
import { Fragment, Text } from "./VNode";


export function createRenderer(options) {

    const { createElement: hostCreateElement, patchProps: hostPatchProps, insert: hostInsert, remove, setTextContent: hostSetTextContent } = options;

    function render(vnode, container) {
        patch(null, vnode, container, null, null)
    }

    function patch(n1: any, n2: any, container: any, parentComponent, anchor) {

        //WRONG IN 20220510 vnode.type，如果是虚拟节点就是Object，如果是Element，则其typeof是string，而其值就是需要创建的元素，比如div、p等。
        const { type, shapeFlag } = n2

        switch (type) {
            case (Fragment):
                processFragment(n1, n2, container, parentComponent, anchor)
                break;
            case (Text):
                processTextVNode(n1, n2, container)
                break;
            default:
                if (shapeFlag & ShapeFlags.ELEMENT) {
                    processElement(n1, n2, container, parentComponent, anchor)
                } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
                    processComponent(n1, n2, container, parentComponent, anchor)
                }
                break;
        }

    }

    function processFragment(n1, n2: any, container: any, parentComponent, anchor) {
        //WRONG IN 20220515 const {children} = vnode, mountchildren已经是直接能渲染children了, 不用解出来
        mountChildren(n2.children, container, parentComponent, anchor);
    }

    function processTextVNode(n1, n2: any, container: any) {
        const { children } = n2
        const textNode = n2.el = document.createTextNode(children)
        container.append(textNode)

    }

    function processElement(n1, n2: any, container: any, parentComponent, anchor) {
        if (!n1) {
            mountElement(n2, container, parentComponent, anchor);
        }
        else { patchElement(n1, n2, container, parentComponent, anchor) }

    }
    function patchElement(n1, n2, container, parentComponent, anchor) {
        console.log('patchElement,', 'n1:,\n', n1, 'n2:,\n', n2)

        const oldProps = n1.props || EMPTY_OBJECT;
        const newProps = n2.props || EMPTY_OBJECT;

        const el = (n2.el = n1.el);//el就是元素所在的容器, 比如div等.
        patchChildren(n1, n2, el, parentComponent, anchor)
        patchProp(el, oldProps, newProps)
    }

    function patchChildren(n1, n2, container, parentComponent, anchor) {
        const c1 = n1.children
        const c2 = n2.children
        const { shapeFlag } = n2
        const prev_shapeFlag = n1.shapeFlag

        if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
            if (prev_shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
                unmountChildren(c1)//WRONG IN 20220517 结构问题, 把unmountChildren提出去外面有助于以后的使用
                hostSetTextContent(container, c2)//注: 属性是textContent !!!!
            } else if (c1 !== c2) {
                hostSetTextContent(container, c2)
            }

        } else {
            if (prev_shapeFlag & ShapeFlags.TEXT_CHILDREN) {
                hostSetTextContent(container, '')
                mountChildren(c2, container, parentComponent, anchor)

            } else {
                patchKeyedChildren(c1, c2, container, parentComponent, anchor)
            }

        }

    }

    function patchKeyedChildren(c1, c2, container, parentComponent, parentAnchor) {
        let i = 0;
        let e1 = c1.length - 1;
        let e2 = c2.length - 1;
        //左右侧对比, 在这里, 左右侧对比仅仅只是为了让指针进行移动, 并不会修改值
        while (i <= e1 && i <= e2) {//WRONG IN 20220518 是小于等于!
            if (isSameVNodeType(c1[i], c2[i])) {
                patch(c1[i], c2[i], container, parentComponent, parentAnchor)
            } else {
                break;
            }
            i++
        }
        //因为右侧对比是移动e1和e2, 因此它走的while逻辑是一样的, 但是记住不能像示例那样出现具体数字比如0.
        while (i <= e1 && i <= e2) {
            if (isSameVNodeType(c1[e1], c2[e2])) {
                patch(c1[e1], c2[e2], container, parentComponent, parentAnchor)
            } else {
                break;
            }
            e1--
            e2--
        }

        //记住,上面只是做了指针的移动, 并没有实际地去操作DOM. 接下来才会操作DOM
        //新的比老的多, 这时候记得i肯定是大于c1并小于等于c2的.
        if (i > e1) {
            if (i <= e2) {
                let nextPosition = e2 + 1
                let anchor = nextPosition < c2.length ? c2[nextPosition].el : null; //注:这个地方非常棘手,这个方法主要是判断究竟是插入到左边还是右边
                //左侧相同的话, e2没动,+1的话就等于了c2.length(因为本身就-1), 所以会往后加.
                //右侧相同的话,e2至少-1, 因为本身就-1, 所以还是会比c2.length小,所以会往e2+1的位置加.
                while (i <= e2) {
                    patch(null, c2[i], container, parentComponent, anchor)
                    i++
                }
            }
        }
        //以下为老的比新的多的情况
        else if (i > e2) {
            if (i <= e1) {
                while (i <= e1) {
                    remove(c1[i].el)//要穿元素进去.
                    i++
                }
            }

        } else {
            //中间对比.

            const s1 = i;
            const s2 = i;
            //为了区别于全局的i的差异, 该部分内部的for循环的i值全改为了index, 以减少疑惑
            const needToPatch = e2 - s2 + 1//WRONG IN 20220519, 是只要遍历新的节点的多出来的部分就可以了, 又因为两个都是index,所以需要+1来恢复成原来的状态.
            let patchedChildCount = 0
            const keyToNewIndexMap = new Map()
            const newIndexToOldIndexMap = new Array(needToPatch);
            for (let i = 0; i < needToPatch; i++) newIndexToOldIndexMap[i] = 0;
            //用于判定是否需要移动
            let moved = false;
            let maxNewIndexSoFar = 0;

            for (let index = s2; index <= e2; index++) {
                let nextChild = c2[index]
                keyToNewIndexMap.set(nextChild.key, index)
            }

            for (let index = s1; index <= e1; index++) {
                let prevChild = c1[index]
                let newIndex //注: 这个newIndex非常重要, 它是旧元素在新元素映射的位置. 它最后的值, 是新的节点的key或者是新的数组的index. 它是新的数组c2的index, 因此它是全长的index

                if (patchedChildCount >= needToPatch) {
                    remove(prevChild.el)
                    continue;
                }

                if (prevChild.key !== null) {
                    newIndex = keyToNewIndexMap.get(prevChild.key)
                } else {
                    for (let j = s2; j <= e2; j++) {
                        if (isSameVNodeType(prevChild, c2[j])) {
                            newIndex = j
                            break // WRONG IN 20220519 break写到判断外了
                        }

                    }

                }
                //注:下面这个判定必须是undefined, 它可能是null?
                if (newIndex === undefined) {//WRONG IN 20220519 必须是undefined
                    remove(prevChild.el)
                } else {
                    if (newIndex >= maxNewIndexSoFar) {
                        maxNewIndexSoFar = newIndex
                    } else { moved = true }//看看获取的新的内容的序号, 如果拿到了反不是单调增长的序列, 就需要去移动

                    newIndexToOldIndexMap[newIndex - s2] = index + 1;//i可能为0 //WRONG IN 20220519 下标搞错了
                    patch(prevChild, c2[newIndex], container, parentComponent, null)
                    patchedChildCount++
                }
            }

            const increasingNewIndexSequece = moved ? getSequence(newIndexToOldIndexMap) : [];
            let increasingSeq_Cursor = increasingNewIndexSequece.length - 1;
            for (let index = needToPatch - 1; index >= 0; index--) {//从后往前遍历, 这样才能确认新创建的内容的位置.
                let nextIndex = index + s2;//记得这几种转换. i和s2之类的, 它本身就是下标. 由于要拿到c2的内容, 因此要加个头// 因此nextIndex已经是全长了的
                let nextChild = c2[nextIndex]
                const anchor = nextIndex + 1 < c2.length ? c2[nextIndex + 1].el : null;//注: 这个地方还是很疑惑. 因为是InsertBefore, 所以传入的其实是当前节点的下一个, 插入到之前才是正确的. 判断这个c2.length主要是为了判断一旦超过就是往后加. 其实之前也是这么操作的.
                //注:通过计算得到, 在中间对比的情况下, c2.length永远会大于nextIndex+1, 这个判断是没意义的. 但是在之前的单端的比较当中, 就需要这样的判定.
                if (newIndexToOldIndexMap[index] === 0) {//WRONG IN 20200519 拿错东西了, 是要拿出映射的值. 最长增长序列怎么可能有0????
                    patch(null, nextChild, container, parentAnchor, anchor)
                }
                else if (moved) {
                    if (increasingSeq_Cursor < 0 || index !== increasingNewIndexSequece[increasingSeq_Cursor]) {//之前的+1似乎没有处理?
                        hostInsert(nextChild.el, container, anchor)//当没匹配上才需要移动
                    } else {
                        increasingSeq_Cursor--;
                    }

                }
            }

        }

    }

    function isSameVNodeType(n1, n2) {
        return n1.type === n2.type && n1.key === n2.key

    }

    function unmountChildren(children) {
        for (let i = 0; i < children.length; i++) {
            const el = children[i].el
            remove(el)
        }
    }

    function patchProp(el, oldProps, newProps) {
        if (oldProps !== newProps) {
            for (let key in oldProps) {
                let prevValue = oldProps[key]
                let nextValue = newProps[key]

                if (prevValue !== nextValue) {
                    hostPatchProps(el, key, prevValue, nextValue)
                }
            }
        }
        if (oldProps !== EMPTY_OBJECT) {
            for (let key in newProps) {
                if (!(key in oldProps)) {
                    hostPatchProps(el, key, oldProps[key], null)
                }
            }
        }


    }

    function mountElement(vnode: any, container: any, parentComponent, anchor) {

        const el = vnode.el = hostCreateElement(vnode.type)


        const { children } = vnode;
        if (vnode.shapeFlag & ShapeFlags.TEXT_CHILDREN) {
            el.textContent = children
        } else if (vnode.shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
            mountChildren(vnode.children, el, parentComponent, anchor)
        }
        const { props } = vnode;
        for (let key in props) {
            let value = props[key]
            hostPatchProps(el, key, null, value)
        }

        hostInsert(el, container, anchor)
        // container.appendChild(el)

    }

    function mountChildren(children, container, parentComponent, anchor) {
        children.forEach((element) => {
            patch(null, element, container, parentComponent, anchor)
        });
    }


    function processComponent(n1, n2: any, container: any, parentComponent, anchor) {
        if (!n1) { mountComponent(n2, container, parentComponent, anchor) }
        else { updateComponent(n1, n2) }
    }

    function updateComponent(n1, n2) {
        const instance = (n2.component = n1.component)
        if (shouldUpdateComponent(n1, n2)) {
            instance.next = n2//要更新, 才需要next, 
            instance.update()//因为要instance.update, 所以应该把next赋值到instance上}
        } else {//不需要更新的话, 就需要把一些旧的可能变动的点赋值到新的虚拟节点中
            n2.el = n1.el//这部分赋值内容与下方的render中更新组件的赋值是相同的. 虚拟节点的el要更新, 实例的vnode要更新
            instance.vnode = n2
        }
    }


    function mountComponent(initialVNode: any, container: any, parentComponent, anchor) {
        const instance = (initialVNode.component = createComponentInstance(initialVNode, parentComponent))//WRONG IN 20220521 component的赋值地方不应该在创建节点时,而是在创建实例时
        setupComponent(instance)
        setupRenderEffect(instance, initialVNode, container, anchor)
    }


    function setupRenderEffect(instance: any, initialVNode: any, container: any, anchor) {
        instance.update = effect(() => {
            if (!instance.isMounted) {
                const { proxy } = instance;
                const subTree = (instance.subTree = instance.render.call(proxy,proxy))//由于这里指向了proxy,而render中的this.xx都会通过proxy拿到.而proxy虽然是个{},但是由于它get中可以返回对应的值,所以也就能拿到相应的值了.
                //第一个proxy是this, 第二个proxy是给的_ctx
                console.log("init, ", 'Component', initialVNode, 'instance', instance)
                patch(null, subTree, container, instance, anchor)
                initialVNode.el = subTree.el//这个subTree的el就是上面Element的el. 也就是从把Element的el不断向上传,这样在外部才能获取到$el.}
                instance.isMounted = true
            } else {
                const { proxy } = instance;
                const { next, vnode } = instance
                console.log('next', next)
                if (next) {
                    next.el = vnode.el
                    updateComponentPreRender(instance, next)
                }
                const subTree = instance.render.call(proxy,proxy)//注:更新组件之后才用render.call
                const prevSubTree = instance.subTree
                instance.subTree = subTree
                console.log("update, ", 'Component', initialVNode, 'instance', instance)
                console.log("prev: ", prevSubTree)
                console.log("curr: ", subTree)
                patch(prevSubTree, subTree, container, instance, anchor)
            }
        },{
            scheduler(){addTaskInQueue(instance.update)}
        })

    }

    return { createApp: createAppAPI(render) }
}

function updateComponentPreRender(instance, nextVNode) {
    instance.vnode = nextVNode
    instance.next = null
    instance.props = nextVNode.props
}

function getSequence(arr: number[]): number[] {
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
                } else {
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