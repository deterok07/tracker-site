/**
 * Скрипт трекера активности пользователей
 * Отправляет данные о действиях на сервер (в будущий API /api/track)
 */

(function() {
    // ID сессии (генерируется при загрузке страницы)
    const sessionId = Math.random().toString(36).substring(2, 15);
    const startTime = Date.now();

    // Функция отправки данных на сервер
    const sendTrackData = (action, details = {}) => {
        const payload = {
            sessionId: sessionId,
            action: action,
            url: window.location.pathname,
            timestamp: new Date().toISOString(),
            details: details,
            timeSpent: Math.round((Date.now() - startTime) / 1000) // в секундах
        };

        // Используем navigator.sendBeacon для отправки данных, даже если пользователь уходит со страницы
        // Если sendBeacon не поддерживается, используем fetch
        const apiUrl = '/api/track';
        
        if (navigator.sendBeacon) {
            const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
            navigator.sendBeacon(apiUrl, blob);
        } else {
            fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
                keepalive: true // Позволяет запросу завершиться при закрытии страницы
            }).catch(() => {}); // Игнорируем ошибки, чтобы не мешать пользователю
        }
    };

    // 1. Трекинг загрузки страницы
    sendTrackData('page_view', { title: document.title });

    // 2. Трекинг кликов по ссылкам и кнопкам
    document.addEventListener('click', (e) => {
        const target = e.target.closest('a, button, input[type="submit"]');
        if (target) {
            const tagName = target.tagName.toLowerCase();
            const text = (target.innerText || target.value || 'Без текста').trim().substring(0, 50);
            const href = target.href || 'no-href';
            
            sendTrackData('click', {
                tag: tagName,
                text: text,
                href: href
            });
        }
    });

    // 3. Трекинг ухода со страницы (фиксация времени выхода)
    window.addEventListener('beforeunload', () => {
        sendTrackData('page_leave');
    });

    // 4. Периодический пинг (каждые 30 секунд), чтобы админ видел, что юзер еще на сайте
    setInterval(() => {
        sendTrackData('heartbeat');
    }, 30000);

})();
