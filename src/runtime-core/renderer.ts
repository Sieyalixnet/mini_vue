import { effect } from "../reactivity/effect";
import { EMPTY_OBJECT } from "../shared";
import { ShapeFlags } from "../shared/ShapeFlags";
import { createComponentInstance, setupComponent } from "./component"
import { createAppAPI } from "./createApp";
import { Fragment, Text } from "./VNode";


export function createRenderer(options) {

    const { createElement: hostCreateElement, patchProps: hostPatchProps, insert: hostInsert } = options;

    function render(vnode, container) {
        patch(null, vnode, container, null)
    }

    function patch(n1: any, n2: any, container: any, parentComponent) {

        //WRONG IN 20220510 vnode.type，如果是虚拟节点就是Object，如果是Element，则其typeof是string，而其值就是需要创建的元素，比如div、p等。
        const { type, shapeFlag } = n2

        switch (type) {
            case (Fragment):
                processFragment(n1, n2, container, parentComponent)
                break;
            case (Text):
                processTextVNode(n1, n2, container)
                break;
            default:
                if (shapeFlag & ShapeFlags.ELEMENT) {
                    processElement(n1, n2, container, parentComponent)
                } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
                    processComponent(n1, n2, container, parentComponent)
                }
                break;
        }

    }

    function processFragment(n1, n2: any, container: any, parentComponent) {
        //WRONG IN 20220515 const {children} = vnode, mountchildren已经是直接能渲染children了, 不用解出来
        mountChildren(n2, container, parentComponent);
    }

    function processTextVNode(n1, n2: any, container: any) {
        const { children } = n2
        const textNode = n2.el = document.createTextNode(children)
        container.append(textNode)

    }

    function processElement(n1, n2: any, container: any, parentComponent) {
        if (!n1) {
            mountElement(n2, container, parentComponent);
        }
        else { patchElement(n1, n2, container) }

    }
    function patchElement(n1, n2, container) {
        console.log('patchElement,', 'n1:,\n', n1, 'n2:,\n', n2)

        const oldProps = n1.props || EMPTY_OBJECT;
        const newProps = n2.props || EMPTY_OBJECT;

        let el = (n2.el = n1.el);

        patchProp(el, oldProps, newProps)
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

    function mountElement(vnode: any, container: any, parentComponent) {

        const el = vnode.el = hostCreateElement(vnode.type)


        const { children } = vnode;
        if (vnode.shapeFlag & ShapeFlags.TEXT_CHILDREN) {
            el.textContent = children
        } else if (vnode.shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
            mountChildren(vnode, el, parentComponent)
        }
        const { props } = vnode;
        for (let key in props) {
            let value = props[key]
            hostPatchProps(el, key, null, value)
        }

        hostInsert(el, container)
        // container.appendChild(el)

    }

    function mountChildren(vnode, container, parentComponent) {
        vnode.children.forEach((element) => {
            patch(null, element, container, parentComponent)
        });
    }


    function processComponent(n1, n2: any, container: any, parentComponent) {
        //TODO 到时还需要有更新组件的功能
        mountComponent(n2, container, parentComponent)
    }

    function mountComponent(initialVNode: any, container: any, parentComponent) {
        const instance = createComponentInstance(initialVNode, parentComponent)
        setupComponent(instance)
        setupRenderEffect(instance, initialVNode, container)
    }


    function setupRenderEffect(instance: any, initialVNode: any, container: any) {
        effect(() => {
            if (!instance.isMounted) {
                const { proxy } = instance;
                const subTree = (instance.subTree = instance.render.call(proxy))//由于这里指向了proxy,而render中的this.xx都会通过proxy拿到.而proxy虽然是个{},但是由于它get中可以返回对应的值,所以也就能拿到相应的值了.
                console.log("init, ", 'Component', initialVNode, 'instance', instance)
                patch(null, subTree, container, instance)
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
                patch(prevSubTree, subTree, container, instance)
            }
        })

    }

    return { createApp: createAppAPI(render) }
}