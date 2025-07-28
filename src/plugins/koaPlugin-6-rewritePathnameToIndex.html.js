/**
 * @param {import('koa').Context} ctx
 * @param {import('koa').Next} next
 */
export default async function koaPluginDemo(ctx, next) {
    // 如果路径以 / 结尾，则修改为 /index.html
    if (ctx.path.endsWith('/') && !ctx.query.dir) {
        ctx.oldPath = ctx.path;
        ctx.path = ctx.path + 'index.html';
        console.log('重写pathname', ctx.oldPath, '->', ctx.path);
    }
    return await next();
}