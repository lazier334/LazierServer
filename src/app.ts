#!/usr/bin/env node
import Koa from 'koa';
import http from 'http';
import https from 'https';
import { Command } from 'commander';
import { WebSocketServer } from 'ws';
import { initKoa, bindWebSocketServer } from './libs/initKoa.ts';
import { fs, path, config } from './libs/config.ts';
import { plugins } from './libs/plugins.ts';

const runfile = path.join(config.get__dirname(import.meta.url), 'start.log');
const program = new Command();
program.name('lazierserver')
    .description('LaizerServer 服务器')
    .version(Object.keys(config.version).shift() || '-');
program.command('start', { isDefault: true })
    .description('启动服务器')
    .action(main);
program.command('stop').alias('kill')
    .description('停止服务器')
    .action(async () => {
        console.log('正在停止服务器...');
        if (fs.existsSync(runfile))
            fs.unlinkSync(runfile);
    });
program.parse(process.argv);

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
    const interval = setInterval(() => {
        if (!fs.existsSync(runfile)) {
            console.warn('由于状态文件被删除, 正在退出服务器');
            clearInterval(interval);
            process.exit(0);
        }
    }, 1000);

    /** 
     * 等待端口监听，每间隔 1 秒尝试一次  
     * 默认会等待3秒时间进行总共3次轮询去绑定特定的端口
     * @param {number} [num=3] 等待次数
     * @param {https.Server} server 服务器对象
     */
    function startServers(num = 3, server: any = null) {
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
            console.log('');
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