import runCmd from './utils/util-cmd.js';
import result from './utils/util-result.js';
import { exportFunction } from './externals/demo.js';

/**
 * 动态路由 History 插件，顺序为： 插件API > 文件API > HarAPI > 系统API > vue的历史模式（或类似框架） > external
 * @param {import('@koa/router')} router 路由
 */
export default function koaRouterExternalDemo(router) {
    router.all('外部插件-使用cmd命令运行js脚本 ./ld/plugins/externals/demo.js', '/external/demoByCmd', async (ctx, next) => {
        const re = await runCmd('cd ./ld/plugins/externals && node demo.js');
        ctx.body = result(re);
    });
    router.all('外部插件-使用导入的模块函数运行', '/external/demoByExportFunction', async (ctx, next) => {
        const re = await exportFunction(ctx.request.query.msg || '默认的消息');
        ctx.body = result(re);
    });
    // 还可以通过其他自定义的方案实现互联
    return router
}