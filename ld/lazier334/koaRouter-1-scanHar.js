import Router from '@koa/router';
import { createKoaRouter } from './types/index.js';
import { fs, path, config } from './libs/baseImport.js';
import { handlerHtmlBodyData } from './utils/util-router.js';

const lc = {
    harFilesCache: [],
    harFilesMapCache: {},
    fileTagCache: '',
    lastRefreshTime: 0,
    /** api接口映射 @type {{'/api':ENTRYTEMP}} */
    apiMap: {}
};

/** 额外的路由 */
var additionalRouter = config.additionalRouter[import.meta.filename] || new Router();
if (!config.additionalRouter[import.meta.filename]) {
    config.additionalRouter[import.meta.filename] = additionalRouter;
}

/**
 * 动态路由 History 插件，顺序为： 插件API > 文件API > HarAPI > 系统API > vue的历史模式（或类似框架） > external
 */
export default createKoaRouter(function koaRouterScanHar(router) {
    // 这个接口放到前面是因为优先读取文件，再读取系统的接口，
    // 接口：全局，所有没有被拦截的都将跳到这里发送文件
    router.all('全局接口: 扫描har资源', new RegExp('/(.*)'), async (ctx, next) => {
        let api = ctx.path;
        // 更新数据
        detectUpdate(config.rootDir);
        // 更新其他文件夹
        config.otherWebPath.forEach(web => detectUpdate(web));
        // 扫描 web 文件夹下的所有 har 文件，也使用缓存，如果文件的修改时间没有变化则读取缓存的数据
        let entries = lc.apiMap[api];
        // 处理原始接口是 / 结尾的请求
        if (!entries && api.endsWith('/index.html')) {
            entries = lc.apiMap[api.substring(0, api.length - 'index.html'.length)];
        }
        if (entries) {
            // 发送数据
            return await sendEntries(ctx, entries, next);
            // 文件未找到，放行到下一个路由
        } else return await next();
    });

    return router
})

/**
 * 从 entries 列表选择一条数据并发送
 * @param {import('koa').Context} ctx
 * @param {[ENTRYTEMP]} entries 
 */
function selectEntry(ctx, entries) {
    let entry = entries[0];
    // 内容为空的时候尝试往下翻
    if (!(entry.response.content.text?.length != 0)) {
        entry = entries.find(e => e.response.content.text?.length != 0) || entry;
    }
    return entry;
}

/**
 * @typedef {Object} SendEntryType 可用于查询细节或者直接重写ctx.body
 * @property {ENTRYTEMP} [entry] - entry对象
 * @property {string|Buffer<ArrayBuffer>} [entryResponse] - 要响应的entry数据
 */
/**
 * 从 entries 列表选择一条数据并发送
 * @param {import('koa').Context} ctx
 * @param {[ENTRYTEMP]} entries 
 */
async function sendEntries(ctx, entries, next) {
    let entry = selectEntry(ctx, entries);
    let content = entry.response.content;
    let entryResponse = content.text;
    let headers = entry.response.headers;
    try {
        if (content.encoding) {
            entryResponse = Buffer.from(entryResponse, content.encoding)
        }
        entryResponse = handlerHtmlBodyData(ctx, entryResponse)
    } catch (err) {
        console.warn('Har设置响应内容失败', err)
    }
    ctx.entry = entry;
    ctx.entryResponse = entryResponse;
    ctx.notCompleteFile = true;
    let re = await next();
    // 如果还没有被响应，那么就使用 ctx.entryResponse 的数据进行响应，其他路由可以修改 ctx.entryResponse 
    // 如果要改变响应头也可以修改entry里面的响应头
    if (ctx.body === undefined && !ctx.res.headersSent) {
        try {
            if (entry.filepath) {
                ctx.set(config.headerNames.fileFrom, encodeURI(entry.filepath))
            }
            headers.forEach(header => ctx.set(header.name, header.value))
            config.scanHar.removeResponseHeaderList.forEach(name => ctx.remove(name));
        } catch (err) {
            console.warn('Har设置响应头失败', err)
        }
        re = ctx.body = ctx.entryResponse;
    }
    return re;
}

/**
 * 获取插件更新时间
 * @param {string} filepath 插件路径
 */
function getPlguinUpdateTime(filepath) {
    let timestamp = 0;
    try {
        const stat = fs.statSync(filepath);
        timestamp = stat.mtimeMs;
    } catch (err) {
        console.warn('读取文件更新时间失败', err)
    }
    return timestamp
}

/**
 * 
 * @param {string} rootDir har文件所在文件夹
 * @returns {boolean} 有没有成功更新内容
 */
function detectUpdate(rootDir) {
    if (!config.switch.dynamicOperation && 0 < Object.keys(lc.apiMap).length) return false;
    // 检测文件名是否全部一致
    let fileTag = fs.readdirSync(rootDir).sort().join('');
    let refresh = lc.fileTag != fileTag;

    // 检测路由文件更新时间是否有变动，为了降低性能消耗，10秒钟扫描一次
    if (lc.lastRefreshTime + config.times.koaRouterPlugin < Date.now()) {
        refresh = true;
    }

    if (refresh) {
        let re = scanHarFiles(rootDir);
        lc.fileTag = fileTag;
        lc.lastRefreshTime = Date.now();
        return re;
    }
    return false;
}

/**
 * 扫描har文件
 * @param {string} rootDir har文件所在文件夹
 * @returns {boolean} 扫描的文件中有没有新的
 */
function scanHarFiles(rootDir) {
    let fileUpdate = false;
    const harFilesCache = fs.readdirSync(rootDir).filter(file => file.endsWith('.har')).map(filename => {
        // 读取文件的修改时间
        const fp = path.join(rootDir, filename);
        const upTime = getPlguinUpdateTime(fp);
        if (lc.harFilesMapCache[fp]?.upTime != upTime) {
            try {
                /** @type {HARTEMP} */
                let har = JSON.parse(fs.readFileSync(fp));
                // 保存文件路径
                har.log.entries.forEach(entry => entry.filepath = fp);
                if (typeof lc.harFilesMapCache[fp] != 'object') lc.harFilesMapCache[fp] = {};
                delete lc.harFilesMapCache[fp].upTime;
                lc.harFilesMapCache[fp].body = har;
                lc.harFilesMapCache[fp].upTime = upTime;
                fileUpdate = true;
            } catch (err) {
                console.error('har处理失败', fp, err)
            }
        }
        if (lc.harFilesMapCache[fp].upTime == undefined) {
            const temp = lc.harFilesMapCache[fp];
            console.log('删除无效的har数据', fp, temp);
            // 如果不存在更新时间，那么就判定为数据无效，直接删除
            delete lc.harFilesMapCache[fp];
        }
        return lc.harFilesMapCache[fp]?.body
    });
    if (fileUpdate) {
        lc.harFilesCache = harFilesCache;
        // 调用数据解析
        updateApiMap(lc.harFilesCache);
    }
    return fileUpdate;
}
/**
 * 更新api数据
 * @param {[HARTEMP]} data 一般使用 lc.harFilesCache 来更新
 */
function updateApiMap(data) {
    let apiMap = {};
    data.forEach(har => {
        har.log.entries.forEach(entry => {
            try {
                const u = new URL(entry.request.url);
                if (u.pathname == '') u.pathname = '/';
                // 保存 entry 到 api 中
                if (apiMap[u.pathname]) apiMap[u.pathname].push(entry);
                else apiMap[u.pathname] = [entry];
            } catch (err) {
                console.warn('解析 entry 条目失败', err)
            }
        })
    });
    appendRouterToAdditionalRouter(apiMap);
    return lc.apiMap = apiMap;
}

/**
 * 添加路由到附加的路由中
 * @param {lc.apiMap} apiMap 
 * @returns {Router}
 */
function appendRouterToAdditionalRouter(apiMap = lc.apiMap) {
    // 清空路由列表
    additionalRouter.stack.splice(0, additionalRouter.stack.length);
    // 添加空的路由列表
    Object.keys(apiMap).forEach(api => additionalRouter.all('Har路由', escapeRegExp(api), nullFunction));
    return additionalRouter;
}
/** 空函数 */
function nullFunction() { };
/** 转义接口路径中的特殊字符，避免触发正则匹配导致错误 */
function escapeRegExp(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}