/**
 * Логика входа в систему (для юзеров и админа)
 */

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const errorDiv = document.getElementById('loginError');

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            if (errorDiv) errorDiv.style.display = 'none';

            const formData = new FormData(loginForm);
            const data = Object.fromEntries(formData.entries());

            try {
                const response = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(data)
                });

                const result = await response.json();

                if (response.ok) {
                    // Сервер вернул успех. Проверяем роль.
                    if (result.role === 'admin') {
                        // Перенаправляем на админку
                        window.location.href = '/admin/dashboard.html';
                    } else {
                        // Обычный пользователь
                        window.location.href = '/welcome.html';
                    }
                } else {
                    // Ошибка авторизации
                    if (errorDiv) {
                        errorDiv.textContent = result.message || 'Неверный логин или пароль';
                        errorDiv.style.display = 'block';
                    } else {
                        alert(result.message || 'Неверный логин или пароль');
                    }
                }
            } catch (error) {
                console.error('Ошибка сети:', error);
                if (errorDiv) {
                    errorDiv.textContent = 'Ошибка соединения с сервером.';
                    errorDiv.style.display = 'block';
                }
            }
        });
    }
});