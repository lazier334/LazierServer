import session from 'koa-session';
import { config } from './libs/baseImport.js';
import { createKoaPlugin } from './types/index.ts';

const sessionMiddleware = session(config.session, config.app);

/**
 * koa中间件 session 插件
 */
export default createKoaPlugin(async function koaPluginSession(ctx, next) {
    return await sessionMiddleware(ctx, next)
})