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
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });

                const result = await response.json();

                if (response.ok) {
                    // Сессия уже создана на сервере (в куки), просто редиректим
                    if (result.role === 'admin') {
                        window.location.href = '/admin/dashboard.html';
                    } else {
                        window.location.href = '/welcome.html';
                    }
                } else {
                    if (errorDiv) {
                        errorDiv.textContent = result.message || 'Неверный логин или пароль';
                        errorDiv.style.display = 'block';
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