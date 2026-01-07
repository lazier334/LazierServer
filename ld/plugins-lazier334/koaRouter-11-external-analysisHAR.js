import { createKoaRouter } from './types/index.ts';
import runCmd from './utils/util-cmd.js';
import result from './utils/util-result.js';
import { fs, path } from './libs/baseImport.js';
import { handleParams, baseDir } from './externals/gen-web-by-har/ls-startBefore.mjs';
const dirname = path.dirname(import.meta.url);

/**
 * 动态路由 History 插件，顺序为： 插件API > 文件API > HarAPI > 系统API > vue的历史模式（或类似框架） > external
 * @param {import('@koa/router')} router 路由
 */
export default createKoaRouter(function koaRouterExternalAnalysisHAR(router) {
    router.all('外部插件-解析har文件', '/external/analysisHAR', async (ctx, next) => {
        const {
            inputFile,
            /** 使用 '../../../web/' 参数即可将路径定位到 web 文件夹 */
            outputDir = 'output'
        } = ctx.request.body;
        const infile = path.join(baseDir, inputFile);
        const outdir = path.join(baseDir, outputDir);
        let re = '';
        if (!(inputFile && fs.existsSync(infile) && fs.statSync(infile).isFile())) re = '参数inputFile合并后不是一个文件的路径: ' + infile;
        else if ((outputDir && fs.existsSync(outdir) && fs.statSync(outdir).isFile())) re = '参数outputDir合并后不是一个文件夹的路径，他是一个文件 ' + outdir;
        else {
            if (!fs.existsSync(outdir)) {
                // 创建输出文件夹
                fs.mkdirSync(outdir, { recursive: true })
            }
            // 设置参数
            await handleParams(inputFile, outputDir, true, true);
            // 通过cmd运行第三方插件项目
            re = await runCmd(`cd ${dirname}/externals/gen-web-by-har && npm run gen`);
        }
        ctx.body = result(re);
    });

    return router
})