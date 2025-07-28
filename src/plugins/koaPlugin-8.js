/**
 * @param {import('koa').Context} ctx
 * @param {import('koa').Next} next
 */
export default async function koaPluginDemo(ctx, next) {
    ctx.body = 'hello world! -- by demo';
    return next();
}