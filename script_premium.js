// ================================================
// ДУБРОВИЦЯ PREMIUM v7.0 — Luxury enhancements
// Додатковий шар преміум функціоналу
// ================================================

(function() {

// ================================================
// HERO PARALLAX — глибина
// ================================================
function initHeroParallax() {
    const heroBg = document.querySelector('.hero-bg');
    if (!heroBg) return;

    // Add loaded class for initial zoom-out
    requestAnimationFrame(() => {
        heroBg.classList.add('loaded');
    });

    // Parallax on scroll
    let ticking = false;
    window.addEventListener('scroll', function() {
        if (!ticking) {
            requestAnimationFrame(() => {
                const scrollY = window.pageYOffset;
                const heroEl = document.querySelector('.hero');
                if (!heroEl) return;
                const heroH = heroEl.offsetHeight;
                if (scrollY < heroH) {
                    const pct = scrollY / heroH;
                    heroBg.style.transform = `scale(1) translateY(${pct * 15}%)`;
                }
                ticking = false;
            });
            ticking = true;
        }
    }, { passive: true });
}

// ================================================
// HERO SCROLL HINT
// ================================================
function addHeroScrollHint() {
    const hero = document.querySelector('.hero');
    if (!hero) return;
    // Only add if not already present
    if (hero.querySelector('.hero-scroll-hint')) return;
    const hint = document.createElement('div');
    hint.className = 'hero-scroll-hint';
    hint.innerHTML = `<span>Гортати</span><div class="scroll-line"></div>`;
    hero.appendChild(hint);
}

// ================================================
// MASONRY RE-LAYOUT — після завантаження зображень
// ================================================
function refreshMasonry() {
    // CSS columns handles this automatically — just ensure images loaded
    const imgs = document.querySelectorAll('.photo-card img');
    imgs.forEach(img => {
        if (img.complete) return;
        img.addEventListener('load', () => {
            // trigger reflow
            img.closest('.photo-card')?.style.setProperty('display', 'block');
        });
    });
}

// ================================================
// ENHANCED PHOTO GALLERY RENDERER — zoom icon
// ================================================
function enhancePhotoCards() {
    document.querySelectorAll('.photo-card').forEach(card => {
        // Add zoom icon if not present
        if (!card.querySelector('.zoom-icon')) {
            const zoom = document.createElement('div');
            zoom.className = 'zoom-icon';
            zoom.innerHTML = '⊕';
            zoom.style.cssText = 'position:absolute;top:50%;left:50%;transform:translate(-50%,-50%) scale(0);width:44px;height:44px;background:rgba(200,152,26,0.85);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:1.3rem;transition:transform 0.3s cubic-bezier(0.34,1.56,0.64,1);z-index:5;pointer-events:none;color:#0f0a00;font-weight:300;';
            card.appendChild(zoom);
            card.addEventListener('mouseenter', () => {
                zoom.style.transform = 'translate(-50%,-50%) scale(1)';
            });
            card.addEventListener('mouseleave', () => {
                zoom.style.transform = 'translate(-50%,-50%) scale(0)';
            });
        }
    });
}

// ================================================
// LIGHTBOX FILMSTRIP
// ================================================
let filmstripEnabled = false;

function buildFilmstrip(photos, currentIndex) {
    const lb = document.getElementById('lightbox');
    if (!lb) return;

    let strip = lb.querySelector('.lightbox-filmstrip');

    // Build strip if not exists or photos changed
    if (!strip) {
        strip = document.createElement('div');
        strip.className = 'lightbox-filmstrip';
        lb.querySelector('.lightbox-content')?.appendChild(strip);
    }

    // Only show if <= 20 photos (otherwise it gets crowded)
    if (photos.length > 20 || photos.length <= 1) {
        strip.style.display = 'none';
        return;
    }

    strip.style.display = 'flex';
    strip.innerHTML = photos.map((p, i) => `
        <div class="filmstrip-thumb${i === currentIndex ? ' active' : ''}" data-index="${i}">
            <img src="${p.imageUrl.replace(/\.(jpe?g|png|gif|webp)$/i, 'm.$1')}" 
                 onerror="this.src='${p.imageUrl}'"
                 loading="lazy" alt="">
        </div>
    `).join('');

    strip.querySelectorAll('.filmstrip-thumb').forEach(thumb => {
        thumb.addEventListener('click', (e) => {
            e.stopPropagation();
            const idx = parseInt(thumb.dataset.index);
            if (typeof window.openLightbox === 'function') window.openLightbox(idx);
        });
    });
}

function updateFilmstripActive(index) {
    document.querySelectorAll('.filmstrip-thumb').forEach((t, i) => {
        t.classList.toggle('active', i === index);
    });
    // Scroll filmstrip to active
    const strip = document.querySelector('.lightbox-filmstrip');
    const activeThumb = strip?.querySelector('.filmstrip-thumb.active');
    if (strip && activeThumb) {
        activeThumb.scrollIntoView({ inline: 'center', behavior: 'smooth', block: 'nearest' });
    }
}

// ================================================
// INTERCEPT openLightbox / navigateLightbox
// ================================================
function patchLightbox() {
    const origOpen = window.openLightbox;
    const origNav = window.navigateLightbox;
    if (!origOpen) return;

    window.openLightbox = function(index) {
        origOpen(index);
        // Update filmstrip
        if (window.filteredPhotos && window.filteredPhotos.length) {
            buildFilmstrip(window.filteredPhotos, index);
            updateFilmstripActive(index);
        }
        // Animate image in
        const img = document.getElementById('lightboxImage');
        if (img) {
            img.style.animation = 'none';
            requestAnimationFrame(() => {
                img.style.animation = 'lightboxImageIn 0.3s cubic-bezier(0.22, 1, 0.36, 1) both';
            });
        }
    };

    if (origNav) {
        window.navigateLightbox = function(direction) {
            origNav(direction);
            if (window.currentPhotoIndex !== undefined && window.filteredPhotos) {
                updateFilmstripActive(window.currentPhotoIndex);
            }
        };
    }
}

// ================================================
// STAGGER CATALOG ITEMS
// ================================================
function initCatalogStagger() {
    const items = document.querySelectorAll('.catalog-item');
    items.forEach((item, i) => {
        item.style.animationDelay = `${i * 0.08}s`;
        item.style.opacity = '0';
        item.style.transform = 'translateY(20px)';
        item.style.transition = 'opacity 0.55s cubic-bezier(0.22,1,0.36,1), transform 0.55s cubic-bezier(0.22,1,0.36,1)';
        const obs = new IntersectionObserver(entries => {
            entries.forEach(e => {
                if (e.isIntersecting) {
                    setTimeout(() => {
                        item.style.opacity = '1';
                        item.style.transform = 'translateY(0)';
                    }, i * 70);
                    obs.unobserve(item);
                }
            });
        }, { threshold: 0.08 });
        obs.observe(item);
    });
}

// ================================================
// MAGNETIC CURSOR EFFECT ON CARDS
// ================================================
function initMagneticCards() {
    // Only on desktop (no-touch)
    if (window.matchMedia('(hover: none)').matches) return;

    const cards = document.querySelectorAll('.card, .catalog-item');
    cards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width - 0.5;
            const y = (e.clientY - rect.top) / rect.height - 0.5;
            card.style.transform = `translateY(-8px) perspective(1000px) rotateX(${y * -3}deg) rotateY(${x * 3}deg)`;
        });
        card.addEventListener('mouseleave', () => {
            card.style.transform = '';
            card.style.transition = 'transform 0.5s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.5s ease, border-color 0.3s ease';
        });
        card.addEventListener('mouseenter', () => {
            card.style.transition = 'transform 0.1s ease, box-shadow 0.4s ease, border-color 0.3s ease';
        });
    });
}

// ================================================
// SECTION ORNAMENTS — auto-inject
// ================================================
function injectSectionOrnaments() {
    document.querySelectorAll('.section-title').forEach(title => {
        // Only add if not already in a section with ornament
        if (!title.nextElementSibling?.classList.contains('section-ornament')) {
            const orn = document.createElement('div');
            orn.className = 'section-ornament';
            orn.innerHTML = '<div class="section-ornament-icon"></div>';
            title.insertAdjacentElement('afterend', orn);
        }
    });
}

// ================================================
// SMOOTH IMAGE REVEAL — prevent CLS
// ================================================
function initImageReveal() {
    document.querySelectorAll('img[loading="lazy"]').forEach(img => {
        img.style.opacity = '0';
        img.style.transition = 'opacity 0.5s ease, filter 0.5s ease';
        if (img.complete) {
            img.style.opacity = '1';
        } else {
            img.addEventListener('load', () => {
                img.style.opacity = '1';
            });
        }
    });
}

// ================================================
// PHOTO GALLERY — intercept display to stagger
// ================================================
function observeGalleryMutation() {
    const gallery = document.getElementById('photoGallery');
    if (!gallery) return;

    const mo = new MutationObserver(() => {
        setTimeout(() => {
            refreshMasonry();
            enhancePhotoCards();
            initImageReveal();
        }, 50);
    });
    mo.observe(gallery, { childList: true });
}

// ================================================
// MOBILE NAV — full height, smooth
// ================================================
function enhanceMobileNav() {
    const nav = document.querySelector('.nav');
    if (!nav) return;
    // Ensure full height on mobile
    const resizeObs = new ResizeObserver(() => {
        if (window.innerWidth <= 1024) {
            nav.style.height = '100dvh';
        } else {
            nav.style.height = '';
        }
    });
    resizeObs.observe(document.body);
}

// ================================================
// HEADER HIDE ON SCROLL DOWN, SHOW ON SCROLL UP
// ================================================
function initSmartHeader() {
    const header = document.querySelector('.header');
    if (!header) return;

    let lastY = 0;
    let hidden = false;
    const THRESHOLD = 150; // don't hide until scrolled past this

    window.addEventListener('scroll', () => {
        const y = window.pageYOffset;
        const delta = y - lastY;

        if (y > THRESHOLD) {
            if (delta > 3 && !hidden) {
                // Scrolling down — hide subtly (not fully)
                header.style.transform = 'translateY(-8px)';
                header.style.opacity = '0.85';
                hidden = true;
            } else if (delta < -3 && hidden) {
                // Scrolling up — show
                header.style.transform = 'translateY(0)';
                header.style.opacity = '1';
                hidden = false;
            }
        } else {
            header.style.transform = 'translateY(0)';
            header.style.opacity = '1';
            hidden = false;
        }

        lastY = y;
    }, { passive: true });

    // Add transition
    header.style.transition = 'transform 0.4s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.4s ease, box-shadow 0.4s ease, background-color 0.4s ease, backdrop-filter 0.4s ease';
}

// ================================================
// BOOK LOCATION LINK FIX — make it clickable
// ================================================
function enhanceBookLinks() {
    const grid = document.getElementById('booksGrid');
    if (!grid) return;

    const mo = new MutationObserver(() => {
        grid.querySelectorAll('.book-info').forEach(info => {
            info.querySelectorAll('p').forEach(p => {
                if (p.innerHTML.includes('Місце зберігання:') && !p.querySelector('a')) {
                    const text = p.textContent;
                    const urlMatch = text.match(/https?:\/\/[^\s]+/);
                    if (urlMatch) {
                        const url = urlMatch[0];
                        const label = url.length > 40 ? url.substring(0, 40) + '...' : url;
                        p.innerHTML = `<strong>Місце зберігання:</strong> <a href="${url}" target="_blank" rel="noopener" style="color:var(--color-accent-dark);text-decoration:underline;text-underline-offset:3px;">${label} →</a>`;
                    }
                }
            });
        });
    });
    mo.observe(grid, { childList: true, subtree: true });
}

// ================================================
// INIT ALL
// ================================================
document.addEventListener('DOMContentLoaded', function() {
    // Core enhancements
    initHeroParallax();
    addHeroScrollHint();
    initSmartHeader();
    injectSectionOrnaments();
    initImageReveal();
    enhanceMobileNav();
    enhanceBookLinks();

    // Gallery
    observeGalleryMutation();
    enhancePhotoCards();

    // Catalog
    initCatalogStagger();
    initMagneticCards();

    // Patch lightbox after gallery init
    setTimeout(() => {
        patchLightbox();
    }, 300);

    // Re-run after dynamic content loads
    setTimeout(() => {
        enhancePhotoCards();
        initCatalogStagger();
        initMagneticCards();
        patchLightbox();
    }, 1500);
});

// Re-patch after async loads
window.addEventListener('load', () => {
    patchLightbox();
    refreshMasonry();
    initMagneticCards();
});

})();
