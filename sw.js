// sw.js — Service Worker для офлайн-режима
const CACHE_NAME = 'music-player-v1';
const ASSETS = [
    '/music/',
    '/music/index.html',
    '/music/manifest.json'
];

// Устанавливаем Service Worker и кешируем файлы
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                return cache.addAll(ASSETS);
            })
            .then(() => self.skipWaiting())
    );
});

// Активируем и удаляем старые кеши
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(
                keys.filter(key => key !== CACHE_NAME)
                    .map(key => caches.delete(key))
            );
        })
    );
});

// Перехватываем запросы и отдаём из кеша
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(cachedResponse => {
                if (cachedResponse) {
                    return cachedResponse;
                }
                return fetch(event.request).then(response => {
                    // Кешируем новые файлы на лету
                    if (response && response.status === 200) {
                        const responseClone = response.clone();
                        caches.open(CACHE_NAME).then(cache => {
                            cache.put(event.request, responseClone);
                        });
                    }
                    return response;
                });
            })
            .catch(() => {
                // Если нет интернета и нет кеша — показываем офлайн-страницу
                return caches.match('/music/offline.html');
            })
    );
});
