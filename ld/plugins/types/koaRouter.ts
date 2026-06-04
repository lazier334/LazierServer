import type Router from '@koa/router';
import type { PluginResult } from './plugins.ts';
import type { SendFileType } from '../../plugins-lazier334/koaRouter-1.1-scanWeb.js';
import type { SendEntryType } from '../../plugins-lazier334/koaRouter-1-scanHar.js';

/** 提供多个类型聚合，用于类型提示 */
type extendTypes = SendFileType & SendEntryType;

/**
 * koaRouter 插件函数
 */
type KoaRouterFunction = (router: Router, types: extendTypes) => PluginResult;

/**
 * 创建 koaRouter 插件的类型提示函数  
 * 动态路由 History 插件，顺序为： 插件API > 文件API > HarAPI > 系统API > vue的历史模式（或类似框架） > external
 * @param fun 自定义的插件函数
 * @returns 
 */
export function createKoaRouter(fun: KoaRouterFunction): KoaRouterFunction {
    return fun;
}

export default createKoaRouter;