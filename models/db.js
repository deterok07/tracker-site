const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'database.json');

// Создаем файл БД, если его нет
if (!fs.existsSync(dbPath)) {
    fs.writeFileSync(dbPath, JSON.stringify({ users: [], logs: [], fingerprints: [] }, null, 2));
}

// Функция чтения
const readDB = () => JSON.parse(fs.readFileSync(dbPath, 'utf8'));
// Функция записи
const writeDB = (data) => fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));

// --- ПОЛЬЗОВАТЕЛИ ---
const createUser = (userData) => {
    const db = readDB();
    const newUser = { id: Date.now(), ...userData, created_at: new Date().toISOString() };
    db.users.push(newUser);
    writeDB(db);
    return newUser;
};

const getUserById = (id) => readDB().users.find(u => u.id === id);
const getUserByPhone = (phone) => readDB().users.find(u => u.phone === phone);
const getAllUsers = () => readDB().users;

// --- ЛОГИ (ТРЕКЕР) ---
const saveLog = (logData) => {
    const db = readDB();
    db.logs.push({ id: Date.now(), ...logData, timestamp: new Date().toISOString() });
    writeDB(db);
};

const getAllLogs = () => readDB().logs.reverse();

// --- ОТПЕЧАТКИ ---
const saveFingerprint = (userId, fingerprintData, ip = null) => {
    const db = readDB();
    db.fingerprints.push({ id: Date.now(), user_id: userId, fingerprint_data: fingerprintData, ip_address: ip, created_at: new Date().toISOString() });
    writeDB(db);
};

const getAllFingerprints = () => readDB().fingerprints.reverse();

module.exports = {
    createUser, getUserById, getUserByPhone, getAllUsers,
    saveLog, getAllLogs,
    saveFingerprint, getAllFingerprints
};