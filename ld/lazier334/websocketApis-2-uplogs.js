import { createWebsocketApis } from './types/index.ts';
import { fs, path, config } from './libs/baseImport.js'

const lc = {
    dirpath: path.join(config.dataPath, 'logs'),
    logPrefix: 'uplogs-'
};

/** 
 * 使用时需要传递客户端的消息进来，进行路由识别与操作
 */
export default createWebsocketApis(async function websocketApisDemo(msg, message, ws, req) {
    if ('/uplogs' == req.url.split('?').shift()) {
        const name = msg.name;
        if (typeof name == 'string') {
            try {
                if (!fs.existsSync(lc.dirpath)) fs.mkdirSync(lc.dirpath, { recursive: true });
                fs.appendFileSync(path.join(lc.dirpath, lc.logPrefix + name), `[${msg.time}] ${msg.data}\n`);
            } catch (err) {
                console.log('写入日志异常', err)
            }
        }
        return { end: true }
    }
    return { end: false }
})

/**
 * 配套的注入脚本, 需要手动将其加入自己的页面内
 */
function 配套的注入脚本() {
    // 要检测的关键词数组（根据需要修改）
    (function (wsurl) {
        // ---------- 创建ws工具,用于传输日志 ----------
        const SOC = (function (url) {
            const soc = {
                url: url,
                ws: null,
                reconnectTimer: null,
                timeout: 3000,
                send(msg) {
                    try {
                        this.ws.send(msg);
                        return true;
                    } catch { }
                    return false;
                },
                connect() {
                    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
                        return;
                    }
                    if (this.reconnectTimer) {
                        clearTimeout(this.reconnectTimer);
                        this.reconnectTimer = null;
                    }

                    this.ws = new WebSocket(this.url);
                    this.ws.onerror = err => {
                        console.error(err);
                        alert('发生错误' + err);
                    };
                    this.ws.onclose = () => {
                        this.reconnectTimer = setTimeout(() => {
                            this.ws = null;
                            this.connect();
                        }, this.timeout);
                    };
                }
            }
            soc.connect();
            return soc;
        })(wsurl);

        // ---------- 自定义使用 ----------
        SOC.send(JSON.stringify({
            data: '连接成功',
            time: new Date().toLocaleString('zh-CN')
        }));
        return SOC;
    })('wss://localhost:3001');
}