const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
// Заглушка для БД (заменим на реальную на следующем шаге)
const db = require('../models/db'); 

// Функция для генерации JWT токена
const generateToken = (user) => {
    return jwt.sign(
        { id: user.id, role: user.role, phone: user.phone },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
    );
};

// --- РЕГИСТРАЦИЯ ---
router.post('/register', async (req, res) => {
    try {
        const { name, phone, password, consent, fingerprint } = req.body;

        // 1. Проверка обязательного согласия на обработку данных
        if (!consent || consent === 'false') {
            return res.status(400).json({ message: 'Необходимо согласие на обработку данных' });
        }

        // 2. Проверка, существует ли уже такой номер
        const existingUser =  db.getUserByPhone(phone);
        if (existingUser) {
            return res.status(400).json({ message: 'Пользователь с таким номером уже существует' });
        }

        // 3. Хэширование пароля (для простоты используем base64, в идеале - bcrypt)
        // Внимание: для реального проекта используйте bcrypt!
        const hashedPassword = Buffer.from(password).toString('base64');

        // 4. Создание пользователя
        const newUser =  db.createUser({
            name,
            phone,
            password: hashedPassword,
            role: 'user',
            consent: true
        });

        // 5. Сохранение отпечатка устройства (если передан)
        if (fingerprint) {
            await db.saveFingerprint(newUser.id, fingerprint);
        }

        // 6. Генерация токена и установка куки
        const token = generateToken(newUser);
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 24 * 60 * 60 * 1000 // 24 часа
        });

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
            const adminUser = { id: 0, role: 'admin', phone: 'admin' };
            const token = generateToken(adminUser);
            
            res.cookie('token', token, { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 });
            return res.json({ message: 'Вход выполнен', role: 'admin' });
        }

        // 2. Проверка обычного пользователя
        const user = await db.getUserByPhone(login);
        if (!user) {
            return res.status(401).json({ message: 'Неверный логин или пароль' });
        }

        // Проверка пароля (сравниваем с base64)
        const hashedPassword = Buffer.from(password).toString('base64');
        if (user.password !== hashedPassword) {
            return res.status(401).json({ message: 'Неверный логин или пароль' });
        }

        // 3. Успешный вход
        const token = generateToken(user);
        res.cookie('token', token, {
            httpOnly: true,
            maxAge: 24 * 60 * 60 * 1000
        });

        res.json({ message: 'Вход выполнен', role: user.role });

    } catch (error) {
        console.error('Ошибка входа:', error);
        res.status(500).json({ message: 'Внутренняя ошибка сервера' });
    }
});

// --- ВЫХОД ---
router.get('/logout', (req, res) => {
    res.clearCookie('token');
    res.redirect('/');
});

module.exports = router;
