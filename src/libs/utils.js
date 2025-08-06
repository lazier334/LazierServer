import { plugins, getAllPlugin, getPlguinUpdateTime } from './plugins.js';
import { fs, path, config, getNowFileStorage } from './config.js';
import Router from '@koa/router';
import Downloader from 'nodejs-file-downloader';
import https from 'https';

// 创建忽略证书验证的 Agent
const insecureAgent = new https.Agent({
    rejectUnauthorized: false
});

/** 本地存储 LocalStorage */
const ls = getNowFileStorage(import.meta.filename);
/** 文件列表缓存 */
ls.apListCache = [];
/** 文件列表的时间戳映射 */
ls.apListMap = {};
/**
 * 路由缓存
 * @type {import('@koa/router')}
 */
ls.routersCache = null;
/** 上次刷新时间 */
ls.lastRefreshTime = 0;

const AdminUser = {
    /** 用户id */
    "userId": 0,
    /** 状态 */
    "status": "在线",
    /** 用户名 */
    "username": "admin",
    /** 密码 */
    "password": "-",
    /** 最后登录时间 */
    "lastUpdateTime": 1745751359079,
    /** 账号失效时间 */
    "deadline": 4102358400000,
    /** 是否是管理员 */
    "isAdmin": true,
    /** 是否是超级管理员 */
    "superAdmin": true
}

export {
    authUser,
    allowLocalOnly,
    completeFile,
    readKoaRouters,
    downloadFileToPath,
};
/**
 * 默认本机发起的请求信息全都是超级管理员
 * @param {*} ctx 
 * @returns {AdminUser} 用户信息
 */
function authUser(ctx) {
    try {
        if (allowLocalOnly(ctx)) return AdminUser;
    } catch (error) {
        console.log('权限校验失败', error)
    }
}

// 仅允许本机请求的中间件
function allowLocalOnly(ctx) {
    const ip = ctx.ip || ctx.request.ip;
    return ip === '::1' || ip === '127.0.0.1';
}


/** 补全文件的koa插件，会使用 domains 里面的域名逐个尝试下载文件 */
async function completeFile(ctx, next) {
    if (config.switch.autoComplete) {
        let downloadedFile = null;
        const api = ctx.path;
        const url = new URL(ctx.request.href);
        url.port = "";

        for (const domain of config.autoCompleteDomains) {
            url.host = domain;
            const localPath = path.join(config.rootDir, url.hostname, api);
            console.debug("[尝试下载]", url.href);
            downloadedFile = await downloadFileToPath(url.href, localPath);
            if (downloadedFile) {
                return await sendFile(ctx, path.basename(downloadedFile), {
                    root: path.dirname(downloadedFile),
                    hidden: true
                });
            }
        }
    }
    await next();
}

/**
 * 获取动态的路由
 * @returns {Router}
 */
async function readKoaRouters() {
    if (!config.switch.dynamicOperation && ls.routersCache) return ls.routersCache;
    let apList = await getAllPlugin('koaRouter');

    // 检测路由插件是否有新增或删除
    let refresh = apList.length != ls.apListCache.length;

    // 检测路由插件是否有更名
    if (!refresh) {
        apList.join();
        refresh = apList.join() != ls.apListCache.join();
    }

    // 检测路由文件更新时间是否有变动，为了降低性能消耗，10秒钟扫描一次
    if (ls.lastRefreshTime + config.times.koaRouterPlugin < Date.now()) {
        const alm = ls.apListMap;
        ls.apListMap = {};
        apList.forEach(fp => {
            let time = getPlguinUpdateTime(fp);
            if (alm[fp] != time) refresh = true;
            ls.apListMap[fp] = time;
        });
    }

    // 刷新路由
    if (refresh) {
        const koaRouters = await plugins('koaRouter');
        // 清空 router 后重新添加，如果没有缓存则创建
        const router = ls.routersCache || new Router();
        // 清空路由列表
        router.stack.splice(0, router.stack.length);
        // 使用路由插件添加路由
        koaRouters.use(router);
        // 保存路由缓存
        ls.routersCache = router;
        // 保存路由文件列表缓存
        ls.apListCache = apList;
    }
    return ls.routersCache;
}

/**
 * 会自动使用http和https尝试下载
 * 
 * 下载文件到指定的路径，里面使用了代理，需要开启代理并且配置正确才可以正常下载
 * 如果不需要代理可以将其配置为 "假" 值
 * @param {string} url - 下载文件的 URL
 * @param {string} filepath - 文件保存的路径
 * @param {string} orgUrl - 原始链接，如果传递这个参数为真，那么将不会尝试另一种协议的下载
 * @returns {Promise<string|undefined>} 文件最终存放的文件路径，下载失败则为未定义
 */
async function downloadFileToPath(url, filepath, orgUrl) {
    try {
        fs.mkdirSync(path.dirname(filepath), { recursive: true });
        const downloader = new Downloader({
            url: url,
            httpsAgent: insecureAgent,
            timeout: config.times.timeout || 30 * 1000,
            directory: path.dirname(filepath), // 保存文件的目录
            fileName: path.basename(filepath), // 保存文件的名称
            cloneFiles: false,
            ...(config.proxy ? { proxy: config.proxy } : {})
        });
        filepath = ((await downloader.download()).filePath || filepath).replace(/\\/g, '/');
        console.info(`[文件已下载至路径]: \x1b[32m${filepath}\x1b[0m`);
        return filepath;
    } catch (error) {
        if (!orgUrl) {
            return await downloadFileToPath(url.startsWith('https://') ?
                url.replace('https://', 'http://') :
                url.replace('http://', 'https://'), filepath, url);
        }
        const errMsg = error.message || (typeof error.stack == 'string' ? error.stack.split('\n').shift() : '');
        console.debug(error)
        console.error([`[下载文件出现异常]: 双协议均下载失败，代理(proxy)配置: ${config.proxy ? config.proxy : '未开启'}`, orgUrl, url, `主要错误信息 (${errMsg})`].join('\n'));
        console.debug(error.stack);
    }
}