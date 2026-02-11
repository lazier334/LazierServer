import fs from 'fs';
import path from 'path';
import { Readable } from 'stream';

// 数据从接口 `/cacheErrorApis` 获取，并将下面的域名填写为原始域名
const data = [
    "/.well-known/api1",
    "/api2",
].map(uri => 'http://real.com' + uri);
const saveDir = './web';

// 确保/web目录存在（同步创建）
if (!fs.existsSync(saveDir)) {
    fs.mkdirSync(saveDir, { recursive: true });
}

data.forEach((url, index) => {
    setTimeout(() => {
        console.log(`正在操作${index + 1}/${data.length}`)
        download(url)
    }, index * 3000)
});

function download(url) {
    console.log('url:', url)
    // 从URL提取文件名（最后一段路径）来拼接完整路径
    const filePath = path.join(saveDir, url.replace('://', '.'));
    if (!fs.existsSync(filePath)) {
        fetch(url)
            .then(response => {
                if (!response.ok) {
                    // 处理HTTP错误
                    throw new Error(`下载失败，状态码: ${response.status}`);
                }

                if (!fs.existsSync(path.dirname(filePath))) {
                    // 递归创建目录
                    fs.mkdirSync(path.dirname(filePath), { recursive: true });
                }

                // 创建文件写入流
                const fileStream = fs.createWriteStream(filePath);
                // 转换流类型
                const nodeStream = Readable.fromWeb(response.body);
                // 流式传输响应数据到文件
                nodeStream.pipe(fileStream);

                // 返回Promise确认写入完成
                return new Promise((resolve, reject) => {
                    fileStream.on('finish', () => resolve(filePath));
                    fileStream.on('error', reject);
                });
            })
            .then(filePath => {
                console.log(`文件已保存至: ${filePath}`);
            })
            .catch(error => {
                // 统一错误处理
                console.error('下载失败:', error.message);
                console.error(error);
            });
    } else {
        console.log('已存在，跳过', url)
    }
}