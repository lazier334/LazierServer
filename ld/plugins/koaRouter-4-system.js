import { fs, path, config } from './libs/baseImport.js';
import { restartSystem } from './libs/sys-restart.js'

/**
 * 动态路由 system接口 插件，顺序为： 插件API > 文件API > HarAPI > 系统API
 * @param {import('koa-router')} router 路由
 */
export default function koaRouterSystem(router) {
    // 重启接口
    router.all('/system/restart', async (ctx, next) => {
        if (process.platform == 'win32') restartSystem(config.system.restart.restartCmdWin);
        else if (process.platform === 'darwin') restartSystem(config.system.restart.restartCmdMac);
        else restartSystem(config.system.restart.restartCmdLinux);
        ctx.body = '重启中...';
    });

    // 关闭接口
    router.all('/system/shutdown', async (ctx, next) => {
        ctx.body = '关机中...';
        setTimeout(() => process.exit(1), 1000);
    });

    // 接口：根目录重定向
    router.all(['/', '/index'], ctx => {
        const idnexPath = path.join(config.dataPath, 'web/index');
        ctx.redirect('/index.html?dir=' + idnexPath);
    });

    // 接口：首页按钮数据
    router.all("/system/indexData", async ctx => {
        return ctx.body = plugins['indexData'].use();
    });

    // 接口：设置是否开启自动补全，传递get参数则为仅查询
    router.all('/system/autocomplete', ctx => {
        if (!ctx.query.get) {
            let status = ctx.query.status;
            config.switch.autoComplete = status == undefined ? !config.switch.autoComplete : status;
        }
        console.info('当前自动补全的状态为', config.switch.autoComplete);
        ctx.body = config.switch.autoComplete;
    });

    // 接口：自动补全编辑页的文件匹配 /edit/vs/*
    router.all(/^\/edit\/vs\/.*$/, async (ctx) => {
        const filepath = path.join(process.cwd(), 'src', ctx.url);
        const url = 'https://unpkg.com/monaco-editor@0.33.0/min/vs' + ctx.url.substring(ctx.url.indexOf('/vs') + '/vs'.length);
        const fp = await downloadFileToPath(url, filepath);
        if (fp && fs.existsSync(fp)) {
            return await sendFile(ctx, path.basename(fp), {
                root: path.dirname(fp),
                hidden: true
            });
        }
    });

    return router
}