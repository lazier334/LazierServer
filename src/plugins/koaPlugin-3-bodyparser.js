import bodyParser from 'koa-bodyparser'
const bodyParserMiddleware = bodyParser()
/**
 * koa中间件 body参数格式化 插件
 * @param {import('koa').Context} ctx
 * @param {import('koa').Next} next
 */
export default async function koaPluginBodyParser(ctx, next) {
    return await bodyParserMiddleware(ctx, next)
}