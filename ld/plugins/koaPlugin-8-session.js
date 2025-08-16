
import session from 'koa-session';
import { config } from './libs/baseImport.js';

const sessionMiddleware = session(config.session, config.app);

/**
 * koa中间件 session 插件
 * @param {import('koa').Context} ctx
 * @param {import('koa').Next} next
 */
export default async function koaPluginProxies(ctx, next) {
    return await sessionMiddleware(ctx, next)
}