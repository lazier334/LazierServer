import { createIndexData } from './types/index.ts';
import { fs, path, config } from './libs/baseImport.js';

const lc = {
    open: true,
    targetPath: [
        path.join(config.rootDir, 'utils'),
        path.join(import.meta.dirname, '../web-lazier334/utils')
    ]
}

/**
 * 工具的列表插件
 */
export default createIndexData(async function indexDataDemo(arr) {
    let re = [];

    if (lc.open) {
        try {
            // 添加 whistle 相关
            const whistleProxyServer = '127.0.0.1:8899';
            re = re.concat([
                {
                    icon: "",
                    name: "系统代理",
                    mark: "网络 - 系统代理",
                    urls: [
                        {
                            text: "打开",
                            url: "/system/systemProxy?openApi=true&open=true&proxyServer=" + whistleProxyServer
                        },
                        {
                            text: "关闭",
                            url: "/system/systemProxy?openApi=true"
                        }
                    ],
                },
                {
                    icon: "",
                    name: "Whistle",
                    mark: '网络 - Whistle 选项 "Rules-*" 需搭配开启 "复制链接" 功能使用',
                    urls: [
                        {
                            text: "打开",
                            url: "/system/whistle?open=true&openApi=true"
                        },
                        {
                            text: "关闭",
                            url: "/system/whistle?openApi=true"
                        },
                        {
                            text: "测试",
                            url: `http://${whistleProxyServer}`
                        },
                        {
                            text: "Rules-外部代理",
                            url: "# * proxy://127.0.0.1:7890"
                        },
                        {
                            text: "Rules-抓取文件",
                            url: "# * resWrite://`D:/W2/${reqHeaders.host}/` excludeFilter://localhost  excludeFilter://*.bing.com"
                        },
                        {
                            text: "Rules-静态代理单个接口",
                            url: "# */s.js file://D:\W2\s.js"
                        },
                        {
                            text: "Rules-转发单个接口",
                            url: "# */shared/984721902a/index.json https://`localhost:3001${reqHeaders.pathname}`"
                        }
                    ],
                }
            ]);

            // 扫描网页工具（html文件）
            lc.targetPath.forEach(targetPath => {
                if (fs.existsSync(targetPath)) {
                    re = re.concat(fs.readdirSync(targetPath)
                        .map(p => path.join(targetPath, p))
                        .filter(p => fs.statSync(p).isFile())
                        .map(p => ({
                            icon: "",
                            name: path.basename(p),
                            mark: "工具 - " + path.basename(p),
                            urls: [
                                {
                                    text: "打开",
                                    url: "/" + path.basename(p)
                                }
                            ],
                        })));
                }
            });
        } catch (err) {
            console.error('加载工具列表错误', err)
        }
    }

    arr.push(...re);
    return arr;
})