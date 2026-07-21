import { createWebsocketApis } from './types/index.js';
// 全局安装后请使用这种方式引入提示信息
// import { createWebsocketApis } from 'lazierserver/types';

/** 
 * 使用时需要传递客户端的消息进来，进行路由识别与操作
 */
export default createWebsocketApis(async function websocketApisDemo(msg, message, ws, req) {
    // 可以使用 req.url 来做api路由识别
    if (false && '/demo' == req.url.split('?').shift()) {
        console.log('收到来自客户端的消息', msg)
    }
    return { end: false }
})