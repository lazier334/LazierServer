// 挂载全局对象
if (!process.G) process.G = {
    /**
     * 获取当前文件的储存空间
     * @param {string} filepath [import.meta.filename] 可以直接传路径
     * @returns {object}
     */
    getNowFileStorage(filepath) {
        let fn = filepath.split('/').pop().split('\\').pop();
        if (typeof process.G[fn] != 'object' || process.G[fn] == null) process.G[fn] = {};
        return process.G[fn];
    }
};