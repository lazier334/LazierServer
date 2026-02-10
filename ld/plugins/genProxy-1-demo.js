import { createGenProxy } from './types/index.ts';

/**
 * 生成 proxy.js 插件的demo
 */
export default createGenProxy(async function genProxyDemo(funs) {
    // 全局提示使用，在导出的时候会传递一个空对象进来，在开发环境的插件proxy.js中被更改名称为 "obj" 
    // 在生产环境被更名为 "2随机数_5随机数"
    let GlobalParam = {};

    // 给插件增加其他功能可以把函数写在这里，全局 h对象 和 C变量对象
    funs.addFunctions({
        initPlugin:
            /**
             * 初始化
             */
            function () {
                GlobalParam.domainUrl = window.location.origin;
                GlobalParam.domain = window.location.host.split(".").slice(1);
                GlobalParam.domainStr = GlobalParam.domain.join(".");
                GlobalParam.forceHttps = true;
            },
        initPlugin_dev: {
            /**
             * 初始化开发版本
             */
            run(e) {
                let devWelcomeMsg = `

         [DEV]
        Welcome!
      插件注入成功！

`;
                // .run() 函数属性使用示例, 整个 initPlugin_dev 属性都会被返回的函数覆盖掉
                return funs.createFunction(e.initPlugin.toString()
                    .replace('GlobalParam.forceHttps = true;', `console.log(\`${devWelcomeMsg}\`);
                    safe = function (fun) { try { fun() } catch (e) { console.log("函数加载失败", e) } };`)
                )
            }
        },
    })
})

