/** 插件的标准返回值 */
export type PluginResult = {
    /** 是否提前结束插件 use 调用 */
    end: boolean,
    /** 返回值，默认未使用 */
    result: void
}