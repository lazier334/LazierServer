import koaCompose from './koaCompose.js';

import { config } from './config.js';
import { completeFile, readKoaRouters } from './utils.js';
import { plugins } from './plugins.js';

export default initKoa;

/**
 * 初始化Koa
 * @param {import('@types/koa')} app 
 */
async function initKoa(app) {
    // 添加路由
    app.use(async (ctx, next) => await koaCompose((await plugins('koaPlugin')).data)(ctx, next))
        .use(async (ctx, next) => {
            // 动态路由
            const routers = await readKoaRouters();
            if (config.switch.dynamicRouter && routers.match(ctx.path, ctx.method).route) {
                // 路由匹配成功，执行这里的内容
                const routersMiddleware = routers.routes();
                let re = await routersMiddleware(ctx, next);
                if (!ctx.next) return re;
                delete ctx.next;
            }
            // 路由匹配失败或者存在 ctx.next 时，走传统路由
            return await next();
        }).use(completeFile);
}
