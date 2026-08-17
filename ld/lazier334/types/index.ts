export * from '../../plugins/types/index.ts';
import { createPlugin } from '../../plugins/types/index.ts';

import createSelectFileByDomainsType from './selectFileByDomains.ts';
import createSendType from './send.ts';

export const createSelectFileByDomains = createPlugin as typeof createSelectFileByDomainsType;
export const createSend = createPlugin as typeof createSendType;