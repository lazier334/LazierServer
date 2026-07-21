import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';
import defConfig from './configDef.ts';
type ConfigType = typeof defConfig;
const __dirname = import.meta.dirname;
/**
 * 设定外部配置数据位置，主要控制 banner.txt 和 conf.js 两个文件  
 * 在 conf.js 中可以继续配置这个路径属性 "ldDirName" ，配置后，
 * 在后续的调用中将会把数据写入配置的位置。
 * 但是默认的配置和banner固定为默认路径 "./ld/"
 */
defConfig.ldConfigPath = path.join(__dirname, '../../ld/conf.js');
const dataPath = path.dirname(defConfig.ldConfigPath);
if (!fs.existsSync(dataPath)) {
    fs.mkdirSync(dataPath);
}

// @ts-expect-error
var config: ConfigType = {};

// 1. 读取 ld 的配置文件进行合并，配置选择优先级 运行路径的配置文件 > 项目的配置文件 > 默认配置
const getConfig = async (filepath: string): Promise<Partial<ConfigType> | undefined> => {
    try {
        return (await import(pathToFileURL(filepath).href)).default as Partial<ConfigType>;
    } catch { }
}
const cwdConfigPath = path.join(process.cwd(), 'conf.js');
let conf = await getConfig(cwdConfigPath);
if (!conf) {
    conf = await getConfig(defConfig.ldConfigPath);
    if (!conf) {
        conf = {};
        console.info('使用系统默认配置');
    } else console.info('使用配置文件:', defConfig.ldConfigPath);
} else console.info('使用配置文件:', cwdConfigPath);

config = { ...config, ...conf };

// 3. 读取 banner.txt 文件内容
const bannerPath = path.join(dataPath, 'banner.txt');
if (fs.existsSync(bannerPath) && fs.statSync(bannerPath).isFile()) {
    config.versionBanner = fs.readFileSync(bannerPath, 'utf8')
}

// 使用配置
config = defConfig.useConfig(config, defConfig);

// 设置数据文件夹
config.updateLdDirName(dataPath, true);

/**
 * 获取当前文件的储存空间，可以通过 process.G.getNowFileStorage 使用  
 * 参数传递  
 *  - getNowFileStorage - 会获得当前函数  
 *  - config - 会获得配置对象  
 * @param {'config'} filepath [import.meta.filename] 可以直接传路径
 * @returns {object}
 */
const getNowFileStorage = config.getNowFileStorage;

/**
 * 添加config到全局
 * @type {config}
 */
process.G.config = config;

export {
    fs,
    path,
    config,
    getNowFileStorage
};