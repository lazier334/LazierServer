import { createBuild } from '../plugins/types/index.ts';
import { fs, path, config } from '../plugins/libs/baseImport.js';

const lc = config.selectConfig({
    rootDir: 'web',
    outdir: 'dist',
    indir: '下方代码进行填充',
    // 复制时排除指定的文件，使用 "/" 和 "\\" 都可以
    excludeList: [
        // 'web/a',
        // 'web\\b',
    ],
    // TODO 清理复制完成后输出目录的指定文件
    clearList: [
        // 'aa/bb/c'
    ],
    // TODO 映射复制的文件与目标目录
    dirMap: {
        ...{// 自定义文件夹映射
            // 插件
            [path.join(config.genProxyTargetDir, config.genProxyTargetFile)]: config.genProxyTargetFile,
            // 'aa': '/',
            // 'aa/bb': '/'
        }, ...Object.fromEntries([
            // 会生成列表中的文件夹映射 {'dir1': 'dir1', 'dir2': 'dir2'}
            // 'dir1',
            // 'dir2',
        ].map(domain => [domain, domain]))
    }
});
const lastDirname = path.resolve(import.meta.dirname, '..');
if (!lc.outdir.startsWith(lastDirname)) lc.outdir = path.join(lastDirname, lc.outdir);
if (lc.rootDir.startsWith(lastDirname)) lc.indir = lc.rootDir;
else lc.indir = path.join(lastDirname, lc.rootDir);

/**
 * 打包时用于复制目标文件 的插件
 */
export default createBuild(async function buildCopy(msgs) {
    console.log('清理输出目录', lc.outdir);
    fs.rmSync(lc.outdir, { recursive: true, force: true });
    const startTime = Date.now();
    let errInfo = null;
    console.log('正在复制文件并清理多余数据中...');
    try {
        copyFiles(lc.dirMap, lc.indir, lc.outdir, lc.excludeList);
        clearFiles(lc.clearList, lc.outdir);
    } catch (err) {
        err, console.error('打包时发生错误:', err);
    }
    console.log(`操作已${errInfo ? '结束' : '完成'}，耗时${Date.now() - startTime}ms\n存放目录: ${path.resolve(process.cwd(), lc.outdir)}`)
    return
})

/**
 * 清理文件列表
 * @param {string} fileList 文件列表
 * @param {'dist'} outdir 输出文件夹
 */
function clearFiles(fileList, outdir) {
    const paths = [];
    if (typeof outdir != 'string') outdir = lc.outdir;
    fileList.forEach(file => {
        const filepath = path.join(outdir, file);
        if (fs.existsSync(filepath)) {
            paths.push(filepath);
            fs.rmSync(filepath, { recursive: true, force: true });
        }
    });
    console.log('已清理完成', paths)
}

/**
 * 复制文件
 * @param {{'aa': '/'}} dirMap 文件夹映射，也可以映射文件
 * @param {'web'} baseInDir 输入文件夹
 * @param {'dist'} baseOutDir 输出文件夹
 * @param {['a/b/c.html']} excludeList 要排除的文件列表
 * @returns 
 */
function copyFiles(dirMap, baseInDir, baseOutDir, excludeList) {
    const errorList = [];
    const paths = [];
    const nullDirs = [];
    for (const k in dirMap) {
        try {
            const inputPath = k.startsWith(baseInDir) ? k : path.join(baseInDir, k);
            const outputPath = dirMap[k].startsWith(baseOutDir) ? dirMap[k] : path.join(baseOutDir, dirMap[k]);
            const exclude = excludeList.find(p => inputPath.replaceAll('/', '\\').includes(p.replaceAll('/', '\\')));
            if (exclude) {
                console.log('排除目录:', inputPath, '规则:', exclude)
            } else {
                if (fs.existsSync(inputPath)) {
                    fs.cpSync(inputPath, outputPath, { recursive: true, force: true });
                    paths.push(inputPath)
                } else {
                    nullDirs.push(inputPath)
                }
            }
        } catch (err) {
            errorList.push(err);
        }
    }
    console.log('已复制完成:', paths, '不存在的目录列表:', nullDirs);
    if (0 < errorList.length) {
        console.error('打包时发生的错误列表详细内容:')
        console.log(errorList)
        throw new Error('\n打包时发生的错误列表:\n' + errorList.map(e => e.message).join('\n'))
    };
}
