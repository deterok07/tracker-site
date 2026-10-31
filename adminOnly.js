/**
 * Middleware для защиты маршрутов администратора.
 * Проверяет наличие JWT-токена в Cookie и роль пользователя.
 */

const jwt = require('jsonwebtoken');

const adminOnly = (req, res, next) => {
    // 1. Пытаемся достать токен из Cookie
    const token = req.cookies.token;

    // Если токена нет — значит, пользователь не авторизован
    if (!token) {
        // Если это API запрос (fetch), возвращаем JSON ошибку
        if (req.xhr || req.headers.accept.indexOf('json') > -1 || req.path.startsWith('/api')) {
            return res.status(401).json({ message: 'Не авторизован. Пожалуйста, войдите в систему.' });
        }
        // Если это обычный переход по ссылке (например, в браузере), редиректим на логин
        return res.redirect('/login.html');
    }

    try {
        // 2. Проверяем валидность токена
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // 3. Проверяем роль
        if (decoded.role !== 'admin') {
            // Пользователь авторизован, но он не админ
            if (req.xhr || req.headers.accept.indexOf('json') > -1 || req.path.startsWith('/api')) {
                return res.status(403).json({ message: 'Доступ запрещен. Вы не администратор.' });
            }
            return res.status(403).send('Доступ запрещен. Вы не администратор.');
        }

        // 4. Всё ок! Сохраняем данные пользователя в запрос (пригодится в маршрутах)
        req.user = decoded;
        
        // Передаем управление дальше
        next();

    } catch (error) {
        // Если токен просрочен или подделан
        console.warn('Ошибка проверки токена админа:', error.message);
        
        res.clearCookie('token'); // Удаляем битую куку
        
        if (req.xhr || req.headers.accept.indexOf('json') > -1 || req.path.startsWith('/api')) {
            return res.status(401).json({ message: 'Сессия истекла. Войдите заново.' });
        }
        return res.redirect('/login.html');
    }
};

module.exports = adminOnly;