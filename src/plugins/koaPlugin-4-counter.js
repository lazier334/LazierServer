import { config } from '../libs/config.js';

/**
 * koa中间件 计数器 插件
 * @param {import('koa').Context} ctx
 * @param {import('koa').Next} next
 */
export default async function koaPluginCounter(ctx, next) {
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
    if (config.logger.resp) console.log(`<-${400 <= ctx.status ? "x" : "-"}- [${ctx.status} ${ctx.method} ${Date.now() - start}ms] ${ctx.url}${ctx.sendFileFromPath ? ` (from: ${ctx.sendFileFromPath})` : ""}`);
}