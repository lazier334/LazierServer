import { exec } from 'child_process';
import readline from 'readline';
import iconv from 'iconv-lite';

// 自动检测系统编码
const encoding = process.platform === 'win32' ? 'gbk' : 'utf8';

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

export { runCmd, waitForInput };

// 增强解码函数
function safeDecode(buffer, primaryEncoding = encoding) {
    try {
        if (typeof buffer === 'string' && buffer == '') return buffer;
        return buffer && buffer.length > 0 ?
            iconv.decode(buffer, primaryEncoding).trim() : '';
    } catch (e) {
        try {
            // 尝试用UTF-8解码
            return buffer.toString('utf8').trim();
        } catch (e2) {
            // 最终保底方案
            return buffer.toString('binary').trim();
        }
    }
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
 * @returns {Promise<{ stdout: string, stderr: string }>} 执行结果
 */
async function runCmd(cmd = 'echo hello world!', moreLog = true) {
    return new Promise((resolve, reject) => {
        exec(cmd, {
            encoding: 'buffer',  // 关键：返回原始二进制数据
            windowsHide: true,   // 禁止Windows弹出额外窗口
            maxBuffer: 1024 * 1024 * 10 // 解决大输出时的缓冲区限制
        }, (error, stdout, stderr) => {
            try {
                // 转换输出编码
                stdout = safeDecode(stdout);
                stderr = safeDecode(stderr);
                if (error?.message) error.message = stderr || safeDecode(error.message);
            } catch (err) {
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