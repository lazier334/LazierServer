import { createBuild } from './types/index.ts';

/**
 * 打包插件的demo
 */
export default createBuild(async function buildDemo(msgs) {
    if (false) msgs.push('运行了 build-1-demo.js 当前打包无手动处理需求');
})