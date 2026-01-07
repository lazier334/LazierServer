import { createKoaPlugin } from './types/index.ts';

/**
 * koa 中间件插件的demo
 */
export default createKoaPlugin(async function koaPluginDemo(ctx, next) {
    if (false) ctx.body = 'hello world! -- by demo';
    return await next();
})