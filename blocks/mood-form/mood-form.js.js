/**
 * blocks/mood-form/mood-form.js
 * Дневник настроения: выбор настроения, заметки, история, график, экспорт
 * Минимальные безопасные изменения — всё работает как раньше
 */

document.addEventListener('DOMContentLoaded', () => {
    const moodButtons = document.querySelectorAll('.mood-scale__button');
    const notesInput = document.getElementById('moodNotes');
    const saveBtn = document.getElementById('saveMood');
    const historyList = document.getElementById('moodHistoryList');
    const toggleThoughtDiaryBtn = document.getElementById('toggleThoughtDiary');
    const thoughtDiaryContent = document.getElementById('thoughtDiaryContent');
    const saveThoughtBtn = document.getElementById('saveThought');
    const exportThoughtsBtn = document.getElementById('exportThoughts');
    const thoughtHistoryList = document.getElementById('thoughtHistoryList');

    const thoughtSituation = document.getElementById('thoughtSituation');
    const thoughtAutomatic = document.getElementById('thoughtAutomatic');
    const thoughtEmotion = document.getElementById('thoughtEmotion');
    const thoughtIntensity = document.getElementById('thoughtIntensity');
    const thoughtDistortions = document.getElementById('thoughtDistortions');
    const thoughtEvidenceFor = document.getElementById('thoughtEvidenceFor');
    const thoughtEvidenceAgainst = document.getElementById('thoughtEvidenceAgainst');
    const thoughtAlternative = document.getElementById('thoughtAlternative');
    const thoughtOutcomeIntensity = document.getElementById('thoughtOutcomeIntensity');
    let chartCanvas = document.getElementById('moodChart');
    let moodChart = null;

    let selectedMood = null;

    // === ВЫБОР НАСТРОЕНИЯ ===
    moodButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            moodButtons.forEach(b => b.classList.remove('mood-scale__button--selected'));
            btn.classList.add('mood-scale__button--selected');
            selectedMood = parseInt(btn.dataset.mood);
        });
    });

    // === СОХРАНЕНИЕ ЗАПИСИ ===
    saveBtn.addEventListener('click', () => {
        if (!selectedMood) {
            if (window.utils?.showNotification) {
                window.utils.showNotification('Пожалуйста, выберите ваше настроение!', 'warning');
            } else {
                alert('Выберите ваше настроение!');
            }
            return;
        }

        const entry = {
            date: new Date().toISOString().split('T')[0],
            mood: selectedMood,
            notes: notesInput.value.trim(),
            timestamp: Date.now()
        };

        const saved = saveEntry(entry);

        // Сброс формы
        notesInput.value = '';
        selectedMood = null;
        moodButtons.forEach(b => b.classList.remove('mood-scale__button--selected'));

        // Обновление UI
        renderHistory();
        requestAnimationFrame(() => updateChart());

        // Уведомление
        if (window.utils?.showNotification) {
            window.utils.showNotification(
                saved ? 'Запись сохранена! ✨' : 'Запись добавлена (локально)',
                saved ? 'success' : 'info'
            );
        }
    });

    // === ДНЕВНИК МЫСЛЕЙ: ПОКАЗ/СКРЫТИЕ ===
    if (toggleThoughtDiaryBtn && thoughtDiaryContent) {
        toggleThoughtDiaryBtn.addEventListener('click', () => {
            const isHidden = thoughtDiaryContent.hasAttribute('hidden');
            if (isHidden) {
                thoughtDiaryContent.removeAttribute('hidden');
                toggleThoughtDiaryBtn.textContent = 'Скрыть дневник мыслей';
            } else {
                thoughtDiaryContent.setAttribute('hidden', '');
                toggleThoughtDiaryBtn.textContent = 'Показать дневник мыслей';
            }
        });
    }

    // === ДНЕВНИК МЫСЛЕЙ: ХРАНЕНИЕ ===
    function getThoughtEntries() {
        try {
            const data = localStorage.getItem('thoughtEntries');
            if (!data) return [];
            const entries = JSON.parse(data);
            return Array.isArray(entries) ? entries.filter(e => e && e.timestamp) : [];
        } catch {
            return [];
        }
    }

    function saveThoughtEntry(entry) {
        try {
            const entries = getThoughtEntries();
            entries.push(entry);
            localStorage.setItem('thoughtEntries', JSON.stringify(entries));
            return true;
        } catch {
            return false;
        }
    }

    // === ДНЕВНИК МЫСЛЕЙ: СОХРАНЕНИЕ ===
    if (saveThoughtBtn) {
        saveThoughtBtn.addEventListener('click', () => {
            const entry = {
                date: new Date().toISOString().split('T')[0],
                situation: (thoughtSituation?.value || '').trim(),
                automatic: (thoughtAutomatic?.value || '').trim(),
                emotion: (thoughtEmotion?.value || '').trim(),
                intensity: Math.max(0, Math.min(100, parseInt(thoughtIntensity?.value || '')) || 0),
                distortions: (thoughtDistortions?.value || '').trim(),
                evidenceFor: (thoughtEvidenceFor?.value || '').trim(),
                evidenceAgainst: (thoughtEvidenceAgainst?.value || '').trim(),
                alternative: (thoughtAlternative?.value || '').trim(),
                outcomeIntensity: Math.max(0, Math.min(100, parseInt(thoughtOutcomeIntensity?.value || '')) || 0),
                timestamp: Date.now()
            };

            if (!entry.automatic) {
                window.utils?.showNotification?.('Введите автоматическую мысль', 'warning') || alert('Введите автоматическую мысль');
                return;
            }

            const ok = saveThoughtEntry(entry);

            if (ok) {
                [thoughtSituation, thoughtAutomatic, thoughtEmotion, thoughtIntensity, thoughtDistortions, thoughtEvidenceFor, thoughtEvidenceAgainst, thoughtAlternative, thoughtOutcomeIntensity].forEach(el => {
                    if (el) el.value = '';
                });
            }

            renderThoughtHistory();
            window.utils?.showNotification?.('Мысль сохранена! 🧠', 'success');
        });
    }

    // === ДНЕВНИК МЫСЛЕЙ: РЕНДЕР ===
    function renderThoughtHistory() {
        if (!thoughtHistoryList) return;
        const entries = getThoughtEntries().reverse();
        thoughtHistoryList.innerHTML = entries.length === 0
            ? '<p style="text-align:center; color:#888; padding:2rem;">Пока нет записей мыслей</p>'
            : '';

        entries.forEach(entry => {
            const item = document.createElement('div');
            item.className = 'thought-history__item';
            item.innerHTML = `
                <div class="thought-history__item-header">
                    <div class="thought-history__item-date"><strong>${formatDate(entry.date)}</strong></div>
                    <div class="thought-history__item-emotion">
                        <span>${entry.emotion || 'эмоция'}</span>
                        <span class="thought-intensity">${entry.intensity}% → ${entry.outcomeIntensity}%</span>
                    </div>
                </div>
                <div class="thought-history__block">
                    <div class="thought-label">Ситуация</div>
                    <div class="thought-text">${entry.situation || ''}</div>
                </div>
                <div class="thought-history__block">
                    <div class="thought-label">Автоматическая мысль</div>
                    <div class="thought-text">${entry.automatic || ''}</div>
                </div>
                ${entry.distortions ? `
                <div class="thought-history__block">
                    <div class="thought-label">Искажения</div>
                    <div class="thought-text">${entry.distortions}</div>
                </div>` : ''}
                ${(entry.evidenceFor || entry.evidenceAgainst) ? `
                <div class="thought-history__blocks">
                    ${entry.evidenceFor ? `
                    <div class="thought-history__block">
                        <div class="thought-label">Доказательства «за»</div>
                        <div class="thought-text">${entry.evidenceFor}</div>
                    </div>` : ''}
                    ${entry.evidenceAgainst ? `
                    <div class="thought-history__block">
                        <div class="thought-label">Доказательства «против»</div>
                        <div class="thought-text">${entry.evidenceAgainst}</div>
                    </div>` : ''}
                </div>` : ''}
                ${entry.alternative ? `
                <div class="thought-history__block">
                    <div class="thought-label">Альтернативная мысль</div>
                    <div class="thought-text">${entry.alternative}</div>
                </div>` : ''}
                <div class="thought-actions">
                    <button class="btn-delete" data-timestamp="${entry.timestamp}">Удалить</button>
                </div>
            `;
            thoughtHistoryList.appendChild(item);
        });

        thoughtHistoryList.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', () => {
                const ts = parseInt(btn.dataset.timestamp);
                if (confirm('Удалить эту запись мысли?')) {
                    let entries = getThoughtEntries();
                    entries = entries.filter(e => e.timestamp !== ts);
                    localStorage.setItem('thoughtEntries', JSON.stringify(entries));
                    renderThoughtHistory();
                }
            });
        });
    }

    // === ДНЕВНИК МЫСЛЕЙ: ЭКСПОРТ ===
    if (exportThoughtsBtn) {
        exportThoughtsBtn.addEventListener('click', () => {
            const entries = getThoughtEntries();
            if (entries.length === 0) {
                window.utils?.showNotification?.('Нет данных для экспорта', 'warning') || alert('Нет данных');
                return;
            }
            const exportData = entries.map(e => ({
                'Дата': formatDate(e.date),
                'Ситуация': e.situation || '',
                'Авто. мысль': e.automatic || '',
                'Эмоция': e.emotion || '',
                'Интенсивность до (%)': e.intensity ?? '',
                'Интенсивность после (%)': e.outcomeIntensity ?? '',
                'Искажения': e.distortions || '',
                'Доказательства за': e.evidenceFor || '',
                'Доказательства против': e.evidenceAgainst || '',
                'Альтернативная мысль': e.alternative || '',
                'Полная дата': new Date(e.timestamp).toLocaleString('ru-RU')
            }));

            if (window.utils?.exportData) {
                window.utils.exportData(exportData, 'mindcare_дневник_мыслей', 'csv');
            } else {
                const headers = Object.keys(exportData[0]);
                const csv = [
                    headers.join(','),
                    ...exportData.map(row => headers.map(h => `"${(row[h] || '').toString().replace(/"/g, '""')}"`).join(','))
                ].join('\n');
                const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'mindcare_дневник_мыслей.csv';
                a.click();
                URL.revokeObjectURL(url);
            }
            window.utils?.showNotification?.('Данные экспортированы! 🗒️', 'success');
        });
    }

    // === РАБОТА С LOCALSTORAGE ===
    function getEntries() {
        try {
            const data = localStorage.getItem('moodEntries');
            if (!data) return [];
            const entries = JSON.parse(data);
            return Array.isArray(entries) ? entries.filter(e => e && e.mood && e.timestamp) : [];
        } catch (error) {
            console.warn('Ошибка чтения moodEntries:', error);
            return [];
        }
    }

    function saveEntry(entry) {
        try {
            const entries = getEntries();
            entries.push(entry);
            localStorage.setItem('moodEntries', JSON.stringify(entries));
            return true;
        } catch (error) {
            console.error('Ошибка сохранения в localStorage:', error);
            return false;
        }
    }

    // === ФОРМАТИРОВАНИЕ И ЭМОДЗИ ===
    function formatDate(dateStr) {
        const options = { day: 'numeric', month: 'short', year: 'numeric' };
        return new Date(dateStr).toLocaleDateString('ru-RU', options);
    }

    function getMoodEmoji(mood) {
        const emojis = ['😔','🙁','😐','😌','🙂','😊','😄','😁','🥳','🌟'];
        return emojis[mood - 1] || '✨';
    }

    // === РЕНДЕР ИСТОРИИ ===
    function renderHistory() {
        const entries = getEntries().reverse();
        historyList.innerHTML = entries.length === 0
            ? '<p style="text-align:center; color:#888; padding:2rem;">Пока нет записей о настроении</p>'
            : '';

        entries.forEach(entry => {
            const item = document.createElement('div');
            item.className = 'mood-history__item';
            item.innerHTML = `
                <div class="mood-history__item-header">
                    <div class="mood-history__item-date">
                        <strong>${formatDate(entry.date)}</strong>
                    </div>
                    <div class="mood-history__item-mood">
                        <span class="mood-emoji">${getMoodEmoji(entry.mood)}</span>
                        <span class="mood-score">${entry.mood}/10</span>
                    </div>
                </div>
                ${entry.notes ? `<div class="mood-history__item-notes">${entry.notes}</div>` : ''}
                <div class="mood-actions">
                    <button class="btn-delete" data-timestamp="${entry.timestamp}">Удалить</button>
                </div>
            `;
            historyList.appendChild(item);
        });

        // Делегирование удаления
        historyList.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', () => {
                const timestamp = parseInt(btn.dataset.timestamp);
                if (confirm('Удалить эту запись?')) {
                    let entries = getEntries();
                    entries = entries.filter(e => e.timestamp !== timestamp);
                    localStorage.setItem('moodEntries', JSON.stringify(entries));
                    renderHistory();
                    updateChart();
                }
            });
        });
    }

    // === ГРАФИК НАСТРОЕНИЯ ===
    function updateChart() {
        const entries = getEntries();
        const container = chartCanvas?.parentElement || document.querySelector('.mood-chart');

        if (entries.length === 0) {
            if (container) {
                container.innerHTML = `
                    <canvas id="moodChart"></canvas>
                    <p style="text-align:center; color:#888; padding:3rem;">Нет данных для графика.<br>Добавьте первую запись о настроении!</p>
                `;
                chartCanvas = document.getElementById('moodChart');
            }
            if (moodChart) moodChart.destroy();
            return;
        }

        // Восстановление canvas
        if (!chartCanvas || !document.contains(chartCanvas)) {
            if (container) {
                container.innerHTML = '<canvas id="moodChart"></canvas>';
                chartCanvas = document.getElementById('moodChart');
            }
        }

        if (!chartCanvas) return;

        // Данные за последние 30 дней
        const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
        const recent = entries
            .filter(e => e.timestamp >= thirtyDaysAgo)
            .sort((a, b) => a.timestamp - b.timestamp);

        const labels = recent.map(e => formatDate(e.date).slice(0, -6)); // без года
        const data = recent.map(e => e.mood);

        // Уничтожаем старый график
        if (moodChart) {
            moodChart.destroy();
            moodChart = null;
        }

        try {
            moodChart = new Chart(chartCanvas, {
                type: 'line',
                data: {
                    labels: labels.length ? labels : ['Нет данных'],
                    datasets: [{
                        label: 'Настроение',
                        data: data.length ? data : [0],
                        borderColor: '#9CAF88',
                        backgroundColor: 'rgba(156, 175, 136, 0.15)',
                        borderWidth: 4,
                        pointBackgroundColor: '#9CAF88',
                        pointRadius: 6,
                        pointHoverRadius: 9,
                        tension: 0.4,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    animation: { duration: 600 },
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            callbacks: {
                                label: ctx => `Настроение: ${ctx.raw}/10 ${getMoodEmoji(ctx.raw)}`
                            }
                        }
                    },
                    scales: {
                        y: {
                            min: 1,
                            max: 10,
                            ticks: { stepSize: 1 },
                            grid: { color: 'rgba(0,0,0,0.05)' }
                        },
                        x: {
                            grid: { display: false }
                        }
                    }
                }
            });
        } catch (error) {
            console.error('Ошибка создания графика:', error);
        }
    }

    // === ЭКСПОРТ ДАННЫХ ===
    window.exportMoodData = () => {
        const entries = getEntries();
        if (entries.length === 0) {
            window.utils?.showNotification?.('Нет данных для экспорта', 'warning') || alert('Нет данных');
            return;
        }

        const exportData = entries.map(entry => ({
            'Дата': formatDate(entry.date),
            'Настроение': `${entry.mood}/10`,
            'Эмодзи': getMoodEmoji(entry.mood),
            'Заметки': entry.notes || '',
            'Полная дата': new Date(entry.timestamp).toLocaleString('ru-RU')
        }));

        if (window.utils?.exportData) {
            window.utils.exportData(exportData, 'mindcare_дневник_настроения', 'csv');
        } else {
            // Fallback экспорт
            const headers = Object.keys(exportData[0]);
            const csv = [
                headers.join(','),
                ...exportData.map(row => headers.map(h => `"${(row[h] || '').toString().replace(/"/g, '""')}"`).join(','))
            ].join('\n');

            const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'mindcare_дневник_настроения.csv';
            a.click();
            URL.revokeObjectURL(url);
        }

        window.utils?.showNotification?.('Данные экспортированы! 📊', 'success');
    };

    // === ЗАПУСК ===
    renderHistory();
    updateChart();
});
