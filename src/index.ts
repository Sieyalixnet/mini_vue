import { compile } from "./compiler-core";
import * as runtimeDom from "./runtime-dom"
import { regeisterToCompiler } from "./runtime-dom";
//minivue的出口
export * from "./runtime-dom";


 function compileToFunction(template){//只是声明而已，具体还是要在component里面使用
     const {code } = compile(template)
     const fnc = new Function('Vue', code)(runtimeDom)//第一个是参数, 然后是代码. 后面是代入参数变量
     return fnc
}

regeisterToCompiler(compileToFunction)//把这个函数传进component的全局中