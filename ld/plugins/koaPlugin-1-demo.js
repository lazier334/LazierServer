import { createKoaPlugin } from './types/index.js';
// 全局安装后请使用这种方式引入提示信息
// import { createKoaPlugin } from 'lazierserver/types';

/**
 * koa 中间件插件的demo
 */
export default createKoaPlugin(async function koaPluginDemo(ctx, next) {
    if (false) ctx.body = 'hello world! -- by demo';
    return await next();
})