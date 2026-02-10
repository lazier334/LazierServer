import type Koa from 'koa';
import koaCompose from './koaCompose.ts';
import { config } from './config.ts';
import { completeFile, readKoaRouters } from './utils.ts';
import { plugins } from './plugins.ts';

export default initKoa;

/**
 * 初始化Koa
 * @param app 
 */
async function initKoa(app: Koa): Promise<void> {
    // 添加路由
    app.use(async (ctx: Koa.DefaultContext, next: Koa.Next) => {
        return await koaCompose((await plugins('koaPlugin')).data)(ctx as any, next)
    }).use(async (ctx: Koa.DefaultContext, next: Koa.Next) => {
        // 动态路由
        const routers = await readKoaRouters();
        if (config.switch.dynamicRouter && routers.match(ctx.path, ctx.method).route) {
            // 路由匹配成功，执行这里的内容
            const routersMiddleware = routers.routes();
            let re = await routersMiddleware(ctx as any, next);
            if (!ctx.next) return re;
            delete ctx.next;
        }
        // 路由匹配失败或者存在 ctx.next 时，走传统路由
        return await next();
    }).use(completeFile);
}