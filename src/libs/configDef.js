import { fileURLToPath, pathToFileURL } from 'url';
import path from 'path';

/** 配置工具 */
const ConfigUtils = {
    readObj,
    appendObj,
    selectConfig: readObj,
    useConfig: appendObj,
    readVersion,
    isMainModule,
    get__dirname,
}
/** ld 文件夹名称 */
const ldDirName = 'ld';
/** 系统配置 */
const system = {
    /** 系统状态 */
    status: {
        /** 系统是否正在重启 */
        restarting: false,
        /** 系统id-也是系统启动时间 */
        systemId: Date.now()
    }
}
/** Obfuscator混淆配置 */
const ObfuscatorOptions = {
    /** 预设配置（default/medium/high/low/custom） */
    optionsPreset: 'default',
    /** 目标环境（browser/node/browser-no-eval） */
    target: 'browser',
    /** 随机种子（0表示随机） */
    seed: 0,
    /** 是否禁用控制台输出 */
    disableConsoleOutput: true,
    /** 是否启用自我防御（检测代码是否被格式化） */
    selfDefending: true,
    /** 是否启用调试保护（阻止在开发者工具中调试） */
    debugProtection: true,
    /** 调试保护间隔（毫秒，0表示禁用）原配置 100  */
    debugProtectionInterval: 0,
    /** 是否忽略import/require语句 */
    ignoreImports: false,
    /** 域名锁定（仅允许指定域名运行代码） */
    domainLock: [],
    /** 当域名不匹配时重定向的URL */
    domainLockRedirectUrl: 'about:blank',
    /** 是否生成源映射 */
    sourceMap: true,
    /** 源映射模式（inline/separate） */
    sourceMapMode: 'separate',
    /** 源映射基础URL */
    sourceMapBaseUrl: './',
    /** 源映射文件名 */
    sourceMapFileName: '.map',
    /** 源映射内容模式（sources/sources-content） */
    sourceMapSourcesMode: 'sources-content',
    /** 是否启用字符串数组（将字符串存入数组并引用） */
    stringArray: true,
    /** 是否旋转字符串数组 */
    stringArrayRotate: true,
    /** 是否打乱字符串数组顺序 */
    stringArrayShuffle: true,
    /** 使用字符串数组的阈值（0-1）*/
    stringArrayThreshold: 0.75,
    /** 是否启用字符串数组索引偏移 */
    stringArrayIndexShift: true,
    /** 字符串数组索引类型（hexadecimal-number/hexadecimal-numeric-string） */
    stringArrayIndexesType: [
        'hexadecimal-number',
        'hexadecimal-numeric-string'
    ],
    /** 是否转换字符串数组调用方式 */
    stringArrayCallsTransform: true,
    /** 字符串数组调用转换的阈值（0-1） */
    stringArrayCallsTransformThreshold: 0.5,
    /** 字符串数组包装器数量 */
    stringArrayWrappersCount: 1,
    /** 字符串数组包装器类型（variable/function） */
    stringArrayWrappersType: 'variable',
    /** 字符串数组包装器参数最大数量 */
    stringArrayWrappersParametersMaxCount: 2,
    /** 是否链式调用字符串数组包装器 */
    stringArrayWrappersChainedCalls: true,
    /** 字符串数组编码方式（base64/rc4等） */
    stringArrayEncoding: ['none', 'base64', 'rc4'],
    /** 是否拆分字符串（如'hello' -> 'hel' + 'lo'） */
    splitStrings: true,
    /** 字符串拆分的最小长度 */
    splitStringsChunkLength: 8,
    /** 是否使用Unicode转义序列 */
    unicodeEscapeSequence: true,
    /** 强制转换的字符串列表（无论是否匹配都会编码） */
    forceTransformStrings: [],
    /** 保留的字符串（不编码） */
    reservedStrings: [],
    /** 标识符生成方式（hexadecimal: 十六进制，mangled: 短名称） */
    identifierNamesGenerator: 'hexadecimal',
    /** 自定义标识符字典（用于生成标识符） */
    identifiersDictionary: [],
    /** 标识符前缀 */
    identifiersPrefix: '',
    /** 是否重命名全局变量 */
    renameGlobals: false,
    /** 是否重命名对象属性 */
    renameProperties: false,
    /** 属性重命名模式（safe/unsafe） */
    renamePropertiesMode: 'safe',
    /** 保留的变量名（不混淆） */
    reservedNames: [],
    /** 是否压缩代码（删除换行、缩进等） */
    compact: true,
    /** 是否简化代码（移除冗余结构） */
    simplify: false,
    /** 是否转换对象键名 */
    transformObjectKeys: true,
    /** 是否将数字转换为表达式（如123 -> 0x7B） */
    numbersToExpressions: true,
    /** 是否启用控制流扁平化（增加代码复杂度） */
    controlFlowFlattening: true,
    /** 控制流扁平化的概率阈值（0-1，值越大被扁平化的节点越多） */
    controlFlowFlatteningThreshold: 0.5,
    /** 是否注入死代码（无用的随机代码） */
    deadCodeInjection: true,
    /** 死代码注入的概率阈值（0-1） */
    deadCodeInjectionThreshold: 0.9,

    // ----- 以下配置用不上 ---------------------
    /** 标识符名称缓存（null表示不缓存） */
    identifierNamesCache: null,
    /** 输入文件名（用于源映射） */
    inputFileName: '',
    /** 是否打印混淆过程日志 */
    log: false,
};
const config = {
    /** ld 文件夹名称 */
    ldDirName,
    /** 系统配置 */
    system,
    /** 配置工具 */
    ...ConfigUtils,
    /** Obfuscator混淆配置 */
    ObfuscatorOptions,
    /** 显示版本banner信息 */
    showVersion,
    /** banner显示模版 */
    versionBanner: `当前服务器版本 v.{version} - {detail}`,
    /** 版本信息 */
    version: {
        "1.0(25071500)": `快速构建一个服务器站点`
    },
    /** 输入路径 */
    rootDir: process.cwd() + '/web',
    /** 输出路径 */
    outdir: "html",
    /** 打包时插入的代码，代码会插入到 index.html 文件中<body>标签内的开头 */
    genInsertInsertCode: "<script src=\"/b41e93b2-009a-4be6-8d16-cb3c3e176620\"></script>",
    /** 生成插件时导出的函数列表，根据需求选择导出 */
    genProxyExportKeys: [
        "proxyXHRAndFetch",
        "proxyDocmentHeadAppendChild",
        "navigatorServiceWorkerRegister",
        "removeScriptElement",
        "clearLoopDebugger"
    ],
    /** 导出插件-强制开启https，会让插件强制把所有请求转为https */
    genProxyForceHttps: true,
    /** 导出插件-存放的文件夹 */
    genProxyTargetDir: "web/plugin",
    /** 导出插件-导出的文件名 */
    genProxyProxyFile: "proxy.js",
    /** 一键打包时是否生成新的插件 */
    genAllGenProxy: true,
    /** 本地开发使用生产环境模式 */
    indexUseProdMode: false,
    /** 本地开发环境中插入的代码，代码会插入到 index.html 文件中<body>标签内的开头 */
    indexInsertCode: "<script src=\"/proxy.js\"></script>",
    /** http 服务器端口 */
    portHttp: 3000,
    /** https 服务器端口 */
    portHttps: 3001,
    /** websocket 服务器端口 */
    portWS: 3010,
    /** websockets 服务器端口 */
    portWSS: 3011,
    /** 自动补全超时时间 */
    timeout: 30 * 1000,
    /** 代理地址，用于下载文件进行文件自动补全 */
    proxy: "http://localhost:7890",
    /** 自动补全的域名列表 */
    autoCompleteDomains: [],
    /** 自动补齐的固定地址列表，在访问新版首页的时候将会被触发补全机制 */
    fixUrls: [],
    /** 是否开启自动补全，自动补全并不会影响0大小文件的自动补全 */
    autoComplete: true,
    /** 扫描全部文件夹，开启后会扫描web中的所有文件夹 */
    allDir: true,
    /** 不扫描全部文件夹时指定仅扫描web文件夹里的哪些文件夹 */
    domainList: [],
    /** https的证书 */
    SSLOptions: {
        key: `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCz2PDKUlnc2Tbv
/BzJRmeCu8vhR8/0SkNIdFsLa0o4z64s+yLhskyb1N5Mw46ODOmRbZDfNupHtUvK
ShlGZKEiex3YaQixbf0d0qLvRSXQlrF6SVaA+Hw/xekk8h9E80chsEQjZ9RBhlhn
WK8M7F2vMOVdKEPZDVn6WXV5yjCxmDlK6+o/dl/vAsSA/hQ50+uZwR9MYaPOqEUh
MjFPx9xgu9avJ2S8BMP2dXu2nDQnMN7i9p4LgO+nZ9IEylH9Gws0fX1PPSzT+0KP
s08pmSs93dCFFNDXlt9pxL0fzDZtUQNtG0wgvZu7QQp21H3cEaG72l6+FgZlVdHw
stlabbuhAgMBAAECggEAAVrH1IRKhjvyGpxj5J21w6Gxu06IydKh31q2AVfjaRpi
Wdch6ACJbG6N5pbd/OKqwzRHsDC4EsZyLdHBTzsMjieOfd3rqXd2PbpjjQkQq/mo
mE7TWpkUiX/ufb9fniu1bFLpLnmWmxA9m/iqZ97jZUGJZrpaCXlc5UJ1fK95zqqf
PpVEcQGfE69ydeTkoq97NBbPOvPUaRhTOpuqWhbL9P9yHNfu/SioQtG8TiIZmdCv
QJzRk5wUPg+tHLB1Q8eLJozfh9aaXO31SdrLlBzZlqc9YnTeWCF9VWWz8Gkh8e4t
LGL2g0r5aHngshWSIh5qQ1qOqL3lAAtl0Iw/mxaKIQKBgQDgHuUlqSYW5v/GPxNV
Es8l2xq3fEk8SNCoefZ2wfXJaplIcy4iQMwNpJKscPA0aOm+8gexjXMhCyPjrYi3
JqTYb4xxeVOxmg//GyH+4uNMjcvAG2MBggxOoeca7eNGj1PopInHQFGuzGN8EdcI
TreEj4y/pT5z1anoasIE6gOHcQKBgQDNbeJSnB2MOhwzLGfYt9hsgcVr5AfhPcM3
0VxK2wRKbgy3cY+t6nPwvaEkAPComHcw5rf7gSZSyKYeQKkG6PjLlOSOvYhlfhRh
TsuP+87aeO1q361gF5akSZCTKUA0GMnF5JFP2HRg3mGE0ePemjo3OTtmBjWCpT80
0KcsCiw/MQKBgD1xWuMDR3T56V9BRZyKJo47TkzFXxKO5914alBOhoKsnc9V/GzZ
lNecqbVq1P+ZT5PQqLlNjSWe9zzhA10q1ACePEOTvpUvJnmKx7woGaaQLS7Ck1cD
fzpDeqdQVoGuo5NhIICmqn4gfJm0Dl6xrfBCppSXydJZ3lXghsZwHX2RAoGABF0B
IaAPQJs7XhrjWccN4cAf4VrGkBIvw0+/Fhfwz2PnAT54PslsDQD6Gzmp4uraHT/J
SJ5FohyA6sOU04C/SBOxhxaffwhehnKWAEjo69sFr+9wT0ow+OxXFckahADCyGFC
dN+0GRqgF6IdpOzBr8qXaGNZX50C6qxD4LuWlQECgYEAztkCxOPu2yHSEDsQ96fr
c9UgFm4CDJ44EdmcebMIVjtHJJ5ixA19KZGXtHfWU1dV+2VHD55fph+WU6l+oebP
vXow3pKURccZ9pt5HJwV6WuktWmvRXxmmYBQkY4EI8u7OweZf9lk5fRAoHpueVEY
GDkKZUp+Ho82YdqJD5uNZS0=
-----END PRIVATE KEY-----
`,
        cert: `-----BEGIN CERTIFICATE-----
MIIDfzCCAmegAwIBAgIUJXzQJ/fk7vNM3f5KwQx6DbppTtQwDQYJKoZIhvcNAQEL
BQAwTjELMAkGA1UEBhMCQ04xEzARBgNVBAgMClNvbWUtU3RhdGUxFjAUBgNVBAoM
DUxhemllcjMzNCBERVYxEjAQBgNVBAMMCWxvY2FsaG9zdDAgFw0yNTA3MTUwNzQx
MDVaGA8yMTI1MDYyMTA3NDEwNVowTjELMAkGA1UEBhMCQ04xEzARBgNVBAgMClNv
bWUtU3RhdGUxFjAUBgNVBAoMDUxhemllcjMzNCBERVYxEjAQBgNVBAMMCWxvY2Fs
aG9zdDCCASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoCggEBALPY8MpSWdzZNu/8
HMlGZ4K7y+FHz/RKQ0h0WwtrSjjPriz7IuGyTJvU3kzDjo4M6ZFtkN826ke1S8pK
GUZkoSJ7HdhpCLFt/R3Sou9FJdCWsXpJVoD4fD/F6STyH0TzRyGwRCNn1EGGWGdY
rwzsXa8w5V0oQ9kNWfpZdXnKMLGYOUrr6j92X+8CxID+FDnT65nBH0xho86oRSEy
MU/H3GC71q8nZLwEw/Z1e7acNCcw3uL2nguA76dn0gTKUf0bCzR9fU89LNP7Qo+z
TymZKz3d0IUU0NeW32nEvR/MNm1RA20bTCC9m7tBCnbUfdwRobvaXr4WBmVV0fCy
2Vptu6ECAwEAAaNTMFEwHQYDVR0OBBYEFNV+4+ZsZviCbTMWxLnwEquONnCtMB8G
A1UdIwQYMBaAFNV+4+ZsZviCbTMWxLnwEquONnCtMA8GA1UdEwEB/wQFMAMBAf8w
DQYJKoZIhvcNAQELBQADggEBACZlQwCQE3rL8Bfp6ErBugaGKu05PVaBf+Y8pRId
URa3yl5mEvGO66SupX1ZopXrUp1urTH2ZVFin76Jnbc4JflmA2kj+CF3VBGwLfWD
FPD58+Tug7zqeghVeLB9Hz0XJCheKFEmn9wGUScm+XDLfS2JL37G7y4EhXTSS/pO
JePJv0eADPAi7ru4QOYE9J0Bs/u8U2eX1Etp9scM/iU7k6yPVzrP9yOoVxX2BQ7E
gmYN1hV4gHISGF5Sh1kOjoI+ik1+GcYMuwAhOY+b7ES8epdUAhnYmrZUCxvkf2/m
EqYmow8H3i2N5ChIsMytR0jShPQgXnwEx7PjvFiUGs7AtZQ=
-----END CERTIFICATE-----
`,
    },
    /**
     * @type {[{
     *      avatarText: 'word',         // 头像内部的文字
     *      color: '',                  // 头像的背景颜色，默认是绿色
     *      text: '编辑快捷词',           // 按钮文字 
     *      tooltip: '编辑快捷词数据文件', // 鼠标悬停提示文字
     *      debugMode: true,            // 是否在调试模式下才显示的按钮
     *      fun: `this.openPage()`      // 按钮点击后执行的代码
     *      update(self, config) {      // 如果需要动态数据，则添加这个函数，在接口处实现内容
     *          self.fun = `this.openPage('/edit/index.html?filepath=${config.ldConfigPath}')`
     *      },
     *  }]}
     */
    butsData: [
        {
            avatarText: 'fix',
            text: '补齐文件',
            tooltip: '补齐配置中指定的文件',
            fun: `this.getFixUrls()`
        },
        {
            avatarText: 'serve',
            color: 'darkorange',
            text: '重启系统',
            tooltip: '重新启动服务器',
            debugMode: true,
            fun: `this.systemRestart()`
        },
        {
            avatarText: 'close',
            color: 'orangered',
            text: '关闭系统',
            tooltip: '关闭服务器',
            debugMode: true,
            fun: `this.systemShutdown()`
        },
        {
            update(self, config) {
                self.fun = `this.openPage('/edit/index.html?filepath=${encodeURIComponent(config?.ldConfigPath)}')`
            },
            avatarText: 'conf',
            text: '编辑配置',
            tooltip: '编辑配置文件',
            debugMode: true,
            fun: `this.openPage('/edit/index.html?filepath=config.js')`
        },
        {
            update(self, config) {
                self.fun = `this.openPage('/edit/index.html?filepath=${encodeURIComponent(config.dataPath + '/searchButsData.json')}')`
            },
            avatarText: 'word',
            text: '编辑快捷词',
            tooltip: '编辑快捷词数据文件',
            debugMode: true,
            fun: `this.openPage('/edit/index.html?filepath=searchButsData.json')`
        },
        {
            update(self, config) {
                self.fun = `this.openPage('/edit/index.html?filepath=${encodeURIComponent(config.dataPath + '/indexData-list.js')}')`
            },
            avatarText: 'list',
            text: '编辑项目列表',
            tooltip: '编辑项目列表数据文件',
            debugMode: true,
            fun: `this.openPage('/edit/index.html?filepath=indexData-list.json')`
        },
        {
            avatarText: 'im',
            text: '管理连接',
            tooltip: '给指定的连接发送消息',
            fun: `this.openPage('/im/index.html')`
        },
        {
            avatarText: 'tus',
            text: '文件上传',
            tooltip: '上传文件到服务器',
            fun: `this.openPage('/uploads/index.html')`
        },
        {
            avatarText: 'clear',
            text: '清理缓存',
            tooltip: '清理worker缓存',
            fun: `(${(async function () {
                try {
                    // 1. 取消注册所有 Service Worker
                    const registrations = await navigator.serviceWorker.getRegistrations();
                    for (const registration of registrations) {
                        await registration.unregister();
                        console.log('Service Worker 已取消注册:', registration.scope);
                    }
                    // 2. 清理所有缓存
                    const cacheNames = await caches.keys();
                    for (const cacheName of cacheNames) {
                        await caches.delete(cacheName);
                        console.log(`已删除缓存: ${cacheName}`);
                    }
                    console.log('SW清理成功');
                    ElMessage.success('SW清理成功');
                } catch (err) {
                    console.error('SW清理失败:', err);
                    ElMessage.error('SW清理失败');
                    throw err;
                }
            }).toString()})()`
        },
    ],
    /** 插件目录列表 */
    pluginDirs: [process.cwd() + '/src/plugins'],
    /** 外部配置路径，改文件所在的 ld 目录也用于存放自定义插件 */
    ldConfigPath: 'config.json',
    /** 数据路径 */
    dataPath: process.cwd() + '/' + ldDirName,
    /** debug模式 */
    debugMode: true,
    /** 加密时使用的key */
    cryptoKey: '',
    /** 是否开启数据加密 */
    cryptoDataEnable: true,
    /** 允许跨域 */
    cors: false,
    /** 服务器种子种子用于各模块生成自己的秘钥 */
    serverSeed: '3344',
    /** 版权信息 */
    copyright: {
        /** 公司名字 */
        companyName: 'LazierServer',
        /** 版权人名称 */
        copyright: 'LazierServer',
        /** 联系方式 */
        contact: 'lazier334@lazier334.com',
        /** 隐私政策 */
        privacy: '隐私政策',
        /** 使用条款 */
        terms: '使用条款',
    },
    /** 更多日志 */
    moreLog: false,
    /** 插件的各个阶段 */
    pluginStages: {},
    /** 插件的阶段自动更新时间间隔 */
    pluginStagesUpdateStep: 60 * 1000,
};
{   // 添加版本号按钮
    const ver = readVersion();
    config.butsData.push({
        avatarText: 'ver',
        text: 'v.' + ver.version,
        tooltip: '当前版本:' + ver.version,
        fun: `ElMessageBox.alert(\`当前版本: ${ver.version
            }<br>${ver.detail.replaceAll('\n', '<br>')}\`, 'Version ${ver.version
            }', {dangerouslyUseHTMLString: true,confirmButtonText: '确定'})`
    })
}

export default config;

/**
 * 读取版本，默认读取最新版本
 * @param {0} num
 * @returns {{ version: '1.0', detail: '版本说明' }}
 */
function readVersion(num = 0) {
    let re = { version: '0', detail: '-' };
    try {
        let vers = Object.keys(config.version);
        const version = vers[num];
        const info = config.version[version];
        re.version = version;
        re.detail = info;
    } catch (err) {
        re.version = '-1';
        re.detail = err.message + '\n' + err.stack;
    }
    return re;
}
/**
 * 显示版本banner信息
 * @this {config}
 * @param {{ version: '1.0', detail: '版本说明' }} ver
 * @returns {"当前服务器版本 v.1.0 - 版本说明"}
 */
function showVersion(ver) {
    if (typeof ver != 'object') ver = readVersion();
    let vs = this.versionBanner;
    if (typeof vs != 'string') vs = config.versionBanner + '\n\x1b[31m    ——无versionBanner属性，使用默认的versionBanner';
    return '\x1b[32m'
        + vs.replaceAll('{version}', ver.version)
            .replaceAll('{detail}', ver.detail.split('\n')[0])
            .replaceAll('{white}', '\x1b[37m')
        + '\x1b[0m';
}
/**
 * 递归逐步从t读取o的属性，默认返回新对象
 * @template T
 * @param {T | config} t 局部目标对象
 * @param {Object} o 完整原始对象
 * @param {boolean} useOrg 操作于源对象
 * @param {boolean} notAddUtilFun 不添加工具函数
 * @returns {T & ConfigUtils} 从完整对象中读取到的目标对象同类型属性后的目标对象
 */
function readObj(t, o, useOrg, notAddUtilFun) {
    // 如果t和o都是数组，那么直接返回数组o的新副本，避免数组引用导致被外部修改
    if (Array.isArray(t) && Array.isArray(o)) return o.slice();
    if (o == undefined) o = t;
    let re = useOrg ? t : Object.create(null);
    if (re != o) {
        // 添加o到t，优先使用o的属性，只选择t存在的属性
        Object.entries(t).forEach(([k, v]) => {
            let ov = o[k];  // t的属性是 null、类型不同、自定义类，都使用o的属性，否则使用t的属性
            if (typeof v === typeof ov) {
                if (typeof v === 'object') {
                    if (v != null) {
                        if (Array.isArray(ov)) ov = ov.slice(); // 解析数组
                        else if (Object.getPrototypeOf(ov) === Object.prototype) {
                            ov = readObj(v, ov, useOrg, true);  // 解析普通 object
                        }       // 自定义类
                    }           // 解析 null
                }               // 解析其他基本类型
            }                   // 类型不同
            if (re[k] != ov) re[k] = ov;
        })
    }
    if (!notAddUtilFun) Object.keys(ConfigUtils).forEach(k => re[k] = ConfigUtils[k]);
    return re;
}

/**
 * 递归逐步读取o和t的属性，优先使用t，类型不一样则丢弃t，默认返回新对象
 * @template T
 * @param {T | config} t 局部目标对象
 * @param {Object} o 完整原始对象
 * @param {boolean} useOrg 操作于源对象
 * @param {boolean} notAddUtilFun 不添加工具函数
 * @returns {T & ConfigUtils} 从完整对象中读取到的目标对象同类型属性后的目标对象
 */
function appendObj(t, o = this, useOrg, notAddUtilFun) {
    // 如果t和o都是数组，那么直接返回数组t的新副本，避免数组引用导致被外部修改
    if (Array.isArray(t) && Array.isArray(o)) return t.slice();
    if (t == undefined) t = o;
    let re = useOrg ? o : deepClone(o);
    if (re != t) {
        // 添加t到o，优先使用t的属性，附加t存在的所有属性
        Object.entries(t).forEach(([k, v]) => {
            let ov = o[k];  // t的属性是 null、类型不同，都使用o的属性，自定义类、源对象不存在、其他使用t的属性
            if (typeof v === typeof ov) {
                if (typeof v === 'object') {
                    if (v != null) {
                        if (Array.isArray(ov)) ov = v.slice(); // 解析数组
                        else if (Object.getPrototypeOf(ov) === Object.prototype) {
                            ov = appendObj(v, ov, useOrg, true);  // 解析普通 object
                        } else ov = v;  // 自定义类
                    }                   // 解析 null
                } else ov = v;          // 解析其他基本类型
            } else if (ov == undefined) {
                ov = v;                 // o没有该字段
            }                           // 类型不同
            if (re[k] != ov) re[k] = ov;
        })
    }
    if (!notAddUtilFun) Object.keys(ConfigUtils).forEach(k => re[k] = ConfigUtils[k]);
    return re;
}

/**
 * 深度拷贝
 * @param {Object} obj 
 * @returns 
 */
function deepClone(obj) {
    if (typeof obj != 'object' && obj == null) return obj;
    let re = obj;
    if (typeof re == 'object' && re != null) {
        if (Array.isArray(obj)) re = obj.slice();
        if (Object.getPrototypeOf(re) === Object.prototype) {
            // object才走循环拷贝，数组或自定义类都直接使用
            re = { ...obj };
            Object.entries(re).forEach(([k, v]) => {
                if (typeof v == 'object') re[k] = deepClone(v);
            });
        }
    }
    return re;
}

/**
 * 判断当前脚本是被直接执行还是作为模块被引用
 * @param {'file:///root/Project/LazierServer/src/libs/configDef.js'} [currentFileUrl=import.meta.url] 当前模块的完整路径，必须要传递
 * @param {NodeJS.Process} [proc=process] 全局对象
 * @returns {boolean} 
 */
function isMainModule(currentFileUrl, proc = process) {
    if (currentFileUrl == null) throw new Error('需要传递 import.meta.url 变量')
    const entryScriptPath = fileURLToPath(pathToFileURL(proc.argv[1]).href);// 入口脚本路径
    const currentFilePath = fileURLToPath(new URL(currentFileUrl));         // 当前文件路径
    return entryScriptPath === currentFilePath;
};

/**
 * 获取当前的文件夹路径
 * @param {'file:///root/Project/LazierServer/src/libs/configDef.js'} [url=import.meta.url] 当前模块的完整路径，必须要传递
 * @returns {'/root/Project/LazierServer/src/libs'}
 */
function get__dirname(url) {
    return path.dirname(fileURLToPath(url))
}