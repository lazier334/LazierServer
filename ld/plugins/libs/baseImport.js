import fs from 'fs';
import app from 'koa';
import path from 'path';
import { pathToFileURL } from 'url';

/** @type {import('../../../src/libs/config.js')} */
const nilConfig = {};
var config = nilConfig.config || {};
if (process.G) config = process.G.config;
else {
    // 单独启动脚本的时候没有基础环境，所以需要单独导入
    const configPath = path.join(import.meta.dirname, '../../../src/libs/config.js')
    config = (await import(configPath)).config;
}

export {
    fs,
    app,
    path,
    config,
    getUtilsModule,
    getConfigModule,
    importSysModule,
    getPluginsModule,
}

/**
 * 导入系统模块（获取系统模块）
 * @param {'plugins.js' | 'config.js' | 'utils.js'} mod 系统模块文件名称，完整列表请查看 {@link ../../../src/libs/ 系统模块目录}
 * @returns 
 */
async function importSysModule(mod) {
    const filepath = pathToFileURL(path.join(config.configDirPath, mod));
    return await import(filepath);
}

/**
 * 获取 plugins 模块
 * @returns {import('../../../src/libs/plugins.js')}
 */
async function getPluginsModule() {
    return await importSysModule('plugins.js');
}

/**
 * 获取 utils 模块
 * @returns {import('../../../src/libs/utils.js')}
 */
async function getUtilsModule() {
    return await importSysModule('utils.js');
}

/**
 * 获取 config 模块
 * @returns {import('../../../src/libs/config.js')}
 */
async function getConfigModule() {
    return config;
}