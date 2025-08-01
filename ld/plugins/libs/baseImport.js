import fs from 'fs';
import path from 'path';
import app from 'koa';

/** @type {import('../../../src/libs/config.js')} */
const { config } = process.G;

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