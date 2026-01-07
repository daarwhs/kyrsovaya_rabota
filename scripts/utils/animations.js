document.addEventListener('DOMContentLoaded', () => {
    // Check if IntersectionObserver is supported
    if (!('IntersectionObserver' in window)) {
        document.querySelectorAll('.animate-on-scroll').forEach(el => {
            el.classList.add('animate-visible');
        });
        return;
    }

    const observerOptions = {
        threshold: 0.15,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-visible');
                observer.unobserve(entry.target); // Animate only once
            }
        });
    }, observerOptions);

    // Select elements to animate
    // We target specific elements from our new design
    const targets = [
        ...document.querySelectorAll('.features-card'),
        ...document.querySelectorAll('.main-hero__content'),
        ...document.querySelectorAll('.main-hero__image-wrapper'),
        ...document.querySelectorAll('.state-selection__box')
    ];

    targets.forEach(el => {
        el.classList.add('animate-on-scroll');
        observer.observe(el);
    });
});
