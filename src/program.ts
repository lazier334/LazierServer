
import fs from 'fs';
import path from 'path';
import { Command } from 'commander';
import defConfig from './libs/configDef.ts';

const __dirname = import.meta.dirname;
const nowDir = process.cwd();
const lsDir = path.join(__dirname, '../');
const runfile = path.join(__dirname, 'start.log');
const program = new Command();
/** 在主程序中运行的函数，此时已经初始化config完成 */
var callback = (main: () => Promise<void>, config: typeof defConfig) => { };

program.name('lazierserver')
    .description('LaizerServer 服务器')
    .version(Object.keys(defConfig.version).shift() || '-');

program.command('start', { isDefault: true })
    .option('-p, --port <number>', '指定端口号(https默认使用该端口+1作为配置)', '0')
    .description('启动服务器')
    .action(async (options) => {
        callback = (main, config) => {
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
        }
    });

program.command('restart').aliases(['reboot'])
    .option('-p, --port <number>', '指定端口号(https默认使用该端口+1作为配置)', '0')
    .description('重启服务器')
    .action(async () => {
        fs.unlinkSync(runfile);
        callback = (main, config) => {
            main();
        }
    });

program.command('adddir').aliases(['serverdir', 'add'])
    .description('添加服务器目录')
    .argument('[directory]', '服务器目录路径', process.cwd())
    .action(async (directory) => {
        callback = (main, config) => {
            const serverDirPath = path.join(config.dataPath, 'serverDir.json');
            const serverDir = JSON.parse(fs.readFileSync(serverDirPath, 'utf8'));
            // 检查是否路径不存在
            let nowDirR = path.resolve(directory);
            let serverDirR = serverDir.map((dir: string) => path.resolve(config.rootDir, dir));
            if (!serverDirR.includes(nowDirR)) {
                serverDirR.push(nowDirR);
                serverDirR.sort();
                fs.writeFileSync(serverDirPath, JSON.stringify(serverDirR, null, 2));
                console.log('指定路径已配置完成!', nowDirR);
                console.log('当前全部配置:', serverDirR);
            } else console.log('指定路径已存在!', nowDirR);
        }
    });

program.command('stop').aliases(['kill', 'halt'])
    .description('停止服务器')
    .action(async () => {
        console.log('正在停止服务器...');
        if (fs.existsSync(runfile))
            fs.unlinkSync(runfile);
        process.exit(0);
    });

program.parse(process.argv);

export {
    callback,
    program,
    runfile
}