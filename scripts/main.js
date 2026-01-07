// ============================================
// scripts/main.js
// ГЛАВНЫЙ ФАЙЛ САЙТА - ИНИЦИАЛИЗАЦИЯ И ОСНОВНАЯ ЛОГИКА
// ============================================

document.addEventListener('DOMContentLoaded', function () {
    function performEmergencyExit() {
        window.location.href = 'https://www.google.com';
    }
    window.app = window.app || {};
    window.app.performEmergencyExit = performEmergencyExit;

    document.addEventListener('click', function (e) {
        const exitBtn = e.target.closest('#emergencyExit, [data-quick-exit]');
        if (exitBtn) {
            e.preventDefault();
            performEmergencyExit();
        }
    });
    document.addEventListener('keydown', function (e) {
        const isQuickExitTarget = e.target && e.target.closest && e.target.closest('#emergencyExit, [data-quick-exit]');
        if ((e.key === 'Enter' || e.key === ' ') && isQuickExitTarget) {
            e.preventDefault();
            performEmergencyExit();
        }
    });

    function ensureNavModal() {
        let modal = document.getElementById('navModal');
        if (modal) return modal;
        const nav = document.querySelector('.header__nav');
        const listHTML = nav && nav.querySelector('.header__nav-list') ? nav.querySelector('.header__nav-list').innerHTML : [
            '<li class="header__nav-item"><a href="index.html" class="header__nav-link">Главная</a></li>',
            '<li class="header__nav-item"><a href="pages/articles/articles.html" class="header__nav-link">Статьи</a></li>',
            '<li class="header__nav-item"><a href="pages/tests/tests.html" class="header__nav-link">Тесты</a></li>',
            '<li class="header__nav-item"><a href="pages/mood-tracker/mood-tracker.html" class="header__nav-link">Дневник настроения</a></li>',
            '<li class="header__nav-item"><a href="pages/exercises/exercises.html" class="header__nav-link">Упражнения</a></li>',
            '<li class="header__nav-item"><a href="pages/contacts/contacts.html" class="header__nav-link">Контакты</a></li>'
        ].join('');
        modal = document.createElement('div');
        modal.className = 'modal';
        modal.id = 'navModal';
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-modal', 'true');
        modal.hidden = true;
        modal.innerHTML = [
            '<div class="modal__overlay" data-modal-close></div>',
            '<div class="modal__container modal__container--nav">',
            '<div class="modal__header">',
            '<h2 class="modal__title">Меню</h2>',
            '<button class="modal__close" data-modal-close aria-label="Закрыть">×</button>',
            '</div>',
            '<div class="modal__body">',
            '<ul class="header__nav-list">', listHTML, '</ul>',
            '</div>',
            '</div>'
        ].join('');
        document.body.appendChild(modal);
        const list = modal.querySelector('.header__nav-list');
        if (list) {
            list.addEventListener('click', function (e) {
                const link = e.target.closest('.header__nav-link');
                if (!link) return;
                closeNavModal();
            });
        }
        return modal;
    }

    function openNavModal() {
        ensureNavModal();
        const modal = document.getElementById('navModal');
        const toggle = document.getElementById('menuToggle');
        if (!modal || !toggle) return;
        if (!modal.hasAttribute('hidden')) return;
        modal.hidden = false;
        toggle.setAttribute('aria-expanded', 'true');
        document.body.classList.add('nav-open');
    }

    function closeNavModal() {
        const modal = document.getElementById('navModal');
        const toggle = document.getElementById('menuToggle');
        if (!modal || !toggle) return;
        if (modal.hidden) return;
        modal.hidden = true;
        toggle.setAttribute('aria-expanded', 'false');
        document.body.classList.remove('nav-open');
    }

    function initNavigation() {
        const menuToggle = document.getElementById('menuToggle');
        const nav = document.querySelector('.header__nav');
        if (!menuToggle || !nav) return;
        menuToggle.setAttribute('aria-expanded', 'false');
        const update = function () {
            const isMobile = window.matchMedia('(max-width: 767px)').matches;
            nav.hidden = isMobile;
            menuToggle.hidden = !isMobile;
            if (!isMobile) closeNavModal();
        };
        update();
        window.addEventListener('resize', update);
        menuToggle.addEventListener('click', function () {
            const isMobile = window.matchMedia('(max-width: 767px)').matches;
            if (!isMobile) return;
            openNavModal();
        });
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') {
                const modal = document.getElementById('navModal');
                if (modal && !modal.hidden) closeNavModal();
            }
        });
        ensureNavModal();
    }

    function initEmergencyModalClose() {
        document.addEventListener('click', function (e) {
            const quickExit = e.target.closest('[data-quick-exit]');
            if (quickExit) {
                e.preventDefault();
                performEmergencyExit();
            }
        });
        document.addEventListener('keydown', function (e) {
            if ((e.key === 'Enter' || e.key === ' ') && e.target && e.target.closest && e.target.closest('[data-quick-exit]')) {
                e.preventDefault();
                performEmergencyExit();
            }
        });
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') {
                document.querySelectorAll('.modal').forEach(function (m) { m.hidden = true; });
                document.body.style.overflow = '';
            }
        });
        document.body.addEventListener('click', function (e) {
            const closeTrigger = e.target.closest('[data-modal-close]');
            if (!closeTrigger) return;
            const modal = closeTrigger.closest('.modal');
            if (modal) {
                modal.hidden = true;
                document.body.style.overflow = '';
            }
        });
    }

    initNavigation();
    initEmergencyModalClose();
});
