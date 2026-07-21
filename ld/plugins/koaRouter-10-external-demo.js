import { execSync } from 'child_process';
import { createKoaRouter } from './types/index.ts';
import { exportFunction } from './externals/demo.js';
// 全局安装后请使用这种方式引入提示信息
// import { createKoaRouter } from 'lazierserver/types';

/**
 * koa 路由插件的demo  
 * 调用外部插件的路由接口
 */
export default createKoaRouter(function koaRouterExternalDemo(router) {
    if (true) {
        router.all('外部插件-使用cmd命令运行js脚本 ./ld/plugins/externals/demo.js', '/external/demoByCmd', async (ctx, next) => {
            const re = execSync(`cd "${import.meta.dirname}/externals" && node demo.js`);
            ctx.body = String(re);
        });
        router.all('外部插件-使用导入的模块函数运行', '/external/demoByExportFunction', async (ctx, next) => {
            const re = await exportFunction(ctx.request.query.msg || '默认的消息');
            ctx.body = re;
        });
    }
    // 还可以通过其他自定义的方案实现互联
    return router
})