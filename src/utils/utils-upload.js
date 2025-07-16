/*
    1. 连接两种上传文件的模式
    2. 增加数据访问管理
    3. 分享
    4. 连接im服务（提供拓展服务）
 */
import { fs, path, config } from '../libs/config.js';
import * as globalUtils from './utils.js';

const userType = globalUtils.userType;

/** 因为upload是作为插件提供，所以不添加进全局配置 */
const lc = {
    /** 数据库加密密码，32个字符 */
    cryptoKey: config.cryptoKey.substring(0, 32).padEnd(32, '3'),
    /** 基础路由 */
    BASEAPI: '/uploads',
    /** 上传路径 */
    dbDir: path.join(config.dataPath, 'uploads'),
    /** 配置文件名 */
    dbName: 'map.json',
    xxhashSeed: 8866,
    intervals: {
        saveData: 0,
        // 每30分钟触发保存一次数据库
        saveDataStep: 30 * 60 * 1000,
        /**
         * 保存事件触发器
         * @param {5000} num 时间，单位毫秒
         * @returns 
         */
        saveDataOnEventStep(num) {
            return this.saveData = Date.now() + (num || 5 * 1000)
        },
    },
    caches: {},
    auth: true
};
const fileType = {
    /** 唯一id */
    "id": "6a9490616fbca27cffca0db350a24150",
    /** 原始信息 */
    "metadata": {
        /** 首个文件名 */
        "filename": "Downloads.zip",
        /** mime类型 */
        "filetype": "application/zip",
        /** 文件xxhash */
        "filehash": "8403bca8"
    },
    /** 文件大小 */
    "size": 3588600047,
    /** - */
    "offset": 0,
    /** 创建时间 */
    "creation_date": "2025-04-28T06:59:16.594Z"
}

/** 文件信息类型 */
const infoType = {
    /** 文件名列表 */
    "filenameList": [],
    /** 授权id列表，为空的时候所有人都可以访问，否则只允许指定的id或管理员访问，id通过其他模块的重写实现 */
    "auth": [],
    ...fileType,
    /** 存储信息 */
    "storage": {
        "type": 'file',
        "path": 'D:\\work\\_test_\\0\\lsc\\uploads/61ca4aba90a3633c7c907ba5a76ad028'
    }
}

/** 映射数据信息类型 */
const mapType = {
    '校验码md5作为id': infoType
}

const db = initDB();

// 确保上传目录存在
if (!fs.existsSync(lc.dbDir)) {
    fs.mkdirSync(lc.dbDir);
}

// 每5秒扫描一次
const inteId5s = setInterval(() => {
    const dn = Date.now();
    if (lc.intervals.saveData < dn) {
        db.saveData();
    }
}, 5 * 1000);

export {
    globalUtils,
    config,
    lc,
    db
}

/** 初始化数据库 */
function initDB() {
    /** 
     * @param {fileType} file
     * @returns {infoType}
     */
    function createInfo(file) {
        return {
            filenameList: [file.metadata.filename],
            auth: [],
            ...file
        }
    }

    let db = {
        /** @type {mapType} */
        mapData: {},
        /**
         * 保存文件
         * @param {fileType} file
         * @returns {infoType | undefined}
         */
        addFile(ctx, file) {
            let user = {};
            try {
                user = this.auth(ctx)
            } catch (err) {
                console.log('查询权限时异常', err)
            };
            const newInfo = createInfo(file);
            /** @type {infoType} */
            let info = this.mapData[newInfo.id];
            if (info) {
                if (!info.filenameList.includes(newInfo.metadata.filename)) {
                    info.filenameList.push(newInfo.metadata.filename)
                }
            } else {
                info = newInfo
            }
            // 保存当前的用户id
            if (user?.userId != undefined) {
                if (!info.auth.includes(user.userId)) info.auth.push(user.userId);
            }
            this.mapData[newInfo.id] = info;
            lc.intervals.saveDataOnEventStep();
            return info;
        },
        /**
         * 读取文件，参数可以是 filename 也可以是 id
         * 如果是文件名，可能会有文件名冲突，即多个文件同一个名字，可能会下载错误
         * @param {string} filename 
         * @returns {infoType | undefined}
         */
        getFile(ctx, filename) {
            const user = this.auth(ctx);
            /** @type {infoType} */
            let info;
            // 通过id直接查询
            const keys = Object.keys(this.mapData);
            if (keys.includes(filename)) {
                info = this.mapData[filename];
            } else {
                // 通过文件名查询
                for (const k of keys) {
                    /** @type {infoType} */
                    const i = this.mapData[k];
                    if (i.filenameList.includes(filename)) {
                        info = i;
                        break;
                    }
                }
            }

            // 无文件信息，或用户无权限（非管理员且不在授权列表中）
            if (!info || (user && !user.isAdmin && !info.auth.includes(user.userId))) {
                // 无文件
                return;
            }
            // 找到文件
            return info;
        },
        /**
         * 读取文件，参数可以是 filename 也可以是 id
         * @returns {[infoType]}
         */
        listFile(ctx) {
            const user = this.auth(ctx);
            /** @type {[infoType]} */
            let list = [];
            let userId = user?.userId;
            if (user?.isAdmin) userId = null;

            for (const key in this.mapData) {
                /** @type {infoType} */
                const info = this.mapData[key];
                let save = true;
                // 存在用户且用户没有被授权
                if (userId && !info.auth.includes(userId)) {
                    save = false;
                }
                if (save) list.push(info);
            }

            return list;
        },
        /**
         * 删除文件
         * @param {string} filename 
         * @param {boolean} delFile 是否删除文件
         * @returns {infoType | undefined}
         */
        delFile(ctx, filename, delFile) {
            const user = this.auth(ctx);
            let userId = user?.userId;
            if (!userId && !user?.isAdmin) throw new Error('无权限进行操作');
            const info = this.getFile(ctx, filename);
            if (!info) return;
            if (!user?.isAdmin && !info.auth.includes(userId)) throw new Error('无权限进行操作');
            // 删除自己的文件引用，如果文件没有引用则彻底删除
            const index = info.filenameList.indexOf(filename);
            info.filenameList.splice(index, 1);
            if (delFile || info.filenameList.length < 1) {
                // 彻底删除这个文件与其配置文件和信息
                try {
                    fs.rmSync(path.join(lc.dbDir, info.id));
                } catch (error) {
                    console.log('删除文件失败', error)
                }
                try {
                    fs.rmSync(path.join(lc.dbDir, info.id + '.json'));
                } catch (error) {
                    console.log('删除文件失败', error)
                }
                info.delete = true;
                delete this.mapData[info.id];
            }
            lc.intervals.saveDataOnEventStep();
            return info;
        },

        /** 
         * 权限校验
         * @returns {userType}
         */
        auth(ctx) {
            if (lc.auth) {
                const user = globalUtils.authUser(ctx);
                if (!user) throw new Error('未登录!');
                return user;
            }
        },
        /** 保存数据到文件 */
        saveData() {
            const fp = path.join(lc.dbDir, lc.dbName);
            let jsondata = JSON.stringify(this.mapData);
            // 如果数据没有变化则忽略
            if (jsondata == lc.caches[fp]) return;
            fs.writeFileSync(fp, globalUtils.encodeText(jsondata, lc.cryptoKey));
            lc.caches[fp] = jsondata;
            console.log('文件数据已保存');
            return true
        },
        /** 读取数据文件 */
        readData() {
            return this.mapData = JSON.parse(globalUtils.decodeText(
                fs.readFileSync(path.join(lc.dbDir, lc.dbName), 'utf-8'), lc.cryptoKey));
        }
    }

    const handlerEditMapData = {
        // 拦截属性设置操作（增、改）
        set(target, property, value, receiver) {
            const result = Reflect.set(target, property, value, receiver);
            if (result) db.saveData();
            return result;
        },
        // 拦截属性删除操作
        deleteProperty(target, property) {
            const result = Reflect.deleteProperty(target, property);
            if (result) db.saveData();
            return result;
        }
    };

    if (fs.existsSync(path.join(lc.dbDir, lc.dbName))) db.readData();
    return db;
}