import Router from 'koa-router';
import koaCompose from './koaCompose.js';

import { fs, path, config } from './config.js';
import { addRouters, completeFile, readKoaRouters } from './addRouters.js';
import koaProxies from '../plugins/koaPlugin-7-proxies.js';
import { plugins } from './plugins.js';

export default initKoa;

/**
 * 初始化Koa
 * @param {import('@types/koa')} app 
 */
async function initKoa(app) {
    const router = new Router();
    // 添加路由
    await addRouters(router);
    app.use(async (ctx, next) => await koaCompose((await plugins('koaPlugin')).data)(ctx, next))
        .use(async (ctx, next) => {
            // 动态路由
            const routers = await readKoaRouters();
            if (config.switch.dynamicRouter && routers.match(ctx.path, ctx.method).route) {
                // 路由匹配成功，执行这里的内容
                const routersMiddleware = routers.routes();
                return await routersMiddleware(ctx, next);
            } else {
                // 路由匹配失败，走传统路由
                return await next();
            }
        })
        .use(router.routes())
        .use(router.allowedMethods())
        .use(completeFile);
}

