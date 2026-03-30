import type { PluginResult } from './plugins.ts';

/** 工具对象 */
createGenProxy.utils = {
    /**
     * 基于 toString() 克隆函数
     * @param fn 待克隆的函数
     * @returns 克隆后的新函数
     */
    createFunction(fn: Function | string): Function {
        let re;
        if (typeof fn === 'function') {
            re = new Function(`return ${fn.toString()}`)();
        } else if (typeof fn === 'string') {
            re = new Function(`return ${fn}`)();
        }
        return re;
    },
    /**
     * 统一字符串的换行符格式
     * @param str 要格式化的字符串
     * @returns 格式化后的字符串
     */
    formattedLineBreaks(str: string): string {
        return str.replace(/\r\n|\r|\n/g, '\n')
    },
    /**
     * 添加函数集合，支持冲突提示以及运行 obj.run
     * @param obj 完整的函数集合
     * @param newObj 要添加的函数集合
     * @returns 完整的函数集合
     */
    addFunctions(obj: ProxyFuns, newObj: ProxyFuns): ProxyFuns {
        for (const k in newObj) {
            if (typeof obj[k] == 'function') {
                throw new Error(k + '插件函数已存在!');
            }
            let fun = newObj[k];
            if (typeof (fun as ProxyFunObj)?.run == 'function') {
                fun = (fun as ProxyFunObj).run(newObj, obj);
            }
            obj[k] = fun;
        }
        return obj
    }
};

/** 对象版本的proxy插件的函数 */
type ProxyFunObj = { run: (newObj: ProxyFuns, obj: ProxyFuns) => Function };
/** proxy插件的函数集合 */
type ProxyFuns = { [key: string]: Function | ProxyFunObj };

/**
 * genProxy 插件函数
 */
type genProxyFunction = (funs: { [key: string]: () => any; }) => PluginResult;

/**
 * 创建 genProxy 插件的类型提示函数  
 * @param fun 自定义的插件函数
 * @returns 
 */
export function createGenProxy(fun: genProxyFunction): genProxyFunction {
    return fun;
}

export default createGenProxy;
