import type Koa from 'koa';
import type { Server } from 'ws';
import WebSocket from 'ws';
import { config } from './config.ts';
import { completeFile, readKoaRouters } from './utils.ts';
import { plugins } from './plugins.ts';

// 拿到 config 的类定义
type ConfigType = typeof config;
// 定义WebSocket消息接口
interface WebSocketMessage {
    type: string;
    time: number;
    opcode: number;
    data: string | Buffer | object;
    step: number;
}

const inteCache: Record<symbol, number> = {};

export { initKoa, bindWebSocketServer };

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

/**
 * 绑定 WebSocket 服务器并处理连接、消息、关闭和错误事件
 * 
 * @param WS WebSocket 服务器实例
 * @returns 绑定事件后的 WebSocket 服务器实例
 */
function bindWebSocketServer(WS: Server): Server {
    WS.on('error', (err) => console.error('WebSocket Error:', err.message));
    WS.on('connection', async function connection(ws: WebSocket) {
        console.log('WebSocket 客户端已连接');
        ws.on('message', function incoming(message: Buffer | string) {
            let msg = message;
            [
                (d: Buffer | string) => Buffer.isBuffer(d) ? d.toString('utf8') : d,
                (d: Buffer | string) => typeof d == 'string' ? JSON.parse(d) : d,
            ].forEach(handle => {
                try {
                    msg = handle(msg)
                } catch (err) {
                    console.debug('处理ws消息时异常', err)
                }
            });
            plugins('websocketApis').then(mod => mod.use(msg, message, ws))
        });
        ws.on('close', function close() {
            console.log('客户端断开连接')
        });
        ws.on('error', function error(err: Error) {
            console.error('WebSocket 错误:', err)
        });

        // 连接上之后自动响应数据
        const data: WebSocketMessage[] = [];
        await (await plugins('websocketMsgs')).use(data);
        sendData(ws, Symbol(), data);
    });

    return WS;
}

/**
 * 发送数据到 WebSocket 客户端
 * @param wsc WebSocket 客户端连接实例
 * @param id 客户端连接的唯一标识符
 * @param msgs 消息内容
 */
function sendData(wsc: WebSocket, id: symbol, msgs: WebSocketMessage[]): void {
    if (!(Array.isArray(msgs))) return console.warn("websocket的消息列表msgs不是一个数组!", msgs);
    if (!inteCache[id]) inteCache[id] = 0;
    if (inteCache[id] < msgs.length) {
        let msg = msgs[inteCache[id]++];
        if (10000 < msg.step) {
            console.warn('websocket消息间隔过长', msg.step, 'ms')
        }
        setTimeout(() => {
            // @ts-ignore 这里是要读取消息对象内的 data 属性
            wsc.send(msg.data);
            sendData(wsc, id, msgs);
        }, msg.step < 1 ? 1 : msg.step);
    } else {
        console.log(msgs.length + '条消息发送结束')
    }
}