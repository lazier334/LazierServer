import { createKoaRouter } from './types/index.js';
import { config } from './libs/baseImport.js';

/**
 * 动态路由 History 插件，顺序为： 插件API > 文件API > HarAPI > 系统API > vue的历史模式（或类似框架） > external
 */
export default createKoaRouter(function koaRouterSystem(router, T) {

    // #region 系统接口

    router.all('接口: 获取模版', '/system/template', ctx => {
        const name = ctx.query.name;
        if (name && config.template[name]) {
            return ctx.body = config.template[name].trim();
        }
        ctx.body = result(Object.keys(config.template), '全部模版');
    });

    // #endregion 

    return router
})

/**
 * 响应数据
 * @param {any} data 
 * @param {string} msg 
 * @param {number} code 
 * @returns 
 */
function result(data, msg = '成功', code = 200) {
    return { code, msg, data }
}
