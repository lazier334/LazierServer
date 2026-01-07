import { createKoaRouter } from './types/index.ts';
import runCmd from '../plugins-lazier334/utils/util-cmd.js';
import result from '../plugins-lazier334/utils/util-result.js';
import { exportFunction } from '../plugins-lazier334/externals/demo.js';

/**
 * koa 路由插件的demo  
 * 调用外部插件的路由接口
 */
export default createKoaRouter(function koaRouterExternalDemo(router) {
    if (false) {
        router.all('外部插件-使用cmd命令运行js脚本 ./ld/plugins/externals/demo.js', '/external/demoByCmd', async (ctx, next) => {
            const re = await runCmd('cd ./ld/plugins/externals && node demo.js');
            ctx.body = result(re);
        });
        router.all('外部插件-使用导入的模块函数运行', '/external/demoByExportFunction', async (ctx, next) => {
            const re = await exportFunction(ctx.request.query.msg || '默认的消息');
            ctx.body = result(re);
        });
    }
    // 还可以通过其他自定义的方案实现互联
    return router
})