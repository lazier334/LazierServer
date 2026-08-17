// 重新导出 plugins/types 的所有运行时值
export * from '../../plugins/types/index.js';

// 导入 createPlugin（来自同一路径）
import { createPlugin } from '../../plugins/types/index.js';

// 快捷常量都指向同一个 createPlugin
export const createSelectFileByDomains = createPlugin;
export const createSend = createPlugin;
export const createKoaRouterLazier = createPlugin;