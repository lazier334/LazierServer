#!/usr/bin/env node
import Koa from 'koa';
import http from 'http';
import https from 'https';
import chokidar from 'chokidar';
import { Command } from 'commander';
import { WebSocketServer } from 'ws';
import { initKoa, bindWebSocketServer } from './libs/initKoa.ts';
import { fs, path, config } from './libs/config.ts';
import { plugins } from './libs/plugins.ts';

const __dirname = import.meta.dirname;
const nowDir = process.cwd();
const lsDir = path.join(__dirname, '../');
const runfile = path.join(__dirname, 'start.log');
const program = new Command();

program.name('lazierserver')
    .description('LaizerServer 服务器')
    .version(Object.keys(config.version).shift() || '-');
program.command('start', { isDefault: true })
    .option('-p, --port <number>', '指定端口号(https默认使用该端口+1作为配置)', '0')
    .description('启动服务器')
    .action(async (options) => {
        // 检查如果运行的路径不是当前程序的路径里，那么就将其添加到当前的配置中
        if (!nowDir.replaceAll('/', '').replaceAll('\\', '').includes(lsDir.replaceAll('/', '').replaceAll('\\', ''))) {
            console.info('将当前文件夹作为web与plugin目录', nowDir);
            config.otherWebPath.push(nowDir);
            config.pluginDirs.push(nowDir);
        }
        // 修改端口
        options.port = Number(options.port)
        if (0 < options.port) {
            config.portHttp = options.port;
            config.portHttps = options.port + 1;
        }
        // 启动
        main();
    });
program.command('adddir').aliases(['serverdir', 'add'])
    .description('添加服务器目录')
    .argument('[directory]', '服务器目录路径', process.cwd())
    .action(async (directory) => {
        const serverDirPath = path.join(import.meta.dirname, 'serverDir.json');
        const serverDir = JSON.parse(fs.readFileSync(serverDirPath, 'utf8'));
        // 检查是否路径不存在
        let nowDirR = path.resolve(directory);
        let serverDirR = serverDir.map((dir: string) => path.resolve(dir));
        if (!serverDirR.includes(nowDirR)) {
            serverDirR.push(nowDirR);
            serverDirR.sort();
            fs.writeFileSync(serverDirPath, JSON.stringify(serverDirR, null, 2));
        }
    });
program.command('stop').aliases(['kill', 'halt'])
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