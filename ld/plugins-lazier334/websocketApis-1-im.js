import { createWebsocketApis } from './types/index.ts';
import utilsIM from './utils/utils-im.js';

// 不能直接在上面解构，有可能会报错
const { db, msgBodyType, Config } = utilsIM;
const lc = {
    close: false,
    moreLog: Config.moreLog ? console.debug : () => { },
    cacheSet: new Set()
}
const APIS = initAPIS();

/** 
 * 使用时需要传递客户端的消息进来，进行路由识别与操作
 */
export default createWebsocketApis(async function websocketApisDemo(msg, ws) {
    if (Config.switch.closeIM) return;
    try {
        if (typeof params != 'object') params = {};
        const re = APIS[params.api]?.(ws, params);
        ws.send(re);
    } catch (error) {
        console.error('im处理失败', error.message);
        lc.moreLog(error);
    }
})



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