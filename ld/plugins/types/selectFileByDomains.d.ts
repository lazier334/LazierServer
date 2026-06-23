import type { Context } from 'koa';
import type { PluginResult } from './plugins.ts';
/**
 * 域名列表
 * @example ["api.demo.com", "m.demo.com"]
 */
type DomainList = string[];
/**
 * 域名映射列表
 * 键：域名
 * 值：该域名对应的文件路径
 * @example {
 *     "api.demo.com": "api.demo.com/assets/index.js",
 *     "m.demo.com": "m.demo.com/assets/index.js"
 * }
 */
type DomainToFileMap = {
    [key: string]: string;
};
/**
 * selectFileByDomains 插件函数
 */
type SelectFileByDomainsFunction = (domainList: DomainList, domainsMap: DomainToFileMap, ctx: Context) => Omit<PluginResult, 'result'> & {
    /** 返回选中的域名 */
    result: string;
};
/**
 * 创建 selectFileByDomains 插件的类型提示函数
 * @param fun 自定义的插件函数
 * @returns
 */
export declare function createSelectFileByDomains(fun: SelectFileByDomainsFunction): SelectFileByDomainsFunction;
export default createSelectFileByDomains;
