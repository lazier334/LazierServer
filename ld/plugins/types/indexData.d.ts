import type { PluginResult } from './plugins.ts';
/** 按钮选项 */
type IndexDataUrlItem = {
    /** 按钮文本 */
    text: string;
    /** 跳转地址 */
    url: string;
};
/** 选项数据 */
type IndexDataItem = {
    /** 图标 */
    icon: string;
    /** 项目名称 */
    name: string;
    /** 备注信息 */
    mark: string;
    /** 按钮链接数组 */
    urls: IndexDataUrlItem[];
};
type IndexDataArray = IndexDataItem[];
/**
 * indexData 插件函数
 */
type IndexDataFunction = (arr: IndexDataArray) => PluginResult;
/**
 * 创建 indexData 插件的类型提示函数
 * @param fun 自定义的插件函数
 * @returns
 */
export declare function createIndexData(fun: IndexDataFunction): IndexDataFunction;
export default createIndexData;
