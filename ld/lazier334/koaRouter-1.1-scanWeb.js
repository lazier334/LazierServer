import send from 'koa-send';
import { createKoaRouter } from './types/index.js';
import { handlerHtmlBodyData, isHandlerHtmlBodyData } from './utils/util-router.js';
import { fs, path, config, getPluginsModule, importSysModule } from './libs/baseImport.js';

const { plugins, pathDeduplication } = await getPluginsModule();
/** @type {import('../../src/libs/utils.ts')} */
const utilsModule = await importSysModule('utils.ts');
const { downloadFileToPath } = utilsModule;

// 启动的目标文件夹，如果是开启了 allWebDir ，那么在实际读取的时候会重新扫描更新
var domainList = config.domainList.map(domain => path.join(config.rootDir, domain));
if (config.switch.allWebDir) console.log(`已开启全文件夹扫描，将会扫描路径 ${config.rootDir} 里的所有文件夹`);
else console.log('指定扫描文件夹列表', pushDir(domainList));

/**
 * 动态路由 History 插件，顺序为： 插件API > 文件API > HarAPI > 系统API > vue的历史模式（或类似框架） > external
 */
export default createKoaRouter(function koaRouterScanWeb(router) {
    // 这个接口放到前面是因为优先读取文件，再读取系统的接口，顺序为： 插件API > 文件API > HarAPI > 系统API
    // 接口：全局，所有没有被拦截的都将跳到这里发送文件
    router.all('全局接口: 扫描web资源', new RegExp('/(.*)'), async (ctx, next) => {
        let api = ctx.path;
        let domainDirs = {};

        // 如果开启了全部文件夹，那么重新扫描
        if (config.switch.allWebDir) {
            domainList = getAllWebDir(config.rootDir);
            domainList = pushDir(domainList);
        }
        domainList.forEach(dir => {
            let fp = toAbsolutePath(path.join(dir, api));
            let dfp = toAbsolutePath(decodeURIComponent(fp));
            let efp = toAbsolutePath(dfp.split('/').map(e => e.split('\\').map((p, i) => {
                if (i == 0 && p.endsWith(':')) return p;
                return encodeURIComponent(p);
            }).join('/')).join('/'));

            let files = {};
            [fp, dfp, efp].forEach(f => {
                if (fs.existsSync(f)) {
                    if (fs.statSync(f).isFile()) {
                        const fDir = path.dirname(f);
                        const fname = path.basename(f);
                        // 同一个文件夹中存在多个文件时按照 fp、dfp、efp 的顺序选择优先匹配项
                        if (!domainDirs[fDir]) {
                            domainDirs[fDir] = f
                        }
                        if (files[fDir]) {
                            if (!files[fDir].includes(fname)) {
                                files[fDir].push(fname)
                            }
                        } else {
                            files[fDir] = [fname]
                        }
                    }
                }
            });
            Object.entries(files).forEach(([k, v]) => {
                if (1 < v.length) {
                    console.info(`<=${v.length}= [存在${v.length}个文件在目录中"${k}"]`, v)
                }
            })
        });

        let domains = Object.keys(domainDirs);
        let filepath = await (await plugins('selectFileByDomains')).use(domains, domainDirs, ctx);
        // 当存在多个文件夹时进行日志信息高亮，"黄色" 是当前选中的文件夹，"绿色" 是其他文件夹
        // 如果选中了文件路径，且文件路径不存在于扫描结果中，则全部都是绿色的
        if (1 < domains.length) {
            const [dir, file] = Object.entries(domainDirs).find(([k, v]) => v == filepath);
            console.info(`<=${domains.length}= [有${domains.length}个目录存在文件] ${api} (\x1b[32m{msg}\x1b[0m)`
                .replace('{msg}', domains.join(", ").replace(dir, `\x1b[33m${dir}\x1b[0m\x1b[32m`))
            );
        }
        if (filepath) {
            // 拿到文件夹
            let fileFolder = Object.keys(domainDirs).find(d => filepath.includes(path.basename(d)));
            // 检测文件大小如果为0，或者文件不存在，那么就去下载
            if (fileFolder && (!fs.existsSync(filepath) || fs.readFileSync(filepath).length <= 0) && config.switch.autoComplete) {
                // 从完整文件地址中拿到主文件夹
                let inDomains = domainList.filter(e => path.resolve(fileFolder).startsWith(path.resolve(e)));
                // 按照字符长度排序，越长的字符匹配度越高就越排前面
                inDomains.sort((a, b) => b.length - a.length);
                // 尝试将最长的文件夹转成域名
                const domain = inDomains[0]?.replace(/.*[\\/]/, '');
                if (domain) {
                    const urlObj = new URL(ctx.request.href);
                    const url = urlObj.href.replace(urlObj.host, domain);
                    console.log(`[文件大小为0，开始下载]: ${url} (${filepath})`);
                    filepath = (await downloadFileToPath(url, filepath)) || filepath;
                }
            }
            // 当文件存在的时候才进行发送
            if (fs.existsSync(filepath)) {
                return await sendFile(ctx, path.basename(filepath), {
                    root: path.dirname(filepath),
                    hidden: true
                }, next);
            }
        }
        // 文件未找到，放行到下一个路由
        return await next();
    });

    router.all(('扫描web文件列表', '/system/webFiles'), async (ctx, next) => {
        // 如果开启了全部文件夹，那么重新扫描
        if (config.switch.allWebDir) {
            domainList = getAllWebDir(config.rootDir);
            domainList = pushDir(domainList);
        }
        const files = {};
        domainList.forEach(dir => {
            if (fs.existsSync(dir)) scanFiles(dir, files)
        });

        // 是否有重复
        if (ctx.request.query?.repeat) {
            for (const k in files) {
                const v = files[k];
                if (v.length <= 1) delete files[k];
            }
        }

        const search = decodeURIComponent(ctx.request.query?.search || '').toLowerCase();
        if (typeof search == 'string' && search != '') {
            for (const k in files) {
                const v = files[k];
                // 如果 key 不存在关键词
                // 且文件路径也不存在关键词
                // 则删除该数据
                if (!k.toLowerCase().includes(search) && !v.find(fp => fp.toLowerCase().includes(search))) {
                    delete files[k];
                }
            }
        }
        ctx.body = files;
    });

    return router
})

/**
 * 扫描文件列表
 * @param {string} dir 要扫描的文件夹
 * @param {object} re 保存扫描结果
 */
function scanFiles(dir, re = {}, basedir) {
    if (basedir == undefined) basedir = dir;
    fs.readdirSync(dir).forEach(name => {
        const p = path.join(dir, name);
        const st = fs.statSync(p);
        if (st.isDirectory()) {
            // 递归扫描
            scanFiles(p, re, basedir)
        } else {
            // 拿到具体的api和保存文件
            const api = path.posix.join('/', dir.replace(basedir, '').replaceAll('\\', '/'), name);
            if (Array.isArray(re[api])) re[api].push(p);
            else re[api] = [p];
        }
    });
    return re;
}

/**
 * @typedef {Object} SendFileType 可重写内容变更发送内容
 * @property {string} [sendFileFromPath] - 发送的文件在磁盘上的完整路径
 * @property {Object} [sendOptions] - 发送文件时的配置对象, **可重写**内容变更发送内容
 * @property {import('koa').DefaultContext} sendOptions.ctx - Koa 上下文
 * @property {string} sendOptions.filename - 要发送的文件名
 * @property {import('koa-send').SendOptions} sendOptions.opts - koa-send 的配置选项
 * @property {'.edit'} sendOptions.editTag - ['.edit'] 编辑后的文件的后缀
 * @property {string} sendOptions.newFilepath - 新的文件路径，主要用于删除和检测是否已编辑过
 * @property {() => Promise<void>} sendOptions.sendBefore - 使用 send 发送文件之前的处理函数
 * @property {(error?: any) => Promise<void>} sendOptions.sendAfter - 使用 send 发送文件之后的处理函数
 * @property {() => Promise<void>} sendOptions.send - 使用 send 发送的代理函数
 */
/** 
 * 尝试使用json类型返回没有后缀的文件数据  
 * 会把 sendOptions 对象挂载到 ctx 上面
 */
async function sendFile(ctx, filepath, opts, next) {
    let sendFileFromPath = path.join(opts.root, filepath);

    const sendOptions = { ctx, filename: filepath, opts, editTag: '.edit', newFilepath: null };
    const sends = (await plugins('send')).data;
    for (const s of sends) {
        if (await s(sendOptions) === true) return;
    }
    if (path.extname(sendOptions.filename) == "") {
        try {
            const data = fs.readFileSync(path.join(sendOptions.opts.root, sendOptions.filename));
            ctx.body = JSON.parse(data);
            return;
        } catch (err) { }
    }
    /** 使用 send 发送文件前 */
    sendOptions.sendBefore = async () => {
        if (isHandlerHtmlBodyData(ctx)) {
            const bodyFP = path.join(sendOptions.opts.root, sendOptions.filename);
            // 修改读取的文件名
            sendOptions.filename = sendOptions.filename + sendOptions.editTag + path.extname(sendOptions.filename);
            const newBodyFP = path.join(sendOptions.opts.root, sendOptions.filename);
            sendOptions.newFilepath = newBodyFP;
            if (!fs.existsSync(newBodyFP)) {
                // 不存在修改后的文件则进行创建
                const body = fs.readFileSync(bodyFP, 'utf8');
                const newBody = handlerHtmlBodyData(ctx, body);
                // 创建文件
                fs.writeFileSync(newBodyFP, newBody);
            }
        }
    };
    /** 使用 send 发送文件后 */
    sendOptions.sendAfter = async (error) => {
        try {
            if (error) console.log('sendAfter 错误信息:', error);
            if (fs.existsSync(sendOptions.newFilepath) && fs.statSync(sendOptions.newFilepath).isFile()) fs.unlinkSync(sendOptions.newFilepath);
        } catch (deleteErr) {
            // 处理删除失败的情况（比如文件已被删除、权限不足、文件被锁定）
            console.error(`删除 .edit 文件失败：${sendOptions.newFilepath}`, deleteErr.message);
            console.error(deleteErr.stack);
        }
    };
    /** 使用 send 发送的代理函数 */
    sendOptions.send = async () => {
        // 检测是否已经响应或有将要响应的数据
        let re = ctx.body;
        // 如果还没有响应，那么就使用文件进行响应
        if (re === undefined && !ctx.res.headersSent) {
            re = await send(sendOptions.ctx, sendOptions.filename, sendOptions.opts)
            if (config.switch.deleteHandlerHtmlBodyDataFile && sendOptions.newFilepath) {
                // 请求流完成后删除生成的 .edit 文件(如果是文件夹也不删除)，用once避免多次触发
                ctx.res.once('finish', async () => {
                    await sendOptions.sendAfter()
                });
            }
        }
        return re;
    };
    let result;
    try {
        ctx.sendFileFromPath = sendFileFromPath;
        ctx.sendOptions = sendOptions;
        ctx.notCompleteFile = true;
        if (typeof next == 'function') await next();
        else await sendOptions.sendBefore();
        result = await sendOptions.send();
    } catch (err) {
        await sendOptions.sendAfter(err);
        throw err;
    }
    return result;
}

/** 获取子目录 */
function getAllWebDir(dir) {
    let re = [];
    try {
        re = fs.readdirSync(dir).filter(name => (config.switch.scanWebOnlyDoamin ? name.includes('.') : true)
            && fs.statSync(path.join(dir, name)).isDirectory())
            .map(domain => path.join(dir, domain));
    } catch (err) {
        console.warn(`扫描目录时异常(目录: ${dir})`, err);
    }
    return re;
}

/** 添加其他文件夹访问路径 */
function pushDir(dirs) {
    // 其他的web文件夹
    if (config.switch.allWebDir) {
        config.otherWebPath.forEach(web => dirs.splice(dirs.length, 0, ...getAllWebDir(web)));
    }
    dirs = pathDeduplication(dirs);
    return dirs;
}

/** 获取绝对路径 */
function toAbsolutePath(p) {
    return path.resolve(path.normalize(p));
}