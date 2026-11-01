const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../models/db');

// --- РЕГИСТРАЦИЯ ---
router.post('/register', async (req, res) => {
    try {
        const { name, phone, password, consent, fingerprint } = req.body;

        // 1. Проверка обязательного согласия
        if (!consent || consent === 'false') {
            return res.status(400).json({ message: 'Необходимо согласие на обработку данных' });
        }

        // 2. Проверка, существует ли уже такой номер
        const existingUser = await db.getUserByPhone(phone);
        if (existingUser) {
            return res.status(400).json({ message: 'Пользователь с таким номером уже существует' });
        }

        // 3. Хэширование пароля (bcrypt)
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 4. Создание пользователя
        const newUser = await db.createUser({
            name,
            phone,
            password: hashedPassword,
            role: 'user',
            consent: true
        });

        // 5. Сохранение отпечатка устройства
        if (fingerprint) {
            const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
            await db.saveFingerprint(newUser.id, fingerprint, ip);
        }

        // 6. Создаем сессию
        req.session.user = {
            id: newUser.id,
            name: newUser.name,
            phone: newUser.phone,
            role: newUser.role
        };

        res.status(201).json({ message: 'Регистрация успешна', role: newUser.role });

    } catch (error) {
        console.error('Ошибка регистрации:', error);
        res.status(500).json({ message: 'Внутренняя ошибка сервера' });
    }
});

// --- ВХОД ---
router.post('/login', async (req, res) => {
    try {
        const { login, password } = req.body;

        // 1. Проверка на администратора (из .env)
        if (login === process.env.ADMIN_LOGIN && password === process.env.ADMIN_PASSWORD) {
            req.session.user = { id: 0, name: 'Administrator', phone: 'admin', role: 'admin' };
            return res.json({ message: 'Вход выполнен', role: 'admin' });
        }

        // 2. Проверка обычного пользователя
        const user = await db.getUserByPhone(login);
        if (!user) {
            return res.status(401).json({ message: 'Неверный логин или пароль' });
        }

        // Проверка пароля (bcrypt)
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Неверный логин или пароль' });
        }

        // 3. Создаем сессию
        req.session.user = {
            id: user.id,
            name: user.name,
            phone: user.phone,
            role: user.role
        };

        res.json({ message: 'Вход выполнен', role: user.role });

    } catch (error) {
        console.error('Ошибка входа:', error);
        res.status(500).json({ message: 'Внутренняя ошибка сервера' });
    }
});

// --- ВЫХОД ---
router.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) console.error('Ошибка при выходе:', err);
        res.clearCookie('connect.sid'); // Стандартное имя куки для express-session
        res.redirect('/');
    });
});

module.exports = router;