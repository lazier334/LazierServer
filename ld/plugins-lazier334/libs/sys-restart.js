import { spawn } from 'child_process';

export { runCmd, restartSystem }

/**
 * 重新启动系统
 * 运行 startCmd 命令启动系统
 * @param {'../../bin/start.bat'} startCmd 启动命令
 */
function restartSystem(startCmd) {
    runCmd(startCmd, [], () => process.exit(0))
}

/**
 * 
 * @param {string} command 命令
 * @param {[string]} args 参数
 * @param {()=>{}} spawnCallback 子进程启动后1秒触发这里
 * @param {(code)=>{}} closeCallback code==0则为正常运行结束，结束1秒后才运行这个回调
 */
function runCmd(command, args, spawnCallback = () => { }, closeCallback = () => { }) {
    const child = spawn(command, args, {
        stdio: 'inherit',   // 将输出重定向到当前控制台
        shell: true,        // 使用 shell 执行命令
    });
    // clsoe事件需要等待启动的程序运行结束，所以一般不会走这里面的代码
    child.on('close', (code) => setTimeout(() => closeCallback(code), 1000));
    // 确保子进程启动后再退出当前进程，不能立刻退出
    child.on('spawn', () => setTimeout(spawnCallback, 1000));
}