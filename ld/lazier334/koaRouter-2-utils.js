import { fs, types, utils } from './libs/index.js';

/**
 * 动态路由 History 插件，顺序为： 插件API > 文件API > HarAPI > 系统API > vue的历史模式（或类似框架） > external
 */
export default types.createKoaRouter(function koaRouterUtils(router) {

    /**
     * 清理其他Key
     * @param {object} obj 需要清理的对象
     * @param {string[]} saveKeys 保留的 key 
     * @returns 
     */
    function cleanOtherKeys(obj, saveKeys) {
        for (let k in obj) {
            if (!saveKeys.includes(k)) delete obj[k];
        }
        return obj
    }
    router.all('工具接口 - 简化har文件', '/utils/simplifyHar', utils.routerUtil.warpApi((ctx, next, params) => {
        let fileMode = false;
        if (fs.existsSync(params.filepath)) {
            // 文件模式 - 读取文件进行操作
            params.har = JSON.parse(fs.readFileSync(params.filepath));
            fileMode = true;
        }
        // 1. 清理无用层级
        let newHar = { log: { entries: params.har.log.entries } };
        // 2. 清理不用字段
        let saveKeys = params.saveHeaders ? ['headers'] : [];
        newHar.log.entries.forEach(entry => {
            cleanOtherKeys(entry, ['request', 'response']);
            cleanOtherKeys(entry.request, ['url', ...saveKeys]);
            cleanOtherKeys(entry.response, ['content', ...saveKeys]);
        });
        ctx.body = JSON.stringify(newHar);
        if (fileMode) fs.writeFileSync(params.filepath + '.min.har', ctx.body);
    }));

    return router
})