export * from '../../plugins/types/index.ts';
import { createPlugin } from '../../plugins/types/index.ts';

import type { SelectFileByDomainsFunction } from './selectFileByDomains.ts';
import type { SendFunction } from './send.ts';

export const createSelectFileByDomains = createPlugin as (fun: SelectFileByDomainsFunction) => SelectFileByDomainsFunction;
export const createSend = createPlugin as (fun: SendFunction) => SendFunction;
