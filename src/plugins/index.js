/**
 * 这是插件的核心内容，对外提供以下拓展项，编写插件使用前缀+任意+.js即可，例如 `router-pp.js`
 * router: 接口路由
 * selectFileByDomains: 选择域名
 * genProxy: 构建网页插件的函数插件
 * indexData: 首页列表数据
 * websocketMsgs: websocket消息
 * websocketApis: websocket接口
 * cmd: 命令工具
 */
import { fs, path, config } from '../libs/config.js';
import { runCmd } from '../utils/util-cmd.js';

const plugins = {
    'cmd': {
        data: {},
        /** 
         * 使用时需要传递命令名称
         * @param {'命令名称 字符串参数'} command 
         * @returns 
         */
        async use(command) {
            const inputStr = command.trim();
            const [cmd, ...args] = inputStr.split(/\s+/);
            const argStr = args.join(' ');
            return typeof this.data[cmd] == "function" ? await this.data[cmd]?.(argStr) : runCmd(command);
        },
        /**
         * 扫描命令工具插件，导出的必须要有 cmd 和 name 属性，可选 description 说明属性
         * @param {string} filepath 
         * @param {object} data 
         * @returns 
         */
        async scan(filepath, data) {
            let plugins = await importWarp(filepath);
            if (!Array.isArray(plugins)) plugins = [plugins];
            plugins.forEach(p => {
                if (data[p.cmd]) throw new Error(p.cmd + ' 插件命令cmd已存在! ' + filepath);
                if (!p.title) throw new Error(p.title + ' 命令插件标题title不存在! ' + filepath);
                data[p.cmd] = p;
            });
            return plugins;
        }
    },
    'router': {
        data: [],
        /** 
         * 使用时需要传递 router 进来，进行路由附加操作
         * @param {import ('koa-router')} router 
         * @returns 
         */
        use(router) {
            this.data.forEach(useRouter => useRouter(router))
        }
    },
    'selectFileByDomains': {
        data: [],
        /**
         * 外部会传递一个数组进来，如果选中了哪一个，就返回选中的域名  
         * 也可以直接操作原始对象删除不需要的域名  
         * 外部会默认选择第一个
         * 
         * 优先使用参数 ctx.query.dir 的
         * 其次使用插件选择的，但是插件里可以删除参数
         * 默认使用第一个
         * @param {['a.com']} domains 
         * @param {import('koa').Context} ctx 
         * @returns {'a.com'|undefined} 选中的域名
         */
        use(domains, ctx) {
            return this.data.find(selectDomains => selectDomains(domains, ctx))
        }
    },
    'genProxy': {
        data: [],
        /** 
         * 使用时需要传递 router 进来，进行路由附加操作
         * @returns {{['插件函数名': Function]}}
         */
        use() {
            let funs = {};
            this.data.forEach(e => Object.keys(e).forEach(k => {
                if (funs[k]) {
                    throw new Error(k + ' 插件函数已存在!');
                } else {
                    funs[k] = e[k]
                }
            }));
            return funs
        }
    },
    'indexData': {
        data: [],
        cache: {},
        result: [],
        /**
         * 直接调用可获得列表数据
         * @returns {[{"icon":"","name":"Big Bass Halloween 2","mark":"本地 - 大鲈鱼万圣节2","urls":[{"text":"英语-美元","url":"/gs2c/html5Game.do?extGame=1&symbol=vs10bhallbnza2&gname=Big%20Bass%20Halloween%202&jurisdictionID=99&mgckey=stylename@generic~SESSION@87a5a62f-fe1d-490c-8bbf-e975da0ef50a"}]}]} 
         */
        async use() {
            let re = this.result;
            try {
                let letData = [];
                for (let i = 0; i < this.data.length; i++) {
                    const filepath = this.data[i];
                    const text = fs.readFileSync(filepath, 'utf8');
                    if (this.cache[filepath] != text) {
                        // 需要优化
                        // delete require.cache[require.resolve(filepath)];
                        this.cache[filepath] = await importWarp(filepath + `?update=${Date.now()}`);
                        console.log("刷新首页数据", filepath)
                    }
                    // letData.splice(letData.length, 0, ...this.cache[filepath])
                    letData.push(...this.cache[filepath])
                }
                console.log('首页数据总数', letData.length);
                re = letData;
                this.result = re;
            } catch (err) {
                console.warn('读取选项数据失败', err)
            }
            return re;
        },
        scan(filepath, data) {
            data.push(filepath)
        }
    },
    'websocketMsgs': {
        data: [],
        cache: {},
        result: [],
        /**
         * 直接调用可获得 websocket 消息列表数据
         * @returns {[{"type": "receive","time": 1740470525901,"opcode": 2,"data": "oALPeJy9mMtuEzEUhs8kQZ0kINE8RFeAbJ/j2wIJUYTUNWIBm2pIhipScyEXpD4PL8Mb8DrMpBsWdjxju2QRRZnE+vSf2+8zgyEU2xkMTu9DGH+rD/vrzXF9GAEUr2A03yzq5iP8hlH76BLEDC5g2Hy+ePf15a8/k7c/YLy9rx7q3e1yUcKUhFF4dbWoVxt41vzsZtH+vYDxcv9xV9fv60MBUM6Pu129nj+UMPz86QM83+4235f39c2quqtLKKufr+Wb7foOyuO+3q2rVfPlpD3yFpF4HMLgfyJYxgxlUEG4EaTQhFEI/VXohvAFHl//Iky0kTJRhHEbB+VG4NxaGYPQT4REhCla5DaDDNoTieZ4JaIY+uuQwkAMGctQE9YTCtKkAgimQdAZEIwbgbS2Jgqhf1kmIGhlpcmQkOgrCpJKRzH0T8gkBs2Sm0MbCu3rkGgpgMBRW/UU03J8QlDIQlXpJsgwLDsToOQyVYM2FQTzzGsSyKIY+qdjCgMnlDl6NCdfa5AYykdF1uZwb+hGMCRYaFy6EfonZAIC165IZFOBVNg0uBGyqdAFAYmyzGuPjeYMg5PKjZDNyXdBIJI2h3vjHgZpBPEohojOkMBglVFPMqkeETQqHXJvboRs2dAFQQrFeAYVuGdMWCZCZelG6K9CAgJHpXL0R5+TRxP0bm6E/irEI0yE5DlSweMetWEiVJNc5tky+IYEMxi0j80gyWHefKZFcasCa4apae48qaalZVCeyy0yEwyFm6F/i05hUKRR5DDSnjuVFirYGtwMEUY6gcEixxzGxYOAxmLINbgR+renBAQthE1V4dyVxnIUwWUHkXnKDaBAtMHKdDLkWwF2YdBoZOqsOHu95MhDseDKyBz5wH3GgUkVvOI6GSKMbAKDMQJTc/LMXlwZoW0UQrbV/AkBinkJl8ftojrU16eTDs25eyiqIbxoHg6Kv62QhLo=","step": 331}]} 
         */
        async use() {
            let re = this.result;
            try {
                let letData = [];
                for (let i = 0; i < this.data.length; i++) {
                    const filepath = this.data[i];
                    const text = fs.readFileSync(filepath, 'utf8');
                    if (this.cache[filepath] != text) {
                        // delete require.cache[require.resolve(filepath)];
                        this.cache[filepath] = await importWarp(filepath);
                        console.log("刷新websocket数据", filepath)
                    }
                    letData.splice(letData.length, 0, ...this.cache[filepath])
                }
                console.log('websocket消息数量总数', letData.length);
                re = anyWebSocketMsgs(letData);
                this.result = re;
            } catch (err) {
                console.warn('读取websocket数据失败', err)
            }

            return re;
        },
        scan(filepath, data) {
            data.push(filepath)
        }
    },
    'websocketApis': {
        data: [],
        /** 
         * 使用时需要传递客户端的消息进来，进行路由识别与操作
         * @param {Buffer|string|object} msg 转化后的消息内容
         * @param {import('ws').WebSocket} ws ws连接
         * @returns {boolean}
         */
        use(msg, ws) {
            return this.data.find(wsRouter => {
                try {
                    return wsRouter(msg, ws)
                } catch (err) {
                    console.warn('ws的api处理时发生异常', err)
                }
            })
        }
    }
}

// 扫描插件，此处的 import.meta.url 是用于扫描系统插件
scanPluginDir([config.get__dirname(import.meta.url)].concat(config.pluginDirs || []));
export default plugins;

/**
 * 默认的扫描函数（ESM兼容版）
 * @param {string} filepath - 插件文件路径（需包含扩展名）
 * @returns {Promise<Object|Function>} 返回加载的插件对象
 */
async function importWarp(filepath) {
    try {
        // 动态导入插件模块
        const pluginModule = await import(filepath);

        // 处理默认导出：优先使用 default 导出
        const plugin = pluginModule.default || pluginModule;

        return plugin;
    } catch (error) {
        console.error(`加载插件失败: ${filepath}`, error);
        throw error; // 向上抛出异常
    }
}

/**
 * 默认的扫描函数
 * @param {'./plugin-diy.js'} filepath 
 * @param {[Object|Function]} data 
 * @returns {Object|Function} 
 */
async function defScan(filepath, data) {
    const plugin = await importWarp(filepath);
    data.push(plugin);
    return plugin;
}

/**
 * 文件路径去重
 * @param {[string]} pluginDirs 
 * @returns 
 */
function pathDeduplication(pluginDirs) {
    const pathMap = new Map();
    for (const dir of pluginDirs) {
        const normalized = path.normalize(dir);
        const absolutePath = path.resolve(normalized);

        if (!pathMap.has(absolutePath)) {
            pathMap.set(absolutePath, dir);
        }
    }
    const uniqueDirs = [...pathMap.values()];
    return uniqueDirs
}
/**
 * 扫描插件目录读取指定的插件
 * @param {'./'} pluginDir 
 */
function scanPluginDir(pluginDirs = []) {
    // 还需要路径去重
    pluginDirs = pathDeduplication(pluginDirs);

    console.info('扫描插件中...', pluginDirs);
    const prefixs = Object.keys(plugins);
    pluginDirs.forEach(dir => {
        if (fs.existsSync(dir) && fs.statSync(dir).isDirectory()) {
            fs.readdirSync(dir).forEach(file => {
                if (file.endsWith('.js')) {
                    const prefix = prefixs.find(prefix => file.startsWith(prefix));
                    if (prefix != undefined) {
                        const plugin = plugins[prefix];
                        if (typeof plugin.scan == 'function') {
                            // 使用插件自己的导入
                            plugin.scan(path.join(dir, file), plugin.data)
                        } else {
                            // 使用默认导入
                            defScan(path.join(dir, file), plugin.data)
                        }
                    }
                }
            });
        }
    })
}

/**
 * 
 * @param {[{
 *   type: 'receive',
 *   time: 1740981222799,
 *   opcode: 2,
 *   data: 'gAA4EgADAAFwEgACAAFwEgACAARjb2RlBAAAAMgAAXgHP/pmZmZmZmYAAWMIAAF4AAFhAwANAAFjAgE=',
 *   step: 1723571410573
 * }]} msgs 
 * @returns 
 */
function anyWebSocketMsgs(msgs) {
    msgs.forEach(msg => msg.data = Buffer.from(base64ToUint8Array(msg.data)));
    return msgs;

    /**
     * websocket消息使用
     * 将 Base64 字符串转换为 Uint8Array
     * 
     * @param {string} base64 - 要转换的 Base64 字符串
     * @returns {Uint8Array} - 转换后的 Uint8Array
     */
    function base64ToUint8Array(base64) {
        // 解码 Base64 字符串为二进制字符串
        const binaryString = atob(base64);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);

        // 将二进制字符串转换为 Uint8Array
        for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes;
    }

    /**
     * websocket消息使用
     * 将 ArrayBuffer 转换为 Base64 字符串
     * 
     * @param {ArrayBuffer} arrayBuffer - 要转换的 ArrayBuffer
     * @returns {string} - 转换后的 Base64 字符串
     */
    function arrayBufferToBase64(arrayBuffer) {
        const uint8Array = new Uint8Array(arrayBuffer);
        let binaryString = '';
        for (let i = 0; i < uint8Array.length; i++) {
            binaryString += String.fromCharCode(uint8Array[i]);
        }
        return btoa(binaryString);
    }
}