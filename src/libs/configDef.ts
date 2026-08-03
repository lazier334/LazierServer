import path from 'path';
import version from './version.ts';
import { fileURLToPath, pathToFileURL } from 'url';

// #region 类型定义
type NullObject = { [key: string]: any; };
type NullConfig = NullObject;
declare global {
    namespace NodeJS {
        interface Process {
            LSStorage: {
                getNowFileStorage: typeof getNowFileStorage;
                [key: string]: any; // 兼容其他动态添加的属性
            };
            // 将默认配置类型提示信息挂载到全局
            LSConfigDef: Config
        }
    }
}

// 按钮数据的基础类型（最小化定义, 兼容原有结构）
interface ButDataItem {
    avatarText: string;
    color?: string;
    text: string;
    tooltip: string;
    debugMode?: boolean;
    fun: string;
    update?: (self: ButDataItem, config: NullConfig) => void;
}
type ConfigUtilsType = {
    readObj: typeof readObj;
    appendObj: typeof appendObj;
    selectConfig: typeof readObj;
    useConfig: typeof appendObj;
    readVersion: typeof readVersion;
    isMainModule: typeof isMainModule;
    getNowFileStorage: typeof getNowFileStorage;
};


// #endregion 
// #region 系统配置与工具
// 挂载全局对象
if (!process.LSStorage) process.LSStorage = { getNowFileStorage };

/** 配置工具 */
const ConfigUtils: ConfigUtilsType = {
    readObj,
    appendObj,
    selectConfig: readObj,
    useConfig: appendObj,
    readVersion,
    isMainModule,
    getNowFileStorage,
}
/** ld 文件夹名称 */
const ldDirName = process.cwd() + '/ld';
/** 系统配置 */
const system = {
    /** 系统状态 */
    status: {
        /** 系统是否正在重启 */
        restarting: false,
        /** 系统id-也是系统启动时间 */
        systemId: Date.now()
    },
}
// #endregion 
// #region Obfuscator混淆配置
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
    /** 调试保护间隔（毫秒, 0表示禁用）原配置 100  */
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
    // sourceMapBaseUrl: './',
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
    /** 标识符生成方式（hexadecimal: 十六进制, mangled: 短名称） */
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
    /** 控制流扁平化的概率阈值（0-1, 值越大被扁平化的节点越多） */
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
// #endregion 
// #region config配置
const config = {
    /**
     * 更新本地数据文件夹路径
     * @param newLdDirName 本地数据文件夹路径
     * @param forceRefresh 是否强制刷新
     * @returns 是否更新成功
     */
    updateLdDirName(newLdDirName: string, forceRefresh?: boolean): boolean {
        console.log('更新数据目录:', newLdDirName)
        const oldName = this.ldDirName;
        if (!forceRefresh && (typeof newLdDirName != 'string' || newLdDirName == '' || oldName == newLdDirName)) return false;
        const replaceAllStr = (str: string) => {
            return str.replaceAll(oldName, newLdDirName).replaceAll('{/ldDirName/}', newLdDirName);
        }
        /** ld 文件夹名称 */
        this.ldDirName = newLdDirName;
        /** 输入路径 */
        this.rootDir = replaceAllStr(this.rootDir);
        /** 插件目录列表 */
        this.pluginDirs.forEach((e, i) => this.pluginDirs[i] = replaceAllStr(e));
        /** 外部配置路径, 改文件所在的 ld 目录也用于存放自定义插件 */
        this.ldConfigPath = replaceAllStr(this.ldConfigPath);
        /** 数据路径 */
        this.dataPath = replaceAllStr(this.dataPath);
        /** 日志输出管道列表 */
        this.logger.dailyRotateFileList.forEach(e => e.filename = replaceAllStr(e.filename));
        /** 临时下载的文件的目录 */
        this.tempDownDir = replaceAllStr(this.tempDownDir);
        /** 额外的web目录列表 */
        this.otherWebPath.forEach((e, i) => this.otherWebPath[i] = replaceAllStr(e));

        return true;
    },
    /** ld 文件夹名称，这个字段被用于作为旧数据，所以最好使用 updateLdDirName 函数来更新他，避免其他路径修改异常 */
    ldDirName: ldDirName,
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
    version: version || { "1.0.0(25081400)": `一个可以快速搭建的服务器` },
    /** 输入路径 */
    rootDir: `{/ldDirName/}/web`,
    /** 输出路径 */
    outdir: "dist",
    /** 本地开发环境中插入的代码, 代码会插入到 index.html 文件中<body>标签内的开头 */
    indexInsertCode: '<script src="/proxy.js"></script>',
    /** http 与 ws 服务器端口 */
    portHttp: 3000,
    /** https 与 wss 服务器端口 */
    portHttps: 3001,
    /** 代理地址, 用于下载文件进行文件自动补全 */
    proxy: "http://localhost:7890",
    /** 自动补全的域名列表 */
    autoCompleteDomains: [],
    /** 不扫描全部文件夹时指定仅扫描web文件夹里的哪些文件夹 */
    domainList: [],
    /** 在扫描全部文件夹时额外扫描的web主文件夹列表, 相当于有多个 web 文件夹, 这不影响扫描全部的har文件 */
    otherWebPath: [] as string[],
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
     * 追加按钮, 该项配置用于方便在外部配置中追加按钮
     * @type {[{
     *      avatarText: 'word',         // 头像内部的文字
     *      color: '',                  // 头像的背景颜色, 默认是绿色
     *      text: '编辑快捷词',           // 按钮文字 
     *      tooltip: '编辑快捷词数据文件', // 鼠标悬停提示文字
     *      debugMode: true,            // 是否在调试模式下才显示的按钮
     *      fun: `this.openPage()`      // 按钮点击后执行的代码
     *      update(self, config) {      // 如果需要动态数据, 则添加这个函数, 在接口处实现内容
     *          self.fun = `this.openPage('/edit/index.html?filepath=${config.ldConfigPath}')`
     *      },
     *  }]} 
     */
    appendButsData: [] as ButDataItem[],
    /** 需要超级管理员权限才可以查看的按钮, 里面存放按钮的 text 属性 */
    superAdminButsData: ['重启系统', '关闭系统', '编辑配置'],
    /** 需要管理员权限才可以查看的按钮, 里面存放按钮的 text 属性 */
    adminButsData: ['自动补全', '补齐文件', '编辑快捷词', '接口分析', '插件仓库', '编辑项目列表'],
    /** 需要一登录用户权限才可以查看的按钮, 里面存放按钮的 text 属性 */
    loginButsData: ['文件上传'],
    /**
     * @type {[{
     *      avatarText: 'word',         // 头像内部的文字
     *      color: '',                  // 头像的背景颜色, 默认是绿色
     *      text: '编辑快捷词',           // 按钮文字 
     *      tooltip: '编辑快捷词数据文件', // 鼠标悬停提示文字
     *      debugMode: true,            // 是否在调试模式下才显示的按钮
     *      fun: `this.openPage()`      // 按钮点击后执行的代码
     *      update(self, config) {      // 如果需要动态数据, 则添加这个函数, 在接口处实现内容
     *          self.fun = `this.openPage('/edit/index.html?filepath=${config.ldConfigPath}')`
     *      },
     *  }]}
     */
    butsData: [
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
                    // @ts-ignore 这里调用的是前端ElementPlus的消息框代码
                    ElMessage.success('SW清理成功');
                } catch (err) {
                    console.error('SW清理失败:', err);
                    // @ts-ignore
                    ElMessage.error('SW清理失败');
                    throw err;
                }
            }).toString()})()`
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
            fun: `this.openPage('/edit/index.html?filepath=conf.js')`
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
                self.fun = `this.openPage('/edit/index.html?filepath=${encodeURIComponent(config.dataPath + '/plugins/indexData-1-demo.js')}')`
            },
            avatarText: 'list',
            text: '编辑项目列表',
            tooltip: '编辑项目列表数据文件',
            debugMode: true,
            fun: `this.openPage('/edit/index.html?filepath=indexData-list.json')`
        },
    ] as ButDataItem[],
    /** 插件目录列表 */
    pluginDirs: [] as string[],
    /** 外部配置路径, 改文件所在的 ld 目录也用于存放自定义插件 */
    ldConfigPath: `{/ldDirName/}/conf.js`,
    /** 数据路径 */
    dataPath: ldDirName,
    /** 加密时使用的key */
    cryptoKey: '',
    /** 服务器种子种子用于各模块生成自己的秘钥 */
    serverSeed: '3344',
    /** 版权信息 */
    copyright: {
        /** 公司名字 */
        companyName: 'LazierServer',
        /** 版权人名称 */
        copyright: 'lazier334',
        /** 联系方式 */
        contact: 'lazier334@lazier334.com',
        /** 隐私政策 */
        privacy: '隐私政策',
        /** 使用条款 */
        terms: '使用条款',
        /** ICP备案号, 值为 '' 的时候隐藏备案信息 */
        icp: '未备案',
    },
    /** 日志配置 */
    logger: {
        /** 全局日志级别 */
        globalTimeFormat: 'YYYY/MM/DD HH:mm:ss',
        globalLevel: 'debug',
        consoleLevel: 'verbose',
        /** 请求记录 */
        req: false,
        /** 响应记录 */
        resp: true,
        /** 日志输出管道列表 */
        dailyRotateFileList: [
            // info 及以上级别（info, warn、error）写入 ${config.dataPath}/logs/info-%DATE%.log
            {
                filename: path.join(import.meta.dirname, '../../logs', 'info-%DATE%.log'),
                datePattern: 'YYYY-MM-DD', // 按天切割
                level: 'info',             // 只处理 info 及以上级别
                maxSize: '100m',           // 单文件最大 100MB
                maxFiles: '14d',           // 最多保留 14 天
                zippedArchive: true        // 超过保留天数的日志压缩归档
            },
            // debug 及以上级别（debug、verbose、info、warn、error）写入 ${config.dataPath}/logs/debug-%DATE%.log
            {
                filename: path.join(import.meta.dirname, '../../logs', 'debug-%DATE%.log'),
                datePattern: 'YYYY-MM-DD',
                level: 'debug',            // 只处理 debug 及以上级别
                maxSize: '300m',
                maxFiles: '14d',
                zippedArchive: true
            }
        ]
    },
    /** 插件的各个阶段 */
    pluginStages: {} as Record<string, any>,
    /** 排除的插件列表 */
    excludePlugins: [] as string[],
    /** 时间（间隔）相关 */
    times: {
        /** 自动补全超时时间 */
        timeout: 30 * 1000,
        /** koaRouter 插件的新版本扫描间隔 */
        koaRouterPlugin: 10 * 1000,
        /** 插件的阶段自动更新时间间隔 10分钟 */
        pluginStagesUpdateStep: 10 * 60 * 1000,
    },
    /** 开关 */
    switch: {
        /** 动态运算 */
        dynamicOperation: true,
        /** debug模式 */
        debugMode: true,
        /** 动态路由 */
        dynamicRouter: true,
        /** 是否开启数据加密 */
        cryptoDataEnable: true,
        /** 允许跨域 */
        cors: true,
        /** 是否开启自动补全 */
        autoComplete: true,
        /** 扫描全部文件夹, 开启后会扫描web中的所有文件夹, 否则只扫描指定的 domainList 配置中的内容, 这不影响扫描全部的har文件 */
        allWebDir: true,
        /** 本地开发使用生产环境模式 */
        indexUseProdMode: false,
        /** 开启添加栈追踪 */
        openAddAppStack: false,
        /** 处理html接口数据内容 */
        handlerHtmlBodyData: true,
        /** 删除 处理html接口数据内容 产生的文件 */
        deleteHandlerHtmlBodyDataFile: true,
        /** 打开插件默认排序, 排序是基于文件名进行排序 */
        pluginsDefulatSort: true,
    },
    /** 
     * 额外的路由, 用于挂载对象, 主要用于做路由提示, 并非实际业务代码
     * @type {{[key: string]: import('@koa/router')}}
     * @example
     * ```js
     *  // 获取附加路由
     *  var additionalRouter = config.additionalRouter[import.meta.filename] || new Router();
     *  if (!config.additionalRouter[import.meta.filename]) {
     *      config.additionalRouter[import.meta.filename] = additionalRouter;
     *      additionalRouter.all('接口说明','/apiName', ()=>{});
     *  }
     * ```
     */
    additionalRouter: {},
    /** 配置所在的文件夹路径 */
    configDirPath: path.dirname(fileURLToPath(import.meta.url)),
    /** 请求/响应 头名字 */
    headerNames: {
        /** 文件来源 */
        fileFrom: 'ls-file-from',
        /** 设置body时的堆栈信息 */
        setStack: 'ls-set-stack',
    },
    /** 临时下载的文件的目录 */
    tempDownDir: `{/ldDirName/}/web/web.temporary`,
    /**
     * koa的对象
     * @type {import('koa')}
     */
    app: null,
    /** session相关 */
    session: {
        /** 名字 */
        key: 'ls',
        /** 有效期 20 个小时 */
        maxAge: 20 * 60 * 60 * 1000,
        /** 加密秘钥 */
        keys: ['lazier-server_secret_key']
    },
    /** 
     * 插件模版 
     * 如果要添加自定义的模版，可以在用户配置 conf.js 继续添加即可，也可以覆盖模版
     */
    template: {
        'indexData-1-demo.js': `
import { createIndexData } from 'lazierserver/types';

/**
 * 列表插件的demo
 */
export default createIndexData(async function indexDataDemo(arr) {
    if (false) arr.push(...[
        {
            icon: "",
            name: "项目名称",
            mark: "备注信息",
            urls: [
                {
                    text: "按钮1",
                    url: "/index#跳转地址"
                }
            ],
        },
    ]);
    return arr;
})
`, 'koaPlugin-1-demo.js': `
import { createKoaPlugin } from 'lazierserver/types';

/**
 * koa 中间件插件的demo
 */
export default createKoaPlugin(async function koaPluginDemo(ctx, next) {
    if (false) ctx.body = 'hello world! -- by demo';
    return await next();
})
`, 'koaRouter-1-demo.js': `
import { createKoaRouter } from 'lazierserver/types';

/**
 * koa 路由插件的demo
 */
export default createKoaRouter(function koaRouterDemo(router, T) {
    if (false) {
        // 测试接口
        router.all('/demo', async (ctx, next) => {
            ctx.body = 'hello demo';
            /** @type {ctx & T} */
            const ectx = ctx;
            return next();
        });
        router.all(/^\/demo.*$/, async (ctx, next) => {
            ctx.body = (ctx.body ?? '') + ' hello demo2';
            return next();
        });
    }
    return router
})
`, 'koaRouter-10-external-demo.js': `
import { execSync } from 'child_process';
import { createKoaRouter } from 'lazierserver/types';
import { exportFunction } from './externals/demo.js';

/**
 * koa 路由插件的demo  
 * 调用外部插件的路由接口
 */
export default createKoaRouter(function koaRouterExternalDemo(router) {
    if (true) {
        router.all('外部插件-使用cmd命令运行js脚本 ./ld/plugins/externals/demo.js', '/external/demoByCmd', async (ctx, next) => {
            const re = execSync(\`cd "\${import.meta.dirname}/externals" && node demo.js\`);
            ctx.body = String(re);
        });
        router.all('外部插件-使用导入的模块函数运行', '/external/demoByExportFunction', async (ctx, next) => {
            const re = await exportFunction(ctx.request.query.msg || '默认的消息');
            ctx.body = re;
        });
    }
    // 还可以通过其他自定义的方案实现互联
    return router
})
`, 'systemStart-demo.js': `
import { createSystemStart } from 'lazierserver/types';

/**
 * 用于系统启动阶段进行操作
 */
export default createSystemStart(async function systemStartDemo({ fs, path, config, app }) {
})
`, 'websocketApis-demo.js': `
import { createWebsocketApis } from 'lazierserver/types';

/** 
 * 使用时需要传递客户端的消息进来，进行路由识别与操作
 */
export default createWebsocketApis(async function websocketApisDemo(msg, message, ws, req) {
    // 可以使用 req.url 来做api路由识别
    if (false && '/demo' == req.url.split('?').shift()) {
        console.log('收到来自客户端的消息', msg)
    }
    return { end: false }
})
`, 'websocketMsgs-demo.js': `
import { createWebsocketMsgs } from 'lazierserver/types';

/**
 * ws自动响应的数据示例
 */
export default createWebsocketMsgs(async function websocketMsgsDemo(arr) {
    // 普通数据
    if (false) arr.push(...[
        {
            "type": "receive",
            "time": 1740470623630,
            "opcode": 2,
            "data": "1",
            "step": 0
        },
        {
            "type": "receive",
            "time": 1740470624666,
            "opcode": 2,
            "data": "2",
            "step": 1036
        },
        {
            "type": "receive",
            "time": 1740470624667,
            "opcode": 2,
            "data": "3",
            "step": 1
        },
        {
            "type": "receive",
            "time": 1740470624859,
            "opcode": 2,
            "data": "4",
            "step": 192
        },
        {
            "type": "receive",
            "time": 1740470624861,
            "opcode": 2,
            "data": "5",
            "step": 2
        }
    ]);

    // 二进制数据
    if (false) arr.push(...createWebsocketMsgs.utils.parseBinaryWSMsgs([{
        type: 'receive',
        time: 1740981222799,
        opcode: 2,
        data: 'gAA4EgADAAFwEgACAAFwEgACAARjb2RlBAAAAMgAAXgHP/pmZmZmZmYAAWMIAAF4AAFhAwANAAFjAgE=',
        step: 100
    }]));

    return arr;
})
`
    }
};

{   // 添加版本号按钮
    const ver = readVersion();
    config.butsData.push({
        avatarText: 'ver',
        text: 'v.' + ver.version,
        tooltip: '当前版本:' + ver.version,
        fun: `arguments?.[0]?.dot?arguments[0].dot=false:'',this.showVersion(${JSON.stringify(ver)})`
    } as ButDataItem);
}

export default config;
// 导出类型提示信息
export type Config = typeof config;

// #endregion 
// #region 辅助函数
/**
 * 读取版本, 默认读取最新版本
 * @param num
 * @returns 版本信息
 */
function readVersion(num: number = 0): { version: string; detail: string } {
    let re = { version: '0', detail: '-' };
    try {
        let vers = Object.keys(config.version);
        const version = vers[num];
        const info = config.version[version as keyof typeof config.version];
        re.version = version;
        re.detail = info;
    } catch (err) {
        const error = err as Error;
        re.version = '-1';
        re.detail = error.message + '\n' + error.stack;
    }
    return re;
}
/**
 * 显示版本banner信息
 * @this {typeof config}
 * @param ver 版本信息
 * @returns "当前服务器版本 v.1.0 - 版本说明"
 */
function showVersion(this: typeof config, ver?: { version: string; detail: string }): string {
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
 * 递归逐步从o读取t中的属性, 默认返回新对象, 新对象中仅保留t的属性内容。
 * @param t 局部目标对象
 * @param o 完整原始对象
 * @param result 要操作的对象, 默认创建一个空对象
 * @param notAddUtilFun 不添加工具函数
 * @returns 从完整对象中读取到的目标对象同类型属性后的目标对象
 */
function readObj<T>(this: object, t: T, o?: object, result: object = {}, notAddUtilFun?: boolean): T & ConfigUtilsType {
    o = o ?? (this ?? {});
    let re = readObjCore(o, t, result);
    if (!notAddUtilFun) Object.keys(ConfigUtils).forEach(k => re[k] = ConfigUtils[k as keyof typeof ConfigUtils]);
    return re;
}
/**
 * 从org对象上读取def携带的属性, 如果没有或类型不同, 则使用def的属性
 * @param org 完整原始对象
 * @param def 局部目标对象
 * @param re 新对象
 */
function readObjCore(org: any, def: any, re: Record<string, any> = {}): any {
    if (typeof def == 'object') {
        // 如果 def 是 null 则返回 org, 无论 org 是什么内容
        if (def == null) return org;
        // 如果是 org 和 def 有一个是数组则返回 def
        if (Array.isArray(def) || ArrayBuffer.isView(def) || Array.isArray(org) || ArrayBuffer.isView(org)) return def;
        // 如果 org 不是一个有效的对象也返回 def
        if (typeof org != 'object' || org == null) return def
        // 遍历普通对象属性
        Object.entries(def).forEach(([k, v]) => {
            re[k] = readObjCore(org[k], v);
        });
        return re;
    }
    // 如果类型不同则使用 def
    return typeof def != typeof org ? def : org
}

/**
 * 递归逐步读取o中t没有的属性并给t, 其中o和t都有的属性优先使用t, 类型不一样则使用o, 默认返回新对象
 * @param t 局部目标对象
 * @param o 完整原始对象
 * @param useOrg 操作于源对象
 * @param notAddUtilFun 不添加工具函数
 * @returns 从完整对象中读取到的目标对象同类型属性后的目标对象
 */
function appendObj<T>(this: object, t: T, o?: object, result: object = {}, notAddUtilFun?: boolean): T & ConfigUtilsType {
    o = o ?? (this ?? {});
    let re = appendObjCore(t, o, result);
    if (!notAddUtilFun) Object.keys(ConfigUtils).forEach(k => re[k] = ConfigUtils[k as keyof typeof ConfigUtils]);
    return re;
}
/**
 * 把org覆盖到def对象上, 如果类型不同则不覆盖, def未定义(def===undefined)的情况下org也覆盖
 * @param org 局部目标对象
 * @param def 完整原始对象
 * @param re 新对象
 */
function appendObjCore(org: any, def: any, k?: any): any {
    if (typeof org == 'object') {
        // 如果org是null, 那么返回 def
        if (org == null) return def;
        // 如果是 org 和 def 都是数组/buffer则覆盖
        if (Array.isArray(org) && Array.isArray(def)) return org;
        if (ArrayBuffer.isView(org) && ArrayBuffer.isView(def)) return org;
        // 如果 def 是一个 null 那么覆盖
        if (typeof def != 'object' || def == null) return org;
        // 遍历普通对象属性
        Object.entries(org).forEach(([k, v]) => {
            def[k] = appendObjCore(v, def[k], k);
        });
        return def;
    }
    // 如果 def 不是 undefined 而且类型不同则使用 def
    return def !== undefined && typeof def != typeof org ? def : org
}

/**
 * 深度拷贝
 * @param {Object} obj 
 * @returns 
 */
function deepClone(obj: any): any {
    if (typeof obj != 'object' && obj == null) return obj;
    let re = obj;
    if (typeof re == 'object' && re != null) {
        if (Array.isArray(obj)) re = obj.slice();
        if (Object.getPrototypeOf(re) === Object.prototype) {
            // object才走循环拷贝, 数组或自定义类都直接使用
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
 * @param currentFileUrl [currentFileUrl=import.meta.url]当前模块的完整路径
 * @param proc 全局process对象
 * @returns 是否是主模块
 */
function isMainModule(currentFileUrl?: string, proc: NodeJS.Process = process): boolean {
    if (currentFileUrl == null) throw new Error('需要传递 import.meta.url 变量')
    const entryScriptPath = fileURLToPath(pathToFileURL(proc.argv[1]).href);// 入口脚本路径
    const currentFilePath = fileURLToPath(new URL(currentFileUrl));         // 当前文件路径
    return entryScriptPath === currentFilePath;
};

/**
 * 获取当前文件的储存空间  
 * 
 * 可以通过 process.LSStorage.getNowFileStorage 使用  
 * 参数传递  
 *  - getNowFileStorage - 会获得当前函数  
 *  - config - 会获得配置对象  
 * @param filepath [import.meta.filename] 可以直接传文件路径
 * @returns 储存空间对象
 */
function getNowFileStorage(filepath: string = import.meta.filename): NullObject {
    // 直接使用文件路径作为 key
    let fn = filepath;
    if (!['getNowFileStorage', 'config'].includes(fn)) {
        if (typeof process.LSStorage[fn] != 'object' || process.LSStorage[fn] == null) process.LSStorage[fn] = {};
    }
    return process.LSStorage[fn];
}
// #endregion 
