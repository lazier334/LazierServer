import { createKoaPlugin } from './types/index.ts';
import { config } from './libs/baseImport.js';

const corsMiddleware = cors();

/**
 * koa中间件 跨域cors 插件
 */
export default createKoaPlugin(async function koaPluginAutoCors(ctx, next) {
    // 该插件仅用于测试环境，正式环境请使用 koaPlugin-2-cors.js 插件
     return config.switch.autoCors ? await corsMiddleware(ctx, next) : await next();
})

/**
 * 自动全部跨域
 * @returns {Promise<void>}
 */
function cors() {
    // 通用过滤函数：清理空白+去重(支持转小写)+过滤非法字符+拼接
    const filter = (list, ignoreCase) => Array.from(new Set(
        list.map(item => !ignoreCase ? ('' + item).trim() : ('' + item).trim().toLowerCase())
            .filter(v => v && (/^[a-zA-Z0-9\-_]+$/).test(v))
    )).join(', ');
    const defHeaders = ['Content-Type', 'Authorization', 'Accept'];
    const defMethods = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH', 'HEAD'];
    return async (ctx, next) => {
        // 1. 读取请求中的核心跨域信息
        const origin = ctx.headers.origin || '';
        const reqMethod = ctx.headers['access-control-request-method'] || '';
        const reqHeaders = ctx.headers['access-control-request-headers'] || '';
        // 2. 生成允许的头/方法
        const allowHeaders = filter(defHeaders.concat(reqHeaders.split(/[,;\s]+/)), true);
        const allowMethods = filter(defMethods.concat([reqMethod]), true);
        // 3. 设置核心CORS头
        ctx.set({
            'Access-Control-Allow-Origin': origin,
            'Access-Control-Allow-Credentials': 'true',
            'Access-Control-Allow-Headers': allowHeaders,
            'Access-Control-Allow-Methods': allowMethods,
            'Access-Control-Max-Age': '86400'
        });
        // 4. 处理OPTIONS预检请求
        if (ctx.method === 'OPTIONS') return ctx.status = 204;
        return await next();
    };
}