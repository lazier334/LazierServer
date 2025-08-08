import { fs, path } from '../libs/baseImport.js';
import fsExtra from 'fs-extra';
import xxhashWasm from 'xxhash-wasm';
const xxhash = await xxhashWasm();

export {
    xxhash,
    getAbsolutePaths,
    calculateFileHash,
    compareDirectories,
    getRelativeFilePaths,
}

/**
 * 获取文件的绝对路径
 * @param {string|string[]} filePath 文件路径
 * @returns {string} 绝对路径
 */
function getAbsolutePaths(filePath) {
    const normalized = path.normalize(filePath);
    return path.resolve(normalized);
}


/**
 * 检测两个目录的文件差异
 * @param {string} fromDir - 来源目录路径
 * @param {string} toDir - 目标目录路径
 * @param {boolean} [checkContent=false] - 是否检测文件内容差异
 * @returns {Promise<{
 *   fromFiles: string[],
 *   toFiles: string[],
 *   conflicts: string[]
 * }>} 包含三个文件路径数组的对象
 */
async function compareDirectories(fromDir, toDir, checkContent = false) {
    // 获取两个目录下的所有文件相对路径（POSIX格式）
    const [fromFilePaths, toFilePaths] = await Promise.all([
        getRelativeFilePaths(fromDir),
        getRelativeFilePaths(toDir)
    ]);

    // 创建文件路径集合方便查找
    const fromSet = new Set(fromFilePaths);
    const toSet = new Set(toFilePaths);

    // 计算差异部分
    // const fromFiles = [...fromSet].filter(file => !toSet.has(file));
    // const toFiles = [...toSet].filter(file => !fromSet.has(file));
    const fromFiles = [...fromSet];
    const toFiles = [...toSet];
    const commonFiles = [...fromSet].filter(file => toSet.has(file));
    // 处理冲突文件检测
    let conflicts = [];

    if (checkContent && commonFiles.length > 0) {
        // 使用高效的xxhash算法比较文件内容
        const hashPromises = [];

        for (const file of commonFiles) {
            const fromPath = path.join(fromDir, file);
            const toPath = path.join(toDir, file);

            // 并行计算文件哈希
            hashPromises.push(
                Promise.all([
                    calculateFileHash(xxhash.create64(), fromPath),
                    calculateFileHash(xxhash.create64(), toPath)
                ]).then(([hash1, hash2]) => ({
                    file,
                    conflict: hash1 !== hash2
                }))
            );
        }

        // 等待所有哈希计算完成
        const results = await Promise.all(hashPromises);
        conflicts = results.filter(({ conflict }) => conflict).map(({ file }) => file);
    } else {
        // 不检查内容时所有共同文件都算作冲突
        conflicts = commonFiles;
    }

    return {
        fromFiles,  // 仅在来源目录存在的文件
        toFiles,    // 仅在目标目录存在的文件
        conflicts    // 冲突文件（可能路径相同但内容不同）
    };
}


/**
 * 流式处理文件哈希（支持大文件）
 * @param {XXHash<bigint>} hasher - xxhash的工厂函数
 * @param {string} filePath - 文件路径
 */
function calculateFileHash(hasher, filePath) {
    return new Promise((resolve, reject) => {
        const stream = fs.createReadStream(filePath);
        stream.on('data', (chunk) => {
            hasher.update(chunk);
        });
        stream.on('end', () => {
            resolve(hasher.digest());
        });
        stream.on('error', reject);
    });
}

/**
 * 递归获取目录所有文件的相对路径（POSIX格式）
 * @private
 */
async function getRelativeFilePaths(dir) {
    const files = [];

    async function scan(currentDir) {
        const entries = await fsExtra.readdir(currentDir, { withFileTypes: true });

        for (const entry of entries) {
            const fullPath = path.join(currentDir, entry.name);

            if (entry.isDirectory()) {
                await scan(fullPath);
            } else if (entry.isFile()) {
                // 转换为POSIX风格的相对路径
                const relative = path.relative(dir, fullPath);
                files.push(relative.split(path.sep).join('/'));
            }
        }
    }

    await scan(dir);
    return files;
}