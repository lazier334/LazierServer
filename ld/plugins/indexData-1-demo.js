/**
 * 列表插件的demo
 */
export default async function (arr) {
    arr.push(...[
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
        }
    ]);
    return arr;
}