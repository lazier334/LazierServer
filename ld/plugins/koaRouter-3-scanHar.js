import { fs, path, config, importSysModule } from './libs/baseImport.js';

/** @type {import('../../src/libs/plugins.js')} */
const pluginsModule = await importSysModule('plugins.js');
const { plugins, pathDeduplication } = pluginsModule;

// 启动的目标文件夹，如果是开启了 allDir ，那么在实际读取的时候会重新扫描更新
var domainList = config.domainList.map(domain => path.join(config.rootDir, domain));
if (config.switch.allDir) console.log(`已开启全文件夹扫描，将会扫描路径 ${config.rootDir} 里的所有文件夹`);
else console.log('指定扫描文件夹列表', pushDir(domainList));

/**
 * 动态路由 扫描web文件夹的 插件，顺序为： 插件API > 文件API > HarAPI > 系统API
 * @param {import('koa-router')} router 路由
 */
export default function koaRouterScanHar(router) {
    // 这个接口放到前面是因为优先读取文件，再读取系统的接口，
    // 接口：全局，所有没有被拦截的都将跳到这里发送文件
    router.all(new RegExp('/(.*)'), async (ctx, next) => {
        let api = ctx.path;
        // 扫描 web 文件夹下的所有 har 文件，也使用缓存，如果文件的修改时间没有变化则读取缓存的数据
        // 文件未找到，放行到下一个路由
        return await next();
    });

    return router
}
