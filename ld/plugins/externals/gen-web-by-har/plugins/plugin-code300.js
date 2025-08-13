const fs = require("fs");
const path = require("path");
const pluginType = require("./plugin-type.js");
const { safeEnsureDirSync } = require("./common.js");

const lc = {
    open: false,
    filenameSuffix: ".300"
}

/** 插件-自动保存 */
module.exports = pluginType(async function (entry, config, next) {
    let redirectURL = entry.response.redirectURL;
    if (lc.open && redirectURL
        && 300 <= entry.response.status && entry.response.status < 400) {
        const asc = config.getStorage("plugin-autoSave.js");
        /** @type {{text: entry.response.content.text | "", encoding: entry.response.content.encoding, filePath: filePath}} autoSave插件的数据 */
        const fileData = asc.fileData;
        // 将重定向跳转页面的html内容写入到数据中，最终会被写入到文件
        fileData.text = getRedirectContent(redirectURL);

        // 创建 .300 文件
        let path300 = fileData.filePath + lc.filenameSuffix;
        try {
            fs.mkdirSync(path.dirname(path300), { recursive: true });
        } catch (err) {
            safeEnsureDirSync(path.dirname(path300));
        }
        fs.writeFileSync(path300, redirectURL);
    }
    return next();
})

function getRedirectContent(redirectURL) {
    if (!redirectURL) throw new Error("重定向地址不能为空");
    // 内容是网页自动跳转到指定的地址
    let content = `<!DOCTYPE html>
    <html>
    <head>
        <meta http-equiv="refresh" content="0;url=${redirectURL}">
    </head>
    <body>
        如果没有自动跳转，请<a href="${redirectURL}">点击这里</a>。
    </body>
    </html>
    `;
    return content;
}
