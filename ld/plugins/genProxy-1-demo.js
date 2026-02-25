import { createGenProxy } from './types/index.ts';

/**
 * 生成 proxy.js 插件的demo
 */
export default createGenProxy(async function genProxyDemo(funs) {
    // 全局提示使用，在导出的时候会传递一个空对象进来，在开发环境的插件proxy.js中被更改名称为 "obj" 
    // 在生产环境被更名为 "2随机数_5随机数"
    let GlobalParam = {};

    // 给插件增加其他功能可以把函数写在这里
    if (false) funs.addFunctions({
        demo:
            /**
             * demo
             */
            function () {
                const time = Date.now();
                console.log('demo...', time);
            },
        demo_dev: {
            /**
             * demo的开发版本
             */
            run(e) {
                // .run() 函数属性使用示例, 整个 demo_dev 属性都会被返回的函数覆盖掉
                return funs.createFunction(e.demo.toString()
                    .replace('const time = Date.now();', `const time = 0;`)
                )
            }
        },
    })
})

