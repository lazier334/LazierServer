import { createSystemStart } from './types/index.ts';
import { pathToFileURL } from 'url';

/**
 * @param {import('./libs/baseImport.js')}}
 */
export default createSystemStart(async function systemStartCommon({ fs, path, config, app }) {
    // 打印版本日志
    console.info(config.showVersion());

    // 检测 proxy.js 是否生成，如果没有生成，那么指定代码进行生成
    if (!fs.existsSync(path.join(config['genProxyTargetDir'], 'proxy.js'))) {
        console.warn('开发环境插件 proxy.js 不存在，生成该插件');
        const genProxyPath = pathToFileURL(path.join(import.meta.dirname, '../plugins/libs/genProxy.js'));
        await (await import(genProxyPath)).default();
    }

    config.app = app;
    app.keys = config.session.keys;
})