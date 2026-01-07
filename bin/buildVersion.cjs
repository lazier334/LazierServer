/**
 * 同步defConfig.js中的版本号到package.json、package-lock.json中
 */
const fs = require('fs');
const path = require('path');
const config = require('../src/libs/configDef.ts');
const packageJson = require('../package.json');
const packageLockJson = require('../package-lock.json');
const packageVersion = packageJson.version;
const cmdTempFile = 'temp-push-action-cmd.log';

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
if (version && packageVersion && version !== packageVersion) {
    GenSubmitCmd(packageJson);
}

/**
 * 生成提交的指令，该指令用于推送到 github 并触发自动化构建
 * @param {packageJson} pkg 
 */
function GenSubmitCmd(pkg) {
    let cmdPath = path.resolve(cmdTempFile);
    let cmds = [];
    cmds.push('# 需要手动运行命令进行创建并提交tag标签, 如果有换行等特殊符号, 需要手动处理');
    cmds.push(`# 创建tag标签\ngit tag -a ${pkg.version} -m "${pkg.description}"`);
    cmds.push(`# 推送tag标签\ngit push origin ${pkg.version}`);
    // 通过 packageJson 生成指令列表并写到一个临时文件中
    fs.writeFileSync(cmdPath, cmds.join('\n\n'));
    console.log('\n');
    console.log('命令已生成完成，命令所在临时文件路径:', cmdPath);
    console.log('命令内容:', cmds.join('\n\n'));
    console.log('\n');
}