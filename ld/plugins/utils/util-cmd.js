import { exec } from 'child_process';
import readline from 'readline';
import iconv from 'iconv-lite';

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

export default runCmd;
export { runCmd, waitForInput };

// 增强解码函数
function safeDecode(buffer, primaryEncoding = 'utf8') {
    if (!buffer || buffer.length === 0) return '';
    const copyBuffer = Buffer.from(buffer);

    // 优先尝试自定义类型
    try {
        return iconv.decode(buffer, primaryEncoding).trim();
    } catch (e) { /* 忽略继续尝试 */ }

    // 其次尝试iconv解析 utf8 编码
    if (primaryEncoding != 'utf8' && primaryEncoding != 'utf-8') {
        try {
            return iconv.decode(buffer, 'utf8').trim();
        } catch (e) { /* 忽略继续尝试 */ }
    }

    // 尝试iconv解析 gbk 编码
    if (primaryEncoding != 'gbk') {
        try {
            return iconv.decode(buffer, 'gbk').trim();
        } catch (e) { /* 忽略继续尝试 */ }
    }

    // 再次尝试使用js解析 utf8 编码
    if (primaryEncoding != 'utf8' && primaryEncoding != 'utf-8') {
        try {
            return buffer.toString('utf8').trim();
        } catch (e) { /* 忽略继续尝试 */ }
    }
    // 极端情况返回原始buffer
    return copyBuffer;
};
/**
 * ```js
 *  const cmd = require('./lib/util-cmd.js');
 *  cmd.runCmd('aa echo hello world!').then((result) => {
 *      console.log('命令执行结果:', result.stdout, result.stderr);
 *  }).catch((error) => {
 *      console.error('命令执行错误:', error);
 *  });
 * ```
 * @param {'echo hello world!'} cmd 命令
 * @param {boolean} moreLog 更多日志信息
 * @param {'gbk'|'utf8'} primaryEncoding 首选编码
 * @returns {Promise<{ stdout: string, stderr: string }>} 执行结果
 */
async function runCmd(cmd = 'echo hello world!', moreLog = true, primaryEncoding) {
    // 针对 Windows 强制临时启用控制台 UTF-8 环境
    const winCmd = process.platform === 'win32' ? `chcp 65001 >nul & ${cmd}` : cmd;
    return new Promise((resolve, reject) => {
        exec(winCmd, {
            encoding: 'buffer',  // 关键：返回原始二进制数据
            windowsHide: true,   // 禁止Windows弹出额外窗口
            maxBuffer: 1024 * 1024 * 10 // 解决大输出时的缓冲区限制
        }, (error, stdout, stderr) => {
            try {
                // 转换输出编码
                stdout = safeDecode(stdout, primaryEncoding);
                stderr = safeDecode(stderr, primaryEncoding);
                if (error?.message) error.message = stderr || safeDecode(error.message);
            } catch (err) {
                console.error('buffer数据', buffer);
                console.error("编码转换失败:", err);
            }

            if (error) {
                console.error(`命令执行失败: ${cmd}`);
                if (moreLog) console.error(`错误信息: ${error.message}`);
                reject(error);
                return;
            }
            if (moreLog && stdout) {
                console.info(stdout)
            }
            resolve({ stdout, stderr });
        });
    });
}

/**
 * 没注意，基本不用，这是用于接收从控制台输入命令的函数
 * @param {{
 *     map: Object.keys(functions),
 *     msg: ""
 * }} conf 
 * @param {*} functions 
 * @returns 
 * @deprecated 服务器运行基本用不上从控制台输入
 */
function waitForInput(conf, functions) {
    if (!conf || !conf.msg || !conf.map || !functions) {
        console.error("配置或功能映射无效，请检查传入的参数！");
        rl.close();
        return;
    }

    rl.question(`${conf.msg}\n请输入功能编号: `, async (answer) => {
        const name = conf.map[answer];
        if (!name) {
            console.log("无效的功能编号:", answer);
            return waitForInput(conf, functions);
        }

        console.log("运行:", name);
        const func = functions[name];
        if (func) {
            try {
                const result = await func();
                console.log("\n运行结果:", result);
            } catch (err) {
                console.error(`\n功能 "${name}" 运行异常:`, err);
            }
        } else {
            console.log("无效的功能编号:", answer);
        }

        waitForInput(conf, functions);
    });
}