import Koa from 'koa';
import https from 'https';
import { initKoa, createWebSocketServer } from './libs/initKoa.ts';
import { fs, path, config } from './libs/config.ts';
import { plugins } from './libs/plugins.ts';

(async (): Promise<void> => {
    const app = new Koa();
    // 系统启动阶段
    await (await plugins('systemStart')).use({ fs, path, config, app });
    // 初始化 koa
    await initKoa(app);
    // 启动监听端口空闲后启动服务器
    waitPortListen();

    /** 
     * 等待端口监听，每间隔 1 秒尝试一次  
     * 默认会等待3秒时间进行总共3次轮询去绑定特定的端口
     * @param {number} [num=3] 等待次数
     * @param {https.Server} server 服务器对象
     */
    function waitPortListen(num: number = 3, server: any = null): void {
        if (!server) {
            server = https.createServer(config.SSLOptions, app.callback());
            server.on('error', (error: any) => {
                if (0 < num) return setTimeout(() => waitPortListen(num - 1), 1000);
                else throw error;
            });
        }
        // 创建 HTTPS 服务器
        server.listen(config['portHttps'], () => {
            console.log(`https 服务器已运行，访问地址:  \x1b[33m https://localhost:${config['portHttps']} \x1b[0m`);
            // 创建 HTTP 服务器
            app.listen(config['portHttp'], () => console.log(`http  服务器已运行，访问地址:    http://localhost:${config['portHttp']}`));
            // 创建 WebSocket 服务器
            createWebSocketServer(config);
        });
    }
})()