
import type { WebSocket } from 'ws';

/**
 * websocketApis 插件函数
 */
type WebsocketApisFunction = (msg: string | Buffer, ws: WebSocket) => boolean;

/**
 * 创建 websocketApis 插件的类型提示函数
 * @param fun 自定义的插件函数
 * @returns 
 */
export function createWebsocketApis(fun: WebsocketApisFunction): WebsocketApisFunction {
    return fun;
}

export default createWebsocketApis;