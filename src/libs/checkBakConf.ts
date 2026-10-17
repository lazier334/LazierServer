import fs from 'fs';
import path from 'path';

/**
 * 恢复备份的配置文件，仅在存在备份配置，且没有logs文件夹的时候尝试恢复
 */

// 项目目录
const projectDir = path.join(import.meta.dirname, '../../');
const configName = 'conf.js'
const lc = {
    confPath: path.join(path.join(import.meta.dirname, '../'), configName),
    tempConfigPath: path.join(projectDir.replace(/[\\/]+$/, '') + '.bak', configName),
    updateLogPath: path.join(import.meta.dirname, 'update.log'),
};

if (fs.existsSync(lc.tempConfigPath) && fs.statSync(lc.tempConfigPath).isFile()) {
    console.warn('正在恢复备份的配置文件, 恢复成功后会清理备份文件');
    fs.copyFileSync(lc.tempConfigPath, lc.confPath);
    if (fs.readFileSync(lc.confPath, 'utf8') == fs.readFileSync(lc.tempConfigPath, 'utf8')) {
        console.warn('系统配置已恢复, 正在清理备份的配置文件');
        fs.rmSync(lc.tempConfigPath);
        try {
            fs.rmdirSync(path.dirname(lc.tempConfigPath));
        } catch (err) {
            console.warn('清理备份配置所在目录失败! 可能存在其他文件, 可手动进行删除, 目录为:', path.dirname(lc.tempConfigPath));
            console.log('具体错误信息为:', err);
        }
    } else {
        console.error('恢复备份配置失败! 请手动将备份配置文件移动并覆盖到当前系统配置文件!');
        console.log('备份配置的文件路径:', lc.tempConfigPath);
        console.log('系统配置的文件路径:', lc.confPath);
    }
}
