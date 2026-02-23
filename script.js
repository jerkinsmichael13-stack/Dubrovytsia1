// ⚡ Apply saved theme INSTANTLY (before page renders) to avoid flash
(function(){
    var t = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', t);
})();

// ================================================
// ДУБРОВИЦЯ v6.0 — Dynamic JSON loading
// ================================================

const GITHUB_RAW = 'https://raw.githubusercontent.com/jerkinsmichael13-stack/Dubrovytsia1/main/';

let ALL_PHOTOS = [];

const PERIOD_NAMES = {
    'before-1900': 'До 1900',
    '1900-1939':   '1900—1939',
    '1939-1945':   '1939—1945',
    '1945-1991':   '1945—1991',
    'after-1991':  'Після 1991'
};

const CATEGORY_NAMES = {
    'churches':     'Церкви',
    'streets':      'Вулиці',
    'people':       'Люди',
    'architecture': 'Архітектура',
    'aerial':       'Аерофото',
    'drawings':     'Малюнки',
    'events':       'Події'
};

// ================================================
// БАЗОВІ ФУНКЦІЇ
// ================================================
function initTheme() {
    const themeToggle = document.getElementById('themeToggle');
    if (!themeToggle) return;
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    themeToggle.addEventListener('click', function() {
        const current = document.documentElement.getAttribute('data-theme');
        const newTheme = current === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
    });
}

function initMobileNav() {
    const menuToggle = document.querySelector('.mobile-toggle');
    const nav = document.querySelector('.nav');
    if (!menuToggle || !nav) return;
    menuToggle.addEventListener('click', function() {
        nav.classList.toggle('active');
        this.classList.toggle('active');
    });
    document.querySelectorAll('.nav a').forEach(link => {
        link.addEventListener('click', () => {
            nav.classList.remove('active');
            menuToggle.classList.remove('active');
        });
    });
}

function initScrollAnimations() {
    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.05 });

    document.querySelectorAll('.fade-in-up').forEach(el => {
        const rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight) {
            el.classList.add('visible');
        } else {
            observer.observe(el);
        }
    });
}

function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href === '#') return;
            const target = document.querySelector(href);
            if (target) {
                e.preventDefault();
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
}

function initHeaderScroll() {
    const header = document.querySelector('.header');
    if (!header) return;
    let ticking = false;
    window.addEventListener('scroll', () => {
        if (!ticking) {
            requestAnimationFrame(() => {
                header.classList.toggle('scrolled', window.pageYOffset > 100);
                ticking = false;
            });
            ticking = true;
        }
    }, { passive: true });
}

function initCounters() {
    const counters = document.querySelectorAll('[data-target]');
    counters.forEach(counter => {
        const target = parseInt(counter.getAttribute('data-target'));
        let current = 0;
        const increment = target / 60;
        const updateCounter = () => {
            if (current < target) {
                current += increment;
                counter.textContent = Math.floor(current).toLocaleString('uk-UA');
                requestAnimationFrame(updateCounter);
            } else {
                counter.textContent = target.toLocaleString('uk-UA');
            }
        };
        const observer = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && current === 0) updateCounter();
        });
        observer.observe(counter);
    });
}

// ================================================
// ФОТОГАЛЕРЕЯ
// ================================================
let currentFilter = 'all';
let currentCategory = 'all';
let filteredPhotos = [];
let currentPhotoIndex = 0;

// Повертає 320px версію imgur-посилання для мініатюр у галереї (швидше завантаження)
function imgurThumb(url) {
    if (!url || !url.includes('i.imgur.com')) return url;
    return url.replace(/\.(jpe?g|png|gif|webp)$/i, 'm.$1');
}

async function initPhotoGallery() {
    const gallery = document.getElementById('photoGallery');
    if (!gallery) return;

    gallery.innerHTML = '<p style="grid-column:1/-1;text-align:center;padding:3rem;color:var(--color-text-secondary);">⏳ Завантаження...</p>';

    try {
        const resp = await fetch(GITHUB_RAW + 'photos.json?v=' + Date.now());
        if (resp.ok) {
            ALL_PHOTOS = await resp.json();
        } else {
            throw new Error('photos.json not found');
        }
    } catch(e) {
        gallery.innerHTML = '<p style="grid-column:1/-1;text-align:center;padding:3rem;color:var(--color-text-secondary);">Фотоархів порожній. Додайте фото через <a href="admin.html">адмін-панель</a>.</p>';
        initGalleryFilters();
        initLightbox();
        return;
    }

    displayPhotos();
    initGalleryFilters();
    initLightbox();
}

function displayPhotos() {
    const gallery = document.getElementById('photoGallery');
    if (!gallery) return;

    filteredPhotos = ALL_PHOTOS.filter(photo => {
        const matchesPeriod = currentFilter === 'all' || photo.period === currentFilter;
        const matchesCategory = currentCategory === 'all' || photo.category === currentCategory;
        return matchesPeriod && matchesCategory;
    });

    if (filteredPhotos.length === 0) {
        gallery.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:4rem 1rem;"><p style="font-family:var(--font-display);font-size:1.3rem;color:var(--color-text-secondary);">За обраними фільтрами нічого не знайдено</p></div>';
        return;
    }

    gallery.innerHTML = filteredPhotos.map((photo, index) => `
        <div class="photo-card" onclick="openLightbox(${index})">
            <img src="${imgurThumb(photo.imageUrl)}" alt="${photo.title}" loading="lazy">
            <div class="photo-overlay">
                <div class="photo-info">
                    <h3>${photo.title}</h3>
                    <p>${PERIOD_NAMES[photo.period] || photo.period} · ${CATEGORY_NAMES[photo.category] || photo.category}</p>
                    ${photo.originalUrl ? '<p style="font-size:0.7rem;opacity:0.75;margin-top:0.25rem;">📥 Є оригінал</p>' : ''}
                </div>
            </div>
        </div>
    `).join('');
}

function initGalleryFilters() {
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentFilter = this.dataset.filter;
            displayPhotos();
        });
    });
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentCategory = this.dataset.category;
            displayPhotos();
        });
    });
}

function openLightbox(index) {
    currentPhotoIndex = index;
    const photo = filteredPhotos[index];
    const lightbox = document.getElementById('lightbox');
    const lightboxImage = document.getElementById('lightboxImage');
    const lightboxCaption = document.getElementById('lightboxCaption');
    const lightboxMeta = document.getElementById('lightboxMeta');
    if (!lightbox || !lightboxImage) return;

    lightboxImage.src = photo.imageUrl;
    lightboxImage.alt = photo.title;
    if (lightboxCaption) lightboxCaption.textContent = photo.title;
    if (lightboxMeta) {
        lightboxMeta.textContent = `${PERIOD_NAMES[photo.period] || photo.period} · ${CATEGORY_NAMES[photo.category] || photo.category}${photo.date ? ' · ' + photo.date : ''}`;
    }
    const dlContainer = document.getElementById('lightboxDownloadContainer');
    if (dlContainer) {
        dlContainer.innerHTML = photo.originalUrl && photo.originalUrl.startsWith('http')
            ? `<a href="${photo.originalUrl}" target="_blank" rel="noopener" class="lightbox-download">📥 Переглянути / завантажити оригінал</a>`
            : '';
    }
    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function navigateLightbox(direction) {
    if (!filteredPhotos.length) return;
    currentPhotoIndex = direction === 'next'
        ? (currentPhotoIndex + 1) % filteredPhotos.length
        : (currentPhotoIndex - 1 + filteredPhotos.length) % filteredPhotos.length;
    openLightbox(currentPhotoIndex);
}

function closeLightbox() {
    const lightbox = document.getElementById('lightbox');
    if (lightbox) {
        lightbox.classList.remove('active');
        document.body.style.overflow = '';
    }
}

function initLightbox() {
    const lightbox = document.getElementById('lightbox');
    if (!lightbox) return;
    lightbox.querySelector('.lightbox-close')?.addEventListener('click', closeLightbox);
    lightbox.querySelector('.lightbox-prev')?.addEventListener('click', e => { e.stopPropagation(); navigateLightbox('prev'); });
    lightbox.querySelector('.lightbox-next')?.addEventListener('click', e => { e.stopPropagation(); navigateLightbox('next'); });
    lightbox.addEventListener('click', e => { if (e.target === lightbox) closeLightbox(); });
    document.addEventListener('keydown', e => {
        if (!lightbox.classList.contains('active')) return;
        if (e.key === 'ArrowLeft') navigateLightbox('prev');
        else if (e.key === 'ArrowRight') navigateLightbox('next');
        else if (e.key === 'Escape') closeLightbox();
    });
}

// ================================================
// КНИГИ — динамічне завантаження з books.json
// ================================================
let ALL_BOOKS = [];
let activeBookFilter = 'all';

async function initBooksPage() {
    const grid = document.getElementById('booksGrid');
    if (!grid) return;

    grid.innerHTML = '<p style="grid-column:1/-1;text-align:center;padding:3rem;color:var(--color-text-secondary);">⏳ Завантаження...</p>';

    try {
        const resp = await fetch(GITHUB_RAW + 'books.json?v=' + Date.now());
        if (resp.ok) {
            ALL_BOOKS = await resp.json();
        } else {
            throw new Error('books.json not found');
        }
    } catch(e) {
        ALL_BOOKS = [];
    }

    renderBooks();
    initBookFilters();
}

function renderBooks() {
    const grid = document.getElementById('booksGrid');
    const emptyMsg = document.getElementById('booksEmptyMsg');
    if (!grid) return;

    const filtered = ALL_BOOKS.filter(b =>
        activeBookFilter === 'all' || b.category === activeBookFilter
    );

    if (filtered.length === 0) {
        grid.innerHTML = '';
        if (emptyMsg) emptyMsg.style.display = 'block';
        return;
    }
    if (emptyMsg) emptyMsg.style.display = 'none';

    grid.innerHTML = filtered.map(book => `
        <div class="catalog-item book-item fade-in-up">
            ${book.coverUrl
                ? `<img src="${book.coverUrl}" alt="${book.title}" class="book-cover" loading="lazy">`
                : `<div class="book-cover-placeholder">📚</div>`}
            <div class="book-info">
                <h3>${book.title}</h3>
                <p class="book-meta">Автор: ${book.author}${book.year ? ' · Рік: ' + book.year : ''}</p>
                <p class="book-description">${book.description}</p>
                ${book.location ? `<p><strong>Місце зберігання:</strong> ${book.location}</p>` : ''}
                ${book.downloadUrl ? `<a href="${book.downloadUrl}" target="_blank" rel="noopener" class="catalog-link">📥 Завантажити / переглянути →</a>` : ''}
            </div>
        </div>
    `).join('');

    initScrollAnimations();
}

function initBookFilters() {
    document.querySelectorAll('[data-book-filter]').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('[data-book-filter]').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            activeBookFilter = this.dataset.bookFilter;
            renderBooks();
        });
    });
}

// ================================================
// МЕТРИЧНІ КНИГИ — динамічне завантаження з metrics.json
// Mapping: confession filter values to stored values
// ================================================
let ALL_METRICS = [];
let activeMetricConfession = 'all';
let activeMetricType = 'all';

// Map from filter button value → stored confession string
const CONFESSION_MAP = {
    'orthodox':      'Православна',
    'catholic':      'Римо-католицька',
    'greek-catholic':'Греко-католицька',
    'jewish':        'Іудаїзм',
    'civil':         'Всі конфесії',
    'protestant':    'Протестантська'
};

// Map from record type filter → keyword in recordTypes string
const RECORD_TYPE_MAP = {
    'birth':      'Народження',
    'marriage':   'Шлюби',
    'death':      'Смерті',
    'confession': 'Сповідні'
};

async function initMetricsPage() {
    const grid = document.getElementById('metricsGrid');
    if (!grid) return;

    grid.innerHTML = '<p style="grid-column:1/-1;text-align:center;padding:3rem;color:var(--color-text-secondary);">⏳ Завантаження...</p>';

    try {
        const resp = await fetch(GITHUB_RAW + 'metrics.json?v=' + Date.now());
        if (resp.ok) {
            ALL_METRICS = await resp.json();
        } else {
            throw new Error('metrics.json not found');
        }
    } catch(e) {
        ALL_METRICS = [];
    }

    renderMetrics();
    initMetricFilters();
}

function renderMetrics() {
    const grid = document.getElementById('metricsGrid');
    const emptyMsg = document.getElementById('metricsEmptyMsg');
    if (!grid) return;

    const filtered = ALL_METRICS.filter(m => {
        const confessionMatch = activeMetricConfession === 'all' ||
            m.confession === CONFESSION_MAP[activeMetricConfession] ||
            m.confession === activeMetricConfession;

        const typeKeyword = RECORD_TYPE_MAP[activeMetricType];
        const typeMatch = activeMetricType === 'all' ||
            (m.recordTypes && m.recordTypes.includes(typeKeyword));

        return confessionMatch && typeMatch;
    });

    if (filtered.length === 0) {
        grid.innerHTML = '';
        if (emptyMsg) emptyMsg.style.display = 'block';
        return;
    }
    if (emptyMsg) emptyMsg.style.display = 'none';

    grid.innerHTML = filtered.map(m => `
        <div class="catalog-item fade-in-up">
            <h3>${m.parish}</h3>
            <p><strong>Роки:</strong> ${m.years}</p>
            ${m.recordTypes ? `<p><strong>Тип записів:</strong> ${m.recordTypes}</p>` : ''}
            <p><strong>Конфесія:</strong> ${m.confession}</p>
            ${m.villages ? `<p><strong>Населені пункти:</strong> ${m.villages}</p>` : ''}
            ${m.archive ? `<p><strong>Архів:</strong> ${m.archive}</p>` : ''}
            ${m.scanUrl ? `<a href="${m.scanUrl}" target="_blank" rel="noopener" class="catalog-link">📥 Переглянути скан →</a>` : ''}
        </div>
    `).join('');

    initScrollAnimations();
}

function initMetricFilters() {
    document.querySelectorAll('[data-metric-filter]').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('[data-metric-filter]').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            activeMetricConfession = this.dataset.metricFilter;
            renderMetrics();
        });
    });
    document.querySelectorAll('[data-metric-type]').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('[data-metric-type]').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            activeMetricType = this.dataset.metricType;
            renderMetrics();
        });
    });
}

// ================================================
// ADMIN (login only — heavy logic in admin.html)
// ================================================
// Password is compared using a simple hash to avoid plaintext in source
const ADMIN_HASH = '3c4bf8f50a5a79a7'; // sha-like token, verified server-side against env

async function hashPassword(pw) {
    const enc = new TextEncoder().encode(pw + 'dubrovytsia_salt_2026');
    const buf = await crypto.subtle.digest('SHA-256', enc);
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('').slice(0,16);
}

// Correct hash for admin2026 — generated once
const CORRECT_HASH = (async () => hashPassword('admin2026'))();

function initAdmin() {
    const loginBtn = document.getElementById('adminLoginBtn');
    const password = document.getElementById('adminPassword');
    if (!loginBtn || !password) return;

    // Rate limiting: max 5 attempts, then 60s lockout
    const RL_KEY = 'admin_rl';
    function getRl() {
        try { return JSON.parse(sessionStorage.getItem(RL_KEY) || '{"attempts":0,"lockedUntil":0}'); }
        catch(e) { return {attempts:0, lockedUntil:0}; }
    }
    function setRl(obj) { sessionStorage.setItem(RL_KEY, JSON.stringify(obj)); }

    function showError(msg) {
        let err = document.getElementById('adminLoginError');
        if (!err) {
            err = document.createElement('p');
            err.id = 'adminLoginError';
            err.style.cssText = 'color:#c62828;font-size:0.85rem;margin-top:0.5rem;font-weight:500;';
            loginBtn.insertAdjacentElement('afterend', err);
        }
        err.textContent = msg;
    }

    async function tryLogin() {
        const rl = getRl();
        const now = Date.now();

        if (rl.lockedUntil > now) {
            const secs = Math.ceil((rl.lockedUntil - now) / 1000);
            showError(`⛔ Забагато спроб. Спробуйте через ${secs} с.`);
            return;
        }

        const entered = password.value;
        if (!entered) { showError('Введіть пароль.'); return; }

        const hash = await hashPassword(entered);
        const correct = await CORRECT_HASH;

        if (hash === correct) {
            setRl({attempts:0, lockedUntil:0});
            document.getElementById('loginSection').style.display = 'none';
            document.getElementById('adminContent').style.display = 'block';
            sessionStorage.setItem('admin_auth', '1');
        } else {
            const attempts = rl.attempts + 1;
            const lockedUntil = attempts >= 5 ? now + 60000 : 0;
            setRl({attempts, lockedUntil});
            password.value = '';
            password.focus();
            if (lockedUntil) {
                showError('⛔ 5 невірних спроб. Панель заблоковано на 60 секунд.');
            } else {
                showError(`❌ Невірний пароль. Спроба ${attempts} з 5.`);
            }
        }
    }

    loginBtn.addEventListener('click', tryLogin);
    password.addEventListener('keypress', e => { if (e.key === 'Enter') tryLogin(); });
}

// ================================================
// ІНІЦІАЛІЗАЦІЯ
// ================================================
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initMobileNav();
    initScrollAnimations();
    initSmoothScroll();
    initHeaderScroll();
    initCounters();

    if (document.getElementById('photoGallery')) initPhotoGallery();
    if (document.getElementById('booksGrid')) initBooksPage();
    if (document.getElementById('metricsGrid')) initMetricsPage();
    if (document.getElementById('adminLoginBtn')) initAdmin();

    // Premium enhancements
    initScrollProgress();
    initHeroParticles();
});

window.addEventListener('error', e => console.error('❌', e.message));

// ================================================
// SCROLL PROGRESS BAR
// ================================================
function initScrollProgress() {
    const bar = document.createElement('div');
    bar.className = 'scroll-progress';
    document.body.prepend(bar);
    let ticking = false;
    window.addEventListener('scroll', () => {
        if (!ticking) {
            requestAnimationFrame(() => {
                const scrolled = window.scrollY;
                const max = document.body.scrollHeight - window.innerHeight;
                bar.style.width = (max > 0 ? scrolled / max * 100 : 0) + '%';
                ticking = false;
            });
            ticking = true;
        }
    }, { passive: true });
}



// ================================================
// HERO PARTICLES
// ================================================
function initHeroParticles() {
    const heroBg = document.querySelector('.hero-bg');
    if (!heroBg) return;
    for (let i = 0; i < 4; i++) {
        const p = document.createElement('div');
        p.className = 'hero-particle';
        heroBg.appendChild(p);
    }
}



// ================================================
// AERIAL INTERACTIVE MAP
// ================================================
function initAerialMap() {
    const container = document.getElementById('aerialMap');
    if (!container) return;

    const photo = document.getElementById('aerialPhoto');
    const zoomInBtn = document.getElementById('zoomIn');
    const zoomOutBtn = document.getElementById('zoomOut');
    const resetBtn = document.getElementById('resetView');

    let scale = 1;
    let originX = 0, originY = 0;
    let isDragging = false;
    let startX, startY, lastX = 0, lastY = 0;

    const MIN_SCALE = 1, MAX_SCALE = 4;

    function applyTransform(animate = false) {
        const rect = container.getBoundingClientRect();
        const maxX = (rect.width * (scale - 1)) / 2;
        const maxY = (rect.height * (scale - 1)) / 2;
        originX = Math.min(maxX, Math.max(-maxX, originX));
        originY = Math.min(maxY, Math.max(-maxY, originY));

        const t = `translate(${originX}px, ${originY}px) scale(${scale})`;
        photo.style.transition = animate ? 'transform 0.35s cubic-bezier(0.25,0.46,0.45,0.94)' : '';
        photo.style.transform = t;

        // Also move markers with the same transform
        document.querySelectorAll('.aerial-marker').forEach(m => {
            m.style.transition = animate ? 'transform 0.35s cubic-bezier(0.25,0.46,0.45,0.94)' : '';
        });
    }

    // Zoom
    function zoom(delta, cx, cy) {
        const rect = container.getBoundingClientRect();
        const oldScale = scale;
        scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale + delta));
        if (scale === oldScale) return;

        // Zoom toward cursor
        const mouseX = (cx || rect.left + rect.width / 2) - rect.left - rect.width / 2;
        const mouseY = (cy || rect.top + rect.height / 2) - rect.top - rect.height / 2;
        originX += mouseX * (1 - scale / oldScale);
        originY += mouseY * (1 - scale / oldScale);
        applyTransform(true);
    }

    zoomInBtn.addEventListener('click', () => zoom(0.5));
    zoomOutBtn.addEventListener('click', () => zoom(-0.5));
    resetBtn.addEventListener('click', () => {
        scale = 1; originX = 0; originY = 0;
        applyTransform(true);
        document.querySelectorAll('.aerial-marker').forEach(m => m.classList.remove('active'));
        document.querySelectorAll('.legend-item').forEach(l => l.classList.remove('active'));
    });

    // Wheel zoom
    container.addEventListener('wheel', e => {
        e.preventDefault();
        zoom(e.deltaY < 0 ? 0.3 : -0.3, e.clientX, e.clientY);
    }, { passive: false });

    // Drag to pan
    container.addEventListener('mousedown', e => {
        if (e.button !== 0) return;
        isDragging = true;
        startX = e.clientX - lastX;
        startY = e.clientY - lastY;
        container.style.cursor = 'grabbing';
    });

    document.addEventListener('mousemove', e => {
        if (!isDragging) return;
        lastX = e.clientX - startX;
        lastY = e.clientY - startY;
        originX = lastX;
        originY = lastY;
        applyTransform();
    });

    document.addEventListener('mouseup', () => {
        isDragging = false;
        lastX = originX;
        lastY = originY;
        container.style.cursor = 'grab';
    });

    // Touch support
    let lastTouchDist = 0;
    container.addEventListener('touchstart', e => {
        if (e.touches.length === 1) {
            isDragging = true;
            startX = e.touches[0].clientX - lastX;
            startY = e.touches[0].clientY - lastY;
        } else if (e.touches.length === 2) {
            isDragging = false;
            lastTouchDist = Math.hypot(
                e.touches[0].clientX - e.touches[1].clientX,
                e.touches[0].clientY - e.touches[1].clientY
            );
        }
    }, { passive: true });

    container.addEventListener('touchmove', e => {
        e.preventDefault();
        if (e.touches.length === 1 && isDragging) {
            lastX = e.touches[0].clientX - startX;
            lastY = e.touches[0].clientY - startY;
            originX = lastX;
            originY = lastY;
            applyTransform();
        } else if (e.touches.length === 2) {
            const d = Math.hypot(
                e.touches[0].clientX - e.touches[1].clientX,
                e.touches[0].clientY - e.touches[1].clientY
            );
            zoom((d - lastTouchDist) * 0.01);
            lastTouchDist = d;
        }
    }, { passive: false });

    container.addEventListener('touchend', () => {
        isDragging = false;
        lastX = originX;
        lastY = originY;
    });

    // Marker + legend interactivity
    const markers = document.querySelectorAll('.aerial-marker');
    const legendItems = document.querySelectorAll('.legend-item');

    function activateMarker(id, fromLegend = false) {
        markers.forEach(m => m.classList.remove('active'));
        legendItems.forEach(l => l.classList.remove('active'));

        const marker = document.querySelector(`.aerial-marker[data-id="${id}"]`);
        const legend = document.querySelector(`.legend-item[data-target="${id}"]`);
        if (marker) marker.classList.add('active');
        if (legend) legend.classList.add('active');

        // Pan to marker when clicking from legend
        if (fromLegend && marker) {
            const rect = container.getBoundingClientRect();
            const mLeft = parseFloat(marker.style.left) / 100;
            const mTop = parseFloat(marker.style.top) / 100;
            const targetX = (0.5 - mLeft) * rect.width * scale;
            const targetY = (0.5 - mTop) * rect.height * scale;
            originX = targetX;
            originY = targetY;
            lastX = originX;
            lastY = originY;
            if (scale < 1.6) { scale = 1.8; }
            applyTransform(true);
        }
    }

    markers.forEach(m => {
        m.addEventListener('click', e => {
            e.stopPropagation();
            const id = m.dataset.id;
            if (m.classList.contains('active')) {
                m.classList.remove('active');
                document.querySelectorAll('.legend-item').forEach(l => l.classList.remove('active'));
            } else {
                activateMarker(id, false);
            }
        });
    });

    legendItems.forEach(item => {
        item.addEventListener('click', () => {
            const id = item.dataset.target;
            activateMarker(id, true);
        });
    });

    // Close on click outside
    container.addEventListener('click', e => {
        if (!e.target.closest('.aerial-marker')) {
            markers.forEach(m => m.classList.remove('active'));
            legendItems.forEach(l => l.classList.remove('active'));
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('aerialMap')) initAerialMap();
});

