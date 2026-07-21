
import type { WebSocket } from 'ws';
import type { IncomingMessage } from 'http';
import type { PluginResult } from './plugins.ts';

/**
 * websocketApis 插件函数
 */
export type WebsocketApisFunction = (msg: string | Buffer, message: Buffer, ws: WebSocket, req: IncomingMessage) => PluginResult;

/**
 * 创建 websocketApis 插件的类型提示函数
 * @param fun 自定义的插件函数
 * @returns 
 */
export function createWebsocketApis(fun: WebsocketApisFunction): WebsocketApisFunction {
    return fun;
}

export default createWebsocketApis;