const express = require('express');
const router = express.Router();
const db = require('../models/db');
const adminOnly = require('../middleware/adminOnly');

// Все маршруты в этом файле требуют прав администратора
router.use(adminOnly);

// Получение всех данных для дашборда (пользователи, логи, отпечатки)
router.get('/data', async (req, res) => {
    try {
        // Запрашиваем данные из БД параллельно для скорости
        const [users, logs, fingerprints] = await Promise.all([
            db.getAllUsers(),
            db.getAllLogs(),
            db.getAllFingerprints()
        ]);

        // Отправляем JSON
        res.json({
            users: users,
            logs: logs,
            fingerprints: fingerprints
        });

    } catch (error) {
        console.error('Ошибка получения данных для админки:', error);
        res.status(500).json({ message: 'Ошибка загрузки данных' });
    }
});

// (Опционально) Маршрут для удаления пользователя
router.delete('/user/:id', async (req, res) => {
    try {
    db.deleteUser(req.params.id);
        res.json({ message: 'Пользователь удален' });
    } catch (error) {
        res.status(500).json({ message: 'Ошибка удаления' });
    }
});

module.exports = router;