import fs from 'fs';
import path from 'path';
import app from 'koa';

/** @type {import('../../../src/libs/config.js')} */
var config = {};
if (process.G) config = process.G.config;
else {
    // 单独启动脚本的时候没有基础环境，所以需要单独导入
    const configPath = path.join(import.meta.dirname, '../../../src/libs/config.js')
    config = (await import(configPath)).config;
}

export {
    fs, path, config, app, importSysModule, getPluginsModule
}

async function importSysModule(mod) {
    return await import(path.join(config.configDirPath, mod));
}

/**
 * 获取 plugins 模块
 * @returns {import('../../../src/libs/plugins.js')}
 */
async function getPluginsModule() {
    return await importSysModule('plugins.js');
}