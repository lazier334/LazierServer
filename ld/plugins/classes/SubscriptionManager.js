/**
 * // 定义一个订阅管理器
 * // 创建订阅管理器实例
 * const sm = new SubscriptionManager();
 * 
 * // 示例对象
 * const user = sm.createObservableObject({ id: 1, name: 'Alice' });
 * const topic = sm.createObservableObject({ id: 101, title: 'Node.js' });
 * 
 * // 示例 connect 对象
 * const connect = [
 *     user,
 *     topic
 * ];
 * 
 * // 订阅 user 和 topic 的更改
 * const sym = sm.subscribeList(connect, (connect, changeDetails) => {
 *     console.log(`Connect ${connect.id} notified of user change:`, changeDetails);
 * });
 * 
 * // 模拟更改 user 和 topic
 * user.name = 'Bob'; // 触发通知
 * topic.title = 'JavaScript'; // 触发通知
 * 
 * sm.unsubscribeList(connect, sym);
 */
export class SubscriptionManager {
    constructor() {
        this.subscriptions = new Map();
    }

    /**
     * 订阅
     * @param {object} object 
     * @param {symbol | string} key 
     * @param {(changeDetails:{prop:string, oldValue:any, newValue:any})=>void} callback 
     */
    subscribe(object, key, callback) {
        if (!this.subscriptions.has(object)) {
            this.subscriptions.set(object, {});
        }
        this.subscriptions.get(object)[key] = callback;
    }

    /**
     * 订阅整个列表
     * @param {[object]} objectList 
     * @param {(changeDetails:{prop:string, oldValue:any, newValue:any})=>void} callback 
     * @returns 
     */
    subscribeList(objectList, callback) {
        if (Array.isArray(objectList)) {
            const sym = Symbol(callback);
            objectList.forEach(obj => this.subscribe(obj, sym, callback))
            return sym;
        } else {
            throw new Error('objectList参数不是一个数组!')
        }
    }

    /**
     * 取消订阅
     * @param {object} object 
     * @param {symbol | string} key 
     */
    unsubscribe(object, key) {
        if (this.subscriptions.has(object)) {
            delete this.subscriptions.get(object)[key];
            if (Object.keys(this.subscriptions.get(object)).length === 0) {
                this.subscriptions.delete(object);
            }
        }
    }

    /**
     * 取消订阅整个列表
     * @param {[object]} objectList 
     * @param {symbol | string} key 
     */
    unsubscribeList(objectList, sym) {
        if (Array.isArray(objectList)) {
            objectList.forEach(obj => this.unsubscribe(obj, sym))
        } else {
            throw new Error('objectList参数不是一个数组!')
        }
    }

    /**
     * 
     * @param {*} object 
     * @param {{prop:string, oldValue:any, newValue:any}} changeDetails 
     */
    notify(object, changeDetails) {
        if (this.subscriptions.has(object)) {
            let callbackMaps = this.subscriptions.get(object);
            Object.getOwnPropertySymbols(callbackMaps).forEach(key => {
                callbackMaps[key](changeDetails);
            });
        }
    }

    /**
     * 创建一个可观察对象的代理工厂
     * 
     * @template T
     * @param {T} target - 需要被代理的目标对象
     * @returns {T} - 返回一个代理对象，用于监听属性的更改
     * 
     * 功能说明：
     * 1. 拦截对象的 `set` 操作，当对象的属性发生更改时触发。
     * 2. 在属性更改时，调用 `notify` 方法通知所有订阅者。
     * 3. 提供对目标对象的透明代理，其他操作（如读取属性）不受影响。
     * 
     * 使用场景：
     * - 需要对对象的属性更改进行监听并触发回调。
     * - 结合订阅管理器，实现对多个对象的统一管理。
     */
    createObservableObject(target) {
        let that = this;
        const proxy = new Proxy(target, {
            set(obj, prop, value) {
                const oldValue = obj[prop];
                obj[prop] = value;

                // 通知订阅者
                that.notify(proxy, { prop, oldValue, newValue: value });
                return true;
            }
        });
        return proxy
    }

}

export default SubscriptionManager;