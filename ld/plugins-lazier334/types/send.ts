import type Router from '@koa/router';

/**
 * send 插件函数
 */
type SendFunction = (router: Router) => void;

/**
 * 创建 send 插件的类型提示函数  
 * @param fun 自定义的插件函数
 * @returns 
 */
export function createSend(fun: SendFunction): SendFunction {
    return fun;
}

export default createSend;