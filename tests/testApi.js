const lc = {
    baseurl: 'http://localhost:3000',
    api: '/system/copyright',
}

fetch(lc.baseurl + lc.api, {
    method: 'POST',                    // 指定请求方法为 POST
    headers: {
        'Content-Type': 'application/json', // 告诉服务器发送的是 JSON
    },
    body: JSON.stringify({}),     // 将 JavaScript 对象转为 JSON 字符串
}).then(response => {
    if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
    }
    return response.text();
}).then(data => {
    console.log('数据=>', data);
}).catch(err => {
    console.error('错误->', err.stack || err.message);
});