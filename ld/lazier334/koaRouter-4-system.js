import send from 'koa-send';
import { runCmd } from './utils/util-cmd.js';
import sysproxy from '@mihomo-party/sysproxy';
import { createKoaRouter } from './types/index.js';
import { restartSystem } from './libs/sys-restart.js';
import { fs, path, config, getPluginsModule, getUtilsModule } from './libs/baseImport.js';

const { plugins, getAllPlugin } = await getPluginsModule();
const utilsModule = await getUtilsModule();
const { authUser, downloadFileToPath, readKoaRouters, checkVersion, runCmdAsync } = utilsModule;
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
export default createKoaRouter(function koaRouterSystem(router, T) {

    // #region 系统接口

    router.all('接口: 如果是访问首页则检测权限并返回对应的版本', '/index.html', async (ctx, next) => {
        /** @type {ctx & T} */
        const ectx = ctx;
        if (ectx.sendOptions?.opts.root.replaceAll('\\', '/').endsWith('web/web.index')) {
            if (!authUser(ctx)?.superAdmin) {
                // 用户版为把 'isAdmin: true,' 改成 'isAdmin: false,' 
                let html = fs.readFileSync(path.join(ectx.sendOptions.opts.root, ectx.sendOptions.filename), 'utf8');
                ctx.type = 'text/html; charset=utf-8';
                ctx.body = html.replaceAll('isAdmin: true,', 'isAdmin: false,');
            }
        }
    });

    // 接口: 根目录重定向
    router.all('接口: 根目录重定向', '/', ctx => {
        const idnexPath = path.join(config.dataPath, 'web/index');
        ctx.redirect('/index.html?dir=' + idnexPath);
    });
    router.all('接口: 根目录重定向', '/index', ctx => {
        const idnexPath = path.join(config.dataPath, 'web/index');
        ctx.redirect('/index.html?dir=' + idnexPath);
    });

    // 接口: 自动补全编辑页的文件匹配 /edit/vs/*
    router.all('接口: 自动补全编辑页的文件匹配', /^\/edit\/vs\/.*$/, async (ctx, next) => {
        if (ctx.notCompleteFile) return await next();
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
        if (!authUser(ctx)?.superAdmin) return next();
        restartSystem();
        ctx.body = result('重启中...');
    });

    // 接口: 关闭服务器
    router.all('系统路由 - 关闭服务器', '/system/shutdown', async (ctx, next) => {
        if (!authUser(ctx)?.superAdmin) return next();

        ctx.body = result('关机中...');
        setTimeout(() => process.exit(1), 1000);
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
    // 接口: 获取路由插件的顺序
    router.all('系统路由 - 获取路由插件的顺序', '/system/getRouterSort', async (ctx) => {
        // 读取所有的路由插件的顺序
        let re = await getAllPlugin('koaRouter');
        return ctx.body = result(re);
    });

    // #endregion 
    // #region 配置相关

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

        ctx.body = result(butsData);
    });

    // 接口: 读取搜索快捷关键词按钮数据
    router.all('系统路由 - 读取搜索快捷关键词按钮数据', '/system/searchButsData', async (ctx) => {
        const fp = path.join(config.dataPath, 'searchButsData.json');
        if (!fs.existsSync(fp)) fs.writeFileSync(fp, JSON.stringify({ "searchKeywordButs": ["清空数据", "工具", "本地", "测试"], "searchButtomButs": ["清空数据", "打开", "官网"] }, null, 2));
        ctx.body = result(readUpdateFile(fp, (data) => JSON.parse(data)));
    });

    // #endregion 
    // #region 系统操作

    router.all('系统路由 - 更新版本', '/system/update', async (ctx, next) => {
        /** @type {ctx & T} */
        const ectx = ctx;
        const { tag, update } = ectx.query;
        // 检查版本，然后运行更新脚本
        const ver = await checkVersion();
        let verTag = 'latest';
        if (tag == 'next') {
            ver.update = Number(ver.now.replace(/[-.]/g, '')) < Number(ver.next.replace(/[-.]/g, ''));
            verTag = 'next';
        }

        if (update && authUser(ctx)?.superAdmin) {
            // 通过接口更新时强制更新，因为有重装的需求，版本检测已在前端制作
            if (true || ver.update) {
                // 运行 update.js 脚本
                const scriptFile = path.join(config.dataPath, 'scripts/update.js');
                if (fs.existsSync(scriptFile)) {
                    ctx.body = result(ver, `正在尝试更新系统版本到 ${verTag} 版本! 更新成功后将重启系统`);
                    setTimeout(() => {
                        runCmdAsync('node', [
                            scriptFile,
                            '--tag=' + verTag,
                            // 将当前的启动命令转成base64带过去
                            '--run=' + Buffer.from(JSON.stringify(process.argv), 'utf8').toString('base64')
                        ]).then(() => process.exit(0));
                    }, 2000);
                } else {
                    ctx.body = result(ver, '更新脚本不存在!');
                }
            } else {
                ctx.body = result(ver, '当前已经是最新版本!');
            }
        } else {
            ctx.body = result(ver, ver.update ? '存在新版本!' : '当前已经是最新版本!');
        }
    });

    // 接口：读取搜索快捷关键词按钮数据
    router.all('系统路由 - 开关系统代理', '/system/systemProxy', async (ctx) => {
        /** @type {"127.0.0.1:8080"} 代理服务器地址 */
        const open = ctx.request.query.open == 'true';
        try {
            if (open) {
                const host = ctx.request.query.host || '127.0.0.1';
                const port = ctx.request.query.port || '7890';
                const bypass = ctx.request.query.bypass;
                if (!bypass) throw new Error('参数 bypass 不合法! 示例: "*.example.com;localhost;127.*;192.168.*"');
                // 开启代理
                sysproxy.triggerManualProxy(true, host, parseInt(port, 10), bypass);
                ctx.body = `已开启系统代理, 代理服务器 ${host}:${port} 跳过规则: "${bypass}"`;
            } else {
                // 关闭代理
                sysproxy.triggerManualProxy(false, '', 0, '');
                ctx.body = `已关闭系统代理`;
            }
        } catch (err) {
            let msg = `系统代理${open ? '开启' : '关闭'}失败!`;
            console.log(msg, err);
            ctx.body = msg + err.message;
        }
    });

    router.all('系统路由 - 开关 whistle', '/system/whistle', async (ctx) => {
        const open = ctx.request.query.open;
        const command = open ? 'w2 start' : 'w2 stop';
        try {
            console.log('尝试执行命令:', command, '如果未安装whistle, 请使用命令进行全局安装:', 'npm i -g whistle');
            let msg = await runCmd(command);
            ctx.body = `${open ? '开启' : '关闭'}whistle成功\n结果: ${msg.stdout}`;
        } catch (err) {
            console.log(`${open ? '开启' : '关闭'}whistle失败`, err)
            ctx.body = `${open ? '开启' : '关闭'}whistle失败, 如果未安装whistle, 请使用命令进行全局安装: npm i -g whistle\n错误信息: ${err.message}`;
        }
    });

    router.all('系统路由 - 打开文件夹', '/system/openCwd', async (ctx) => {
        let filepath = ctx.request?.body?.filepath || ctx.request?.query?.filepath || process.cwd();
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
            runCmd(command).catch(err => {
                if (err.message != 'Command failed with code 1') {
                    console.error('打开文件失败', err)
                }
            });
        }
    });

    // #endregion 
    // #region 版权相关接口

    router.all('系统路由 - 版权主页面文件处理', '/system/copyright', async (ctx, next) => {
        /** @type {ctx & T} */
        const ectx = ctx;
        if (!ectx.sendFileFromPath) return;
        ctx.type = 'text/html; charset=utf-8';
        ctx.body = fs.readFileSync(ectx.sendFileFromPath, 'utf8').replaceAll('YYYY', new Date().getFullYear())
            .replaceAll('公司名称', config.copyright.copyright ?? config.copyright.companyName)
            .replaceAll('备案号', config.copyright.icp);
        if (config.copyright.icp === '') {
            ctx.body = ctx.body.replaceAll('<a href="https://beian.miit.gov.cn/" target="_blank"></a> |', '')
        }
    });
    router.all('系统路由 - 版权联系方式文件处理', '/system/contact', async (ctx, next) => {
        /** @type {ctx & T} */
        const ectx = ctx;
        if (!ectx.sendFileFromPath) return;
        ctx.body = fs.readFileSync(ectx.sendFileFromPath, 'utf8').replaceAll('lazier334@lazier334.com', config.copyright.contact)
    });
    router.all('系统路由 - 版权隐私政策文件处理', '/system/privacy', async (ctx, next) => {
        /** @type {ctx & T} */
        const ectx = ctx;
        if (!ectx.sendFileFromPath) return;
        ctx.body = fs.readFileSync(ectx.sendFileFromPath, 'utf8').replaceAll('隐私政策', config.copyright.privacy)
    });
    router.all('系统路由 - 版权使用条款文件处理', '/system/terms', async (ctx, next) => {
        /** @type {ctx & T} */
        const ectx = ctx;
        if (!ectx.sendFileFromPath) return;
        ctx.body = fs.readFileSync(ectx.sendFileFromPath, 'utf8').replaceAll('使用条款', config.copyright.terms)
    });

    // #endregion 

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