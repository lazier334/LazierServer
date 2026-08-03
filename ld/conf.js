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
 * @type {import('./plugins/libs/baseImport').LSConfig}  
 */
const testType = {
};


/**
 * 用户自定义配置，可以额外增加自定义配置项  
 * 只有这里的配置信息会被导出  
 * 上面是便捷查询、测试使用，实际变量未使用
 */
export const userConfig = {
    portHttp: 3000,
    portHttps: 3001,
    portWS: 3010,
    portWSS: 3011,
    times: {
        pluginStagesUpdateStep: 10000
    },
    proxy: "",
    excludePlugins: [
        /** 关闭 跨域、自动跨域 */
        'lazier334/koaPlugin-2-cors.js',
        'lazier334/koaPlugin-2.1-autoCors.js',
        /** 关闭简易的 rpc */
        'lazier334/koaRouter-7-rpc.js',
    ],
    switch: {
        debugMode: true,
        cryptoDataEnable: false,
        openAddAppStack: true,
        /** 是否关闭 im系统 */
        closeIM: true,
        /** 是否关闭 upload系统 */
        closeUploads: true,
        autoComplete: false,
        /** 扫描web的时候仅扫描域名文件夹 */
        scanWebOnlyDoamin: true
    },
    appendButsData: [
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
    template: {
        /** 网页模版 */
        'template.html': `
<!DOCTYPE html>
<html lang="zh-CN">
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Vue3 + NaiveUI 模板</title>
<link rel="stylesheet" href="./res/lazierserver-default.css">

<div id="app">
    <n-button type="primary">{{ message }}</n-button>
</div>

<script type="importmap">
{"imports": {"vue": "./res/vue.prod@3.5.32.mjs","naive": "./res/naiveui.prod@2.44.1.mjs"} }
</script>
<script type="module">
    import * as vue from 'vue';
    import * as naive from 'naive';
    const { createApp, ref } = vue;

    createApp({
        setup() {
            const message = ref('Hello Vue3 + NaiveUI');

            return { message }
        }
    }).use(naive).mount('#app');
</script>
`, 'koaRouter-2-editWebDemo.js': `
import { createKoaRouter } from 'lazierserver/types';

/**
 * koa 路由插件的demo
 */
export default createKoaRouter(function koaRouterDemo(router, T) {
    if (false) {
        // 以下将读取 demo.txt 文件改成读取 _demo.txt 文件。这样就能提前处理原始的 demo.txt 文件了
        // 如果是需要自定义响应内容，直接修改 ctx.body 不为 undefined 即可
        router.all('/demo.txt', async (ctx, next) => {
            /** @type {ctx & T} */
            const ectx = ctx;
            ectx.sendOptions.filename = '_' + ectx.sendOptions.filename;
            console.log(ectx.sendOptions.filename)
        });
    }
    return router
})
`, 'selectFileByDomains-1-demo.js': `
import { createSelectFileByDomains } from 'lazierserver/types';

/**
 * 多路径存在同一api时的选择算法插件的demo
 */
export default createSelectFileByDomains(function selectFileByDomainsDemo(domains, domainsMap, ctx) {
    // return { end: true, result: domains[0] }
})
`, 'send-demo.js': `
import { createSend } from 'lazierserver/types';

/**
 * 重定向api插件  
 * 选择具体的api  
 * 返回true则表示当前函数已响应数据
 */
export default createSend(async function sendRedirectApi(sendOptions) {
    const { ctx, filename, opts } = sendOptions;
    // 可以自定义处理 koaRouter-1.1-scanWeb.js 扫描到文件后统一在 send 前的处理
    // 和 editWebDemo 的区别是这个是全部都会走的，那个是针对性api处理
    // 当前，两种方式都可以写成对方的形式，或许以后会取消 send 插件
    if (false) {
        ctx.body = 'demo';
        return true;
    }
    return sendOptions;
})
`, 'systemStart-auth.js': `
import { createSystemStart } from 'lazierserver/types';
import { getUtilsModule } from './libs/baseImport.js';

/**
 * 修改权限验证函数  
 * 用于系统启动阶段进行操作
 */
export default createSystemStart(async function systemStartDemo({ fs, path, config, app }) {
    const utils = await getUtilsModule();
    utils.authorization.verify = () => ({
        "userId": 0,
        "status": "在线",
        "username": "admin",
        "password": "-",
        "lastUpdateTime": 1745751359079,
        "deadline": 4102358400000,
        "isAdmin": true,
        "superAdmin": true
    })
})
`
    },
};

if (false) {

}

export default userConfig;