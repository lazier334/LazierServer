import { createSelectFileByDomains } from './types/index.js';

/**
 * 多路径存在同一api时的选择算法插件的demo
 */
export default createSelectFileByDomains(function selectFileByDomainsDemo(domains, domainsMap, ctx) {
    // 默认选择第1个
    let selectFolder = domains[0];
    // 如果存在参数 dir 则将其检测并选中，选中目录是 endsWith 从后向前匹配
    if (ctx.query.dir) {
        let priorityDir = domains.find((item) => item.replaceAll('\\', '/').endsWith(ctx.query.dir.replaceAll('\\', '/')));
        if (priorityDir) selectFolder = priorityDir;
    }
    return domainsMap[selectFolder];
})