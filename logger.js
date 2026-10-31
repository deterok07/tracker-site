/**
 * Middleware для логирования входящих HTTP-запросов.
 * Выводит информацию в консоль Termux.
 */

const logger = (req, res, next) => {
    // Получаем IP-адрес (учитывая возможный прокси)
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    
    // Получаем текущее время
    const time = new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' });
    
    // Метод и URL
    const method = req.method;
    const url = req.originalUrl;

    // Форматируем цветной вывод для консоли (ANSI-коды)
    // Зеленый для GET, Синий для POST, Красный для ошибок
    let color = '\x1b[32m'; // Зеленый по умолчанию
    if (method === 'POST') color = '\x1b[34m'; // Синий
    if (method === 'PUT' || method === 'DELETE') color = '\x1b[33m'; // Желтый

    console.log(
        `\x1b[90m[${time}]\x1b[0m ${color}${method}\x1b[0m ${url} \x1b[90m- IP: ${ip}\x1b[0m`
    );

    // Передаем управление следующему middleware или маршруту
    next();
};

module.exports = logger;