import type Application from 'koa';
import https from 'https';
import send from 'koa-send';
import Router from '@koa/router';
import { spawn } from 'child_process';
import { Downloader } from 'nodejs-file-downloader';
import { fs, path, config, getNowFileStorage } from './config.ts';
import { plugins, getAllPlugin, getPlguinUpdateTime } from './plugins.ts';

interface User {
    /** 用户id */
    userId: number;
    /** 状态 */
    status: string;
    /** 用户名 */
    username: string;
    /** 密码 */
    password: string;
    /** 最后登录时间 */
    lastUpdateTime: number;
    /** 账号失效时间 */
    deadline: number;
    /** 是否是管理员 */
    isAdmin: boolean;
    /** 是否是超级管理员 */
    superAdmin: boolean;
}

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

const AdminUser: User = {
    "userId": 0,
    "status": "在线",
    "username": "admin",
    "password": "-",
    "lastUpdateTime": 1745751359079,
    "deadline": 4102358400000,
    "isAdmin": true,
    "superAdmin": true
}

type AuthorizationVerifyFunction = (ctx: Application) => User | undefined;
interface Authorization {
    /**
     * 默认本机发起的请求信息全都是超级管理员
     * @param ctx 
     * @returns 用户信息
     */
    verify: AuthorizationVerifyFunction;
}

/**
 * 权限管理对象，因为使用es模块体系导致导出的 authUser 函数无法被重写  
 * 所以使用一个可变对象来保存权限校验函数，方便重写
 */
const authorization: Authorization = {
    verify(ctx) {
        try {
            if (allowLocalOnly(ctx)) return AdminUser;
        } catch (error) {
            console.log('权限校验失败', error)
        }
    }
}

export {
    authorization,
    authUser,
    updateAuthUser,
    allowLocalOnly,
    completeFile,
    readKoaRouters,
    downloadFileToPath,
    checkVersion,
    runCmdAsync
};

/**
 * 默认本机发起的请求信息全都是超级管理员
 * @param ctx 
 * @returns 用户信息
 */
function authUser(ctx: Application): User | undefined {
    return authorization.verify(ctx);
}

/**
 * 更新权限校验函数
 * @param fun 权限校验函数
 * @returns 权限校验函数
 */
function updateAuthUser(fun: AuthorizationVerifyFunction): AuthorizationVerifyFunction {
    return authorization.verify = fun;
}

// 仅允许本机请求的中间件
function allowLocalOnly(ctx: Application): boolean {
    // @ts-ignore
    const ip = ctx.ip || ctx.request.ip;
    return ip === '::1' || ip === '127.0.0.1';
}


/** 
 * 补全文件的koa插件，会使用 domains 里面的域名逐个尝试下载文件。  
 * 设置标记 `ctx.notCompleteFile = true` 可以关闭补全功能
 */
async function completeFile(ctx: any, next: Function): Promise<void | string> {
    if (!ctx.notCompleteFile && config.switch.autoComplete) {
        let downloadedFile: string | undefined | null = null;
        const api = ctx.path;
        const url = new URL(ctx.request.href);
        url.port = "";

        for (const domain of config.autoCompleteDomains) {
            url.host = domain;
            const localPath = path.join(config.rootDir, url.hostname, api);
            console.debug("[尝试下载]", url.href);
            downloadedFile = await downloadFileToPath(url.href, localPath);
            if (downloadedFile) {
                return await send(ctx, path.basename(downloadedFile), {
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
 * @returns Router
 */
async function readKoaRouters(): Promise<Router> {
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
        apList.forEach((fp: string) => {
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
        await koaRouters.use(router);
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
 * 当 url == orgUrl 的时候，日志只会显示 url 
 * 下载文件到指定的路径，里面使用了代理，需要开启代理并且配置正确才可以正常下载
 * 如果不需要代理可以将其配置为 "假" 值
 * @param url - 下载文件的 URL
 * @param filepath - 文件保存的路径
 * @param orgUrl - 原始链接，如果传递这个参数为真，那么将不会尝试另一种协议的下载
 * @returns 文件最终存放的文件路径，下载失败则为未定义
 */
async function downloadFileToPath(url: string, filepath: string, orgUrl?: string): Promise<string | undefined> {
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
    } catch (err) {
        const error = err as Error;
        if (!orgUrl) {
            return await downloadFileToPath(url.startsWith('https://') ?
                url.replace('https://', 'http://') :
                url.replace('http://', 'https://'), filepath, url);
        }
        const errMsg = error.message || (typeof error.stack == 'string' ? error.stack.split('\n').shift() : '');
        console.debug(error)
        if (url == orgUrl) {
            console.error([`[下载文件出现异常]: 下载失败，代理(proxy)配置: ${config.proxy ? config.proxy : '未开启'}`, url, `主要错误信息 (${errMsg})`].join('\n'));
        } else {
            console.error([`[下载文件出现异常]: 双协议均下载失败，代理(proxy)配置: ${config.proxy ? config.proxy : '未开启'}`, orgUrl, url, `主要错误信息 (${errMsg})`].join('\n'));
        }
        console.debug(error.stack);
    }
}

/**
 * 异步开启子线程运行命令
 * @param command 命令
 * @param args 参数
 * @param no1sResolve 不进行1秒 resolve
 * @param resolve 默认情况下运行1秒后会执行该回调，code==0则为正常运行结束，结束1秒后才运行这个回调
 */
function runCmdAsync(command: string, args: string[], no1sResolve: boolean = false) {
    return new Promise((resolve, reject) => {
        console.log('运行命令:', command, args);
        const child = spawn(command, args, {
            stdio: 'inherit',   // 将输出重定向到当前控制台
            shell: true,        // windows需要使用 shell 执行命令
        });
        // clsoe事件需要等待启动的程序运行结束，所以一般不会走这里面的代码
        child.on('close', (code: any) => setTimeout(() => resolve(code), 1000));
        // 确保子进程启动后再退出当前进程，不能立刻退出
        if (!no1sResolve) child.on('spawn', () => setTimeout(resolve, 1000));
    });
}
type Version = { next: string, latest: string, now: string, update: boolean };
/**
 * 检查最新版本并检测 latest 版本是否有更新
 */
async function checkVersion(): Promise<Version | undefined> {
    let re = { update: false } as Version;
    try {
        const packageJSON = JSON.parse(fs.readFileSync(path.join(import.meta.dirname, '../../package.json'), 'utf8'));
        const version = packageJSON.version;
        re.now = version;
        const res = await fetch('https://registry.npmjs.org/-/package/lazierserver/dist-tags');
        const verData = await res.json() as { "next": "1.3.6-26072700", "latest": "1.3.5" };
        console.info('当前版本:', version, '最新版本:', verData);
        re.next = verData.next;
        re.latest = verData.latest;
        // 检测 latest 是否需要更新版本
        re.update = Number(re.now.split('-').shift()?.replaceAll('.', '')) < Number(re.latest.split('-').shift()?.replaceAll('.', ''));
    } catch (err) {
        console.error('检查版本时出现异常:', err)
    }
    return re;
}
