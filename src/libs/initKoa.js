import Router from 'koa-router';
import bodyParser from 'koa-bodyparser';

// const ET = require('./lib/init.js');
// const fs = require('fs');
// const Koa = require('koa');
// const path = require('path');
// const https = require('https');
// const send = require('koa-send');
// const cors = require('@koa/cors');
// const Router = require('koa-router');
// const bodyParser = require('koa-bodyparser');
// const Downloader = require('nodejs-file-downloader');
// const websocketServer = require('./lib/websocket-server.js');
// const redirectApi = require('./lib/send-redirectApi.js')
// const sendSameApi = require('./lib/send-sameApi.js')
// const koaProxies = require('./lib/koaProxies.js')
// const globalUtils = require('./lib/utils.js');
// const plugins = require('./lib/index.js');
// const Config = require('./lib/config.js');

import { fs, path, config } from './config.js';
import { addRouters, completeFile } from './addRouters.js';
import koaProxies from './koaProxies.js';

export default initKoa;

/**
 * 初始化Koa
 * @param {import('@types/koa')} app 
 */
async function initKoa(app) {
    const router = new Router();
    // 添加路由
    await addRouters(router);
    // 启用信任代理ip
    app.proxy = true;
    // 加载插件与路由
    if (config.cors) app.use(cors());
    app.use(bodyParser())
        .use(async (ctx, next) => {
            // 计数器插件
            const start = Date.now();
            const reqInfo = {
                method: ctx.method,
                url: ctx.request.href,
                ip: ctx.ip,
                ips: ctx.ips,
                headers: ctx.headers,
                query: ctx.request.query,
                body: ctx.request.body,
            }
            moreLog(`--> ${ctx.method} ${ctx.url} ${JSON.stringify(reqInfo)}`);
            try {
                await next();
                if (400 <= ctx.status && ctx.status < 500 && ctx.body == undefined) {
                    const code = ctx.status;
                    ctx.body = {
                        code: ctx.status,
                        data: ctx.body || 'Not Found'
                    }
                    ctx.status = code;
                }
            } catch (err) {
                console.error('接口发生错误', ctx.url, err);
                ctx.status = 500;
                ctx.body = {
                    code: 500,
                    data: err.message
                }
            }
            console.log(`<-${400 <= ctx.status ? "x" : "-"}- [${ctx.status} ${ctx.method} ${Date.now() - start}ms] ${ctx.url}${ctx.sendFileFromPath ? ` (from: ${ctx.sendFileFromPath})` : ""}`);
        }).use(async (ctx, next) => {
            // 用于解决 sw.js 导致无法进行 302 跨域跳转的问题
            if (ctx.query.redirectApi == 'html') {
                ctx.redirect = function (url) {
                    ctx.status = 200;
                    ctx.type = 'text/html';
                    ctx.body = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>跳转中...</title><script>window.location.href="${url}"</script></head><body><p>正在跳转到<a href="${url}">${url}</a>...</p></body></html>`;
                }
            }
            return await next();
        }).use(async (ctx, next) => {
            // 如果路径以 / 结尾，则修改为 /index.html
            if (ctx.path.endsWith('/') && !ctx.query.dir) {
                ctx.oldPath = ctx.path;
                ctx.path = ctx.path + 'index.html';
                console.log('重写pathname', ctx.oldPath, '->', ctx.path);
            }
            return await next();
        }).use(koaProxies)
        .use(router.routes())
        .use(router.allowedMethods())
        .use(completeFile);
}

function moreLog(...args) {
    if (config.moreLog) console.log(...args)
}
