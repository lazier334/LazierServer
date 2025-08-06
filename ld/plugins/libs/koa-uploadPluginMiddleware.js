import multer from '@koa/multer';
import path from 'path';
import fs from 'fs';

export default function uploadPluginMiddleware({
    allowedField = 'file',                     // 表单字段名
    allowedExtensions = ['.zip'],              // 允许的扩展名
    maxFileSize = 50 * 1024 * 1024,            // 最大文件大小，默认 50MB
    savePath = path.resolve(import.meta.dirname, 'temp', 'uploadPlugin.zip'), // 默认保存位置
}) {
    // 确保目录存在
    const uploadDir = path.dirname(path.resolve(savePath));
    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
    }

    // 配置 multer
    const storage = multer.diskStorage({
        destination: (req, file, cb) => {
            cb(null, path.dirname(savePath));
        },
        filename: (req, file, cb) => {
            cb(null, path.basename(savePath)); // 固定文件名
        }
    });

    // 文件过滤器
    const fileFilter = (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        if (allowedExtensions.includes(ext)) {
            cb(null, true);
        } else {
            cb(new Error(`只允许上传以下格式的文件: ${allowedExtensions.map(e => e.slice(1)).join(', ')}`), false);
        }
    };

    // 创建 multer 实例
    const upload = multer({
        storage: storage,
        fileFilter: fileFilter,
        limits: {
            fileSize: maxFileSize,
            files: 1 // 只允许一个文件
        }
    });

    // 返回中间件
    return upload.single(allowedField);
}