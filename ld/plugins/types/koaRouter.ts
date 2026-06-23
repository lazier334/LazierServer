import type Router from '@koa/router';
import type { PluginResult } from './plugins.ts';
import type { SendFileType } from '../../lazier334/koaRouter-1.1-scanWeb.js';
import type { SendEntryType } from '../../lazier334/koaRouter-1-scanHar.js';

/** 提供多个类型聚合，用于类型提示 */
type extendTypes = SendFileType & SendEntryType;

/**
 * koaRouter 插件函数
 */
type KoaRouterFunction = (router: Router, types: extendTypes) => PluginResult;

/**
 * 创建 koaRouter 插件的类型提示函数  
 * 动态路由 History 插件，顺序为： 插件API > 文件API > HarAPI > 系统API > vue的历史模式（或类似框架） > external  
 * 具体的路由插件顺序可以通过接口 `/system/getRouterSort` 来查看，由于 文件API(scanWeb) 和 HarAPI(scanHar) 是都
 * 会往后放行，所以他们的插件顺序需要反过来，先走 har 再走 web
 * @param fun 自定义的插件函数
 * @returns 
 */
export function createKoaRouter(fun: KoaRouterFunction): KoaRouterFunction {
    return fun;
}

export default createKoaRouter;