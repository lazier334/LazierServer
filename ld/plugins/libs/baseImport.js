import fs from 'fs';
import app from 'koa';
import path from 'path';
import { pathToFileURL } from 'url';

// 合并类型提示，用户配置不能使用 Config 作为提示信息除非额外增加自定义的提示，否则自定义的提示信息会失效
/** @type {import('../../../src/libs/config.ts')} */
const defConfigType = {};
/** @type {import('../../conf.js')} */
const userConfigType = {};
/** @type {typeof defConfigType.config & typeof userConfigType.default} */
var config = {};

/** 当前模块的配置数据 */
const lc = {
    dirs: ['dist', 'src'],
    extnames: ['js', 'ts'],
    replaceValue: '{placeholder}'
}

if (process?.G?.config) config = process.G.config;
else {
    // 单独启动脚本的时候没有基础环境，所以需要单独导入
    config = (await importSysModule('config.js', path.join(import.meta.dirname, '../../../src/libs/'))).config;
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
 * 从最后往前找第一个匹配的位置替换其字符
 * @param {string} str 
 * @param {string} searchValue 
 * @param {string} replaceValue 
 * @returns {[string, string | undefined]} 存在时，数组存在第二个，如果没有匹配上 char 则数组的第二个数据为 undefined
 */
function lastReplace(str, searchValue, replaceValue) {
    let re = str.split(searchValue);
    let reEnd = re.pop();
    return 0 < re.length ? (re.join(searchValue) + replaceValue + reEnd) : reEnd;
}
/**
 * 导入系统模块（获取系统模块）  
 * 优先从 dist 导入，如果没有则尝试从源码 src 导入
 * @param {'plugins.ts' | 'config.ts' | 'utils.ts'} mod 系统模块文件名称，完整列表请查看 {@link ../../../src/libs/ 系统模块目录}
 * @returns 
 */
async function importSysModule(mod, dirpath) {
    dirpath = dirpath || config.configDirPath;
    const dirpaths = [];
    dirpath = lastReplace(dirpath, 'src', lc.replaceValue);
    if (!dirpath.includes(lc.replaceValue)) dirpath = lastReplace(dirpath, 'dist', lc.replaceValue);
    if (dirpath.includes(lc.replaceValue)) {
        lc.dirs.forEach(dir => dirpaths.push(dirpath.replace(lc.replaceValue, dir)));
    } else {
        dirpaths.push(dirpath);
    }

    const mods = [mod];
    if (mod.endsWith('.js')) {
        mods.push(mod.substring(0, mod.length - 3) + '.ts')
    } else if (mod.endsWith('.ts')) {
        mods.unshift(mod.substring(0, mod.length - 3) + '.js')
    }

    const filepaths = [];
    dirpaths.forEach(dir => {
        mods.forEach(m => filepaths.push(path.join(dir, m)))
    });
    // 找到第一个存在文件的模块
    let filepath = filepaths.find(f => fs.existsSync(f) && fs.statSync(f).isFile());
    return await import(pathToFileURL(filepath));
}

/**
 * 获取 plugins 模块
 * @returns {import('../../../src/libs/plugins.ts')}
 */
async function getPluginsModule() {
    return await importSysModule('plugins.ts');
}

/**
 * 获取 utils 模块
 * @returns {import('../../../src/libs/utils.ts')}
 */
async function getUtilsModule() {
    return await importSysModule('utils.ts');
}

/**
 * 获取 config 模块
 * @returns {import('../../../src/libs/config.ts')}
 */
async function getConfigModule() {
    return config;
}