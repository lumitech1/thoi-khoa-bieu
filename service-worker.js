// service-worker.js

const CACHE_NAME = 'cache-ngoai-tuyen-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/style.css',
    '/script.js',
    '/assets/images/logo.png',
    '/assets/images/facebook.png',
    '/assets/images/background.jpg',
    '/assets/images/phone.png',
    '/assets/images/play.gif',
    '/assets/images/study.gif',
];

// Sự kiện install - lưu trữ các file vào cache
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
        .then(cache => {
            console.log('Đã mở cache');
            return cache.addAll(urlsToCache);
        })
    );
});

// Sự kiện fetch - phục vụ nội dung từ cache khi offline
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
        .then(response => {
            return response || fetch(event.request);
        })
    );
});

// Sự kiện activate - xóa cache cũ khi có bản mới
self.addEventListener('activate', event => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (!cacheWhitelist.includes(cacheName)) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});
