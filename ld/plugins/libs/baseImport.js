import fs from 'fs';
import path from 'path';
import app from 'koa';

/** @type {import('../../../src/libs/config.js')} */
const { config } = process.G;

export {
    fs, path, config, app, importSysModule
}


async function importSysModule(mod) {
    return await import(path.join(config.configDirPath, mod));
}