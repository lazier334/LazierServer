import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

/**
 * @param {import('../libs/config.js')}
 */
export default async function sysStartLogger({ fs, path, config }) {
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
                winston.format.timestamp({ format: 'YYYY/MM/DD HH:mm:ss' }),
                logFormat
            )
        })
    ];
    config.logger.dailyRotateFileList.forEach(conf => {
        transports.push(new DailyRotateFile(conf))
    });

    // 创建 winston logger
    const logger = winston.createLogger({
        // 最低记录的日志级别，低于此级别的日志不会被处理
        level: config.logger.globalLevel,
        format: winston.format.combine(
            winston.format.timestamp({ format: config.logger.globalTimeFormat }),
            logFormat
        ),
        transports: transports
    });

    console.log = (...args) => logger.verbose(args.join(' '));
    console.info = (...args) => logger.info(args.join(' '));
    console.warn = (...args) => logger.warn(args.join(' '));
    console.error = (...args) => logger.error(args.join(' '));
    console.debug = (...args) => logger.debug(args.join(' '));

    return logger
} 