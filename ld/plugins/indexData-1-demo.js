import { createIndexData } from './types/index.js';
// 全局安装后请使用这种方式引入提示信息
// import { createIndexData } from 'lazierserver/types';

/**
 * 列表插件的demo
 */
export default createIndexData(async function indexDataDemo(arr) {
    if (false) arr.push(...[
        {
            icon: "",
            name: "项目名称",
            mark: "备注信息",
            urls: [
                {
                    text: "按钮1",
                    url: "/index#跳转地址"
                }
            ],
        },
    ]);
    return arr;
})