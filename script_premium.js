// ================================================
// ДУБРОВИЦЯ PREMIUM v8.0 — Enhanced Interactive Edition
// Додатковий шар преміум функціоналу з новими ефектами
// ================================================

(function() {

// ================================================
// HERO PARALLAX — глибина з покращеннями
// ================================================
function initHeroParallax() {
    const heroBg = document.querySelector('.hero-bg');
    if (!heroBg) return;

    requestAnimationFrame(() => {
        heroBg.classList.add('loaded');
    });

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
// HERO SCROLL HINT with animation
// ================================================
function addHeroScrollHint() {
    const hero = document.querySelector('.hero');
    if (!hero || hero.querySelector('.hero-scroll-hint')) return;
    
    const hint = document.createElement('div');
    hint.className = 'hero-scroll-hint';
    hint.innerHTML = `<span>Гортати</span><div class="scroll-line"></div>`;
    hero.appendChild(hint);
    
    // Pulse animation
    setInterval(() => {
        hint.style.transform = 'translateX(-50%) scale(1.05)';
        setTimeout(() => {
            hint.style.transform = 'translateX(-50%) scale(1)';
        }, 200);
    }, 3000);
}

// ================================================
// ENHANCED PHOTO CARDS with 3D tilt
// ================================================
function enhancePhotoCards() {
    document.querySelectorAll('.photo-card').forEach(card => {
        if (!card.querySelector('.zoom-icon')) {
            const zoom = document.createElement('div');
            zoom.className = 'zoom-icon';
            zoom.innerHTML = '⊕';
            zoom.style.cssText = 'position:absolute;top:50%;left:50%;transform:translate(-50%,-50%) scale(0);width:48px;height:48px;background:rgba(200,152,26,0.92);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:1.4rem;transition:transform 0.35s cubic-bezier(0.34,1.56,0.64,1);z-index:5;pointer-events:none;color:#0f0a00;font-weight:400;box-shadow:0 4px 16px rgba(201,162,39,0.3);';
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
// LIGHTBOX FILMSTRIP — покращена версія
// ================================================
function buildFilmstrip(photos, currentIndex) {
    const lb = document.getElementById('lightbox');
    if (!lb) return;

    let strip = lb.querySelector('.lightbox-filmstrip');

    if (!strip) {
        strip = document.createElement('div');
        strip.className = 'lightbox-filmstrip';
        lb.querySelector('.lightbox-content')?.appendChild(strip);
    }

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
        if (window.filteredPhotos && window.filteredPhotos.length) {
            buildFilmstrip(window.filteredPhotos, index);
            updateFilmstripActive(index);
        }
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
// STAGGER CATALOG ITEMS with Intersection Observer
// ================================================
function initCatalogStagger() {
    const items = document.querySelectorAll('.catalog-item');
    items.forEach((item, i) => {
        item.style.opacity = '0';
        item.style.transform = 'translateY(24px)';
        item.style.transition = 'opacity 0.6s cubic-bezier(0.22,1,0.36,1), transform 0.6s cubic-bezier(0.22,1,0.36,1)';
        
        const obs = new IntersectionObserver(entries => {
            entries.forEach(e => {
                if (e.isIntersecting) {
                    setTimeout(() => {
                        item.style.opacity = '1';
                        item.style.transform = 'translateY(0)';
                    }, i * 60);
                    obs.unobserve(item);
                }
            });
        }, { threshold: 0.1 });
        obs.observe(item);
    });
}

// ================================================
// MAGNETIC CURSOR EFFECT — 3D tilt on cards
// ================================================
function initMagneticCards() {
    if (window.matchMedia('(hover: none)').matches) return;

    const cards = document.querySelectorAll('.card, .catalog-item, .photo-card');
    cards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width - 0.5;
            const y = (e.clientY - rect.top) / rect.height - 0.5;
            card.style.transform = `translateY(-8px) perspective(1000px) rotateX(${y * -2.5}deg) rotateY(${x * 2.5}deg)`;
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.transform = '';
            card.style.transition = 'transform 0.6s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.5s ease, border-color 0.3s ease';
        });
        
        card.addEventListener('mouseenter', () => {
            card.style.transition = 'transform 0.15s ease, box-shadow 0.4s ease, border-color 0.3s ease';
        });
    });
}

// ================================================
// SECTION ORNAMENTS — auto-inject покращені
// ================================================
function injectSectionOrnaments() {
    document.querySelectorAll('.section-title').forEach(title => {
        if (!title.nextElementSibling?.classList.contains('section-ornament')) {
            const orn = document.createElement('div');
            orn.className = 'section-ornament';
            orn.innerHTML = '<div class="section-ornament-icon"></div>';
            orn.style.cssText = 'text-align:center;margin:0.8rem 0 1.5rem;';
            const icon = orn.querySelector('.section-ornament-icon');
            icon.style.cssText = 'display:inline-block;width:44px;height:2px;background:linear-gradient(90deg,transparent,#c9a227,transparent);position:relative;';
            icon.innerHTML = '<span style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:6px;height:6px;background:#c9a227;border-radius:50%;box-shadow:0 0 8px rgba(201,162,39,0.4);"></span>';
            title.insertAdjacentElement('afterend', orn);
        }
    });
}

// ================================================
// SMOOTH IMAGE REVEAL
// ================================================
function initImageReveal() {
    document.querySelectorAll('img[loading="lazy"]').forEach(img => {
        img.style.opacity = '0';
        img.style.transition = 'opacity 0.6s ease, filter 0.6s ease';
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
// GALLERY MUTATION OBSERVER
// ================================================
function observeGalleryMutation() {
    const gallery = document.getElementById('photoGallery');
    if (!gallery) return;

    const mo = new MutationObserver(() => {
        setTimeout(() => {
            enhancePhotoCards();
            initImageReveal();
        }, 50);
    });
    mo.observe(gallery, { childList: true });
}

// ================================================
// ENHANCED MOBILE NAV
// ================================================
function enhanceMobileNav() {
    const nav = document.querySelector('.nav');
    if (!nav) return;
    
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
// SMART HEADER — hide on scroll down
// ================================================
function initSmartHeader() {
    const header = document.querySelector('.header');
    if (!header) return;

    let lastY = 0;
    let hidden = false;
    const THRESHOLD = 120;

    window.addEventListener('scroll', () => {
        const y = window.pageYOffset;
        const delta = y - lastY;

        if (y > THRESHOLD) {
            if (delta > 2 && !hidden) {
                header.style.transform = 'translateY(-6px)';
                header.style.opacity = '0.9';
                hidden = true;
            } else if (delta < -2 && hidden) {
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

    header.style.transition = 'transform 0.4s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.4s ease, box-shadow 0.4s ease';
}

// ================================================
// BOOK LINKS ENHANCEMENT
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
                        p.innerHTML = `<strong>Місце зберігання:</strong> <a href="${url}" target="_blank" rel="noopener" style="color:var(--color-accent-dark);text-decoration:underline;text-underline-offset:3px;transition:color 0.2s;">${label} →</a>`;
                    }
                }
            });
        });
    });
    mo.observe(grid, { childList: true, subtree: true });
}

// ================================================
// READING PROGRESS BAR
// ================================================
function initReadingProgress() {
    if (!document.querySelector('.article-content')) return;
    
    const bar = document.createElement('div');
    bar.style.cssText = 'position:fixed;top:0;left:0;height:3px;background:linear-gradient(90deg,#c9a227,#e0bd5a);z-index:99999;transition:width 0.1s ease;width:0;';
    document.body.appendChild(bar);
    
    window.addEventListener('scroll', () => {
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrolled = window.pageYOffset;
        const pct = (scrolled / docHeight) * 100;
        bar.style.width = pct + '%';
    }, { passive: true });
}

// ================================================
// TOOLTIP SYSTEM for interactive elements
// ================================================
function initTooltips() {
    document.querySelectorAll('[data-tooltip]').forEach(el => {
        el.addEventListener('mouseenter', (e) => {
            const tip = document.createElement('div');
            tip.textContent = el.dataset.tooltip;
            tip.style.cssText = 'position:absolute;background:rgba(8,6,4,0.95);color:#f0e6c8;padding:0.5rem 0.8rem;border-radius:6px;font-size:0.7rem;z-index:100000;pointer-events:none;box-shadow:0 4px 16px rgba(0,0,0,0.3);backdrop-filter:blur(10px);border:1px solid rgba(201,162,39,0.2);';
            document.body.appendChild(tip);
            
            const rect = el.getBoundingClientRect();
            tip.style.top = (rect.top - tip.offsetHeight - 8) + 'px';
            tip.style.left = (rect.left + rect.width / 2 - tip.offsetWidth / 2) + 'px';
            
            el._tooltip = tip;
        });
        
        el.addEventListener('mouseleave', () => {
            if (el._tooltip) {
                el._tooltip.remove();
                delete el._tooltip;
            }
        });
    });
}

// ================================================
// INIT ALL — Enhanced version
// ================================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('🏛️ Дубровиця Premium v8.0 — Завантажено');
    
    // Core enhancements
    initHeroParallax();
    addHeroScrollHint();
    initSmartHeader();
    injectSectionOrnaments();
    initImageReveal();
    enhanceMobileNav();
    enhanceBookLinks();
    initReadingProgress();
    initTooltips();

    // Gallery
    observeGalleryMutation();
    enhancePhotoCards();

    // Catalog
    initCatalogStagger();
    initMagneticCards();

    // Lightbox
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
    initMagneticCards();
});

})();
