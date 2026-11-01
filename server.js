require('dotenv').config();
const express = require('express');
const path = require('path');
const session = require('express-session');
const cookieParser = require('cookie-parser');

const app = express();
const PORT = process.env.PORT || 3000;

// --- MIDDLEWARE ---
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Настройка сессий (вместо JWT)
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: false, // Ставим true, если будет HTTPS
        maxAge: 24 * 60 * 60 * 1000 // 24 часа
    }
}));

// Подключаем наш логгер
const logger = require('./middleware/logger');
app.use(logger);

// --- Б ДАННЫХ ---
require('./models/db');

// --- МАРШРУТЫ API ---
// (В файлах routes/auth.js и middleware/adminOnly.js нужно будет заменить проверку JWT на проверку req.session)
app.use('/api/auth', require('./routes/auth'));
app.use('/api/track', require('./routes/track'));
app.use('/api/fingerprint', require('./routes/fingerprint'));
app.use('/api/admin', require('./routes/admin'));

// --- РАЗДАЧА HTML ---
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/login.html', (req, res) => res.sendFile(path.join(__dirname, 'public', 'login.html')));
app.get('/register.html', (req, res) => res.sendFile(path.join(__dirname, 'public', 'register.html')));

// Защита welcome
app.get('/welcome.html', (req, res) => {
    if (!req.session.user) return res.redirect('/login.html');
    res.sendFile(path.join(__dirname, 'public', 'welcome.html'));
});

// Защита админки
app.get('/admin/dashboard.html', (req, res) => {
    if (!req.session.user || req.session.user.role !== 'admin') {
        return res.redirect('/login.html');
    }
    res.sendFile(path.join(__dirname, 'admin', 'dashboard.html'));
});

// Выход
app.get('/logout', (req, res) => {
    req.session.destroy();
    res.clearCookie('connect.sid');
    res.redirect('/');
});

// 404
app.use((req, res) => {
    res.status(404).send('Страница не найдена (404)');
});

// Запуск
app.listen(PORT, '0.0.0.0', () => {
    console.log(`=================================`);
    console.log(`🚀 Сервер запущен на порту ${PORT}`);
    console.log(`📱 http://localhost:${PORT}`);
    console.log(`=================================`);
});