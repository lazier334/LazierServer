import { fs, path, config } from './config.js';
import { plugins } from './plugins.js';
if (!(config['genProxyExportKeys'] instanceof Array)) {
    config['genProxyExportKeys'] = [
        'proxyXHRAndFetch',
        'proxyDocmentHeadAppendChild',
        'navigatorServiceWorkerRegister',
        'clearLoopDebugger',
    ]
}

const conf = {
    devMode: false,
    targetDir: config["genProxyTargetDir"] || "web/plugin",
    proxyFile: config["genProxyProxyFile"] || "proxy.js",
    forceHttps: config["genProxyForceHttps"] || false,
}
if (conf.devMode) {
    // 开发模式导出文件名固定为 proxy.js
    conf.proxyFile = "proxy.js";
}

const hostDef = {
    warpFun,
    /** 导出的key */
    exportKeys: [...config["genProxyExportKeys"]],
    /** 默认值是排除默认对象中的所有属性 */
    excludeKeys: [],
    /** 提供提示信息用，实际并未使用 */
    var: {
        domain: ["domain-level-1", "com"],
        domainStr: "domain-level-1.com",
        domainUrl: "window.location.origin",
        redirectUrlKeyword: [
            '/web-api',
            '/game-api',
            'm.pg-demo.com',
            'static.pg-demo.com',
            'm.pgsoft-games.com',
            'static.pgsoft-games.com'
        ],
        welcomeMsg: `

         [DEV]
        Welcome!
      插件注入成功！

`,

        crList: [],
        start: false,
        crInte: "setInterval(() => { }, 100)"
    },
    objName: conf.devMode ? "obj" : generateRandomString(5),
    /** 导出，在dev模式下，如果存在 _dev 那么就导出 _dev，如果属性不是一个函数也不会被导出  */
    export(keys) {
        let objName = this.objName;
        if (!(keys instanceof Array)) {
            keys = this.exportKeys;
        }
        if (keys.length < 1) {
            keys = Object.keys(this);
        }
        this.excludeKeys.forEach(k => {
            let i = keys.indexOf(k);
            if (-1 < i) {
                keys.splice(i, 1);
            }
        });
        if (conf.devMode) {
            // 如果存在 _dev 那么就导出 _dev 
            for (let i = 0; i < keys.length; i++) {
                const k = keys[i] + '_dev';
                if (this[k]) {
                    keys[i] = k;
                }
            }
        }
        let funs = [];
        let exportFuns = [];
        let funAll = this;
        keys.forEach(k => {
            if (typeof funAll[k] != 'function') {
                console.log(`导出函数时忽略 ${k} ，因为他不是一个函数，他的类型是 ${typeof k}`)
            } else {
                let funStr = funAll[k].toString();
                // 清理 // 
                funStr = funStr.split("\n").filter(e => !e.trim().startsWith("//"));
                // 清理 CLOG
                if (!conf.devMode) funStr = funStr.filter(e => !e.trim().startsWith("CLOG"));
                funStr = funStr.join("\n");
                funs.push(`safe(${funStr});`);
                exportFuns.push(k);
            }
        })
        console.log("导出的列表:", keys.map(k => exportFuns.includes(k) ? k : ('未导出: ' + k)));

        return (conf.devMode ? 'CLOG = console.log;' : '') + `((${objName})=>{
${this.preCode}
${funs.join("\n")}
${this.sufCode}
})({})`
        return `((${objName})=>{
(${this.preCode.toString()})(${objName},${objName}.var);
${funs.join("\n")}
(${this.sufCode.toString()})(${objName},${objName}.var);
})({})`
    },
    /** 附加之前的代码 */
    preCode: "",
    /** 附加完之后的代码 */
    sufCode: ""
};
hostDef.excludeKeys = Object.keys(hostDef);
var main = mainOrg;
// 判断当前脚本是被直接执行还是作为模块被引用
if (config.isMainModule(import.meta.url, process)) { // 直接执行
    console.info('直接运行')
    main(conf.proxyFile);
    main = null;
}
// 作为模块被引用，导出一个 Promise，当传递参数进来的时候，总是开启开发模式
export default main; // 导出为默认导出





// -----------------------------------------------------------------------------------------------
/**
 * 主程序
 * @param {string} proxyFileName 文件名
 */
async function mainOrg(proxyFileName) {
    let isProxyJs = conf.proxyFile == "proxy.js";
    if (proxyFileName) {
        // 开发模式的配置项
        conf.proxyFile = proxyFileName;
        isProxyJs = conf.proxyFile == "proxy.js";
        conf.devMode = isProxyJs;
        hostDef.objName = isProxyJs ? "obj" : generateRandomString(5);
    }
    const startTime = Date.now();
    const body = (await initHost({})).export();
    const targetPath = path.join(conf.targetDir, conf.proxyFile);
    fs.mkdirSync(path.dirname(targetPath), { recursive: true });
    if (isProxyJs) {
        // proxy.js 开发环境脚本
        fs.writeFileSync(targetPath, body)
    } else {
        // 生产环境脚本
        const originPath = targetPath + '.原版.js';
        fs.writeFileSync(originPath, "let srcver='1'; // 手动混淆不要带这一句代码\n" + body);
        console.log('原版文件位置', originPath);
        const JavaScriptObfuscator = require('javascript-obfuscator');
        // 使用 javascript-obfuscator 对代码进行混淆
        const obfuscatedCode = JavaScriptObfuscator.obfuscate(body, config.ObfuscatorOptions);
        fs.writeFileSync(targetPath, "let srcver='1';" + obfuscatedCode.getObfuscatedCode());
    }
    console.log("导出插件完成,", `耗时${Date.now() - startTime}ms`, "文件位置:", path.join(conf.targetDir, conf.proxyFile))
};

/**
 * 生成随机数
 * @param {Number} length 
 * @returns 
 */
function generateRandomString(length, characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz') {
    const result = [];
    for (let i = 0; i < length; i++) {
        result.push(characters.charAt(Math.floor(Math.random() * characters.length)))
    }
    return result.join('')
}

/**
 * 附加函数
 * @param {hostDef} host 
 * @returns {hostDef}
 */
function genHost(host) {
    if (typeof host != "object") {
        host = {};
    }
    for (const k in hostDef) {
        if (typeof host[k] != typeof hostDef[k]) {
            host[k] = hostDef[k];
        }
    }
    if (!(host.exportKeys instanceof Array)) {
        host.exportKeys = hostDef.exportKeys || []
    }

    return host;
}

/**
 * 包装函数，并提供检测与提示信息
 * 
 * @param {(h:hostDef)=>void} fun 函数
 * @param {hostDef} host 挂载体
 * @param {String} funName 函数名，不允许使用 `__funs__` 否则会修改函数名
 */
function warpFun(fun, host, funName) {
    let fn = fun.name || funName;
    if (!host) host = this;
    // 确保排在前面
    if (host.__funs__ == undefined) host.__funs__ = true;
    if (fn) {
        if (fn == "__funs__") {
            fn = "__funs__" + ("" + Date.now()).substring(10);
        }
        // 挂载到批量
        host[fn] = fun;
    } else {
        // 挂载到数组
        if (typeof host.__funs__ != "function" || !(host.__funs__.funs instanceof Array)) {
            host.__funs__ = function () {
                let funs = [];
                if (funs instanceof Array) funs.forEach(fun => fun.call(this, arguments))
            }
            host.__funs__.funs = [];
            let funsString = host.__funs__.toString();
            host.__funs__.toString = function () {
                let funString = '';
                host.__funs__.funs.forEach(f => {
                    funString += "," + f.toString();
                });
                if (0 < funString.length) {
                    funString = funString.substring(1)
                }
                return funsString.replace('[]', `[${funString}]`);
            }
        }
        host.__funs__.funs.push(fun);
    }
    return host;
}


/**
 * 初始化函数
 * @param {hostDef} host 
 * @returns {hostDef}  
 */
async function initHost(host) {
    host = genHost(host);
    // NOTE 前缀代码
    host.preCode = "(" + ((h) => {
        h.var = {};
        let C = h.var;
        C.domainUrl = window.location.origin;
        let host = window.location.host.split(".");
        C.domain = host.slice(1);
        C.domainStr = C.domain.join(".");
        C.welcomeMsg = `

         [DEV]
        Welcome!
      插件注入成功！

`;

        C.crList = [];
        C.start = false;
        C.crInte = setInterval(() => {
            if (C.start) {
                if (C.crList.length < 1) {
                    clearInterval(C.crInte);
                    return;
                } else {
                    for (let i = 0; i < C.crList.length; i++) {
                        const e = C.crList[i];
                        if (conditionalRun(e.test, e.run)) {
                            C.crList.splice(i, 1)
                        }
                    }
                }
            }
        }, 100);
    }).toString() + `)(${host.objName});
    var h = ${host.objName}; 
    var C = ${host.objName}.var;
    function safe(fun){try{fun()}catch(e){console.log("函数加载失败", e)}}
    `;

    // NOTE 后缀代码
    host.sufCode = `(${(() => {
        [
            () => console.log(C.welcomeMsg),
        ].forEach(fun => typeof fun == "function" ? fun() : false);
    }).toString()})()`

    // TODO 非调试模式，在生产模式中关掉很多东西
    if (!conf.devMode) {
        // NOTE 后缀代码
        host.sufCode = "";
        // NOTE 前缀代码
        host.preCode = "(" + ((h) => {
            h.var = {};
            let C = h.var;
            C.domainUrl = window.location.origin;
            let host = window.location.host.split(".");
            C.domain = host.slice(1);
            C.domainStr = C.domain.join(".");
            C.forceHttps = false;
        }).toString() + `)(${host.objName});
        var h = ${host.objName}; 
        var C = ${host.objName}.var;
        function safe(fun){try{fun()}catch(e){}}
        `;
    }

    // 调整是否开启强制https
    host.preCode = host.preCode.replace("C.forceHttps = false;", `C.forceHttps = ${!!conf.forceHttps};`);

    let funs = await getOrg()

    for (const k in funs) {
        host.warpFun(funs[k])
    }

    return host;
}

/**
 * 获取源函数
 * 
 * 在返回值中编写html中的函数可以用于导出。
 * 当前函数中的h和C对象仅用于提示信息，并无实际应用。
 * 可以在内部使用html上面的对象，例如 window 对象。
 * 函数中的双斜杠 "//" 注释信息在导出时将会被删除，
 * 函数开头的 "/**" 注释信息也不会被导出
 * @param {hostDef} h 
 * @returns {{[key:string]: Function}}
 */
async function getOrg(h) {
    return await (await plugins('genProxy')).use() || {}
}
