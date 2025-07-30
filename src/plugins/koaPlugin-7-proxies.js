
import koaProxies from 'koa-proxies';
import url from 'url';

/**
 * koa中间件 koa请求代理插件 插件
 * @param {import('koa').Context} ctx
 * @param {import('koa').Next} next
 */
export default async function koaPluginProxies(ctx, next) {
    const toDomain = ctx.query.toDomain;
    let proxy = false;
    if (toDomain) {
        // 删除 toDomain 参数
        const parsedUrl = url.parse(ctx.url, true);
        delete parsedUrl.query.toDomain;
        delete parsedUrl.search;

        // 更新请求 URL
        ctx.url = url.format(parsedUrl);
        proxy = true;
    }

    if (proxy) {
        // 使用 koa-proxies 转发请求
        return koaProxies(ctx, {
            target: `http://${toDomain}`,
            changeOrigin: true,
            logs: true,
        })(ctx, next);
    }

    return await next();
}
