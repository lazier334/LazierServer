const fs = require("fs");
const path = require("path");
const pluginType = require("./plugin-type.js");
const { safeEnsureDirSync } = require("./common.js");

/** 插件-自动保存 */
module.exports = pluginType(async function (entry, config, next) {
    const lc = config.getStorage(__filename);
    const url = new URL(entry.request.url);
    const filePath = path.join(config.outputDir, decodeURIComponent(url.hostname), decodeURIComponent(url.pathname));

    // 处理图片
    lc.fileData = {
        text: entry.response.content.text || "",
        encoding: entry.response.content.encoding,
        filePath
    };
    // 如果是一个文件夹，那么改为 index.html
    if (fs.existsSync(lc.fileData.filePath) && fs.statSync(lc.fileData.filePath).isDirectory()) {
        lc.fileData.filePath = path.join(lc.fileData.filePath, config.defFileName)
    }
    await next();

    if (lc.fileData.text == "" && fs.existsSync(lc.fileData.filePath)) {
        return;
    }
    // 读取统计空间来控制空信息
    if (typeof config.statistics.nullMap != "object") config.statistics.nullMap = {};
    // 如果字符串小于1 或者类型不为真，那么就会被记录
    if ((typeof lc.fileData.text == "string" && lc.fileData.text.length < 1) || !lc.fileData.text) {
        config.statistics.nullMap[lc.fileData.filePath] = lc.fileData.text;
    } else if (config.statistics.nullMap[lc.fileData.filePath] != undefined) {
        delete config.statistics.nullMap[lc.fileData.filePath];
    }

    // 创建文件夹
    try {
        fs.mkdirSync(path.dirname(lc.fileData.filePath), { recursive: true });
    } catch (err) {
        console.log("安全地创建文件夹路径", lc.fileData.filePath)
        safeEnsureDirSync(path.dirname(lc.fileData.filePath));
    }
    if (lc.fileData.encoding) {
        fs.writeFileSync(lc.fileData.filePath, Buffer.from(lc.fileData.text, lc.fileData.encoding));
    } else {
        fs.writeFileSync(lc.fileData.filePath, lc.fileData.text);
    }

});