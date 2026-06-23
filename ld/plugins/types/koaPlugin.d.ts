import type { DefaultState, DefaultContext, Middleware } from 'koa';
/**
 * 创建 koaPlugin 插件的类型提示函数，
 * 返回的是koa的中间件函数，没有使用插件的 .use 方法进行调用
 * @param fun 自定义的插件函数
 * @returns
 */
export declare function createKoaPlugin<NewStateT = {}, NewContextT = {}>(middleware: Middleware<DefaultState & NewStateT, DefaultContext & NewContextT>): Middleware<DefaultState & NewStateT, DefaultContext & NewContextT>;
export default createKoaPlugin;
