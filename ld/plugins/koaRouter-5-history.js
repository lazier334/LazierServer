/**
 * 动态路由 demo 插件，顺序为： 插件API > 文件API > HarAPI > 系统API > vue的历史模式（或类似框架）
 * @param {import('koa-router')} router 路由
 */
export default function koaRouterDemo(router) {
    // stack 支持vue的历史模式
    router.all(/^\/stack\/.*$/, async (ctx, next) => {
        ctx.url = '/stack/index.html';
        return await next();
    });

    return router
}