// 数据从接口 `/cacheErrorApis` 获取，并将下面的域名填写为原始域名
const data = [
    "/.well-known/api1",
    "/api2",
].map(uri => 'http://real.com' + uri);

const fs = require('fs');
const path = require('path');
const { Readable } = require('stream');

// 确保/web目录存在（同步创建）
const saveDir = './web';
if (!fs.existsSync(saveDir)) {
    fs.mkdirSync(saveDir, { recursive: true }); // 递归创建目录[3,5](@ref)
}

data.forEach((url, index) => {
    setTimeout(() => {
        console.log(`正在操作${index + 1}/${data.length}`)
        download(url)
    }, index * 3000)
})

function download(url) {
    console.log('url:', url)
    // const fileName = url.split('import').pop();
    // 从URL提取文件名（最后一段路径）[9](@ref)
    const filePath = path.join(saveDir, url.replace('://', '.')); // 拼接完整路径
    if (!fs.existsSync(filePath)) {
        fetch(url)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`下载失败，状态码: ${response.status}`); // 处理HTTP错误[7](@ref)
                }

                if (!fs.existsSync(path.dirname(filePath))) {
                    fs.mkdirSync(path.dirname(filePath), { recursive: true }); // 递归创建目录[3,5](@ref)
                }

                // 创建文件写入流
                const fileStream = fs.createWriteStream(filePath);
                const nodeStream = Readable.fromWeb(response.body); // 转换流类型
                // 流式传输响应数据到文件[1,2](@ref)
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
                console.error('下载失败:', error.message); // 统一错误处理[5](@ref)
                console.error(error); // 统一错误处理[5](@ref)
            });
    } else {
        console.log('已存在，跳过', url)
    }
}