/**
 * 同步defConfig.js中的版本号到package.json、package-lock.json中
 */
const fs = require('fs');
const path = require('path');
const config = require('../src/libs/configDef.ts');
const packageJson = require('../package.json');
const packageLockJson = require('../package-lock.json');
const cmdTempFile = 'temp-push-action-cmd.log';
const LICENSE_FilePath = '../LICENSE';

let version, description, versionAll = config.default.version;
for (const k in versionAll) {
    version = k;
    description = versionAll[k].trim();
    break;
}
// 版本
if (version) {
    packageJson.version = version;
    packageLockJson.version = version;
    packageLockJson.packages[''].version = version;
    console.log(`version: ${version}`);
} else console.log(`版本未更新 version: ${version}`);
// 详情
if (description) {
    packageJson.description = description;
    console.log(`description: ${description}`);
} else console.log(`说明未更新 description: ${description}`);
// 版权
if (fs.existsSync(LICENSE_FilePath) && fs.statSync(LICENSE_FilePath).isFile()) {
    let LICENSE = fs.readFileSync(LICENSE_FilePath, { encoding: 'utf8' });
    packageJson.license = LICENSE;
    packageLockJson.packages[""].license = LICENSE;
}

fs.writeFileSync('../package.json', JSON.stringify(packageJson, null, 2));
fs.writeFileSync('../package-lock.json', JSON.stringify(packageLockJson, null, 2));

console.log(`package.json 和 package-lock.json 更新版本完成!`);
GenSubmitCmd(packageJson);

/**
 * 生成提交的指令，该指令用于推送到 github 并触发自动化构建
 * @param {packageJson} pkg 
 */
function GenSubmitCmd(pkg) {
    let cmdPath = path.resolve(cmdTempFile.replace('.log', `-v.${version}.log`));
    let cmds = [];
    cmds.push('# 需要手动运行命令进行创建并提交tag标签, 如果有换行等特殊符号, 需要手动处理');
    cmds.push(`# 创建tag标签\ngit tag -a 'v${pkg.version.split('(').shift()}' -m '\nv${pkg.version + '\n' + pkg.description}'`);
    cmds.push(`# 推送tag标签\ngit push origin 'v${pkg.version.split('(').shift()}'`);
    // 通过 packageJson 生成指令列表并写到一个临时文件中
    fs.writeFileSync(cmdPath, cmds.join('\n\n'));
    console.log('\n');
    console.log('命令已生成完成，命令所在临时文件路径:', cmdPath);
    console.log('命令内容:', cmds.join('\n\n'));
    console.log('\n');
}