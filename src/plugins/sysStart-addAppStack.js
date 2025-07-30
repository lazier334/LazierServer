/**
 * @param {import('../libs/config.js') & { app: import('koa') }}
 */
export default async function sysStartAddAppStackc({ fs, path, config, app }) {
    // 方案：覆写 response.body 的 setter
    const originalBodySetter = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(app.response), 'body').set;
    const lc = {
        errorName: 'Stack Information',
        stackKeyName: 'x-set-stack',
        headerMaxLen: 4000,
        cookieMaxAge: 60 * 1000,
    }

    Object.defineProperty(app.response, 'body', {
        set(value) {
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
            originalBodySetter.call(this, value);
        },
        configurable: true,
        enumerable: true
    });
}