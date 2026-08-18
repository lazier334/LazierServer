import send from 'koa-send';
import crypto from 'crypto';
import { FileStore } from '@tus/file-store';
import { Server, EVENTS } from '@tus/server';
import { xxhash } from './utils/util-base.js';
import { lc, db } from './utils/utils-upload.js';
import { createKoaRouter } from './types/index.js';
import { fs, path, config } from './libs/baseImport.js';

/**
 * 动态路由 History 插件，顺序为： 插件API > 文件API > HarAPI > 系统API > vue的历史模式（或类似框架） > external
 */
export default createKoaRouter(function koaRouterUploads(router) {
    if (config.switch.closeUploads) return router;
    // TUS协议端点
    router.all(new RegExp("/uploads/files(/.*)?$"), async (ctx) => {
        const server = new Server({
            path: '/uploads/files',
            datastore: new FileStore({ directory: lc.dbDir })
        });

        // 监听上传完成事件
        server.on(EVENTS.POST_FINISH, async (req, res, upload) => {
            // 计算md5，并且重命名文件
            const oldId = upload.id;
            const filePath = path.join(lc.dbDir, oldId);    // 原始文件路径
            const md5 = await calculateFileMD5(filePath);   // 计算 MD5
            const newPath = path.join(lc.dbDir, md5);       // 新路径
            fs.renameSync(filePath, newPath);
            try {
                const tc = JSON.parse(fs.readFileSync(`${filePath}.json`));
                tc.id = md5;
                fs.writeFileSync(`${newPath}.json`, JSON.stringify(tc));
                fs.rmSync(`${filePath}.json`);
            } catch (err) {
                console.warn('修改tus临时配置信息失败', err)
            }
            upload.id = md5;
            upload.storage.path = upload.storage.path.replace(oldId, md5);
            db.addFile(ctx, upload);
        });
        const r = await server.handle(ctx.req, ctx.res);
        ctx.respond = false;
    });

    // 初始化上传
    router.all('/uploads/init', async (ctx) => {
        const { filename, fileSize, fileHash } = ctx.request.body;
        const saveExistsAsName = ctx.request.saveName;
        const { exists, filename: existingFile } = await checkFileExists(fileHash);
        if (exists) {
            // 添加文件名
            if (saveExistsAsName) db.addFile(ctx, {
                "id": existingFile,
                "metadata": {
                    "filename": filename,
                    // 不知道类型，未知类型也是这样
                    "filetype": null,
                    "filehash": fileHash
                },
                "size": fileSize,
                "offset": 0,
                "creation_date": Date.now()
            });
            return ctx.body = {
                skipUpload: true,
                fileId: existingFile,
                message: `秒传 (xxHash: ${fileHash})`
            };
        }

        ctx.body = {
            fileId: xxhash.h32(filename + Date.now(), lc.xxhashSeed).toString(16),
            tusEndpoint: '/uploads/files'
        };
    });

    /**
     * 使用文件名下载可能会有文件名冲突导致下载的不是自己想要的文件
     * 所以推荐使用md5下载，并使用 dfn 或 downFilename 参数重命名
     */
    router.all('/uploads/down/:filename', async (ctx) => {
        let filename = ctx.params.filename || ctx.request.query.filename || ctx.request.body.filename;
        let dfn = ctx.request.query.dfn || ctx.request.body.dfn || ctx.request.query.downFilename || ctx.request.body.downFilename;
        if (filename) filename = decodeURIComponent(filename);
        const info = db.getFile(ctx, filename);
        if (info?.id) {
            let fp = info?.storage?.path;
            if (!fp || !fs.existsSync(fp)) fp = path.join(lc.dbDir, info.id);
            await send(ctx, path.basename(fp), {
                root: path.dirname(fp),
                setHeaders: (res) => {
                    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(dfn || filename)}"`)
                }
            })
        }
    });
    /**
     * 删除文件
     */
    router.all('/uploads/delete/:filename', async (ctx) => {
        let filename = ctx.params.filename || ctx.request.query.filename || ctx.request.body.filename;
        let delFile = ctx.request.query.delFile || ctx.request.body.delFile;
        if (filename) filename = decodeURIComponent(filename);
        const info = db.delFile(ctx, filename, delFile);
        ctx.body = info;
    });

    router.all('/uploads/list', async (ctx) => {
        ctx.body = db.listFile(ctx)
    });

    router.all('/uploads/ls', async (ctx) => {
        const files = [];
        db.listFile(ctx).forEach(info => {
            info.filenameList.forEach(name => {
                const nf = { ...info };
                delete nf.filenameList;
                delete nf.auth;
                delete nf.offset;
                nf.name = name;
                files.push(nf)
            })
        });
        ctx.body = files;
    });

    return router
})

/**
 * 使用xxHash流式计算文件哈希
 * @param {string} filePath 
 * @returns {string} 
 */
async function calculateFileHash(filePath) {
    const stream = fs.createReadStream(filePath);
    let hash = xxhash.create32(lc.xxhashSeed);
    for await (const chunk of stream) {
        hash.update(chunk);
    }
    return hash.digest().toString(16); // 返回16进制哈希
}

// 检查文件是否存在
async function checkFileExists(fileHash) {
    try {
        const files = fs.readdirSync(lc.dbDir);
        for (const file of files.filter(f => !f.endsWith('.json'))) {
            const currentHash = await calculateFileHash(path.join(lc.dbDir, file));
            if (currentHash === fileHash) return { exists: true, filename: file };
        }
    } catch (err) {
        console.error('Error checking files:', err);
    }
    return { exists: false };
}

/**
 * 流式计算文件的md5
 * @param {string} fp 文件路径
 */
async function calculateFileMD5(fp) {
    const hash = crypto.createHash('md5');
    const stream = fs.createReadStream(fp);
    for await (const chunk of stream) {
        hash.update(chunk);
    }
    return hash.digest('hex');
}