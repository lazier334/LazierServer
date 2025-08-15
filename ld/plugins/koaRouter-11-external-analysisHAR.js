import runCmd from './utils/util-cmd.js';
import result from './utils/util-result.js';
import { fs, path } from './libs/baseImport.js';
import { handleParams, baseDir } from './externals/gen-web-by-har/ls-startBefore.mjs';

/**
 * 动态路由 History 插件，顺序为： 插件API > 文件API > HarAPI > 系统API > vue的历史模式（或类似框架） > external
 * @param {import('@koa/router')} router 路由
 */
export default function koaRouterExternalAnalysisHAR(router) {
    router.all('外部插件-解析har文件', '/external/analysisHAR', async (ctx, next) => {
        const { inputFile, outputDir } = ctx.request.body;
        const lif = path.join(baseDir, inputFile);
        const lod = path.join(baseDir, outputDir);
        let re = '';
        if (!(inputFile && fs.existsSync(lif) && fs.statSync(lif).isFile())) re = '参数inputFile合并后不是一个文件的路径: ' + lif;
        else if ((outputDir && fs.existsSync(lod) && fs.statSync(lod).isFile())) re = '参数outputDir合并后不是一个文件夹的路径，他是一个文件 ' + lod;
        else {
            if (!fs.existsSync(lod)) {
                // 创建输出文件夹
                fs.mkdirSync(lod, { recursive: true })
            }
            // 设置参数
            await handleParams(inputFile, outputDir, true, true);
            // 通过cmd运行第三方插件项目 参数是 inputFile, outputDir
            re = await runCmd(`cd ./ld/plugins/externals/gen-web-by-har && npm run gen`);
        }
        ctx.body = result(re);
    });

    return router
}