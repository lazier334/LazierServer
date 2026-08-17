import Router from '@koa/router';
import { createKoaPlugin } from './types/index.js';
import { config } from './libs/index.js';

var cacheErrorApis = {};

/** 额外的路由 */
var additionalRouter = config.additionalRouter[import.meta.filename] || new Router();
if (!config.additionalRouter[import.meta.filename]) {
    config.additionalRouter[import.meta.filename] = additionalRouter;
    additionalRouter.all('获取响应代码为400及以上的接口访问数据', '/cacheErrorApis', () => { });
    additionalRouter.all('清空响应代码为400及以上的接口访问数据', '/cacheErrorApisClear', () => { });
}

/**
 * koa中间件 计数器 插件
 */
export default createKoaPlugin(async function koaPluginCounter(ctx, next) {
    // 计数器插件
    const start = Date.now();
    const reqInfo = {
        method: ctx.method,
        url: ctx.request.href,
        ip: ctx.ip,
        ips: ctx.ips,
        headers: ctx.headers,
        query: ctx.request.query,
        body: ctx.request.body,
    }
    if (config.logger.req) console.log(`--> ${ctx.method} ${ctx.url} ${JSON.stringify(reqInfo)}`);
    try {
        if (ctx.url == '/cacheErrorApis') {
            return ctx.body = cacheErrorApis;
        }
        if (ctx.url == '/cacheErrorApisClear') {
            ctx.body = cacheErrorApis;
            cacheErrorApis = {};
            return ctx.body;
        }
        await next();
        if (400 <= ctx.status && ctx.status < 500 && ctx.body == undefined) {
            const code = ctx.status;
            ctx.body = {
                code: ctx.status,
                data: ctx.body || 'Not Found'
            }
            ctx.status = code;
        }
    } catch (err) {
        console.error('接口发生错误', ctx.url, err);
        ctx.status = 500;
        ctx.body = {
            code: 500,
            data: err.message
        }
    }
    if (ctx.sendFileFromPath) ctx.set(config.headerNames.fileFrom, encodeURI(ctx.sendFileFromPath));
    if (config.logger.resp) console.log(`<-${400 <= ctx.status ? "x" : "-"}- [${ctx.status} ${ctx.method} ${Date.now() - start}ms] ${ctx.url}${ctx.sendFileFromPath ? ` (from: ${ctx.sendFileFromPath})` : ""}`);
    if (400 <= ctx.status) {
        if (!cacheErrorApis[ctx.status]) {
            cacheErrorApis[ctx.status] = {};
        }
        const pathname = ctx.url.split('?').shift();
        cacheErrorApis[ctx.status][pathname] = Date.now();
    }
})