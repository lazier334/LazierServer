import vm from 'vm';
import { config, fs, path } from '../libs/config.js';
import crypto from 'crypto';
import globalUtils from './utils.js';
import SubscriptionManager from '../classes/SubscriptionManager.js';

const sm = new SubscriptionManager();
const dblog = (...args) => console.log('[db]', ...args);
const DBKEYS = ['accounts', 'msgs', 'msgAuth', 'sessions'];
const deadlineMax = new Date('2099-12-31');
/** 因为im是作为插件提供，所以不添加进全局配置 */
const imConfig = {
    /** 数据库加密密码，32个字符 */
    cryptoKey: config.cryptoKey.substring(0, 32).padEnd(32, '3'),
    BASEAPI: '/im',
    dbDir: path.join(config.dataPath, 'imdbs'),
    sessionKey: 'im-session',
    SESSION_MAX_AGE: 3 * 24 * 60 * 60 * 1000, // 设置 Cookie 有效期为 3 天
    intervals: {
        saveDB: 0,
        // 每30分钟触发保存一次数据库
        saveDBStep: 30 * 60 * 1000,
        /**
         * 保存事件触发器
         * @param {5000} num 时间，单位毫秒
         * @returns 
         */
        saveDBOnEventStep(num) {
            return this.saveDB = Date.now() + (num || 5 * 1000)
        },
        // 每1分钟扫描一次过期的 session
        clearSession: 0,
        clearSessionStep: 60 * 1000,
    },
    caches: {},
    userUpdateExcludeKeys: [
        'userId',
        'password',
        'deadline',
        'isAdmin',
        'superAdmin'
    ],
    userUpdateExcludeKeysByAdmin: [
        'userId',
        'password',
        'deadline',
    ],
    userUpdateExcludeKeysBySuperAdmin: [
        'userId',
    ],
};

{   // 初始化所有时间
    const dn = Date.now();
    Object.keys(imConfig.intervals)
        .filter(k => imConfig.intervals[k] == 0 && imConfig.intervals[k + 'Step'])
        .forEach(k => imConfig.intervals[k] = dn + imConfig.intervals[k + 'Step'])
}

const monitorMap = {
    baseKeys: {
        msg: 'msg',
        topic: 'topic',
        user: 'user',
    },
    getKey(key, moreInfo) {
        return key + '_' + moreInfo
    },
    /**
     * 添加监视
     * @param {string} key 
     * @param {(data:any)=>void} dataHandle 
     * @returns {Promise<void>}
     */
    monitorAdd(key, dataHandle) {
        if (!Array.isArray(monitorMap[key])) monitorMap[key] = [];
        return new Promise((resolve, reject) => {
            monitorMap[key].push(typeof dataHandle != 'function' ?
                resolve : async (data) => {
                    try {
                        resolve(await dataHandle(data));
                    } catch (error) {
                        reject(error);
                    }
                }
            );
        })
    },
    /**
     * 触发监视
     * @param {string} key 
     * @param {any} data 
     */
    onMonitor(key, data) {
        if (Array.isArray(monitorMap[key])) {
            if (0 < monitorMap[key].length) {
                monitorMap[key].splice(0).forEach(resolve => {
                    try {
                        resolve(data)
                    } catch (error) {
                        console.debug('消息广播失败', error)
                    }
                });
            }
        } else monitorMap[key] = [];
    }
};
/** 消息类型 */
const messageType = {
    // 发送时间 + # + 随机数
    // id: params.time + '#' + utils.generateRandomString(),
    id: '#',        // 消息id
    time: 0,        // 发送时间
    userId: -1,     // 用户id
    content: '',    // 消息内容
    type: 'txt',    // 类型
    updateTime: 0   // 消息更新时间
};
/** 话题类型 */
const topicType = {
    auths: {
    },
    admins: [
        // 第一个管理员是持有者
    ],
    authKeys: [
        // 授权监听消息的令牌
    ],
    topicId: -1,
    name: 'topic',
    lastMsg: messageType,
    createTime: 0,
    /** 广场模式，没有管理员，人人可以管理信息 */
    notAdmin: false,
    /** 是否允许普通用户添加其他人 */
    addMode: false,
};
/** 用户类型 */
const userType = {
    userId: 1,
    status: '在线',
    /** 头像地址 */
    avatar: '',
    username: 'user1',
    password: 'pd1',
    lastUpdateTime: 0,
    deadline: deadlineMax,
    isAdmin: false,
    superAdmin: false,
};
/** session类型 */
const sessionType = {
    "userId": 1,
    "status": "在线",
    "username": "user1",
    "lastUpdateTime": 1742957723865,
    "deadline": 4102358400000,
    "isAdmin": true,
    "superAdmin": false
};


const utils = {
    /**
     * 读取session和参数
     * @param {*} ctx 
     * @returns {{session:'im-session'}} 
     */
    readParamsAndSession(ctx) {
        return {
            session: ctx.cookies.get(imConfig.sessionKey),
            ...ctx.request.query,
            ...ctx.request.body
        }
    },
    /**
     * 生成指定长度的随机字符串
     * @param {number} len - 要生成的字符串长度
     * @param {string} [chars] - 可选的字符集，默认为字母和数字
     * @returns {string} 随机字符串
     */
    generateRandomString(len = 16, chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'.split('')) {
        let result = '';
        for (let i = 0; i < len; i++) {
            result += chars[Math.floor(Math.random() * chars.length)];
        }
        return result;
    },
    /**
     * 将第一个参数转为数字，如果传递第2、3个参数则限制范围，第4个参数用于转换失败时是否抛出异常
     * @param {string} str - 要转换的字符串
     * @param {number} [min] - 最小值（可选）
     * @param {number} [max] - 最大值（可选）
     * @param {boolean} [throwErr=false] - 转换失败时是否抛出异常（可选，默认为 false）
     * @returns {number|NaN} - 转换后的数字，或 NaN（如果转换失败且未抛出异常）
     */
    stringToNumber(str, min, max, throwErr = false) {
        let num = Number(str);

        // 检查是否为有效数字
        if (isNaN(num)) {
            if (throwErr) {
                throw new Error(`无法将 "${str}" 转换为数字`);
            }
        }

        // 检查范围限制
        if (typeof min === 'number' && num < min) num = min;

        if (typeof max === 'number' && num > max) num = max;

        return num;
    },
    /** 简化的虚拟机运行程序 */
    simpleVM(code, context, opts) {
        if (typeof context != 'object') context = {};
        vm.createContext(context);
        vm.runInContext(code, context, opts || {});
        return context;
    },
    simpleVMJsonParse(objStr) {
        try {
            return utils.simpleVM(`data = (${objStr})`).data
        } catch (e) {
            return objStr;
        }
    },
    /**
     * 信息内容类型，会根据 type 计算消息体
     * @param {messageType} msg 
     */
    msgBodyType(msg) {
        try {
            switch (msg.type) {
                case 'js':
                    msg.content = utils.simpleVMJsonParse(msg.content);
                    break;
                case 'txt':
                default:
                    break;
            }
        } catch (error) {
            console.log('类型计算失败', error.message);
        }
        return msg
    },
    delay(ms) {
        return new Promise((resolve) => {
            setTimeout(resolve, ms);
        });
    },
    /**
     * 创建可以被订阅的 topic 对象
     * @param {topicType} topic 
     * @returns 
     */
    createTopic(topic) {
        return sm.createObservableObject(topic)
    },
    /**
     * 创建可以被订阅的 account 对象
     * @param {userType} account 
     * @returns 
     */
    createAccount(account) {
        return sm.createObservableObject(account)
    },
}


const db = initDB();
// 初始化数据库
db.readDB();
// 检测如果开启了加密，那么强制保存一次
if (config.cryptoDataEnable) {
    db.saveDB(true)
}
// 检测如果一个账号都没有那么设置默认账号
if (db.accounts.length < 1) {
    db.accounts.push(utils.createAccount({ userId: 0, status: '离线', username: 'admin', password: 'admin', lastUpdateTime: Date.now(), deadline: deadlineMax, isAdmin: true, superAdmin: true }));
    db.saveDB();
}
{
    const upList = [];
    // 格式化密码，如果密码小于16位则进行盐值加密
    db.accounts.forEach(acc => {
        if (acc.password.length < 20) {
            acc.password = db.passwordSalt(acc.password)
            db.onSaveDB();
            upList.push(acc)
        }
    });
    console.warn(`已加密更新${upList.length}位用户的密码`);
}

// 每5秒扫描一次
const inteId5s = setInterval(() => {
    const dn = Date.now();
    if (imConfig.intervals.clearSession < dn) {
        const limitTime = Date.now() - imConfig.SESSION_MAX_AGE;
        for (const session in db.sessions) {
            const obj = db.sessions[session];
            if (obj.lastUpdateTime < limitTime) {
                delete db.sessions[session];
                imConfig.intervals.saveDBOnEventStep();
            }
        }
    }

    if (imConfig.intervals.saveDB < dn) {
        db.saveDB();
    }
}, 5 * 1000);

export default {
    userType,
    sessionType,
    messageType,
    topicType,
    ...utils,
    Config: config,
    imConfig,
    db,
}

/** 初始化数据库 */
function initDB() {
    const msgListType = [messageType];
    const messageKeys = Object.keys(messageType);
    class DataBaseError extends Error {
        constructor(message) {
            super(message);
            this.name = 'DataBaseError';
        }
    }


    const msgdatabase = {
        ...initAccountDB(),
        /**
         * 消息集合
         * {
         *  聊天对话id: [{
         *      id: 消息id,
         *      time: 发送时间,
         *      content: 消息内容,
         *      userId: 用户id
         *      type: 信息类型，默认是txt文本，当类型为其他时，由 msgBodyType 计算
         *  }]
         * }
         * @type {{[topicId:string|number]: messageType}}
         */
        msgs: {},
        /**
         * 消息配置
         * {
         *  聊天对话id: {
         *      auths: {        // 用户仅能查看加入时间以及之后的信息内容
         *          5: dn,
         *          1: 用户加入时间,
         *      },
         *      topicId: 1,     // 话题id，用于方便返回数据
         *      name: 'Item 1', // 话题名称
         *      lastMsgTime: 话题最后一条消息的时间
         *  }
         * }
         * @type {{[topicId:string|number]: topicType}}
         */
        msgAuth: {},
        /**
         * 校验参数
         * @param {*} params 
         */
        verifyMsgParams(params) {
            if (params.topicId == null || params.topicId === "") throw new DataBaseError('topicId 参数不存在!');
            if (params.userId == null || params.userId === "") throw new DataBaseError('userId 参数不存在!');
        },
        verifyMessage(message, includeKeys = messageKeys) {
            // 校验消息
            includeKeys.forEach(key => {
                if (message[key] == undefined) throw new DataBaseError(`消息的 ${key} 参数不存在!`)
            })
        },
        /**
         * 
         * @param {*} params 
         * @returns {messageType}
         */
        readMessageByParams(params) {
            this.verifyMessage(params, ['content', 'userId']);
            const dn = Date.now();
            const message = {}
            messageKeys.forEach(k => message[k] = params[k] ?? messageType[k]);
            message.id = (params.sendTime || dn) + '#' + utils.generateRandomString();
            message.time = dn;

            return message;
        },

        /**
         * 监视话题的新消息
         * 使用令牌authKey或者session校验权限
         */
        monitorAddMsg(params) {
            const topic = this.selectTopic(params);
            if (!topic) throw new DataBaseError('话题不存在!');
            let save = false;
            if (topic.authKeys && Array.isArray(topic.authKeys) && topic.authKeys.includes(params.authKey)) {
                save = true;
            }

            if (!save) {
                const user = this.readUserBySession(params.session);
                if (topic.auths[user.userId]) {
                    save = true;
                }
            }

            if (save) {
                // 如果存在最后一条消息的id，那么返回新增的消息们，否则只返回最后一条消息
                return monitorMap.monitorAdd(monitorMap.baseKeys.msg, (data) => {
                    /** @type {msgListType} */
                    const msgs = this.msgs[params.topicId] || [];

                    let re = [msgs[msgs.length - 1]];
                    // 读取当前的消息
                    let msgId = params.endMsg?.id;
                    if (msgId) {
                        // 倒序遍历消息
                        for (let i = msgs.length - 1; -1 < i; i--) {
                            const e = msgs[i];
                            if (e.id == msgId) {
                                re = msgs.slice(i + 1);
                                break;
                            }
                        }
                    }

                    return re;
                });
            }

            throw new DataBaseError('无权限操作!');
        },
        /**
         * 添加消息
         * @param {number} topicId 聊天对话ID
         * @param {object} message 消息对象 { id, time, content, userId }
         */
        addMsg(params) {
            const user = this.readUserBySession(params.session);
            params.userId = user.userId;
            const message = this.readMessageByParams(params);
            this.verifyMsgParams(params);
            if (!this.msgs[params.topicId]) {
                this.msgs[params.topicId] = [];
            }
            this.msgs[params.topicId].push(message);
            this.onSaveDB();
            monitorMap.onMonitor(monitorMap.baseKeys.msg, message);
            // 触发监控，给所有成员发送消息
            Object.keys(this.msgAuth[params.topicId]?.auths).forEach(uid => {
                monitorMap.onMonitor(monitorMap.getKey(monitorMap.baseKeys.topic, uid))
            });

            return message;
        },
        /**
         * 删除消息
         * @param {number} topicId 聊天对话ID
         * @param {number} id 消息ID
         * @param {[number]} ids 消息ID列表
         * @returns {[messageType]}
         */
        delMsg(params) {
            const user = this.readUserBySession(params.session);
            params.userId = user.userId;
            this.verifyMsgParams(params);
            const msgs = this.msgs[params.topicId];
            if (!msgs) throw new DataBaseError(`对话 ${params.topicId} 不存在!`);
            if (!params.ids) params.ids = [];
            if (params.id) params.ids.push(params.id);
            const delMsgs = [];
            params.ids.forEach(id => {
                let delIndex = msgs.findIndex(msg => msg.id == params.id);
                if (-1 < delIndex) {
                    const delMsg = msgs.splice(delIndex, 1).pop();
                    console.log('删除消息成功', delIndex, delMsg);
                    this.onSaveDB();
                    if (delMsg) delMsgs.push(delMsg);
                }
            })
            return delMsgs;
        },
        /**
         * 更新消息
         * @returns {messageType}
         */
        updateMsg(params) {
            // { session, topicId, id, content }
            if (params.content == undefined) throw new DataBaseError('content 参数不存在!');
            const user = this.readUserBySession(params.session);
            this.setUserAuthToParams(user, params);
            this.verifyMsgParams(params);
            const msgs = this.msgs[params.topicId];
            if (!msgs) throw new DataBaseError(`对话 ${params.topicId} 不存在!`);
            const message = msgs.find(msg => msg.id == params.id && msg.userId == params.userId);
            if (!message) throw new DataBaseError(`消息 ${params.id} 不存在或无权限操作!`);
            message.updateTime = Date.now();
            message.content = params.content;
            // 还需要让用户监听到消息更新
            monitorMap.onMonitor(monitorMap.baseKeys.msg, message);
            // 触发监控，给所有成员发送消息
            Object.keys(this.msgAuth[params.topicId]?.auths).forEach(uid => {
                monitorMap.onMonitor(monitorMap.getKey(monitorMap.baseKeys.topic, uid))
            });
            this.onSaveDB();
            return message;
        },
        /**
         * 获取能读取的全部消息
         * @param {{topicId: '', userId: ''}} params 
         * @returns {msgListType}
         */
        readViewableMsg(params, adminShowTime) {
            if (params.topicId == null || params.topicId === "") throw new DataBaseError('topicId 参数不存在!');
            /** @type {msgListType} */
            const msgs = this.msgs[params.topicId] || [];
            if (typeof adminShowTime == 'number' && this.isAdminUser(params)) {
                const startIndex = msgs.findIndex(msg => adminShowTime < msg.time);
                return -1 < startIndex ? msgs.slice(startIndex) : [];
            }
            try {
                // 检测是否有权限
                const startTime = this.msgAuth[params.topicId].auths[params.userId];
                if (startTime == undefined) throw new DataBaseError('无权限查看!');
                const startIndex = msgs.findIndex(msg => startTime <= msg.time);
                return -1 < startIndex ? msgs.slice(startIndex) : [];
            } catch (error) {
                console.warn(`对话读取 ${params.topicId} 异常!`, error);
            }
            return [];
        },
        /**
         * 获取消息
         * @param {{
         *      "topicId": "1111",
         *      "userId": 1,
         *      "endMsg": {
         *          "id": "1744422216071#zrszrRcu0JXXCbnu",
         *          "time": 1744422216077,
         *          "userId": 1,
         *          "content": "1234",
         *          "type": "js",
         *          "updateTime": 0,
         *          "username": "user1"
         *      },
         *      "back": false
         *  }} params 
         * @returns {msgListType} 消息列表
         */
        getMsg(params) {
            const user = this.readUserBySession(params.session);
            this.setUserAuthToParams(user, params);
            this.verifyMsgParams(params);
            const msgs = this.readViewableMsg(params);

            params.limit = Number(params.limit);
            if (isNaN(params.limit) || params.limit < 1) params.limit = 30;
            let startIndex = 0;
            let endIndex = 0;

            // 读取开始的消息
            if (params.endMsg) {
                let si = msgs.findIndex(msg => msg.id == params.endMsg.id);
                if (-1 < si) {
                    startIndex = si + 1;
                    endIndex = si;
                }
            }

            // 根据是上一页还是下一页来设置开始和结束的索引
            if (params.back) {
                startIndex = endIndex - params.limit;
                if (startIndex < 0) startIndex = 0;
            } else {
                endIndex = startIndex + params.limit;
                if (endIndex > msgs.length) endIndex = msgs.length;
            }

            return msgs.slice(startIndex, endIndex);
        },
        /** 
         * 通过话题id读取最后一条消息
         * @returns {messageType}
         */
        getLastMsgByTopic(topic) {
            try {
                const msgs = this.msgs[topic.topicId]
                return msgs[msgs.length - 1]
            } catch (err) {
            }
        },
        /** 管理员获取所有消息 */
        allMsg_Admin(params) {
            const admin = this.readAdminUserBySession(params.session);
            this.setUserAuthToParams(admin, params);
            return this.readViewableMsg(params, 1);
        },
        /**
         * 监视对话列表信息更新
         */
        monitorTopicAll(params) {
            const user = this.readUserBySession(params.session);
            const readTopicList = () => {
                const topicList = [];
                for (const topicId in this.msgAuth) {
                    const topic = this.msgAuth[topicId];
                    if (topic.auths[user.userId]) {
                        topicList.push(topic)
                    }
                }
                return topicList
            };
            // 添加事件
            const monitor = monitorMap.monitorAdd(monitorMap.baseKeys.topic, (data) => readTopicList());

            // 创建一个列表用于触发 'topicAll' 事件
            // 用户名下新增话题需要额外触发
            // 有新消息的时候修改话题最后更新时间来触发

            // 订阅 topic 的更改以及新增 topic ，这里的代码必须要按照当前顺序执行
            // 需要读取到要监听的所有话题，另外还要给用户id做监听
            const targetData = readTopicList();
            let sym = null;
            const assistId = monitorMap.getKey(monitorMap.baseKeys.topic, user.userId);
            const smCallback = (changeDetails) => {
                if (sym) {  // 防止二次调用
                    // 触发响应数据
                    monitorMap.onMonitor(monitorMap.baseKeys.topic);
                    // 卸载监听
                    sm.unsubscribeList(targetData, sym);
                    sym = null;
                    // 触发辅助监控，避免辅助监控还没有被清理导致意外
                    monitorMap.onMonitor(assistId);
                }
            };
            // 辅助监控用于在新增的时候触发 smCallback 事件
            const assistMonitor = monitorMap.monitorAdd(assistId, (data) => {
                smCallback({ from: 'assistMonitor' });
            });
            sym = sm.subscribeList(targetData, smCallback);
            return monitor;
        },
        /**
         * 拿到对话列表信息
         */
        topicAll(params) {
            const user = this.readUserBySession(params.session);
            const topicList = [];
            for (const topicId in this.msgAuth) {
                const topic = this.msgAuth[topicId];
                if (topic.auths[user.userId]) {
                    topicList.push(topic)
                }
            }
            return topicList
        },
        /**
         * 创建话题，读取信息创建一个话题对象并放到 this.msgAuth 中
         */
        createTopic(params) {
            const user = this.readUserBySession(params.session);
            const addUserIds = params.addUserIds;
            const index = addUserIds.findIndex(id => id == user.userId);
            if (-1 < index) addUserIds.splice(index, 1);

            /** @param {{[id:string]:topicType}} ma  */
            function createTopicObject(ma, prefix = '') {
                // 获取最后一个id，这样可以减少遍历时间，如果id不存在才使用当前数据的长度
                const keys = Object.keys(ma);
                let baseNumber = keys.length;
                if (baseNumber == 0) {
                    return {
                        ...topicType,
                        topicId: prefix + 0
                    };
                }
                for (let ei = keys.length - 1; 0 <= ei; ei--) {
                    const lastTopicId = Number(keys[ei]);
                    if (!isNaN(lastTopicId)) {
                        baseNumber = lastTopicId + 1;
                        break;
                    }
                }

                for (let i = 0; i < keys.length; i++) {
                    const topicId = prefix + (baseNumber + i);
                    if (!ma[topicId]) {
                        return {
                            ...topicType,
                            topicId
                        };
                    }
                }
                throw new DataBaseError('创建失败！无法生成有效的话题id，请重试');
            }
            const topic = utils.createTopic(createTopicObject(this.msgAuth));
            const date = new Date();
            topic.auths[user.userId] = date.getTime();
            topic.name = params.name || date.toLocaleString();
            topic.createTime = date.getTime();
            topic.admins = [user.userId];
            // 添加其他成员
            addUserIds.forEach(uid => topic.auths[uid] = date.getTime());

            this.msgAuth[topic.topicId] = topic;
            // 触发监控，给所有成员发送消息
            Object.keys(topic.auths).forEach(uid => {
                monitorMap.onMonitor(monitorMap.getKey(monitorMap.baseKeys.topic, uid))
            });

            this.onSaveDB();
            return topic;
        },
        /**
         * 查找话题
         * @param {{topicId:string}} params 
         * @returns {topicType}
         */
        selectTopic(params) {
            return this.msgAuth[params.topicId];
        },
        /**
         * 查找话题列表
         * @param {{topicIds: [string]}} params 
         * @returns {[topicType]}
         */
        selectTopicList(params) {
            return params.topicIds.map(topicId => this.msgAuth[topicId]);
        },
        /**
         * 删除话题
         * @returns {[topicType]}
         */
        deleteTopic(params) {
            const user = this.readUserBySession(params.session);
            const sa = this.isSuperAdminUser(user);
            // 拿到全部话题
            const topicList = this.selectTopicList(params);
            let re = [];
            let onMonitorUserIds = {};
            topicList.forEach(topic => {
                if (topic && (sa || topic.admins[0] == user.userId)) {
                    Object.keys(topic.auths).forEach(uid => onMonitorUserIds[uid] = true);
                    delete this.msgAuth[topic.topicId];
                    this.onSaveDB();
                    re.push(topic);
                }
            });
            onMonitorUserIds = Object.keys(onMonitorUserIds);
            if (0 < onMonitorUserIds.length) {
                // 触发监控，给所有成员发送消息
                onMonitorUserIds.forEach(uid => {
                    monitorMap.onMonitor(monitorMap.getKey(monitorMap.baseKeys.topic, uid))
                });
            }
            return re;
        },
        /**
         * 更新话题
         */
        updateTopic(params) {
            const user = this.readUserBySession(params.session);
            const topic = this.selectTopic(params);
            if (topic) {
                if (topic.admins[0] == user.userId) {
                    if (Array.isArray(params.admins) && 0 < params.admins.length) {
                        topic.admins = params.admins
                    }
                }
                const oldAuths = topic.auths;
                const date = new Date();
                if (typeof params.name == 'string') topic.name = params.name;
                if (typeof params.auths == 'object' && params.auths != null) {
                    topic.auths = params.auths;
                }
                // 继续添加管理员信息进来，如果没有给管理员设置时间
                // 旧数据中也没有管理员的信息，那么将设置为0（全局可见）
                topic.admins.forEach(uid => {
                    if (topic.auths[uid] == undefined) {
                        let time = oldAuths[uid] || 0;
                        topic.auths[uid] = time;
                    }
                })

                // 添加其他成员
                params?.addUserIds?.forEach(uid => {
                    if (topic.auths[uid] == undefined) {
                        topic.auths[uid] = date.getTime();
                    }
                });
                this.onSaveDB();
                // TODO 是否要通知列表？
                return topic;
            }
        },
        /**
         * 退出话题
         */
        exitTopic(params) {
            const user = this.readUserBySession(params.session);
            const topic = this.selectTopic(params);
            const adminIndex = topic.admins.indexOf(user.userId);
            // 群主不允许退出
            if (adminIndex == 0) {
                throw new DataBaseError('群主不允许退出话题，可以转让后退出，或者解散话题')
            }
            if (-1 < adminIndex) topic.admins.splice(adminIndex, 1);
            if (topic.auths[user.userId]) delete topic.auths[user.userId];
            this.onSaveDB();
            monitorMap.onMonitor(monitorMap.getKey(monitorMap.baseKeys.topic, user.userId));
            return topic;
        },
        /**
         * 接口保存数据库
         */
        apiSaveDB(params) {
            try {
                const admin = this.readAdminUserBySession(params.session);
                this.saveDB();
                return true;
            } catch (error) {
                console.log('保存数据库数据失败', error)
                return false
            }
        },
        /**
         * 保存数据库
         */
        onSaveDB() {
            imConfig.intervals.saveDBOnEventStep();
        },
        /**
         * 保存数据库
         */
        saveDB(focusCover) {
            if (fs.existsSync(imConfig.dbDir) && fs.statSync(imConfig.dbDir).isFile()) {
                dblog('数据库文件夹被文件占用，清理文件', imConfig.dbDir);
                fs.unlinkSync(imConfig.dbDir);
            }
            if (!fs.existsSync(imConfig.dbDir)) {
                fs.mkdirSync(imConfig.dbDir, { recursive: true });
            }
            const saveDBList = [];
            DBKEYS.forEach(dbname => {
                if (this[dbname]) {
                    const fp = path.join(imConfig.dbDir, dbname);
                    const body = JSON.stringify(this[dbname]);
                    if (focusCover || imConfig.caches[fp] != body) {
                        if (fs.existsSync(fp) && fs.statSync(fp).isDirectory()) {
                            dblog('数据库文件被文件夹占用，清理文件夹', fp);
                            fs.unlinkSync(fp);
                        }
                        imConfig.caches[fp] = body;
                        dblog('正在写入文件', fp);
                        saveDBList.push(dbname);
                        fs.writeFileSync(fp, encodeText(body));
                    }
                } else {
                    dblog('数据不存在', dbname);
                }
            });
            if (0 < saveDBList.length) dblog('数据保存完成', saveDBList);
            imConfig.intervals.saveDBOnEventStep(imConfig.intervals.saveDBStep);
        },
        /**
         * 读取数据库
         */
        readDB() {
            if (!fs.existsSync(imConfig.dbDir)) {
                dblog('数据库目录不存在', imConfig.dbDir);
                return;
            }
            const readDBList = [];
            DBKEYS.forEach(dbname => {
                const filePath = path.join(imConfig.dbDir, dbname);
                if (fs.existsSync(filePath)) {
                    dblog('正在读取文件', filePath);
                    readDBList.push(dbname);
                    this[dbname] = JSON.parse(decodeText(fs.readFileSync(filePath, 'utf-8')));
                    if (dbname == 'accounts') {
                        // 创建可监视的用户
                        for (const key in this[dbname]) {
                            this[dbname][key] = utils.createAccount(this[dbname][key]);
                        }
                    } else if (dbname == 'msgAuth') {
                        // 创建可监视的话题
                        for (const key in this[dbname]) {
                            this[dbname][key] = utils.createTopic(this[dbname][key]);
                        }
                    }
                } else {
                    dblog('文件不存在', filePath);
                }
            });
            dblog('数据读取完成', readDBList);
        },

    }

    // 覆写操作
    overwirte(msgdatabase)
    return msgdatabase;
}
/**
 * 
 * @param {db} db 
 */
function overwirte(db) {
    /**
     * 默认本机发起的请求信息全都是超级管理员
     * @param {*} ctx 
     * @returns {allowAdmin} 用户信息
     */
    globalUtils.authUser = function (ctx) {
        try {
            const user = db.readUserBySession(utils.readParamsAndSession(ctx).session);
            return user;
        } catch (error) {
            console.log('权限校验失败', error)
        }
    }
}

function initAccountDB() {
    let dn = Date.now();

    class AccountError extends Error {
        constructor(message) {
            super(message);
            this.name = 'AccountError';
        }
    }

    return {
        onSaveDB() {
            console.log('需要实现onSaveDB功能')
        },
        /**
         * 在线用户，提供账号验证和在线列表
         * [{ userId: 1, status: '在线', username: 'user1', password: 'pd1', lastUpdateTime: dn, deadline: 4102358400000, isAdmin: true, superAdmin: true }]
         * @type {[userType]}
         */
        accounts: [],
        /**
         * session列表
         * @type {{[sessionId: string]: sessionType}}
         */
        sessions: {},
        /**
         * 扫描session，一边读取session一边清理过期的session
         * @param {'im-session'} session 
         */
        getSession(session) {
            return this.sessions[session];
        },
        /**
         * 监视session列表
         */
        monitorSessionAll(params) {
            const readSessionList = () => {
                const sessionList = [];
                for (const sessionId in this.sessions) {
                    const session = this.sessions[sessionId];
                    sessionList.push(session)
                }
                return sessionList
            };
            // 添加事件
            let sym = null;
            const monitor = monitorMap.monitorAdd(monitorMap.baseKeys.user, (data) => readSessionList());
            const targetData = readSessionList();
            const assistId = monitorMap.getKey(monitorMap.baseKeys.user, 'all');
            const smCallback = (changeDetails) => {
                if (sym) {
                    // 触发响应数据
                    monitorMap.onMonitor(monitorMap.baseKeys.user);
                    // 卸载监听
                    sm.unsubscribeList(targetData, sym);
                    sym = null;
                    // 触发辅助监控，避免辅助监控还没有被清理导致意外
                    monitorMap.onMonitor(assistId);
                }
            };
            // 辅助监控用于在新增的时候触发 smCallback 事件
            const assistMonitor = monitorMap.monitorAdd(assistId, (data) => {
                smCallback({ from: 'assistMonitor' });
            });
            sym = sm.subscribeList(targetData, smCallback);
            return monitor;
        },
        /**
         * 扫描session，一边读取session一边清理过期的session
         * @param {'im-session'} session 
         */
        readUserInfo(params) {
            let user = this.readUserBySession(params.session);
            if (params.userId != null && params.userId != user.userId) {
                user = { ...(this.accounts.find(u => u.userId == params.userId) || {}) };
                delete user.password;
            }
            return user;
        },
        /**
         * 添加session
         * @param {userType} user 
         * @param {'im-session'} session 
         */
        addSession(user, session = utils.generateRandomString()) {
            for (let i = 0; i < 10; i++) {
                if (this.getSession(session)) {
                    session = utils.generateRandomString()
                }
            }
            if (this.getSession(session) || session == undefined || session == null) {
                throw AccountError('session无效!请重新尝试');
            }
            // 扫描之前是否存在相同userId的session，存在的话清除数据
            Object.entries(this.sessions).forEach(([key, oldUser]) => {
                if (oldUser.userId === user.userId) {
                    delete this.sessions[key];
                }
            });
            this.sessions[session] = user;
            monitorMap.onMonitor(monitorMap.getKey(monitorMap.baseKeys.user, 'all'));
            this.onSaveDB();
            return session;
        },
        /**
         * 更新session
         * @param {userType} user 
         * @param {'im-session'} session 
         */
        updateSession(user, session) {
            if (!this.getSession(session)) {
                throw AccountError('session无效!请重新尝试');
            }
            // 扫描之前是否存在相同userId的session，存在的话清除数据
            Object.entries(this.sessions).forEach(([lsession, oldUser]) => {
                if (oldUser.userId === user.userId && lsession != session) {
                    delete this.sessions[lsession];
                }
            });
            this.sessions[session] = user;
            monitorMap.onMonitor(monitorMap.getKey(monitorMap.baseKeys.user, 'all'));
            this.onSaveDB();
            return session;
        },
        /**
         * 从用户id读取session
         * @param {string} userId 
         * @returns {string} session
         */
        readSessionByUserId(userId) {
            for (const session in this.sessions) {
                const user = this.sessions[session];
                if (user.userId == userId) {
                    return session;
                }
            }
            throw new AccountError('用户未登录!');
        },
        /**
         * 从session读取用户
         * @param {'im-session'} session 
         * @returns {userType}
         */
        readUserBySession(session) {
            const user = this.getSession(typeof session == 'object' ? session.session : session);
            if (!user) throw new AccountError('用户未登录!');
            return user;
        },
        /**
         * 从session读取管理员用户
         * @param {'im-session'} session 
         * @returns {userType}
         */
        readAdminUserBySession(session) {
            const user = this.readUserBySession(session);
            if (!this.isAdminUser(user) && !this.isSuperAdminUser(user)) throw new AccountError('用户不是管理员!');
            return user;
        },
        /**
         * 将用户/管理员 权限和userId 设置给其他对象
         * @param {user|admin|object} user 
         * @param {object} params 
         */
        setUserAuthToParams(user, params) {
            if (user.userId != undefined) params.userId = user.userId;
            if (user.isAdmin != undefined) params.isAdmin = user.isAdmin;
            if (user.superAdmin != undefined) params.superAdmin = user.superAdmin;
        },
        /**
         * 验证是否是管理员
         * @param {{isAdmin: boolean}} params 对象
         * @returns {boolean}
         */
        isAdminUser(params) {
            return !!params.isAdmin
        },
        /**
         * 验证是否是超级管理员
         * @param {{superAdmin: boolean}} params 对象
         * @returns {boolean}
         */
        isSuperAdminUser(params) {
            return !!params.superAdmin
        },
        /**
         * 注册账号
         */
        signUp({ username, password }) {
            if (this.accounts.some(acc => acc.username == username)) {
                throw new AccountError('用户名已存在!');
            }
            const newUser = utils.createAccount({
                userId: this.accounts.length + 1,
                status: '在线',
                username,
                password,
                lastUpdateTime: Date.now(),
                deadline: deadlineMax
            });
            this.accounts.push(newUser);
            return this.addSession(newUser);
        },
        passwordSalt(password) {
            if (password != null) return crypto.createHash('md5').update(password + config.serverSeed).digest('hex');
        },
        dePassword(password) {
            return decryptBase64(password)
        },
        /**
         * 登录账号
         * @param {{ username:string, password:string }} param0 
         * @returns {'im-session'}
         */
        login({ username, password }) {
            password = this.passwordSalt(this.dePassword(password));
            const user = this.accounts.find(acc => acc.username == username && acc.password == password);
            if (!user) throw new AccountError('用户名或密码错误!');
            user.status = '在线';
            user.lastUpdateTime = Date.now();
            return this.addSession(user);
        },
        /**
         * 注销登录
         */
        logout({ session }) {
            const user = this.readUserBySession(session);
            delete this.sessions[session];
            monitorMap.onMonitor(monitorMap.getKey(monitorMap.baseKeys.user, 'all'));
            this.onSaveDB();
            user.status = '离线';
            return session;
        },
        /**
         * 批量注销登录
         */
        logoutAll(params) {
            this.isSuperAdminUser(this.readAdminUserBySession(params.session));
            params.userIds.forEach(userId => {
                try {
                    const session = this.readSessionByUserId(userId);
                    const user = this.readUserBySession(session);
                    delete this.sessions[session];
                    user.status = '离线';
                } catch (error) {
                    console.log(userId, '注销登录操作失败', error.message);
                }
            });
            monitorMap.onMonitor(monitorMap.getKey(monitorMap.baseKeys.user, 'all'));
            this.onSaveDB();
            return true;
        },
        /**
         * 设置状态
         */
        status({ session, status }) {
            if (typeof status == 'string') {
                const user = this.readUserBySession(session);
                this.onSaveDB()
                return user.status = status;
            }
        },
        /**
         * 修改账号密码
         */
        updatePassword({ session, password, oldPassword }) {
            if (typeof password != 'string' || password.length < 3) {
                throw new AccountError('密码长度不能小于3位!');
            }
            const user = this.readUserBySession(session);
            if (user.password != oldPassword) throw new AccountError('旧密码不一致!');
            user.password = password;
            this.updateSession(user, session);
            this.onSaveDB();
            return user;
        },
        /**
         * 注销账号
         */
        closeAccount({ session, userId }) {
            const admin = this.readAdminUserBySession(session);
            const userIndex = this.accounts.findIndex(acc => acc.userId == userId);
            if (userIndex == -1) {
                throw new AccountError('用户不存在!');
            }
            this.onSaveDB();
            return this.accounts.splice(userIndex, 1);
        },
        /**
         * 设置账号有效期
         */
        accountDeadline({ session, userId, deadline }) {
            let dl = new Date(deadline);
            if (dl.toString().includes('Invalid')) dl = new Date(Number(deadline));
            if (dl.toString().includes('Invalid')) throw new AccountError('deadline 参数无效');
            const admin = this.readAdminUserBySession(session);
            const user = this.accounts.find(acc => acc.userId == userId);
            if (!user) throw new AccountError('用户不存在!');
            this.onSaveDB();
            return user.deadline = dl.getTime();
        },
        /**
         * 设置账号管理员权限
         */
        accountAdmin({ session, userId, isAdmin }) {
            const admin = this.readAdminUserBySession(session);
            if (!this.isSuperAdminUser(admin)) throw new AccountError('无权限执行该操作!');
            const user = this.accounts.find(acc => acc.userId == userId);
            if (!user) throw new AccountError('用户不存在!');
            this.onSaveDB();
            return user.isAdmin = !!isAdmin;
        },
        /**
         * 修改账号信息
         */
        updateAccount({ session, user }) {
            const oprUser = this.readUserBySession(session);
            const account = this.accounts.find(acc => acc.userId == user.userId);
            if (!account) throw new AccountError('用户不存在!');
            if (oprUser.userId != user.userId || oprUser.userId != account.userId) {
                // 管理员操作
                const admin = this.readAdminUserBySession(session);
                if (this.isSuperAdminUser(admin)) {
                    // 超级管理员
                    Object.keys(userType).filter(key => !imConfig.userUpdateExcludeKeysBySuperAdmin.includes(key)).forEach(key => {
                        if (user[key] != undefined) account[key] = user[key];
                    });
                } else {
                    // 普通管理员
                    Object.keys(userType).filter(key => !imConfig.userUpdateExcludeKeysByAdmin.includes(key)).forEach(key => {
                        if (user[key] != undefined) account[key] = user[key];
                    });
                }
            } else {
                // 用户自己修改
                Object.keys(userType).filter(key => !imConfig.userUpdateExcludeKeys.includes(key)).forEach(key => {
                    if (user[key] != undefined) account[key] = user[key];
                });
            }
            try {
                this.updateSession(account, this.readSessionByUserId(account.userId));
            } catch (error) {
                console.log('未更新session', error.message);
            }
            this.onSaveDB();
            return account;
        },
    }
}

/**
 * 解密
 * @param {string} txt 
 */
function decodeText(txt) {
    return globalUtils.decodeText(txt, imConfig.cryptoKey);
}
/**
 * 加密
 * @param {string} txt 
 */
function encodeText(txt) {
    return globalUtils.encodeText(txt, imConfig.cryptoKey);
}

/**
 * NodeJs使用
 * 解密字符串
 * @param {string} encryptedBase64 加密后的字符串Base64格式
 * @returns {string} 解密后的明文
 */
function decryptBase64(encryptedBase64) {
    // 32字节
    const key = '9a8b7c6d5e412f3a2b1c0d9e8f7a6b5c';
    // 固定 IV
    const iv = Buffer.from('9a8b7c6d5e4f3a2b1caa0d9e8f7a6b5c', 'hex');
    const encryptedBuffer = Buffer.from(encryptedBase64, 'base64');

    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    let decrypted = decipher.update(encryptedBuffer, null, 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}

/**
 * Html使用
 * 加密字符串
 * @param {string} text 要加密的明文
 * @returns {string} 加密后的字符串Base64格式
 */
function encryptToBase64(text) {
    const KEY = '9a8b7c6d5e412f3a2b1c0d9e8f7a6b5c';
    const IV = CryptoJS.enc.Hex.parse('9a8b7c6d5e4f3a2b1caa0d9e8f7a6b5c');
    const encrypted = CryptoJS.AES.encrypt(text, CryptoJS.enc.Utf8.parse(KEY), {
        iv: IV,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
    });
    return encrypted.toString();
}