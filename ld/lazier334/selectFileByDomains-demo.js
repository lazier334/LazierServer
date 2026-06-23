import { createSelectFileByDomains } from '../plugins/types/index.ts';

/**
 * 多路径存在同一api时的选择算法插件的demo
 */
export default createSelectFileByDomains(function selectFileByDomainsDemo(domains, domainsMap, ctx) {
    return { end: true, result: domains[0] }
})