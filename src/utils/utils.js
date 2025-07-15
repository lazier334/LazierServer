/**
 * 聚合工具对象
 * util 为单纯的工具，主要用于提供工具函数
 * utils 为聚合工具，本身就是一个完整的工具模块
 * @type {template}
 */
const utils = {};
const utilList = [
    require('./util-cmd.js'),
    require('./util-auth.js'),
    require('./util-crypto.js'),
    require('./util-router.js'),
    require('./util-tasks.js'),
];
utilList.forEach(obj => {
    Object.entries(obj).forEach(([k, v]) => {
        if (utils[k]) throw new Error(`工具${k}已存在，请手动处理冲突，例如重命名`);
        utils[k] = v;
    })
})

module.exports = utils;

const template = {
    ...require('./util-cmd.js'),
    ...require('./util-auth.js'),
    ...require('./util-crypto.js'),
    ...require('./util-router.js'),
    ...require('./util-tasks.js'),
}