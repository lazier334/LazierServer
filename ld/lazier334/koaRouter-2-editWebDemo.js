import { createKoaRouter } from './types/index.js';
// 全局安装后请使用这种方式引入提示信息
// import { createKoaRouter } from 'lazierserver/types';

/**
 * koa 路由插件的demo
 */
export default createKoaRouter(function koaRouterDemo(router, T) {
    if (false) {
        // 以下将读取 demo.txt 文件改成读取 _demo.txt 文件。这样就能提前处理原始的 demo.txt 文件了
        // 如果是需要自定义响应内容，直接修改 ctx.body 不为 undefined 即可
        router.all('/demo.txt', async (ctx, next) => {
            /** @type {ctx & T} */
            const ectx = ctx;
            ectx.sendOptions.filename = '_' + ectx.sendOptions.filename;
            console.log(ectx.sendOptions.filename)
        });
    }
    return router
})