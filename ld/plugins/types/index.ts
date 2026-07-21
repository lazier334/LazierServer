import createIndexDataType from './indexData.ts';
import createKoaRouterType from './koaRouter.ts';
import createWebsocketApisType from './websocketApis.ts';
import createWebsocketMsgsType from './websocketMsgs.ts';
import createSystemStartType from './systemStart.ts';
import createKoaPluginType from './koaPlugin.ts';

export const createIndexData = createPlugin as typeof createIndexDataType;
export const createKoaPlugin = createPlugin as typeof createKoaPluginType;
export const createKoaRouter = createPlugin as typeof createKoaRouterType;
export const createWebsocketApis = createPlugin as typeof createWebsocketApisType;
export const createWebsocketMsgs = createPlugin as typeof createWebsocketMsgsType;
export const createSystemStart = createPlugin as typeof createSystemStartType;

export function createPlugin<T>(fun: T): T {
    return fun;
}