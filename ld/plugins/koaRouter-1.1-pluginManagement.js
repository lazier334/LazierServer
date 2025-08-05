import { fs, path, config, getPluginsModule, importSysModule } from './libs/baseImport.js';
import result from './utils/util-result.js';
const plugins = await getPluginsModule();
const lc = {
    pluginDirs: config.pluginDirs
}

/**
 * 动态路由 demo 插件，顺序为： 插件API > 文件API > HarAPI > 系统API > vue的历史模式（或类似框架）
 * @param {import('koa-router')} router 路由
 */
export default function koaRouterManagement(router) {
    // 查
    router.all('管理路由 - 获取指定插件详细内容', '/management/api/plugin', async (ctx, next) => {
        let re = {};
        let fp = ctx.request.body.filepath;
        if (fs.existsSync(fp)) {
            re = fs.statSync(fp);
            re.exclude = config.excludePlugins.includes(fp);
            re.body = fs.readFileSync(fp, 'utf8');
        }

        ctx.body = result(re);
    });

    // router.all('管理路由 - 获取全部插件', '/management/api/pluginList', async (ctx, next) => {
    router.all('/management/api/pluginList', async (ctx, next) => {
        let stages = Object.keys(config.pluginStages);
        let pluginPath = (await plugins.getAllPlugin()).filter(fp => {
            let fn = path.basename(fp);
            return stages.some(e => fn.startsWith(e));
        });
        ctx.body = result({ stages, pluginPath });
    });

    // 改
    router.all('管理路由 - 禁用/启用指定插件', '/management/api/switch', async (ctx, next) => {
        console.log('ctx.request.body', ctx.request.body)
        ctx.body = ctx.request.body
    });

    router.all('管理路由 - 确认移动插件文件', '/management/api/movePlugin', async (ctx, next) => {

    });

    // 增
    router.all('管理路由 - 上传插件', '/management/api/upload', async (ctx, next) => {

    });

    // 删
    router.all('管理路由 - 删除插件', '/management/api/remove', async (ctx, next) => {

    });

    // 其他
    router.all('管理路由 - 远程下载文件', '/management/api/download', async (ctx, next) => {

    });

    router.all('管理路由 - 解压插件', '/management/api/unzip', async (ctx, next) => {

    });

    return router
}