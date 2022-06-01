import { NodeTypes } from "../ast"
import { isText } from "../utils"


export function transformText(node, context) {


    return () => {
        const { children, content, tag, type } = node
        if(children){
        for (let i = 0; i < children.length; i++) {
            let child = children[i]
            let currentContainer
            if (isText(child)) {
                for (let j = i + 1; j < children.length; j++) {
                    let next = children[j]
                    if (isText(next)) {
                        if (!currentContainer) {//必须放j的判定之后， 因为只有连续2个子节点是符合isText才需要这个container。在i中写其实也还是要判断，多此一举，所以直接在j的循环中最合理。
                            currentContainer = children[i] = {//下面的else引用类型的特点， 也就是currentContainer被改了之后, children[i]是不会变的
                                type: NodeTypes.COMPOUND_EXPRESSION,
                                children: [child]
                            }
                        }

                        currentContainer.children.push(" + ")
                        currentContainer.children.push(next)

                        children.splice(j, 1)
                        j--
                    } else {
                        currentContainer = undefined
                        break;
                    }
                }
            }
        }
    }}
}