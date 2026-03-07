// ================================================
// ДУБРОВИЦЯ — PREMIUM v9.0 — Ultra Interactive
// Custom cursor, scroll progress, back-to-top,
// reading progress, search, ripples, & more
// ================================================

(function () {
'use strict';

// ────────────────────────────────────────────────
// SCROLL PROGRESS BAR
// ────────────────────────────────────────────────
function initScrollProgress() {
    var bar = document.createElement('div');
    bar.id = 'scroll-progress';
    document.body.insertBefore(bar, document.body.firstChild);

    function update() {
        var doc = document.documentElement;
        var scrollTop = window.pageYOffset || doc.scrollTop;
        var scrollH   = doc.scrollHeight - doc.clientHeight;
        var pct = scrollH > 0 ? (scrollTop / scrollH) * 100 : 0;
        bar.style.width = pct.toFixed(2) + '%';
    }
    window.addEventListener('scroll', update, { passive: true });
    update();
}

// ────────────────────────────────────────────────
// CUSTOM CURSOR
// ────────────────────────────────────────────────
function initCustomCursor() {
    if (window.matchMedia('(pointer: coarse)').matches) return;

    var dot  = document.createElement('div');
    var ring = document.createElement('div');
    dot.id  = 'cursor-dot';
    ring.id = 'cursor-ring';
    document.body.appendChild(dot);
    document.body.appendChild(ring);

    var mx = -100, my = -100;
    var rx = -100, ry = -100;
    var raf;

    document.addEventListener('mousemove', function(e) {
        mx = e.clientX;
        my = e.clientY;
        dot.style.left  = mx + 'px';
        dot.style.top   = my + 'px';
        if (!raf) raf = requestAnimationFrame(animRing);
    }, { passive: true });

    function animRing() {
        raf = null;
        rx += (mx - rx) * 0.12;
        ry += (my - ry) * 0.12;
        ring.style.left = rx + 'px';
        ring.style.top  = ry + 'px';
        if (Math.abs(mx - rx) > 0.5 || Math.abs(my - ry) > 0.5) {
            raf = requestAnimationFrame(animRing);
        }
    }

    var hoverEls = 'a,button,[role="button"],.photo-card,.card,.filter-btn,.category-btn,.catalog-filter-btn,.TPPIN,.PIN,.LEGI,.TPLEGLI,.PGITEM,.book-card';
    document.addEventListener('mouseover', function(e) {
        if (e.target.closest(hoverEls)) {
            document.body.classList.add('cursor-hover');
        }
    });
    document.addEventListener('mouseout', function(e) {
        if (e.target.closest(hoverEls)) {
            document.body.classList.remove('cursor-hover');
        }
    });
    document.addEventListener('mousedown', function() {
        document.body.classList.add('cursor-click');
    });
    document.addEventListener('mouseup', function() {
        document.body.classList.remove('cursor-click');
    });
    document.addEventListener('mouseleave', function() {
        dot.style.opacity  = '0';
        ring.style.opacity = '0';
    });
    document.addEventListener('mouseenter', function() {
        dot.style.opacity  = '1';
        ring.style.opacity = '1';
    });
}

// ────────────────────────────────────────────────
// BACK TO TOP BUTTON
// ────────────────────────────────────────────────
function initBackToTop() {
    var btn = document.createElement('button');
    btn.id = 'back-to-top';
    btn.setAttribute('aria-label', 'Прокрутити вгору');
    btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 15l-6-6-6 6"/></svg>';
    document.body.appendChild(btn);

    window.addEventListener('scroll', function() {
        if (window.pageYOffset > 400) {
            btn.classList.add('visible');
        } else {
            btn.classList.remove('visible');
        }
    }, { passive: true });

    btn.addEventListener('click', function() {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

// ────────────────────────────────────────────────
// READING PROGRESS (sidebar bar for text pages)
// ────────────────────────────────────────────────
function initReadingProgress() {
    var content = document.querySelector('.article-text, .article-content');
    if (!content) return;

    var wrap = document.createElement('div');
    wrap.className = 'reading-progress-wrap';
    var bar = document.createElement('div');
    bar.className = 'reading-progress-bar';
    wrap.appendChild(bar);
    document.body.appendChild(wrap);

    window.addEventListener('scroll', function() {
        var rect = content.getBoundingClientRect();
        var docH = content.offsetHeight;
        var winH = window.innerHeight;
        var scrolled = -rect.top;
        var total = docH - winH;
        var pct = total > 0 ? Math.max(0, Math.min(100, (scrolled / total) * 100)) : 0;
        bar.style.height = pct + '%';
    }, { passive: true });
}

// ────────────────────────────────────────────────
// RIPPLE EFFECT on buttons/filters
// ────────────────────────────────────────────────
function initRippleEffect() {
    document.addEventListener('click', function(e) {
        var btn = e.target.closest('.filter-btn,.category-btn,.catalog-filter-btn,.HTL-CTA a');
        if (!btn) return;
        btn.classList.add('btn-ripple');
        var ripple = document.createElement('span');
        ripple.className = 'ripple';
        var rect = btn.getBoundingClientRect();
        var size = Math.max(rect.width, rect.height);
        ripple.style.cssText = 'width:' + size + 'px;height:' + size + 'px;left:' + (e.clientX - rect.left - size/2) + 'px;top:' + (e.clientY - rect.top - size/2) + 'px;position:absolute;border-radius:50%;background:rgba(255,255,255,0.25);transform:scale(0);animation:rippleEffect .6s linear;pointer-events:none;';
        btn.appendChild(ripple);
        setTimeout(function() { ripple.remove(); }, 700);
    });
}

// ────────────────────────────────────────────────
// PHOTO ARCHIVE — Search functionality
// ────────────────────────────────────────────────
function initPhotoSearch() {
    var galleryHeader = document.querySelector('.gallery-header .container');
    if (!galleryHeader) return;

    var wrapper = document.createElement('div');
    wrapper.className = 'gallery-search-wrapper fade-in-up delay-4';
    wrapper.innerHTML =
        '<input type="search" class="gallery-search" placeholder="Пошук за назвою або роком..." id="gallerySearch">' +
        '<svg class="gallery-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>';
    galleryHeader.appendChild(wrapper);

    // Count badge
    var countBadge = document.createElement('div');
    countBadge.className = 'gallery-count fade-in-up delay-4';
    countBadge.id = 'galleryCount';
    countBadge.innerHTML = 'Всього: <strong id="galleryCountNum">0</strong> фотографій';
    galleryHeader.appendChild(countBadge);

    // Listen for search input
    document.addEventListener('input', function(e) {
        if (e.target.id !== 'gallerySearch') return;
        var query = e.target.value.toLowerCase().trim();
        var cards = document.querySelectorAll('.photo-card');
        var visible = 0;
        cards.forEach(function(card) {
            var title = (card.querySelector('.photo-caption, .photo-title, [class*="caption"]')?.textContent || '').toLowerCase();
            var date  = (card.getAttribute('data-date') || card.querySelector('[class*="meta"]')?.textContent || '').toLowerCase();
            var show = !query || title.includes(query) || date.includes(query);
            card.style.display = show ? '' : 'none';
            if (show) visible++;
        });
        var numEl = document.getElementById('galleryCountNum');
        if (numEl) numEl.textContent = visible;
    });
}

// Update photo count when gallery loads
function updatePhotoCount() {
    var countEl = document.getElementById('galleryCountNum');
    if (!countEl) return;
    var observer = new MutationObserver(function() {
        var cards = document.querySelectorAll('.photo-card');
        countEl.textContent = cards.length;
    });
    var gallery = document.getElementById('photoGallery');
    if (gallery) observer.observe(gallery, { childList: true });
}

// ────────────────────────────────────────────────
// STAT NUMBERS — with animated progress bars
// ────────────────────────────────────────────────
function enhanceStatItems() {
    var bars = [
        { target: 'stat-years', fill: 1 },
        { target: 'stat-photos', fill: 0.43 },
        { target: 'stat-books', fill: 0.25 }
    ];

    document.querySelectorAll('.stat-item').forEach(function(item, i) {
        var bar = document.createElement('div');
        bar.className = 'stat-bar';
        var fill = document.createElement('div');
        fill.className = 'stat-bar-fill';
        fill.style.transitionDelay = (i * 0.2) + 's';
        bar.appendChild(fill);
        item.appendChild(bar);

        // Observe for visibility
        if ('IntersectionObserver' in window) {
            var io = new IntersectionObserver(function(entries) {
                entries.forEach(function(entry) {
                    if (entry.isIntersecting) {
                        item.classList.add('visible');
                        io.unobserve(item);
                    }
                });
            }, { threshold: 0.3 });
            io.observe(item);
        }
    });
}

// ────────────────────────────────────────────────
// HERO — Title animated entrance
// ────────────────────────────────────────────────
function enhanceHeroTitle() {
    var hero = document.querySelector('.hero');
    if (!hero) return;

    // Add particle system
    var particles = document.createElement('div');
    particles.className = 'hero-particles';
    for (var i = 0; i < 12; i++) {
        var p = document.createElement('div');
        p.className = 'hero-particle';
        var size = Math.random() * 3 + 1;
        p.style.cssText = [
            'width:' + size + 'px',
            'height:' + size + 'px',
            'left:' + (Math.random() * 100) + '%',
            'animation-duration:' + (8 + Math.random() * 12) + 's',
            'animation-delay:' + (Math.random() * 8) + 's',
            'opacity:' + (0.3 + Math.random() * 0.5)
        ].join(';');
        particles.appendChild(p);
    }
    hero.insertBefore(particles, hero.firstChild);

    // Add loaded class after tiny delay
    setTimeout(function() {
        hero.classList.add('hero-loaded');
    }, 100);
}

// ────────────────────────────────────────────────
// SMOOTH SECTION ENTRANCE — enhanced staggering
// ────────────────────────────────────────────────
function initAdvancedScrollAnimations() {
    if (!('IntersectionObserver' in window)) return;

    // Stagger children in grid sections
    var gridSections = document.querySelectorAll('.cards-grid, .stats-grid, .COBS, .POBS, .WOBS, .TPBOTTOM');
    gridSections.forEach(function(grid) {
        var children = grid.children;
        Array.prototype.forEach.call(children, function(child, i) {
            child.style.transitionDelay = (i * 0.08) + 's';
            child.classList.add('fade-in-up');
        });
    });

    var io = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                io.unobserve(entry.target);
            }
        });
    }, { threshold: 0.08 });

    document.querySelectorAll('.fade-in-up:not(.visible)').forEach(function(el) {
        var rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight) {
            el.classList.add('visible');
        } else {
            io.observe(el);
        }
    });
}

// ────────────────────────────────────────────────
// PAGE TRANSITION — smooth exits
// ────────────────────────────────────────────────
function initPageTransitions() {
    var overlay = document.createElement('div');
    overlay.className = 'page-transition';
    document.body.appendChild(overlay);

    // Fade out entrance
    setTimeout(function() {
        overlay.classList.add('exit');
    }, 50);

    // Intercept internal links
    document.addEventListener('click', function(e) {
        var link = e.target.closest('a[href]');
        if (!link) return;
        var href = link.getAttribute('href');
        if (!href || href.startsWith('#') || href.startsWith('http') || href.startsWith('mailto') || href.startsWith('tel')) return;
        if (link.target === '_blank') return;

        e.preventDefault();
        overlay.style.transitionDelay = '0s';
        overlay.style.transition = 'transform .45s cubic-bezier(.77,0,.18,1)';
        overlay.classList.remove('exit');
        overlay.classList.add('enter');

        setTimeout(function() {
            window.location.href = href;
        }, 460);
    });
}

// ────────────────────────────────────────────────
// INIT — only run after DOM is ready
// ────────────────────────────────────────────────
function init() {
    initScrollProgress();
    initCustomCursor();
    initBackToTop();
    initReadingProgress();
    initRippleEffect();
    initPhotoSearch();
    updatePhotoCount();
    enhanceStatItems();
    enhanceHeroTitle();
    initPageTransitions();

    // Delay non-critical
    setTimeout(initAdvancedScrollAnimations, 200);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

})();
