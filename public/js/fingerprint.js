/**
 * Скрипт сбора отпечатка устройства (Fingerprint)
 * Выполняется на клиенте и передает данные на сервер.
 */

document.addEventListener('DOMContentLoaded', () => {
    // Функция для генерации простого хэша
    const simpleHash = (str) => {
        let hash = 0;
        if (str.length === 0) return hash;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return Math.abs(hash).toString(16);
    };

    // Собираем базовые данные
    const screenData = `${window.screen.width}x${window.screen.height}x${window.screen.colorDepth}`;
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const language = navigator.language;
    const userAgent = navigator.userAgent;
    const platform = navigator.platform;
    const cpuCores = navigator.hardwareConcurrency || 'unknown';
    const deviceMemory = navigator.deviceMemory || 'unknown';

    // Склеиваем в строку
    const rawFingerprint = `${screenData}|${timezone}|${language}|${userAgent}|${platform}|${cpuCores}|${deviceMemory}`;
    
    // Генерируем уникальный ID
    const fingerprintId = simpleHash(rawFingerprint);

    // Находим скрытое поле на странице регистрации и заполняем его
    const fingerprintInput = document.getElementById('fingerprint');
    if (fingerprintInput) {
        // Передаем сам ID и "сырые" данные в формате JSON
        fingerprintInput.value = JSON.stringify({
            id: fingerprintId,
            raw: rawFingerprint,
            screen: screenData,
            timezone: timezone,
            language: language,
            userAgent: userAgent,
            platform: platform,
            cores: cpuCores
        });
    }
});