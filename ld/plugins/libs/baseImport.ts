import fs from 'fs';
import app from 'koa';
import path from 'path';
import { pathToFileURL } from 'url';

/** 用于做类型提示 */
import userCofnig from '../../conf.js';
/** LazierServer合并默认配置与用户配置后的完整配置信息 */
export type LSConfig = typeof process.LSConfigDefType & typeof userCofnig;
/** 全局配置 */
var config = {} as LSConfig;

/** 把完整的配置类型导出，并在下方核对 process.LSConfig 对象 */
declare global {
    namespace NodeJS {
        interface Process {
            LSConfig: LSConfig
        }
    }
}

/** 当前模块的配置数据 */
const lc = {
    dirs: ['dist', 'src'],
    extnames: ['js', 'ts'],
    replaceValue: '{placeholder}'
}

if (process?.LSConfig) config = process.LSConfig;
else {
    // 单独启动脚本的时候没有基础环境，所以需要单独导入
    config = (await importSysModule('config.js', path.join(import.meta.dirname, '../../../src/libs/'))).config;
    // 将配置挂载到全局对象中
    process.LSConfig = config;
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
 * @param str 
 * @param searchValue 
 * @param replaceValue 
 * @returns 
 */
function lastReplace(str: string, searchValue: string, replaceValue: string): string {
    let re = str.split(searchValue);
    let reEnd = re.pop();
    return 0 < re.length ? (re.join(searchValue) + replaceValue + reEnd) : (reEnd || str);
}

/** 系统模块文件名称，完整列表请查看 {@link ../../../src/libs/ 系统模块目录} */
type MODList = 'plugins.ts' | 'config.ts' | 'utils.ts' | 'config.js';
/**
 * 导入系统模块（获取系统模块）  
 * 优先从 dist 导入，如果没有则尝试从源码 src 导入
 * @param mod 系统模块文件名称，完整列表请查看 {@link ../../../src/libs/ 系统模块目录}
 * @returns 
 */
async function importSysModule(mod: MODList, dirpath?: string) {
    dirpath = dirpath || config.configDirPath;
    const dirpaths = [];
    dirpath = lastReplace(dirpath, 'src', lc.replaceValue);
    if (!dirpath.includes(lc.replaceValue)) dirpath = lastReplace(dirpath, 'dist', lc.replaceValue);
    if (dirpath.includes(lc.replaceValue)) {
        lc.dirs.forEach(dir => dirpaths.push(dirpath.replace(lc.replaceValue, dir)));
    } else {
        dirpaths.push(dirpath);
    }

    const mods: string[] = [mod];
    if (mod.endsWith('.js')) {
        mods.push(mod.substring(0, mod.length - 3) + '.ts')
    } else if (mod.endsWith('.ts')) {
        mods.unshift(mod.substring(0, mod.length - 3) + '.js')
    }

    const filepaths: string[] = [];
    dirpaths.forEach(dir => {
        mods.forEach(m => filepaths.push(path.join(dir, m)))
    });
    // 找到第一个存在文件的模块
    let filepath = filepaths.find(f => fs.existsSync(f) && fs.statSync(f).isFile());
    if (typeof filepath != 'string') throw new Error('不能导入该类型的模块路径! 需要string类型的模块路径! 当前类型为: ' + typeof filepath);
    return await import(pathToFileURL(filepath).href);
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