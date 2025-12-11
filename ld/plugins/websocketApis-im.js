const { db, msgBodyType, Config } = require('./utils/utils-im.js');
const lc = {
    close: false,
    moreLog: Config.moreLog ? console.debug : () => { },
    cacheSet: new Set()
}
const APIS = initAPIS();
/** 
 * 使用时需要传递客户端的消息进来，进行路由识别与操作
 * @param {Buffer|string|object} msg 转化后的消息内容
 * @param {import('ws').WebSocket} ws ws连接
 * @returns {boolean} 返回true则代表接口已处理，false则给下一个接口处理
 */
module.exports = (params, ws) => {
    if (lc.close) return false;
    try {
        if (typeof params != 'object') params = {};
        const re = APIS[params.api]?.(ws, params);
        ws.send(re);
    } catch (error) {
        console.error('im处理失败', error.message);
        lc.moreLog(error);
    }
    return false
}



function initAPIS() {
    const apis = {
        ['/im/m_getMsg']: im_m_getMsg,
        ['/runCode']: msgBody,
    }

    return apis;
}

/**
 * 和监控消息的 im_m_getMsg 几乎一样  
 * 区别是读取到的数据列表会转成每一条单独的消息内容
 * @param {*} ws 
 * @param {*} params 
 * @param {*} apiTag 
 * @returns 
 */
function msgBody(ws, params, apiTag = '/runCode') {
    console.log('params', params)
    // 检查当前 ws 是否已经挂载了 topicId
    if (ws.currentTopicId !== params.topicId) {
        // 如果 topicId 不同，移除之前的监控并更新 topicId
        if (ws.currentTopicId) {
            lc.cacheSet.delete(ws); // 移除旧的监控
        }
        ws.currentTopicId = params.topicId; // 更新为新的 topicId
        lc.cacheSet.add(ws); // 添加到监控集合
    } else if (lc.cacheSet.has(ws)) {
        return result(apiTag, '已经在监控中...' + ws.currentTopicId);
    }

    async function addMonitorAddMsg() {
        const data = ((msgs) => {
            const cache = {};
            return msgs.map(msg => {
                const id = msg.userId;
                if (!cache[id]) {
                    cache[id] = db.accounts.find(user => user.userId == id) || {};
                }
                const msgVO = { ...msg };
                msgVO.username = cache[id].username;
                return msgBodyType(msgVO);
            });
        })(await db.monitorAddMsg(params));

        // 设置最后一条消息
        params.endMsg = data[data.length - 1];
        data.forEach(msg => ws.send(msg.content))
    }

    (async () => {
        while (true) {
            // 启动监控
            try {
                await addMonitorAddMsg();
            } catch (error) {
                console.error('监控消息时出错:', error);
                ws.send(errResult(apiTag, `监控异常${ws.currentTopicId}: ${error.message}`));
                break;
            }
        }
    })();

    return result(apiTag, '监控中...' + ws.currentTopicId);
};

/**
 * 监控消息
 * @param {*} ws 
 * @param {*} params 
 * @returns 
 */
function im_m_getMsg(ws, params, apiTag = '/im/m_getMsg') {
    console.log('params', params)
    // 检查当前 ws 是否已经挂载了 topicId
    if (ws.currentTopicId !== params.topicId) {
        // 如果 topicId 不同，移除之前的监控并更新 topicId
        if (ws.currentTopicId) {
            lc.cacheSet.delete(ws); // 移除旧的监控
        }
        ws.currentTopicId = params.topicId; // 更新为新的 topicId
        lc.cacheSet.add(ws); // 添加到监控集合
    } else if (lc.cacheSet.has(ws)) {
        return result(apiTag, '已经在监控中...' + ws.currentTopicId);
    }

    async function addMonitorAddMsg() {
        const data = ((msgs) => {
            const cache = {};
            return msgs.map(msg => {
                const id = msg.userId;
                if (!cache[id]) {
                    cache[id] = db.accounts.find(user => user.userId == id) || {};
                }
                const msgVO = { ...msg };
                msgVO.username = cache[id].username;
                return msgVO;
            });
        })(await db.monitorAddMsg(params));

        // 设置最后一条消息
        params.endMsg = data[data.length - 1];
        ws.send(result(apiTag, data));
    }

    (async () => {
        while (true) {
            // 启动监控
            try {
                await addMonitorAddMsg();
            } catch (error) {
                console.error('监控消息时出错:', error);
                ws.send(errResult(apiTag, `监控异常${ws.currentTopicId}: ${error.message}`));
                break;
            }
        }
    })();

    return result(apiTag, '监控中...' + ws.currentTopicId);
}

/**
 * 返回值
 * @returns {string} 
 */
function result(api = '', data, code = 0) {
    return JSON.stringify({ api, code, data })
}
/** 异常时的返回值 */
function errResult(api, data, code = 500) {
    return result(api, data, code)
}