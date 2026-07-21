import { createKoaRouter } from './types/index.ts';
// 全局安装后请使用这种方式引入提示信息
// import { createKoaRouter } from 'lazierserver/types';

/**
 * koa 路由插件的demo
 */
export default createKoaRouter(function koaRouterDemo(router, T) {
    if (false) {
        // 测试接口
        router.all('/demo', async (ctx, next) => {
            ctx.body = 'hello demo';
            /** @type {ctx & T} */
            const ectx = ctx;
            return next();
        });
        router.all(/^\/demo.*$/, async (ctx, next) => {
            ctx.body = (ctx.body ?? '') + ' hello demo2';
            return next();
        });
    }
    return router
})