import { createWebsocketMsgs } from './types/index.ts';

/**
 * 解析二进制的消息内容
 * @param {[{
 *   type: 'receive',
 *   time: 1740981222799,
 *   opcode: 2,
 *   data: 'gAA4EgADAAFwEgACAAFwEgACAARjb2RlBAAAAMgAAXgHP/pmZmZmZmYAAWMIAAF4AAFhAwANAAFjAgE=',
 *   step: 100
 * }]} msgs 
 * @returns {[{
 *   type: 'receive',
 *   time: 1740981222799,
 *   opcode: 2,
 *   data: 'gAA4EgADAAFwEgACAAFwEgACAARjb2RlBAAAAMgAAXgHP/pmZmZmZmYAAWMIAAF4AAFhAwANAAFjAgE=',
 *   step: 100
 * }]}
 */
function parseBinaryWSMsgs(msgs) {
    msgs.forEach(msg => msg.data = Buffer.from(base64ToUint8Array(msg.data)));
    return msgs;

    /**
     * websocket消息使用
     * 将 Base64 字符串转换为 Uint8Array
     * 
     * @param {string} base64 - 要转换的 Base64 字符串
     * @returns {Uint8Array} - 转换后的 Uint8Array
     */
    function base64ToUint8Array(base64) {
        // 解码 Base64 字符串为二进制字符串
        const binaryString = atob(base64);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);

        // 将二进制字符串转换为 Uint8Array
        for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes;
    }

    /**
     * websocket消息使用
     * 将 ArrayBuffer 转换为 Base64 字符串
     * 
     * @param {ArrayBuffer} arrayBuffer - 要转换的 ArrayBuffer
     * @returns {string} - 转换后的 Base64 字符串
     */
    function arrayBufferToBase64(arrayBuffer) {
        const uint8Array = new Uint8Array(arrayBuffer);
        let binaryString = '';
        for (let i = 0; i < uint8Array.length; i++) {
            binaryString += String.fromCharCode(uint8Array[i]);
        }
        return btoa(binaryString);
    }
}

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
    if (false) arr.push(...parseBinaryWSMsgs([{
        type: 'receive',
        time: 1740981222799,
        opcode: 2,
        data: 'gAA4EgADAAFwEgACAAFwEgACAARjb2RlBAAAAMgAAXgHP/pmZmZmZmYAAWMIAAF4AAFhAwANAAFjAgE=',
        step: 100
    }]));

    return arr;
})