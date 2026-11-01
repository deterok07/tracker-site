/**
 * Middleware для защиты маршрутов администратора (на основе express-session)
 */
const adminOnly = (req, res, next) => {
    // Проверяем, есть ли сессия и является ли пользователь админом
    if (req.session && req.session.user && req.session.user.role === 'admin') {
        // Всё отлично, пропускаем дальше
        return next();
    }

    // Если это API запрос (fetch), возвращаем JSON
    if (req.xhr || req.headers.accept?.indexOf('json') > -1 || req.path.startsWith('/api')) {
        return res.status(403).json({ message: 'Доступ запрещен. Вы не администратор.' });
    }

    // Если обычный запрос, редиректим на логин
    return res.redirect('/login.html');
};

module.exports = adminOnly;