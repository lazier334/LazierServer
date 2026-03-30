import { createKoaRouter } from './types/index.ts';
import { fs, path, config, getPluginsModule, getUtilsModule } from './libs/baseImport.js';

const lc = {
    apiBaseName: '/rpc'
};
/**
 * 储存
 * @type {{
 *  Rpcs: {
 *      servers: {
 *          [host: string]: Server[]
 *      },
 *      tasks: {
 *          [host: string]: Task[]
 *      },
 *      taskNumber: 0
 *  }
 * }}
 */
const storage = config.getNowFileStorage(import.meta.filename);
// 初始化存储
if (!storage.Rpcs) storage.Rpcs = {
    servers: {},
    tasks: {},
    taskNumber: 0
};

/**
 * 任务类
 */
class Task {
    /** 域名 */
    host = 'example.com';
    /** 任务携带的数据 */
    data = {};
    /** 任务执行结束的数据 */
    result = {};
    /** 任务 id */
    taskId = 0;
    /** 任务超时时间（ms） */
    timeout = 60 * 1000;
    /** 任务是否完成 */
    finish = false;
    /** 任务分配时间（被服务器获取的时间） */
    runTime = 0;

    constructor(data) {
        // 校验 host
        if (!data?.host) {
            throw new Error('任务创建失败：host 不能为空');
        }
        this.data = data;
        this.host = data.host;
        this.timeout = data.timeout ?? 60 * 1000;
        this.finish = data.finish ?? false;

        // 自增任务 ID
        storage.Rpcs.taskNumber++;
        this.taskId = storage.Rpcs.taskNumber;
    }

    /**
     * 获取任务，设置分配时间
     * @returns {this}
     */
    getTask() {
        this.runTime = Date.now();
        return this;
    }

    /**
     * 结束任务
     * @param {number} verifyRunTime 校验分配时间
     * @param {object} result 任务结果
     * @returns {this}
     */
    finishTask(verifyRunTime, result) {
        if (this.runTime != verifyRunTime) {
            throw new Error('提交失败：任务分配时间校验失败');
        }
        if (this.finish) {
            throw new Error('提交失败：任务已完成');
        }
        if (this.runTime + this.timeout < Date.now()) {
            this.runTime = 0;
            throw new Error('提交失败：任务已超时');
        }
        this.result = result;
        this.finish = true;
        return this;
    }

    /**
     * 检查任务是否空闲
     * @returns {boolean}
     */
    isIdle() {
        if (0 < this.runTime) {
            // 清理任务超时
            if (this.runTime + this.timeout < Date.now()) {
                this.runTime = 0;
            }
        }
        return this.runTime == 0;
    }
}

/**
 * 执行任务的服务器类
 */
class Server {
    /** @type {import('koa').DefaultContext} */
    ctx;
    runTime = 0;

    constructor(ctx) {
        this.ctx = ctx
    }

    /**
     * 获取服务器，会自动设置运行时间
     * @returns {this}
     */
    getTask() {
        this.runTime = Date.now();
        return this;
    }
    /**
     * 释放服务器
     * @returns {this}
     */
    release() {
        this.runTime = -1;
        this.ctx = null;
        return this;
    }

    /**
     * 检查服务器是否空闲
     * @returns {boolean}
     */
    isIdle() {
        return this.runTime == 0;
    }
}

/**
 * 动态路由 Rpc 插件，顺序为： 插件API > 文件API > HarAPI > 系统API > vue的历史模式（或类似框架） > external
 */
export default createKoaRouter(function koaRouterRpc(router) {

    router.all('服务器: 注册 rpc', lc.apiBaseName + '/register', async (ctx, next) => {
        // 拿到数据内容
        const params = mergeParams(ctx);
        const host = params.host;
        if (host) {
            if (!storage.Rpcs.servers[host]) storage.Rpcs.servers[host] = [];
            const servers = storage.Rpcs.servers[host];
            servers.push(new Server(ctx));
            scanTask(host);
        } else {
            ctx.body = result(null, 'host无效,注册失败!', 500);
        }
    });

    router.all('服务器: 提交任务', lc.apiBaseName + '/submit', async (ctx, next) => {
        // 拿到数据内容
        const params = mergeParams(ctx);
        try {
            const task = storage.Rpcs.tasks[params.host][params.taskId];
            task.finishTask(params.verifyRunTime, params.result);
        } catch (error) {
            ctx.body = result({
                message: error.message,
                stack: error.stack
            }, '提交失败!', 500);
        }
    });

    router.all('客户端: 添加任务', lc.apiBaseName + '/addTask', async (ctx, next) => {
        const host = mergeParams(ctx).host;
        if (!Array.isArray(storage.Rpcs.tasks[host])) storage.Rpcs.tasks[host] = [];
        const taskList = storage.Rpcs.tasks[host];
        const task = new Task(ctx.response.body);
        // 添加任务，并返回生成的id
        taskList.push(task);
        ctx.body = result(task);
        scanTask(host);
    });

    router.all('客户端: 等待任务完成', lc.apiBaseName + '/waitTask', async (ctx, next) => {
        const data = mergeParams(ctx);
        const host = data.host;
        const taskId = data.taskId;
        const task = storage.Rpcs.tasks[host][taskId];
        if (task.finish) {
            // 扫描到任务已经处理完成时删除任务
            delete storage.Rpcs.tasks[host][taskId];
        }
        ctx.body = result(task);
    });

    router.all('获取所有 rpc 列表', lc.apiBaseName + '/info', async (ctx, next) => {
        ctx.body = result(storage.Rpcs);
    });

    return router
})

/**
 * 扫描任务
 * @param {[string] | string} hosts host列表
 */
function scanTask(hosts) {
    if (typeof hosts == 'string') hosts = [hosts];
    if (!Array.isArray(hosts)) hosts = Object.keys(storage.Rpcs.tasks);
    hosts.forEach(host => {
        try {
            const tasks = storage.Rpcs.tasks[host] || [];
            const servers = storage.Rpcs.servers[host] || [];
            servers = servers.filter(s => s.isIdle());
            tasks = tasks.filter(t => t.isIdle());

            for (const task of tasks) {
                // 检查是否存在服务器
                if (!sendTaskToServer(servers, task)) {
                    // 已无服务器可运行
                    break;
                }
            }
        } catch (error) {
            console.debug(host, '任务执行失败', error)
        }
    })
}

/**
 * 将任务发送给服务器
 * @param {[Server]} servers 服务器列表
 * @param {Task} task 任务
 * @returns {boolean} 是否成功发送
 */
function sendTaskToServer(servers, task) {
    for (const server of servers) {
        if (server.isIdle()) {
            // 设置服务器，并将任务数据发送给服务器进行处理
            server.getTask();
            task.getTask();
            server.ctx.body = task;
            server.release();
            return true;
        }
    }
}

/**
 * 合并参数
 * @param {import('koa').DefaultContext} ctx 
 * @returns {object} 合并后的参数
 */
function mergeParams(ctx) {
    return { ...(ctx.request.query || {}), ...(ctx.request.body || {}) }
}

/**
 * 响应数据
 * @param {any} data 
 * @param {string} msg 成功
 * @param {number} code 200
 * @returns 
 */
function result(data, msg = '成功', code = 200) {
    return { code, msg, data }
}