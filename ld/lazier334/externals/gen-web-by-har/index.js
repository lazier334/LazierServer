const fs = require("fs");
const path = require("path");
const { config, anyEntry, deleteFolderRecursive, getStorage, simpleVMJsonParse } = require("./plugins/common.js");

console.log("清理输出目录中...");
deleteFolderRecursive(config.outputDir)
scan(config.inputDir)

async function scan(dir) {
    // 读取 dir 文件夹中的所有 config.extname 文件
    const files = fs.readdirSync(dir);
    const outDir = config.outputDir;
    const statistics = getStorage("statistics");
    statistics.anyError = [];
    statistics.rename = [];
    statistics.startTime = Date.now();
    statistics.reqCount = 0;

    for (const file of files) {
        if (path.extname(file) === config.extname) {
            const filePath = path.join(dir, file);
            const outputDir = path.join(outDir, path.basename(file, config.extname));
            config.outputDir = outputDir;

            // 创建输出目录
            fs.mkdirSync(outputDir, { recursive: true });

            // 读取并解析 har 文件
            const harData = simpleVMJsonParse(fs.readFileSync(filePath, 'utf8'));
            console.log(`解析(${harData.log.entries.length})`, file);
            statistics.reqCount += harData.log.entries.length;
            for (const entry of harData.log.entries) {
                try {
                    await anyEntry(entry)
                } catch (err) {
                    statistics.anyError.push(`[${entry.response.content.mimeType}] [${entry.request.url}] ${err.message} ${err.stack}`)
                }
            }
        }
    }

    statistics.nullList = Object.keys(statistics.nullMap || {});
    let msg = [
        [
            "解析总请求数:",
            statistics.reqCount,
            "更名总数:",
            `\x1b[32m${statistics.rename.length}\x1b[0m`,
            "空文件总数:",
            `\x1b[33m${statistics.nullList.length}\x1b[0m`,
            "异常总数:",
            `\x1b[31m${statistics.anyError.length}\x1b[0m`,
        ].join(" ")
    ];
    if (0 < statistics.rename.length) {
        statistics.rename.unshift('更名列表: \x1b[32m');
        statistics.rename[statistics.rename.length - 1] += "\x1b[0m";
        msg.push(statistics.rename.join("\n  "));
    }
    if (0 < statistics.nullList.length) {
        statistics.nullList.unshift('空文件列表: \x1b[33m');
        statistics.nullList[statistics.nullList.length - 1] += "\x1b[0m";
        msg.push(statistics.nullList.join("\n  "));
    }
    if (0 < statistics.anyError.length) {
        statistics.anyError.unshift('异常列表: \x1b[31m');
        statistics.anyError[statistics.anyError.length - 1] += "\x1b[0m";
        msg.push(statistics.anyError.join("\n  "));
    }
    const warnMsg = '当前程序无法解析字符串类型string与二进制类型binary混合的数据！如果存在这类数据，请手动处理！';
    msg.push(`解析完成! 耗时: ${Date.now() - statistics.startTime}ms \n${warnMsg}\n${warnMsg}\n${warnMsg}`);

    console.log("");
    console.warn(msg.join("\n"));
    // console.log(`异常总数: ${anyError.length}\n${anyError.join("\n")
    //     }\n更名总数: ${config.rename.length}\n${config.rename.join("\n")}`)
}
