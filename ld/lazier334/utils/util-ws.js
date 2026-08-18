/**
 * @typedef {Object} Msg websocket消息数据
 * @property {"send" | "receive"} type - 类型，分别是 上传send 和 下传receive
 * @property {number} time - 时间戳(ms) 1740470623630
 * @property {number} opcode - 不知道
 * @property {string | Uint8Array} data - 数据主体
 * @property {number} step - 间隔上一条消息的时间(ms)
 */

/**
 * websocket 处理消息的相关工具
 */
export {
    parseBinaryWSMsgs,
    base64ToUint8Array,
    arrayBufferToBase64
};

/**
 * 解析二进制的消息内容
 * @param {Msg[]} msgs 参数数据示例 [{"type":"receive","time":1740981222799,"opcode":2,"data":"gAA4EgADAAFwEgACAAFwEgACAARjb2RlBAAAAMgAAXgHP/pmZmZmZmYAAWMIAAF4AAFhAwANAAFjAgE=","step":100}]
 * @returns {Msg[]} 返回数据示例 [{"type":"receive","time":1740981222799,"opcode":2,"data":"gAA4EgADAAFwEgACAAFwEgACAARjb2RlBAAAAMgAAXgHP/pmZmZmZmYAAWMIAAF4AAFhAwANAAFjAgE=","step":100}]
 */
function parseBinaryWSMsgs(msgs) {
    msgs.forEach(msg => msg.data = Buffer.from(this.base64ToUint8Array(msg.data)));
    return msgs;
}

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
 * @param {Uint8Array} arrayBuffer - 要转换的 Uint8Array
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