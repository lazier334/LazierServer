import bodyParser from 'koa-bodyparser'
const bodyParserMiddleware = bodyParser()
/**
 * @param {import('koa').Context} ctx
 * @param {import('koa').Next} next
 */
export default async function koaPluginDemo(ctx, next) {
    return await bodyParserMiddleware(ctx, next)
}