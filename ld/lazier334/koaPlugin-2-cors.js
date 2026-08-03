import cors from '@koa/cors';
import { createKoaPlugin } from './types/index.js';

const corsMiddleware = cors();

/**
 * koa中间件 跨域cors 插件
 */
export default createKoaPlugin(async function koaPluginCors(ctx, next) {
    return await corsMiddleware(ctx, next)
})