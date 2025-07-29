/**
 * 动态路由 demo 插件
 * @param {import('koa-router')} router 路由
 */
export default function koaRouterDemo(router) {
    // 测试接口
    router.all('/demo', async (ctx, next) => {
        ctx.body = 'hello demo';
        next()
    });
    router.all('/proxy.js', async (ctx, next) => {
        ctx.body = 'hello demo';
        // 可以使用 ctx.next 继续运行后面的路由
        ctx.next = true;
    });
    router.all(/^\/demo.*$/, async (ctx) => {
        ctx.body = (ctx.body ?? '') + ' hello demo2';
    });
    return router
}