import { routerUtil, cryptoUtil } from './utils/u.js';
import { createKoaRouter } from './types/index.js';

/**
 * 动态路由 History 插件，顺序为： 插件API > 文件API > HarAPI > 系统API > vue的历史模式（或类似框架） > external
 */
export default createKoaRouter(function koaRouterOther(router) {
    // 数据库加密数据 与 json格式明文数据互转
    /**
     * 上传的数据如下  
     * key: {string} 秘钥
     * data: {string} 加密或解密的数据
     * decode: {boolean} 是否是解密模式
     *  {
     *      key: "123456789123456789123456789123456789",
     *      data: "ashvfajsvfaf" || "CbCnoKNmpIPoLh5r8CTBkXC9iyL7pk+hYz4Ehp30G4s=",
     *      decode: true
     *  }
     */
    router.all('其他接口 - 加解密数据', '/other/cryptoData', routerUtil.warpApi((ctx, next, params) => {
        if (params.decode) ctx.body = cryptoUtil.encryptor.decrypt(params.data, params.key);
        else ctx.body = cryptoUtil.encryptor.encrypt(params.data, params.key);
    }));
    router.all('其他接口 - 获取session', '/other/getSession', routerUtil.warpApi((ctx, next, params) => {
        ctx.session.userId = Date.now();
        ctx.body = '已设置';
    }));

    return router
})