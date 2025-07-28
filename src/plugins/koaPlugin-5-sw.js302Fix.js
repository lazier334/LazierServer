/**
 * @param {import('koa').Context} ctx
 * @param {import('koa').Next} next
 */
export default async function koaPluginDemo(ctx, next) {
    // 用于解决 sw.js 导致无法进行 302 跨域跳转的问题
    if (ctx.query.redirectApi == 'html') {
        ctx.redirect = function (url) {
            ctx.status = 200;
            ctx.type = 'text/html';
            ctx.body = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>跳转中...</title><script>window.location.href="${url}"</script></head><body><p>正在跳转到<a href="${url}">${url}</a>...</p></body></html>`;
        }
    }
    return await next();
}