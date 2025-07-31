/**
 * websocket 客户端示例
 */
const msgs = [
    'hello',
    'world',
    '!'
];
const WebSocket = require('ws');
var msgNum = 0;

// const ws = new WebSocket('ws://localhost:3010');
const ws = new WebSocket('wss://localhost:3011', {
    rejectUnauthorized: false   // 忽略证书无效的问题
});

ws.on('open', function open() {
    console.log('已连接到WebSocket服务器');
    let sendMsgNum = 0;
    let inteId = setInterval(() => {
        if (sendMsgNum < msgs.length) ws.send(msgs[sendMsgNum++ % msgs.length]);
        else clearInterval(inteId);
    }, 1000);
});

ws.on('message', function incoming(data) {
    msgNum++;
    console.log(`收到消息(${msgNum}):`, data);
});

ws.on('close', function close() {
    console.log('与WebSocket服务器断开连接');
});

ws.on('error', function error(err) {
    console.error('WebSocket连接错误:', err);
});