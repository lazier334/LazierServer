// 导入脚本
importScripts('/res/workbox/releases/7.3.0/workbox-sw.js');
const ver = '2';
var debugMode = false;
var showLog = console.log;
if (!debugMode) showLog = () => { };

/**
 * 只缓存非 `/im/`、`/user/`、`/uploads/`、`/system/` 路径的 GET 请求
 * @param {*} params 
 * @returns 
 */
function registerRouteNotCache(params) {
    const { request, url, sameOrigin, event } = params;
    return request.method === 'GET'
        && request.mode !== 'navigate'
        && !url.pathname.startsWith('/user/')
        && !url.pathname.startsWith('/im/')
        && !url.pathname.startsWith('/uploads/')
        && !url.pathname.startsWith('/system/')
}
// 配置 Workbox 开发模式日志
workbox.setConfig({
    modulePathPrefix: '/res/workbox/releases/7.3.0/',
    debug: debugMode // 生产环境设为 false
});

// 自定义缓存策略：仅在缓存无效时更新
// 修复版自定义策略
class CacheFirstWithValidation extends workbox.strategies.CacheFirst {
    constructor(options) {
        super({
            ...options,
            fetchOptions: {
                mode: 'cors',      // 强制CORS模式
                credentials: 'omit' // 根据CDN配置选择是否携带凭证
            }
        });
    }
    async _handle(request, handler) {
        // 1. 使用正确的缓存访问方式
        const cache = await caches.open(this.cacheName);
        const cachedResponse = await cache.match(request);

        // 2. 验证缓存内容
        if (cachedResponse) {
            try {
                const responseClone = cachedResponse.clone();
                const responseText = await responseClone.text();

                // 检查内容是否有效（非空且不是空字符串）
                if (responseText && responseText.trim() !== '') {
                    return cachedResponse;
                }
            } catch (err) {
                console.warn('缓存内容验证失败:', err);
            }
        }

        // 3. 缓存无效时从网络获取
        {
            // 覆盖为安全的CORS请求
            const safeRequest = new Request(request.url, {
                headers: request.headers,
                mode: 'cors',            // 强制覆盖为cors
                credentials: 'omit',     // 必须与CDN CORS配置匹配
                redirect: 'follow'
            });

            let networkResponse = await fetch(safeRequest);

            // opaque 响应 是无法读取，实际上有内容，直接返回就可以

            // 只缓存成功或304的响应
            if (networkResponse.ok || networkResponse.status === 304) {
                showLog('缓存-->', request.url, networkResponse)
                await cache.put(request, networkResponse.clone());
            }
            showLog('networkResponse响应', request.url, networkResponse)

            return networkResponse;
        }
    }
}

// 核心：缓存所有请求的通用策略
const cacheAllStrategy = new CacheFirstWithValidation({
    cacheName: 'all-requests-cache-v' + ver,
    plugins: [
        // 确保缓存不超过 1000 个条目，最长 30 天
        new workbox.expiration.ExpirationPlugin({
            maxEntries: 1000,
            maxAgeSeconds: 30 * 24 * 60 * 60, // 30 天
            purgeOnQuotaError: true // 磁盘空间不足时自动清理
        }),
        // 缓存成功状态码的响应（包括 200, 304 等）
        new workbox.cacheableResponse.CacheableResponsePlugin({
            statuses: [0, 200, 304]
        })
    ]
});

// 不缓存的规则在 registerRouteNotCache 里面
workbox.routing.registerRoute(registerRouteNotCache,
    async ({ event, request }) => {
        try {
            // 优先从缓存返回，同时后台更新缓存
            return await cacheAllStrategy.handle({ event, request });
        } catch (err) {
            return fetch(event.request); // 降级到普通 fetch
        }
    }
);

// 特殊处理导航请求（HTML 页面）
workbox.routing.registerRoute(
    ({ request }) => request.mode === 'navigate',
    new workbox.strategies.NetworkFirst({
        cacheName: 'html-cache-v' + ver,
        networkTimeoutSeconds: 3, // 3秒超时
        fetchOptions: {
            redirect: 'follow',        // 必须允许重定向
        },
        fallbackToCache: true   // 超时后使用缓存
    })
);

// 设置全局异常处理
workbox.routing.setCatchHandler(async ({ event, request }) => {
    console.error('全局异常捕获:', event);
    // 如果是导航请求，降级到原生请求
    try {
        return await fetch(event.request, { redirect: 'follow' });
    } catch (error) {
        console.log('原生请求也请求失败!', error)
        // 如果是
        if (error.message.includes('Failed to fetch') && request.mode === 'navigate') {
            // 启动html跳转模式
            let url = new URL(event.request.url);
            url.searchParams.set('redirectApi', 'html');
            return await fetch(url.href);
        }
        throw error;
    }
});

// ================= 生命周期管理 =================
// 安装阶段 - 预缓存关键资源
workbox.precaching.precacheAndRoute([
    // { url: '/', revision: '1' },
    // { url: '/index.html', revision: '1' },
    // { url: '/offline.html', revision: '1' },
    // 添加其他关键静态资源...
]);

// 激活阶段 - 清理旧缓存
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((name) => !name.includes('v1')) // 保留当前版本缓存
                    .map((name) => caches.delete(name))
            );
        }).then(() => {
            // console.log('旧缓存已清理');
            return clients.claim(); // 立即控制所有客户端
        })
    );
});

// // 离线回退处理
// workbox.routing.setCatchHandler(async ({ event }) => {
//     if (event.request.destination === 'document') {
//         return caches.match('/offline.html');
//     }
//     return Response.error();
// });

// 推送缓存更新通知
self.addEventListener('message', (event) => {
    if (event.data === 'skipWaiting') {
        self.skipWaiting();
    }
});