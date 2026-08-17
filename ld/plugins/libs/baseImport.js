import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';
/** 用于做类型提示 */
import ConfigType from '../../../dist/libs/configDef.js'
import UserCofnig from '../../conf.js';

/** 
 * @typedef {typeof ConfigType & typeof UserCofnig} LSConfig LazierServer合并默认配置与用户配置后的完整配置信息
 * @type {LSConfig}
 * 全局配置
 */
var config = {};

if (process?.LSStorage?.config) {
    config = process.LSStorage.config;
} else {
    // 单独启动脚本的时候没有基础环境，所以需要单独导入
    config = (await importSysModule('config.js', path.join(import.meta.dirname, '../../../dist/libs/'))).config;
    // 将配置挂载到全局对象中
    process.LSStorage.config = config;
}

export {
    fs,
    path,
    config,
    getUtilsModule,
    getConfigModule,
    importSysModule,
    getPluginsModule,
}

/**
 * 从最后往前找第一个匹配的位置替换其字符
 * @param {string} str 
 * @param {string} searchValue 
 * @param {string} replaceValue 
 * @returns 
 */
function lastReplace(str, searchValue, replaceValue) {
    let re = str.split(searchValue);
    let reEnd = re.pop();
    return 0 < re.length ? (re.join(searchValue) + replaceValue + reEnd) : (reEnd || str);
}

/** 
 * @typedef {'plugins.ts' | 'config.ts' | 'utils.ts' | 'config.js'} MODList 系统模块文件名称，完整列表请查看 {@link ../../../dist/libs/ 系统模块目录} 
 */
/**
 * 导入系统模块（获取系统模块）  
 * 如果尝试导入时 .js 文件不存在，则尝试导入 .ts 文件
 * @param {MODList} mod 系统模块文件名称，完整列表请查看 {@link ../../../dist/libs/ 系统模块目录}
 * @param {{string} } dirpath 
 * @returns 
 */
async function importSysModule(mod, dirpath) {
    dirpath = dirpath || config.configDirPath;
    let filepath = path.join(dirpath, mod);
    // 因为可能会尝试导入 ts 结尾的模块，所以使用两种尝试
    filepath = fs.existsSync(filepath) ? filepath : lastReplace(filepath, '.js', '.ts');
    filepath = fs.existsSync(filepath) ? filepath : lastReplace(filepath, '.ts', '.js');
    return await import(pathToFileURL(filepath).href);
}

/**
 * 获取 plugins 模块
 * @returns {import('../../../dist/libs/plugins.js')}
 */
async function getPluginsModule() {
    return await importSysModule('plugins.js');
}

/**
 * 获取 utils 模块
 * @returns {import('../../../dist/libs/utils.js')}
 */
async function getUtilsModule() {
    return await importSysModule('utils.js');
}

/**
 * 获取 config 模块
 * @returns {import('../../../dist/libs/config.js')}
 */
async function getConfigModule() {
    return config;
}