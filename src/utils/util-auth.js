const allowAdmin = {
    /** 用户id */
    "userId": 0,
    /** 状态 */
    "status": "在线",
    /** 用户名 */
    "username": "admin",
    /** 密码 */
    "password": "-",
    /** 最后登录时间 */
    "lastUpdateTime": 1745751359079,
    /** 账号失效时间 */
    "deadline": 4102358400000,
    /** 是否是管理员 */
    "isAdmin": true,
    /** 是否是超级管理员 */
    "superAdmin": true
}

module.exports = {
    authUser,
    userType: allowAdmin
};
/**
 * 默认本机发起的请求信息全都是超级管理员
 * @param {*} ctx 
 * @returns {allowAdmin} 用户信息
 */
function authUser(ctx) {
    try {
        if (allowLocalOnly(ctx)) return allowAdmin;
    } catch (error) {
        console.log('权限校验失败', error)
    }
}

// 仅允许本机请求的中间件
function allowLocalOnly(ctx) {
    const ip = ctx.ip || ctx.request.ip;
    return ip === '::1' || ip === '127.0.0.1';
}