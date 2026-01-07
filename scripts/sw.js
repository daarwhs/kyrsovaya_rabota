// scripts/sw.js
// Service Worker для MindCare (PWA оффлайн-режим)
// Версия: v2.0.0 — адаптирована под новую структуру проекта (2026)

const CACHE_NAME = 'mindcare-v2.0.0';

const CACHE_URLS = [
    '/',                        // Главная страница
    '/index.html',

    // Страницы
    '/pages/articles/articles.html',
    '/pages/contacts/contacts.html',
    '/pages/exercises/exercises.html',
    '/pages/mood-tracker/mood-tracker.html',
    '/pages/tests/tests.html',

    // Основные стили
    '/styles/variables/variables.css',
    '/styles/base/buttons.css',
    '/styles/base/images.css',
    '/styles/base/notification.css',
    '/styles/utils/readability.css',
    '/styles/utils/responsive.css',
    '/styles/main.css',  // Главная точка входа CSS (бывший style.css)

    // Скрипты
    '/scripts/utils/utils.js',
    '/scripts/main.js',
    '/scripts/sw.js',    // Сам себя кэшируем

    // Данные
    '/data/articles-data.js',   // если используешь JS-данные
    '/data/contacts-data.js',
    '/data/articles.json',      // если есть JSON-версия
    '/data/contacts.json',

    // Иконки и манифест (предполагаемые пути — подправь, если иначе)
    '/images/interface/logo.jpg',
    '/images/interface/icon-192.png',   // если есть PWA иконки
    '/images/interface/icon-512.png',
    '/manifest.json',

    // Шрифты (если подключаешь локальные)
    // '/fonts/Roboto-Regular.woff2',
    // '/fonts/fonts.css',
];

// Установка: кэшируем всё необходимое
self.addEventListener('install', (event) => {
    console.log('[SW] Установка Service Worker...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('[SW] Кэширование ресурсов');
                return cache.addAll(CACHE_URLS.map(url => new Request(url, { credentials: 'same-origin' })));
            })
            .then(() => self.skipWaiting())
    );
});

// Активация: удаляем старые кэши
self.addEventListener('activate', (event) => {
    console.log('[SW] Активация нового Service Worker');
    const cacheWhitelist = [CACHE_NAME];

    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (!cacheWhitelist.includes(cacheName)) {
                        console.log('[SW] Удаление старого кэша:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Перехват запросов: сначала кэш, потом сеть
self.addEventListener('fetch', (event) => {
    // Игнорируем запросы к chrome-extension:// и другим внешним
    if (!event.request.url.startsWith('http')) return;

    // Стратегия: Cache First, fallback to Network
    event.respondWith(
        caches.match(event.request).then(cachedResponse => {
            if (cachedResponse) {
                // Возвращаем из кэша
                return cachedResponse;
            }

            // Если нет в кэше — идём в сеть
            return fetch(event.request).then(networkResponse => {
                // Кэшируем успешные GET-запросы (опционально, можно ограничить)
                if (event.request.method === 'GET' && networkResponse && networkResponse.status === 200) {
                    const responseToCache = networkResponse.clone();
                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(event.request, responseToCache);
                    });
                }
                return networkResponse;
            }).catch(() => {
                // Если и сеть не работает — можно показать оффлайн-страницу
                if (event.request.destination === 'document') {
                    return caches.match('/index.html');
                }
            });
        })
    );
});

// Дополнительно: обработка push-уведомлений (если планируешь)
self.addEventListener('push', (event) => {
    const options = {
        body: event.data ? event.data.text() : 'Пора позаботиться о себе 💙',
        icon: '/images/interface/logo.jpg',
        badge: '/images/interface/icon-192.png',
        vibrate: [100, 50, 100],
        data: { url: '/' }
    };

    event.waitUntil(
        self.registration.showNotification('MindCare', options)
    );
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(
        clients.openWindow(event.notification.data.url || '/')
    );
});