
/**
 * blocks/exercise-card/exercise-card.js
 * Упражнения с карточками, модальным окном и таймерами
 */

document.addEventListener('DOMContentLoaded', () => {
    const grid = document.getElementById('exercisesGrid');
    if (!grid) {
        console.warn('exercisesGrid не найден на странице');
        return;
    }

    // Данные упражнений (встроенные — не зависят от внешних файлов)
    const exercises = [
        {
            id: "breathing-478",
            title: "Дыхание 4-7-8",
            description: "Мощная техника для быстрого снятия тревоги",
            instruction: "Вдох через нос на 4 секунды → Задержка дыхания на 7 секунд → Медленный выдох через рот на 8 секунд",
            steps: [
                { action: "Вдох", duration: 4, color: "#9CAF88", sound: "in" },
                { action: "Задержка", duration: 7, color: "#B4A7D6", sound: "hold" },
                { action: "Выдох", duration: 8, color: "#8AA2A9", sound: "out" }
            ]
        },
        {
            id: "square-breathing",
            title: "Квадратное дыхание",
            description: "Помогает успокоиться и сосредоточиться",
            instruction: "Дышите по квадрату: вдох → задержка → выдох → задержка. По 4 секунды на каждую фазу.",
            steps: [
                { action: "Вдох", duration: 4, color: "#9CAF88", sound: "in" },
                { action: "Задержка", duration: 4, color: "#B4A7D6", sound: "hold" },
                { action: "Выдох", duration: 4, color: "#8AA2A9", sound: "out" },
                { action: "Задержка", duration: 4, color: "#B4A7D6", sound: "hold" }
            ]
        },
        {
            id: "grounding-54321",
            title: "Техника заземления 5-4-3-2-1",
            description: "Быстро возвращает в «здесь и сейчас» при панике",
            instruction: "Назови по очереди: 5 вещей, которые видишь → 4, которые можешь потрогать → 3 звука → 2 запаха → 1 вкус",
            steps: [
                { action: "5 вещей, которые вы видите", duration: 30, color: "#9CAF88", sound: "step" },
                { action: "4 вещи, которые можете потрогать", duration: 24, color: "#B4A7D6", sound: "step" },
                { action: "3 звука, которые слышите", duration: 18, color: "#8AA2A9", sound: "step" },
                { action: "2 запаха", duration: 12, color: "#9CAF88", sound: "step" },
                { action: "1 вкус", duration: 6, color: "#B4A7D6", sound: "complete" }
            ]
        }
    ];

    // Пути к изображениям (обновлённые!)
    const images = {
        "breathing-478": "../../images/content/exercises/exercise-1.jpg.jpg",
        "square-breathing": "../../images/content/exercises/exercise-2.jpg.jpg",
        "grounding-54321": "../../images/content/exercises/exercise-3.jpg.jpg"
    };

    // Создаём модальное окно один раз
    if (!document.getElementById('exerciseModal')) {
        const modalHTML = `
            <div class="modal modal--exercise" id="exerciseModal" role="dialog" aria-labelledby="exerciseModalTitle" aria-modal="true" hidden>
                <div class="modal__overlay" data-modal-close></div>
                <div class="modal__container">
                    <div class="modal__header">
                        <h2 class="modal__title" id="exerciseModalTitle">Упражнение</h2>
                        <button class="modal__close" data-modal-close aria-label="Закрыть">×</button>
                    </div>
                    <div class="modal__body" id="exerciseModalBody"></div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);

        // Закрытие модалки
        document.querySelectorAll('#exerciseModal [data-modal-close]').forEach(el => {
            el.addEventListener('click', closeExerciseModal);
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !document.getElementById('exerciseModal').hidden) {
                closeExerciseModal();
            }
        });
    }

    // Глобальные переменные таймера
    let currentTimerInterval = null;
    let isTimerPaused = false;
    let pausedTimeLeft = 0;
    let pausedStepIndex = 0;
    let currentExercise = null;

    // Открытие модалки
    function openExerciseModal(exercise) {
        const modal = document.getElementById('exerciseModal');
        const title = document.getElementById('exerciseModalTitle');
        const body = document.getElementById('exerciseModalBody');

        title.textContent = exercise.title;
        body.innerHTML = `
            <div class="exercise-modal">
                <p class="exercise-modal__description">${exercise.description}</p>
                <p class="exercise-modal__instruction">${exercise.instruction}</p>

                <div class="exercise-modal__timer">
                    <div class="exercise-card__timer-circle">
                        <svg viewBox="0 0 100 100" class="exercise-card__timer-svg">
                            <circle cx="50" cy="50" r="45" class="exercise-card__timer-bg"/>
                            <circle cx="50" cy="50" r="45" class="exercise-card__timer-progress" id="modal-progress"/>
                        </svg>
                        <div class="exercise-card__timer-display">
                            <div class="exercise-card__timer-phase" id="modal-phase">Готовы?</div>
                            <div class="exercise-card__timer-seconds" id="modal-seconds">0</div>
                        </div>
                    </div>
                </div>

                <div class="exercise-modal__actions">
                    <button class="exercise-card__button" id="startExerciseBtn">Начать упражнение</button>
                    <button class="exercise-card__button exercise-card__button--pause" id="pauseExerciseBtn" style="display:none;">Пауза</button>
                    <button class="exercise-card__button exercise-card__button--restart" id="restartExerciseBtn" style="display:none;">Перезапустить</button>
                    <button class="exercise-card__timer-stop" id="stopExerciseBtn" style="display:none;">Стоп</button>
                </div>
            </div>
        `;

        modal.hidden = false;
        document.body.style.overflow = 'hidden';

        // Кнопки управления
        document.getElementById('startExerciseBtn').addEventListener('click', () => startExercise(exercise));
        document.getElementById('pauseExerciseBtn').addEventListener('click', togglePause);
        document.getElementById('restartExerciseBtn').addEventListener('click', restartExercise);
        document.getElementById('stopExerciseBtn').addEventListener('click', stopExercise);
    }

    function startExercise(exercise, resume = false) {
        currentExercise = exercise;

        document.getElementById('startExerciseBtn').style.display = 'none';
        document.getElementById('pauseExerciseBtn').style.display = 'block';
        document.getElementById('stopExerciseBtn').style.display = 'block';

        runTimer(exercise, resume);
    }

    function togglePause() {
        const pauseBtn = document.getElementById('pauseExerciseBtn');
        if (isTimerPaused) {
            pauseBtn.textContent = 'Пауза';
            pauseBtn.classList.remove('exercise-card__button--resume');
            runTimer(currentExercise, true);
        } else {
            pauseBtn.textContent = 'Продолжить';
            pauseBtn.classList.add('exercise-card__button--resume');
            pauseTimer();
        }
        isTimerPaused = !isTimerPaused;
    }

    function restartExercise() {
        stopTimer();
        resetTimerUI();
        document.getElementById('startExerciseBtn').style.display = 'block';
        document.getElementById('pauseExerciseBtn').style.display = 'none';
        document.getElementById('restartExerciseBtn').style.display = 'none';
        document.getElementById('stopExerciseBtn').style.display = 'none';
    }

    function closeExerciseModal() {
        stopTimer();
        resetTimerUI();
        document.getElementById('exerciseModal').hidden = true;
        document.body.style.overflow = '';
        currentExercise = null;
        isTimerPaused = false;
    }

    function stopExercise() {
        stopTimer();
        isTimerPaused = false;
        resetTimerUI();
        document.getElementById('startExerciseBtn').style.display = 'block';
        document.getElementById('pauseExerciseBtn').style.display = 'none';
        document.getElementById('restartExerciseBtn').style.display = 'none';
        const stopBtn = document.getElementById('stopExerciseBtn');
        if (stopBtn) {
            stopBtn.textContent = 'Стоп';
        }
    }

    function stopTimer() {
        if (currentTimerInterval) {
            clearInterval(currentTimerInterval);
            currentTimerInterval = null;
        }
    }

    function pauseTimer() {
        stopTimer();
    }

    function resetTimerUI() {
        const phaseEl = document.getElementById('modal-phase');
        const secondsEl = document.getElementById('modal-seconds');
        const progress = document.getElementById('modal-progress');

        phaseEl.textContent = 'Готовы?';
        phaseEl.style.color = '';
        secondsEl.textContent = '0';
        progress.style.strokeDashoffset = progress.style.strokeDasharray || '283';
        progress.style.stroke = '';
    }

    function runTimer(exercise, resume = false) {
        let stepIndex = resume ? pausedStepIndex : 0;
        let timeLeft = resume ? pausedTimeLeft : exercise.steps[stepIndex].duration;

        const progress = document.getElementById('modal-progress');
        const phaseEl = document.getElementById('modal-phase');
        const secondsEl = document.getElementById('modal-seconds');
        const restartBtn = document.getElementById('restartExerciseBtn');

        const totalDuration = exercise.steps.reduce((sum, step) => sum + step.duration, 0);
        const circumference = 283; // 2 * π * 45 ≈ 283
        progress.style.strokeDasharray = circumference;

        let elapsed = resume
            ? totalDuration - exercise.steps.slice(stepIndex).reduce((sum, s) => sum + s.duration, 0) - (exercise.steps[stepIndex].duration - timeLeft)
            : 0;

        function updatePhase() {
            const step = exercise.steps[stepIndex];
            phaseEl.textContent = step.action;
            phaseEl.style.color = step.color;
            progress.style.stroke = step.color;
            if (step.sound) playSound(step.sound);
        }

        updatePhase();

        stopTimer(); // на всякий случай

        currentTimerInterval = setInterval(() => {
            elapsed++;
            const offset = circumference - (circumference * elapsed / totalDuration);
            progress.style.strokeDashoffset = offset;

            secondsEl.textContent = timeLeft;

            if (timeLeft <= 3 && timeLeft > 0 && stepIndex < exercise.steps.length - 1) {
                playSound('tick');
            }

            if (--timeLeft < 0) {
                stepIndex++;
                if (stepIndex >= exercise.steps.length) {
                    stopTimer();
                    phaseEl.textContent = "Готово! Вы молодец ✨";
                    secondsEl.textContent = "0";
                    progress.style.strokeDashoffset = 0;
                    playSound('complete');
                    document.getElementById('pauseExerciseBtn').style.display = 'none';
                    restartBtn.style.display = 'block';
                    document.getElementById('stopExerciseBtn').textContent = 'Закрыть';
                    return;
                }
                timeLeft = exercise.steps[stepIndex].duration;
                updatePhase();
            }

            pausedTimeLeft = timeLeft;
            pausedStepIndex = stepIndex;
        }, 1000);
    }

    // Звуки
    function playSound(type = 'tick') {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);

            switch (type) {
                case 'in': osc.frequency.value = 400; gain.gain.value = 0.1; osc.start(); osc.stop(ctx.currentTime + 0.3); break;
                case 'out': osc.frequency.value = 300; gain.gain.value = 0.1; osc.start(); osc.stop(ctx.currentTime + 0.4); break;
                case 'hold': osc.frequency.value = 350; gain.gain.value = 0.05; osc.start(); osc.stop(ctx.currentTime + 0.2); break;
                case 'step': osc.frequency.value = 500; gain.gain.value = 0.15; osc.start(); osc.stop(ctx.currentTime + 0.2); break;
                case 'complete':
                    [523, 659, 784].forEach((f, i) => {
                        const o = ctx.createOscillator();
                        const g = ctx.createGain();
                        o.frequency.value = f;
                        o.connect(g);
                        g.connect(ctx.destination);
                        g.gain.setValueAtTime(0.1, ctx.currentTime + i * 0.1);
                        o.start(ctx.currentTime + i * 0.1);
                        o.stop(ctx.currentTime + 0.5 + i * 0.1);
                    });
                    break;
                default:
                    osc.frequency.value = 800;
                    gain.gain.value = 0.05;
                    osc.start();
                    osc.stop(ctx.currentTime + 0.1);
            }
        } catch (e) {
            console.log('Звук недоступен:', e);
        }
    }

    // Рендер карточек
    grid.innerHTML = exercises.map(ex => {
        const hasImage = !!images[ex.id];
        return `
            <div class="exercise-card" data-id="${ex.id}">
                <div class="exercise-card__image-wrapper ${hasImage ? 'exercise-card__image-wrapper--has-image' : ''}">
                    ${hasImage ? `<img src="${images[ex.id]}" alt="${ex.title}" loading="lazy" class="exercise-card__image" onerror="this.parentElement.classList.remove('exercise-card__image-wrapper--has-image'); this.remove();">` : ''}
                </div>
                <h3 class="exercise-card__title">${ex.title}</h3>
                <p class="exercise-card__description">${ex.description}</p>
                <button class="exercise-card__button" data-exercise-id="${ex.id}">Начать упражнение</button>
            </div>
        `;
    }).join('');

    // Открытие по клику
    grid.addEventListener('click', (e) => {
        const btn = e.target.closest('.exercise-card__button');
        if (btn) {
            const id = btn.dataset.exerciseId;
            const exercise = exercises.find(ex => ex.id === id);
            if (exercise) openExerciseModal(exercise);
        }
    });
});
