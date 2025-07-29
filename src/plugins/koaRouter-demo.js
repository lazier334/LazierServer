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
    router.all(/^\/demo.*$/, async (ctx) => {
        ctx.body += ' hello demo2';
    });
    return router
}