import { createWebsocketMsgs } from './types/index.ts';
// 全局安装后请使用这种方式引入提示信息
// import { createWebsocketMsgs } from 'lazierserver/types';

/**
 * ws自动响应的数据示例
 */
export default createWebsocketMsgs(async function websocketMsgsDemo(arr) {
    // 普通数据
    if (false) arr.push(...[
        {
            "type": "receive",
            "time": 1740470623630,
            "opcode": 2,
            "data": "1",
            "step": 0
        },
        {
            "type": "receive",
            "time": 1740470624666,
            "opcode": 2,
            "data": "2",
            "step": 1036
        },
        {
            "type": "receive",
            "time": 1740470624667,
            "opcode": 2,
            "data": "3",
            "step": 1
        },
        {
            "type": "receive",
            "time": 1740470624859,
            "opcode": 2,
            "data": "4",
            "step": 192
        },
        {
            "type": "receive",
            "time": 1740470624861,
            "opcode": 2,
            "data": "5",
            "step": 2
        }
    ]);

    // 二进制数据
    if (false) arr.push(...createWebsocketMsgs.utils.parseBinaryWSMsgs([{
        type: 'receive',
        time: 1740981222799,
        opcode: 2,
        data: 'gAA4EgADAAFwEgACAAFwEgACAARjb2RlBAAAAMgAAXgHP/pmZmZmZmYAAWMIAAF4AAFhAwANAAFjAgE=',
        step: 100
    }]));

    return arr;
})