import { fs, path, config, getPluginsModule } from './baseImport.js';
import JavaScriptObfuscator from 'javascript-obfuscator';
const { plugins } = await getPluginsModule();

const hostDef = {
    /** 对象名称标签，用于对最终结果进行全局替换，开发版替换成 obj 生产版替换成随机字符 */
    objNameTag: 'GlobalParam',
    /** 包装函数，并提供检测与提示信息 */
    warpFun,
    /** 导出的key */
    exportKeys: [...config.genProxyExportKeys],
    /** 默认值是排除默认对象中的所有属性 */
    excludeKeys: [],
    /** 导出，在dev模式下，如果存在 _dev 那么就导出 _dev，如果属性不是一个函数也不会被导出  */
    export(keys, devMode) {
        let objName = devMode ? 'obj' : (generateRandomString(2) + '_' + generateRandomString(5));
        if (!(keys instanceof Array)) keys = this.exportKeys;
        if (keys.length < 1) keys = Object.keys(this);
        this.excludeKeys.forEach(k => {
            let i = keys.indexOf(k);
            if (-1 < i) {
                keys.splice(i, 1);
            }
        });
        if (devMode) {
            // 如果存在 _dev 那么就导出 _dev 
            for (let i = 0; i < keys.length; i++) {
                const k = keys[i] + '_dev';
                if (this[k]) {
                    keys[i] = k;
                }
            }
        }

        let exportFuns = [];
        let exportFunNames = [];
        let funAll = this;
        keys.forEach(k => {
            let fun = funAll[k];
            if (typeof fun == 'function') {
                let funStr = fun.toString();
                funStr = funStr.split("\n").filter(e => !e.trim().startsWith("//")).join("\n");
                exportFuns.push(`safe(${funStr});`);
                exportFunNames.push(k);
            } else console.log(`导出函数时忽略${k}，因为他不是一个函数，他的类型是 ${typeof k}`);
        });
        console.log(devMode ? "proxy.js导出的列表:" : "导出的列表:", keys.map(k => exportFunNames.includes(k) ? k : ('未导出: ' + k)));

        return `${devMode ? 'CLOG = console.log;' : ''}
((${objName})=>{
${exportFuns.join("\n")}
function safe(fun){ try { fun() } catch (e) { } }
})({})`.replaceAll(this.objNameTag, objName)
    },
    /**
     * 基于 toString() 克隆函数
     * @param {Function|String} fn 待克隆的函数
     * @returns {Function} 克隆后的新函数
     */
    createFunction(fn) {
        if (typeof fn === 'function') {
            fn = new Function(`return ${fn.toString()}`)();
        } else if (typeof fn === 'string') {
            fn = new Function(`return ${fn}`)();
        }
        return fn;
    },
    /**
     * 添加函数集合，支持冲突提示以及运行 obj.run
     * @param {{[key: string]: Function | object}} obj 要添加的函数集合
     * @returns {this} 自身
     */
    addFunctions(obj) {
        for (const k in obj) {
            if (typeof this[k] == 'function') {
                throw new Error(k + '插件函数已存在!');
            }
            let fun = obj[k];
            if (typeof fun?.run == 'function') {
                fun = fun.run(obj, this);
            }
            this[k] = fun;
        }
        return this
    },
    /**
     * 统一字符串的换行符格式
     * @param {string} str 要格式化的字符串
     * @returns {string} 格式化后的字符串
     */
    formattedLineBreaks(str) {
        return str.replace(/\r\n|\r|\n/g, '\n')
    }
};
hostDef.excludeKeys = Object.keys(hostDef);

// 判断当前脚本是不是被直接执行
if (import.meta.url === `file://${process.argv[1]}`) {
    main(config.proxyFile);
}

// 作为模块被引用，导出一个 Promise，当传递参数进来的时候，总是开启开发模式
export default main;

// -----------------------------------------------------------------------------------------------

/**
 * 主程序，先写出生产环境插件，再写出开发环境插件，所以配置 genProxyTargetFile 的名称和开发插件名称相同的时候会被开发插件覆盖
 */
async function main(proxyFile) {
    const startTime = Date.now();
    const host = await initHost({});
    const body = host.export();
    const devBody = host.export(null, true);
    const targetPath = path.join(config.genProxyTargetDir, proxyFile || config.genProxyTargetFile);
    fs.mkdirSync(path.dirname(targetPath), { recursive: true });

    // 生产环境脚本
    const originPath = targetPath + '.原版.js';
    let versionNum = 0;
    try {
        // 读取原始版本号并 +1
        if (fs.existsSync(originPath)) {
            let text = fs.readFileSync(originPath, 'utf-8');
            let str = text.substring(text.indexOf('=') + 1, text.indexOf(';'));
            let num = parseInt(str.replaceAll('\'', '').replaceAll('"', ''));
            if (!isNaN(num)) versionNum = num + 1;
        }
    } catch (err) {
        console.log('读取原始版本号失败', err);
    }
    // 尝试读取原始版本的版本号
    fs.writeFileSync(originPath, `let srcver='${versionNum}'; // 手动混淆不要带这一句代码\n` + body);
    // 使用 javascript-obfuscator 对代码进行混淆
    const obfuscatedCode = JavaScriptObfuscator.obfuscate(body, config.ObfuscatorOptions);
    fs.writeFileSync(targetPath, `let srcver='${versionNum}';` + obfuscatedCode.getObfuscatedCode().replace('\n//# sourceMappingURL=.js.map', ''));
    let json = JSON.parse(obfuscatedCode.getSourceMap());
    json.version = versionNum;
    fs.writeFileSync(targetPath + '.map', JSON.stringify(json));
    // proxy.js 开发环境脚本
    fs.writeFileSync(path.join(config.genProxyTargetDir, 'proxy.js'), devBody);

    console.log("导出插件完成, 版本号", versionNum, `, 耗时${Date.now() - startTime}ms`);
    console.log("文件位置:", originPath, '以及同目录下的同前缀文件与proxy.js文件');
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
 * 包装函数，并提供检测与提示信息
 * 
 * @param {(h:hostDef)=>void} fun 函数
 * @param {hostDef} host 挂载体
 * @param {String} funName 函数名，不允许使用 `__funs__` 否则会修改函数名
 */
function warpFun(fun, host, funName) {
    let fn = funName || fun.name;
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
    if (typeof host != "object") {
        host = {
        };
    }
    for (const k in hostDef) {
        if (typeof host[k] != typeof hostDef[k]) {
            host[k] = hostDef[k];
        }
    }
    if (!(host.exportKeys instanceof Array)) {
        host.exportKeys = hostDef.exportKeys || []
    }

    // 导入proxy的函数插件
    let funs = await (await plugins('genProxy')).use(host);

    for (const k in funs) {
        try {
            host.warpFun(funs[k], host, k);
        } catch (err) {
            console.log('包装函数失败!', '函数名: ' + k, funs[k]);
            console.error(err);
        }
    }

    return host;
}
