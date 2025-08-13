import fs from 'fs'
import path from 'path'
const baseDir = import.meta.dirname
const lc = {
    file: "ls-data.json"
}

export default handleParams
export { handleParams, baseDir }

/**
 * 处理参数
 * @param {'har file path'} inputFile 文件路径
 * @param {'output result dir path'} outputDir 输出文件夹路径
 * @param {boolean} clearOutputDir 是否清空输出文件夹
 * @param {boolean} cover 是否强制覆盖当前参数
 */
async function handleParams(inputFile, outputDir, clearOutputDir, cover) {
    const dir = import.meta.dirname;
    const filepath = path.join(dir, lc.file);
    if (!cover && fs.existsSync(filepath)) {
        let data;
        try {
            data = JSON.parse(fs.readFileSync(filepath))
        } catch (err) {/* 读取失败不用管 */ }

        // 当数据文件存在且 use 字段为假
        if (!(data?.use)) {
            throw new Error(`数据文件 ${filepath} 已存在且未被使用!`)
        }
    }
    // 写入配置数据
    fs.writeFileSync(filepath, JSON.stringify({
        use: false,
        inputFile: inputFile,
        outputDir: outputDir,
        clearOutputDir: clearOutputDir
    }))
}