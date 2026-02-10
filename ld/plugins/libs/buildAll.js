import { getPluginsModule } from './baseImport.js';

(async function main() {
    const { plugins } = await getPluginsModule();
    const moduleList = await plugins('build');
    // 打包成功后的其他提示信息对象，传递给要执行的插件，由插件进行添加
    const manualProcessingMsgs = [];

    let procedure = 1;
    console.log(`\n\x1b[34m\x1b[47m----- 开始打包 -----\x1b[0m`);
    for (const fun of moduleList.data) {
        console.log(`\n\x1b[34m\x1b[47m----- 第${procedure++}步运行 ${fun.name || '未命名'} -----\x1b[0m`);
        if (typeof fun == "function") await fun(manualProcessingMsgs);
    }
    console.log(`\n\x1b[34m\x1b[47m----- 打包结束${manualProcessingMsgs.length < 1 ? '' : `，请手动处理剩余的${manualProcessingMsgs.length}项`} -----\x1b[0m`);
    console.info(manualProcessingMsgs.map((v, i) => `${i + 1}. ${v}`).join('\n'));
    console.log('');
    // 如果有函数长时间运行，则可以在这里直接强行停止
    // process.exit(0);
})()