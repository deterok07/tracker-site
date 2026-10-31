const express = require('express');
const router = express.Router();
const db = require('../models/db');

// Прием данных от трекера
router.post('/', async (req, res) => {
    try {
        const { sessionId, action, url, timestamp, details, timeSpent } = req.body;

        // Получаем IP-адрес пользователя (с учетом прокси)
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

        // Сохраняем лог в базу данных
        await db.saveLog({
            sessionId,
            action,
            url,
            timestamp: timestamp || new Date().toISOString(),
            details: JSON.stringify(details || {}),
            timeSpent: timeSpent || 0,
            ip: ip
        });

        // Отвечаем 200 OK (sendBeacon не ждет ответа, но для fetch это важно)
        res.status(200).send('OK');
    } catch (error) {
        console.error('Ошибка сохранения лога:', error);
        // Не возвращаем ошибку 500, чтобы не засорять консоль браузера пользователя
        res.status(200).send('OK'); 
    }
});

module.exports = router;
