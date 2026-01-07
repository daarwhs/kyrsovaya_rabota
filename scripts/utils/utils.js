// ============================================
// scripts/utils/utils.js
// УТИЛИТЫ И ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// Модульная версия — используй: import utils from '../utils/utils.js';
// ============================================

/**
 * Безопасное получение элемента DOM
 */
export function $(selector, parent = document) {
    return parent.querySelector(selector);
}

/**
 * Безопасное получение всех элементов DOM
 */
export function $$(selector, parent = document) {
    return parent.querySelectorAll(selector);
}

/**
 * Создание элемента с атрибутами
 */
export function createElement(tag, attributes = {}, content = '') {
    const element = document.createElement(tag);

    Object.entries(attributes).forEach(([key, value]) => {
        if (key === 'className') {
            element.className = value;
        } else if (key === 'dataset') {
            Object.entries(value).forEach(([dataKey, dataValue]) => {
                element.dataset[dataKey] = dataValue;
            });
        } else if (key.startsWith('on') && typeof value === 'function') {
            element.addEventListener(key.substring(2).toLowerCase(), value);
        } else {
            element.setAttribute(key, value);
        }
    });

    if (typeof content === 'string') {
        element.innerHTML = content;
    } else if (content instanceof HTMLElement) {
        element.appendChild(content);
    }

    return element;
}

/**
 * Форматирование даты
 */
export function formatDate(date, format = 'full') {
    const d = new Date(date);
    if (isNaN(d.getTime())) return 'Некорректная дата';

    const options = {
        full: { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' },
        short: { day: '2-digit', month: '2-digit', year: 'numeric' },
        time: { hour: '2-digit', minute: '2-digit' }
    };

    return d.toLocaleDateString('ru-RU', options[format] || options.full);
}

/**
 * Генератор уникального ID
 */
export function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * Сохранение в localStorage
 */
export function saveToLocalStorage(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
        return true;
    } catch (error) {
        console.error(`Ошибка сохранения в localStorage (${key}):`, error);
        return false;
    }
}

/**
 * Загрузка из localStorage
 */
export function loadFromLocalStorage(key, defaultValue = null) {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
        console.error(`Ошибка загрузки из localStorage (${key}):`, error);
        return defaultValue;
    }
}

/**
 * Удаление из localStorage
 */
export function removeFromLocalStorage(key) {
    try {
        localStorage.removeItem(key);
    } catch (error) {
        console.error(`Ошибка удаления из localStorage (${key}):`, error);
    }
}

/**
 * Показ уведомления
 */
export function showNotification(message, type = 'info', duration = 3000) {
    // Удаляем старые уведомления
    $$('.notification').forEach(n => n.remove());

    const types = {
        success: { icon: '✅', color: '#4CAF50', bg: '#E8F5E9' },
        error: { icon: '❌', color: '#F44336', bg: '#FFEBEE' },
        warning: { icon: '⚠️', color: '#FF9800', bg: '#FFF3E0' },
        info: { icon: 'ℹ️', color: '#2196F3', bg: '#E3F2FD' }
    };

    const config = types[type] || types.info;

    const notification = createElement('div', {
        className: `notification notification--${type}`,
        style: `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${config.bg};
            color: #333;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 9999;
            display: flex;
            align-items: center;
            gap: 0.75rem;
            max-width: 350px;
            animation: slideIn 0.3s ease;
            border-left: 4px solid ${config.color};
        `
    });

    notification.innerHTML = `
        <span class="notification__icon" style="font-size: 1.25rem;">${config.icon}</span>
        <span class="notification__message" style="flex: 1;">${message}</span>
    `;

    document.body.appendChild(notification);

    // Автозакрытие
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        notification.addEventListener('animationend', () => notification.remove(), { once: true });
    }, duration);

    // Закрытие по клику
    notification.addEventListener('click', () => {
        notification.style.animation = 'slideOut 0.3s ease';
        notification.addEventListener('animationend', () => notification.remove(), { once: true });
    });
}

/**
 * Проверка поддержки localStorage
 */
export function isLocalStorageSupported() {
    try {
        const test = '__test__';
        localStorage.setItem(test, test);
        localStorage.removeItem(test);
        return true;
    } catch {
        return false;
    }
}

/**
 * Throttle
 */
export function throttle(func, limit) {
    let inThrottle;
    return function (...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => (inThrottle = false), limit);
        }
    };
}

/**
 * Debounce
 */
export function debounce(func, wait) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

/**
 * Глубокое клонирование
 */
export function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
}

/**
 * Валидация email
 */
export function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Валидация телефона
 */
export function isValidPhone(phone) {
    return /^[\d\s\-\+\(\)]+$/.test(phone.replace(/\s/g, ''));
}

/**
 * Форматирование телефона
 */
export function formatPhone(phone) {
    const cleaned = phone.replace(/\D/g, '');

    if (cleaned.length === 11 && cleaned.startsWith('8')) {
        return `+7 ${cleaned.substring(1, 4)} ${cleaned.substring(4, 7)}-${cleaned.substring(7, 9)}-${cleaned.substring(9)}`;
    }
    if (cleaned.length === 10) {
        return `+7 ${cleaned.substring(0, 3)} ${cleaned.substring(3, 6)}-${cleaned.substring(6, 8)}-${cleaned.substring(8)}`;
    }
    return phone;
}

/**
 * Копирование в буфер обмена
 */
export async function copyToClipboard(text) {
    try {
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(text);
            return true;
        }

        // Fallback
        const textarea = createElement('textarea', {
            value: text,
            style: 'position:fixed;top:-1000px;left:-1000px;'
        });
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        return true;
    } catch (error) {
        console.error('Ошибка копирования:', error);
        return false;
    }
}

/**
 * Загрузка JSON (с fallback — возвращает null при ошибке)
 */
export async function loadJSON(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return await response.json();
    } catch (error) {
        console.warn('Ошибка загрузки JSON:', url, error);
        return null;
    }
}

/**
 * Показ спиннера загрузки
 */
export function showLoading(show = true, message = 'Загрузка...') {
    let spinner = $('#loading-spinner');

    if (show) {
        if (!spinner) {
            spinner = createElement('div', {
                id: 'loading-spinner',
                style: `
                    position: fixed;
                    inset: 0;
                    background: rgba(255,255,255,0.9);
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    z-index: 9999;
                    gap: 1rem;
                `
            });

            spinner.innerHTML = `
                <div class="spinner" style="
                    width: 50px;
                    height: 50px;
                    border: 5px solid #f3f3f3;
                    border-top: 5px solid #8AA2A9;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                "></div>
                <p style="color:#333;font-size:1rem;">${message}</p>
            `;

            // Добавляем анимацию один раз
            if (!$('#spinner-styles')) {
                const style = createElement('style', { id: 'spinner-styles' }, `
                    @keyframes spin { to { transform: rotate(360deg); } }
                `);
                document.head.appendChild(style);
            }

            document.body.appendChild(spinner);
        }
    } else if (spinner) {
        spinner.remove();
    }
}

// Экспорт всех утилит
export default {
    $,
    $$,
    createElement,
    formatDate,
    generateId,
    saveToLocalStorage,
    loadFromLocalStorage,
    removeFromLocalStorage,
    showNotification,
    isLocalStorageSupported,
    throttle,
    debounce,
    deepClone,
    isValidEmail,
    isValidPhone,
    formatPhone,
    copyToClipboard,
    loadJSON,
    showLoading
};
if (typeof window !== 'undefined') {
    window.utils = {
        $,
        $$,
        createElement,
        formatDate,
        generateId,
        saveToLocalStorage,
        loadFromLocalStorage,
        removeFromLocalStorage,
        showNotification,
        isLocalStorageSupported,
        throttle,
        debounce,
        deepClone,
        isValidEmail,
        isValidPhone,
        formatPhone,
        copyToClipboard,
        loadJSON,
        showLoading
    };
}
