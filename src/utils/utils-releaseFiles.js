const fs = require("fs");
const path = require("path");
const ls = {
    releaseDirs: [
        'src',
    ],
    releaseFiles: [
        'banner.txt',
        'package-linux.json',
        'README.md',
        'README.LS.md',
        'LICENSE',
    ],
}

module.exports = {
    releaseDirs,
    /** 释放默认文件目录到当前的运行目录 */
    releaseDefault: () => {
        releaseDirs(path.join(__dirname, '..'), process.cwd(), ls.releaseDirs);
        releaseFiles(path.join(__dirname, '..'), process.cwd(), ls.releaseFiles);
    }
}

/**
 * 释放指定文件夹
 * @param {string} fromPath 
 * @param {string} toPath 
 * @param {[string]} dirs 
 */
function releaseDirs(fromPath, toPath, dirs) {
    dirs.forEach(dir => {
        let toDirPath = path.join(toPath, dir);
        if (!fs.existsSync(toDirPath)) {
            let fromDirPath = path.join(fromPath, dir);
            fs.mkdirSync(toDirPath, { recursive: true });
            console.log("释放目录:", toDirPath);
            copyDirectorySync(fromDirPath, toDirPath)
        }
    })
}

/**
 * 释放指定文件
 * @param {string} fromPath 
 * @param {string} toPath 
 * @param {[string]} dirs 
 */
function releaseFiles(fromPath, toPath, files) {
    files.forEach(file => {
        let toFilePath = path.join(toPath, file);
        if (!fs.existsSync(toFilePath)) {
            let fromFilePath = path.join(fromPath, file);
            if (!fs.existsSync(toPath)) fs.mkdirSync(toPath, { recursive: true });
            console.log("释放文件:", toFilePath);
            fs.copyFileSync(fromFilePath, toFilePath);
        }
    })
}

/**
 * 递归复制目录（包含子目录和文件）
 * @param {string} srcPath - 源目录路径
 * @param {string} destPath - 目标目录路径
 */
function copyDirectorySync(srcPath, destPath) {
    // 确保目标目录存在
    if (!fs.existsSync(destPath)) {
        fs.mkdirSync(destPath, { recursive: true });
    }
    // 读取源目录内容
    const entries = fs.readdirSync(srcPath, { withFileTypes: true });
    for (const entry of entries) {
        const srcFile = path.join(srcPath, entry.name);
        const destFile = path.join(destPath, entry.name);

        if (entry.isDirectory()) {
            // 递归复制子目录
            copyDirectorySync(srcFile, destFile);
        } else {
            // 复制单个文件
            fs.copyFileSync(srcFile, destFile);
        }
    }
}