// 聚合工具对象
// util 为单纯工具函数，utils 为聚合后的完整工具模块
import * as cmd from './util-cmd.js';
import * as auth from './util-auth.js';
import * as crypto from './util-crypto.js';
import * as router from './util-router.js';
import * as tasks from './util-tasks.js';

export * as cmd from './util-cmd.js';
export * as auth from './util-auth.js';
export * as crypto from './util-crypto.js';
export * as router from './util-router.js';
export * as tasks from './util-tasks.js';

// 合并所有工具对象
const utils = {
    ...cmd,
    ...auth,
    ...crypto,
    ...router,
    ...tasks
};

// 冲突检查（可选，根据需求保留）
const utilList = [cmd, auth, crypto, router, tasks];
utilList.forEach(obj => {
    Object.entries(obj).forEach(([k, v]) => {
        if (utils[k] && utils[k] !== v) {
            throw new Error(`工具函数 ${k} 已存在且定义不同，请手动处理冲突`);
        }
    })
});

export default utils; // ESM 默认导出