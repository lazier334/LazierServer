import cors from '@koa/cors';
import { config } from '../libs/config.js';
const corsMiddleware = cors();

/**
 * @param {import('koa').Context} ctx
 * @param {import('koa').Next} next
 */
export default async function koaPluginDemo(ctx, next) {
    return config.cors ? await corsMiddleware(ctx, next) : await next()
}