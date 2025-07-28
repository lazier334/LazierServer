import { fs, path, config } from "./config.js";
import Stage from '../classes/Stage.js';

/**
 * 这是插件化的核心内容，提供各个阶段的插件，对外提供以下拓展项，编写插件使用前缀+任意+.js即可，例如 `sysStart-morePlugin.js`
 */
const stages = {
    sysStart: '系统启动阶段',
    koaPlugin: 'koa插件',
    koaRouter: '接口路由',
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
export { plugins, scanStages, scanPlugin, importWarp, getPluginDirs, Stage, pathDeduplication };

/**
 * 默认的扫描函数（ESM兼容版）
 * @param {string} filepath - 插件文件路径（需包含扩展名）
 * @returns {Promise<Object|Function>} 返回加载的插件对象
 */
async function importWarp(filepath) {
    try {
        // 读取文件的更新时间，将更新时间作为后缀，如果是特殊插件会无法使用 fs 读取，所以就将其包裹起来
        let timestamp = 0;
        try {
            const stat = fs.statSync(filepath);
            timestamp = stat.mtimeMs;
        } catch (err) {
            console.warn(err)
        }
        console.debug('导入插件', filepath + '?timestamp=' + timestamp)
        // 使用文件修改时间作为查询参数动态导入插件模块
        const pluginModule = await import(filepath + '?timestamp=' + timestamp);

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
 * @returns {Promise<Stage>} 响应实际的数据
 */
async function plugins(stage, step) {
    // 获取当前阶段的插件列表，如果没有的话就返回空的数据
    let re = new Stage(stage);
    /** @type {Stage} 从缓存中读取 */
    let cacheStage = process.stagesCache?.[stage];
    // 检测是否需要更新数据
    if (!(0 < step)) step = config.pluginStagesUpdateStep;
    const ut = Date.now() - step;
    if (!cacheStage || cacheStage.updateTime < ut) {
        cacheStage = await scanPlugin(stage);
    }

    if (cacheStage) re = cacheStage;
    return re;
}

/**
 * 扫描阶段是否有更新
 * @returns {boolean} 是否进行了更新
 */
async function scanStages() {
    // 检查配置里的种类和当前的是否一致，如果不一致则重新扫描
    const cpsk = Object.keys(config.pluginStages).sort();
    const cpsks = cpsk.join('');
    const sks = Object.keys(stages).sort().join('');
    if (cpsks != sks) {
        // 触发扫描种类列表
        for (const k of cpsk) {
            await scanPlugin(k);
            stages[k] = config.pluginStages[k];
        }
        return true;
    }
    return false;
}
/**
 * 扫描当前阶段的插件是否有更新
 * @param {string} stage 阶段名称
 * @returns {Promise<Stage>} 响应实际的数据
 */
async function scanPlugin(stage) {
    let newStage = new Stage(stage);
    let importList = (await getAllPlugin(stage)).filter(filepath => !config.excludePlugins.includes(filepath));
    for (const filepath of importList) {
        // 使用默认导入
        await defScan(filepath, newStage.data);
    }

    // 将当前的阶段数据保存到缓存中 `process.stagesCache`  
    if (!Array.isArray(process.stagesCache)) process.stagesCache = {};
    process.stagesCache[stage] = newStage;
    return newStage;
}

/**
 * 获取所有的插件，可以指定阶段名称
 * @param {string} stage 阶段名称
 */
async function getAllPlugin(stage) {
    let fileList = [];
    getPluginDirs().filter(dir => {
        return fs.existsSync(dir) && fs.statSync(dir).isDirectory()
    }).forEach(dir => {
        fs.readdirSync(dir).filter(file => file.endsWith('.js') && (!stage || file.startsWith(stage))).forEach(file => {
            const filepath = path.join(dir, file);
            fileList.push(filepath);
        });
    });
    return fileList.sort();
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
