import { fs, path, types, utils } from './libs/index.js';
import mime from 'mime-types';

const lc = {
    simplifyFileExtname: '.min.har'
}
/**
 * 动态路由 History 插件，顺序为： 插件API > 文件API > HarAPI > 系统API > vue的历史模式（或类似框架） > external
 */
export default types.createKoaRouter(function koaRouterUtils(router) {
    router.all('工具接口 - 批量简化 dirpath 文件夹中的har文件', '/utils/simplifyHars', utils.routerUtil.warpApi((ctx, next, params) => {
        if (fs.existsSync(params.dirpath) && fs.statSync(params.dirpath).isFile()) params.dirpath = path.dirname(params.dirpath);
        let result = {};
        const fps = fs.readdirSync(params.dirpath).filter(name => name.endsWith('.har')).map(name => path.join(params.dirpath, name));
        for (const fp of fps) {
            try {
                let har = JSON.parse(fs.readFileSync(fp));
                har = JSON.stringify(simplifyHar(har));

                fs.writeFileSync(fp + (fp.endsWith(lc.simplifyFileExtname) ? '' : lc.simplifyFileExtname), har);
                result[fp] = {
                    status: true,
                    size: har.length
                };
            } catch (err) {
                result[fp] = {
                    status: false,
                    error: err.stack
                };
            }
        }
        ctx.body = result;
    }));

    router.all('工具接口 - 将 dirpath 文件夹中的文件生成har', '/utils/createHar', utils.routerUtil.warpApi((ctx, next, params) => {
        // 先生成名单
        if (fs.existsSync(params.dirpath) && fs.statSync(params.dirpath).isFile()) params.dirpath = path.dirname(params.dirpath);
        const files = readFiles(params.dirpath);
        const outHarPath = params.dirpath + '.har';
        const entries = [];
        // 再生成文件
        files.forEach(file => {
            const buff = fs.readFileSync(file);
            const content = { size: buff.byteLength, mimeType: getMimeType(file) };
            if (['html', 'js', 'css', 'txt'].includes(path.extname(file).replace('.', ''))) {
                content.text = buff.toString('utf8');
            } else {
                content.base64 = buff.toString('base64');
            }
            entries.push(createEntry("https://lazier334.com/" + file, content));
        });
        let har = createHar(entries);
        fs.writeFileSync(outHarPath, JSON.stringify(har, null, 2));
        if (params.simplify || params.min) {
            har = simplifyHar(har);
            fs.writeFileSync(outHarPath + lc.simplifyFileExtname, JSON.stringify(har));
        }
        ctx.body = har;
    }));

    return router
})

/**
 * 清理其他Key
 * @param {object} obj 需要清理的对象
 * @param {string[]} saveKeys 保留的 key 
 * @returns 
 */
function cleanOtherKeys(obj, saveKeys) {
    for (let k in obj) {
        if (!saveKeys.includes(k)) delete obj[k];
    }
    return obj
}
/**
 * 简化har文件
 * @param {HAR} har har文件内容
 * @param {boolean} saveHeaders 是否保存请求头响应头
 */
function simplifyHar(har, saveHeaders) {
    // 1. 清理无用层级
    let newHar = { log: { entries: har.log.entries } };
    // 2. 清理不用字段
    let saveKeys = saveHeaders ? ['headers'] : [];
    newHar.log.entries.forEach(entry => {
        cleanOtherKeys(entry, ['request', 'response']);
        cleanOtherKeys(entry.request, ['url', ...saveKeys]);
        cleanOtherKeys(entry.response, ['content', ...saveKeys]);
    });
    return newHar
}

/**
 * 读取所有文件
 * @param {string} dirpath 文件夹路径
 * @param {string} files 所有文件的路径
 */
function readFiles(dirpath, files = []) {
    fs.readdirSync(dirpath).forEach(name => {
        const file = path.join(dirpath, name);
        if (fs.statSync(file).isFile()) {
            files.push(file);
        } else {
            // 文件夹递归遍历
            readFiles(file, files);
        }
    });
    return files
}

/**
 * 获取文件的 mime 类型
 * @param {string} filename 
 * @returns 
 */
function getMimeType(filename) {
    return mime.lookup(path.extname(filename)) || 'application/octet-stream';
}

/**
 * 创建 entry 对象
 * @param {"https://lazier334.com/index.html"} url 链接
 * @param {{"size":3344,"mimeType":"text/html","text":"","base64":""}} content 内容
 * @returns 
 */
function createEntry(url = "https://lazier334.com/index.html", content) {
    content = {
        ...{
            "size": 3344,
            "mimeType": "text/html",
            "text": "",
            "base64": "",
        },
        ...content
    };
    return {
        "_initiator": {
            "type": "parser",
            "url": "通过文件夹创建",
            "lineNumber": 1,
            "stack": {
                "callFrames": [
                    {
                        "functionName": "通过文件夹创建 - by LazierServer",
                        "scriptId": "1",
                        "url": "https://github.com/lazier334/LazierServer",
                        "lineNumber": 1,
                        "columnNumber": 1
                    },
                ],
                "parentId": {
                    "id": "1",
                    "debuggerId": "-8682165356029374332.3308922854333007288"
                }
            }
        },
        "_priority": "VeryHigh",
        // "_resourceType": "document",
        "cache": {},
        "connection": "3344",
        "request": {
            "method": "GET",
            "url": url,
            "httpVersion": "http/2.0",
            "headers": [
                {
                    "name": ":authority",
                    "value": "lazier334.com"
                },
                {
                    "name": ":method",
                    "value": "GET"
                },
                {
                    "name": ":path",
                    "value": "/proxy/3344/"
                },
                {
                    "name": ":scheme",
                    "value": "https"
                },
                {
                    "name": "accept-encoding",
                    "value": "gzip, deflate, br, zstd"
                },
                {
                    "name": "accept-language",
                    "value": "zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6"
                },
                {
                    "name": "cache-control",
                    "value": "no-cache"
                },
                {
                    "name": "pragma",
                    "value": "no-cache"
                },
                {
                    "name": "priority",
                    "value": "u=0, i"
                },
                {
                    "name": "sec-ch-ua",
                    "value": "\"Chromium\";v=\"152\", \"Not?A_Brand\";v=\"24\", \"Microsoft Edge\";v=\"152\""
                },
                {
                    "name": "sec-ch-ua-mobile",
                    "value": "?0"
                },
                {
                    "name": "sec-ch-ua-platform",
                    "value": "\"Windows\""
                },
                {
                    "name": "sec-fetch-dest",
                    "value": "document"
                },
                {
                    "name": "sec-fetch-mode",
                    "value": "navigate"
                },
                {
                    "name": "sec-fetch-site",
                    "value": "none"
                },
                {
                    "name": "sec-fetch-user",
                    "value": "?1"
                },
                {
                    "name": "upgrade-insecure-requests",
                    "value": "1"
                },
                {
                    "name": "user-agent",
                    "value": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36 Edg/152.0.0.0"
                }
            ],
            "queryString": [],
            "cookies": [],
            "headersSize": -1,
            "bodySize": 0
        },
        "response": {
            "status": 200,
            "statusText": "OK",
            "httpVersion": "http/2.0",
            "headers": [
                {
                    "name": "content-type",
                    "value": content.mimeType
                },
                {
                    "name": "date",
                    "value": "Wed, 02 Sep 2026 02:50:46 GMT"
                },
                {
                    "name": "server",
                    "value": "openresty"
                },
                {
                    "name": "strict-transport-security",
                    "value": "max-age=31536000"
                },
                {
                    "name": "vary",
                    "value": "Accept-Encoding"
                }
            ],
            "cookies": [],
            "content": content,
            "redirectURL": "",
            "headersSize": -1,
            "bodySize": -1,
            "_transferSize": content.size,
            "_error": null,
            "_fetchedViaServiceWorker": false
        },
        "serverIPAddress": "127.0.0.1",
        "startedDateTime": "2026-09-02T02:50:53.791Z",
        "time": 334.0000000000000,
        "timings": {
            "blocked": 6.529999956384302,
            "dns": -1,
            "ssl": -1,
            "connect": -1,
            "send": 0.20499999999999996,
            "wait": 333.0949999812916,
            "receive": 0.5520000122487545,
            "_blocked_queueing": 6.017999956384301,
            "_workerStart": -1,
            "_workerReady": -1,
            "_workerFetchStart": -1,
            "_workerRespondWithSettled": -1
        },
        "_connectionId": "41326",
        "pageref": "page_1"
    }
}

function createHar(entries) {
    return {
        "log": {
            "version": "1.2",
            "creator": {
                "name": "WebInspector",
                "version": "537.36"
            },
            "pages": [
                {
                    "startedDateTime": "2026-09-02T02:50:53.797Z",
                    "id": "page_1",
                    "title": "https://lazier334.com/",
                    "pageTimings": {
                        "onContentLoad": 9180.749000050128,
                        "onLoad": 11845.410000008997
                    }
                }
            ],
            "entries": entries
        }
    }
}