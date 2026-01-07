import { createKoaRouter } from './types/index.ts';

/**
 * koa 路由插件的demo
 */
export default createKoaRouter(function koaRouterDemo(router) {
    if (false) {
        // 测试接口
        router.all('/demo', async (ctx, next) => {
            ctx.body = 'hello demo';
            return next();
        });
        router.all(/^\/demo.*$/, async (ctx, next) => {
            ctx.body = (ctx.body ?? '') + ' hello demo2';
            return next();
        });
    }
    return router
})