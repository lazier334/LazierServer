import result from './utils/util-result.js';
import { fs, path } from './libs/baseImport.js';
import { runDetachedCmd } from './utils/util-cmd.js';

const lc = {
    appName: 'GlobalProxy.exe',
    appPath: './ld/plugins/externals/global-proxy',
    appUrl: 'http://localhost:4433'
}
/**
 * 动态路由 History 插件，顺序为： 插件API > 文件API > HarAPI > 系统API > vue的历史模式（或类似框架） > external
 * @param {import('@koa/router')} router 路由
 */
export default function koaRouterExternalGlobalProxy(router) {
    router.all('外部插件-全局代理-仅windows端可用', '/external/globalProxy', async (ctx, next) => {
        let re = `${lc.appName} 可能启动失败了`;
        let code = 500;
        let resp = await fetchWarp(lc.appUrl, null, 300, 100);
        if (resp == undefined) {
            let fp = path.join(lc.appPath, lc.appName);
            if (!fs.existsSync(fp)) {
                // 程序不存在
                re = `要启动的程序不存在！${fp}`;
                code = 404;
            } else {
                // 启动程序
                const child = runDetachedCmd(`cd ${lc.appPath} && ${lc.appName}`, [], {
                    ...process.env,
                    NODE_OPTIONS: undefined
                });
                resp = await fetchWarp(lc.appUrl, null, 10 * 1000);
            }
        }
        if (resp != undefined) {
            re = `${lc.appName} 已启动，如果出现ES模块异常，请使用 \`npm init\` 在 ${lc.appName} 程序进行初始化生成 package.json 文件`;
            code = 200
        }
        // 请求指定的端口查看是否正常
        ctx.body = result(re, undefined, code);
    });

    return router
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 支持超时的fetch请求
 * @param {string} url 地址
 * @param {{}} options 配置
 * @param {5000} timeout 超时时间
 * @returns {Promise<Response>}
 */
async function fetchWithTimeout(url, options = {}, timeout = 5000) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal
        });
        clearTimeout(timeoutId); // 清除定时器
        return response;
    } catch (error) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
            throw new Error(`请求超时（${timeout}ms）`);
        }
        throw error; // 其他错误（如网络问题）
    }
};

/**
 * 支持超时的fetch请求，如果不是超时错误就会一直重复访问，每次间隔1秒
 * @param {string} url 地址
 * @param {{}} options 配置
 * @param {5000} timeout 超时时间
 * @param {1000} requestStep 请求间隔
 * @returns {Promise<Response|undefined>}
 */
async function fetchWarp(url, options = {}, timeout = 5000, requestStep = 1000) {
    let endTime = Date.now() + timeout;
    while (Date.now() < endTime) {
        try {
            return await fetchWithTimeout(url, options, timeout);
        } catch (err) {
            await delay(requestStep)
            console.debug('请求失败', '是否重试', Date.now() < endTime, err.message)
        }
    }
}