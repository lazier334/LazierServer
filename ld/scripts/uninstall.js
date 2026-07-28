#!/usr/bin/env node

/**
 * 脚本功能：
 * 1. 同步执行 npm uninstall -g lazierserver
 * 2. 检查并强制删除指定的文件夹列表（残留目录）
 * 3. 再次检查并打印未能成功删除的文件夹
 *
 * 使用方式：
 *   node script.js
 * 或者直接 ./uninstall.js 运行（如果使用 `chmod +x uninstall.js` 添加了执行权限）
 */
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

// 项目目录
const projectDir = path.join(import.meta.dirname, '../');
// 需要检查并删除的文件夹（绝对路径或相对路径）
const foldersToClean = [projectDir];
// 启动
main();

// 主流程
async function main() {

    console.log('=== 开始执行清理脚本 ===');
    // 1. 检测是否存在运行状态文件，如果存在则删除并等待3秒
    let rm = false;
    [
        path.join(projectDir, '/dist/libs/start.log'),
        path.join(projectDir, '/src/libs/start.log')
    ].forEach(p => {
        if (fs.existsSync(p)) {
            fs.rmSync(p);
            rm = true;
        }
    });
    // 如果有状态文件，则删除后等待3秒
    if (rm) {
        console.log('等待正在运行的程序停止中...');
        await new Promise(r => setTimeout(r, 3000));
    }


    // 2. 卸载全局包（同步等待完成）
    console.log('正在卸载全局包 lazierserver ...');
    try {
        // 执行卸载，输出打印到控制台
        const log = execSync('npm uninstall -g lazierserver', { stdio: 'inherit' });
        console.log('卸载命令执行完成:', log);
    } catch (error) {
        console.error('卸载失败（可能包未安装或权限不足），继续尝试清理文件夹...');
    }

    // 3. 第一次检查并强制删除
    console.log('\n开始检查并删除残留文件夹...');
    for (const folder of foldersToClean) {
        const resolvedPath = path.resolve(folder);
        if (fs.existsSync(resolvedPath)) {
            console.log(`发现残留: ${resolvedPath}`);
            try {
                fs.rmSync(resolvedPath, { recursive: true, force: true });
                console.log(`已删除: ${resolvedPath}`);
                return true;
            } catch (error) {
                console.error(`删除失败: ${resolvedPath} - ${error.message}`);
                return false;
            }
        } else {
            console.log(`路径不存在，跳过: ${resolvedPath}`);
        }
    }

    // 4. 第二次检查，收集仍存在的文件夹
    console.log('\n再次检查残留情况...');
    const remaining = [];
    for (const folder of foldersToClean) {
        const resolvedPath = path.resolve(folder);
        if (fs.existsSync(resolvedPath)) {
            remaining.push(resolvedPath);
        }
    }

    // 5. 输出最终结果
    console.log('\n=== 清理结果 ===');
    if (remaining.length === 0) {
        console.log('✅ 所有指定的文件夹已成功清理！');
    } else {
        console.error('⚠️ 以下文件夹未能删除，请手动检查：');
        console.info(remaining);
        console.error('可能原因：权限不足、文件被占用或路径不正确');
    }

    console.log('脚本执行完毕');
}