const fs = require("fs");
const path = require("path");
const pluginType = require("./plugin-type.js");
const crypto = require('crypto');
const { safeEnsureDirSync } = require("./common.js");

const lc = {
    open: true,
    filename: ".apimap.json",
    filenamePrefix: ".apis"
}

/** 插件-自动保存 */
module.exports = pluginType(async function (entry, config, next) {
    const asc = config.getStorage("plugin-autoSave.js");

    /** @type {{text: entry.response.content.text | "", encoding: entry.response.content.encoding, filePath: filePath}} autoSave插件的数据 */
    const fileData = asc.fileData;
    const exists = fs.existsSync(fileData.filePath);
    // XXX 运行修改后的脚本生成最新的数据，然后看看能不能直接跑pp
    // if (fileData.text != "" && fs.existsSync(fileData.filePath)) {
    if (lc.open && fileData.text != "") {
        // 创建映射信息
        const filename = path.basename(fileData.filePath);
        const apimapPath = path.join(path.dirname(fileData.filePath), lc.filename);
        let apimap = {};
        if (fs.existsSync(apimapPath)) {
            apimap = JSON.parse(fs.readFileSync(apimapPath));
        }
        const md5 = calculateMD5(fileData.text);

        //读取当前文件的配置
        const fileApimap = apimap[filename] || {};
        fileApimap[md5] = readEntry(entry);

        // 处理文件路径

        let newpath = path.join(path.dirname(fileData.filePath), [
            lc.filenamePrefix, md5, path.basename(fileData.filePath)
        ].join('.'));
        fileApimap[md5].path = fileData.filePath;
        if (exists) {
            fileApimap[md5].path = newpath;
            fileData.filePath = fileApimap[md5].path;
        }

        try {
            fs.mkdirSync(path.dirname(apimapPath), { recursive: true });
        } catch (err) {
            safeEnsureDirSync(path.dirname(apimapPath), fileData.text);
        }
        apimap[filename] = fileApimap;
        fs.writeFileSync(apimapPath, JSON.stringify(apimap));
    }
    return next();
})

function calculateMD5(content) {
    return crypto.createHash('md5').update(content).digest('hex');
}

/**
 * 读取entry格式为 {upReq, upRes}
 * @param {import("./common.js").EntryType} entry 
 * @returns 
 */
function readEntry(entry) {
    const req = entry.request;
    const res = entry.response;

    const resHeaders = {};
    res.headers.forEach(header => resHeaders[header.name] = header.value);
    const reqContent = {};
    const reqHeaders = {};
    req.headers.forEach(header => reqHeaders[header.name] = header.value);

    try {
        req.queryString.forEach(kv => reqContent[kv.name] = kv.value);

        if (typeof req.postData == "object") {
            // "postData": {
            //     "mimeType": "application/json",
            //     "text": "{}"
            //   }

            // "postData": {
            //     "mimeType": "application/x-www-form-urlencoded",
            //     "text": "method=load&id=vsCommon&mgckey=stylename@generic~SESSION@87a5a62f-fe1d-490c-8bbf-e975da0ef50a",
            //     "params": [
            //     {
            //         "name": "method",
            //         "value": "load"
            //     },
            //     {
            //         "name": "id",
            //         "value": "vsCommon"
            //     },
            //     {
            //         "name": "mgckey",
            //         "value": "stylename@generic~SESSION@87a5a62f-fe1d-490c-8bbf-e975da0ef50a"
            //     }
            //     ]
            // }
            if (req.postData.params) {
                // 表单处理
                req.postData.params.forEach(kv => reqContent[kv.name] = kv.value)
            } else {
                // json 处理
                const data = JSON.parse(req.postData.text);
                Object.keys(data).forEach(k => reqContent[k] = data[k]);
            }
        }
    } catch (err) {
        console.log("读取数据失败", err)
        reqContent["_textBody"] = req.postData.text;
    }

    return {
        upReq: {
            line: {
                url: req.url,
                method: req.method,
                version: req.httpVersion
            },
            headers: reqHeaders,
            content: reqContent
        },
        upRes: {
            line: {
                url: req.url,
                method: req.method,
                version: req.httpVersion
            },
            headers: resHeaders,
            content: res.content.text,
            encodeing: res.content.encoding // 这里额外增加的
        },
    }
}