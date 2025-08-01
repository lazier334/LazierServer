import { fs, path, config, getPluginsModule, importSysModule } from './libs/baseImport.js';
import { restartSystem } from './libs/sys-restart.js'
import send from 'koa-send';

const { plugins } = await getPluginsModule();
/** @type {import('../../src/libs/utils.js')} */
const utilsModule = await importSysModule('utils.js');
const { authUser, downloadFileToPath } = utilsModule;
const lc = {
    cacheData: {
        /** 更新的文件内容 */
        updateFiles: {},
        /** 运行cmd命令的内容 */
        runCmds: {},
    }
}


/**
 * 动态路由 system接口 插件，顺序为： 插件API > 文件API > HarAPI > 系统API
 * @param {import('koa-router')} router 路由
 */
export default function koaRouterSystem(router) {
    // 重启接口
    router.all('/system/restart', async (ctx, next) => {
        if (process.platform == 'win32') restartSystem(config.system.restart.restartCmdWin);
        else if (process.platform === 'darwin') restartSystem(config.system.restart.restartCmdMac);
        else restartSystem(config.system.restart.restartCmdLinux);
        ctx.body = result('重启中...');
    });

    // 关闭接口
    router.all('/system/shutdown', async (ctx, next) => {
        ctx.body = result('关机中...');
        setTimeout(() => process.exit(1), 1000);
    });

    // 接口：根目录重定向
    router.all(['/', '/index'], ctx => {
        const idnexPath = path.join(config.dataPath, 'web/index');
        ctx.redirect('/index.html?dir=' + idnexPath);
    });

    // 接口：首页按钮数据
    router.all("/system/indexData", async ctx => {
        const data = [];
        await (await plugins('indexData')).use(data);
        return ctx.body = result(data);
    });

    // 接口：设置是否开启自动补全，传递get参数则为仅查询
    router.all('/system/autocomplete', ctx => {
        if (!ctx.query.get) {
            let status = ctx.query.status;
            config.switch.autoComplete = status == undefined ? !config.switch.autoComplete : status;
        }
        console.info('当前自动补全的状态为', config.switch.autoComplete);
        ctx.body = result(config.switch.autoComplete);
    });

    // 接口：自动补全编辑页的文件匹配 /edit/vs/*
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

    // 接口：获取当前配置数据
    router.all("/system/config", async (ctx, next) => {
        if (!authUser(ctx).isAdmin) return next();

        ctx.body = result({
            ...config, additionalRouter: {
                'tip': '此字段仅为显示有哪些插件注册了额外路由，用于统计功能，此字段不可配置',
                '路由注册列表': Object.keys(config.additionalRouter)
            }
        });
    });

    // 接口：写入配置文件数据
    router.all("/system/setFile", async (ctx, next) => {
        if (!authUser(ctx).isAdmin) {
            return next();
        }
        const filepath = ctx.request.body.filepath;
        const filebody = ctx.request.body.filebody;
        fs.writeFileSync(filepath, filebody);
        ctx.body = result(filebody.length);
    });

    // 接口：获取配置文件数据
    router.all("/system/getFile", async (ctx, next) => {
        if (!authUser(ctx).isAdmin) {
            return next();
        }
        const filepath = ctx.request.query.filepath;
        ctx.body = result(fs.readFileSync(filepath, 'utf-8'));
    });

    // 接口：尝试补齐其他文件
    router.all("/system/fixUrls", async ctx => {
        ctx.body = result(config.fixUrls)
    });

    // 接口：读取版本信息
    router.all('/system/version', async (ctx) => {
        ctx.body = result(config.readVersion())
    });

    // 接口：读取服务器id
    router.all('/system/systemId', async (ctx) => {
        ctx.body = result(config.system.status.systemId)
    });

    // 接口：读取按钮数据
    router.all('/system/butsData', async (ctx) => {
        config.butsData.forEach(e => typeof e.update == 'function' ? e.update(e, config) : '');
        ctx.body = result(config.butsData);
    });

    // 接口：读取搜索快捷关键词按钮数据
    router.all('/system/searchButsData', async (ctx) => {
        const fp = path.join(config.dataPath, 'searchButsData.json');
        if (!fs.existsSync(fp)) fs.writeFileSync(fp, '{"searchKeywordButs":["清空数据","a","b","c"],"searchButtomButs":["清空数据","美元","英语","中文"]}');
        ctx.body = result(readUpdateFile(fp, (data) => JSON.parse(data)));
    });

    return router
}

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