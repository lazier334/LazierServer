import { pathToFileURL } from 'url';
import { fs, path, config } from "./config.ts";

// 声明全局 process 对象的扩展（用于缓存）
declare global {
    namespace NodeJS {
        interface Process {
            stagesCache?: Record<string, Stage>;
        }
    }
    // 扩展内置 Function 类型，添加自定义属性
    interface Function {
        pluginInfo?: {
            filepath: string;
            filename: string;
            [key: string]: any;
        };
    }
}

/**
 * 阶段类
 */
class Stage {
    /** 阶段名称 */
    stage: string;
    /** 更新时间 */
    updateTime: number;
    /** 插件列表 */
    data: any[] = [];

    /**
     * 创建阶段对象
     * @param stage - 阶段名称
     */
    constructor(stage: string) {
        this.stage = stage;
        this.updateTime = Date.now();
    }

    /** 
     * 使用函数，当返回 `{end:true, result:any}` 时停止后续执行并返回 `result` 数据
     * @returns {any} 默认返回第一个参数
     */
    async use(...args: any[]): Promise<any> {
        if (this.data.length < 1) {
            console.warn(this.stage + ' 阶段的插件列表为空');
        } else {
            for (const handle of this.data) {
                const re = await handle(...args);
                if (re?.end) {
                    return re.result;
                }
            }
        }
        return args[0];
    }
}
/**
 * 这是插件化的核心内容，提供各个阶段的插件，阶段名称自取即可，编写插件使用前缀+任意+.js即可，例如 `systemStart-morePlugin.js`  
 * 阶段示例:
 *  - systemStart: 系统启动阶段
 *  - koaPlugin: koa插件
 *  - koaRouter: 接口路由
 *  - selectFileByDomains: 选择域名
 *  - genProxy: 构建网页插件的函数插件
 *  - indexData: 首页列表数据
 *  - websocketMsgs: websocket消息
 *  - websocketApis: websocket接口
 *  - send: 发送文件的处理
 */
const stages: Record<string, any> = {};
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
export {
    plugins,
    scanStages,
    scanPlugin,
    importWarp,
    getPluginDirs,
    Stage,
    pathDeduplication,
    getAllPlugin,
    getPlguinUpdateTime
};

/**
 * 默认的扫描函数（ESM兼容版）
 * @param filepath - 插件文件路径（需包含扩展名）
 * @param timestamp - 如果不传则使用文件的更新时间，传了固定的可以固定版本
 * @returns 返回加载的插件对象
 */
async function importWarp(filepath: string, timestamp?: number): Promise<Object | Function> {
    try {
        // 解决文件路径异常的问题
        let filepathURL = pathToFileURL(filepath);
        // 读取文件的更新时间，将更新时间作为后缀，如果是特殊插件会无法使用 fs 读取，所以就将其包裹起来
        if (timestamp == null) timestamp = getPlguinUpdateTime(filepathURL);
        console.debug('导入插件', filepathURL + '?timestamp=' + timestamp);
        // 使用文件修改时间作为查询参数动态导入插件模块
        const pluginModule = await import(filepathURL + '?timestamp=' + timestamp);

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
 * @param stage 阶段名称
 * @param step 设置间隔，需要大于0
 * @returns 响应实际的数据
 */
async function plugins(stage: string, step: number = 0): Promise<Stage> {
    // 获取当前阶段的插件列表，如果没有的话就返回空的数据
    let re = new Stage(stage);
    /** @type {Stage} 从缓存中读取 */
    let cacheStage = process.stagesCache?.[stage];
    // 检测是否需要更新数据
    if (!(0 < step)) step = config.times.pluginStagesUpdateStep;
    const ut = Date.now() - step;
    if (!cacheStage || cacheStage.updateTime < ut) {
        cacheStage = await scanPlugin(stage);
    }
    if (cacheStage) re = cacheStage;
    return re;
}

/**
 * 扫描阶段是否有更新
 * @returns 是否进行了更新
 */
async function scanStages(): Promise<boolean> {
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
async function scanPlugin(stage: string): Promise<Stage> {
    let newStage = new Stage(stage);
    let importList = await getAllPlugin(stage);
    for (const filepath of importList) {
        // 使用默认导入
        await defScan(filepath, newStage.data);
    }

    // 默认排序
    if (config.switch.pluginsDefulatSort && newStage.data.every(e => typeof e?.pluginInfo?.filename == 'string')) {
        newStage.data.sort((a, b) => new Intl.Collator('zh-CN').compare(a.pluginInfo.filename, b.pluginInfo.filename));
    }

    // 将当前的阶段数据保存到缓存中 `process.stagesCache`  
    if (typeof process.stagesCache != 'object' || process.stagesCache == null) {
        process.stagesCache = {};
    }
    process.stagesCache[stage] = newStage;
    return newStage;
}

/**
 * 获取所有的插件，可以指定阶段名称
 * @param stage 阶段名称
 * @returns 所有插件文件路径
 */
async function getAllPlugin(stage: string): Promise<string[]> {
    let fileList: string[] = [];
    getPluginDirs().filter(dir => {
        return fs.existsSync(dir) && fs.statSync(dir).isDirectory()
    }).forEach(dir => {
        fs.readdirSync(dir).filter(file => file.endsWith('.js') && (!stage || file.startsWith(stage))).forEach(file => {
            const filepath = path.join(dir, file);
            fileList.push(filepath);
        });
    });
    return fileList.sort().filter(filepath => !config.excludePlugins.includes(filepath));
}

/**
 * 获取插件更新时间
 * @param filepath 插件路径
 */
function getPlguinUpdateTime(filepath: string | URL): number {
    let timestamp = 0;
    try {
        const stat = fs.statSync(filepath);
        timestamp = stat.mtimeMs;
    } catch (err) {
        console.warn('读取文件更新时间失败', err);
    }
    return timestamp;
}

/**
 * 默认的扫描函数
 * @param filepath 
 * @param data 类型是 [Object|Function]
 */
async function defScan(filepath: string, data: any[]): Promise<Object | Function> {
    const plugin = await importWarp(filepath);
    if (typeof plugin == 'function') {
        if (typeof plugin.pluginInfo != 'object') plugin.pluginInfo = { filepath, filename: filepath.split('/').pop()?.split('\\').pop() ?? '' };
        else plugin.pluginInfo.filepath = filepath;
    }
    data.push(plugin);
    return plugin;
}
/**
 * 获取所有的插件目录路径
 */
function getPluginDirs(): string[] {
    let pluginDirs = pathDeduplication(config.pluginDirs);
    return pluginDirs;
}
/**
 * 文件路径去重
 * @param pluginDirs 
 */
function pathDeduplication(pluginDirs: string[]): string[] {
    const pathMap: { [key: string]: string } = {};
    for (const dir of pluginDirs) {
        const normalized = path.normalize(dir);
        const absolutePath = path.resolve(normalized);

        if (!pathMap[absolutePath]) {
            pathMap[absolutePath] = dir;
        }
    }
    const uniqueDirs = [...Object.values(pathMap)];
    return uniqueDirs
}