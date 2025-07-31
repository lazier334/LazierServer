import WebSocket, { WebSocketServer } from 'ws';
import https from 'https';
import { plugins } from './plugins.js';

const inteCache = {};
export default createWebSocketServer;
export { createWebSocketServer };

/**
 * 创建websocket服务器
 * @param {import ('./config.js')} config 
 */
function createWebSocketServer(config) {
    const server = https.createServer(config.SSLOptions);
    const wss = bindWebSocketServer(new WebSocketServer({ server }));
    server.listen(config.portWSS, () => {
        console.log(`WebSockets 服务器已运行，访问地址\x1b[33m wss://localhost:${config.portWSS} \x1b[0m`);
        const ws = bindWebSocketServer(new WebSocketServer({ port: config.portWS }));
        console.log(`WebSocket  服务器已运行，访问地址  ws://localhost:${config.portWS}`);
        console.log('浏览器首次访问不受信任的https证书的wss之前，请先访问https并继续浏览器访问以授权证书');
    });

    /**
     * 绑定 WebSocket 服务器并处理连接、消息、关闭和错误事件
     * 
     * @param {WebSocket.Server} WS WebSocket 服务器实例
     * @returns {WebSocket.Server} 绑定事件后的 WebSocket 服务器实例
     */
    function bindWebSocketServer(WS) {
        WS.on('connection', async function connection(ws) {
            console.log('WebSocket 客户端已连接');
            ws.on('message', function incoming(message) {
                let msg = message;
                [
                    (d) => Buffer.isBuffer(d) ? d.toString('utf8') : d,
                    (d) => typeof d == 'string' ? JSON.parse(d) : d,
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
            ws.on('error', function error(err) {
                console.error('WebSocket 错误:', err)
            });

            // 连接上之后自动响应数据
            const data = [];
            await (await plugins('websocketMsgs')).use(data);
            sendData(ws, Symbol(ws), data);
        });

        return WS;
    }

    /**
     * 发送数据到 WebSocket 客户端
     * 
     * @param {WebSocket} wsc WebSocket 客户端连接实例
     * @param {symbol} id 客户端连接的唯一标识符
     * @param {[{
     *   "type": "receive",
     *   "time": 1740470525901,
     *   "opcode": 2,
     *   "data": "消息"|Buffer|object,
     *   "step": 331
     * }]} msgs 消息内容
     */
    function sendData(wsc, id, msgs) {
        if (!(Array.isArray(msgs))) return console.warn("websocket的消息列表msgs不是一个数组!", msgs);
        if (!inteCache[id]) inteCache[id] = 0;
        if (inteCache[id] < msgs.length) {
            let msg = msgs[inteCache[id]++];
            if (10000 < msg.step) {
                console.warn('websocket消息间隔过长', msg.step, 'ms')
            }
            setTimeout(() => {
                wsc.send(msg.data);
                sendData(wsc, id, msgs);
            }, msg.step < 1 ? 1 : msg.step);
        } else {
            console.log(msgs.length + '条消息发送结束')
        }
    }
}
