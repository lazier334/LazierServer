/**
 * 阶段类
 */
export class Stage {
    /** 阶段名称 */
    stage: string;
    /** 更新时间 */
    updateTime: number;
    /** 插件列表 */
    data: any[] = [];

    /**
     * 创建阶段对象
     * @param stage - 阶段名称
     */
    constructor(stage: string) {
        this.stage = stage;
        this.updateTime = Date.now();
    }

    /** 
     * 使用函数，当返回 `{end:true, result:any}` 时停止后续执行并返回 `result` 数据
     * @returns {any} 默认返回第一个参数
     */
    async use(...args: any[]): Promise<any> {
        if (this.data.length < 1) {
            console.warn(this.stage + ' 阶段的插件列表为空');
        } else {
            for (const handle of this.data) {
                const re = await handle(...args);
                if (re?.end) {
                    return re.result;
                }
            }
        }
        return args[0];
    }
}
export default Stage;