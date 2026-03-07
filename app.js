// ⚡ Застосувати тему ДО рендеру — без блимання
(function(){
    var t = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', t);
})();

// ================================================
// ДУБРОВИЦЯ — app.js v10.0
// ================================================

const GITHUB_RAW = 'https://raw.githubusercontent.com/jerkinsmichael13-stack/Dubrovytsia1/main/';

// ─── Дані ─────────────────────────────────────
let ALL_PHOTOS   = [];
let ALL_BOOKS    = [];
let ALL_METRICS  = [];

let currentFilter       = 'all';
let currentCategory     = 'all';
let filteredPhotos       = [];
let currentPhotoIndex   = 0;
let activeBookFilter    = 'all';
let activeMetricConfession = 'all';
let activeMetricType    = 'all';

// ─── Словники ──────────────────────────────────
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
const CONFESSION_MAP = {
    'orthodox':       'Православна',
    'catholic':       'Римо-католицька',
    'greek-catholic': 'Греко-католицька',
    'jewish':         'Іудаїзм',
    'civil':          'Всі конфесії',
    'protestant':     'Протестантська'
};
const RECORD_TYPE_MAP = {
    'birth':      'Народження',
    'marriage':   'Шлюби',
    'death':      'Смерті',
    'confession': 'Сповідні'
};

// ================================================
// БАЗОВІ ФУНКЦІЇ
// ================================================

function initTheme() {
    const btn = document.getElementById('themeToggle');
    if (!btn) return;
    btn.addEventListener('click', () => {
        const cur = document.documentElement.getAttribute('data-theme');
        const next = cur === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('theme', next);
    });
}

function initMobileNav() {
    const toggle = document.querySelector('.mobile-toggle');
    const nav    = document.querySelector('.nav');
    if (!toggle || !nav) return;
    toggle.addEventListener('click', function() {
        const open = nav.classList.toggle('active');
        this.classList.toggle('active');
        this.setAttribute('aria-expanded', open);
        this.setAttribute('aria-label', open ? 'Закрити меню' : 'Відкрити меню');
    });
    nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
        nav.classList.remove('active');
        toggle.classList.remove('active');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.setAttribute('aria-label', 'Відкрити меню');
    }));
    // Повна висота на мобільному
    new ResizeObserver(() => {
        nav.style.height = window.innerWidth <= 1024 ? '100dvh' : '';
    }).observe(document.body);
}

function initScrollAnimations() {
    const obs = new IntersectionObserver(entries => {
        entries.forEach(e => {
            if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); }
        });
    }, { threshold: 0.05 });
    document.querySelectorAll('.fade-in-up').forEach(el => {
        el.getBoundingClientRect().top < window.innerHeight
            ? el.classList.add('visible')
            : obs.observe(el);
    });
}

function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(a => {
        a.addEventListener('click', e => {
            const id = a.getAttribute('href');
            if (id === '#') return;
            const t = document.querySelector(id);
            if (t) { e.preventDefault(); t.scrollIntoView({ behavior: 'smooth' }); }
        });
    });
}

function initHeaderScroll() {
    const header = document.querySelector('.header');
    if (!header) return;
    header.style.transition = 'transform 0.4s cubic-bezier(0.22,1,0.36,1), opacity 0.4s ease, box-shadow 0.4s ease';
    let lastY = 0, hidden = false, ticking = false;
    window.addEventListener('scroll', () => {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(() => {
            const y = window.pageYOffset;
            header.classList.toggle('scrolled', y > 100);
            if (y > 120) {
                const d = y - lastY;
                if (d > 2 && !hidden)  { header.style.transform = 'translateY(-6px)'; header.style.opacity = '0.9'; hidden = true; }
                if (d < -2 && hidden)  { header.style.transform = 'translateY(0)';    header.style.opacity = '1';   hidden = false; }
            } else {
                header.style.transform = 'translateY(0)'; header.style.opacity = '1'; hidden = false;
            }
            lastY = y; ticking = false;
        });
    }, { passive: true });
}

function initCounters() {
    document.querySelectorAll('[data-target]').forEach(el => {
        const target = parseInt(el.getAttribute('data-target'));
        let cur = 0;
        const step = target / 60;
        const obs = new IntersectionObserver(entries => {
            if (!entries[0].isIntersecting || cur > 0) return;
            obs.unobserve(el);
            const tick = () => {
                if (cur < target) { cur += step; el.textContent = Math.floor(cur).toLocaleString('uk-UA'); requestAnimationFrame(tick); }
                else el.textContent = target.toLocaleString('uk-UA');
            };
            tick();
        });
        obs.observe(el);
    });
}

function initScrollProgress() {
    const bar = document.createElement('div');
    bar.className = 'scroll-progress';
    document.body.prepend(bar);
    let ticking = false;
    window.addEventListener('scroll', () => {
        if (ticking) return; ticking = true;
        requestAnimationFrame(() => {
            const max = document.body.scrollHeight - window.innerHeight;
            bar.style.width = (max > 0 ? window.scrollY / max * 100 : 0) + '%';
            ticking = false;
        });
    }, { passive: true });
}

function initHeroParticles() {
    const bg = document.querySelector('.hero-bg');
    if (!bg) return;
    for (let i = 0; i < 4; i++) {
        const p = document.createElement('div');
        p.className = 'hero-particle';
        bg.appendChild(p);
    }
}

// ================================================
// HERO: паралакс + scroll hint
// ================================================

function initHeroEnhancements() {
    const bg   = document.querySelector('.hero-bg');
    const hero = document.querySelector('.hero');
    if (!bg) return;

    // Fade-in при завантаженні
    requestAnimationFrame(() => bg.classList.add('loaded'));

    // Паралакс
    let ticking = false;
    window.addEventListener('scroll', () => {
        if (ticking) return; ticking = true;
        requestAnimationFrame(() => {
            if (window.pageYOffset < (hero?.offsetHeight || 800)) {
                bg.style.transform = `scale(1) translateY(${(window.pageYOffset / (hero?.offsetHeight || 800)) * 15}%)`;
            }
            ticking = false;
        });
    }, { passive: true });

    // Scroll hint
    if (hero && !hero.querySelector('.hero-scroll-hint')) {
        const hint = document.createElement('div');
        hint.className = 'hero-scroll-hint';
        hint.innerHTML = '<span>Гортати</span><div class="scroll-line"></div>';
        hero.appendChild(hint);
    }
}

// ================================================
// ДЕКОР: орнаменти під заголовками
// ================================================

function injectSectionOrnaments() {
    document.querySelectorAll('.section-title').forEach(title => {
        if (title.nextElementSibling?.classList.contains('section-ornament')) return;
        const orn = document.createElement('div');
        orn.className = 'section-ornament';
        orn.innerHTML = `<div class="section-ornament-icon"></div>`;
        title.insertAdjacentElement('afterend', orn);
    });
}

// ================================================
// ЗОБРАЖЕННЯ: плавна поява при завантаженні
// ================================================

function initImageReveal() {
    document.querySelectorAll('img[loading="lazy"]').forEach(img => {
        img.style.opacity = img.complete ? '1' : '0';
        img.style.transition = 'opacity 0.6s ease';
        if (!img.complete) img.addEventListener('load', () => { img.style.opacity = '1'; });
    });
}

// ================================================
// КАРТКИ: 3D-нахил при наведенні
// ================================================

function initMagneticCards() {
    if (window.matchMedia('(hover: none)').matches) return;
    document.querySelectorAll('.card, .catalog-item, .photo-card').forEach(card => {
        card.addEventListener('mouseenter', () => {
            card.style.transition = 'transform 0.15s ease, box-shadow 0.4s ease, border-color 0.3s ease';
        });
        card.addEventListener('mousemove', e => {
            const r = card.getBoundingClientRect();
            const x = (e.clientX - r.left) / r.width - 0.5;
            const y = (e.clientY - r.top) / r.height - 0.5;
            card.style.transform = `translateY(-8px) perspective(1000px) rotateX(${y * -2.5}deg) rotateY(${x * 2.5}deg)`;
        });
        card.addEventListener('mouseleave', () => {
            card.style.transform = '';
            card.style.transition = 'transform 0.6s cubic-bezier(0.22,1,0.36,1), box-shadow 0.5s ease, border-color 0.3s ease';
        });
    });
}

// ================================================
// КАТАЛОГ: плавна поява елементів
// ================================================

function initCatalogStagger() {
    document.querySelectorAll('.catalog-item').forEach((item, i) => {
        item.style.opacity = '0';
        item.style.transform = 'translateY(24px)';
        item.style.transition = 'opacity 0.6s cubic-bezier(0.22,1,0.36,1), transform 0.6s cubic-bezier(0.22,1,0.36,1)';
        const obs = new IntersectionObserver(([e]) => {
            if (!e.isIntersecting) return;
            setTimeout(() => { item.style.opacity = '1'; item.style.transform = 'translateY(0)'; }, i * 60);
            obs.unobserve(item);
        }, { threshold: 0.1 });
        obs.observe(item);
    });
}

// ================================================
// TOOLTIPS
// ================================================

function initTooltips() {
    document.querySelectorAll('[data-tooltip]').forEach(el => {
        el.addEventListener('mouseenter', () => {
            const tip = document.createElement('div');
            tip.textContent = el.dataset.tooltip;
            tip.className = 'tooltip-popup';
            document.body.appendChild(tip);
            const r = el.getBoundingClientRect();
            tip.style.top  = (r.top - tip.offsetHeight - 8) + 'px';
            tip.style.left = (r.left + r.width / 2 - tip.offsetWidth / 2) + 'px';
            el._tip = tip;
        });
        el.addEventListener('mouseleave', () => { el._tip?.remove(); delete el._tip; });
    });
}

// ================================================
// ФОТОГАЛЕРЕЯ
// ================================================

function imgurThumb(url) {
    if (!url) return url;
    if (url.includes('i.imgur.com')) return url.replace(/\.(jpe?g|png|gif|webp)$/i, 'l.$1');
    return url;
}

async function initPhotoGallery() {
    const gallery = document.getElementById('photoGallery');
    if (!gallery) return;
    gallery.innerHTML = '<p class="loading-msg">⏳ Завантаження...</p>';
    try {
        const r = await fetch(GITHUB_RAW + 'photos.json?v=' + Date.now());
        if (r.ok) ALL_PHOTOS = await r.json(); else throw new Error();
    } catch {
        gallery.innerHTML = '<p class="loading-msg">Фотоархів порожній. Додайте фото через <a href="admin.html">адмін-панель</a>.</p>';
    }
    displayPhotos();
    initGalleryFilters();
    initLightbox();
}

function displayPhotos() {
    const gallery = document.getElementById('photoGallery');
    if (!gallery) return;
    filteredPhotos = ALL_PHOTOS.filter(p =>
        (currentFilter === 'all' || p.period === currentFilter) &&
        (currentCategory === 'all' || p.category === currentCategory)
    );
    if (!filteredPhotos.length) {
        gallery.style.cssText = 'display:flex;justify-content:center;align-items:center;min-height:300px;column-count:unset';
        gallery.innerHTML = '<p style="font-family:var(--font-display);font-size:1.3rem;color:var(--color-text-secondary);text-align:center">За обраними фільтрами нічого не знайдено</p>';
        return;
    }
    gallery.style.cssText = '';
    gallery.innerHTML = filteredPhotos.map((p, i) => `
        <div class="photo-card" onclick="openLightbox(${i})">
            <img src="${imgurThumb(p.imageUrl)}" alt="${p.title}" loading="lazy">
            <div class="photo-overlay">
                <div class="photo-info">
                    <h3>${p.title}</h3>
                    <p>${PERIOD_NAMES[p.period] || p.period} · ${CATEGORY_NAMES[p.category] || p.category}</p>
                    ${p.originalUrl ? '<p style="font-size:0.7rem;opacity:0.75;margin-top:0.25rem">📥 Є оригінал</p>' : ''}
                </div>
            </div>
        </div>
    `).join('');
    enhancePhotoCards();
    initImageReveal();
}

function initGalleryFilters() {
    const bind = (sel, prop, setter) => document.querySelectorAll(sel).forEach(b => {
        b.addEventListener('click', function() {
            document.querySelectorAll(sel).forEach(x => x.classList.remove('active'));
            this.classList.add('active');
            window[prop] = this.dataset[setter];
            displayPhotos();
        });
    });
    bind('.filter-btn',   'currentFilter',   'filter');
    bind('.category-btn', 'currentCategory', 'category');
}

function openLightbox(index) {
    currentPhotoIndex = index;
    const p  = filteredPhotos[index];
    const lb = document.getElementById('lightbox');
    const img = document.getElementById('lightboxImage');
    if (!lb || !img) return;
    img.src = p.imageUrl; img.alt = p.title;
    img.style.animation = 'none';
    requestAnimationFrame(() => { img.style.animation = 'lightboxImageIn 0.3s cubic-bezier(0.22,1,0.36,1) both'; });
    const cap = document.getElementById('lightboxCaption');
    const meta = document.getElementById('lightboxMeta');
    const dl = document.getElementById('lightboxDownloadContainer');
    if (cap)  cap.textContent = p.title;
    if (meta) meta.textContent = `${PERIOD_NAMES[p.period] || p.period} · ${CATEGORY_NAMES[p.category] || p.category}${p.date ? ' · ' + p.date : ''}`;
    if (dl)   dl.innerHTML = p.originalUrl?.startsWith('http')
        ? `<a href="${p.originalUrl}" target="_blank" rel="noopener" class="lightbox-download">📥 Переглянути / завантажити оригінал</a>` : '';
    buildFilmstrip(filteredPhotos, index);
    lb.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function navigateLightbox(dir) {
    if (!filteredPhotos.length) return;
    currentPhotoIndex = dir === 'next'
        ? (currentPhotoIndex + 1) % filteredPhotos.length
        : (currentPhotoIndex - 1 + filteredPhotos.length) % filteredPhotos.length;
    openLightbox(currentPhotoIndex);
}

function closeLightbox() {
    const lb = document.getElementById('lightbox');
    if (lb) { lb.classList.remove('active'); document.body.style.overflow = ''; }
}

function initLightbox() {
    const lb = document.getElementById('lightbox');
    if (!lb) return;
    lb.querySelector('.lightbox-close')?.addEventListener('click', closeLightbox);
    lb.querySelector('.lightbox-prev')?.addEventListener('click', e => { e.stopPropagation(); navigateLightbox('prev'); });
    lb.querySelector('.lightbox-next')?.addEventListener('click', e => { e.stopPropagation(); navigateLightbox('next'); });
    lb.addEventListener('click', e => { if (e.target === lb) closeLightbox(); });
    document.addEventListener('keydown', e => {
        if (!lb.classList.contains('active')) return;
        if (e.key === 'ArrowLeft')  navigateLightbox('prev');
        if (e.key === 'ArrowRight') navigateLightbox('next');
        if (e.key === 'Escape')     closeLightbox();
    });
}

// FILMSTRIP для lightbox
function buildFilmstrip(photos, cur) {
    const lb = document.getElementById('lightbox');
    if (!lb) return;
    let strip = lb.querySelector('.lightbox-filmstrip');
    if (!strip) {
        strip = document.createElement('div');
        strip.className = 'lightbox-filmstrip';
        lb.querySelector('.lightbox-content')?.appendChild(strip);
    }
    if (photos.length > 20 || photos.length <= 1) { strip.style.display = 'none'; return; }
    strip.style.display = 'flex';
    strip.innerHTML = photos.map((p, i) => `
        <div class="filmstrip-thumb${i === cur ? ' active' : ''}" data-index="${i}">
            <img src="${p.imageUrl.replace(/\.(jpe?g|png|gif|webp)$/i, 'm.$1')}"
                 onerror="this.src='${p.imageUrl}'" loading="lazy" alt="">
        </div>
    `).join('');
    strip.querySelectorAll('.filmstrip-thumb').forEach(t =>
        t.addEventListener('click', e => { e.stopPropagation(); openLightbox(+t.dataset.index); })
    );
    strip.querySelector('.filmstrip-thumb.active')?.scrollIntoView({ inline: 'center', behavior: 'smooth', block: 'nearest' });
}

// Іконка лупи на photo-card
function enhancePhotoCards() {
    document.querySelectorAll('.photo-card').forEach(card => {
        if (card.querySelector('.zoom-icon')) return;
        const z = document.createElement('div');
        z.className = 'zoom-icon'; z.innerHTML = '⊕';
        card.appendChild(z);
        card.addEventListener('mouseenter', () => { z.style.transform = 'translate(-50%,-50%) scale(1)'; });
        card.addEventListener('mouseleave', () => { z.style.transform = 'translate(-50%,-50%) scale(0)'; });
    });
}

// ================================================
// КНИГИ
// ================================================

async function initBooksPage() {
    const grid = document.getElementById('booksGrid');
    if (!grid) return;
    grid.innerHTML = '<p class="loading-msg" style="grid-column:1/-1">⏳ Завантаження...</p>';
    try {
        const r = await fetch(GITHUB_RAW + 'books.json?v=' + Date.now());
        if (r.ok) ALL_BOOKS = await r.json(); else throw new Error();
    } catch { ALL_BOOKS = []; }
    renderBooks();
    initBookFilters();
    // Авто-лінкування місць зберігання
    new MutationObserver(() => {
        grid.querySelectorAll('.book-info p').forEach(p => {
            if (!p.innerHTML.includes('Місце зберігання:') || p.querySelector('a')) return;
            const url = p.textContent.match(/https?:\/\/[^\s]+/)?.[0];
            if (url) p.innerHTML = `<strong>Місце зберігання:</strong> <a href="${url}" target="_blank" rel="noopener" style="color:var(--color-accent-dark)">${url.length > 40 ? url.slice(0,40)+'…' : url} →</a>`;
        });
    }).observe(grid, { childList: true, subtree: true });
}

function renderBooks() {
    const grid = document.getElementById('booksGrid');
    const empty = document.getElementById('booksEmptyMsg');
    if (!grid) return;
    const list = ALL_BOOKS.filter(b => activeBookFilter === 'all' || b.category === activeBookFilter);
    if (!list.length) {
        grid.innerHTML = '';
        if (empty) empty.style.display = 'block';
        return;
    }
    if (empty) empty.style.display = 'none';
    grid.innerHTML = list.map(b => `
        <div class="catalog-item book-item fade-in-up">
            ${b.coverUrl
                ? `<img src="${b.coverUrl}" alt="${b.title}" class="book-cover" loading="lazy">`
                : `<div class="book-cover-placeholder">📚</div>`}
            <div class="book-info">
                <h3>${b.title}</h3>
                <p class="book-meta">Автор: ${b.author}${b.year ? ' · Рік: ' + b.year : ''}</p>
                <p class="book-description">${b.description}</p>
                ${b.location  ? `<p><strong>Місце зберігання:</strong> ${b.location}</p>` : ''}
                ${b.downloadUrl ? `<a href="${b.downloadUrl}" target="_blank" rel="noopener" class="catalog-link">📥 Завантажити / переглянути →</a>` : ''}
            </div>
        </div>
    `).join('');
    initScrollAnimations();
    initCatalogStagger();
    initMagneticCards();
}

function initBookFilters() {
    document.querySelectorAll('[data-book-filter]').forEach(b => {
        b.addEventListener('click', function() {
            document.querySelectorAll('[data-book-filter]').forEach(x => x.classList.remove('active'));
            this.classList.add('active');
            activeBookFilter = this.dataset.bookFilter;
            renderBooks();
        });
    });
}

// ================================================
// МЕТРИЧНІ КНИГИ
// ================================================

async function initMetricsPage() {
    const grid = document.getElementById('metricsGrid');
    if (!grid) return;
    grid.innerHTML = '<p class="loading-msg" style="grid-column:1/-1">⏳ Завантаження...</p>';
    try {
        const r = await fetch(GITHUB_RAW + 'metrics.json?v=' + Date.now());
        if (r.ok) ALL_METRICS = await r.json(); else throw new Error();
    } catch { ALL_METRICS = []; }
    renderMetrics();
    initMetricFilters();
}

function renderMetrics() {
    const grid = document.getElementById('metricsGrid');
    const empty = document.getElementById('metricsEmptyMsg');
    if (!grid) return;
    const list = ALL_METRICS.filter(m => {
        const confOk = activeMetricConfession === 'all' ||
            m.confession === CONFESSION_MAP[activeMetricConfession] ||
            m.confession === activeMetricConfession;
        const typeKey = RECORD_TYPE_MAP[activeMetricType];
        const typeOk  = activeMetricType === 'all' || (m.recordTypes && m.recordTypes.includes(typeKey));
        return confOk && typeOk;
    });
    if (!list.length) {
        grid.innerHTML = '';
        if (empty) empty.style.display = 'block';
        return;
    }
    if (empty) empty.style.display = 'none';
    grid.innerHTML = list.map(m => `
        <div class="catalog-item fade-in-up">
            <h3>${m.parish}</h3>
            <p><strong>Роки:</strong> ${m.years}</p>
            ${m.recordTypes ? `<p><strong>Тип записів:</strong> ${m.recordTypes}</p>` : ''}
            <p><strong>Конфесія:</strong> ${m.confession}</p>
            ${m.villages ? `<p><strong>Населені пункти:</strong> ${m.villages}</p>` : ''}
            ${m.archive   ? `<p><strong>Архів:</strong> ${m.archive}</p>` : ''}
            ${m.scanUrl   ? `<a href="${m.scanUrl}" target="_blank" rel="noopener" class="catalog-link">📥 Переглянути скан →</a>` : ''}
        </div>
    `).join('');
    initScrollAnimations();
}

function initMetricFilters() {
    const bind = (sel, prop) => document.querySelectorAll(sel).forEach(b => {
        b.addEventListener('click', function() {
            document.querySelectorAll(sel).forEach(x => x.classList.remove('active'));
            this.classList.add('active');
            window[prop] = this.dataset[sel === '[data-metric-filter]' ? 'metricFilter' : 'metricType'];
            renderMetrics();
        });
    });
    bind('[data-metric-filter]', 'activeMetricConfession');
    bind('[data-metric-type]',   'activeMetricType');
}

// ================================================
// АДМІН
// ================================================

const ADMIN_PASSWORD = 'admin2026';

function initAdmin() {
    const btn = document.getElementById('adminLoginBtn');
    const pwd = document.getElementById('adminPassword');
    if (!btn || !pwd) return;
    const login = () => {
        if (pwd.value === ADMIN_PASSWORD) {
            document.getElementById('loginSection').style.display = 'none';
            document.getElementById('adminContent').style.display = 'block';
        } else {
            alert('❌ Невірний пароль!');
            pwd.value = '';
        }
    };
    btn.addEventListener('click', login);
    pwd.addEventListener('keypress', e => { if (e.key === 'Enter') login(); });
}

// ================================================
// AERIAL MAP — інтерактивна карта
// ================================================

function initAerialMap() {
    const container = document.getElementById('aerialMap');
    if (!container) return;
    const photo = document.getElementById('aerialPhoto');
    const zoomIn  = document.getElementById('zoomIn');
    const zoomOut = document.getElementById('zoomOut');
    const reset   = document.getElementById('resetView');

    let scale = 1, ox = 0, oy = 0, lx = 0, ly = 0;
    let dragging = false, sx, sy, lastDist = 0;
    const MIN = 1, MAX = 4;

    function apply(anim = false) {
        const r = container.getBoundingClientRect();
        const mx = r.width  * (scale - 1) / 2;
        const my = r.height * (scale - 1) / 2;
        ox = Math.min(mx, Math.max(-mx, ox));
        oy = Math.min(my, Math.max(-my, oy));
        photo.style.transition = anim ? 'transform 0.35s cubic-bezier(0.25,0.46,0.45,0.94)' : '';
        photo.style.transform  = `translate(${ox}px,${oy}px) scale(${scale})`;
    }

    function zoom(d, cx, cy) {
        const r = container.getBoundingClientRect();
        const old = scale;
        scale = Math.min(MAX, Math.max(MIN, scale + d));
        if (scale === old) return;
        const mx = (cx ?? r.left + r.width / 2)  - r.left - r.width / 2;
        const my = (cy ?? r.top  + r.height / 2) - r.top  - r.height / 2;
        ox += mx * (1 - scale / old);
        oy += my * (1 - scale / old);
        apply(true);
    }

    zoomIn?.addEventListener('click',  () => zoom(0.5));
    zoomOut?.addEventListener('click', () => zoom(-0.5));
    reset?.addEventListener('click', () => {
        scale = 1; ox = 0; oy = 0; apply(true);
        container.querySelectorAll('.aerial-marker,.legend-item').forEach(el => el.classList.remove('active'));
    });

    container.addEventListener('wheel', e => { e.preventDefault(); zoom(e.deltaY < 0 ? 0.3 : -0.3, e.clientX, e.clientY); }, { passive: false });

    container.addEventListener('mousedown', e => {
        if (e.button) return; dragging = true;
        sx = e.clientX - lx; sy = e.clientY - ly; container.style.cursor = 'grabbing';
    });
    document.addEventListener('mousemove', e => {
        if (!dragging) return;
        lx = e.clientX - sx; ly = e.clientY - sy; ox = lx; oy = ly; apply();
    });
    document.addEventListener('mouseup', () => {
        dragging = false; lx = ox; ly = oy; container.style.cursor = 'grab';
    });

    container.addEventListener('touchstart', e => {
        if (e.touches.length === 1) { dragging = true; sx = e.touches[0].clientX - lx; sy = e.touches[0].clientY - ly; }
        else if (e.touches.length === 2) { dragging = false; lastDist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY); }
    }, { passive: true });
    container.addEventListener('touchmove', e => {
        e.preventDefault();
        if (e.touches.length === 1 && dragging) {
            lx = e.touches[0].clientX - sx; ly = e.touches[0].clientY - sy; ox = lx; oy = ly; apply();
        } else if (e.touches.length === 2) {
            const d = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
            zoom((d - lastDist) * 0.01); lastDist = d;
        }
    }, { passive: false });
    container.addEventListener('touchend', () => { dragging = false; lx = ox; ly = oy; });

    const markers = container.querySelectorAll('.aerial-marker');
    const legends = container.querySelectorAll('.legend-item');

    function activate(id, fromLegend) {
        markers.forEach(m => m.classList.remove('active'));
        legends.forEach(l => l.classList.remove('active'));
        const m = container.querySelector(`.aerial-marker[data-id="${id}"]`);
        const l = container.querySelector(`.legend-item[data-target="${id}"]`);
        m?.classList.add('active'); l?.classList.add('active');
        if (fromLegend && m) {
            const r = container.getBoundingClientRect();
            ox = (0.5 - parseFloat(m.style.left) / 100) * r.width  * scale;
            oy = (0.5 - parseFloat(m.style.top)  / 100) * r.height * scale;
            lx = ox; ly = oy;
            if (scale < 1.6) scale = 1.8;
            apply(true);
        }
    }

    markers.forEach(m => m.addEventListener('click', e => {
        e.stopPropagation();
        m.classList.contains('active') ? (markers.forEach(x => x.classList.remove('active')), legends.forEach(x => x.classList.remove('active'))) : activate(m.dataset.id, false);
    }));
    legends.forEach(l => l.addEventListener('click', () => activate(l.dataset.target, true)));
    container.addEventListener('click', e => {
        if (!e.target.closest('.aerial-marker')) {
            markers.forEach(m => m.classList.remove('active'));
            legends.forEach(l => l.classList.remove('active'));
        }
    });
}

// ================================================
// ІНІЦІАЛІЗАЦІЯ
// ================================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('🏛️ Дубровиця — app.js v10.0');

    // Базові функції (всі сторінки)
    initTheme();
    initMobileNav();
    initScrollAnimations();
    initSmoothScroll();
    initHeaderScroll();
    initCounters();
    initScrollProgress();
    initHeroEnhancements();
    initHeroParticles();
    injectSectionOrnaments();
    initImageReveal();
    initTooltips();
    initMagneticCards();

    // Сторінково-специфічні
    if (document.getElementById('photoGallery'))  initPhotoGallery();
    if (document.getElementById('booksGrid'))     initBooksPage();
    if (document.getElementById('metricsGrid'))   initMetricsPage();
    if (document.getElementById('adminLoginBtn')) initAdmin();
    if (document.getElementById('aerialMap'))     initAerialMap();

    // Динамічний лічильник фото на головній
    const stat = document.getElementById('photoCountStat');
    if (stat) {
        fetch(GITHUB_RAW + 'photos.json?v=' + Date.now())
            .then(r => r.ok ? r.json() : null)
            .then(d => { if (d?.length) { stat.setAttribute('data-target', d.length); if (stat.textContent !== '0') stat.textContent = d.length.toLocaleString('uk-UA'); } })
            .catch(() => {});
    }

    // Repeat after dynamic loads
    setTimeout(() => {
        enhancePhotoCards();
        initCatalogStagger();
        initMagneticCards();
    }, 1500);
});

window.addEventListener('error', e => console.error('❌', e.message));
