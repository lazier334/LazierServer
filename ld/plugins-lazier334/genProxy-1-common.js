import { createGenProxy } from '../plugins/types/index.ts';

/**
 * 生成 proxy.js 的插件
 */
export default createGenProxy(async function genProxyDemo(funs) {
    // 全局提示使用，在导出的时候会传递一个空对象进来，在开发环境的插件proxy.js中被更改名称为 "obj" 
    // 在生产环境被更名为 "2随机数_5随机数"
    let GlobalParam = {};

    // 给插件增加其他功能可以把函数写在这里，全局 h对象 和 C变量对象
    funs.addFunctions({
        navigatorServiceWorkerRegister:
            /**
             * 工作服务注册
             */
            function () {
                const originalRegister = navigator.serviceWorker.register;
                navigator.serviceWorker.register = function (scriptURL, options) {
                    let ei = scriptURL.lastIndexOf("/");
                    if (-1 < ei) options.scope = scriptURL.substring(0, ei + 1);
                    // console.log('Service Worker 注册', scriptURL, options);
                    return originalRegister.call(navigator.serviceWorker, scriptURL, options).then(function (registration) {
                        // console.log('Service Worker 注册成功:', registration);
                        return registration;
                    }).catch(function (error) {
                        // console.error('Service Worker 注册失败:', error);
                        throw error;
                    });
                };
            },

        proxyAlert:
            /**
             * 代理 alert 函数，实际未使用
             * @deprecated 没有使用
             */
            function () {
                const orgAlert = alert;
                alert = function (msg) {
                    return orgAlert.call(this, arguments)
                }
            },

        urlHandlerInit:
            /**
             * 初始化url处理函数
             */
            function () {
                // 检测地址，并且修改地址
                function detectionUrl(url) {
                    // 读取当前的域名，锁定一级域名
                    let reUrl = url;
                    // 补全url
                    if (!reUrl.startsWith('http')) {
                        if (!reUrl.startsWith('/')) {
                            let pathname = location.pathname.split('/');
                            pathname.pop();
                            pathname.push(reUrl);
                            reUrl = pathname.join('/');
                        }
                        reUrl = location.origin + reUrl;
                    }
                    try {
                        let org = new URL(url);
                        // 操作修改 url
                        if (GlobalParam.domainStr) {
                            if (-1 < org.host.indexOf(GlobalParam.domainStr)) {
                                // 存在当前域名
                                org = new URL(reUrl);
                            } else {
                                // 修改域名，保留首层的子域名
                                let domain = org.host.split(".");
                                org.host = [domain[0]].concat(GlobalParam.domain).join(".");
                            }
                        } else {
                            // 目标域名为单域名(如 localhost)的情况下设置为当前域名
                            org.host = location.host;
                        }
                        reUrl = org.toString();

                        if (GlobalParam.forceHttps) {
                            if (!reUrl.startsWith("https")) {
                                if (reUrl.startsWith("http")) {
                                    reUrl = reUrl.replace("http", "https");
                                }
                            }
                        }
                    } catch (err) {
                        console.error(err)
                    }
                    // 可以 用于将 api.a.com 与 api-suf.a.com 替换成 api-suf.a.com
                    return reUrl.split('.').map((e, i) => i == 0 ? (e + (e.endsWith('-suf') ? '' : '-suf')) : e).join('.');
                }

                // 补全url
                function completeUrl(u) {
                    if (!u.startsWith('http://') && !u.startsWith('https://')) {
                        if (!u.startsWith('/')) {
                            let pathname = location.pathname.split('/');
                            pathname.pop();
                            pathname.push(u);
                            u = pathname.join('/');
                        } else if (!url.includes('://')) {
                            u = location.origin + u;
                        }
                    }
                    return u
                }

                // url处理列表
                const banPathnameList = [];
                function excludeUrl(url) {
                    let lu = new URL(url);
                    // 排除指定的 api路径
                    if (banPathnameList.includes(lu.pathname)) return;
                    // 排除 google
                    if (lu.href.includes('www.google')) return;
                    // 排除 sentry - 参数存在 'sentry_key=' 且api存在 'envelope' || 'store' 
                    if (lu.search.includes('sentry_key=') && (lu.pathname.includes('envelope') || lu.pathname.includes('store'))) return;
                    return url;
                }

                GlobalParam.handlerUrlList = [completeUrl, excludeUrl, detectionUrl];
                GlobalParam.handlerUrl = (url) => {
                    if (['about:blank'].includes(url)
                        || url.startsWith('javascript:')
                        || url.startsWith('blob:')) { }
                    else for (const handler of obj.handlerUrlList) {
                        if (!url) break;
                        url = handler(url);
                    }
                    if (!url) url = location.origin + '/null';
                    return url;
                }
            },
        urlHandlerInit_dev: {
            run(e) {
                let codeMapping = {
                    [`
                    try {
                        let org = new URL(url);
                        // 操作修改 url
                        if (GlobalParam.domainStr) {
                            if (-1 < org.host.indexOf(GlobalParam.domainStr)) {
                                // 存在当前域名
                                org = new URL(reUrl);
                            } else {
                                // 修改域名，保留首层的子域名
                                let domain = org.host.split(".");
                                org.host = [domain[0]].concat(GlobalParam.domain).join(".");
                            }
                        } else {
                            // 目标域名为单域名(如 localhost)的情况下设置为当前域名
                            org.host = location.host;
                        }
                        reUrl = org.toString();

                        if (GlobalParam.forceHttps) {
                            if (!reUrl.startsWith("https")) {
                                if (reUrl.startsWith("http")) {
                                    reUrl = reUrl.replace("http", "https");
                                }
                            }
                        }
                    } catch (err) {
                        console.error(err)
                    }
                    // 可以 用于将 api.a.com 与 api-suf.a.com 替换成 api-suf.a.com
                    return reUrl.split('.').map((e, i) => i == 0 ? (e + (e.endsWith('-suf') ? '' : '-suf')) : e).join('.');
`]: `
                    try {
                        let org = new URL(url);
                        reUrl = GlobalParam.domainUrl + org.toString().split(org.host).pop();
                    } catch (err) {
                        console.error('解析url时异常', err)
                    }
                    return reUrl;
`
                };
                // 拿到原始版本并格式化换行符
                let code = funs.formattedLineBreaks(e.urlHandlerInit.toString());
                Object.entries(codeMapping).forEach(([k, v]) => code = code.replace(funs.formattedLineBreaks(k), funs.formattedLineBreaks(v)));
                return funs.createFunction(code)
            }
        },

        proxyDocmentHeadAppendChild:
            /**
             * 可以代理`document.head.appendChild`函数  
             * 用于解除gtm标记
             */
            function () {
                const originalAppendChild = Element.prototype.appendChild;
                Element.prototype.appendChild = function (node) {
                    // js iframe
                    if (['SCRIPT', 'IFRAME'].includes(node.tagName) && node.src) {
                        node.src = GlobalParam.handlerUrl(node.src);
                    }
                    // css 
                    if (['LINK'].includes(node.tagName) && node.href) {
                        node.href = GlobalParam.handlerUrl(node.href);
                    }
                    return originalAppendChild.call(this, node);
                };
            },

        proxyElementAppendChild:
            /**
             * 可以代理`Element.prototype.appendChild`函数  
             * 用于解除gtm标记
             */
            function () {
                const originalAppendChild = Element.prototype.appendChild;
                Element.prototype.appendChild = function (node) {
                    // js iframe
                    if (['SCRIPT', 'IFRAME'].includes(node.tagName) && node.src) {
                        node.src = GlobalParam.handlerUrl(node.src);
                    }
                    // css 
                    if (['LINK'].includes(node.tagName) && node.href) {
                        node.href = GlobalParam.handlerUrl(node.href);
                    }
                    return originalAppendChild.call(this, node);
                };
            },

        proxyDocmentCreateElementSrcAndHref:
            /**
             * 可以代理 `document.createElement` 函数  
             * 用于重写 url 地址
             */
            function () {
                const originalCreateElement = document.createElement.bind(document);
                document.createElement = function (tagName) {
                    const element = originalCreateElement(tagName);

                    if (['SCRIPT', 'IMG', 'IFRAME', 'LINK', 'A'].includes(tagName.toUpperCase())) {
                        // 只代理 src 和 href 的 setter 和 getter
                        Object.defineProperties(element, {
                            'src': {
                                get: function () {
                                    return this.getAttribute('src');
                                },
                                set: function (value) {
                                    const processedValue = GlobalParam.handlerUrl(value);
                                    // 调用原始的属性设置或 setAttribute
                                    this.setAttribute('src', processedValue);
                                },
                                configurable: true,
                                enumerable: true
                            },
                            'href': {
                                get: function () {
                                    return this.getAttribute('href');
                                },
                                set: function (value) {
                                    const processedValue = GlobalParam.handlerUrl(value);
                                    this.setAttribute('href', processedValue);
                                },
                                configurable: true,
                                enumerable: true
                            }
                        });

                        // 也可以重写 setAttribute 方法
                        const originalSetAttribute = element.setAttribute.bind(element);
                        element.setAttribute = function (attrName, value) {
                            if (attrName === 'src' || attrName === 'href') {
                                value = GlobalParam.handlerUrl(value);
                            }
                            return originalSetAttribute(attrName, value);
                        };
                    }
                    return element;
                };
            },

        proxyXHRAndFetch:
            /**
             * 代理XHR和Fetch请求
             * 
             * @TODO WARNING: blob 类型无法使用
             * Uncaught InvalidStateError: Failed to read the 'responseText' property from 'XMLHttpRequest': The value is only accessible if the object's 'responseType' is '' or 'text' (was 'blob').  
             *    at XMLHttpRequest.<anonymous> (proxy.js:53:46)
             */
            function () {
                const originalXHR = window.XMLHttpRequest;
                // 1. 自定义 XHR 类，继承原生的 XMLHttpRequest
                class CustomXHR extends originalXHR {
                    constructor() {
                        // 调用原生构造函数
                        super();
                    }
                    // 2. 重写 open 方法
                    open(method, url, ...rest) {
                        // 对 URL 进行处理
                        const processedUrl = GlobalParam.handlerUrl(url);
                        // 不调用原生 open，相当于取消请求
                        if (!processedUrl) return;
                        // 调用原生的 open 方法
                        super.open(method, processedUrl, ...rest);
                        // 可选：你也可以在这里绑定事件监听等
                        // this.addEventListener('readystatechange', () => { ... });
                    }
                    // 可选：如果你还想劫持响应内容，可以重写其他方法或监听事件
                    // 比如：
                    // setRequestHeader(name, value) {
                    //     console.log('Set Header:', name, value);
                    //     super.setRequestHeader(name, value);
                    // }
                }
                // 3. 替换全局的 XMLHttpRequest 为我们的定制类
                window.XMLHttpRequest = CustomXHR;

                const originalFetch = window.fetch;
                window.fetch = function (...args) {
                    let [resource, config] = args;
                    if (typeof resource === 'string') {
                        resource = GlobalParam.handlerUrl(resource);
                    } else if (resource instanceof Request) {
                        let url = GlobalParam.handlerUrl(resource.url);
                        if (url) resource = new Request(url, config);
                        else resource = url;
                    }

                    if (!resource) return;
                    // 以下为处理返回值
                    // console.log("Fetch Request", resource);
                    return originalFetch.call(this, resource, config).then(response => {
                        // const clonedResponse = response.clone();
                        // clonedResponse.text().then(text => {
                        // console.log('Fetch Response:', text);
                        // });
                        return response;
                    });
                };
            },

        proxyWebSocket:
            /**
             * 代理 websocket
             */
            function () {
                // 重写ws的链接
                function modifyWebSocketUrl(originalUrl) {
                    return originalUrl;
                    // let u = new URL(originalUrl);
                    // u.host = 'localhost:3011'
                    // return u.href;
                }
                const OriginalWebSocket = window.WebSocket;
                // 手动强制拒绝重连
                let closeWS = false;
                class ProxyWebSocket extends OriginalWebSocket {
                    constructor(url, protocols) {
                        if (closeWS) {
                            super('ws://null');
                            this._isClosed = true;
                            return;
                        }
                        const modifiedUrl = modifyWebSocketUrl(url);

                        if (protocols !== undefined) {
                            super(modifiedUrl, protocols);
                        } else {
                            super(modifiedUrl);
                        }
                        this.addEventListener('message', (event) => {
                            // 当收到关闭信息后，主动屏蔽ws重连
                            if (event.data == '-1') {
                                closeWS = true;
                                this.close();
                            }
                        });
                    }
                }
                window.WebSocket = ProxyWebSocket;
            },
        proxyCreateObjectURL:
            /**
             * 代理 `URL.createObjectURL` 函数  
             * 给blob脚本增加debugger
             */
            function () {
                const originalCreateObjectURL = URL.createObjectURL;
                URL.createObjectURL = function (blob) {
                    const blobUrl = originalCreateObjectURL.call(this, blob);
                    // console.log('Captured Blob URL:', blobUrl);
                    // console.log('Blob object:', blob);
                    debugger
                    return blobUrl;
                };
            },

        clearLoopDebugger: '可以解除无限debugger',
        clearLoopDebugger_dev:
            /**
             * 可以解除无限debugger
             */
            function () {
                var constructorHook = constructor;
                Function.prototype.constructor = function (s) {
                    if (s == "debugger") {
                        return function () { }
                    }
                    return constructorHook(s);
                }
                const setInterval = window.setInterval;
                window.setInterval = function (fun, time) {
                    if (fun && fun.toString) {
                        var funString = fun.toString();
                        if (funString.indexOf('debugger') > -1) return;
                        if (funString.indexOf('window.close') > -1) return;
                    }
                    return setInterval(fun, time);
                }
            },
        removeScriptElement:
            /**
             * 删除自身script标签元素
             */
            function () {
                document.currentScript.parentNode.removeChild(document.currentScript)
            },
    })
})