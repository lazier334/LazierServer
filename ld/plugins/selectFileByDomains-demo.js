/**
 * 多路径存在同一api时的选择 demo 插件
 * @param {["api.demo.com", "m.demo.com"]} domains 域名映射列表
 * @param {{"api.demo.com": "api.demo.com/assets/index.js", "m.demo.com": "m.demo.com/assets/index.js"}} domainsMap 域名映射列表
 * @param {import('koa').Context} ctx koa的上下文
 */
export default function koaRouterSystem(domains, domainsMap, ctx) {
    return domains[0]
}