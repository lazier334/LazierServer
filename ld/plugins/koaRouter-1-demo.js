/**
 * 动态路由 demo 插件，顺序为： 插件API > 文件API > HarAPI > 系统API
 * @param {import('@koa/router')} router 路由
 */
export default function koaRouterDemo(router) {
    // 测试接口
    router.all('/demo', async (ctx, next) => {
        ctx.body = 'hello demo';
        return next();
    });
    router.all(/^\/demo.*$/, async (ctx, next) => {
        ctx.body = (ctx.body ?? '') + ' hello demo2';
        return next();
    });
    return router
}