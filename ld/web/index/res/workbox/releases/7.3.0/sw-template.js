/*
    当前文件 `sw.js` : 缓存所有请求的 Workbox 实现，需要放到根目录去
    在html中的使用方式
    ```html
        <!-- 简易使用 -->
        <script type="module">
            import { Workbox } from '/res/workbox/releases/7.3.0/workbox-window.prod.mjs';
            if ('serviceWorker' in navigator) {
                const wb = new Workbox('/sw.js');
                wb.register().then(registration => console.log('SW 注册成功'))
                    .catch(err => console.error('SW 注册失败:', err));;
            }
        </script>

        <!-- 清理缓存 -->
        <script>
            // 清除缓存的函数
            function clearCaches() {
                return (async () => {
                    try {
                        // 1. 取消注册所有 Service Worker
                        const registrations = await navigator.serviceWorker.getRegistrations();
                        for (const registration of registrations) {
                            await registration.unregister();
                            console.log('Service Worker 已取消注册:', registration.scope);
                        }
                        // 2. 清理所有缓存
                        const cacheNames = await caches.keys();
                        for (const cacheName of cacheNames) {
                            await caches.delete(cacheName);
                            console.log(`已删除缓存: ${cacheName}`);
                        }
                        console.log('SW清理成功');
                    } catch (err) {
                        console.error('SW清理失败:', err);
                        throw err;
                    }
                })();
            }
        </script>

        <!-- 进阶使用，可以通过 localStorage 存储里的 workboxStatus 来控制开关缓存，需要刷新生效 -->
        <script type="module">
            import { Workbox } from '/res/workbox/releases/7.3.0/workbox-window.prod.mjs';
            let openWorkbox = true;
            try {
                openWorkbox = JSON.parse(localStorage.getItem('workboxStatus'));
            } catch (error) { }
            if (openWorkbox) {
                if ('serviceWorker' in navigator) {
                    const wb = new Workbox('/sw.js');

                    wb.register().then(registration => console.log('SW 注册成功'))
                        .catch(err => console.error('SW 注册失败:', err));;
                }
            } else {
                // 注销所有 workbox
                if ('serviceWorker' in navigator) {
                    navigator.serviceWorker.getRegistrations().then(registrations => {
                        for (const registration of registrations) {
                            registration.unregister().then(success => {
                                if (success) {
                                    console.log('SW 注销成功:', registration.scope);
                                } else {
                                    console.warn('SW 注销失败:', registration.scope);
                                }
                            });
                        }
                    }).catch(err => {
                        console.error('获取 SW 注册信息失败:', err);
                    });
                }
            }
        </script>
    ```
*/
// 导入脚本
importScripts('/res/workbox/releases/7.3.0/workbox-sw.js');

// 配置 Workbox 开发模式日志
workbox.setConfig({
    modulePathPrefix: '/res/workbox/releases/7.3.0/',
    debug: false // 生产环境设为 false
});
// 自定义缓存策略：仅在缓存无效时更新
// 修复版自定义策略
class CacheFirstWithValidation extends workbox.strategies.CacheFirst {
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
        try {
            const networkResponse = await fetch(request);

            // 只缓存成功的响应
            if (networkResponse.ok) {
                await cache.put(request, networkResponse.clone());
            }

            return networkResponse;
        } catch (err) {
            // 网络失败时返回可能存在的旧缓存
            return cachedResponse || Response.error();
        }
    }
}

// 核心：缓存所有请求的通用策略
const cacheAllStrategy = new CacheFirstWithValidation({
    cacheName: 'all-requests-cache-v1',
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

// 拦截所有 GET 请求
workbox.routing.registerRoute(
    ({ request }) => request.method === 'GET',
    async ({ event, request }) => {
        try {
            // 优先从缓存返回，同时后台更新缓存
            return await cacheAllStrategy.handle({ event, request });
        } catch (err) {
            console.error('缓存处理失败:', err);
            return fetch(request); // 降级到普通 fetch
        }
    }
);

// 特殊处理导航请求（HTML 页面）
workbox.routing.registerRoute(
    ({ request }) => request.mode === 'navigate',
    new workbox.strategies.NetworkFirst({
        cacheName: 'html-cache-v1',
        networkTimeoutSeconds: 3, // 3秒超时
        fallbackToCache: true   // 超时后使用缓存
    })
);

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

// 离线回退处理
workbox.routing.setCatchHandler(async ({ event }) => {
    if (event.request.destination === 'document') {
        return caches.match('/offline.html');
    }
    return Response.error();
});

// 推送缓存更新通知
self.addEventListener('message', (event) => {
    if (event.data === 'skipWaiting') {
        self.skipWaiting();
    }
});