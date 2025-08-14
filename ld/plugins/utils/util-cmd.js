import { spawn } from 'child_process';
import readline from 'readline';
import iconv from 'iconv-lite';

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

export default runCmd;
export { runCmd, waitForInput, runDetachedCmd };

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
 * @param {{ moreLog: true, primaryEncoding: 'gbk' | 'utf8', windowsHide: true}} options 更多配置
 *  - moreLog 更多日志信息
 *  - primaryEncoding 首选编码
 *  - windowsHide 隐藏windows的窗口
 * @returns {Promise<{ stdout: string, stderr: string }>} 执行结果
 */
async function runCmd(cmd = 'echo hello world!', options) {
    // 针对 Windows 强制临时启用控制台 UTF-8 环境
    const isWin = process.platform === 'win32';
    const {
        moreLog = true,
        primaryEncoding = isWin ? 'gbk' : 'utf8',
        windowsHide = true
    } = (typeof options == 'object' && options != null ? options : {});
    const winCmd = isWin ? `chcp 65001 >nul & ${cmd}` : cmd;
    const args = isWin ? ['/c', winCmd] : ['-c', cmd];
    const shell = isWin ? 'cmd.exe' : '/bin/sh';

    return new Promise((resolve, reject) => {
        const child = spawn(shell, args, {
            encoding: 'buffer',         // 关键：返回原始二进制数据
            windowsHide: windowsHide,   // 禁止Windows弹出额外窗口
            maxBuffer: 1024 * 1024 * 10 // 解决大输出时的缓冲区限制
        });

        let stdout = '';
        let stderr = '';

        // 实时输出 stdout
        child.stdout.on('data', (data) => {
            const decoded = safeDecode(data, primaryEncoding);
            if (moreLog) process.stdout.write(decoded); // 实时打印日志
            stdout += decoded;
        });

        // 实时输出 stderr
        child.stderr.on('data', (data) => {
            const decoded = safeDecode(data, primaryEncoding);
            if (moreLog) process.stderr.write(decoded); // 实时打印错误
            stderr += decoded;
        });

        child.on('close', (code) => {
            if (code !== 0) {
                const error = new Error(`Command failed with code ${code}`);
                error.stderr = stderr;
                reject(error);
            } else {
                resolve({ stdout, stderr });
            }
        });

        child.on('error', reject);
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

/**
 * 创建独立进程运行，需要手动设置环境，比如运行 cjs 需要传递 options = { NODE_OPTIONS: undefined }
 * @param {'ls'} command 命令
 * @param {[]} args 参数
 * @param {{...process.env}} options [{...process.env}] 默认使用当前程序的环境
 * @returns 
 */
function runDetachedCmd(command, args = [], options = { ...process.env }) {
    const isWin = process.platform === 'win32';
    const shell = isWin ? 'cmd.exe' : '/bin/sh';
    const shellArgs = isWin ? ['/c', command, ...args] : ['-c', command, ...args];

    const child = spawn(shell, shellArgs, {
        detached: true,
        stdio: 'ignore',
        windowsHide: false,
        ...options
    });

    child.unref();  // 解除父进程引用
    return child;   // 返回进程
}