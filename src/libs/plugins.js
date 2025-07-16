import { fs, path, config } from "./config.js";

/** 空的阶段对象 */
const NullStage = {
    stage: 'null',
    updateTime: Date.now(),
    data: [],
    /** 
     * 使用函数，当返回 `{end:true, result:any}` 时停止后续执行并返回 `result` 数据
     * @returns 
     */
    async use(...args) {
        if (this.data.length < 1) return console.warn(this.stage + ' 阶段的插件列表为空');
        for (const handle of this.data) {
            const re = await handle(...args);
            if (re?.end) {
                return re.result;
            }
        }
    },
};
/**
 * 这是插件化的核心内容，提供各个阶段的插件，对外提供以下拓展项，编写插件使用前缀+任意+.js即可，例如 `sysStart-morePlugin.js`
 */
const stages = {
    sysStart: '系统启动阶段',
    router: '接口路由',
    selectFileByDomains: '选择域名',
    genProxy: '构建网页插件的函数插件',
    indexData: '首页列表数据',
    websocketMsgs: 'websocket消息',
    websocketApis: 'websocket接口',
    cmd: '命令工具',
};
if (typeof config.pluginStages != 'object') {
    config.pluginStages = {}
}
// 合并固定数据到配置中
Object.entries(stages).forEach(([k, v]) => {
    if (config.pluginStages[k] == undefined) {
        config.pluginStages[k] = v;
    }
});

scanStages();
export { plugins, scanStages, scanPlugin, importWarp, NullStage };

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
 * 获取当前阶段的插件，如果到了更新间隔时间，会先更新后再返回
 * @param {string} stage 阶段名称
 * @param {number} step 设置间隔，需要大于0
 * @returns {NullStage} 响应实际的数据
 */
function plugins(stage, step) {
    // 获取当前阶段的插件列表，如果没有的话就返回空的数据
    let re = createStage(stage);
    /** @type {NullStage} 从缓存中读取 */
    let cacheStage = process.stagesCache?.[stage];
    // 检测是否需要更新数据
    if (!(0 < step)) step = config.pluginStagesUpdateStep;
    const ut = Date.now() - step;
    if (!cacheStage || cacheStage.updateTime < ut) {
        cacheStage = scanPlugin(stage);
    }

    if (cacheStage) re = cacheStage;
    return re;
}

/**
 * 扫描阶段是否有更新
 * @returns {boolean} 是否进行了更新
 */
function scanStages() {
    // 检查配置里的种类和当前的是否一致，如果不一致则重新扫描
    const cpsk = Object.keys(config.pluginStages).sort();
    const cpsks = cpsk.join('');
    const sks = Object.keys(stages).sort().join('');
    if (cpsks != sks) {
        // 触发扫描种类列表
        cpsk.forEach(k => {
            scanPlugin(k);
            stages[k] = config.pluginStages[k];
        });
        return true;
    }
    return false;
}
/**
 * 扫描当前阶段的插件是否有更新
 * @param {string} stage 阶段名称
 * @returns {NullStage} 响应实际的数据
 */
function scanPlugin(stage) {
    let newStage = createStage(stage);
    getPluginDirs().forEach(dir => {
        if (fs.existsSync(dir) && fs.statSync(dir).isDirectory()) {
            fs.readdirSync(dir).filter(file => file.endsWith(stage + '.js')).forEach(file => {
                const filepath = path.join(dir, file);
                // 使用默认导入
                defScan(filepath, newStage.data);
            });
        }
    });

    // 将当前的阶段数据保存到缓存中 `process.stagesCache`  
    if (!Array.isArray(process.stagesCache)) process.stagesCache = {};
    process.stagesCache[stage] = newStage;
    return newStage;
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
 * 获取所有的插件目录路径
 * @returns {[string]}
 */
function getPluginDirs() {
    let pluginDirs = pathDeduplication(config.pluginDirs);
    return pluginDirs;
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
 * 创建一个阶段对象 
 * @param {string} stage 
 * @returns {NullStage}
 */
function createStage(stage) {
    let re = { ...NullStage };
    re.stage = stage;
    return re;
}