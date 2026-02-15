import { createKoaRouter } from './types/index.ts';

/**
 * 动态路由 History 插件，顺序为： 插件API > 文件API > HarAPI > 系统API > vue的历史模式（或类似框架） > external
 */
export default createKoaRouter(function koaRouterHistory(router) {
    // stack 支持vue的历史模式
    router.all(/^\/stack\/.*$/, async (ctx, next) => {
        ctx.url = '/stack/index.html';
        return await next();
    });
    // plugin-mgmt 支持vue的历史模式
    router.all(/^\/plugin-mgmt\/.*$/, async (ctx, next) => {
        ctx.url = '/plugin-mgmt/index.html';
        return await next();
    });

    return router
})