#!/usr/bin/env node

/**
 * 脚本功能：
 * 1. 同步执行 `npm install -g lazierserver` 或 `npm install -g lazierserver@next` 并且把结果放到 update.log 日志中
 * 2. 重启系统 无论成败都使用之前的命令重启系统，之前的命令缓存到 状态 中，如果没有命令则不启动
 *
 * 使用方式：
 *   node script.js
 * 或者直接 ./uninstall.js 运行（如果使用 `chmod +x uninstall.js` 添加了执行权限）
 */
import fs from 'fs';
import path from 'path';
import { execSync, spawn } from 'child_process';

// 项目目录
const projectDir = path.join(import.meta.dirname, '../../');
const configName = 'conf.js'
// 需要检查并删除的文件夹（绝对路径或相对路径）
const foldersToClean = [projectDir];
const lc = {
    confPath: path.join(path.join(import.meta.dirname, '../'), configName),
    tempConfigPath: path.join(projectDir.replace(/[\\/]+$/, '') + '.bak', configName),
    updateLogPath: path.join(import.meta.dirname, 'update.log'),
};
console.log('projectDir:', projectDir)
console.log('lc:', lc)
var verTag = 'latest';
var runcode;
anyArgs();

function anyArgs() {
    const tagChar = '--tag=';
    const runChar = '--run=';
    const args = process.argv.slice(2);
    args.forEach(param => {
        if (param.startsWith(tagChar)) {
            // 处理 tag 命令
            if (param.replace(tagChar, '').trim() == 'next') {
                verTag = 'next';
            }
        } else if (param.startsWith(runChar)) {
            // 处理 run 命令
            param = param.replace(runChar, '').trim();
            runcode = {
                cmd: JSON.parse(Buffer.from(param, 'base64').toString('utf8')),
                time: new Date().toLocaleString()
            };
        }
    });
}

// 启动
main();

// 主流程
async function main() {

    console.log('=== 开始更新脚本 ===');
    // 1. 检测是否存在运行状态文件，如果存在则删除并等待3秒
    /** @type {{cmd: string[], time: number}} */
    let status = null;
    [
        path.join(projectDir, '/dist/libs/start.log'),
        path.join(projectDir, '/src/libs/start.log')
    ].forEach(p => {
        if (fs.existsSync(p)) {
            status = JSON.parse(fs.readFileSync(p, 'utf8'));
            fs.rmSync(p);
        }
    });
    // 如果有状态文件，则删除后等待3秒
    if (status) {
        console.log('等待正在运行的程序停止中...');
        await new Promise(r => setTimeout(r, 3000));
    }
    // 如果外部传递了参数，那么优先使用外部传递的参数进行启动
    if (runcode) {
        status = runcode;
    }


    if (backupConf()) {
        // 2. 更新全局包（同步等待完成）
        console.log('正在全局安装包 lazierserver ...');
        try {
            // 执行安装，输出打印到控制台
            const log = execSync('npm install -g lazierserver@' + verTag, { stdio: 'inherit' });
            console.log('安装命令执行完成:', log);
        } catch (error) {
            console.error('安装失败（可能原程序未停止或权限不足）');
        }
    } else console.warn('备份配置失败! 即将重启系统!')

    // 3. 重启系统
    if (status?.cmd) {
        // 使用新的独立进程启动命令
        console.log('=== 正在重启系统 ===');
        runCmd(status.cmd[0], status.cmd.slice(1));
    }

    console.log('更新脚本执行完毕\n\n');
}

/**
 * 备份配置到指定路径
 * @param {string} topath 备份配置的路径
 * @returns {boolean} 返回是否备份成功
 */
function backupConf(topath = lc.tempConfigPath) {
    const todir = path.dirname(topath);
    // 创建
    if (!fs.existsSync(todir)) fs.mkdirSync(todir, { recursive: true });
    fs.copyFileSync(lc.confPath, topath);
    if (fs.existsSync(topath) && fs.statSync(topath).isFile()) {
        if (fs.readFileSync(lc.confPath, 'utf8') == fs.readFileSync(topath, 'utf8')) {
            return true
        } else console.error('配置备份失败! 备份后的文件内容与原始配置不一致!')
    } else console.error('配置备份失败! 文件未成功备份!');
    return false
}
/**
 * 
 * @param {string} command 命令
 * @param {[string]} args 参数
 * @param {()=>{}} spawnCallback 子进程启动后1秒触发这里
 * @param {(code)=>{}} closeCallback code==0则为正常运行结束，结束1秒后才运行这个回调
 */
function runCmd(command, args, spawnCallback = () => { }, closeCallback = () => { }) {
    console.log('运行命令:', command, args);
    const child = spawn(command, args, {
        stdio: 'inherit',   // 将输出重定向到当前控制台
        shell: true,        // 使用 shell 执行命令
    });
    // clsoe事件需要等待启动的程序运行结束，所以一般不会走这里面的代码
    child.on('close', (code) => setTimeout(() => closeCallback(code), 1000));
    // 确保子进程启动后再退出当前进程，不能立刻退出
    child.on('spawn', () => setTimeout(spawnCallback, 1000));
}