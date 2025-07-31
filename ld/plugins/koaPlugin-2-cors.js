import cors from '@koa/cors';
const corsMiddleware = cors();
/** @type {import('../../src/libs/config.js')} */
const { config } = process.G;

/**
 * koa中间件 跨域cors 插件
 * @param {import('koa').Context} ctx
 * @param {import('koa').Next} next
 */
export default async function koaPluginCors(ctx, next) {
    return config.switch.cors ? await corsMiddleware(ctx, next) : await next()
}