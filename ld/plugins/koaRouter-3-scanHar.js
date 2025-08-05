import Router from '@koa/router';
import { fs, path, config, importSysModule } from './libs/baseImport.js';

/** @type {import('../../src/libs/plugins.js')} */
const pluginsModule = await importSysModule('plugins.js');
const { plugins, pathDeduplication } = pluginsModule;
const ENTRYTEMP = getEntry();
const HARTEMP = getHarTemplate();
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
 * 动态路由 扫描web文件夹的 插件，顺序为： 插件API > 文件API > HarAPI > 系统API
 * @param {import('@koa/router')} router 路由
 */
export default function koaRouterScanHar(router) {
    // 这个接口放到前面是因为优先读取文件，再读取系统的接口，
    // 接口：全局，所有没有被拦截的都将跳到这里发送文件
    router.all(new RegExp('/(.*)'), async (ctx, next) => {
        let api = ctx.path;
        // 更新数据
        detectUpdate();
        // 扫描 web 文件夹下的所有 har 文件，也使用缓存，如果文件的修改时间没有变化则读取缓存的数据
        let entries = lc.apiMap[api];
        // 文件未找到，放行到下一个路由
        if (entries) {
            // 发送数据
            const re = sendEntries(ctx, entries);
            if (re) return re;
        }
        return await next();
    });

    return router
}
/**
 * 从 entries 列表选择一条数据并发送
 * @param {import('koa').Context} ctx
 * @param {[ENTRYTEMP]} entries 
 */
function sendEntries(ctx, entries) {
    let selectEntry = entries[0];
    let content = selectEntry.response.content;
    let body = content.text;
    let headers = selectEntry.response.headers;
    try {
        if (selectEntry.filepath) {
            ctx.set(config.headerNames.fileFrom, encodeURI(selectEntry.filepath))
        }
        headers.forEach(header => ctx.set(header.name, header.value))
    } catch (err) {
        console.warn('Har设置响应头失败', err)
    }
    try {
        if (content.encoding) {
            body = Buffer.from(body, content.encoding)
        }
        ctx.body = body
    } catch (err) {
        console.warn('Har设置响应内容失败', err)
    }
    return body;
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
function detectUpdate(rootDir = config.rootDir) {
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
function scanHarFiles(rootDir = config.rootDir) {
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
 * @param {[HARTEMP]} [data=lc.harFilesCache] 
 */
function updateApiMap(data = lc.harFilesCache) {
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
    Object.keys(apiMap).forEach(api => additionalRouter.all('Har路由', api, nullFunction));
    return additionalRouter;
}
/** 空函数 */
function nullFunction() { };

/**
 * 获取 har 文件的模板
 */
function getHarTemplate() {
    return {
        "log": {
            "version": "1.2",
            "creator": {
                "name": "WebInspector",
                "version": "537.36"
            },
            "pages": [
                {
                    "startedDateTime": "2025-07-31T08:25:48.496Z",
                    "id": "page_1",
                    "title": "http://baidu.com/",
                    "pageTimings": {
                        "onContentLoad": 598.9290000870824,
                        "onLoad": 759.0350001119077
                    }
                }
            ],
            "entries": [
                getEntry(),
                getEntry()
            ]
        }
    }
}

/**
 * 获取 har 中的 entry 元素对象
 * @returns 
 */
function getEntry() {
    return {
        "filepath": "由上面的代码 har.log.entries.forEach(entry => entry.filepath = fp); 附加，有可能不存在这个属性",
        "_initiator": {
            "type": "other"
        },
        "_priority": "VeryHigh",
        "_resourceType": "document",
        "cache": {},
        "pageref": "page_1",
        "request": {
            "method": "GET",
            "url": "http://baidu.com/aaa/bbb",
            "httpVersion": "HTTP/1.1",
            "headers": [
                {
                    "name": "Accept",
                    "value": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7"
                },
                {
                    "name": "Accept-Encoding",
                    "value": "gzip, deflate, br, zstd"
                },
                {
                    "name": "Accept-Language",
                    "value": "zh-CN,zh;q=0.9"
                },
                {
                    "name": "Cache-Control",
                    "value": "no-cache"
                },
                {
                    "name": "Connection",
                    "value": "keep-alive"
                },
                {
                    "name": "Host",
                    "value": "baidu.com"
                },
                {
                    "name": "Pragma",
                    "value": "no-cache"
                },
                {
                    "name": "Sec-Fetch-Dest",
                    "value": "document"
                },
                {
                    "name": "Sec-Fetch-Mode",
                    "value": "navigate"
                },
                {
                    "name": "Sec-Fetch-Site",
                    "value": "none"
                },
                {
                    "name": "Sec-Fetch-User",
                    "value": "?1"
                },
                {
                    "name": "Upgrade-Insecure-Requests",
                    "value": "1"
                },
                {
                    "name": "User-Agent",
                    "value": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36"
                },
                {
                    "name": "sec-ch-ua",
                    "value": "\"Not)A;Brand\";v=\"8\", \"Chromium\";v=\"138\", \"Google Chrome\";v=\"138\""
                },
                {
                    "name": "sec-ch-ua-mobile",
                    "value": "?0"
                },
                {
                    "name": "sec-ch-ua-platform",
                    "value": "\"Windows\""
                }
            ],
            "queryString": [],
            "cookies": [],
            "headersSize": 1564,
            "bodySize": 0
        },
        "response": {
            "status": 302,
            "statusText": "Moved Temporarily",
            "httpVersion": "HTTP/1.1",
            "headers": [
                {
                    "name": "Connection",
                    "value": "keep-alive"
                },
                {
                    "name": "Content-Length",
                    "value": "161"
                },
                {
                    "name": "Content-Type",
                    "value": "text/html"
                },
                {
                    "name": "Date",
                    "value": "Thu, 31 Jul 2025 08:25:48 GMT"
                },
                {
                    "name": "Location",
                    "value": "https://www.baidu.com/"
                },
                {
                    "name": "Server",
                    "value": "bfe/1.0.8.18"
                }
            ],
            "cookies": [],
            "content": {
                "size": 0,
                "mimeType": "x-unknown",
                "compression": 197,
                "text": "text body 123456"
            },
            "redirectURL": "https://www.baidu.com/",
            "headersSize": 197,
            "bodySize": -197,
            "_transferSize": 0,
            "_error": null,
            "_fetchedViaServiceWorker": false
        },
        "serverIPAddress": "",
        "startedDateTime": "2025-07-31T08:25:48.486Z",
        "time": 10.079999919980764,
        "timings": {
            "blocked": 10.079999919980764,
            "dns": -1,
            "ssl": -1,
            "connect": -1,
            "send": 0,
            "wait": -1.3749999925494194,
            "receive": 0,
            "_blocked_queueing": 10.079999919980764
        }
    }
}