import { createSend } from './types/index.js';
import { fs, path } from './libs/baseImport.js';

const lc = {
    redirectFileName: '.300',
}

/**
 * 重定向api插件  
 * 选择具体的api  
 * 返回true则表示当前函数已响应数据
 */
export default createSend(async function sendRedirectApi(sendOptions) {
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
})