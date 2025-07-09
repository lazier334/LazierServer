import Koa from 'koa';
import https from 'https';
import websocketServer from './libs/websocketServer.js';
import Config from './libs/config.js';
import initKoa from './libs/initKoa.js';

// 挂载全局对象
if (!process.G) process.G = {};
console.info(Config.showVersion());

// 检测 proxy.js 是否生成，如果没有生成，那么指定代码进行生成
if (!fs.existsSync(path.join(Config['gen-proxy-targetDir'], 'proxy.js'))) {
    console.warn('开发环境插件 proxy.js 不存在，生成该插件')
    require('./lib/gen-proxy.js')('proxy.js');
}
// 启动的目标文件夹，如果是开启了 allDir ，那么在实际读取的时候会重新扫描更新
var domainList = Config.domainList.map(domain => path.join(Config.rootDir, domain));
if (Config.allDir) console.log(`已开启全文件夹扫描，将会扫描路径 ${Config.rootDir} 里的所有文件夹`);
else console.log('指定扫描文件夹列表', pushDir(domainList));


const app = new Koa();
initKoa(app);
// 创建 HTTPS 服务器
https.createServer(Config.SSLOptions, app.callback()).listen(Config['port-https'],
    () => console.log(`https 服务器已运行，访问地址:  \x1b[33m https://localhost:${Config['port-https']} \x1b[0m`));
// 创建 HTTP 服务器
app.listen(Config['port-http'], () => console.log(`http  服务器已运行，访问地址:    http://localhost:${Config['port-http']}`));
// 创建 WebSocket 服务器
websocketServer(Config);
