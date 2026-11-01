/**
 * Логика панели администратора
 * Загружает данные с сервера и отрисовывает в таблицах
 */

document.addEventListener('DOMContentLoaded', async () => {
    
    // Функция для загрузки данных с сервера
    const fetchAdminData = async () => {
        try {
            const response = await fetch('/api/admin/data');
            
            if (response.status === 401 || response.status === 403) {
                // Если токен просрочен или доступ запрещен
                window.location.href = '/login.html';
                return;
            }

            if (!response.ok) throw new Error('Ошибка загрузки данных');

            const data = await response.json();
            renderUsers(data.users);
            renderLogs(data.logs);
            renderFingerprints(data.fingerprints);

        } catch (error) {
            console.error('Ошибка:', error);
            const errorContainer = document.getElementById('adminError');
            if (errorContainer) {
                errorContainer.textContent = 'Не удалось загрузить данные. Проверьте соединение.';
                errorContainer.style.display = 'block';
            }
        }
    };

    // Отрисовка таблицы пользователей
    const renderUsers = (users) => {
        const tableBody = document.getElementById('usersTableBody');
        if (!tableBody) return;
        tableBody.innerHTML = '';

        if (!users || users.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Пользователей пока нет</td></tr>';
            return;
        }

        users.forEach(user => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${user.id || '-'}</td>
                <td>${user.name || '-'}</td>
                <td>${user.phone || '-'}</td>
                <td>${new Date(user.created_at).toLocaleString('ru-RU')}</td>
                <td><span class="badge ${user.role}">${user.role}</span></td>
            `;
            tableBody.appendChild(tr);
        });
    };

    // Отрисовка логов трекера (действия)
    const renderLogs = (logs) => {
        const tableBody = document.getElementById('logsTableBody');
        if (!tableBody) return;
        tableBody.innerHTML = '';

        if (!logs || logs.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="4" style="text-align:center;">Логов пока нет</td></tr>';
            return;
        }

        // Показываем последние 50 действий
        logs.slice(0, 50).forEach(log => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${new Date(log.timestamp).toLocaleString('ru-RU')}</td>
                <td>${log.action}</td>
                <td>${log.url}</td>
                <td><small>${log.session_id || '-'}</small></td>
            `;
            tableBody.appendChild(tr);
        });
    };

    // Отрисовка отпечатков устройств
    const renderFingerprints = (fingerprints) => {
        const tableBody = document.getElementById('fingerprintsTableBody');
        if (!tableBody) return;
        tableBody.innerHTML = '';

        if (!fingerprints || fingerprints.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="4" style="text-align:center;">Отпечатков пока нет</td></tr>';
            return;
        }

        fingerprints.forEach(fp => {
            let parsedInfo = {};
            try { parsedInfo = JSON.parse(fp.fingerprint_data); } catch (e) {}
            
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${new Date(fp.created_at).toLocaleString('ru-RU')}</td>
                <td><code>${parsedInfo.id || 'N/A'}</code></td>
                <td><small>${parsedInfo.platform || 'unknown'} / ${parsedInfo.screen || 'unknown'}</small></td>
                <td><small>${parsedInfo.timezone || 'unknown'}</small></td>
            `;
            tableBody.appendChild(tr);
        });
    };

    // Вкладки (переключение между разделами)
    const setupTabs = () => {
        const tabBtns = document.querySelectorAll('.tab-btn');
        const tabContents = document.querySelectorAll('.tab-content');

        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                // Убираем активный класс со всех
                tabBtns.forEach(b => b.classList.remove('active'));
                tabContents.forEach(c => c.classList.remove('active'));

                // Добавляем активный текущему
                btn.classList.add('active');
                const targetId = btn.getAttribute('data-target');
                const targetContent = document.getElementById(targetId);
                if (targetContent) targetContent.classList.add('active');
            });
        });
    };

    // Инициализация
    setupTabs();
    await fetchAdminData();

    // Автообновление данных каждые 10 секунд (для слежения в реальном времени)
    setInterval(fetchAdminData, 10000);
});