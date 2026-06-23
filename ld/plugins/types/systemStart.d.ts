import type Koa from 'koa';
import type { PluginResult } from './plugins.ts';
/**
 * 参数
 */
type SystemOptions = {
    fs: typeof import('fs');
    path: typeof import('path');
    config: typeof import('../libs/baseImport.js').config;
    app: Koa<Koa.DefaultState, Koa.DefaultContext>;
};
/**
 * systemStart 插件函数
 */
type SystemStartFunction = (opt: SystemOptions) => PluginResult;
/**
 * 创建 systemStart 插件的类型提示函数
 * @param fun 自定义的插件函数
 * @returns
 */
export declare function createSystemStart(fun: SystemStartFunction): SystemStartFunction;
export default createSystemStart;
