import pkg from './package.json'
import typescript from '@rollup/plugin-typescript';
export default {
    input:"./src/index.ts",//入口
    output:[
        //cjs-> commonjs, esm
        {format:"cjs",file:pkg.main,},//commomjs会找main
        {format:"es",file:pkg.module,}//esm会找module
    ],
    plugins:[typescript()]

}