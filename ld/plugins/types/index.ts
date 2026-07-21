import type { IndexDataFunction } from './indexData.ts';
import type { KoaRouterFunction } from './koaRouter.ts';
import type { WebsocketApisFunction } from './websocketApis.ts';
import type { WebsocketMsgsFunction } from './websocketMsgs.ts';
import type { SystemStartFunction } from './systemStart.ts';
import createKoaPluginType from './koaPlugin.ts';

export const createIndexData = createPlugin as (fun: IndexDataFunction) => IndexDataFunction;
export const createKoaPlugin = createPlugin as typeof createKoaPluginType;
export const createKoaRouter = createPlugin as (fun: KoaRouterFunction) => KoaRouterFunction;
export const createWebsocketApis = createPlugin as (fun: WebsocketApisFunction) => WebsocketApisFunction;
export const createWebsocketMsgs = createPlugin as (fun: WebsocketMsgsFunction) => WebsocketMsgsFunction;
export const createSystemStart = createPlugin as (fun: SystemStartFunction) => SystemStartFunction;

export function createPlugin<T>(fun: T): T {
    return fun;
}