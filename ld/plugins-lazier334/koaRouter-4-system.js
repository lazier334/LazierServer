import { createKoaRouter } from './types/index.ts';
import send from 'koa-send';
import { restartSystem } from './libs/sys-restart.js';
import { fs, path, config, getPluginsModule, getUtilsModule } from './libs/baseImport.js';
import { runCmd } from './utils/util-cmd.js';

const { plugins } = await getPluginsModule();
const utilsModule = await getUtilsModule();
const { authUser, downloadFileToPath, readKoaRouters } = utilsModule;
const lc = {
    cacheData: {
        /** 更新的文件内容 */
        updateFiles: {},
        /** 运行cmd命令的内容 */
        runCmds: {},
    }
}

/**
 * 动态路由 History 插件，顺序为： 插件API > 文件API > HarAPI > 系统API > vue的历史模式（或类似框架） > external
 */
export default createKoaRouter(function koaRouterSystem(router) {
    // 接口: 根目录重定向
    router.all(['/', '/index'], ctx => {
        const idnexPath = path.join(config.dataPath, 'web/index');
        ctx.redirect('/index.html?dir=' + idnexPath);
    });

    // 接口: 自动补全编辑页的文件匹配 /edit/vs/*
    router.all(/^\/edit\/vs\/.*$/, async (ctx) => {
        const filepath = path.join(config.tempDownDir, ctx.url);
        const url = 'https://unpkg.com/monaco-editor@0.33.0/min/vs' + ctx.url.substring(ctx.url.indexOf('/vs') + '/vs'.length);
        const fp = await downloadFileToPath(url, filepath);
        if (fp && fs.existsSync(fp)) {
            return await send(ctx, path.basename(fp), {
                root: path.dirname(fp),
                hidden: true
            });
        }
    });

    // 接口: 重启服务器
    router.all('系统路由 - 重启服务器', '/system/restart', async (ctx, next) => {
        if (!authUser(ctx).superAdmin) return next();

        if (process.platform == 'win32') restartSystem(config.system.restart.restartCmdWin);
        else if (process.platform === 'darwin') restartSystem(config.system.restart.restartCmdMac);
        else restartSystem(config.system.restart.restartCmdLinux);
        ctx.body = result('重启中...');
    });

    // 接口: 关闭服务器
    router.all('系统路由 - 关闭服务器', '/system/shutdown', async (ctx, next) => {
        if (!authUser(ctx).superAdmin) return next();

        ctx.body = result('关机中...');
        setTimeout(() => process.exit(1), 1000);
    });


    // 接口: 首页按钮数据
    router.all('系统路由 - 首页按钮数据', '/system/indexData', async ctx => {
        const data = [];
        await (await plugins('indexData')).use(data);
        return ctx.body = result(data);
    });

    // 接口: 设置是否开启自动补全，传递get参数则为仅查询
    router.all('系统路由 - 设置是否开启自动补全，传递get参数则为仅查询', '/system/autocomplete', ctx => {
        if (!ctx.query.get) {
            let status = ctx.query.status;
            config.switch.autoComplete = status == undefined ? !config.switch.autoComplete : status;
        }
        console.info('当前自动补全的状态为', config.switch.autoComplete);
        ctx.body = result(config.switch.autoComplete);
    });

    // 接口: 获取当前配置数据
    router.all('系统路由 - 获取当前配置数据', '/system/config', async (ctx, next) => {
        if (!authUser(ctx).isAdmin) return next();

        ctx.body = result({
            ...config, additionalRouter: {
                'tip': '此字段仅为显示有哪些插件注册了额外路由，用于统计功能，此字段不可配置',
                '路由注册列表': Object.keys(config.additionalRouter)
            }
        });
    });

    // 接口: 写入配置文件数据
    router.all('系统路由 - 写入配置文件数据', '/system/setFile', async (ctx, next) => {
        if (!authUser(ctx).isAdmin) {
            return next();
        }
        const filepath = ctx.request.body.filepath;
        const filebody = ctx.request.body.filebody;
        fs.writeFileSync(filepath, filebody);
        ctx.body = result(filebody.length);
    });

    // 接口: 获取配置文件数据
    router.all('系统路由 - 获取配置文件数据', '/system/getFile', async (ctx, next) => {
        if (!authUser(ctx).isAdmin) {
            return next();
        }
        const filepath = ctx.request.query.filepath;
        ctx.body = result(fs.readFileSync(filepath, 'utf-8'));
    });

    // 接口: 尝试补齐其他文件
    router.all('系统路由 - 尝试补齐其他文件', '/system/fixUrls', async ctx => {
        ctx.body = result(config.fixUrls)
    });

    // 接口: 读取版本信息
    router.all('系统路由 - 读取版本信息', '/system/version', async (ctx) => {
        ctx.body = result(config.readVersion())
    });

    // 接口: 读取服务器id
    router.all('系统路由 - 读取服务器id', '/system/systemId', async (ctx) => {
        ctx.body = result(config.system.status.systemId)
    });

    // 接口: 读取按钮数据
    router.all('系统路由 - 读取按钮数据', '/system/butsData', async (ctx) => {
        config.butsData.forEach(e => typeof e.update == 'function' ? e.update(e, config) : '');
        let butsData = config.butsData.concat(config.appendButsData);
        let user = {};
        try {
            user = authUser(ctx) || {};
        } catch (err) {
            // 权限校验失败
        }

        // 关闭 debug 模式时过滤部分功能
        if (!config.switch.debugMode) {
            butsData = butsData.filter(but => !but.debugMode);
        }

        if (!user.superAdmin) {
            // 超级管理员
            butsData = butsData.filter(but => !config.superAdminButsData.includes(but.text));
            if (!user.isAdmin) {
                // 管理员
                butsData = butsData.filter(but => !config.adminButsData.includes(but.text));

                if (!user.status) {
                    // 已登录用户
                    butsData = butsData.filter(but => !config.loginButsData.includes(but.text));
                }
            }
        }

        // 关闭 im 系统
        if (config.switch.closeIM) {
            butsData = butsData.filter(but => !but.text.includes('管理连接'));
        }

        // 关闭 upload 系统
        if (config.switch.closeUploads) {
            butsData = butsData.filter(but => !but.text.includes('文件上传'));
        }

        ctx.body = result(butsData);
    });

    // 接口: 读取搜索快捷关键词按钮数据
    router.all('系统路由 - 读取搜索快捷关键词按钮数据', '/system/searchButsData', async (ctx) => {
        const fp = path.join(config.dataPath, 'searchButsData.json');
        if (!fs.existsSync(fp)) fs.writeFileSync(fp, JSON.stringify({ "searchKeywordButs": ["清空数据", "工具", "本地", "测试"], "searchButtomButs": ["清空数据", "打开", "官网"] }, null, 2));
        ctx.body = result(readUpdateFile(fp, (data) => JSON.parse(data)));
    });

    // 接口: 获取全部路由
    router.all('系统路由 - 获取全部路由', '/system/getAllRouter', async (ctx) => {
        // 动态路由
        const routers = await readKoaRouters();
        // 读取所有的路由规则
        let re = readRouterLayers(routers.stack, '动态路由');
        Object.entries(config.additionalRouter).forEach(([k, v]) => {
            re = re.concat(readRouterLayers(v.stack, '额外路由 - ' + k))
        });
        return ctx.body = result(re);
    });

    // 接口：读取搜索快捷关键词按钮数据
    router.all('系统路由 - 开关系统代理(仅限windows)', '/system/systemProxy', async (ctx) => {
        /** @type {"127.0.0.1:8080"} 代理服务器地址 */
        const open = ctx.request.query.open;
        const opt = open ? '开启' : '关闭';
        try {
            if (open) {
                const proxyServer = ctx.request.query.proxyServer;
                await runCmd(`reg add "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings" /v ProxyEnable /t REG_DWORD /d 1 /f`);
                if (proxyServer) await runCmd(`reg add "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings" /v ProxyServer /t REG_SZ /d "${proxyServer}" /f`);
            } else {
                runCmd(`reg add "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings" /v ProxyEnable /t REG_DWORD /d 0 /f`)
            }

            await runCmd(`powershell -Command "& { Add-Type -TypeDefinition '[DllImport(\\\"user32.dll\\\")] public static extern int SendMessageTimeout(int, int, int, string, int, int, out int);'; $null = [System.Reflection.Assembly]::LoadWithPartialName('System.Windows.Forms'); }"`);
            // 会按下F5按键
            // await runCmd(`powershell -Command "& { Add-Type -TypeDefinition '[DllImport(\\\"user32.dll\\\")] public static extern int SendMessageTimeout(int, int, int, string, int, int, out int);'; $null = [System.Reflection.Assembly]::LoadWithPartialName('System.Windows.Forms'); [System.Windows.Forms.SendKeys]::SendWait('{F5}'); }"`);

            ctx.body = `已${opt}系统代理`;
        } catch (err) {
            console.log(`系统代理${opt}失败!`, err);
            ctx.body = `系统代理${opt}失败!` + err.message;
        }
    });

    router.all('系统路由 - 开关 whistle', '/system/whistle', async (ctx) => {
        const open = ctx.request.query.open;
        const command = open ? 'w2 start' : 'w2 stop';
        console.log('尝试执行命令(运行结果似乎不可见):', command, '如果未安装whistle, 请使用命令进行全局安装:', 'npm i -g whistle');
        runCmd(command);
        ctx.body = `已尝试${open ? '开启' : '关闭'}whistle, 如果未安装whistle, 请使用命令进行全局安装: npm i -g whistle`;
    });

    router.all('系统路由 - 打开web文件夹', '/system/openWeb', async (ctx) => {
        let filepath = ctx.request?.body?.filepath || ctx.request?.query?.filepath || config.rootDir;
        openFileExplorer(filepath);
        ctx.body = `尝试使用文件管理器打开文件夹: ${filepath}`

        // 打开文件管理器（支持Windows/Mac/Linux）
        function openFileExplorer(targetPath = '.') {
            const absolutePath = path.resolve(targetPath);

            let command;
            switch (process.platform) {
                case 'win32':
                    command = `explorer "${absolutePath}"`;
                    break;
                case 'darwin':
                    command = `open "${absolutePath}"`;
                    break;
                case 'linux':
                    command = `xdg-open "${absolutePath}"`;
                    break;
                default:
                    throw new Error(`Unsupported platform: ${process.platform}`);
            }
            runCmd(command).catch(err => console.error('打开文件失败', err));
        }
    });

    return router
})

/**
 * 响应数据
 * @param {any} data 
 * @param {string} msg 
 * @param {number} code 
 * @returns 
 */
function result(data, msg = '成功', code = 200) {
    return { code, msg, data }
}

/**
 * 读取文件大小更新的文件
 * @param {string} filepath - 要读取的文件路径
 * @returns {Buffer} - 文件的内容
 */
function readUpdateFile(filepath, handleData) {
    const mtimeMs = fs.statSync(filepath).mtimeMs;
    let cache = lc.cacheData.updateFiles[filepath];
    if (typeof cache != 'object') {
        cache = lc.cacheData.updateFiles[filepath] = { filepath };
    }
    if (cache.mtimeMs != mtimeMs) {
        cache.data = fs.readFileSync(filepath);
        if (typeof handleData == 'function') {
            cache.data = handleData(cache.data);
        }
    }
    cache.mtimeMs = mtimeMs;
    return cache.data;
}

/**
 * 读取 layer 对象列表
 * @param {[Router.Layer]} layers 
 * @param {string} remark 备注
 */
function readRouterLayers(layers, remark) {
    if (!layers) return;
    if (!Array.isArray(layers)) layers = [layers];
    return layers.map(layer => ({
        name: layer.name,
        path: typeof layer.path == 'string' ? layer.path : 'reg:' + layer.path.toString(),
        regexp: 'reg:' + layer.regexp.toString(),
        opts: layer.opts,
        paramNames: layer.paramNames,
        methods: layer.methods,
        remark: remark
    }))
}