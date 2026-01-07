/**
 * 同步defConfig.js中的版本号到package.json、package-lock.json中
 */
const fs = require('fs');
const path = require('path');
const config = require('../src/libs/configDef.ts');
const packageJson = require('../package.json');
const packageLockJson = require('../package-lock.json');

let version, description, versionAll = config.default.version;
for (const k in versionAll) {
    version = k;
    description = versionAll[k].trim();
    break;
}
if (version) {
    packageJson.version = version;
    packageLockJson.version = version;
    packageLockJson.packages[''].version = version;
    console.log(`version: ${version}`);
} else console.log(`版本未更新 version: ${version}`);
if (description) {
    packageJson.description = description;
    console.log(`description: ${description}`);
} else console.log(`说明未更新 description: ${description}`);

fs.writeFileSync('../package.json', JSON.stringify(packageJson, null, 2));
fs.writeFileSync('../package-lock.json', JSON.stringify(packageLockJson, null, 2));

console.log(`package.json 和 package-lock.json 更新版本完成!`);