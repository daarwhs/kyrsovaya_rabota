/**
 * blocks/contacts-controls/contacts-controls.js
 * Управление списком контактов: загрузка, поиск, фильтры, сортировка (Приднестровье первым)
 * Минимальные безопасные изменения — всё работает как раньше
 */

document.addEventListener('DOMContentLoaded', async () => {
    const grid = document.getElementById('contactsGrid');
    const searchInput = document.getElementById('searchInput');
    const noResults = document.getElementById('noResults');

    if (!grid) {
        console.warn('contactsGrid не найден на странице');
        return;
    }

    let allContacts = [];
    let currentContacts = [];

    // Сортировка: Приднестровье первым, затем по рейтингу
    function sortContactsPridnestrovieFirst(contacts) {
        return [...contacts].sort((a, b) => {
            const aIsPMR = a.region === 'pridnestrovie' ? 0 : 1;
            const bIsPMR = b.region === 'pridnestrovie' ? 0 : 1;
            if (aIsPMR !== bIsPMR) return aIsPMR - bIsPMR;
            return (b.rating || 0) - (a.rating || 0);
        });
    }

    // Загрузка контактов
    async function loadContacts() {
        try {
            const isInPages = window.location.pathname.includes('/pages/');
            const basePath = isInPages ? '../data/contacts.json' : 'data/contacts.json';

            const response = await fetch(basePath);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            const data = await response.json();
            return data.contacts || [];
        } catch (err) {
            console.warn('Не удалось загрузить contacts.json — используем fallback:', err);

            if (window.CONTACTS_DATA && window.CONTACTS_DATA.contacts) {
                return window.CONTACTS_DATA.contacts;
            }

            throw err;
        }
    }

    // Названия типов для бейджа
    function getTypeBadge(type) {
        const badges = {
            crisis: 'Кризисная помощь',
            university: 'Вуз',
            online: 'Онлайн',
            free: 'Бесплатные ресурсы'
        };
        return badges[type] || 'Помощь';
    }

    // Создание карточки контакта
    function createCard(contact) {
        const card = document.createElement('div');
        card.className = 'contact-card';
        card.dataset.type = contact.type || 'other';

        card.innerHTML = `
            <div class="contact-card__header">
                <h3 class="contact-card__name">${contact.name || 'Без имени'}</h3>
                <span class="contact-card__type">${getTypeBadge(contact.type)}</span>
            </div>
            ${contact.phone ? `
                <p class="contact-card__phone">
                    <a href="tel:${contact.phone.replace(/\s/g, '')}">Телефон: ${contact.phone}</a>
                </p>` : ''}
            ${contact.website ? `
                <p class="contact-card__site">
                    <a href="${contact.website}" target="_blank" rel="noopener">
                        Сайт: ${contact.website.replace(/^https?:\/\//, '')}
                    </a>
                </p>` : ''}
            ${contact.hours ? `<p class="contact-card__hours">${contact.hours}</p>` : ''}
            ${contact.city && contact.city !== 'Онлайн' ? `<p class="contact-card__city">${contact.city}</p>` : ''}
            <p class="contact-card__description">${contact.description || ''}</p>
        `;

        // Анимация появления
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        requestAnimationFrame(() => {
            card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        });

        return card;
    }

    // Рендер контактов
    function renderContacts(contacts) {
        grid.innerHTML = '';

        if (contacts.length === 0) {
            if (noResults) noResults.hidden = false;
            return;
        }

        if (noResults) noResults.hidden = true;

        const fragment = document.createDocumentFragment();
        contacts.forEach(contact => fragment.appendChild(createCard(contact)));
        grid.appendChild(fragment);
    }

    // Поиск по всем полям
    function performSearch(query) {
        if (!query.trim()) return allContacts;

        const q = query.toLowerCase();
        return allContacts.filter(contact => {
            return (
                contact.name?.toLowerCase().includes(q) ||
                contact.city?.toLowerCase().includes(q) ||
                contact.phone?.includes(query) ||
                contact.website?.toLowerCase().includes(q) ||
                contact.description?.toLowerCase().includes(q) ||
                (Array.isArray(contact.specialization) && contact.specialization.some(s => s.toLowerCase().includes(q)))
            );
        });
    }

    // Основная инициализация
    try {
        const contacts = await loadContacts();
        allContacts = sortContactsPridnestrovieFirst(contacts);
        currentContacts = [...allContacts];
        renderContacts(currentContacts);
    } catch (err) {
        console.error('Критическая ошибка загрузки контактов:', err);
        grid.innerHTML = `
            <div style="text-align:center;padding:4rem;color:#e74c3c;font-size:1.1rem;grid-column:1/-1;">
                Не удалось загрузить список контактов 😔
                <br><small style="color:#888;font-size:0.85rem;margin-top:0.5rem;display:block;">
                    Запустите сайт через локальный сервер (start-server.bat)
                </small>
            </div>`;
        if (noResults) noResults.hidden = true;
    }

    // === ПОИСК ===
    if (searchInput) {
        let searchTimeout;
        searchInput.addEventListener('input', () => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                const query = searchInput.value.trim();
                applyFiltersAndSearch(query);
            }, 300);
        });
    }

    // === ФИЛЬТРЫ ===
    document.querySelectorAll('.contacts-controls__filter-button').forEach(btn => {
        btn.addEventListener('click', () => {
            // Активная кнопка
            document.querySelectorAll('.contacts-controls__filter-button').forEach(b =>
                b.classList.remove('contacts-controls__filter-button--active')
            );
            btn.classList.add('contacts-controls__filter-button--active');

            const query = searchInput ? searchInput.value.trim() : '';
            applyFiltersAndSearch(query);
        });
    });

    // Универсальная функция применения фильтров + поиска
    function applyFiltersAndSearch(searchQuery = '') {
        const activeFilter = document.querySelector('.contacts-controls__filter-button--active')?.dataset.filter || 'all';

        let filtered = allContacts;

        // Сначала применяем фильтр
        if (activeFilter === 'pridnestrovie') {
            filtered = allContacts.filter(c => c.region === 'pridnestrovie');
        } else if (activeFilter !== 'all') {
            filtered = allContacts.filter(c => c.type === activeFilter);
        }

        // Затем поиск (если есть)
        if (searchQuery) {
            filtered = filtered.filter(contact => performSearch(searchQuery).includes(contact));
        }

        currentContacts = filtered;
        renderContacts(filtered);
    }
});