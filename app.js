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

    const CATEGORY_LABELS = {
        history: 'Історія',
        culture: 'Культура',
        war: 'Друга світова',
        religion: 'Релігія',
        people: 'Постаті',
        documents: 'Документи',
        folklore: 'Фольклор'
    };

    const bookSVG = `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" opacity="0.3"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>`;
    const linkSVG = `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>`;

    grid.innerHTML = list.map((b, idx) => {
        const catLabel = CATEGORY_LABELS[b.category] || '';
        const coverHtml = b.coverUrl
            ? `<img src="${b.coverUrl}" alt="${b.title}" class="bk-cover-img" loading="lazy">`
            : `<div class="bk-cover-placeholder">${bookSVG}<span>Обкладинка</span></div>`;

        const locationHtml = b.location
            ? `<div class="bk-location">
                 <a href="${b.location}" target="_blank" rel="noopener">
                   ${linkSVG} Читати / переглянути →
                 </a>
               </div>`
            : (b.downloadUrl
                ? `<div class="bk-location">
                     <a href="${b.downloadUrl}" target="_blank" rel="noopener">
                       ${linkSVG} Завантажити →
                     </a>
                   </div>`
                : '');

        // short desc (≤ 300 chars) never needs toggle; longer ones get expand button
        const needsToggle = b.description && b.description.length > 300;
        const descId = `bk-desc-${idx}`;
        const readMoreBtn = needsToggle
            ? `<button class="bk-read-more" onclick="bkToggleDesc('${descId}',this)" aria-expanded="false">
                 Читати далі <span>↓</span>
               </button>`
            : '';

        return `
        <div class="bk-card fade-in-up">
            <div class="bk-cover-col">
                ${coverHtml}
                ${catLabel ? `<span class="bk-badge">${catLabel}</span>` : ''}
            </div>
            <div class="bk-info">
                <div class="bk-num">${String(idx + 1).padStart(2, '0')}</div>
                <h3 class="bk-title">${b.title}</h3>
                <div class="bk-author-row">
                    <span class="bk-author-line"></span>
                    <span class="bk-author">${b.author}</span>
                    ${b.year ? `<span class="bk-year">· ${b.year}</span>` : ''}
                </div>
                <p class="bk-desc" id="${descId}">${b.description || ''}</p>
                ${readMoreBtn}
                ${locationHtml}
            </div>
        </div>`;
    }).join('');

    initScrollAnimations();
}

function bkToggleDesc(id, btn) {
    const el = document.getElementById(id);
    if (!el) return;
    const expanded = btn.getAttribute('aria-expanded') === 'true';
    el.classList.toggle('bk-desc-full', !expanded);
    btn.setAttribute('aria-expanded', String(!expanded));
    btn.innerHTML = expanded ? 'Читати далі <span>↓</span>' : 'Згорнути <span>↑</span>';
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
// КНОПКА "ВГОРУ" — Back to Top
// ================================================

function initBackToTop() {
    const btn = document.createElement('button');
    btn.className = 'back-to-top';
    btn.setAttribute('aria-label', 'На початок сторінки');
    btn.title = 'На початок сторінки';
    btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"></polyline></svg>';
    document.body.appendChild(btn);

    let ticking = false;
    window.addEventListener('scroll', () => {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(() => {
            btn.classList.toggle('visible', window.pageYOffset > 450);
            ticking = false;
        });
    }, { passive: true });

    btn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
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
    initBackToTop();

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
