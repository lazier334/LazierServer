import { fs, path, config } from './libs/baseImport.js';

const lc = {
    open: true,
    targetPath: path.join(config.rootDir, 'utils')
}

/**
 * 工具的列表插件
 */
export default async function indexDataDemo(arr) {
    let re = [];

    if (lc.open) {
        try {
            re = fs.readdirSync(lc.targetPath)
                .map(p => path.join(lc.targetPath, p))
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
                }))
        } catch (err) {
            console.error('加载工具列表错误')
        }
    }

    arr.push(...re);
    return arr;
}