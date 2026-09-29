import { pathToFileURL } from 'node:url';
import { registerHooks } from 'node:module';
import { createSystemStart } from './types/index.js';

/**
 * 将项目注册为 lazierserver 和 lazierserver/types 模块，这样导入的时候就不会报错  
 */
export default createSystemStart(async function systemStartRegisterLS({ fs, path, config, app }) {
    // 映射模块路径
    const aliasMap = {
        'lazierserver/types': pathToFileURL(path.join(config.dataPath, 'lazier334/types/index.js')).href,
        'lazierserver': pathToFileURL(path.join(config.dataPath, 'lazier334/libs/index.js')).href,
    };
    // 注册
    registerHooks({
        resolve(specifier, context, nextResolve) {
            if (aliasMap[specifier]) {
                return { url: aliasMap[specifier], shortCircuit: true };
            }
            return nextResolve(specifier, context);
        },
    });
})
