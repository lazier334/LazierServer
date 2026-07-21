/**
 * 基础插件创建函数（运行时实现）
 */
export function createPlugin(fun) {
    return fun;
}

// 所有快捷常量都指向同一个函数（类型转换在编译期已完成）
export const createIndexData = createPlugin;
export const createKoaPlugin = createPlugin;
export const createKoaRouter = createPlugin;
export const createWebsocketApis = createPlugin;
export const createWebsocketMsgs = createPlugin;
export const createSystemStart = createPlugin;