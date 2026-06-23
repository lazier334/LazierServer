import { createBuild } from '../plugins/types/index.ts';
import { fs, path, config } from '../plugins/libs/baseImport.js';

/** 配置 */
const lc = config.selectConfig({
    /** 插件代码 */
    genInsertInsertCode: `<script src="/proxy.js"></script>`,
    /** 输出的文件夹 */
    outdir: 'dist',
    // TODO
    /** 指定扫描输出目录 "html/" 中的子目录列表 */
    scanDirs: [
        'project-domain.com',
    ],
    /** 处理的文件列表，以及映射使用什么函数进行处理 */
    handleFileMap: {
        /** {@link file://./../VirtualFile.md#便捷指令 添加插件} */
        'index.html': handle_index,
        /** {@link file://./../VirtualFile.md#13 清理gtag} */
        'analytics.min.js': handle_gtag,
    },
    /** 操作状态 */
    status: {
        /** 成功列表 */
        TRUE: [],
        /** 失败列表 */
        FALSE: [],
        /** 编辑列表 */
        EDIT: []
    },
    /** 更多日志 */
    moreLog: false
});
const lastDirname = path.resolve(import.meta.dirname, '..');
if (!lc.outdir.startsWith(lastDirname)) lc.outdir = path.join(lastDirname, lc.outdir);

/**
 * 打包时用于处理 的插件
 */
export default createBuild(async function buildHandler(msgs) {
    // 格式化路径
    handleDirs(lc.outdir, lc.scanDirs);
})

/**
 * 处理文件夹列表
 * @param {string} baseDir 基础文件夹路径
 * @param {string[]} scanDirs 指定的文件夹列表
 */
function handleDirs(baseDir, scanDirs) {
    scanDirs.forEach(dir => {
        const dirPath = path.join(baseDir, dir);
        if (fs.existsSync(dirPath)) scanDirectory(dirPath);
        else console.error(`扫描指定的目录不存在: ${dirPath}`);
    });
    if (lc.moreLog) console.log('尝试修改文件列表', lc.status.EDIT)
    console.info(`已处理完成 编辑数:${lc.status.EDIT.length} 成功数:${lc.status.TRUE.length} 失败数:${lc.status.FALSE.length}`);
    if (0 < lc.status.FALSE.length) console.error('修改失败的文件列表', lc.status.FALSE);
}

/**
 * 扫描文件夹
 * @param {string} dir 文件夹路径
 */
function scanDirectory(dir) {
    try {
        let files = fs.readdirSync(dir, { withFileTypes: true });
        console.log('files', files)
        files.forEach(file => {
            const filepath = path.join(dir, file.name);
            if (file.isDirectory()) {
                scanDirectory(filepath);
            } else if (typeof lc.handleFileMap[file.name] == 'function') {
                // 处理 文件内容 
                lc.status.EDIT.push(filepath);
                console.log(`正在处理 ${file.name} 文件: ${filepath}`);
                if (lc.handleFileMap[file.name](filepath)) {
                    lc.status.TRUE.push(filepath);
                } else {
                    lc.status.FALSE.push(filepath);
                }
            }
            // 其他自定义的处理
        });
    } catch (err) {
        console.error(`无法读取目录 ${dir}:`, err);
    }
}

/**
 * 输出详细日志信息
 * @param {string} title 标题 - 这段信息的标题
 * @param {string} msg 主要消息 - 文本段
 * @param {string} si 开始标记 - 文本段起始位置
 * @param {string} ei 结束标记 - 文本段末尾位置
 * @param {string} fp 后续内容 - 文件路径
 */
function showInfo(title, msg, si = '', ei = '', fp = '') {
    if (lc.moreLog) {
        console.log(si, `-----↓${title}↓-------`, ei, fp)
        console.log(msg)
        console.log(si, `-----↑${title}↑-------`, ei, fp)
    }
}

/**
 * 处理首页 index 
 * 给首页添加导入插件的代码
 * @param {string} filepath 文件路径
 * @returns {boolean} 操作结果
 */
function handle_index(filepath) {
    // 读取文件
    let body = fs.readFileSync(filepath, 'utf8');

    // 清理开发环境插件并添加生产环境插件
    body = body.split(`<script src="/proxy.js"></script>`).join('')
        .split(`<script src='/proxy.js'></script>`).join('')
        .split(lc.genInsertInsertCode).join('');
    if (body.includes('proxy.js')) console.error('该文件可能有本地插件的代码，请手动处理，文件路径:', filepath);
    const si = body.indexOf('<script');
    body = body.substring(0, si) + lc.genInsertInsertCode + body.substring(si);

    // 写回文件中
    fs.writeFileSync(filepath, body);
    return body == fs.readFileSync(filepath, 'utf8');
}

/**
 * 指定词范围替换模式示例
 * 清理 cf 的script标签
 * @param {string} filepath 文件路径
 * @returns {boolean} 操作结果
 */
function handle_cloudflareScript(filepath) {
    // 读取文件
    let body = fs.readFileSync(filepath, 'utf8');

    // 清理 cloudflare 的分析组件的 scritp 标签
    const beaconScriptIndex = body.indexOf('cloudflareinsights.com/beacon.min.js');
    if (-1 < beaconScriptIndex) {
        const scriptSI = body.lastIndexOf('<script', beaconScriptIndex);
        const scriptEI = body.indexOf('</script>', beaconScriptIndex) + '</script>'.length;
        const scriptBody = body.substring(scriptSI, scriptEI);
        showInfo('删除 cloudflare 的 beacon.min.js 标签', scriptBody, scriptSI, scriptEI, '文件: ' + filepath)
        body = body.replaceAll(scriptBody, '');
    } else console.info('没有找到关键词！', filepath);

    // 写回文件中
    fs.writeFileSync(filepath, body);
    return body == fs.readFileSync(filepath, 'utf8');
}

/**
 * 关键词替换模式示例
 * 处理 gtag 简单版，基于replaceAndWrite工具函数
 * @param {string} filepath 文件路径
 * @returns {boolean} 操作结果
 */
function handle_simple_gtag(filepath) {
    const keyword = 'https://www.googletagmanager.com/gtag/js?';
    const replaceStr = 'about:blank?';
    return replaceAndWrite(filepath, keyword, replaceStr);
}

/**
 * 关键词替换模式示例
 * 完整的处理 gtag
 * @param {string} filepath 文件路径
 * @returns {boolean} 操作结果
 */
function handle_gtag(filepath) {
    // 读取文件
    let body = fs.readFileSync(filepath, 'utf8');

    // 清理 gtag 
    body = body.replace('https://www.googletagmanager.com/gtag/js?', 'about:blank?');

    // 写回文件中
    fs.writeFileSync(filepath, body);
    return body == fs.readFileSync(filepath, 'utf8');
}

/**
 * 替换并写回文件
 * @param {string} filepath 文件路径
 * @param {string} keyword 关键词
 * @param {string} replaceStr 要替换的内容
 * @return {boolean} 是否修改成功。原始文件与保存后的文件的对比是否不相等
 */
function replaceAndWrite(filepath, keyword, replaceStr) {
    // 读取文件
    let body = fs.readFileSync(filepath, 'utf8');
    // 替换内容
    let newBody = body.replace(keyword, replaceStr);
    // 写入文件
    fs.writeFileSync(filepath, newBody);
    // 提示信息
    if (body == newBody) console.warn(`处理失败! 文件中可能不存在关键词，或已经替换`, filepath);
    // 返回结果
    return body != fs.readFileSync(filepath, 'utf8');
}