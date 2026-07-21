import { createSystemStart } from './types/index.js';
// 全局安装后请使用这种方式引入提示信息
// import { createSystemStart } from 'lazierserver/types';

/**
 * 用于系统启动阶段进行操作
 */
export default createSystemStart(async function systemStartDemo({ fs, path, config, app }) {
})