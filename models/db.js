const Database = require('better-sqlite3');
const path = require('path');

// Создаем или открываем файл базы данных в корне проекта
const dbPath = path.join(__dirname, '..', 'database.sqlite');
const db = new Database(dbPath, { verbose: console.log }); // verbose: console.log выводит SQL запросы в консоль (удобно для отладки, потом можно убрать)

// Включаем режим WAL для лучшей производительности при одновременных чтениях/записях
db.pragma('journal_mode = WAL');

/**
 * ИНИЦИАЛИЗАЦИЯ ТАБЛИЦ
 * Создаем таблицы, если они еще не существуют
 */
const initDB = () => {
    // Таблица пользователей
    db.exec(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            phone TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role TEXT DEFAULT 'user',
            consent INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // Таблица отпечатков устройств
    db.exec(`
        CREATE TABLE IF NOT EXISTS fingerprints (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            fingerprint_data TEXT NOT NULL,
            ip_address TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
        )
    `);

    // Таблица логов активности (Трекер)
    db.exec(`
        CREATE TABLE IF NOT EXISTS logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id TEXT,
            action TEXT NOT NULL,
            url TEXT,
            ip_address TEXT,
            details TEXT,
            time_spent INTEGER DEFAULT 0,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    console.log('✅ База данных инициализирована. Таблицы готовы.');
};

// Запускаем инициализацию при подключении файла
initDB();

/**
 * ФУНКЦИИ ДЛЯ РАБОТЫ С ПОЛЬЗОВАТЕЛЯМИ
 */

// Создать нового пользователя
const createUser = (userData) => {
    const stmt = db.prepare(`
        INSERT INTO users (name, phone, password, role, consent) 
        VALUES (@name, @phone, @password, @role, @consent)
    `);
    
    const info = stmt.run({
        name: userData.name,
        phone: userData.phone,
        password: userData.password,
        role: userData.role || 'user',
        consent: userData.consent ? 1 : 0
    });

    // Возвращаем созданного пользователя (без пароля)
    return getUserById(info.lastInsertRowid);
};

// Найти пользователя по ID
const getUserById = (id) => {
    const stmt = db.prepare('SELECT id, name, phone, role, created_at FROM users WHERE id = ?');
    return stmt.get(id);
};

// Найти пользователя по номеру телефона (для входа)
const getUserByPhone = (phone) => {
    const stmt = db.prepare('SELECT * FROM users WHERE phone = ?');
    return stmt.get(phone); // Возвращает пользователя вместе с хэшем пароля (для проверки)
};

// Получить всех пользователей (для админки)
const getAllUsers = () => {
    const stmt = db.prepare('SELECT id, name, phone, role, consent, created_at FROM users ORDER BY id DESC');
    return stmt.all();
};

// Удалить пользователя
const deleteUser = (id) => {
    const stmt = db.prepare('DELETE FROM users WHERE id = ?');
    return stmt.run(id);
};

/**
 * ФУНКЦИИ ДЛЯ РАБОТЫ С ОТПЕЧАТКАМИ (FINGERPRINTS)
 */

// Сохранить отпечаток
const saveFingerprint = (userId, fingerprintData, ip = null) => {
    const stmt = db.prepare(`
        INSERT INTO fingerprints (user_id, fingerprint_data, ip_address) 
        VALUES (?, ?, ?)
    `);
    return stmt.run(userId, fingerprintData, ip);
};

// Получить все отпечатки (для админки)
const getAllFingerprints = () => {
    const stmt = db.prepare('SELECT * FROM fingerprints ORDER BY id DESC');
    return stmt.all();
};

/**
 * ФУНКЦИИ ДЛЯ РАБОТЫ С ЛОГАМИ (ТРЕКЕР)
 */

// Сохранить лог действия
const saveLog = (logData) => {
    const stmt = db.prepare(`
        INSERT INTO logs (session_id, action, url, ip_address, details, time_spent, timestamp) 
        VALUES (@sessionId, @action, @url, @ip, @details, @timeSpent, @timestamp)
    `);
    
    try {
        return stmt.run({
            sessionId: logData.sessionId || 'unknown',
            action: logData.action,
            url: logData.url || '/',
            ip: logData.ip || null,
            details: logData.details || '{}',
            timeSpent: logData.timeSpent || 0,
            timestamp: logData.timestamp ? logData.timestamp.replace('T', ' ').replace('Z', '') : new Date().toISOString().replace('T', ' ').replace('Z', '')
        });
    } catch (error) {
        console.error('Ошибка записи лога в БД:', error.message);
        return null;
    }
};

// Получить все логи (для админки)
const getAllLogs = () => {
    // Берем последние 200 записей, чтобы не перегружать браузер
    const stmt = db.prepare('SELECT * FROM logs ORDER BY id DESC LIMIT 200');
    return stmt.all();
};

// Экспортируем все функции
module.exports = {
    // Пользователи
    createUser,
    getUserById,
    getUserByPhone,
    getAllUsers,
    deleteUser,
    // Отпечатки
    saveFingerprint,
    getAllFingerprints,
    // Логи
    saveLog,
    getAllLogs,
    // Сам объект БД (если понадобится напрямую)
    db
};
