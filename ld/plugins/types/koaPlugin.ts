import type {
    DefaultState,
    DefaultContext,
    Middleware
} from 'koa';

/**
 * 创建 koaPlugin 插件的类型提示函数
 * @param fun 自定义的插件函数
 * @returns 
 */
export function createKoaPlugin<
    NewStateT = {},
    NewContextT = {}
>(
    middleware: Middleware<DefaultState & NewStateT, DefaultContext & NewContextT>
): Middleware<DefaultState & NewStateT, DefaultContext & NewContextT> {
    return middleware;
}

export default createKoaPlugin;