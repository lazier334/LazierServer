import { fs, config } from '../libs/baseImport.js';
import { delay } from './util-base.js';
import { authAdmin, authUser } from './util-auth.js';
import { result } from './util-result.js';
import { RateLimiterMemory } from 'rate-limiter-flexible';

/**
 * @typedef {import('koa').ParameterizedContext} CTX
 * @typedef {import('koa').Next} Next
 */
/** 本地配置 */
const lc = {
    moreLog: config.moreLog ? console.debug : () => { }
}
// 1. 创建纯内存限流器
const loginRateLimiter = new RateLimiterMemory({
    points: 10,         // 允许10次尝试
    duration: 15 * 60,  // 15分钟窗口
    keyPrefix: 'login_' // 键名前缀（可选）
});
// 2. 限流中间件
const loginLimiter =
    /**
     * 
     * @param {CTX} ctx 
     * @param {Next} next 
     */
    async (ctx, next) => {
        try {
            // 使用IP+用户名作为唯一标识（防撞库）
            const identifier = ctx.ip + ':' + (ctx.request.body?.username || ctx.request.query?.username || 'unknown');
            await loginRateLimiter.consume(identifier);
            await next();
        } catch (err) {
            ctx.status = 429;
            ctx.body = {
                code: 429,
                msg: `登录尝试过多，请${Math.ceil(err.msBeforeNext / 1000)}秒后再试`
            };
        }
    };

// #region 导出工具
export {
    loginLimiter,
    readHtml,
    clearGtag,
    clearShare,
    addProxyJs,
    readParamsAndSession,
    warpApi,
    handlerHtmlBodyData,
    isHandlerHtmlBodyData,
}

/**
 * 读取html文件
 * @param {string} filepath 
 * @param {CTX} ctx 
 */
function readHtml(filepath, ctx) {
    const fileContent = fs.readFileSync(filepath, "utf-8");
    ctx.type = "text/html";
    ctx.body = fileContent;
}
/**
 * 给字符串删除分享信息标签
 * @param {string} body 
 */
function clearShare(body) {
    try {
        const shareIndex = body.indexOf('meta property="og:url"');
        if (-1 < shareIndex) {
            const scriptSI = body.lastIndexOf('<head', shareIndex) + '<head'.length;
            const scriptEI = body.indexOf('<title>', shareIndex);
            const scriptBody = body.substring(scriptSI, scriptEI);
            showInfo('删除 share 信息', scriptBody, scriptSI, scriptEI)
            body = body.replaceAll(scriptBody, '>\n');
        }
    } catch (error) {
        console.error('删除 share 信息失败', error)
    }
    return body
}
/**
 * 给字符串删除gtag标签
 * @param {string} body 
 */
function clearGtag(body) {
    try {
        const gtagIndex = body.indexOf('.com/gtag');
        if (-1 < gtagIndex) {
            const scriptSI = body.lastIndexOf('<script', gtagIndex);
            const scriptEI = body.indexOf('</script>', gtagIndex) + '</script>'.length;
            const scriptBody = body.substring(scriptSI, scriptEI);
            showInfo('删除 gtag 标签', scriptBody, scriptSI, scriptEI);
            body = body.replaceAll(scriptBody, '');
        }
    } catch (error) {
        console.error('删除 gtag 标签失败', error)
    }
    return body
}
/**
 * 给字符串添加本地插件代码
 * @param {string} body 
 */
function addProxyJs(body) {
    try {
        // ## 添加标签
        body = body.split(config.indexInsertCode).join('')
            .split(`<script src="/proxy.js"></script>`).join('')
            .split(`<script src='/proxy.js'></script>`).join('');
        if (body.includes('proxy.js')) console.warn('可能已有本地插件的代码');
        else {
            const si = body.indexOf('<script');
            body = body.substring(0, si) + config.indexInsertCode + body.substring(si);
            showInfo('已自动填充插件代码', config.indexInsertCode, si, si);
        }
    } catch (error) {
        console.error('自动添加插件代码失败', error);
    }
    return body
}

// #endregion
// #region 工具的工具函数

/**
 * 显示信息
 * @param {string} title 标题
 * @param {string} msg 消息内容
 * @param {number} si 开始下标
 * @param {number} ei 结束下标
 * @param {string} remark 备注
 */
function showInfo(title, msg, si = '', ei = '', remark = '') {
    lc.moreLog(si, `-----↓${title}↓-------`, ei, remark);
    lc.moreLog(msg);
    lc.moreLog(si, `-----↑${title}↑-------`, ei, remark);
}

// #endregion
// #region router相关工具函数

/**
 * 读取session和参数
 * @param {*} ctx 
 * @returns {{session:'im-session'}} 
 */
function readParamsAndSession(ctx) {
    let session;
    try {
        session = ctx.cookies.get(config.session.key)
    } catch (error) {
        console.debug('读取session失败', error)
    }
    return {
        session,
        ...ctx.request.query,
        ...ctx.request.body
    }
}

/**
 * 包装api  
 * 出现异常的时候自动响应，但是会延迟1秒  
 * 会读取登录状态到 loginUser 里面，如果不需要登录就是 undefined 
 * @param {(ctx:import('koa-router').RouterContext, next:()=>void, params: {
 *  session:'im-session',
 *  loginUser:userType|undefined,
 *  [k:string]:any
 *  })=>void } fun 可以是promise
 * @param {boolean} login 是否需要登录
 * @param {boolean} admin 是否需要超级管理员
 * @returns 
 */
function warpApi(fun, login, admin) {
    return async (ctx, next) => {
        try {
            if (admin) authAdmin(ctx);
            if (login) authUser(ctx);
            return await fun(ctx, next, readParamsAndSession(ctx));
        } catch (error) {
            console.log(error)
            ctx.body = result(error, '失败', 500)
            await delay(1000);
        }
    }
}

/**
 * 可以自定义实现这个函数  
 * 处理 html 接口的 body 的数据，但是不会设置到 ctx.body
 * @param {import('koa-router').RouterContext} ctx 
 * @param {string} body 
 * @returns {string}
 */
function handlerHtmlBodyData(ctx, body) {
    if (isHandlerHtmlBodyData(ctx)) {
        if (body instanceof Buffer) {
            body = body.toString();
        }
        body = addProxyJs(body);
        body = clearGtag(body);
    }
    return body
}
/**
 * 可以自定义实现这个函数  
 * 是否可以操作 html 接口数据
 * @param {import('koa-router').RouterContext} ctx 
 * @returns {boolean}
 */
function isHandlerHtmlBodyData(ctx) {
    return config.switch.handlerHtmlBodyData
        && (ctx.path.endsWith('.html')
            || ctx.path.endsWith('.htm'))
}

// #endregion