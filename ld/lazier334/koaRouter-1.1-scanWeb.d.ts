import type { DefaultContext } from 'koa'
import type { SendOptions } from 'koa-send'

/** 可重写内容变更发送内容 */
export type SendFileType = {
    /** 发送的文件在磁盘上的完整路径 */
    sendFileFromPath: string;
    /** 发送文件时的配置对象, **可重写**内容变更发送内容 */
    sendOptions: {
        /** Koa 上下文 */
        ctx: DefaultContext;
        /** 要发送的文件名 */
        filename: string;
        /** koa-send 的配置选项 */
        opts: SendOptions;
        /** ['.edit'] 编辑后的文件的后缀 */
        editTag: '.edit';
        /** 新的文件路径，主要用于删除和检测是否已编辑过 */
        newFilepath: string;
        /** 使用 send 发送文件之前的处理函数 */
        sendBefore: () => Promise<void>;
        /** 使用 send 发送文件之后的处理函数 */
        sendAfter: (error?: any) => Promise<void>;
        /** 使用 send 发送的代理函数 */
        send: () => Promise<void>;
    };
}