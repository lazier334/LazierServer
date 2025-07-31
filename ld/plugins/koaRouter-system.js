/**
 * 动态路由 demo 插件
 * @param {import('koa-router')} router 路由
 */
export default function koaRouterDemo(router) {
    // 重启接口
    router.all('/system/restart', async (ctx, next) => {
        ctx.body = '重启中...';
    });
    return router
}