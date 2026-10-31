const express = require('express');
const router = express.Router();
const db = require('../models/db');

// Прием отпечатка устройства
router.post('/', async (req, res) => {
    try {
        const { fingerprintData } = req.body;
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

        if (!fingerprintData) {
            return res.status(400).json({ message: 'Данные отпечатка отсутствуют' });
        }

        // Сохраняем в БД (привязка к user_id будет null, если это просто визит)
        await db.saveFingerprint(null, fingerprintData, ip);
        
        res.status(200).json({ message: 'Отпечаток сохранен' });
    } catch (error) {
        console.error('Ошибка сохранения отпечатка:', error);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

module.exports = router;