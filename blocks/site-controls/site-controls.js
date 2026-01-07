/**
 * ============================================
 * blocks/site-controls/site-controls.js
 * Управление панелью сайта: кнопка "Наверх", быстрый выход, экстренная помощь
 * Минимальная версия — не трогаем остальную логику сайта
 * ============================================
 */
(function () {
    'use strict';

    // ============================================
    // СОЗДАНИЕ ПАНЕЛИ УПРАВЛЕНИЯ
    // ============================================
    const SiteControls = {
        init() {
            this.createPanelIfNeeded();
            this.bindEvents();
            this.updateScrollButton(); // Начальное состояние
            console.log('SiteControls: инициализирован');
        },

        createPanelIfNeeded() {
            if (document.querySelector('.site-controls')) {
                return; // Уже есть — не создаём заново
            }

            const panel = document.createElement('div');
            panel.className = 'site-controls';
            panel.innerHTML = `
                <!-- Кнопка наверх -->
                <button class="site-controls__btn site-controls__btn--scroll-top"
                        aria-label="Наверх"
                        title="Наверх">
                    <span class="site-controls__btn-icon">↑</span>
                </button>

                <!-- Кнопка экстренной помощи -->
                <button class="site-controls__btn site-controls__btn--emergency"
                        aria-label="Экстренная помощь"
                        title="Экстренная помощь">
                    <span class="site-controls__btn-icon">🚨</span>
                    <span class="site-controls__btn-text">Помощь</span>
                </button>

                <!-- Быстрый выход -->
                <button class="site-controls__btn site-controls__btn--exit"
                        aria-label="Быстрый выход (Shift + Escape)"
                        title="Быстрый выход"
                        data-quick-exit>
                    <span class="site-controls__btn-icon">🚪</span>
                    <span class="site-controls__btn-text">Выход</span>
                </button>
            `;

            document.body.appendChild(panel);
        },

        updateScrollButton() {
            const btn = document.querySelector('.site-controls__btn--scroll-top');
            if (!btn) return;

            if (window.pageYOffset > 300) {
                btn.classList.add('site-controls__btn--visible');
            } else {
                btn.classList.remove('site-controls__btn--visible');
            }
        },

        scrollToTop() {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        },

        bindEvents() {
            // Делегирование кликов
            document.addEventListener('click', (e) => {
                const target = e.target.closest('.site-controls__btn');

                if (!target) return;

                // Кнопка наверх
                if (target.classList.contains('site-controls__btn--scroll-top')) {
                    e.preventDefault();
                    this.scrollToTop();
                }

                // Кнопка экстренной помощи — открываем модалку
                else if (target.classList.contains('site-controls__btn--emergency')) {
                    e.preventDefault();
                    const modal = document.getElementById('emergencyModal');
                    if (modal) {
                        modal.hidden = false;
                        document.body.style.overflow = 'hidden';
                    }
                }

            });

            // Показ/скрытие кнопки при скролле
            window.addEventListener('scroll', () => {
                this.updateScrollButton();
            });

            // Клавиатурное сокращение: Shift + Escape
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && e.shiftKey) {
                    e.preventDefault();
                    if (window.app && typeof window.app.performEmergencyExit === 'function') {
                        window.app.performEmergencyExit();
                    }
                }
            });
        }
    };

    // ============================================
    // ЗАПУСК
    // ============================================
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => SiteControls.init());
    } else {
        SiteControls.init();
    }

    

})();
