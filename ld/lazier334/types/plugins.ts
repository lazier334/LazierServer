/** 插件的标准返回值 */
export type PluginResult = {
    /** 是否提前结束插件 use 调用 */
    end: boolean,
    /** 配合 end 字段使用，结束时使用该内容作为响应结果 */
    result: void
}