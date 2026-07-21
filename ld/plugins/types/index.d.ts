// 导入依赖的类型（假设这些类型在对应的 .d.ts 或 .ts 文件中已定义）
import type { IndexDataFunction } from './indexData';
import type { KoaRouterFunction } from './koaRouter';
import type { WebsocketApisFunction } from './websocketApis';
import type { WebsocketMsgsFunction } from './websocketMsgs';
import type { SystemStartFunction } from './systemStart';
// createKoaPluginType 是默认导出的函数类型，来自 ./koaPlugin
// 原文件使用 import createKoaPluginType from './koaPlugin'
// 我们需要引用其默认导出的类型（如果 koaPlugin 有默认导出）
// 这里直接使用 typeof import('./koaPlugin').default 来获取其类型
type CreateKoaPluginType = typeof import('./koaPlugin').default;

/**
 * 基础插件创建函数
 */
export declare function createPlugin<T>(fun: T): T;

/**
 * 快捷创建函数，限定为 IndexDataFunction
 */
export declare const createIndexData: (fun: IndexDataFunction) => IndexDataFunction;

/**
 * 快捷创建函数，类型与 createKoaPluginType 一致
 */
export declare const createKoaPlugin: CreateKoaPluginType;

/**
 * 快捷创建函数，限定为 KoaRouterFunction
 */
export declare const createKoaRouter: (fun: KoaRouterFunction) => KoaRouterFunction;

/**
 * 快捷创建函数，限定为 WebsocketApisFunction
 */
export declare const createWebsocketApis: (fun: WebsocketApisFunction) => WebsocketApisFunction;

/**
 * 快捷创建函数，限定为 WebsocketMsgsFunction
 */
export declare const createWebsocketMsgs: (fun: WebsocketMsgsFunction) => WebsocketMsgsFunction;

/**
 * 快捷创建函数，限定为 SystemStartFunction
 */
export declare const createSystemStart: (fun: SystemStartFunction) => SystemStartFunction;