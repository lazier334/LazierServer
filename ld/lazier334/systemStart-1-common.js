import chokidar from 'chokidar';
import { pathToFileURL } from 'url';
import { createSystemStart } from './types/index.ts';
import { restartSystem } from './libs/sys-restart.js';

/**
 * @param {import('./libs/baseImport.js')}}
 */
export default createSystemStart(async function systemStartCommon({ fs, path, config, app }) {
    // 打印版本日志
    console.info(config.showVersion());

    // 监控配置，当配置发生变更的时候进行重启
    monitorConfig();

    // 保存全局对象
    config.app = app;
    app.keys = config.session.keys;

    // 捕获请求的错误信息
    app.on('error', (err, ctx) => {
        console.warn('该请求发生LS之外的错误', ctx.path, '\n', err)
    });

    /**
     * 监控配置，当配置发生变更的时候进行重启
     */
    async function monitorConfig() {
        const confInfo = await readFlattenConfigInfo();
        chokidar.watch(config.ldConfigPath).on('change', async () => {
            // 检查配置对象是否有变更
            try {
                const newConfInfo = await readFlattenConfigInfo();
                // 先对比 keys 是否一样，不一样就直接标记需要重启
                let restartFlag = confInfo.keyStr != newConfInfo.keyStr;
                if (!restartFlag) {
                    for (const k of confInfo.flatKeys) {
                        if (confInfo.flatConf[k] != newConfInfo.flatConf[k]) {
                            // 标记需要重启
                            restartFlag = true;
                            break;
                        }
                    }
                }
                restart(restartFlag);
            } catch (err) {
                // 配置无效的时候不进行重启
            }
        });
        // 尝试读取 serverDir.json 文件
        /** serverDir.json 文件路径 */
        const serverDirPath = path.join(path.dirname(config.ldConfigPath), 'serverDir.json');
        /** 读取 serverDir.json 配置文件 */
        const readServerDir = () => {
            let re;
            try { re = JSON.parse(fs.readFileSync(serverDirPath, 'utf8')); } catch { }
            return (Array.isArray(re) ? re : []).sort()
        }
        const cacheServerDir = readServerDir();
        const cacheServerDirString = String(cacheServerDir);

        chokidar.watch(serverDirPath).on('change', async () => {
            // 检查配置对象是否有变更
            try {
                const nowServerDir = readServerDir();
                if (String(nowServerDir) != cacheServerDirString) {
                    restart(true);
                }
            } catch (err) {
                // 配置无效的时候不进行重启
            }
        });

        /**
         * 尝试重启
         * @param {boolean} restartFlag 
         */
        function restart(restartFlag) {
            if (restartFlag) {
                restartSystem()
            } else {
                throw new Error('配置未发生变更，故不重启');
            }
        }

        /**
         * 将一个对象进行扁平化, 例如将 {"a":12,"b":{"b1":21,"b2":22},"c":31} 
         * 转为 {"a":12,"b.b1":21,"b.b2":22,"c":31}
         * 同时将非普通类型转成字符串
         * @param {object} obj 
         * @param {string} prefix 
         * @param {object} result 
         * @returns 
         */
        function flattenObject(obj, prefix = '', result = {}) {
            for (const key of Object.keys(obj)) {
                const newKey = prefix ? `${prefix}.${key}` : key;
                const val = obj[key];
                if (val !== null && typeof val === 'object' && !Array.isArray(val)) {
                    flattenObject(val, newKey, result);
                } else {
                    // object function symbol 都会被转成字符串
                    result[newKey] = ['string', 'boolean', 'number', 'undefined', 'bigint'].includes(typeof val) ? val : String(val);
                }
            }
            return result;
        }
        /**
         * 读取扁平化的配置与key字符串
         * @returns 
         */
        async function readFlattenConfigInfo() {
            const stat = fs.statSync(config.ldConfigPath);
            const conf = (await import(pathToFileURL(config.ldConfigPath).href + '?ts=' + stat.mtimeMs)).default;
            const flatConf = flattenObject(conf);
            const flatKeys = Object.keys(flatConf).sort();

            return {
                flatConf,
                flatKeys,
                keyStr: flatKeys.join('')
            }
        };
    }
})