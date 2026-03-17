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
let currentGalleryPage  = 1;
const PHOTOS_PER_PAGE   = 12;
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

    // Паралакс — вимкнено
    // (прибрано анімацію руху фото при скролі)

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
// КАРТКИ: плавний hover (без mousemove — не лагає)
// ================================================

function initMagneticCards() {
    // Навмисно порожньо — 3D-нахил через mousemove
    // спричиняв лаг на сторінках з великою кількістю карток
    // Hover-ефекти реалізовані через CSS
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

function displayPhotos(resetPage) {
    const gallery = document.getElementById('photoGallery');
    if (!gallery) return;
    if (resetPage) currentGalleryPage = 1;
    filteredPhotos = ALL_PHOTOS.filter(p =>
        (currentFilter === 'all' || p.period === currentFilter) &&
        (currentCategory === 'all' || p.category === currentCategory)
    );
    if (!filteredPhotos.length) {
        gallery.style.cssText = 'display:flex;justify-content:center;align-items:center;min-height:300px;column-count:unset';
        gallery.innerHTML = '<p style="font-family:var(--font-display);font-size:1.3rem;color:var(--color-text-secondary);text-align:center">За обраними фільтрами нічого не знайдено</p>';
        renderPagination(0);
        return;
    }
    const totalPages = Math.ceil(filteredPhotos.length / PHOTOS_PER_PAGE);
    if (currentGalleryPage > totalPages) currentGalleryPage = totalPages;
    const start = (currentGalleryPage - 1) * PHOTOS_PER_PAGE;
    const pagePhotos = filteredPhotos.slice(start, start + PHOTOS_PER_PAGE);
    gallery.style.cssText = '';
    gallery.innerHTML = pagePhotos.map((p, i) => {
        const meta = [
            p.date || '',
            CATEGORY_NAMES[p.category] || p.category || ''
        ].filter(Boolean).join(' · ');
        return `
        <div class="photo-card" onclick="openLightbox(${start + i})">
            <img src="${imgurThumb(p.imageUrl)}" alt="${p.title}" loading="lazy" decoding="async">
            <div class="photo-overlay">
                <div class="photo-info">
                    <h3>${p.title}</h3>
                    ${meta ? `<p class="photo-meta">${meta}</p>` : ''}
                    ${p.originalUrl ? '<span class="photo-orig">📥 Оригінал</span>' : ''}
                </div>
            </div>
        </div>`;
    }).join('');
    enhancePhotoCards();
    initImageReveal();
    renderPagination(totalPages);
}

function renderPagination(totalPages) {
    let pg = document.getElementById('galleryPagination');
    if (!pg) {
        pg = document.createElement('div');
        pg.id = 'galleryPagination';
        const section = document.querySelector('.gallery-section .container');
        if (section) section.appendChild(pg);
    }
    if (totalPages <= 1) { pg.innerHTML = ''; return; }
    let html = '<div class="gallery-pagination">';
    // Prev
    html += `<button class="pg-btn${currentGalleryPage === 1 ? ' pg-disabled' : ''}" onclick="goToGalleryPage(${currentGalleryPage - 1})">‹</button>`;
    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || Math.abs(i - currentGalleryPage) <= 1) {
            html += `<button class="pg-btn${i === currentGalleryPage ? ' pg-active' : ''}" onclick="goToGalleryPage(${i})">${i}</button>`;
        } else if (Math.abs(i - currentGalleryPage) === 2) {
            html += `<span class="pg-ellipsis">…</span>`;
        }
    }
    // Next
    html += `<button class="pg-btn${currentGalleryPage === totalPages ? ' pg-disabled' : ''}" onclick="goToGalleryPage(${currentGalleryPage + 1})">›</button>`;
    html += '</div>';
    pg.innerHTML = html;
}

function goToGalleryPage(page) {
    const totalPages = Math.ceil(filteredPhotos.length / PHOTOS_PER_PAGE);
    if (page < 1 || page > totalPages) return;
    currentGalleryPage = page;
    displayPhotos(false);
    // Scroll to gallery top
    const galSection = document.querySelector('.gallery-section');
    if (galSection) galSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function initGalleryFilters() {
    function attachFilter() {
        document.querySelectorAll('.filter-btn').forEach(b => {
            // Remove old listeners by cloning
            const nb = b.cloneNode(true);
            b.parentNode.replaceChild(nb, b);
            nb.addEventListener('click', function() {
                document.querySelectorAll('.filter-btn').forEach(x => x.classList.remove('active'));
                this.classList.add('active');
                currentFilter = this.dataset.filter;
                displayPhotos(true);
            });
        });
        document.querySelectorAll('.category-btn').forEach(b => {
            const nb = b.cloneNode(true);
            b.parentNode.replaceChild(nb, b);
            nb.addEventListener('click', function() {
                document.querySelectorAll('.category-btn').forEach(x => x.classList.remove('active'));
                this.classList.add('active');
                currentCategory = this.dataset.category;
                displayPhotos(true);
            });
        });
    }
    attachFilter();
}

// ── Lightbox → ULB ──
function openLightbox(index) {
    currentPhotoIndex = index;
    const p = filteredPhotos[index];
    if (!p) return;
    const cap  = document.getElementById('lightboxCaption');
    const meta = document.getElementById('lightboxMeta');
    const dl   = document.getElementById('lightboxDownloadContainer');
    if (cap)  cap.textContent  = p.title || '';
    if (meta) meta.textContent = [PERIOD_NAMES[p.period]||p.period, CATEGORY_NAMES[p.category]||p.category, p.date||''].filter(Boolean).join(' · ');
    if (dl) dl.innerHTML = p.originalUrl?.startsWith('http')
        ? `<a href="${p.originalUrl}" target="_blank" rel="noopener" class="lightbox-download">📥 Переглянути оригінал</a>` : '';
    const arr = filteredPhotos.map(ph => ({ src: ph.imageUrl, cap: ph.title || '' }));
    ULB.open(arr, index);
    buildFilmstrip(filteredPhotos, index);
}
function navigateLightbox(dir) {
    if (!filteredPhotos.length) return;
    currentPhotoIndex = dir === 'next'
        ? (currentPhotoIndex + 1) % filteredPhotos.length
        : (currentPhotoIndex - 1 + filteredPhotos.length) % filteredPhotos.length;
    openLightbox(currentPhotoIndex);
}
function closeLightbox() { ULB.close(); }
function initLightbox() {}


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

    // Динамічний лічильник фото на головній — завжди анімує до реального числа
    const stat = document.getElementById('photoCountStat');
    const heroNum = document.getElementById('heroLiveNum');
    if (stat) stat.textContent = '0';
    if (stat || heroNum) {
        fetch(GITHUB_RAW + 'photos.json?v=' + Date.now())
            .then(r => r.ok ? r.json() : null)
            .then(d => {
                if (!d?.length) return;
                const realCount = d.length;
                // Update hero badge immediately
                if (heroNum) heroNum.textContent = realCount;
                // Animate main stat counter from 0
                if (stat) {
                    let cur = 0;
                    const step = Math.max(1, realCount / 55);
                    const tick = () => {
                        if (cur < realCount) {
                            cur += step;
                            stat.textContent = Math.floor(Math.min(cur, realCount)).toLocaleString('uk-UA');
                            requestAnimationFrame(tick);
                        } else {
                            stat.textContent = realCount.toLocaleString('uk-UA');
                        }
                    };
                    tick();
                }
            })
            .catch(() => { if (stat) stat.textContent = '44'; });
    }

    // Repeat after dynamic loads
    setTimeout(() => {
        enhancePhotoCards();
        initCatalogStagger();
        initMagneticCards();
    }, 1500);
});

window.addEventListener('error', e => console.error('❌', e.message));

// ================================================
// CUSTOM GOLDEN CURSOR
// ================================================

function initCustomCursor() {
    // Only on pointer:fine devices
    if (!window.matchMedia('(pointer: fine)').matches) return;

    const dot  = document.createElement('div');
    const ring = document.createElement('div');
    dot.id  = 'cursor-dot';
    ring.id = 'cursor-ring';
    document.body.appendChild(dot);
    document.body.appendChild(ring);

    let mx = -200, my = -200;
    let rx = -200, ry = -200;
    let isHidden = false;

    // Dot follows mouse instantly via style.left/top
    document.addEventListener('mousemove', e => {
        mx = e.clientX; my = e.clientY;
        dot.style.left  = mx + 'px';
        dot.style.top   = my + 'px';
        if (isHidden) { dot.style.opacity = '1'; ring.style.opacity = '1'; isHidden = false; }
    });

    // Ring follows with smooth lag
    function raf() {
        rx += (mx - rx) * 0.13;
        ry += (my - ry) * 0.13;
        ring.style.left = rx.toFixed(2) + 'px';
        ring.style.top  = ry.toFixed(2) + 'px';
        requestAnimationFrame(raf);
    }
    raf();

    // Hide when cursor leaves window
    document.addEventListener('mouseleave', () => {
        dot.style.opacity = '0';
        ring.style.opacity = '0';
        isHidden = true;
    });
    document.addEventListener('mouseenter', () => {
        dot.style.opacity = '1';
        ring.style.opacity = '1';
        isHidden = false;
    });

    // Click flash
    document.addEventListener('mousedown', () => {
        ring.classList.add('c-click');
        dot.classList.add('c-hover');
    });
    document.addEventListener('mouseup', () => {
        ring.classList.remove('c-click');
        dot.classList.remove('c-hover');
    });

    // State management: hover vs text vs default
    function addHover(selector, hoverClass) {
        document.querySelectorAll(selector).forEach(el => {
            el.addEventListener('mouseenter', () => {
                dot.classList.add(hoverClass);
                ring.classList.add(hoverClass);
            });
            el.addEventListener('mouseleave', () => {
                dot.classList.remove(hoverClass);
                ring.classList.remove(hoverClass);
            });
        });
    }

    // Interactive elements → c-hover (ring expands, dot hides)
    addHover('a, button, [role="button"], .catalog-filter-btn, .catalog-item, .card, .hist-epoch-item, .aerial-marker, .legend-item, .nav-link, .hero-btn', 'c-hover');

    // Text content areas → c-text (thin I-beam)
    addHover('p, h1, h2, h3, h4, blockquote, li, .article-text, .lead-paragraph', 'c-text');
}

// ================================================
// PAGE TRANSITION SYSTEM
// ================================================

function initPageTransitions() {
    // Build the overlay
    const pt = document.createElement('div');
    pt.id = 'page-transition';
    pt.innerHTML = `
        <div class="pt-curtain"></div>
        <div class="pt-emblem">
            <img class="pt-emblem-img" src="https://i.imgur.com/mXCrjjG.png" alt="Дубровиця">
            <div class="pt-emblem-row">
                <div class="pt-emblem-line"></div>
                <span class="pt-emblem-city">Дубровиця</span>
                <div class="pt-emblem-line"></div>
            </div>
            <span class="pt-emblem-sub">Цифровий архів · 1005</span>
        </div>`;
    document.body.appendChild(pt);

    // On load: curtain is above screen, animate to fully hidden
    // Start with curtain above (pt-idle = no transition, translateY(-105%))
    pt.classList.add('pt-idle');
    // Then after a tick, let it animate out from top (user might have navigated back)
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            pt.classList.remove('pt-idle');
            pt.classList.add('pt-out');
        });
    });

    // Intercept internal navigation links
    document.addEventListener('click', e => {
        const link = e.target.closest('a[href]');
        if (!link) return;
        const href = link.getAttribute('href');
        if (!href || href.startsWith('#') || href.startsWith('http')
            || href.startsWith('mailto') || href.startsWith('tel')
            || link.target === '_blank' || e.ctrlKey || e.metaKey || e.shiftKey) return;

        e.preventDefault();
        const dest = href;

        // Curtain in
        pt.classList.remove('pt-out', 'pt-idle');
        pt.classList.add('pt-in');
        pt.style.pointerEvents = 'all';

        setTimeout(() => {
            window.location.href = dest;
        }, 650);
    });
}

// ================================================
// HERALDIC EMBLEM OBSERVER
// ================================================

function initHeraldicEmblem() {
    const emblem = document.querySelector('.heraldic-emblem-svg');
    if (!emblem || !('IntersectionObserver' in window)) {
        if (emblem) emblem.classList.add('hd-visible');
        return;
    }
    const obs = new IntersectionObserver(entries => {
        entries.forEach(e => {
            if (e.isIntersecting) {
                e.target.classList.add('hd-visible');
                obs.unobserve(e.target);
            }
        });
    }, { threshold: 0.25 });
    obs.observe(emblem);
}

// Add to DOMContentLoaded — append to existing handler
document.addEventListener('DOMContentLoaded', () => {
    initCustomCursor();
    initPageTransitions();
    initHeraldicEmblem();
});

// ================================================
// SPLIT-FLAP SOLARI BOARD ENGINE
// ================================================

(function(){

const CHARSET = ' АБВГҐДЕЄЖЗИІЇЙКЛМНОПРСТУФХЦЧШЩЬЮЯ0123456789·—';

function buildFlap(container, char) {
    const flap = document.createElement('div');
    if (char === ' ') {
        flap.className = 'flap flap-space';
        container.appendChild(flap);
        return flap;
    }
    flap.className = 'flap';
    flap.innerHTML = `
        <div class="flap-top"><span class="flap-char">${char}</span></div>
        <div class="flap-bottom"><span class="flap-char">${char}</span></div>`;
    container.appendChild(flap);
    return flap;
}

function setFlapChar(flap, char) {
    if (flap.classList.contains('flap-space')) return;
    const top = flap.querySelector('.flap-top .flap-char');
    const bot = flap.querySelector('.flap-bottom .flap-char');
    if (top) top.textContent = char;
    if (bot) bot.textContent = char;
}

// Click sound via Web Audio
let _sfCtx = null;
function getCtx() {
    if (!_sfCtx) _sfCtx = new (window.AudioContext || window.webkitAudioContext)();
    return _sfCtx;
}
function clickSound() {
    try {
        const ctx = getCtx();
        const buf = ctx.createBuffer(1, ctx.sampleRate * 0.04, ctx.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < d.length; i++) {
            d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 3) * 0.35;
        }
        const src = ctx.createBufferSource();
        src.buffer = buf;
        const gain = ctx.createGain();
        gain.gain.value = 0.22;
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 2400;
        filter.Q.value = 1.2;
        src.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        src.start();
    } catch(e) {}
}

// Animate a single flap from current char to target
function animateFlap(flap, fromChar, toChar, duration, onDone) {
    if (flap.classList.contains('flap-space') || fromChar === toChar) {
        if (onDone) setTimeout(onDone, duration);
        return;
    }

    const fromIdx = CHARSET.indexOf(fromChar) === -1 ? 0 : CHARSET.indexOf(fromChar);
    const toIdx   = CHARSET.indexOf(toChar)   === -1 ? 0 : CHARSET.indexOf(toChar);
    const steps   = toIdx >= fromIdx
        ? toIdx - fromIdx
        : CHARSET.length - fromIdx + toIdx;

    if (steps === 0) { if (onDone) setTimeout(onDone, 0); return; }

    let step = 0;
    const stepTime = Math.max(38, Math.min(duration / steps, 90));

    function doStep() {
        if (step >= steps) {
            setFlapChar(flap, toChar);
            if (onDone) onDone();
            return;
        }
        const idx = (fromIdx + step + 1) % CHARSET.length;
        const ch = CHARSET[idx];
        doFlip(flap, ch);
        clickSound();
        step++;
        setTimeout(doStep, stepTime + (Math.random() * 12 - 6));
    }
    doStep();
}

function doFlip(flap, newChar) {
    const top = flap.querySelector('.flap-top');
    const bot = flap.querySelector('.flap-bottom');
    if (!top || !bot) return;

    // Create folding halves
    const foldTop = document.createElement('div');
    foldTop.className = 'flap-fold-top';
    foldTop.innerHTML = `<span class="flap-char">${top.querySelector('.flap-char').textContent}</span>`;
    const foldBot = document.createElement('div');
    foldBot.className = 'flap-fold-bot';
    foldBot.innerHTML = `<span class="flap-char">${newChar}</span>`;

    // Update static halves
    top.querySelector('.flap-char').textContent = newChar;
    bot.querySelector('.flap-char').textContent = newChar;

    flap.appendChild(foldTop);
    flap.appendChild(foldBot);

    // Animate
    foldTop.style.animation = 'flipTop 0.08s ease-in forwards';
    foldBot.style.animation = 'flipBot 0.08s ease-out 0.08s forwards';

    setTimeout(() => { foldTop.remove(); foldBot.remove(); }, 220);
}

// Full row animation
function animateRow(rowId, targetStr, startDelay, duration) {
    const container = document.getElementById(rowId);
    if (!container) return;

    // Clear and build flaps
    container.innerHTML = '';
    const flaps = [];
    for (let i = 0; i < targetStr.length; i++) {
        const ch = targetStr[i];
        if (ch === ' ') {
            flaps.push(buildFlap(container, ' '));
        } else {
            const f = buildFlap(container, CHARSET[Math.floor(Math.random() * CHARSET.length)]);
            flaps.push(f);
        }
    }

    // Animate each flap with slight stagger
    flaps.forEach((flap, i) => {
        if (flap.classList.contains('flap-space')) return;
        const currentChar = flap.querySelector('.flap-top .flap-char')?.textContent || ' ';
        const targetChar  = targetStr[i];
        setTimeout(() => {
            animateFlap(flap, currentChar, targetChar, duration);
        }, startDelay + i * 22);
    });
}

// Initialize when board enters viewport
function initSolari() {
    const board = document.getElementById('solari-board');
    if (!board) return;

    const ROWS = [
        { id: 'sf-chars-1', text: 'ДУБРОВИЦЯ', delay: 0,    dur: 1200 },
        { id: 'sf-chars-2', text: '1005',       delay: 600,  dur: 800  },
        { id: 'sf-chars-3', text: '9·343 ЛЮД', delay: 1100, dur: 1000 },
        { id: 'sf-chars-4', text: 'РІВНЕНЩИНА', delay: 1600, dur: 900  },
    ];

    // Pre-build with scrambled chars
    ROWS.forEach(r => {
        const c = document.getElementById(r.id);
        if (!c) return;
        c.innerHTML = '';
        for (let i = 0; i < r.text.length; i++) {
            if (r.text[i] === ' ') buildFlap(c, ' ');
            else buildFlap(c, CHARSET[Math.floor(Math.random() * CHARSET.length)]);
        }
    });

    let triggered = false;
    const obs = new IntersectionObserver(entries => {
        if (entries[0].isIntersecting && !triggered) {
            triggered = true;
            obs.disconnect();
            ROWS.forEach(r => animateRow(r.id, r.text, r.delay, r.dur));
        }
    }, { threshold: 0.3 });
    obs.observe(board);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSolari);
} else {
    initSolari();
}

})();


// ================================================
// WEB AUDIO AMBIENT ATMOSPHERE
// ================================================

(function(){

let audioCtx = null;
let masterGain = null;
let sources = [];
let playing = false;

function createCtx() {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = audioCtx.createGain();
    masterGain.gain.value = 0;
    masterGain.connect(audioCtx.destination);
}

// Brown noise (river sound)
function createRiverNoise() {
    const bufSize = audioCtx.sampleRate * 4;
    const buf = audioCtx.createBuffer(2, bufSize, audioCtx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
        const d = buf.getChannelData(ch);
        let last = 0;
        for (let i = 0; i < bufSize; i++) {
            const white = Math.random() * 2 - 1;
            last = (last + 0.02 * white) / 1.02;
            d[i] = last * 3.5;
        }
    }
    const src = audioCtx.createBufferSource();
    src.buffer = buf;
    src.loop = true;

    // Low-pass to make it sound like distant water
    const lpf = audioCtx.createBiquadFilter();
    lpf.type = 'lowpass';
    lpf.frequency.value = 420;
    lpf.Q.value = 0.7;

    // High-pass to remove rumble
    const hpf = audioCtx.createBiquadFilter();
    hpf.type = 'highpass';
    hpf.frequency.value = 80;

    const g = audioCtx.createGain();
    g.gain.value = 0.55;

    // Gentle LFO for water movement
    const lfo = audioCtx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.08;
    const lfoGain = audioCtx.createGain();
    lfoGain.gain.value = 80;
    lfo.connect(lfoGain);
    lfoGain.connect(lpf.frequency);
    lfo.start();

    src.connect(hpf);
    hpf.connect(lpf);
    lpf.connect(g);
    g.connect(masterGain);
    src.start();
    sources.push(src, lfo);
}

// Wind sound (high-freq filtered noise)
function createWind() {
    const bufSize = audioCtx.sampleRate * 8;
    const buf = audioCtx.createBuffer(1, bufSize, audioCtx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) d[i] = Math.random() * 2 - 1;

    const src = audioCtx.createBufferSource();
    src.buffer = buf;
    src.loop = true;

    const bpf = audioCtx.createBiquadFilter();
    bpf.type = 'bandpass';
    bpf.frequency.value = 700;
    bpf.Q.value = 0.5;

    const g = audioCtx.createGain();
    g.gain.value = 0.08;

    // Slow swell LFO
    const lfo = audioCtx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.05;
    const lfoG = audioCtx.createGain();
    lfoG.gain.value = 0.06;
    lfo.connect(lfoG);
    lfoG.connect(g.gain);
    lfo.start();

    src.connect(bpf);
    bpf.connect(g);
    g.connect(masterGain);
    src.start();
    sources.push(src, lfo);
}

// Church bell — single distant toll
function ringBell() {
    if (!audioCtx || !playing) return;
    const now = audioCtx.currentTime;

    // Fundamental + partials of a cast iron bell
    const partials = [
        { freq: 220, amp: 0.18, decay: 4.5 },
        { freq: 293, amp: 0.12, decay: 3.2 },
        { freq: 440, amp: 0.08, decay: 2.4 },
        { freq: 550, amp: 0.04, decay: 1.8 },
        { freq: 660, amp: 0.025, decay: 1.2 },
        { freq: 880, amp: 0.012, decay: 0.8 },
    ];

    const convBuf = audioCtx.createBuffer(1, audioCtx.sampleRate * 2, audioCtx.sampleRate);
    const cd = convBuf.getChannelData(0);
    for (let i = 0; i < cd.length; i++) cd[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / cd.length, 1.2) * 0.3;
    const conv = audioCtx.createConvolver();
    conv.buffer = convBuf;

    const bellGain = audioCtx.createGain();
    bellGain.gain.value = 0.15;
    conv.connect(bellGain);
    bellGain.connect(masterGain);

    partials.forEach(p => {
        const osc = audioCtx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = p.freq;
        const g = audioCtx.createGain();
        g.gain.setValueAtTime(p.amp, now);
        g.gain.exponentialRampToValueAtTime(0.0001, now + p.decay);
        osc.connect(g);
        g.connect(conv);
        osc.start(now);
        osc.stop(now + p.decay + 0.1);
    });

    // Schedule next bell: 18–35 seconds
    const next = 18000 + Math.random() * 17000;
    setTimeout(() => { if (playing) ringBell(); }, next);
}

function startAudio() {
    if (!audioCtx) createCtx();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    createRiverNoise();
    createWind();
    masterGain.gain.setValueAtTime(0, audioCtx.currentTime);
    masterGain.gain.linearRampToValueAtTime(0.7, audioCtx.currentTime + 2.5);
    playing = true;
    // First bell after 4-8s
    setTimeout(() => { if (playing) ringBell(); }, 4000 + Math.random() * 4000);
}

function stopAudio() {
    playing = false;
    if (!masterGain) return;
    masterGain.gain.setValueAtTime(masterGain.gain.value, audioCtx.currentTime);
    masterGain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 1.5);
    setTimeout(() => {
        sources.forEach(s => { try { s.stop(); } catch(e) {} });
        sources = [];
        if (audioCtx) { audioCtx.close(); audioCtx = null; masterGain = null; }
    }, 1800);
}

function initAudioButton() {
    const btn = document.createElement('button');
    btn.id = 'audio-btn';
    btn.setAttribute('aria-label', 'Атмосферний звук');
    btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" id="audio-icon-off">
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
        <line x1="23" y1="9" x2="17" y2="15"/>
        <line x1="17" y1="9" x2="23" y2="15"/>
    </svg>
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" id="audio-icon-on" style="display:none">
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
        <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
        <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
    </svg>`;

    const tip = document.createElement('div');
    tip.id = 'audio-tooltip';
    tip.textContent = 'Атмосфера Горині';

    document.body.appendChild(btn);
    document.body.appendChild(tip);

    btn.addEventListener('click', () => {
        if (!playing) {
            startAudio();
            btn.classList.add('playing');
            document.getElementById('audio-icon-off').style.display = 'none';
            document.getElementById('audio-icon-on').style.display = 'block';
            tip.textContent = 'Зупинити звук';
            tip.classList.add('show');
            setTimeout(() => tip.classList.remove('show'), 2500);
        } else {
            stopAudio();
            btn.classList.remove('playing');
            document.getElementById('audio-icon-off').style.display = 'block';
            document.getElementById('audio-icon-on').style.display = 'none';
            tip.textContent = 'Атмосфера Горині';
        }
    });
}

document.addEventListener('DOMContentLoaded', initAudioButton);

})();


// ================================================
// WAX SEAL ANIMATION — contacts.html
// ================================================

(function(){

function initWaxSeal() {
    const btn = document.getElementById('wax-trigger-btn');
    const overlay = document.getElementById('wax-seal-overlay');
    const canvas = document.getElementById('wax-canvas');
    const closeBtn = document.getElementById('wax-close-btn');
    if (!btn || !overlay || !canvas) return;

    btn.addEventListener('click', () => {
        overlay.style.display = 'flex';
        // Force reflow before adding active class
        overlay.offsetHeight;
        overlay.classList.add('active');
        setTimeout(() => runWaxAnimation(canvas), 300);
    });

    closeBtn.addEventListener('click', () => {
        overlay.classList.remove('active');
        setTimeout(() => { overlay.style.display = 'none'; }, 600);
    });
}

function runWaxAnimation(canvas) {
    const ctx = canvas.getContext('2d');
    const W = canvas.width;   // 320
    const H = canvas.height;  // 320
    const cx = W / 2, cy = H / 2;
    const maxR = 130;

    let frame = 0;
    const TOTAL_FRAMES = 110;

    // Wax particle system
    const particles = [];
    const PARTICLE_COUNT = 280;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 0.8 + Math.random() * 2.2;
        particles.push({
            x: cx, y: cy,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 0.6 + Math.random() * 0.4,
            size: 4 + Math.random() * 12,
            angle: angle,
            speed: speed,
            freeze: 0.3 + Math.random() * 0.5, // when to slow to stop
        });
    }

    // Seal emblem lines (drawn at end)
    const emblemLines = [
        // Outer circle
        { type: 'circle', r: 105, startAngle: 0, endAngle: Math.PI*2, lw: 2.2, opacity: 0.9 },
        { type: 'circle', r: 92,  startAngle: 0, endAngle: Math.PI*2, lw: 0.8, opacity: 0.6 },
        // Cardinal cross
        { type: 'line', x1:cx, y1:cy-75, x2:cx, y2:cy+75, lw:1.5, opacity:0.7 },
        { type: 'line', x1:cx-75, y1:cy, x2:cx+75, y2:cy, lw:1.5, opacity:0.7 },
        // Diagonal cross
        { type: 'line', x1:cx-53, y1:cy-53, x2:cx+53, y2:cy+53, lw:0.8, opacity:0.45 },
        { type: 'line', x1:cx+53, y1:cy-53, x2:cx-53, y2:cy+53, lw:0.8, opacity:0.45 },
        // Center circle
        { type: 'circle', r: 22,  startAngle: 0, endAngle: Math.PI*2, lw: 1.5, opacity: 0.8 },
        { type: 'circle', r: 8,   startAngle: 0, endAngle: Math.PI*2, lw: 1,   opacity: 0.9 },
    ];

    function easeOut(t) { return 1 - Math.pow(1-t, 3); }
    function easeOutElastic(t) {
        return t === 0 ? 0 : t === 1 ? 1 :
            Math.pow(2, -10*t) * Math.sin((t*10 - 0.75) * (2*Math.PI)/3) + 1;
    }

    function drawFrame() {
        ctx.clearRect(0, 0, W, H);
        const progress = frame / TOTAL_FRAMES;
        const spreadProg = Math.min(1, progress * 2.2); // spread phase
        const freezeProg = Math.max(0, (progress - 0.4) / 0.6); // solidify phase

        // Background (transparent — CSS handles overlay)
        // Draw wax blob
        const waxRadius = easeOut(spreadProg) * maxR;

        // Main wax circle (deep red to dark crimson)
        const waxGrad = ctx.createRadialGradient(
            cx - waxRadius*0.2, cy - waxRadius*0.2, 0,
            cx, cy, waxRadius
        );
        const r1 = Math.round(180 - freezeProg * 40);
        const g1 = Math.round(30 - freezeProg * 8);
        const b1 = Math.round(30 - freezeProg * 8);
        const r2 = Math.round(100 - freezeProg * 20);
        waxGrad.addColorStop(0,   `rgb(${r1+40},${g1+10},${b1+5})`);
        waxGrad.addColorStop(0.4, `rgb(${r1},${g1},${b1})`);
        waxGrad.addColorStop(0.8, `rgb(${r2+10},${g1-5},${b1-5})`);
        waxGrad.addColorStop(1,   `rgb(${r2},10,10)`);

        ctx.save();
        ctx.beginPath();
        // Organic wobble for flowing wax
        const wobble = (1 - freezeProg) * 12;
        for (let a = 0; a < Math.PI*2; a += 0.05) {
            const noise = wobble * (
                Math.sin(a * 3.7 + frame * 0.18) * 0.4 +
                Math.sin(a * 5.2 + frame * 0.11) * 0.35 +
                Math.sin(a * 2.1 + frame * 0.09) * 0.25
            );
            const r = waxRadius + noise;
            const x = cx + Math.cos(a) * r;
            const y = cy + Math.sin(a) * r;
            if (a === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fillStyle = waxGrad;
        ctx.fill();

        // Specular highlight (liquid sheen that fades as it cools)
        const sheenOpacity = Math.max(0, 0.35 - freezeProg * 0.35);
        if (sheenOpacity > 0) {
            const sheenGrad = ctx.createRadialGradient(
                cx - waxRadius*0.35, cy - waxRadius*0.35, 0,
                cx - waxRadius*0.25, cy - waxRadius*0.25, waxRadius * 0.5
            );
            sheenGrad.addColorStop(0, `rgba(255,180,160,${sheenOpacity})`);
            sheenGrad.addColorStop(1, 'rgba(255,120,100,0)');
            ctx.beginPath();
            ctx.arc(cx, cy, waxRadius, 0, Math.PI*2);
            ctx.fillStyle = sheenGrad;
            ctx.fill();
        }

        // Rim shadow (depth)
        const rimGrad = ctx.createRadialGradient(cx, cy, waxRadius*0.6, cx, cy, waxRadius);
        rimGrad.addColorStop(0, 'rgba(0,0,0,0)');
        rimGrad.addColorStop(1, `rgba(0,0,0,${0.3 + freezeProg*0.2})`);
        ctx.beginPath();
        ctx.arc(cx, cy, waxRadius, 0, Math.PI*2);
        ctx.fillStyle = rimGrad;
        ctx.fill();
        ctx.restore();

        // === EMBLEM STAMP IMPRESSION ===
        // Appears as if pressed into solidified wax — starts after 55% progress
        const emblemAlpha = Math.max(0, Math.min(1, (progress - 0.52) / 0.35));
        if (emblemAlpha > 0 && waxRadius > 60) {
            ctx.save();
            ctx.globalAlpha = emblemAlpha;

            // Clip to wax circle
            ctx.beginPath();
            ctx.arc(cx, cy, waxRadius - 4, 0, Math.PI*2);
            ctx.clip();

            const goldColor = `rgba(201,162,39,${0.55 + emblemAlpha*0.35})`;
            const deepColor = `rgba(80,15,15,${0.6 + emblemAlpha*0.3})`;

            emblemLines.forEach(el => {
                ctx.beginPath();
                ctx.strokeStyle = emblemAlpha > 0.5 ? goldColor : deepColor;
                ctx.lineWidth = el.lw;
                ctx.globalAlpha = emblemAlpha * el.opacity;
                if (el.type === 'circle') {
                    ctx.arc(cx, cy, el.r, el.startAngle, el.endAngle);
                } else {
                    ctx.moveTo(el.x1, el.y1);
                    ctx.lineTo(el.x2, el.y2);
                }
                ctx.stroke();
            });

            // Center dot
            ctx.globalAlpha = emblemAlpha * 0.95;
            ctx.beginPath();
            ctx.arc(cx, cy, 4, 0, Math.PI*2);
            ctx.fillStyle = `rgba(201,162,39,${0.8 + emblemAlpha*0.2})`;
            ctx.fill();

            // Diamond tips at cardinal points
            const tips = [{x:cx,y:cy-85},{x:cx,y:cy+85},{x:cx-85,y:cy},{x:cx+85,y:cy}];
            ctx.fillStyle = `rgba(201,162,39,${0.7 * emblemAlpha})`;
            tips.forEach(t => {
                ctx.save();
                ctx.translate(t.x, t.y);
                ctx.rotate(Math.PI/4);
                ctx.fillRect(-4, -4, 8, 8);
                ctx.restore();
            });

            // Text arc "ДУБРОВИЦЯ · 1005"
            ctx.globalAlpha = Math.max(0, emblemAlpha - 0.2) * 0.8;
            ctx.font = '9px DM Sans, sans-serif';
            ctx.fillStyle = `rgba(201,162,39,0.85)`;
            ctx.letterSpacing = '3px';
            const text = 'ДУБРОВИЦЯ · 1005 · ПОЛІССЯ';
            const arcR = 72;
            for (let i = 0; i < text.length; i++) {
                const angle = -Math.PI/2 + (i / text.length) * Math.PI * 2;
                ctx.save();
                ctx.translate(
                    cx + arcR * Math.cos(angle),
                    cy + arcR * Math.sin(angle)
                );
                ctx.rotate(angle + Math.PI/2);
                ctx.fillText(text[i], 0, 0);
                ctx.restore();
            }

            ctx.restore();
        }

        frame++;
        if (frame < TOTAL_FRAMES + 20) {
            requestAnimationFrame(drawFrame);
        }
    }

    drawFrame();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWaxSeal);
} else {
    initWaxSeal();
}

})();


// ================================================
// INK BLEED EFFECT — history.html h2 headings
// ================================================

(function(){

function initInkEffect() {
    const h2s = document.querySelectorAll('.history-section h2');
    if (!h2s.length) return;

    // Check SVG filter exists
    const filterEl = document.getElementById('ink-bleed');
    if (!filterEl) return;

    const dispAnim  = document.getElementById('ink-anim-disp');
    const blurAnim  = document.getElementById('ink-anim-blur');
    const alphaAnim = document.getElementById('ink-anim-alpha');

    function triggerInk(h2) {
        h2.style.filter = 'url(#ink-bleed)';
        h2.style.webkitFilter = 'url(#ink-bleed)';
        // Restart SVG animations
        if (dispAnim)  { try { dispAnim.beginElement();  } catch(e) {} }
        if (blurAnim)  { try { blurAnim.beginElement();  } catch(e) {} }
        if (alphaAnim) { try { alphaAnim.beginElement(); } catch(e) {} }
        // Remove filter after animation completes (1.4s)
        setTimeout(() => {
            h2.style.filter = '';
            h2.style.webkitFilter = '';
        }, 1600);
    }

    if (!('IntersectionObserver' in window)) return;

    const obs = new IntersectionObserver(entries => {
        entries.forEach(e => {
            if (e.isIntersecting) {
                obs.unobserve(e.target);
                // Small delay so user sees the text "arrive"
                setTimeout(() => triggerInk(e.target), 80);
            }
        });
    }, { threshold: 0.5, rootMargin: '0px 0px -80px 0px' });

    h2s.forEach(h => obs.observe(h));
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initInkEffect);
} else {
    initInkEffect();
}

})();
