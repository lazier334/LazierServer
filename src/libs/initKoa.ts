import type Koa from 'koa';
import { config } from './config.ts';
import { completeFile, readKoaRouters } from './utils.ts';
import { plugins } from './plugins.ts';

export default initKoa;

/**
 * 初始化Koa
 * @param app 
 */
async function initKoa(app: Koa): Promise<void> {
    // 添加路由
    app.use(async (ctx: Koa.DefaultContext, next: Koa.Next) => {
        return await koaCompose((await plugins('koaPlugin')).data)(ctx as any, next)
    }).use(async (ctx: Koa.DefaultContext, next: Koa.Next) => {
        // 动态路由
        const routers = await readKoaRouters();
        if (config.switch.dynamicRouter && routers.match(ctx.path, ctx.method).route) {
            // 路由匹配成功，执行这里的内容
            const routersMiddleware = routers.routes();
            let re = await routersMiddleware(ctx as any, next);
            if (!ctx.next) return re;
            delete ctx.next;
        }
        // 路由匹配失败或者存在 ctx.next 时，走传统路由
        return await next();
    }).use(completeFile);
}

/**
 * 手写中间件组合函数 (类似 koa-compose)
 * @param {Array<Function>} middlewares 中间件数组
 * @returns {Function} 组合后的中间件函数
 */
function koaCompose(middlewares: Koa.Middleware[]): Koa.Middleware {
    // 确保输入是数组
    if (!Array.isArray(middlewares)) {
        throw new TypeError('Middleware stack must be an array!');
    }

    // 确保所有项都是函数
    for (const middleware of middlewares) {
        if (typeof middleware !== 'function') {
            throw new TypeError('Middleware must be composed of functions!');
        }
    }

    // 返回组合后的中间件函数
    return function (ctx: Koa.DefaultContext, next: Koa.Next) {
        // 当前执行中间件的索引
        let index = -1;

        // 递归调度函数
        function dispatch(i: number): Promise<void | Koa.Middleware | Koa.Next> {
            // 防止多次调用 next()
            if (i <= index) {
                return Promise.reject(new Error('next() called multiple times'));
            }

            // 更新当前索引
            index = i;

            // 当前要执行的中间件
            let fn: Koa.Middleware | Koa.Next | undefined = middlewares[i];

            // 如果执行到结尾了，使用外部的next（如果有）
            if (i === middlewares.length) {
                fn = next;
            }

            // 如果后面没有中间件了，直接返回空Promise
            if (!fn) {
                return Promise.resolve();
            }

            try {
                // 调用当前中间件，传入ctx和下一个中间件的包装函数
                return Promise.resolve(
                    // @ts-ignore
                    fn(ctx, function next() {
                        return dispatch(i + 1);
                    })
                );
            } catch (err) {
                // 捕获中间件执行中可能的错误
                return Promise.reject(err);
            }
        }

        // 从第一个中间件开始执行
        return dispatch(0);
    };
}