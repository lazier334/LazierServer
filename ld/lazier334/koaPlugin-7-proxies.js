import url from 'url';
import http from 'http';
import https from 'https';
import { createKoaPlugin } from './types/index.js';

export default createKoaPlugin(async function koaPluginProxies(ctx, next) {
    const toDomain = ctx.query.toDomain;
    if (!toDomain) {
        return await next();
    }

    // 移除 toDomain 参数
    const parsedUrl = url.parse(ctx.url, true);
    delete parsedUrl.query.toDomain;
    delete parsedUrl.search;
    const targetPath = url.format(parsedUrl);

    // 构建目标 URL：如果 toDomain 包含协议则直接使用，否则默认 http://
    let targetUrl = toDomain;
    if (!/^https?:\/\//i.test(toDomain)) {
        targetUrl = `http://${toDomain}`;
    }

    const base = new URL(targetUrl);
    base.pathname = targetPath;
    base.search = parsedUrl.search || '';
    const finalUrl = base.href;

    // 重新解析最终 URL 用于 http(s) 请求
    const finalTarget = new URL(finalUrl);

    // 准备转发选项
    const options = {
        hostname: finalTarget.hostname,
        port: finalTarget.port || (finalTarget.protocol === 'https:' ? 443 : 80),
        path: finalTarget.pathname + finalTarget.search,
        method: ctx.method,
        headers: { ...ctx.headers },
    };

    // 删除可能导致问题的头部
    delete options.headers['host'];
    delete options.headers['connection'];
    // 可添加 X-Forwarded-* 等
    options.headers['x-forwarded-for'] = ctx.ip || ctx.ips.join(', ');

    // 根据协议选择模块
    const protocolModule = finalTarget.protocol === 'https:' ? https : http;

    return new Promise((resolve, reject) => {
        console.info('请求转发:', ctx.url, '->', finalUrl);
        const req = protocolModule.request(options, (res) => {
            ctx.status = res.statusCode;
            ctx.set(res.headers);
            ctx.body = res;
            resolve();
        });

        req.on('error', (err) => {
            ctx.status = 502;
            ctx.body = { error: 'Proxy error', details: err.message };
            resolve();
        });

        // 如果有请求体，管道转发
        if (ctx.request.body) {
            ctx.req.pipe(req);
        } else {
            req.end();
        }
    });
});