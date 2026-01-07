import type Router from '@koa/router';

/**
 * koaRouter 插件函数
 */
type KoaRouterFunction = (router: Router) => void;

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