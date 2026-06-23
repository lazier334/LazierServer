import all from './utils/utils-im.js';
import * as globalUtils from './utils/utils.js';
import { createKoaRouter } from './types/index.ts';

const {
    Config,
    imConfig,
    db,
    readParamsAndSession,
    delay,
    userType,
    sessionType,
    messageType,
    topicType
} = all;
const USERAPI = imConfig.BASEAPI + '/user';
const MSGAPI = imConfig.BASEAPI + '/msg';
const cache = {
    types: {
        userType: Object.keys(userType),
        sessionType: Object.keys(sessionType),
        messageType: Object.keys(messageType),
        topicType: Object.keys(topicType),
    }
};

/**
 * 动态路由 History 插件，顺序为： 插件API > 文件API > HarAPI > 系统API > vue的历史模式（或类似框架） > external
 */
export default createKoaRouter(function koaRouterHistory(router) {
    if (Config.switch.closeIM) return router;
    return addRouter(router);
})

/**
 * im路由
 * @typedef {import('koa-router')} Router
 * @param {Router} router 路由
 * @returns {Router} 路由
 */
function addRouter(router) {

    // #region 超级管理员Api

    // 批量登出
    router.all(USERAPI + "/sa_logoutAll", warpApi((ctx, next, params) => {
        ctx.body = result(db.logoutAll(params));
    }, true, true));
    // 全部用户信息
    router.all(USERAPI + "/sa_onlineList", warpApi((ctx, next, params) => {
        ctx.body = result(db.accounts.map(user => onlineVO(user)));
    }, true, true));
    // 全部话题列表
    router.all(MSGAPI + "/sa_topicList", warpApi((ctx, next, params) => {
        ctx.body = result(toTopicListVO(Object.values(db.msgAuth)));
    }, true, true));

    // #endregion
    // #region User账号Api

    // 保存数据
    router.all(USERAPI + "/save", warpApi((ctx, next, params) => {
        ctx.body = result(db.apiSaveDB(params));
    }));

    // 数据库加密数据 与 json格式明文数据互转
    router.all(imConfig.BASEAPI + "/cryptoDB", warpApi((ctx, next, params) => {
        if (params.decode) ctx.body = globalUtils.crypto.encryptor.decrypt(params.data, params.key);
        else ctx.body = globalUtils.crypto.encryptor.encrypt(params.data, params.key);
    }));

    // 用户在线信息
    router.all(USERAPI + "/m_onlineList", warpApi(async (ctx, next, params) => {
        return await monitorApi(ctx, db.monitorSessionAll(params), sessionList => {
            return result(sessionList.map(user => ({
                userId: user.userId,
                status: user.status,
                username: user.username,
                lastUpdateTime: user.lastUpdateTime,
            })))
        });
    }));

    // 用户在线信息
    router.all(USERAPI + "/onlineList", warpApi((ctx, next, params) => {
        ctx.body = result(Object.values(db.sessions).map(user => onlineVO(user)));
    }));

    // 用户注册
    router.all(USERAPI + "/signUp", warpApi((ctx, next, params) => {
        const session = db.signUp(params);
        ctx.body = result(session);
        // 设置 session 到 Cookie 中
        ctx.cookies.set(imConfig.sessionKey, session, {
            httpOnly: true,     // 仅允许服务器访问 Cookie
            maxAge: imConfig.SESSION_MAX_AGE,   // 设置 Cookie 有效期为 1 天
            sameSite: 'strict', // 防止跨站请求伪造
        });
    }, true));

    // 用户登录
    router.all(USERAPI + "/login", globalUtils.router.loginLimiter, warpApi((ctx, next, params) => {
        const session = db.login(params);
        ctx.body = result(session);
        // 设置 session 到 Cookie 中
        ctx.cookies.set(imConfig.sessionKey, session, {
            httpOnly: true,     // 仅允许服务器访问 Cookie
            maxAge: imConfig.SESSION_MAX_AGE,   // 设置 Cookie 有效期为 1 天
            sameSite: 'strict', // 防止跨站请求伪造
        });
    }, true));

    // 密码计算，在修改密码的场景需要使用这个获取最终密码，上传的时候上传最终密码，但是登录则上传另一种加密的密码
    router.all(USERAPI + "/passwordSalt", globalUtils.router.loginLimiter, warpApi((ctx, next, params) => {
        ctx.body = result(db.passwordSalt(params.password));
    }));

    // 用户注销
    router.all(USERAPI + "/logout", warpApi((ctx, next, params) => {
        const session = db.logout(params);
        if (session) {
            ctx.body = result("Logout successful");
            // 清除 session
            ctx.cookies.set(imConfig.sessionKey, session, {
                httpOnly: true,     // 仅允许服务器访问 Cookie
                maxAge: 0,          // 设置 Cookie 有效期为过期
                sameSite: 'strict', // 防止跨站请求伪造
            });
        } else ctx.body = result(session);
    }));

    // 用户信息
    router.all(USERAPI + "/info", warpApi((ctx, next, params) => {
        ctx.body = result(db.readUserInfo(params));
    }));

    // 修改状态
    router.all(USERAPI + "/status", warpApi((ctx, next, params) => {
        ctx.body = result(db.status(params));
    }));

    // 修改账号有效期
    router.all(USERAPI + "/accountDeadline", warpApi((ctx, next, params) => {
        ctx.body = result(db.accountDeadline(params));
    }));

    // 修改账号管理员权限
    router.all(USERAPI + "/accountAdmin", warpApi((ctx, next, params) => {
        ctx.body = result(db.accountAdmin(params));
    }));

    // 修改账号信息
    router.all(USERAPI + "/updateAccount", warpApi((ctx, next, params) => {
        ctx.body = result(db.updateAccount(params));
    }));

    // 修改账号密码
    router.all(USERAPI + "/updatePassword", warpApi((ctx, next, params) => {
        ctx.body = result(db.updatePassword(params));
    }));

    // #endregion
    // #region Msg消息Api

    // 保存数据
    router.all(MSGAPI + "/save", warpApi((ctx, next, params) => {
        ctx.body = result(db.apiSaveDB(params));
    }));

    // 话题列表信息
    router.all(MSGAPI + "/m_topicList", warpApi(async (ctx, next, params) => {
        return await monitorApi(ctx, db.monitorTopicAll(params), topicList => result(toTopicListVO(topicList)));
    }));

    // 话题列表信息
    router.all(MSGAPI + "/topicList", warpApi((ctx, next, params) => {
        ctx.body = result(toTopicListVO(db.topicAll(params)));
    }));

    // 查找话题
    router.all(MSGAPI + "/selectTopic", warpApi((ctx, next, params) => {
        ctx.body = result(toTopicVO(db.selectTopic(params)));
    }));

    // 创建话题
    router.all(MSGAPI + "/createTopic", warpApi((ctx, next, params) => {
        ctx.body = result(toTopicVO(db.createTopic(params)));
    }));

    // 删除话题
    router.all(MSGAPI + "/deleteTopic", warpApi((ctx, next, params) => {
        ctx.body = result(toTopicListVO(db.deleteTopic(params)));
    }));

    // 修改话题信息
    router.all(MSGAPI + "/updateTopic", warpApi((ctx, next, params) => {
        ctx.body = result(toTopicVO(db.updateTopic(params)));
    }));

    // 用户退出话题
    router.all(MSGAPI + "/exitTopic", warpApi((ctx, next, params) => {
        ctx.body = result(toTopicVO(db.exitTopic(params)));
    }));

    // 监控消息
    router.all(MSGAPI + "/m_getMsg", warpApi(async (ctx, next, params) => {
        return await monitorApi(ctx, db.monitorAddMsg(params), msgs => {
            const cache = {};
            return msgs.map(msg => {
                const id = msg.userId;
                if (!cache[id]) {
                    cache[id] = db.accounts.find(user => user.userId == id) || {};
                }
                const msgVO = toMsgVO(msg);
                msgVO.username = cache[id].username;
                return msgVO;
            });
        });
    }, true));

    // 获取消息
    router.all(MSGAPI + "/getMsg", warpApi((ctx, next, params) => {
        // 补充其他需要的字段 username
        const cache = {};
        ctx.body = result(db.getMsg(params).map(msg => {
            const id = msg.userId;
            if (!cache[id]) {
                cache[id] = db.accounts.find(user => user.userId == id) || {};
            }

            const msgVO = toMsgVO(msg);
            msgVO.username = cache[id].username;
            return msgVO;
        }));
    }));

    // 添加消息
    router.all(MSGAPI + "/addMsg", warpApi((ctx, next, params) => {
        ctx.body = result(toMsgVO(db.addMsg(params)));
    }));

    // 删除消息
    router.all(MSGAPI + "/delMsg", warpApi((ctx, next, params) => {
        ctx.body = result(toMsgVO(db.delMsg(params)));
    }));

    // 更新消息
    router.all(MSGAPI + "/updateMsg", warpApi((ctx, next, params) => {
        ctx.body = result(toMsgVO(db.updateMsg(params)));
    }));

    // #endregion

    return router;
};

// #region 其他函数

/**
 * 包装api
 * 出现异常的时候自动响应，但是会延迟1秒
 * 会读取登录状态到 loginUser 里面，如果不需要登录就是 undefined 
 * @param {(ctx:import('koa-router').RouterContext, next:()=>void, params: {
 *  session:'im-session',
 *  loginUser:userType|undefined,
 *  [k:string]:any
 *  })=>void } fun 可以是promise
 * @param {boolean} notLogin 是否不需要登录
 * @param {boolean} superAdmin 超级管理员
 * @returns 
 */
function warpApi(fun, notLogin, superAdmin) {
    return async (ctx, next) => {
        try {
            let params = readParamsAndSession(ctx);
            if (superAdmin) db.isSuperAdminUser(db.readAdminUserBySession(params.session));
            if (!notLogin) db.readUserBySession(params.session);
            return await fun(ctx, next, params);
        } catch (error) {
            console.log(error)
            ctx.body = errResult(error.message, 500)
            await delay(1000);
        }
    }
}
/** 返回值 */
function result(data, code = 0) {
    return { code, data }
}
/** 异常时的返回值 */
function errResult(data, code = 404) {
    return result(data, code)
}

async function monitorApi(ctx, promise, successWarpResult = (data) => data) {

    try {
        // 获取客户端设置的超时时间（通过请求头或查询参数）
        const clientTimeout = parseInt(ctx.request?.headers?.['x-timeout'], 10);

        // 如果客户端没有设置超时时间，则使用 Koa 的默认超时时间
        const koaTimeout = ctx.timeout || ctx?.app?.server?.timeout || 0; // 获取 Koa 的超时时间（如果有）
        const timeout = clientTimeout || koaTimeout || 0; // 如果都没有设置，默认无限时间

        // 设置当前请求为无限时间（如果需要）
        ctx.req.setTimeout(0); // 设置为无限时间，防止 Koa 自身超时

        // 创建一个超时 Promise
        const timeoutPromise = new Promise((_, reject) => {
            if (timeout > 0) {
                setTimeout(() => {
                    reject(new Error('CLIENT_TIMEOUT')); // 超时错误
                }, timeout);
            }
        });

        // 运行 `fun` 并等待其结果
        const result = await Promise.race([promise, timeoutPromise]);

        // 如果成功运行 `fun`，返回结果
        ctx.body = successWarpResult(result);
    } catch (err) {
        if (err.message === 'CLIENT_TIMEOUT') {
            // 如果是客户端超时，返回 307 重定向
            ctx.status = 307;
            ctx.redirect(ctx.request.url); // 重定向到当前 URL
        } else {
            // 如果是服务器运行报错，正常返回错误信息
            ctx.status = 500;
            ctx.body = errResult(err.message, 500);
        }
    }
}

// #endregion
// #region VO转换

/**
 * 自动将标准格式的对象转为VO
 * @param {object} data 
 * @returns {object}  
 * @deprecated 除非使用类，不然不好用
 */
function autoToVO(data) {
    let keys = Object.keys(data);
    switch (keys.length) {
        case cache.types.topicType.length:
            if (comparisonKeys(cache.types.topicType, keys)) return toTopicVO(data);
            else break;
        case cache.types.messageType.length:
            if (comparisonKeys(cache.types.messageType, keys)) return toMsgVO(data);
            else break;
        case cache.types.userType.length:
            if (comparisonKeys(cache.types.userType, keys)) return toUserVO(data);
            else break;
        case cache.types.sessionType.length:
            if (comparisonKeys(cache.types.sessionType, keys)) return toSessionVO(data);
            else break;
        default: break;
    }
    return data;
}
/**
 * 对比两个数组是否完全一样，但不考虑顺序
 * @param {[]} list1 
 * @param {[]} list2 
 */
function comparisonKeys(list1, list2) {
    return list1.every(k => list2.includes(k))
}

/** * @param {topicType} topic  */
function toTopicVO(topic) {
    if (Array.isArray(topic)) return toTopicListVO(topic);
    let lastMsg = db.getLastMsgByTopic(topic);
    return {
        // auths: topic.auths,
        admins: topic.admins,       // 管理员列表
        // authKeys: topic.authKeys,// 授权监听列表
        topicId: topic.topicId,
        name: topic.name,
        lastMsg: lastMsg || {},
        userTotal: Object.keys(topic.auths).length,    // 用户总数
    }
}
function toTopicListVO(topicList) {
    if (!Array.isArray(topicList)) return toTopicVO(topicList);
    return topicList.map(topic => toTopicVO(topic))
}

/** * @param {messageType} msg  */
function toMsgVO(msg) {
    if (Array.isArray(msg)) return toMsgListVO(msg);
    return {
        id: msg.id,
        time: msg.time,
        userId: msg.userId,
        content: msg.content,
        type: msg.type,
        updateTime: msg.updateTime,
    }
}
function toMsgListVO(msgList) {
    if (!Array.isArray(msgList)) return toMsgVO(msgList);
    return msgList.map(msg => toMsgVO(msg))
}

/** * @param {userType} user  */
function onlineVO(user) {
    return {
        userId: user.userId,
        status: user.status,
        avatar: user.avatar,
        username: user.username,
        lastUpdateTime: user.lastUpdateTime,
    }
}
/** * @param {userType} user  */
function toUserVO(user) {
    return {
        userId: user.userId,
        status: user.status,
        username: user.username,
        // password: string,
        lastUpdateTime: user.lastUpdateTime,
        // deadline: user.deadline,
    }
}
function toUserListVO(userList) {
    return userList.map(user => toUserVO(user))
}

/** * @param {sessionType} session  */
function toSessionVO(session) {
    return {
        userId: session.userId,
        status: session.status,
        username: session.username,
        lastUpdateTime: session.lastUpdateTime,

        deadline: session.deadline,
        isAdmin: session.isAdmin,
        superAdmin: session.superAdmin,
    }
}
function toSessionListVO(sessionList) {
    return sessionList.map(session => toSessionVO(session))
}

// #endregion
