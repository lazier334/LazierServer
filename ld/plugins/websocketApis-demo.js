import { createWebsocketApis } from './types/index.ts';

/** 
 * 使用时需要传递客户端的消息进来，进行路由识别与操作
 */
export default createWebsocketApis(async function websocketApisDemo(msg, ws) {
    if (false) {
        console.log('收到来自客户端的消息', msg)
    }
    return {}
})