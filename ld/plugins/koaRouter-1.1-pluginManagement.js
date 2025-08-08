import { fs, path, config, getPluginsModule, importSysModule } from './libs/baseImport.js';
import uploadPluginMiddleware from './libs/koa-uploadPluginMiddleware.js';
import StreamZip from 'node-stream-zip';
import fsExtra from 'fs-extra';
import result from './utils/util-result.js';
import { getAbsolutePaths, compareDirectories } from './utils/utils-base.js';
/** @type {import('../../src/libs/utils.js')} */
const utilsModule = await importSysModule('utils.js');
const { downloadFileToPath } = utilsModule;

const plugins = await getPluginsModule();
const rootDir = import.meta.dirname;
const tempDir = path.join(rootDir, 'pluginTemp');
const lc = {
    /** 根目录，也是当前的目录 */
    rootDir,
    /** 插件的临时文件夹 */
    tempDir,
    /** 解压的插件的位置 */
    unzipDir: path.join(tempDir, path.basename(rootDir)),
    /** 上传的文件表单字段名 */
    uploadFileFieldName: 'uploadPlugin',
    /** 上传的文件路径 */
    uploadFilePath: path.join(tempDir, 'uploadPlugin.zip'),
    /** 上传的文件最大大小 */
    uploadFileSizeMax: 50 * 1024 * 1024,
    /** 上传允许的文件拓展名 */
    uploadAllowedExtensions: ['.zip'],
    /** 解压进度 */
    unzipProgress: 0,
    /** 下载的文件路径 */
    downloadFilePath: path.join(tempDir, 'downloadPlugin.zip'),
    /** 下载的链接缓存 */
    downloadStatus: false,
    /** 下载信息 */
    downloadLog: null,
}

/**
 * 动态路由 demo 插件，顺序为： 插件API > 文件API > HarAPI > 系统API > vue的历史模式（或类似框架）
 * @param {import('@koa/router')} router 路由
 */
export default function koaRouterManagement(router) {
    // 查
    router.all('管理路由 - 获取指定插件详细内容', '/plugin-mgmt/api/plugin', async (ctx, next) => {
        let fp = ctx.request.body.filepath;
        let msg = '成功';
        let code = 200;
        let re = { filepath: fp };
        if (fp) {
            fp = getAbsolutePaths(fp);
            re.filepath = fp;
            if (fs.existsSync(fp)) {
                re = fs.statSync(fp);
                re.exclude = config.excludePlugins.includes(fp);
                re.body = fs.readFileSync(fp, 'utf8');
            } else {
                code = 400;
                msg = '文件不存在';
            }
        } else {
            code = 500;
            msg = '路径无效';
        }
        ctx.body = result(re, msg);
    });

    // router.all('管理路由 - 获取全部插件', '/plugin-mgmt/api/pluginList', async (ctx, next) => {
    router.all('/plugin-mgmt/api/pluginList', async (ctx, next) => {
        let stages = Object.keys(config.pluginStages);
        let pluginPath = [...config.excludePlugins, ...(await plugins.getAllPlugin())];
        ctx.body = result({ stages, pluginPath, excludePlugins: config.excludePlugins });
    });

    // 改
    router.all('管理路由 - 禁用/启用指定插件', '/plugin-mgmt/api/switch', async (ctx, next) => {
        let fpList = ctx.request.body.filepathList;
        if (Array.isArray(fpList) && 0 < fpList.length) {
            fpList.forEach(fp => {
                fp = getAbsolutePaths(fp);
                let index = config.excludePlugins.indexOf(fp);
                if (-1 < index) {
                    config.excludePlugins.splice(index, 1);
                } else {
                    config.excludePlugins.push(fp);
                }
            });
            return ctx.body = result(config.excludePlugins);
        } else {
            ctx.body = result(fp, '路径无效', false, 500);
        }
    });

    // 增
    router.post('管理路由 - 上传插件', '/plugin-mgmt/api/upload', uploadPluginMiddleware({
        allowedField: lc.uploadFileFieldName,
        allowedExtensions: lc.uploadAllowedExtensions,
        maxFileSize: lc.uploadFileSizeMax,
        savePath: lc.uploadFilePath
    }), async (ctx, next) => {
        ctx.body = result(lc.uploadFilePath);
    });

    // 删
    router.all('管理路由 - 删除插件', '/plugin-mgmt/api/remove', async (ctx, next) => {
        let fp = ctx.request.body.filepath;
        let msg = '成功';
        let code = 200;
        const fn = path.basename(fp);
        if (Object.keys(config.pluginStages).some(stage => fn.startsWith(stage))) {
            if (fp && fs.existsSync(fp)) {
                fs.unlinkSync(fp);
                return ctx.body = result(fp);
            } else {
                code = 400;
                msg = '文件不存在';
            }
        } else {
            code = 500;
            msg = '路径无效';
        }
        return ctx.body = result(fp, msg, false, code);
    });

    // 其他
    router.all('管理路由 - 远程下载的信息', '/plugin-mgmt/api/downloadLog', async (ctx, next) => {
        ctx.body = result(lc.downloadLog)
    });

    router.all('管理路由 - 远程下载文件', '/plugin-mgmt/api/download', async (ctx, next) => {
        // 调用下载组件进行文件下载，下载到指定的位置，和上传功能传到的地方一致，除了文件名不一样
        let url = ctx.request.body.pluginUrl;
        if (lc.downloadStatus) {
            return ctx.body = result(lc.downloadStatus, '正在下载中', false, 500);
        } else {
            lc.downloadStatus = url;
            downloadFileToPath(url, lc.downloadFilePath, url).then(filepath => {
                if (filepath == undefined) throw new Error('下载失败!路径为: ' + filepath);
                lc.downloadLog = `下载完成，文件位置${filepath}`
                console.info(lc.downloadLog);
            }).catch(err => {
                lc.downloadLog = `下载失败，错误信息${err.message}\n${err.stack}`;
                console.error('下载失败', err);
            }).finally(() => {
                lc.downloadStatus = false;
            })
            return ctx.body = result(lc.downloadStatus, '开始下载');
        }
    });

    router.all('管理路由 - 解压插件', '/plugin-mgmt/api/unzip', async (ctx, next) => {
        /** 编码格式 */
        const nameEncoding = ctx.request.body.nameEncoding || 'utf8';
        /** 压缩包路径，可以传递不同路径以支持解压其他压缩包 */
        let zipFilePath = ctx.request.body.zipFilePath || lc.uploadFilePath;
        if (zipFilePath == 'download') zipFilePath = lc.downloadFilePath;
        /** 解压路径 */
        const extractDir = lc.unzipDir;
        console.log('压缩包路径', zipFilePath)
        let code = 200;
        let msg = '插件解压成功';
        let re = {};
        try {
            if (!fs.existsSync(zipFilePath)) {
                ctx.status = 400;
                ctx.body = { error: '未找到上传的插件压缩包，请先上传' };
                return;
            }

            if (!fs.existsSync(extractDir)) {
                fs.mkdirSync(extractDir, { recursive: true });
            } else {
                fs.rmSync(extractDir, { recursive: true, force: true });
                fs.mkdirSync(extractDir);
            }

            // 创建 StreamZip 实例，指定编码处理
            const zip = new StreamZip.async({
                file: zipFilePath,
                nameEncoding: nameEncoding
            });

            const entries = await zip.entries();
            const entryNames = Object.keys(entries);

            // 计算总大小（用于进度报告）
            const totalSize = Object.values(entries).reduce((sum, entry) => sum + (entry.isFile ? entry.size : 0), 0);

            let extractedSize = 0;
            let lastProgress = 0;

            // 进度报告函数
            const reportProgress = () => {
                const progress = Math.floor((extractedSize / totalSize) * 100);
                if (progress > lastProgress) {
                    lc.unzipProgress = progress;
                    lastProgress = progress;
                }
            };

            // 解压所有文件
            for (const entryName of entryNames) {
                const entry = entries[entryName];

                // 解码文件名
                const targetPath = path.join(extractDir, entryName);

                // 确保目标目录存在
                const targetDir = path.dirname(targetPath);
                if (!fs.existsSync(targetDir)) {
                    fs.mkdirSync(targetDir, { recursive: true });
                }

                if (entry.isDirectory) {
                    // 如果是目录，确保目录存在
                    if (!fs.existsSync(targetPath)) {
                        fs.mkdirSync(targetPath, { recursive: true });
                    }
                } else {
                    // 获取文件数据并写入
                    const entryData = await zip.entryData(entryName);
                    fs.writeFileSync(targetPath, entryData);

                    // 更新进度
                    extractedSize += entry.size;
                    reportProgress();
                }
            }

            await zip.close();
            lc.unzipProgress = 0;

            re = {
                extractedDir: extractDir,
                extractedFiles: fs.readdirSync(extractDir, { recursive: true }),    // 获取解压后的文件列表（使用解码后的名称）
                totalSize: totalSize
            };
        } catch (error) {
            console.error('解压插件失败:', error);
            code = 500;
            msg = error.message;
        }
        ctx.body = result(re, msg, code == 200, code);
    });


    router.all('管理路由 - 确认移动插件文件', '/plugin-mgmt/api/movePlugin', async (ctx, next) => {
        const fromPath = lc.unzipDir;
        const toPath = lc.rootDir;
        const force = !!ctx.request.body.force;
        let copy = force;
        let code = 200;
        let msg = '成功';
        let re = {};
        let data = await compareDirectories(fromPath, toPath);
        data.toFiles = [];
        re = data;
        if (!force) {
            if (0 < data.conflicts.length) {
                msg = '文件存在冲突';
                code = 500;
            } else {
                copy = true;
            }
        }
        if (copy) {
            try {
                // 关键配置：overwrite: true 表示强制覆盖冲突文件
                await fsExtra.copy(fromPath, toPath, { overwrite: true });
                console.log('文件夹复制完成（已覆盖冲突文件）');
            } catch (err) {
                console.error('复制失败:', err);
                re = {
                    message: err.message,
                    stack: err.stack
                };
                msg = '复制失败';
                code = 500;
            }
        }
        return ctx.body = result(re, msg, code == 200, code);
    });

    router.all('管理路由 - 检查临时文件的冲突', '/plugin-mgmt/api/checkFilesConflict', async (ctx, next) => {
        const fromPath = ctx.request.body.fromPath || lc.unzipDir;
        const toPath = ctx.request.body.toPath || lc.rootDir;
        let data = await compareDirectories(fromPath, toPath);
        ctx.body = result(data);
    });

    return router
}