
import { createIndexData } from 'lazierserver/types';

/**
 * 列表插件的demo
 */
export default createIndexData(async function indexDataDemo(arr) {
    arr.push(...[
        {
            icon: "",
            name: "模版列表",
            mark: "用于查看模版",
            urls: [
                {
                    text: "打开",
                    url: "/template.html"
                }
            ],
        },
    ]);
    return arr;
})