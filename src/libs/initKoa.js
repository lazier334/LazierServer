import Router from 'koa-router';
import koaCompose from './koaCompose.js';

import { fs, path, config } from './config.js';
import { completeFile, readKoaRouters } from './utils.js';
import { plugins } from './plugins.js';

/** 额外的路由 */
const AdditionalRouter = config.AdditionalRouter || new Router();
if (!config.AdditionalRouter) {
    config.AdditionalRouter = AdditionalRouter;
    AdditionalRouter.all('获取全部路由', '/system/getAllRouter', () => { });
}

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
            // 增加读取当前的所有接口
            if (ctx.path == '/system/getAllRouter') {
                // 读取所有的路由规则
                let re = readRouterLayers(routers.stack)                // 动态路由
                    .concat(readRouterLayers(AdditionalRouter.stack));  // 额外路由
                return ctx.body = re;
            }
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

/**
 * 读取 layer 对象列表
 * @param {[Router.Layer]} layers 
 */
function readRouterLayers(layers) {
    if (!layers) return;
    if (!Array.isArray(layers)) layers = [layers];
    return layers.map(layer => ({
        name: layer.name,
        path: typeof layer.path == 'string' ? layer.path : 'reg:' + layer.path.toString(),
        regexp: 'reg:' + layer.regexp.toString(),
        opts: layer.opts,
        paramNames: layer.paramNames,
        methods: layer.methods,
    }))
}