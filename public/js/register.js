document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('registerForm');
    const errorDiv = document.createElement('div');
    errorDiv.id = 'registerError';
    errorDiv.style.color = '#ef4444';
    errorDiv.style.marginBottom = '15px';
    errorDiv.style.fontSize = '14px';
    errorDiv.style.display = 'none';
    
    if (registerForm) {
        registerForm.insertBefore(errorDiv, registerForm.querySelector('button[type="submit"]'));
    }

    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            errorDiv.style.display = 'none';

            const formData = new FormData(registerForm);
            const data = Object.fromEntries(formData.entries());

            // Проверка галочки согласия
            const consentCheckbox = document.getElementById('consent');
            if (!consentCheckbox || !consentCheckbox.checked) {
                errorDiv.textContent = 'Вы обязаны дать согласие на обработку данных.';
                errorDiv.style.display = 'block';
                return;
            }

            if (!data.fingerprint) {
                data.fingerprint = JSON.stringify({ id: 'unknown', raw: 'not_collected' });
            }

            try {
                const response = await fetch('/api/auth/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });

                const result = await response.json();

                if (response.ok) {
                    // Сессия создана, идем на welcome
                    window.location.href = '/welcome.html';
                } else {
                    errorDiv.textContent = result.message || 'Ошибка при регистрации.';
                    errorDiv.style.display = 'block';
                }
            } catch (error) {
                console.error('Ошибка сети:', error);
                errorDiv.textContent = 'Ошибка соединения с сервером.';
                errorDiv.style.display = 'block';
            }
        });
    }
});