/**
 * 这个模块必须要放到 lib 文件夹中，并且在外面运行，否则无法使用
 */
const config = require('./config.js');
const http = require('http');
const { spawn } = require('child_process');

const SERVER_WAIT_RESTART_URL = `http://localhost:${config['port-http']}/system/waitrestart`; // 服务器地址
const TIMEOUT = 30000; // 30 秒超时
const INTERVAL = 1000; // 检测间隔 1 秒

function checkServerAlive() {
    return new Promise((resolve) => {
        // 请求成功，服务器仍在运行
        const req = http.get(SERVER_WAIT_RESTART_URL, (res) => resolve(true));
        // 请求失败，服务器已关闭
        req.on('error', (error) => resolve(false));
        // 请求超时，服务器已关闭
        req.setTimeout(INTERVAL, () => {
            req.destroy();
            resolve(false);
        });
    });
}

async function waitForServerShutdown() {
    const startTime = Date.now();

    while (Date.now() - startTime < TIMEOUT) {
        const isAlive = await checkServerAlive();
        if (!isAlive) {
            console.log('服务器已关闭。');
            return true;
        }
        console.log('服务器仍在运行。重试中...');
        await new Promise((resolve) => setTimeout(resolve, INTERVAL));
    }

    console.log(`超时：服务器在${TIMEOUT / 1000}秒内没有关闭。`);
    return false;
}

async function restart() {
    console.log('等待服务器关闭...');
    const isShutdown = await waitForServerShutdown();
    console.log((isShutdown ? '' : '超时强制启动，') + '使用npm start启动服务器...');

    const child = spawn('npm', ['start'], {
        stdio: 'inherit', // 将输出重定向到当前控制台
        shell: true, // 使用 shell 执行命令
    });
    // clsoe事件需要等待启动的程序运行结束，所以一般不会走这里面的代码
    child.on('close', (code) => {
        if (code === 0) {
            console.log('npm启动成功完成。');
        } else {
            console.error(`npm启动失败，错误代码 ${code}`);
        }
        setTimeout(() => process.exit(0), 1000);
    });

    // 确保子进程启动后再退出当前进程，不能立刻退出
    child.on('spawn', () => {
        console.log('子进程已启动。1秒后退出当前进程@sys-restart.js');
        setTimeout(() => process.exit(0), 1000);
    });
}

// 执行重启逻辑
restart();