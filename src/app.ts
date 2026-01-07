import Koa from 'koa';
import https from 'https';
import initKoa from './libs/initKoa.ts';
import websocketServer from './libs/websocketServer.ts';
import { fs, path, config } from './libs/config.ts';
import { plugins } from './libs/plugins.ts';

(async (): Promise<void> => {
    const app = new Koa();
    // 系统启动阶段
    await (await plugins('systemStart')).use({ fs, path, config, app });
    // 初始化 koa
    await initKoa(app);
    // 创建 HTTPS 服务器
    https.createServer(config.SSLOptions, app.callback()).listen(config['portHttps'],
        () => console.log(`https 服务器已运行，访问地址:  \x1b[33m https://localhost:${config['portHttps']} \x1b[0m`));
    // 创建 HTTP 服务器
    app.listen(config['portHttp'], () => console.log(`http  服务器已运行，访问地址:    http://localhost:${config['portHttp']}`));
    // 创建 WebSocket 服务器
    websocketServer(config);
})()