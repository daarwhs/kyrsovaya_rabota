// articles-preview.js
// Управление превью статей и модальным окном полной статьи

document.addEventListener('DOMContentLoaded', async () => {
    const grid = document.getElementById('articlesGrid');
    if (!grid) return; // Если на странице нет грида — ничего не делаем

    // === Создание модального окна (один раз) ===
    if (!document.querySelector('.modal--article')) {
        const modalHTML = `
            <div class="modal modal--article" id="articleModal" role="dialog" aria-labelledby="articleModalTitle" aria-modal="true" hidden>
                <div class="modal__overlay" data-modal-close></div>
                <div class="modal__container modal__container--large">
                    <div class="modal__header">
                        <h2 class="modal__title" id="articleModalTitle">Статья</h2>
                        <button class="modal__close" data-modal-close aria-label="Закрыть модальное окно">×</button>
                    </div>
                    <div class="modal__body" id="articleModalBody"></div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);

        // Обработчики закрытия
        document.querySelectorAll('.modal--article [data-modal-close]').forEach(el => {
            el.addEventListener('click', closeArticleModal);
        });

        document.addEventListener('keydown', e => {
            if (e.key === 'Escape' && !document.querySelector('.modal--article').hidden) {
                closeArticleModal();
            }
        });
    }

    // === Функции модалки ===
    function openArticleModal(article) {
        const modal = document.getElementById('articleModal');
        const titleEl = document.getElementById('articleModalTitle');
        const bodyEl = document.getElementById('articleModalBody');

        // Удаляем эмодзи из заголовков h2 в контенте
        let content = article.content;
        const emojiRegex = /[\u{1F300}-\u{1FAFF}\u{1F1E6}-\u{1F1FF}]/gu;
        content = content.replace(/<h2[^>]*>([^<]*?)<\/h2>/g, (match, text) => {
            return `<h2>${text.replace(emojiRegex, '').trim()}</h2>`;
        });

        titleEl.textContent = article.title;
        const annotationText = sanitizeCardText(article.annotation || article.excerpt || '');
        bodyEl.innerHTML = `
            <div class="article-modal__meta">
                <span class="article-modal__category">${article.category || ''}</span>
                <span class="article-modal__date">${formatDate(article.date)}</span>
                <span class="article-modal__read-time">${article.readTime} мин чтения</span>
            </div>
            ${annotationText ? `<div class="article-modal__annotation">${annotationText}</div>` : ''}
            <div class="article-modal__content">
                ${content}
            </div>
            ${article.readMoreUrl ? `
            <div class="article-modal__actions">
                <a href="${article.readMoreUrl}" target="_blank" rel="noopener noreferrer" class="btn btn--primary article-modal__read-more">Перейти к источнику</a>
            </div>` : ''}
        `;

        modal.hidden = false;
        document.body.style.overflow = 'hidden';
    }

    function closeArticleModal() {
        const modal = document.getElementById('articleModal');
        if (modal) {
            modal.hidden = true;
            document.body.style.overflow = '';
        }
    }

    // === Загрузка данных ===
    async function loadArticles() {
        // Определяем правильный путь к articles.json
        const isInPages = window.location.pathname.includes('/pages/');
        const basePath = isInPages ? '../data/articles.json' : 'data/articles.json';

        try {
            const response = await fetch(basePath);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const data = await response.json();
            return data.articles || [];
        } catch (err) {
            console.warn('Не удалось загрузить articles.json, используем fallback:', err);

            // Fallback на встроенные данные (если они были добавлены в HTML через скрипт)
            if (window.ARTICLES_DATA?.articles) {
                return window.ARTICLES_DATA.articles;
            }

            throw err;
        }
    }

    // === Форматирование даты ===
    function formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('ru-RU', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    }

    function sanitizeCardText(text = '') {
        const emojiRegex = /[\u{1F300}-\u{1FAFF}\u{1F1E6}-\u{1F1FF}]/gu;
        const garbageRegex = /[<>“”«»‘’"›‹→←↔︎•◆◇▶▪︎]/g;
        return String(text).replace(emojiRegex, '').replace(garbageRegex, '').trim();
    }

    // === Основная логика ===
    try {
        const articles = await loadArticles();

        // Сортировка: новые сверху
        articles.sort((a, b) => new Date(b.date) - new Date(a.date));

        grid.innerHTML = articles.map(article => {
            const safeTitle = sanitizeCardText(article.title);
            const safeExcerpt = sanitizeCardText(article.excerpt || '');

            return `
                <article class="article-card" data-article-id="${article.id}">
                    <div class="article-card__image">
                        ${article.image
                            ? `<img src="${article.image}" alt="${safeTitle}" loading="lazy"
                                    onerror="this.onerror=null; this.remove(); this.parentElement.innerHTML='<div class=&quot;article-card__image-placeholder&quot;></div>'">`
                            : `<div class="article-card__image-placeholder"></div>`
                        }
                    </div>
                    <div class="article-card__content">
                        <h3 class="article-card__title">${safeTitle}</h3>
                        <p class="article-card__excerpt">${safeExcerpt}</p>
                        <div class="article-card__meta">
                            <span>${formatDate(article.date)}</span> • ${article.readTime} мин чтения
                        </div>
                        <button class="article-card__toggle test-card__button" data-article-id="${article.id}">
                            Подробнее
                        </button>
                    </div>
                </article>
            `;
        }).join('');

        // Делегирование кликов по кнопкам (эффективнее, чем вешать на каждую)
        grid.addEventListener('click', e => {
            const btn = e.target.closest('.article-card__toggle');
            if (!btn) return;

            const id = btn.dataset.articleId;
            const article = articles.find(a => a.id === id);
            if (article) openArticleModal(article);
        });

    } catch (error) {
        console.error('Ошибка загрузки статей:', error);
        grid.innerHTML = `
            <p style="text-align:center; color:#888; padding:4rem; grid-column: 1 / -1;">
                Не удалось загрузить статьи 😔<br>
                <small style="color:#ccc;">Запустите сайт через локальный сервер (start-server.bat)</small>
            </p>
        `;
    }
});
