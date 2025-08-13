console.log('这是一个外部的js脚本demo')

export {
    exportFunction
}

async function exportFunction(...msg) {
    console.log('导出的函数打印消息', ...msg);
    return '第三方插件函数运行完成'
}