import { spawn } from 'child_process';

export { runCmdAsync, restartSystem }

/**
 * 重新启动系统
 * 运行 startCmd 命令启动系统
 * @param {'../../bin/start.bat'} startCmd 启动命令
 */
function restartSystem() {
    runCmdAsync(process.argv[0], process.argv.slice(1)).then(() => process.exit(0))
}

/**
 * 异步开启子线程运行命令
 * @param command 命令
 * @param args 参数
 * @param no1sResolve 不进行1秒 resolve
 * @param resolve 默认情况下运行1秒后会执行该回调，code==0则为正常运行结束，结束1秒后才运行这个回调
 */
function runCmdAsync(command, args, no1sResolve = false) {
    return new Promise((resolve, reject) => {
        console.log('运行命令:', command, args);
        const child = spawn(command, args, {
            stdio: 'inherit',   // 将输出重定向到当前控制台
            shell: true,        // windows需要使用 shell 执行命令
        });
        // clsoe事件需要等待启动的程序运行结束，所以一般不会走这里面的代码
        child.on('close', (code) => setTimeout(() => resolve(code), 1000));
        // 确保子进程启动后再退出当前进程，不能立刻退出
        if (!no1sResolve) child.on('spawn', () => setTimeout(resolve, 1000));
    });
}