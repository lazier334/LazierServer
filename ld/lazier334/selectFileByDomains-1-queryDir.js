import { createSelectFileByDomains } from './types/index.js';

/**
 * 多路径存在同一api时的选择算法插件的demo  
 * 存在参数 dir 时优先匹配该路径的文件夹  
 * 如果无返回值，系统会默认选择第一个
 */
export default createSelectFileByDomains(function selectFileByDomainsDemo(domains, domainsMap, ctx) {
    // 如果存在参数 dir 则将其检测并选中，选中目录是 endsWith 从后向前匹配
    if (ctx.query.dir) {
        let priorityDir = domains.find((item) => item.replaceAll('\\', '/').endsWith(ctx.query.dir.replaceAll('\\', '/')));
        if (priorityDir) return domainsMap[priorityDir];
    }
})