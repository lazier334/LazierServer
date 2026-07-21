// 重新导出 plugins/types 的所有类型（包括 createPlugin 等）
export * from '../../plugins/types/index';

// 导入本地的类型定义
import type { SelectFileByDomainsFunction } from './selectFileByDomains';
import type { SendFunction } from './send';

// 从 plugins/types 导入 createPlugin 的类型（用于类型断言）
// 由于我们已经 export * from，可以直接使用 typeof import('../../plugins/types/index').createPlugin
type CreatePluginType = typeof import('../../plugins/types/index').createPlugin;

/**
 * 快捷创建函数，限定为 SelectFileByDomainsFunction
 */
export declare const createSelectFileByDomains: (fun: SelectFileByDomainsFunction) => SelectFileByDomainsFunction;

/**
 * 快捷创建函数，限定为 SendFunction
 */
export declare const createSend: (fun: SendFunction) => SendFunction;