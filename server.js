require('dotenv').config();
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');

// Инициализация базы данных (создадим позже в models/db.js)
// Пока используем заглушку, чтобы сервер запустился
let db;
try {
    db = require('./models/db');
    console.log('База данных успешно подключена.');
} catch (error) {
    console.warn('Внимание: models/db.js не найден. Сервер запустится без БД (создайте его на следующем шаге).');
}

const app = express();
const PORT = process.env.PORT || 3000;

// --- MIDDLEWARE ---
app.use(express.json()); // Парсинг JSON (для API)
app.use(express.urlencoded({ extended: true })); // Парсинг форм
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public'))); // Статика (CSS, JS, HTML)
app.use('/admin', express.static(path.join(__dirname, 'admin')));
// Middleware для логирования запросов (заготовка для трекера)
app.use((req, res, next) => {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const time = new Date().toISOString();
    // Позже здесь будет запись в БД (трекер)
    console.log(`[${time}] ${req.method} ${req.url} - IP: ${ip}`);
    next();
});

// --- ROUTES (Маршруты) ---

// 1. Главная страница (Агитация WiFi провайдера)
app.get('/', (req, res) => {
    // Проверяем, есть ли уже кука авторизации
    const token = req.cookies.token;
    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            if (decoded.role === 'admin') {
                return res.redirect('/admin/dashboard.html');
            } else {
                return res.redirect('/welcome.html');
            }
        } catch (e) {
            res.clearCookie('token');
        }
    }
    // Если не авторизован, отдаем index.html
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Подключение роутов (будут созданы на следующих этапах)
app.use('/api/auth', require('./routes/auth'));
app.use('/api/track', require('./routes/track'));
app.use('/api/fingerprint', require('./routes/fingerprint'));
app.use('/api/admin', require('./routes/admin'));

// Защита страницы админа (раздача HTML файла)
app.get('/admin/dashboard.html', (req, res) => {
    const token = req.cookies.token;
    if (!token) return res.redirect('/login.html');
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded.role === 'admin') {
            res.sendFile(path.join(__dirname, 'admin', 'dashboard.html'));
        } else {
            res.status(403).send('Доступ запрещен. Вы не администратор.');
        }
    } catch (e) {
        res.redirect('/login.html');
    }
});

// Обработка 404 (Страница не найдена)
app.use((req, res) => {
    res.status(404).send('Страница не найдена (404)');
});

// --- ЗАПУСК СЕРВЕРА ---
app.listen(PORT, '0.0.0.0', () => {
    console.log(`=================================`);
    console.log(`Сервер запущен на порту ${PORT}`);
    console.log(`Для доступа с других устройств используйте IP вашего телефона`);
    console.log(`http://<IP_ТЕЛЕФОНА>:${PORT}`);
    console.log(`=================================`);
});