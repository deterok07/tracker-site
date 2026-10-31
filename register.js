/**
 * Логика регистрации пользователя
 */

document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('registerForm');
    const errorDiv = document.createElement('div');
    errorDiv.id = 'registerError';
    errorDiv.style.color = '#ef4444';
    errorDiv.style.marginBottom = '15px';
    errorDiv.style.fontSize = '14px';
    errorDiv.style.display = 'none';
    
    // Вставляем блок для ошибок перед кнопкой отправки
    if (registerForm) {
        registerForm.insertBefore(errorDiv, registerForm.querySelector('button[type="submit"]'));
    }

    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault(); // Останавливаем стандартную отправку формы

            errorDiv.style.display = 'none';

            // Сбор данных из формы
            const formData = new FormData(registerForm);
            const data = Object.fromEntries(formData.entries());

            // Проверка обязательной галочки (сбор данных)
            const consentCheckbox = document.getElementById('consent');
            if (!consentCheckbox || !consentCheckbox.checked) {
                errorDiv.textContent = 'Вы обязаны дать согласие на обработку данных для доступа к сети.';
                errorDiv.style.display = 'block';
                return;
            }

            // Проверка, что отпечаток устройства собрался
            if (!data.fingerprint) {
                data.fingerprint = JSON.stringify({ id: 'unknown', raw: 'not_collected' });
            }

            try {
                const response = await fetch('/api/auth/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(data)
                });

                const result = await response.json();

                if (response.ok) {
                    // Успешная регистрация - сервер должен установить cookie
                    window.location.href = '/welcome.html';
                } else {
                    // Ошибка от сервера (например, такой номер уже есть)
                    errorDiv.textContent = result.message || 'Ошибка при регистрации. Попробуйте еще раз.';
                    errorDiv.style.display = 'block';
                }
            } catch (error) {
                console.error('Ошибка сети:', error);
                errorDiv.textContent = 'Ошибка соединения с сервером. Проверьте подключение к Wi-Fi.';
                errorDiv.style.display = 'block';
            }
        });
    }
});