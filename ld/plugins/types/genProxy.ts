/**
 * genProxy 插件函数
 */
type genProxyFunction = (funs: {
    /**
     * 基于 toString() 克隆函数
     * @link {file:///./../libs/genProxy.js#59 实现处，如果无法跳转则请手动寻找文件}
     * @param {Function|String} fn 待克隆的函数
     * @returns {Function} 克隆后的新函数
     */
    createFunction: (fn: Function | string) => Function;
    /**
     * 添加函数集合，支持冲突提示以及运行 obj.run
     * @link {file:///./../libs/genProxy.js#71 实现处，如果无法跳转则请手动寻找文件}
     * @param {{[key: string]: Function | object}} obj 要添加的函数集合
     * @returns {this} 自身
     */
    addFunctions: (obj: { [key: string]: Function | object }) => ThisType<typeof funs> & typeof funs;
    /**
     * 统一字符串的换行符格式
     * @link {file:///./../libs/genProxy.js#71 实现处，如果无法跳转则请手动寻找文件}
     * @param {string} str 要格式化的字符串
     * @returns {string} 格式化后的字符串
     */
    formattedLineBreaks: (str: string) => string;
} & { [key: string]: () => any; }) => void;

/**
 * 创建 genProxy 插件的类型提示函数  
 * @param fun 自定义的插件函数
 * @returns 
 */
export function createGenProxy(fun: genProxyFunction): genProxyFunction {
    return fun;
}

export default createGenProxy;
