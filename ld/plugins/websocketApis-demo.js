import { createWebsocketApis } from './types/index.ts';

/** 
 * 使用时需要传递客户端的消息进来，进行路由识别与操作
 * @param {Buffer|string|object} msg 转化后的消息内容
 * @param {import('ws').WebSocket} ws ws连接
 * @returns {boolean} 返回true则代表接口已处理，false则给下一个接口处理
 */
export default createWebsocketApis(async function websocketApisDemo(msg, ws) {
    if (false) {
        console.log('收到来自客户端的消息', msg)
    }
    return false
})