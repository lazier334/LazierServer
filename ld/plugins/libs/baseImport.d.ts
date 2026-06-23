export const config: any;
export const fs: typeof import('fs');
export const path: typeof import('path');
export function getUtilsModule(): Promise<any>;
export function getConfigModule(): any;
export function importSysModule(mod: string): Promise<any>;
export function getPluginsModule(): Promise<any>;
