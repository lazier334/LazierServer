import fs from 'fs';
import path from 'path';
import type configDef from '../src/libs/configDef.ts';
type Config = typeof configDef;
const configTest: Partial<Config> = {
    // 这里可以用来快速查询与测试系统配置列表
}
// 服务器资源目录，plugins 和 web 共同所在的目录
var serverDir = [];
try {
    serverDir = JSON.parse(fs.readFileSync(path.join(import.meta.dirname, 'serverDir.json'), 'utf8'));
    // 在此处对文件夹路径做定位与排序
    serverDir = serverDir.map((dir: string) => path.resolve(import.meta.dirname, dir)).sort();
} catch { };

/**
 * 用户自定义配置  
 * 只有这里的配置信息会被导出  
 * 上面是便捷查询、测试使用，实际变量未使用
 */
export default {
    portHttp: 3000,
    portHttps: 3001,
    portWS: 3010,
    portWSS: 3011,
    genProxyExportKeys: [
        "initPlugin",
        "urlHandlerInit",
        "proxyXHRAndFetch",
        "proxyDocmentHeadAppendChild",
        "removeScriptElement",
        "proxyWebSocket"
    ],
    times: {
        pluginStagesUpdateStep: 10000
    },
    proxy: "",
    switch: {
        debugMode: true,
        cryptoDataEnable: false,
        openAddAppStack: true,
        /** 是否关闭 im系统 */
        closeIM: true,
        /** 是否关闭 upload系统 */
        closeUploads: true,
        /** 是否开启自动跨域 */
        autoCors: false,
        cors: false,
        autoComplete: false,
        /** 扫描web的时候仅扫描域名文件夹 */
        scanWebOnlyDoamin: true
    },
    appendButsData: [
        {
            avatarText: "im",
            text: "管理连接",
            tooltip: "给指定的连接发送消息",
            fun: "this.openPage('/im/index.html')"
        },
        {
            avatarText: "/web",
            text: "打开web目录",
            tooltip: "尝试使用文件管理器打开web目录（主要用于windows系统）",
            fun: "this.openPage('/system/openWeb')"
        }
    ],
    otherWebPath: [
        "{/ldDirName/}/lazier334",
        ...serverDir
    ],
    pluginDirs: [
        "{/ldDirName/}/plugins",
        "{/ldDirName/}/lazier334",
        ...serverDir
    ],
    copyright: {
        icp: "" // 隐藏备案信息
    },
    /** koaRouter-3-scanHar.js 插件的配置 */
    scanHar: {
        /** 删除指定的响应头 */
        removeResponseHeaderList: [
            "content-encoding"
        ]
    },
}