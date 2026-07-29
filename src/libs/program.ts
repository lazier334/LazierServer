import fs from 'fs';
import path from 'path';
import { Command } from 'commander';
import defConfig from './configDef.ts';

const nowDir = process.cwd();
const lsDir = path.join(import.meta.dirname, '../../');
const runfile = path.join(import.meta.dirname, 'start.log');
const program = new Command();
/** 在主程序中运行的函数，此时已经初始化config完成 */
var callback = (main: () => Promise<void>, config: typeof defConfig) => { };
const getStartCallback = (options: any) => {
    return ((main, config) => {
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
    }) as typeof callback
}

program.name('lazierserver')
    .description('LaizerServer 服务器')
    .version(Object.keys(defConfig.version).shift() || '-', '-v, --version');

program.command('start', { isDefault: true })
    .option('-p, --port <number>', '指定端口号(https默认使用该端口+1作为配置)', '0')
    .description('启动服务器')
    .action(async (options) => {
        callback = getStartCallback(options)
    });

program.command('restart').aliases(['reboot'])
    .option('-p, --port <number>', '指定端口号(https默认使用该端口+1作为配置)', '0')
    .description('重启服务器')
    .action(async (options) => {
        fs.unlinkSync(runfile);
        callback = getStartCallback(options)
    });

program.command('clean').aliases(['clear'])
    .description('清理日志')
    .action(async () => {
        callback = (main, config) => {
            new Set(config.logger.dailyRotateFileList.map(e => path.dirname(e.filename))).forEach(dir => {
                console.log('清理目录:', dir)
                try {
                    if (fs.existsSync(dir)) {
                        fs.rmSync(dir, { recursive: true, force: true });
                    }
                } catch (err) {
                    console.log('清理失败', dir);
                    console.log(err);
                }
            })
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
        if (fs.existsSync(runfile)) {
            fs.unlinkSync(runfile);
        }
        process.exit(0);
    });

const files: Record<string, string> = {
    'indexData-1-temp.js': `import { createIndexData } from 'lazierserver/types';

export default createIndexData(async function indexData(arr) {
    arr.push(...[
        {
            icon: "",
            name: "{directory}",
            mark: "选项 - {directory}",
            urls: [
                {
                    text: "打开",
                    url: "/{directory}"
                }
            ],
        },
    ]);
    return arr;
})`,
    'koaRouter-1-temp.js': `import { createKoaRouter } from 'lazierserver/types';

export default createKoaRouter(function koaRouter(router, T) {
    // 接口
    router.all('/{directory}', async (ctx, next) => {
        /** @type {ctx & T} 完整的ctx提示信息 */
        const ectx = ctx;
        if (ectx.sendOptions?.filename) {
            // 示例: 在原本将要使用的文件名称前面加上前缀 _ 
            ectx.sendOptions.filename = '_' + ectx.sendOptions.filename;
            console.log(ectx.sendOptions.filename);
        } else {
            // 示例: 响应文字
            ctx.body = 'hello {directory}!';
        }
    });
    return router
})`,
    'package.json': `{
    "name": "{directory}",
    "version": "1.0.0",
    "description": "通过lazierserver创建的项目: {directory}",
    "license": "ISC",
    "author": "",
    "type": "module",
    "main": "index.js",
    "scripts": {
        "start":"ls334",
        "dev":"ls334"
    },
    "dependencies": {
    }
}
`,
}
program.command('create').aliases(['c', 'template'])
    .description('创建项目模版')
    .argument('[directory]', '文件夹名称', 'ls334')
    .action(async (directory) => {
        console.log('正在创建模版:', directory);
        const basedir = process.cwd();
        const targetPath = path.join(basedir, directory);
        if (!fs.existsSync(targetPath)) {
            fs.mkdirSync(targetPath);
            const dirname = path.basename(targetPath);
            for (const name in files) {
                fs.writeFileSync(path.join(targetPath, name), files[name].replaceAll('{directory}', dirname))
            }
            console.info(directory, '项目已创建');
            console.log('正在安装依赖中...');
            const { spawnSync } = await import('child_process');
            spawnSync('npm', ['i', 'lazierserver'], {
                cwd: targetPath,
                stdio: 'inherit',
                shell: process.platform === 'win32'
            });
            console.log(`\n依赖安装完成, 可使用以下命令快速启动项目: \ncd ${targetPath} \nls334`);
        } else console.error(directory, '文件(夹)已存在!目标路径:', targetPath)
        process.exit(0);
    });

program.command('update')
    .description('更新 LazierServer 版本')
    .action(async () => {
        // 检查版本，然后运行更新脚本
        const { checkVersion, runCmdAsync } = await import('./utils.ts');
        const ver = await checkVersion();
        if (ver) {
            // 运行 update.js 脚本
            const scriptFile = path.join(defConfig.dataPath, 'scripts/update.js');
            runCmdAsync('node', [scriptFile]).then(() => process.exit(0));
        } else {
            console.info('当前已经是最新版本!');
        }
    });

program.command('uninstall')
    .description('卸载 LazierServer')
    .action(async () => {
        // 运行 uninstall.js 脚本
        const scriptFile = path.join(defConfig.dataPath, 'scripts/uninstall.js');
        (await import('./utils.ts')).runCmdAsync('node', [scriptFile]).then(() => process.exit(0));
    });

program.parse(process.argv);

export {
    callback,
    program,
    runfile
}