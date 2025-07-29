import * as baseImport from './baseImport.js';
import defConfig from './configDef.js';
const { fs, path } = baseImport;
// 设定外部配置数据位置
defConfig.ldConfigPath = path.join(process.cwd(), './ld/config.json');

/** @type {defConfig} */
var config = {
    SSLOptions: {
        key: fs.readFileSync(path.join(process.cwd(), './public/localhost.key')),
        cert: fs.readFileSync(path.join(process.cwd(), './public/localhost.crt'))
    },
    /** 打包时插入的代码，代码会插入到 index.html 文件中<body>标签内的开头 */
    genInsertInsertCode: `<script>(()=>{var xhr=new XMLHttpRequest();xhr.open('GET',src=((url,name3)=>{url=new URL(url);let hs=url.host.split('.');if(3<=hs.length)hs[0]=name3;return url.href.replace(url.host,hs.join('.'))})(window.location.origin,'static')+'proxy.js?timestamp='+Date.now(),false);xhr.send(null);eval(xhr.responseText)})()</script>`,
    pluginDirs: [/* 由下面的代码添加 path.dirname(defConfig.ldConfigPath) */],
    outdir: "website",
    butsData: [],
    switch: {
        cryptoDataEnable: false,
    },
    pluginDirs: [process.cwd() + '/src/plugins'],
};

if (fs.existsSync(path.dirname(defConfig.ldConfigPath))) {
    config.pluginDirs.push(path.dirname(defConfig.ldConfigPath));
    if (fs.existsSync(defConfig.ldConfigPath) && fs.statSync(defConfig.ldConfigPath).isFile()) {
        // 读取 ld 的配置文件进行合并
        try {
            config = { ...config, ...JSON.parse(fs.readFileSync(defConfig.ldConfigPath)) };
        } catch (err) {
            console.error('加载外部配置失败')
            throw err;
        }
    }
} else {
    // 如果不存在外部的配置，那么设定当前ld作为目录
    defConfig.ldConfigPath = path.join(process.cwd(), defConfig.ldDirName);
}
// 设置数据路径
defConfig.dataPath = path.dirname(defConfig.ldConfigPath);

// 合并按钮
config?.butsData?.forEach(but => defConfig.butsData.push(but));
delete config.butsData;
// 检测是否关闭了 debug 模式，如果已关闭调试模式则不开启编辑文件功能
if (config.switch.debugMode != undefined ? !config.switch.debugMode : !defConfig.switch.debugMode) {
    defConfig.butsData = defConfig.butsData.filter(but => !but.debugMode);
}

// 替换插入的代码中的 proxy.js 为实际配置的文件名
config.genInsertInsertCode = config.genInsertInsertCode.replaceAll('proxy.js', config['genProxyProxyFile']);
// 读取 banner.txt 文件内容
const bannerPath = path.join(process.cwd(), 'banner.txt');
if (fs.existsSync(bannerPath) && fs.statSync(bannerPath).isFile()) {
    config.versionBanner = fs.readFileSync(bannerPath, 'utf8')
}
config = defConfig.useConfig(config, defConfig);

export {
    config
};
export * from './baseImport.js';