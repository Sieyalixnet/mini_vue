import { effect } from "../reactivity/effect";
import { EMPTY_OBJECT } from "../shared";
import { ShapeFlags } from "../shared/ShapeFlags";
import { createComponentInstance, setupComponent } from "./component"
import { createAppAPI } from "./createApp";
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

        let el = (n2.el = n1.el);//el就是元素所在的容器, 比如div等.
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
            } else {
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
        } else if (i > e2) {
            if (i <= e1) {
                while (i <= e1) {
                    remove(c1[i].el)//要穿元素进去.
                    i++
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
        //TODO 到时还需要有更新组件的功能
        mountComponent(n2, container, parentComponent, anchor)
    }

    function mountComponent(initialVNode: any, container: any, parentComponent, anchor) {
        const instance = createComponentInstance(initialVNode, parentComponent)
        setupComponent(instance)
        setupRenderEffect(instance, initialVNode, container, anchor)
    }


    function setupRenderEffect(instance: any, initialVNode: any, container: any, anchor) {
        effect(() => {
            if (!instance.isMounted) {
                const { proxy } = instance;
                const subTree = (instance.subTree = instance.render.call(proxy))//由于这里指向了proxy,而render中的this.xx都会通过proxy拿到.而proxy虽然是个{},但是由于它get中可以返回对应的值,所以也就能拿到相应的值了.
                console.log("init, ", 'Component', initialVNode, 'instance', instance)
                patch(null, subTree, container, instance, anchor)
                initialVNode.el = subTree.el//这个subTree的el就是上面Element的el. 也就是从把Element的el不断向上传,这样在外部才能获取到$el.}
                instance.isMounted = true
            } else {
                const { proxy } = instance;
                const subTree = instance.render.call(proxy)
                const prevSubTree = instance.subTree

                instance.subTree = subTree
                console.log("update, ", 'Component', initialVNode, 'instance', instance)
                console.log("prev: ", prevSubTree)
                console.log("curr: ", subTree)
                patch(prevSubTree, subTree, container, instance, anchor)
            }
        })

    }

    return { createApp: createAppAPI(render) }
}