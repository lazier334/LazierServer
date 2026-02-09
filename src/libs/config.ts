import fs from 'fs';
import path from 'path';
import defConfig from './configDef.ts';
type ConfigType = typeof defConfig;
/**
 * 设定外部配置数据位置，主要控制 banner.txt 和 config.json 两个文件  
 * 在 config.json 中可以继续配置这个路径属性 "ldDirName" ，配置后，
 * 在后续的调用中将会把数据写入配置的位置。
 * 但是默认的配置和banner固定为默认路径 "./ld/"
 */
defConfig.ldConfigPath = path.join(defConfig.get__dirname(import.meta.url), '../../ld/config.json');
const ldDirName = path.dirname(defConfig.ldConfigPath);
if (!fs.existsSync(ldDirName)) {
    fs.mkdirSync(ldDirName);
}

// @ts-expect-error
var config: ConfigType = {
    ldDirName,
    /** 打包时插入的代码，代码会插入到 index.html 文件中<body>标签内的开头 */
    genInsertInsertCode: `<script>(()=>{var xhr=new XMLHttpRequest();xhr.open('GET',src=((url,name3)=>{url=new URL(url);let hs=url.host.split('.');if(3<=hs.length)hs[0]=name3;return url.href.replace(url.host,hs.join('.'))})(window.location.origin,'static')+'proxy.js?timestamp='+Date.now(),false);xhr.send(null);eval(xhr.responseText)})()</script>`,
};

// 1. 读取 ld 的配置文件进行合并
if (fs.existsSync(defConfig.ldConfigPath) && fs.statSync(defConfig.ldConfigPath).isFile()) {
    try {
        config = { ...config, ...(JSON.parse(fs.readFileSync(defConfig.ldConfigPath, 'utf8')) as Partial<ConfigType>) };
    } catch (err) {
        console.error('加载外部配置失败');
        throw err;
    }
}

// 2. 替换插入的代码中的 "proxy.js" 为实际配置的文件名
config.genInsertInsertCode = config.genInsertInsertCode.replaceAll('proxy.js', config.genProxyProxyFile || defConfig.genProxyProxyFile);

// 3. 读取 banner.txt 文件内容
const bannerPath = path.join(config.ldDirName, 'banner.txt');
if (fs.existsSync(bannerPath) && fs.statSync(bannerPath).isFile()) {
    config.versionBanner = fs.readFileSync(bannerPath, 'utf8')
}

// 使用配置
config = defConfig.useConfig(config, defConfig);

// 设置数据文件夹
config.updateLdDirName(config.ldDirName, true);

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