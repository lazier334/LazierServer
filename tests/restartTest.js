const lc = {
    baseurl: 'http://localhost:3050',
    api: '/system/restart',
}

fetch(lc.baseurl + lc.api).then(response => {
    if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
    }
    return response.text();
}).then(data => {
    console.log('数据=>', data);
}).catch(err => {
    console.error('错误->', err.stack || err.message);
});