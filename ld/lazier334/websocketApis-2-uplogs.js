import { createWebsocketApis } from './types/index.js';
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
    (function (wsurl, logName) {
        // ---------- 创建ws工具,用于传输日志 ----------
        const soc = {
            url: wsurl,
            ws: null,
            reconnectTimer: null,
            timeout: 3000,
            send(msg) {
                try {
                    // 纯字符串时将其作为数据内容
                    if (typeof msg == 'string') msg = { data: msg };
                    // 是对象时补全 name、time 字段
                    if (typeof msg == 'object') {
                        if (msg.name == undefined) msg.name = logName ?? 'log';
                        if (msg.name == undefined) msg.time = new Date().toLocaleString('zh - CN');
                    }
                    this.ws.send(typeof msg == 'string' ? msg : JSON.stringify(msg));
                    return true;
                } catch (err) {
                    console.error('日志发送失败', err);
                }
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
                    console.error('连接失败', err);
                    alert('连接失败:' + err);
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
        // ---------- 使用 ----------
        soc.send(JSON.stringify({
            data: '连接成功',
            time: new Date().toLocaleString('zh-CN')
        }));
        return soc;
    })('wss://localhost:3001', 'temp');
}