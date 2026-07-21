import bodyParser from 'koa-bodyparser'
import { createKoaPlugin } from './types/index.js';

const bodyParserMiddleware = bodyParser()

/**
 * koa中间件 body参数格式化 插件
 */
export default createKoaPlugin(async function koaPluginBodyParser(ctx, next) {
    return await bodyParserMiddleware(ctx, next)
})