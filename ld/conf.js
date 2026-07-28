import fs from 'fs';
import path from 'path';

// 服务器资源目录，plugins 和 web 共同所在的目录
var serverDir = [];
try {
    serverDir = JSON.parse(fs.readFileSync(path.join(import.meta.dirname, 'serverDir.json'), 'utf8'));
    // 在此处对文件夹路径做定位与排序
    serverDir = serverDir.map((dir) => path.resolve(import.meta.dirname, dir)).sort();
} catch { };

/**
 * 这里用于查询配置项，可以在此处查询原配置项内容。
 * 不把 type 放到下面的导出是因为那样会导致自定义的配置无法正常提示信息。
 * @type {import('../dist/libs/configDef.js').Config}  
 */
const testType = {
};

/**
 * 用户自定义配置，可以额外增加自定义配置项  
 * 只有这里的配置信息会被导出  
 * 上面是便捷查询、测试使用，实际变量未使用
 */
export default {
    portHttp: 3000,
    portHttps: 3001,
    portWS: 3010,
    portWSS: 3011,
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
            text: "打开运行目录",
            tooltip: "尝试使用文件管理器打开运行目录（主要用于windows系统）",
            fun: "this.openPage('/system/openCwd')"
        },
        {
            avatarText: "/ld",
            text: "打开数据目录",
            tooltip: "尝试使用文件管理器打开数据目录（主要用于windows系统）",
            fun: `this.openPage('/system/openCwd?filepath=${import.meta.dirname.replaceAll("\\", "/")}')`
        },
        {
            avatarText: 'tus',
            text: '文件上传',
            tooltip: '上传文件到服务器',
            fun: `this.openPage('/uploads/index.html')`
        },
        {
            avatarText: 'stack',
            text: '接口分析',
            tooltip: '分析接口的堆栈信息',
            fun: `this.openPage('/stack/index.html')`
        },
        {
            avatarText: 'plgs',
            text: '插件仓库',
            tooltip: '在线管理插件列表',
            fun: `this.openPage('/plugin-mgmt/index.html')`
        },
        {
            avatarText: 'files',
            text: 'web文件列表',
            tooltip: '查看所有的web静态资源文件列表',
            fun: `this.openPage('/web文件列表.html')`
        },
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