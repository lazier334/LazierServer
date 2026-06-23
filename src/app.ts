#!/usr/bin/env node
import { callback, runfile } from './libs/program.ts';
import Koa from 'koa';
import http from 'http';
import https from 'https';
import chokidar from 'chokidar';
import { WebSocketServer } from 'ws';
import { plugins } from './libs/plugins.ts';
import { fs, path, config } from './libs/config.ts';
import { initKoa, bindWebSocketServer } from './libs/initKoa.ts';

callback(main, config)

async function main(): Promise<void> {
    const app = new Koa();
    // 系统启动阶段
    await (await plugins('systemStart')).use({ fs, path, config, app });
    // 初始化 koa
    await initKoa(app);
    // 启动监听端口空闲后启动服务器
    startServers();

    // 检查文件用于做删除文件时退出
    fs.writeFileSync(runfile, new Date().toLocaleString());
    chokidar.watch(runfile).on('unlink', async () => {
        console.warn('由于状态文件被删除, 正在退出服务器');
        process.exit(0);
    });

    /** 
     * 等待端口监听，每间隔 1 秒尝试一次  
     * 默认会等待3秒时间进行总共3次轮询去绑定特定的端口
     * @param {number} [num=3] 等待次数
     * @param {https.Server} server 服务器对象
     */
    function startServers(num: number = 3, server: any = null) {
        let port = config['portHttp'];
        if (!server) {
            // 1. 创建 HTTPS + WSS 共用服务器
            server = http.createServer(app.callback());
            server.on('error', (error: any) => {
                if (0 < num) return setTimeout(() => startServers(num - 1), 1000);
                else throw error;
            });
            bindWebSocketServer(new WebSocketServer({ server }));
        }
        server.listen(port, () => {
            console.log(` http|ws  服务器已运行:   http://localhost:${port} | ws://localhost:${port}`);

            // 2. 创建 HTTP + WS 共用服务器
            port = config['portHttps'];
            server = https.createServer(config.SSLOptions, app.callback());
            bindWebSocketServer(new WebSocketServer({ server }));
            server.listen(port, () => {
                console.log(`https|wss 服务器已运行: \x1b[33m https://localhost:${port} | wss://localhost:${port} \x1b[0m`);
                console.log('首次访问 wss 协议需要先访问 https 页面并信任证书');
            });
        });
    }
}