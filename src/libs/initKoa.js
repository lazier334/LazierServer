import Router from 'koa-router';
import koaCompose from './koaCompose.js';

import { fs, path, config } from './config.js';
import { addRouters, completeFile } from './addRouters.js';
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
        // .use(router.routes())
        // .use(router.allowedMethods())
        .use(completeFile);
}