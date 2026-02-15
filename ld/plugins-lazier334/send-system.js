import { createSend } from './types/index.ts';
import { fs, path, config } from './libs/baseImport.js';


/**
 * 选择具体的api
 * 返回true则表示当前函数已响应数据
 */
export default createSend(async function sendSystem(sendOptions) {
    const { ctx, filename, opts } = sendOptions;
    if (ctx.path.startsWith('/system/')) {
        try {
            const fp = path.join(opts.root, filename);
            if (fs.existsSync(fp)) {
                let body = fs.readFileSync(fp, 'utf-8') || '';
                // 白名单中的文件都将转为html发送
                if (['copyright'].includes(filename)) {
                    ctx.type = 'text/html; charset=utf-8';
                }
                switch (filename) {
                    case 'copyright': body = body.replaceAll('YYYY', new Date().getFullYear())
                        .replaceAll('公司名称', config.copyright.copyright ?? config.copyright.companyName)
                        .replaceAll('备案号', config.copyright.icp);
                        if (config.copyright.icp === '') {
                            body = body.replaceAll('<a href="https://beian.miit.gov.cn/" target="_blank"></a> |', '')
                        }
                        break;
                    case 'contact': body = body.replaceAll('lazier334@lazier334.com', config.copyright.contact);
                        break;
                    case 'privacy': body = body.replaceAll('隐私政策', config.copyright.privacy);
                        break;
                    case 'terms': body = body.replaceAll('使用条款', config.copyright.terms);
                        break;
                    // default:
                }
                ctx.body = body;
                return true;
            }
        } catch (error) {
            console.log('系统接口包装处理失败', path.join(opts.root, filename), error)
        }
    }
    return sendOptions;
})