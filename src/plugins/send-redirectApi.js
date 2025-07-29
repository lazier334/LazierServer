import { fs, path } from '../libs/config.js';
const lc = {
    redirectFileName: '.300',
}
/**
 * @typedef {{
 *  ctx: import('koa').ParameterizedContext,    //koa的上下文对象
 *  filename: 'gameService',                    // 文件名称
 *  opts: import('koa-send').SendOptions,       // send的配置, opts.root 是目录
 * }} SendOptions send的配置对象
 */

/**
 * 选择具体的api
 * 返回true则表示当前函数已响应数据
 * @param {SendOptions}  sendOptions
 * @returns {SendOptions}
 */
export default async function sendRedirectApi(sendOptions) {
    const { ctx, filename, opts } = sendOptions;
    try {
        const fp300 = path.join(opts.root, filename + lc.redirectFileName);
        if (fs.existsSync(fp300)) {
            const url = fs.readFileSync(fp300, 'utf-8');
            console.log('接口重定向', ctx.url, '->', url);
            ctx.redirect(url);
            ctx.sendFileFromPath = fp300;
            return true;
        }
    } catch (error) {
        console.log('接口重定向解析失败', path.join(opts.root, filename), error)
    }
    return sendOptions;
}