import { createSystemStart } from 'lazierserver/types';

/**
 * 用于系统启动阶段进行操作
 */
export default createSystemStart(async function systemStartDemo({ fs, path, config, app }) {
    // 只在windows平台显示打开文件管理器按钮
    if (process.platform == 'win32') {
        config.butsData.push({
            avatarText: "/web",
            text: "打开运行目录",
            tooltip: "尝试使用文件管理器打开运行目录（主要用于windows系统）",
            fun: "this.openPage('/system/openCwd')"
        })
        config.butsData.push({
            avatarText: "/ld",
            text: "打开数据目录",
            tooltip: "尝试使用文件管理器打开数据目录（主要用于windows系统）",
            fun: `this.openPage('/system/openCwd?filepath=${import.meta.dirname.replaceAll("\\", "/")}')`
        })
    }

    // 控制 im 系统
    if (config.switch.closeIM) {
        // 添加排除插件的配置
        config.excludePlugins.push('lazier334/koaRouter-6-im.js');
        config.excludePlugins.push('lazier334/websocketApis-1-im.js');
    } else {
        // 添加按钮
        config.butsData.push({
            avatarText: "im",
            text: "管理连接",
            tooltip: "给指定的连接发送消息",
            fun: "this.openPage('/im/index.html')"
        });
    }

    // 控制 upload 系统
    if (config.switch.closeUploads) {
        config.excludePlugins.push('lazier334/koaRouter-5-uploads.js');
    } else {
        config.butsData.push({
            avatarText: 'tus',
            text: '文件上传',
            tooltip: '上传文件到服务器',
            fun: `this.openPage('/uploads/index.html')`
        });
    }
})