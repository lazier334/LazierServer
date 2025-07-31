import { fs, path, config } from './libs/baseImport.js';
import { restartSystem } from './libs/sys-restart.js'
/**
 * 动态路由 demo 插件
 * @param {import('koa-router')} router 路由
 */
export default function koaRouterDemo(router) {
    // 重启接口
    router.all('/system/restart', async (ctx, next) => {
        if (process.platform == 'win32') restartSystem(config.system.restart.restartCmdWin);
        else if (process.platform === 'darwin') restartSystem(config.system.restart.restartCmdMac);
        else restartSystem(config.system.restart.restartCmdLinux);
        ctx.body = '重启中...';
    });

    return router
}