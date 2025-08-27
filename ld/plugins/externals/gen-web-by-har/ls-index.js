const fs = require("fs");
const path = require("path");
const { config, anyEntry, deleteFolderRecursive, simpleVMJsonParse } = require("./plugins/common.js");
const lc = {
    file: "ls-data.json"
}
const data = JSON.parse(fs.readFileSync(lc.file, 'utf8'));
console.log('data', data);
// 清空输出文件夹，如果文件夹是 web ，那么将排除一些固定的文件夹 example、index、 plugin
if (data.clearOutputDir) {
    if (data.outputDirPath.endsWith('web')) {
        let dirs = fs.readdirSync(data.outputDirPath);
        for (const dir of dirs) {
            if ([].includes(dir)) continue;
            deleteFolderRecursive(path.join(data.outputDirPath, dir))
        }
    } else {
        deleteFolderRecursive(data.outputDirPath)
    }
};
main(data.inputFile, data.outputDir);

/**
 * 解析单个 har 文件
 * @param {'/a/b/c.har'} inputFile 输入的文件
 * @param {'/a/o/'} outputDir 输出的文件夹路径 
 */
async function main(inputFile, outputDir) {
    let msg;
    // 读取并解析 har 文件
    const startTime = Date.now();
    const harData = simpleVMJsonParse(fs.readFileSync(inputFile, 'utf8'));
    console.log(`解析(${harData.log.entries.length})`, inputFile);
    // 设置输出路径
    config.outputDir = outputDir;
    for (const entry of harData.log.entries) {
        await anyEntry(entry)
    }
    msg = `处理完成, 耗时${Date.now() - startTime}ms, 输出路径为: ${config.outputDir}`;
    console.log(msg);
    // 删除配置数据
    data.use = true;
    fs.writeFileSync(lc.file, JSON.stringify(data));
    return msg
}