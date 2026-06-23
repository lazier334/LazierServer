import type { PluginResult } from './plugins.ts';
/** 选项数据 */
type Msg = {
    /** 类型，分别是 上传send 和 下传receive */
    "type": "send" | "receive";
    /** 时间戳(ms) 1740470623630 */
    "time": number;
    /** 不知道 */
    "opcode": number;
    /** 数据主体 */
    "data": string | Uint8Array;
    /** 间隔上一条消息的时间(ms) */
    "step": number;
};
type MsgArray = Msg[];
/**
 * websocketMsgs 插件函数
 */
type WebsocketMsgsFunction = (arr: MsgArray) => PluginResult;
/**
 * 创建 websocketMsgs 插件的类型提示函数
 * @param fun 自定义的插件函数
 * @returns
 */
export declare function createWebsocketMsgs(fun: WebsocketMsgsFunction): WebsocketMsgsFunction;
export declare namespace createWebsocketMsgs {
    var utils: {
        /**
         * 解析二进制的消息内容
         * @param {[Msg]} msgs 参数数据示例 {"type":"receive","time":1740981222799,"opcode":2,"data":"gAA4EgADAAFwEgACAAFwEgACAARjb2RlBAAAAMgAAXgHP/pmZmZmZmYAAWMIAAF4AAFhAwANAAFjAgE=","step":100}
         * @returns {[Msg]} 返回数据示例 {"type":"receive","time":1740981222799,"opcode":2,"data":"gAA4EgADAAFwEgACAAFwEgACAARjb2RlBAAAAMgAAXgHP/pmZmZmZmYAAWMIAAF4AAFhAwANAAFjAgE=","step":100}
         */
        parseBinaryWSMsgs(msgs: Msg[]): Msg[];
        /**
         * websocket消息使用
         * 将 Base64 字符串转换为 Uint8Array
         *
         * @param {string} base64 - 要转换的 Base64 字符串
         * @returns {Uint8Array} - 转换后的 Uint8Array
         */
        base64ToUint8Array(base64: string): Uint8Array<ArrayBuffer>;
        /**
         * websocket消息使用
         * 将 ArrayBuffer 转换为 Base64 字符串
         *
         * @param {Uint8Array} arrayBuffer - 要转换的 Uint8Array
         * @returns {string} - 转换后的 Base64 字符串
         */
        arrayBufferToBase64(arrayBuffer: Uint8Array): string;
    };
}
export default createWebsocketMsgs;
