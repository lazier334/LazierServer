import type { PluginResult } from './plugins.ts';

/** 选项数据 */
type Msg = {
    /** 类型，分别是 上传send 和 下传receive */
    "type": "send" | "receive",
    /** 时间戳(ms) 1740470623630 */
    "time": number,
    /** 不知道 */
    "opcode": number,
    /** 数据主体 */
    "data": string | Uint8Array,
    /** 间隔上一条消息的时间(ms) */
    "step": number
}

// 选项数据列表
type MsgArray = Msg[];

/**
 * websocketMsgs 插件函数
 */
export type WebsocketMsgsFunction = (arr: MsgArray) => PluginResult;

/**
 * 创建 websocketMsgs 插件的类型提示函数
 * @param fun 自定义的插件函数
 * @returns 
 */
export function createWebsocketMsgs(fun: WebsocketMsgsFunction): WebsocketMsgsFunction {
    return fun;
}

export default createWebsocketMsgs;