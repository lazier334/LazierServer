/**
 * @param {import('./libs/baseImport.js')}}
 */
export default async function sysStartAddAppStack({ fs, path, config, app }) {
    // 方案：覆写 response.body 的 setter
    const originalBody = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(app.response), 'body')
    const Setter = originalBody.set;
    const Getter = originalBody.get;
    const lc = {
        errorName: 'Stack Information',
        stackKeyName: 'x-set-stack',
        headerMaxLen: 4000,
        cookieMaxAge: 60 * 1000,
    }

    Object.defineProperty(app.response, 'body', {
        get() {
            return Getter.call(this);
        },
        set(value) {
            if (config.switch.openAddAppStack) {
                let stack = new Error(lc.errorName).stack;
                try {
                    // 拿到当前的文件路径
                    stack = encodeURIComponent(stack);
                    if (stack.length <= lc.headerMaxLen) {
                        this.ctx.set(lc.stackKeyName, stack);
                    } else {
                        this.ctx.cookies.set(lc.stackKeyName, stack, { httpOnly: true, maxAge: lc.cookieMaxAge });
                    }
                } catch (e) {
                    console.error('Hook Stack Error:', e);
                }
            }
            return Setter.call(this, value);
        },
        configurable: true,
        enumerable: true
    });
}