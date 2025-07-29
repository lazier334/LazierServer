import { fs, path } from '../libs/config.js';

const ApiMapType = dataType();
const RequestType = getRequestType();
const lc = {
    apimapFile: '.apimap.json',
    dataCache: {},
    autoResetTime: 30 * 1000, // 30秒内没有重复请求则重置从第一个数据开始
}

/**
 * @typedef {{
*  ctx: import('koa').ParameterizedContext,    //koa的上下文对象
*  filename: 'gameService',                    // 文件名称
*  opts: import('koa-send').SendOptions,       // send的配置, opts.root 是目录
* }} SendOptions send的配置对象
*/

/**
 * 选择具体的api
 * 返回true则表示当前函数已响应数据
 * @param {SendOptions}  sendOptions
 * @returns {SendOptions}
 */
export default async function sendSameApi(sendOptions) {
    const { ctx, filename, opts } = sendOptions;
    try {
        const dataMap = getApimapJson(opts.root);
        if (dataMap) {
            const api = calcApiData(dataMap, lc.dataCache, ctx, filename, opts);
            if (api) {
                ctx.sendFileFromPath = path.join(opts.root, path.basename(api.path));
                sendOptions.filename = path.basename(api.path);
            }
        }
    } catch (error) {
        console.log('接口多数据解析失败', path.join(opts.root, filename), error)
    }
    return sendOptions;
}

/**
 * 获取api数据，通过计算 headers请求头 和 conotent请求体 两个对象来统计相似度  
 * 选择相似度最高的一个api，如果相似度最高的有多个，那么按顺序逐个响应
 * @param {ApiMapType} dm apimap数据对象
 * @param {Object} dc 缓存对象
 * @param {import('koa').ParameterizedContext} ctx koa的上下文对象
 * @param {'gameService'} filename 文件名
 * @param {import('koa-send').SendOptions} opts send的配置, opts.root 是目录
 * @returns {RequestType | undefined}
 */
function calcApiData(dm, dc, ctx, filename, opts) {
    const filepath = path.join(opts.root, filename);
    const apis = dm[filename];
    // 没有这个接口的更多数据
    if (!apis) return;

    // 获取当前对象数据
    const ctxReq = getRequestByCtx(ctx);
    const ctxHeaders = ctxReq.upReq.headers;
    const ctxContent = ctxReq.upReq.content;

    // 统计各个接口的得分
    const scores = {};
    // 计算得分与路径，当路径存在不同的时候使用日志提示
    Object.entries(apis).forEach(([key, api]) => {
        const keyPath = [];
        calcKeys(api.upReq.headers, ctxHeaders, keyPath);
        calcKeys(api.upReq.content, ctxContent, keyPath);
        keyPath.sort();
        scores[key] = keyPath;
    });

    // 选择分数最高的一项
    let selectScores = [];
    let maxScore = 0;
    for (const key in scores) {
        const score = scores[key];
        if (maxScore < score.length) {
            maxScore = score.length;
            selectScores = [{
                score: score.length,
                keyPath: score.join(','),
                apiId: key
            }];
        } else if (maxScore == score.length) {
            selectScores.push({
                score: score.length,
                keyPath: score.join(','),
                apiId: key
            })
        }
    }

    // 如果数据超过1个则进行缓存
    /** 
     * @type {{
     *      score: 0,
     *      keyPath: 'accept,index',
     *      apiId: 'd89147ac89553415ef781c466f71ca6f'
     *  }} 
     */
    let useSelectScore = null;
    if (1 < selectScores.length) {
        if (typeof dc != 'object' || dc == null) dc = lc.dataCache = {};
        if (typeof dc[filepath] != 'object') dc[filepath] = {};
        if (dc[filepath][maxScore]) {
            dc[filepath][maxScore].nowIndex++;
        } else {
            dc[filepath][maxScore] = {
                selectScores,
                nowIndex: 0,
                lastRequest: 0,
            }
        }
        const nowScores = dc[filepath][maxScore];
        // 检测当前列表
        let kps = nowScores.selectScores.map(e => e.keyPath);
        kps = [...new Set(kps)];
        if (1 < kps.length) console.warn('当前api相同得分中存在多种匹配组合，如需更准确的响应，请自行实现该接口的处理算法', kps);

        // 如果与上次请求间隔太长(30秒)则重置进度
        if (nowScores.lastRequest + lc.autoResetTime < Date.now()) {
            console.log('/' + filename, 'api接口请求间隔超过配置的时间间隔，重新遍历api数据');
            nowScores.nowIndex = 0;
        }
        nowScores.lastRequest = Date.now();
        // 返回当前选择的项目
        useSelectScore = nowScores.selectScores[nowScores.nowIndex];
    } else {
        // 返回第一个
        useSelectScore = selectScores[0];
    }
    console.info(`当前选项得分 ${useSelectScore.score} ，得分路径 ${useSelectScore.keyPath} ，文件id：${useSelectScore.apiId}`)
    // 读取具体的内容
    return apis[useSelectScore.apiId]
}

/**
 * 对比字符串是否一致
 * @param {string} s1 字符串1
 * @param {string} s2 字符串2
 * @param {boolean} matchCase 区分大小写
 * @returns {boolean}
 */
function equalString(s1, s2, matchCase) {
    if (s1 == s2) return true;
    if (matchCase) return '' + s1 == '' + s2;
    return ('' + s1).toLocaleLowerCase() == ('' + s2).toLocaleLowerCase();
}

/**
 * 计算键值对匹配数据
 * @param {{}} apiObj 
 * @param {{}} ctxObj 
 * @param {[string]} keyPath 
 */
function calcKeys(apiObj, ctxObj, keyPath) {
    try {
        Object.entries(apiObj).forEach(([k, v]) => {
            if (equalString(ctxObj[k], v)) {
                keyPath.push(k);
            }
        });
    } catch (e) {
        console.log(apiObj, ctxObj, keyPath)
        console.error(e)
        throw e
    }
    return keyPath
}

/**
 * 从 koa-ctx 获取 RequestType 对象，ctx需要被 koa-bodyparser 之类的中间件解析过
 * @param {import('koa').ParameterizedContext} ctx koa的上下文对象
 * @returns {RequestType | undefined}
 */
function getRequestByCtx(ctx) {
    const params = {
        ...ctx.request.query,
        ...ctx.request.body
    };
    return {
        "upReq": {
            "line": {
                "url": ctx.url,
                "method": ctx.method.toUpperCase(),
                "version": ""
            },
            "headers": {
                ":method": ctx.method.toUpperCase(),
                ":path": ctx.path,
                ":scheme": ctx.protocol,
                ...ctx.headers
            },
            "content": params
        },
        "upRes": {
            "line": {
                "url": ctx.url,
                "method": ctx.method.toUpperCase(),
                "version": ""
            },
            "headers": {
            },
            "content": ""
        },
        "path": ""
    }
}

/**
 * 读取 .apimap.json 的数据对象
 * @param {string} dirpath 文件夹路径
 * @returns {ApiMapType}
 */
function getApimapJson(dirpath) {
    const fp = path.join(dirpath, lc.apimapFile);
    if (fs.existsSync(fp)) {
        return JSON.parse(fs.readFileSync(fp))
    }
}

/** 示例数据 */
function dataType() {
    return {
        "gameService": {
            "d89147ac89553415ef781c466f71ca6f": {
                "upReq": {
                    "line": {
                        "url": "https://test.com/gameService",
                        "method": "POST",
                        "version": "http/2.0"
                    },
                    "headers": {
                        ":method": "POST",
                        ":path": "/gs2c/ge/v4/gameService",
                        ":scheme": "https",
                        "accept": "*/*",
                        "accept-encoding": "gzip, deflate, br, zstd",
                        "accept-language": "zh-CN,zh;q=0.9",
                        "cache-control": "no-cache",
                        "content-length": "141",
                        "content-type": "application/x-www-form-urlencoded",
                        "pragma": "no-cache",
                    },
                    "content": {
                        "action": "doInit",
                        "cver": "308725",
                        "index": "1",
                        "counter": "1",
                        "repeat": "0",
                    }
                },
                "upRes": {
                    "line": {
                        "url": "https://test.com/gameService",
                        "method": "POST",
                        "version": "http/2.0"
                    },
                    "headers": {
                        "access-control-allow-credentials": "true",
                        "access-control-allow-origin": "*",
                        "cache-control": "no-cache, no-store, max-age=0, must-revalidate",
                        "content-encoding": "gzip",
                        "content-type": "text/plain;charset=ISO-8859-1",
                        "date": "Wed, 14 May 2025 09:04:34 GMT",
                        "expires": "0",
                        "pragma": "no-cache",
                    },
                    "content": "响应内容1"
                },
                "path": "gameService"
            },
            "a1b908ba98267f2782523ef38c63ada3": {
                "upReq": {
                    "line": {
                        "url": "https://test.com/gameService",
                        "method": "POST",
                        "version": "http/2.0"
                    },
                    "headers": {
                        ":method": "POST",
                        ":path": "/gs2c/ge/v4/gameService",
                        ":scheme": "https",
                        "accept": "*/*",
                        "accept-encoding": "gzip, deflate, br, zstd",
                        "accept-language": "zh-CN,zh;q=0.9",
                        "cache-control": "no-cache",
                        "content-length": "145",
                        "content-type": "application/x-www-form-urlencoded",
                        "pragma": "no-cache",
                    },
                    "content": {
                        "action": "doSpin",
                        "c": "0.1",
                        "l": "20",
                        "bl": "0",
                        "index": "2",
                        "counter": "3",
                        "repeat": "0",
                    }
                },
                "upRes": {
                    "line": {
                        "url": "https://test.com/gameService",
                        "method": "POST",
                        "version": "http/2.0"
                    },
                    "headers": {
                        "access-control-allow-credentials": "true",
                        "access-control-allow-origin": "*",
                        "cache-control": "no-cache, no-store, max-age=0, must-revalidate",
                        "content-length": "314",
                        "content-type": "text/plain;charset=ISO-8859-1",
                        "date": "Wed, 14 May 2025 09:08:08 GMT",
                        "expires": "0",
                        "pragma": "no-cache",
                    },
                    "content": "响应内容2"
                },
                "path": ".apis.a1b908ba98267f2782523ef38c63ada3.gameService"
            }
        }
    }
}

/** 自定义的请求对象类型 */
function getRequestType() {
    return {
        "upReq": {
            "line": {
                "url": "https://test.com/gameService",
                "method": "POST",
                "version": "http/2.0"
            },
            "headers": {
                ":method": "POST",
                ":path": "/gs2c/ge/v4/gameService",
                ":scheme": "https",
                "accept": "*/*",
                "accept-encoding": "gzip, deflate, br, zstd",
                "accept-language": "zh-CN,zh;q=0.9",
                "cache-control": "no-cache",
                "content-length": "141",
                "content-type": "application/x-www-form-urlencoded",
                "pragma": "no-cache",
            },
            "content": {
                "action": "doInit",
                "cver": "308725",
                "index": "1",
                "counter": "1",
                "repeat": "0",
            }
        },
        "upRes": {
            "line": {
                "url": "https://test.com/gameService",
                "method": "POST",
                "version": "http/2.0"
            },
            "headers": {
                "access-control-allow-credentials": "true",
                "access-control-allow-origin": "*",
                "cache-control": "no-cache, no-store, max-age=0, must-revalidate",
                "content-encoding": "gzip",
                "content-type": "text/plain;charset=ISO-8859-1",
                "date": "Wed, 14 May 2025 09:04:34 GMT",
                "expires": "0",
                "pragma": "no-cache",
            },
            "content": "响应内容1"
        },
        "path": "gameService"
    }
}
