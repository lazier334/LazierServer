import './base.js';
import Koa from 'koa';
import https from 'https';
import { fs, path, config } from './libs/config.js';
import initKoa from './libs/initKoa.js';
import websocketServer from './libs/websocketServer.js';
import { plugins } from './libs/plugins.js';

(async () => {
    await (await plugins('sysStart')).use({ fs, path, config });

    const app = new Koa();
    await initKoa(app);
    // 创建 HTTPS 服务器
    https.createServer(config.SSLOptions, app.callback()).listen(config['portHttps'],
        () => console.log(`https 服务器已运行，访问地址:  \x1b[33m https://localhost:${config['portHttps']} \x1b[0m`));
    // 创建 HTTP 服务器
    app.listen(config['portHttp'], () => console.log(`http  服务器已运行，访问地址:    http://localhost:${config['portHttp']}`));
    // 创建 WebSocket 服务器
    websocketServer(config);
})()
