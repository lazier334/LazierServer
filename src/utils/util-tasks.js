
const TaskType = {
    /** 运行的函数，参数是当前的任务 */
    fun: async (task) => task.end = true,
    /** 时间间隔 */
    step: 1000,
    /** [null] 运行时生成的定时器id */
    taskId: null,
    /** [false] 如果不为真那么一直循环执行 */
    end: false,
}
/**
 * 任务工具，可以设定任务来处理事件，例如定时清理缓存、清理过期的数据
 */
const Tasks = {
    /**
     * @type {[TaskType]}
     */
    tasks: [
        // NOTE 这里可以添加固定任务
    ],
    running: false,
    /** 启动所有定时器任务 */
    start() {
        if (!this.running) {
            this.tasks.forEach(task => this.runTask(task))
        }
        this.running = true;
    },
    /** 运行任务，如果任务已运行(存在task.taskId)，那么将在清除后运行 @param {TaskType} task */
    runTask(task) {
        if (task.taskId) clearInterval(task.taskId);
        task.taskId = setInterval(async () => {
            await task.fun(task);
            if (task.end) clearInterval(task.taskId);
        }, task.step);
    }
}

module.exports = {
    Tasks
};
