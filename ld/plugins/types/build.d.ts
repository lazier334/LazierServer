import type { PluginResult } from './plugins.ts';
/**
 * build 插件函数
 * @param {[string]} manualProcessingMsgs 手动处理消息列表
 */
type buildFunction = (manualProcessingMsgs: [string]) => PluginResult;
/**
 * 创建 build 插件的类型提示函数
 * @param fun 自定义的插件函数
 * @returns
 */
export declare function createBuild(fun: buildFunction): buildFunction;
export default createBuild;
