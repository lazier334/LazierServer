/**
 * @typedef {import('./common').EntryType} EntryType 请求对象
 * @typedef {import('./common').Config} Config 配置
 * @typedef {import('./common').Next} Next 下一个插件
 */

/**
 * 带有提示信息的编写插件函数，当前模块仅提供提示信息，不做其他操作
 * @param {(entry: EntryType, config: Config, next: Next)=>void} fun 
 */
module.exports = (fun) => {
    return fun;
}