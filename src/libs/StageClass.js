/**
 * 阶段类
 */
export class Stage {
    /** 阶段名称 */
    stage;
    /** 更新时间 */
    updateTime;
    /** 插件列表 */
    data = [];
    /**
     * 创建阶段对象
     * @param {string} stage - 阶段名称
     */
    constructor(stage) {
        this.stage = stage;          // 阶段标识
        this.updateTime = Date.now(); // 初始化时间戳
    }

    /** 
     * 使用函数，当返回 `{end:true, result:any}` 时停止后续执行并返回 `result` 数据
     * @returns {any}
     */
    async use(...args) {
        if (this.data.length < 1) return console.warn(this.stage + ' 阶段的插件列表为空');
        for (const handle of this.data) {
            const re = await handle(...args);
            if (re?.end) {
                return re.result;
            }
        }
    }
};

export default Stage;