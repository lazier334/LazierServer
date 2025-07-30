import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

/**
 * @param {import('../libs/config.js') & { app: import('koa') }}
 */
export default async function sysStartLogger({ fs, path, config, app }) {
    // 日志格式：加上等级和时间前缀
    const logFormat = winston.format.printf(({ level, message, timestamp }) => {
        // level: 日志级别（如 info、debug、error）
        // timestamp: 日志时间
        // message: 日志内容
        return `[${timestamp}] [${level}] ${message}`;
    });

    const transports = [
        // 控制台输出，带颜色
        new winston.transports.Console({
            level: config.logger.consoleLevel,  // 只处理 log 及以上级别
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.timestamp({ format: config.logger.globalTimeFormat }),
                logFormat
            )
        })
    ];
    config.logger.dailyRotateFileList.forEach(conf => transports.push(new DailyRotateFile(conf)));

    // 创建 winston logger
    const logger = winston.createLogger({
        // 最低记录的日志级别，低于此级别的日志不会被处理
        level: config.logger.globalLevel,
        format: winston.format.combine(
            winston.format.timestamp({ format: config.logger.globalTimeFormat }),
            // 启用堆栈捕获
            winston.format.errors({ stack: true }),
            logFormat
        ),
        transports
    });

    /** 读取并整合参数 */
    function readArgs(...args) {
        return args.map(e => {
            // NOTE 手动处理堆栈信息
            if (e instanceof Error) {
                return e.stack.includes(e.message) ? (e.stack) : (e.message + '\n' + e.stack)
            }
            return e
        }).join(' ')
    }

    console.log = (...args) => logger.verbose(readArgs(...args));
    console.info = (...args) => logger.info(readArgs(...args));
    console.warn = (...args) => logger.warn(readArgs(...args));
    console.error = (...args) => logger.error(readArgs(...args));
    console.debug = (...args) => logger.debug(readArgs(...args));

    return logger
} 