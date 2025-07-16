import send from 'koa-send';
import redirectApi from './sendRedirectApi.js';
import sendSameApi from './sendSameApi.js';
import { plugins, pathDeduplication } from './plugins.js';
import { fs, path, config } from './config.js';

const sends = [
    sendSameApi,
    redirectApi
];

export {
    addRouters,
    completeFile
};

/** 
 * 添加接口路由，路由顺序为： 插件API > 文件API > 系统API
 * @param {import('@types/koa-router')} router 
 */
async function addRouters(router) {
    // 启动的目标文件夹，如果是开启了 allDir ，那么在实际读取的时候会重新扫描更新
    var domainList = config.domainList.map(domain => path.join(config.rootDir, domain));
    if (config.allDir) console.log(`已开启全文件夹扫描，将会扫描路径 ${config.rootDir} 里的所有文件夹`);
    else console.log('指定扫描文件夹列表', pushDir(domainList));

    // 接口：自定义的路由
    (await plugins('router')).use(router);


    // 这个接口放到前面是因为优先读取文件，再读取系统的接口，顺序为： 插件API > 文件API > 系统API
    // 接口：全局，所有没有被拦截的都将跳到这里发送文件
    router.all(new RegExp('/(.*)'), async (ctx, next) => {
        let api = ctx.path;
        let domainDirs = {};
        // 如果开启了全部文件夹，那么重新扫描
        (config.allDir ? (domainList = getAllDir(config.rootDir)) : domainList).forEach(dir => {
            let fp = path.join(dir, api);
            if (fs.existsSync(fp) || (fs.existsSync((fp = decodeURIComponent(fp))))) {
                if (fs.statSync(fp).isFile()) domainDirs[dir] = fp;
            }
        })

        let filepath = await selectFileByDomains(ctx, domainDirs, api);
        if (filepath) {
            // 拿到文件夹
            let fileFolder = Object.keys(domainDirs).find(d => filepath.includes(path.basename(d)));
            // 检测文件大小如果为0，或者文件不存在，那么就去下载
            if (fileFolder && (!fs.existsSync(filepath) || fs.readFileSync(filepath).length <= 0)) {
                if (!(pushDir([]).includes(fileFolder) || !fileFolder.startsWith(config.rootDir))) {
                    // 尝试转成域名，规则查看 getAllDir() 和 pushDir() 
                    const domain = fileFolder.replace(/.*[\\/]/, '');
                    if (domain) {
                        const urlObj = new URL(ctx.request.href);
                        const url = urlObj.href.replace(urlObj.host, domain);
                        console.log(`[文件大小为0，开始下载]: ${url} (${filepath})`);
                        filepath = await downloadFileToPath(url, filepath);
                    }
                }
            }
            // 当文件存在的时候才进行发送
            if (fs.existsSync(filepath)) {
                return await sendFile(ctx, path.basename(filepath), {
                    root: path.dirname(filepath),
                    hidden: true
                });
            }
        }
        // 文件未找到，放行到下一个中间件
        return await next();
    });

    // 接口：根目录重定向
    router.all(['/', '/index'], ctx => {
        ctx.redirect('/index.html?dir=src');
    });

    // 接口：首页按钮数据
    router.all("/system/indexData", async ctx => {
        return ctx.body = plugins['indexData'].use();
    });

    // 接口：设置是否开启自动补全，传递get参数则为仅查询
    router.all('/system/autocomplete', ctx => {
        if (!ctx.query.get) {
            let status = ctx.query.status;
            config.autoComplete = status == undefined ? !config.autoComplete : status;
        }
        console.info('当前自动补全的状态为', config.autoComplete);
        ctx.body = config.autoComplete;
    });

    // 接口：自动补全编辑页的文件匹配 /edit/vs/*
    router.all(/^\/edit\/vs\/.*$/, async (ctx) => {
        const filepath = path.join(process.cwd(), 'src', ctx.url);
        const url = 'https://unpkg.com/monaco-editor@0.33.0/min/vs' + ctx.url.substring(ctx.url.indexOf('/vs') + '/vs'.length);
        const fp = await downloadFileToPath(url, filepath);
        if (fp && fs.existsSync(fp)) {
            return await sendFile(ctx, path.basename(fp), {
                root: path.dirname(fp),
                hidden: true
            });
        }
    });

    return router;
}



/** 尝试使用json类型返回没有后缀的文件数据 */
async function sendFile(ctx, filepath, opts) {
    let fp = path.join(opts.root, filepath);
    ctx.sendFileFromPath = fp;

    let fpd = decodeURIComponent(fp);
    if (fp != fpd) {
        // 尝试生成一个解码后的文件
        if (!fs.existsSync(fpd)) {
            console.info('[正在生成解码路径的文件]', fpd);
            fs.mkdirSync(path.dirname(fpd), { recursive: true });
            fs.copyFileSync(fp, fpd);
        }
        console.warn('[正在读取解码路径的文件]', fpd)
        ctx.sendFileFromPath = fpd;
        opts.root = path.dirname(fpd);
        filepath = path.basename(fpd);
    }

    const sendOptions = { ctx, filename: filepath, opts };
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
    return await send(sendOptions.ctx, sendOptions.filename, sendOptions.opts);
}

/** 补全文件的koa插件，会使用 domains 里面的域名逐个尝试下载文件 */
async function completeFile(ctx, next) {
    if (config.autoComplete) {
        let downloadedFile = null;
        const api = ctx.path;
        const url = new URL(ctx.request.href);
        url.port = "";

        for (const domain of config.autoCompleteDomains) {
            url.host = domain;
            const localPath = path.join(config.rootDir, url.hostname, api);
            moreLog("[尝试下载]", url.href);
            downloadedFile = await downloadFileToPath(url.href, localPath);
            if (downloadedFile) {
                return await sendFile(ctx, path.basename(downloadedFile), {
                    root: path.dirname(downloadedFile),
                    hidden: true
                });
            }
        }
    }
    await next();
}

/**
 * 会自动使用http和https尝试下载
 * 
 * 下载文件到指定的路径，里面使用了代理，需要开启代理并且配置正确才可以正常下载
 * 如果不需要代理可以将其配置为 "假" 值
 * @param {string} url - 下载文件的 URL
 * @param {string} filepath - 文件保存的路径
 * @returns {Promise<string|undefined>} 文件最终存放的文件路径，下载失败则为未定义
 */
async function downloadFileToPath(url, filepath, orgUrl) {
    try {
        fs.mkdirSync(path.dirname(filepath), { recursive: true });
        const downloader = new Downloader({
            url: url,
            timeout: config.timeout || 30 * 1000,
            directory: path.dirname(filepath), // 保存文件的目录
            fileName: path.basename(filepath), // 保存文件的名称
            cloneFiles: false,
            ...(config.proxy ? { proxy: config.proxy } : {})
        });
        filepath = ((await downloader.download()).filePath || filepath).replace(/\\/g, '/');
        console.info(`[文件已下载至路径]: \x1b[32m%s\x1b[0m`, filepath);
        return filepath;
    } catch (error) {
        if (!orgUrl) {
            return await downloadFileToPath(url.startsWith('https://') ?
                url.replace('https://', 'http://') :
                url.replace('http://', 'https://'), filepath, url);
        }
        const errMsg = error.message || (typeof error.stack == 'string' ? error.stack.split('\n').shift() : '');
        console.error([`[下载文件出现异常]: 双协议均下载失败，代理(proxy)配置: ${config.proxy ? config.proxy : '未开启'}`, orgUrl, url, `主要错误信息 (${errMsg})`].join('\n'));
        moreLog(error.stack);
    }
}

/**
 * 选择域名文件夹的处理
 * @param {import('koa').Context} ctx koa的上下文
 * @param {{"api.demo.com": "api.demo.com/assets/index.js", "m.demo.com": "m.demo.com/assets/index.js"}} domainsMap 域名映射列表
 * @param {"/assets/index.js"} api 请求的api
 * @returns {"api.demo.com/assets/index.js" | undefined} 选中的文件路径
 */
async function selectFileByDomains(ctx, domainsMap, api) {
    // 优先使用参数 ctx.query.dir 的
    // 其次使用插件选择的，但是插件里可以删除参数
    // 最后默认使用第一个
    let domains = Object.keys(domainsMap);
    let selectFolder = await (await plugins('selectFileByDomains')).use(domains, domainsMap, ctx) || domains[0];
    if (ctx.query.dir) {
        let priorityDir = domains.find((item) => item === ctx.query.dir);
        if (priorityDir) selectFolder = priorityDir;
    }

    // 当存在多个文件夹时进行日志信息高亮，"黄色" 是当前选中的文件夹，"绿色" 是其他文件夹
    if (1 < domains.length) {
        console.info(`<=${domains.length}= [有${domains.length}个目录存在文件] ${api} (\x1b[32m%s\x1b[0m)`,
            domains.join(", ").replace(selectFolder, `\x1b[33m${selectFolder}\x1b[0m\x1b[32m`));
    }
    return domainsMap[selectFolder];
}

/** 获取子目录 */
function getAllDir(dir) {
    let re = [];
    try {
        re = fs.readdirSync(dir).filter((item) => fs.statSync(path.join(dir, item)).isDirectory())
            .map(domain => path.join(config.rootDir, domain));
    } catch (err) {
        console.warn(`扫描目录时异常(目录: ${dir})`, err);
    }
    return pushDir(re);
}

/** 添加其他文件夹访问路径 */
function pushDir(dirs) {
    dirs.push(config['genProxyTargetDir']);    // 插件文件夹
    dirs.push('public');    // 主文件夹
    dirs = pathDeduplication(dirs);
    return dirs;
}
