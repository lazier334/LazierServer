const fs = require('fs');
const path = require('path');

// ========== 使用示例 ==========

// 配置项
const config = {
    includeFiles: true,      // 是否显示文件
    maxDepth: 0,             // 最大深度
    excludes: ['generateFileTree.js', 'tree.txt', 'generateFileTree.bat',
        '.git', '.DS_Store'],
    filter: (filePath, stats) => {
        // 示例：排除 .git 目录 和 .DS_Store 文件
        const basename = path.basename(filePath);
        if (config.excludes.includes(basename)) return false;
        return true;
    }
};

// 生成并打印树
const targetDir = __dirname;
const tree = generateFileTree(targetDir, config);
console.log(`📁 文件树 [目录: ${targetDir}]:\n`);
console.log(tree);
fs.writeFileSync('tree.txt', tree);

/**
 * 生成文件树
 * @param {string} dirPath 要遍历的目录路径
 * @param {Object} config 配置对象
 * @param {boolean} [config.includeFiles=true] 是否包含文件
 * @param {number} [config.maxDepth=Infinity] 最大递归深度
 * @param {Function} [config.filter] 自定义筛选函数 (filePath, stats) => boolean
 * @param {number} [currentDepth=0] 当前递归深度（内部使用）
 * @param {string} [prefix=''] 当前行的前缀（用于树状结构绘制，内部使用）
 * @returns {string} 树状结构字符串
 */
function generateFileTree(dirPath, config = {}, currentDepth = 0, prefix = '') {
    const {
        includeFiles = true,
        maxDepth = Infinity,
        filter = null,
    } = config;

    if (currentDepth > maxDepth) {
        return '';
    }

    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    const result = [];
    let fileIndex = 0;

    for (let i = 0; i < entries.length; i++) {
        const entry = entries[i];
        const fullPath = path.join(dirPath, entry.name);
        const stats = fs.statSync(fullPath);
        const isLast = i === entries.length - 1;

        // 应用自定义筛选器
        if (filter && !filter(fullPath, stats)) {
            continue;
        }

        // 是否包含文件
        if (!includeFiles && !stats.isDirectory()) {
            continue;
        }

        // 构造树状结构连接符号
        let connector = '';
        if (currentDepth > 0) {
            connector = isLast ? '└─ ' : '├─ ';
        }

        const entryPrefix = isLast ? '    ' : '│   ';
        const displayPrefix = prefix + connector;

        result.push(displayPrefix + entry.name);

        if (stats.isDirectory()) {
            const newPrefix = prefix + entryPrefix;
            const subtree = generateFileTree(
                fullPath,
                config,
                currentDepth + 1,
                newPrefix
            );
            if (subtree) {
                result.push(subtree);
            }
        }
    }

    return result.join('\n');
}
