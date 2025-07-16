/**
 * @param {import('../libs/config.js')}
 */
async function sysStartCommon({ fs, path, config }) {
    // 挂载全局对象
    if (!process.G) process.G = {};
    console.info(config.showVersion());

    // 检测 proxy.js 是否生成，如果没有生成，那么指定代码进行生成
    if (!fs.existsSync(path.join(config['genProxyTargetDir'], 'proxy.js'))) {
        console.warn('开发环境插件 proxy.js 不存在，生成该插件');
        await (await import('../libs/genProxy.js')).default('proxy.js');
    }

}
export default sysStartCommon;
