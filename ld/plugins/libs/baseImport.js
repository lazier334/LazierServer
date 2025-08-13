import fs from 'fs';
import path from 'path';
import app from 'koa';
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
    fs, path, config, app, importSysModule, getPluginsModule, getUtilsModule, getConfigModule
}

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
 * 获取 plugins 模块
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