// ================================================
// ДУБРОВИЦЯ - ПОВНІСТЮ ВИПРАВЛЕНИЙ JAVASCRIPT V4.0
// ✅ ФОТОАРХІВ ПРАЦЮЄ З ДЕМО-ДАНИМИ
// ✅ ПОШУК КНИГ ПРАЦЮЄ
// ✅ ПОШУК МЕТРИЧНИХ КНИГ ПРАЦЮЄ
// ✅ СУЧАСНИЙ ДИЗАЙН
// ================================================

console.log('✅ Дубровиця Script v4.0 - Все працює!');

// ================================================
// ДЕМО-ДАНІ ДЛЯ ФОТОАРХІВУ
// ================================================
const DEMO_PHOTOS = [
    // Церкви
    {
        imageUrl: 'https://images.unsplash.com/photo-1548013146-72479768bada?w=800&q=80',
        title: 'Костел Іоана Хрестителя, початок XX століття',
        period: '1900-1939',
        category: 'churches',
        date: '1910'
    },
    {
        imageUrl: 'https://images.unsplash.com/photo-1584448062751-f63e4e7cc2e3?w=800&q=80',
        title: 'Православна церква Святої Трійці',
        period: '1900-1939',
        category: 'churches',
        date: '1925'
    },
    {
        imageUrl: 'https://images.unsplash.com/photo-1605106250963-ffda6d2a4b32?w=800&q=80',
        title: 'Дерев\'яна церква біля Дубровиці',
        period: 'before-1900',
        category: 'churches',
        date: '1880'
    },
    
    // Вулиці
    {
        imageUrl: 'https://images.unsplash.com/photo-1590004953392-5aba2e72269a?w=800&q=80',
        title: 'Центральна вулиця Дубровиці, міжвоєнний період',
        period: '1900-1939',
        category: 'streets',
        date: '1930'
    },
    {
        imageUrl: 'https://images.unsplash.com/photo-1583137890236-e5a1b4e3f0b3?w=800&q=80',
        title: 'Ринкова площа Дубровиці',
        period: '1945-1991',
        category: 'streets',
        date: '1960'
    },
    {
        imageUrl: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800&q=80',
        title: 'Головна вулиця після відбудови',
        period: '1945-1991',
        category: 'streets',
        date: '1955'
    },
    {
        imageUrl: 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=800&q=80',
        title: 'Сучасна Дубровиця',
        period: 'after-1991',
        category: 'streets',
        date: '2015'
    },
    
    // Люди
    {
        imageUrl: 'https://images.unsplash.com/photo-1604537466158-719b1972feb8?w=800&q=80',
        title: 'Родина дубровицьких купців',
        period: 'before-1900',
        category: 'people',
        date: '1895'
    },
    {
        imageUrl: 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=800&q=80',
        title: 'Жителі Дубровиці на святковій ході',
        period: '1900-1939',
        category: 'people',
        date: '1935'
    },
    {
        imageUrl: 'https://images.unsplash.com/photo-1505142468610-359e7d316be0?w=800&q=80',
        title: 'Святкування на центральній площі',
        period: '1945-1991',
        category: 'people',
        date: '1970'
    },
    
    // Архітектура
    {
        imageUrl: 'https://images.unsplash.com/photo-1568667256549-094345857637?w=800&q=80',
        title: 'Будинок Дубровицької ратуші',
        period: 'before-1900',
        category: 'architecture',
        date: '1890'
    },
    {
        imageUrl: 'https://images.unsplash.com/photo-1598893629188-bb4ba0c9e485?w=800&q=80',
        title: 'Історична будівля міської управи',
        period: '1900-1939',
        category: 'architecture',
        date: '1920'
    },
    {
        imageUrl: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=800&q=80',
        title: 'Радянська архітектура Дубровиці',
        period: '1945-1991',
        category: 'architecture',
        date: '1975'
    },
    
    // Аерофото
    {
        imageUrl: 'https://images.unsplash.com/photo-1569163139394-de4798aa62b5?w=800&q=80',
        title: 'Дубровиця з висоти пташиного польоту, 1960-ті',
        period: '1945-1991',
        category: 'aerial',
        date: '1965'
    },
    {
        imageUrl: 'https://images.unsplash.com/photo-1500259571355-332da5cb07aa?w=800&q=80',
        title: 'Панорама Дубровиці сучасна',
        period: 'after-1991',
        category: 'aerial',
        date: '2020'
    },
    
    // Малюнки
    {
        imageUrl: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800&q=80',
        title: 'Гравюра Дубровицького замку',
        period: 'before-1900',
        category: 'drawings',
        date: '1850'
    },
    {
        imageUrl: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=800&q=80',
        title: 'Малюнок Дубровиці з оборонними спорудами',
        period: 'before-1900',
        category: 'drawings',
        date: '1780'
    },
    
    // Події
    {
        imageUrl: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800&q=80',
        title: 'Відкриття пам\'ятника героям війни',
        period: '1945-1991',
        category: 'events',
        date: '1985'
    },
    {
        imageUrl: 'https://images.unsplash.com/photo-1461360370896-922624d12aa1?w=800&q=80',
        title: 'День незалежності України в Дубровиці',
        period: 'after-1991',
        category: 'events',
        date: '2000'
    },
    {
        imageUrl: 'https://images.unsplash.com/photo-1533900298318-6b8da08a523e?w=800&q=80',
        title: 'Святкування 1000-річчя Дубровиці',
        period: 'after-1991',
        category: 'events',
        date: '2005'
    }
];

// ================================================
// КОНСТАНТИ
// ================================================
const PERIOD_NAMES = {
    'before-1900': 'До 1900',
    '1900-1939': '1900—1939',
    '1939-1945': '1939—1945',
    '1945-1991': '1945—1991',
    'after-1991': 'Після 1991'
};

const CATEGORY_NAMES = {
    'churches': '🛐 Церкви',
    'streets': '🏘️ Вулиці',
    'people': '👥 Люди',
    'architecture': '🏛️ Архітектура',
    'aerial': '✈️ Аерофото',
    'drawings': '🎨 Малюнки',
    'events': '📅 Події'
};

// ================================================
// 1. ТЕМА
// ================================================
function initTheme() {
    const themeToggle = document.getElementById('themeToggle');
    const html = document.documentElement;
    
    const savedTheme = localStorage.getItem('dubrovytsia-theme') || 'light';
    html.setAttribute('data-theme', savedTheme);
    
    if (themeToggle) {
        themeToggle.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const currentTheme = html.getAttribute('data-theme');
            const newTheme = currentTheme === 'light' ? 'dark' : 'light';
            
            html.setAttribute('data-theme', newTheme);
            localStorage.setItem('dubrovytsia-theme', newTheme);
            
            console.log('✅ Тема змінена на:', newTheme);
        });
    }
}

// ================================================
// 2. МОБІЛЬНА НАВІГАЦІЯ
// ================================================
function initMobileNav() {
    const mobileToggle = document.getElementById('mobileToggle');
    const mainNav = document.getElementById('mainNav');
    const body = document.body;
    
    if (mobileToggle && mainNav) {
        mobileToggle.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            mainNav.classList.toggle('active');
            mobileToggle.classList.toggle('active');
            body.classList.toggle('menu-open');
        });
        
        const navLinks = mainNav.querySelectorAll('.nav-link');
        navLinks.forEach(function(link) {
            link.addEventListener('click', function() {
                mainNav.classList.remove('active');
                mobileToggle.classList.remove('active');
                body.classList.remove('menu-open');
            });
        });
        
        document.addEventListener('click', function(e) {
            if (!mainNav.contains(e.target) && !mobileToggle.contains(e.target)) {
                mainNav.classList.remove('active');
                mobileToggle.classList.remove('active');
                body.classList.remove('menu-open');
            }
        });
    }
}

// ================================================
// 3. АНІМАЦІЇ ПРИ СКРОЛІ
// ================================================
function initScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, observerOptions);
    
    const elements = document.querySelectorAll('.fade-in-up, [data-aos]');
    elements.forEach(function(el) {
        observer.observe(el);
    });
    
    console.log('✅ Анімації ініціалізовано:', elements.length);
}

// ================================================
// 4. ПЛАВНИЙ СКРОЛ
// ================================================
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(function(anchor) {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href === '#' || !href) return;
            
            e.preventDefault();
            const target = document.querySelector(href);
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// ================================================
// 5. HEADER ПРИ СКРОЛІ
// ================================================
function initHeaderScroll() {
    const header = document.querySelector('.header');
    
    if (header) {
        window.addEventListener('scroll', function() {
            if (window.pageYOffset > 100) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        });
    }
}

// ================================================
// 6. АНІМОВАНІ ЛІЧИЛЬНИКИ
// ================================================
function initCounters() {
    const counters = document.querySelectorAll('.stat-number');
    
    const animateCounter = function(counter) {
        const target = parseInt(counter.getAttribute('data-target'));
        const duration = 2000;
        const step = target / (duration / 16);
        let current = 0;
        
        const timer = setInterval(function() {
            current += step;
            if (current >= target) {
                counter.textContent = target.toLocaleString('uk-UA');
                clearInterval(timer);
            } else {
                counter.textContent = Math.floor(current).toLocaleString('uk-UA');
            }
        }, 16);
    };
    
    if (counters.length > 0) {
        const observer = new IntersectionObserver(function(entries) {
            entries.forEach(function(entry) {
                if (entry.isIntersecting && !entry.target.classList.contains('counted')) {
                    entry.target.classList.add('counted');
                    animateCounter(entry.target);
                }
            });
        }, { threshold: 0.5 });
        
        counters.forEach(function(counter) {
            observer.observe(counter);
        });
        
        console.log('✅ Лічильники:', counters.length);
    }
}

// ================================================
// 7. ПОШУК КНИГ - ПОВНІСТЮ ВИПРАВЛЕНИЙ
// ================================================
function initBooksSearch() {
    const searchInput = document.getElementById('searchInput');
    const bookItems = document.querySelectorAll('.book-item');
    
    // Перевіряємо чи ми на сторінці книг
    const isBooksPage = window.location.pathname.includes('books.html') || 
                        document.querySelector('.book-cover');
    
    if (searchInput && bookItems.length > 0 && isBooksPage) {
        console.log('✅ Пошук книг ініціалізовано:', bookItems.length, 'книг');
        
        searchInput.addEventListener('input', function(e) {
            const searchTerm = e.target.value.toLowerCase().trim();
            let visibleCount = 0;
            
            bookItems.forEach(function(item) {
                const title = item.querySelector('h3')?.textContent.toLowerCase() || '';
                const meta = item.querySelector('.book-meta')?.textContent.toLowerCase() || '';
                const description = item.querySelector('.book-description')?.textContent.toLowerCase() || '';
                
                const searchableText = title + ' ' + meta + ' ' + description;
                
                if (searchableText.includes(searchTerm) || searchTerm === '') {
                    item.style.display = 'block';
                    visibleCount++;
                } else {
                    item.style.display = 'none';
                }
            });
            
            const container = document.querySelector('.catalog-grid');
            let noResults = container?.querySelector('.no-results');
            
            if (visibleCount === 0 && searchTerm !== '') {
                if (!noResults && container) {
                    noResults = document.createElement('div');
                    noResults.className = 'no-results';
                    noResults.style.cssText = 'grid-column: 1/-1; text-align: center; padding: 3rem; background: var(--color-bg-secondary); border-radius: 1rem; margin: 2rem 0;';
                    noResults.innerHTML = `
                        <div style="font-size: 3rem; margin-bottom: 1rem;">📚</div>
                        <p style="font-size: 1.5rem; font-weight: 600; margin-bottom: 0.5rem;">Нічого не знайдено</p>
                        <p style="color: var(--color-text-secondary);">Спробуйте змінити пошуковий запит</p>
                    `;
                    container.appendChild(noResults);
                }
            } else if (noResults) {
                noResults.remove();
            }
            
            console.log('Знайдено книг:', visibleCount, 'для запиту:', searchTerm);
        });
        
        console.log('✅ Пошук книг активовано');
    }
}

// ================================================
// 8. ПОШУК МЕТРИЧНИХ КНИГ - ПОВНІСТЮ ВИПРАВЛЕНИЙ
// ================================================
function initMetricSearch() {
    // Перевіряємо обидва можливі ID
    const searchInput = document.getElementById('metricSearchInput') || document.getElementById('searchInput');
    const metricItems = document.querySelectorAll('.metric-item, .catalog-item');
    
    // Перевіряємо чи ми на сторінці метричних книг
    const isMetricPage = window.location.pathname.includes('metrychni-knyhy') || 
                         document.querySelector('.catalog-item h3');
    
    if (searchInput && metricItems.length > 0 && isMetricPage) {
        console.log('✅ Пошук метричних книг:', metricItems.length, 'записів');
        
        searchInput.addEventListener('input', function(e) {
            const searchTerm = e.target.value.toLowerCase().trim();
            let visibleCount = 0;
            
            metricItems.forEach(function(item) {
                // Беремо весь текст з елемента
                const textContent = item.textContent.toLowerCase();
                
                if (textContent.includes(searchTerm) || searchTerm === '') {
                    item.style.display = 'block';
                    visibleCount++;
                } else {
                    item.style.display = 'none';
                }
            });
            
            const container = document.querySelector('.catalog-grid');
            let noResults = container?.querySelector('.no-results');
            
            if (visibleCount === 0 && searchTerm !== '') {
                if (!noResults && container) {
                    noResults = document.createElement('div');
                    noResults.className = 'no-results';
                    noResults.style.cssText = 'grid-column: 1/-1; text-align: center; padding: 3rem; background: var(--color-bg-secondary); border-radius: 1rem; margin: 2rem 0;';
                    noResults.innerHTML = `
                        <div style="font-size: 3rem; margin-bottom: 1rem;">📖</div>
                        <p style="font-size: 1.5rem; font-weight: 600; margin-bottom: 0.5rem;">Записів не знайдено</p>
                        <p style="color: var(--color-text-secondary);">Спробуйте інший пошуковий запит</p>
                    `;
                    container.appendChild(noResults);
                }
            } else if (noResults) {
                noResults.remove();
            }
            
            console.log('Знайдено записів:', visibleCount);
        });
        
        console.log('✅ Пошук метричних книг активовано');
    }
}

// ================================================
// 9. ФОТОГАЛЕРЕЯ - ВИПРАВЛЕНО З ДЕМО-ДАНИМИ
// ================================================
let allPhotos = [];
let currentFilter = 'all';
let currentCategory = 'all';
let currentPhotoIndex = 0;

function initPhotoGallery() {
    console.log('🎨 Ініціалізація фотогалереї...');
    
    // Використовуємо демо-дані
    allPhotos = DEMO_PHOTOS;
    
    console.log('✅ Завантажено', allPhotos.length, 'демо-фотографій');
    
    displayPhotos();
    initGalleryFilters();
    initLightbox();
}

function displayPhotos() {
    const photoGallery = document.getElementById('photoGallery');
    if (!photoGallery) return;
    
    photoGallery.innerHTML = '';
    
    const filteredPhotos = allPhotos.filter(function(photo) {
        const periodMatch = currentFilter === 'all' || photo.period === currentFilter;
        const categoryMatch = currentCategory === 'all' || photo.category === currentCategory;
        return periodMatch && categoryMatch;
    });
    
    if (filteredPhotos.length === 0) {
        photoGallery.innerHTML = `
            <div class="no-results" style="grid-column: 1/-1; text-align: center; padding: 3rem;">
                <div style="font-size: 3rem; margin-bottom: 1rem;">📷</div>
                <p style="font-size: 1.5rem; font-weight: 600;">Фотографій не знайдено</p>
                <p style="margin-top: 0.5rem; color: var(--color-text-secondary);">Спробуйте інші фільтри</p>
            </div>
        `;
        return;
    }
    
    filteredPhotos.forEach(function(photo, index) {
        const photoCard = document.createElement('div');
        photoCard.className = 'gallery-item fade-in-up visible';
        photoCard.style.animationDelay = (index * 0.05) + 's';
        
        photoCard.innerHTML = `
            <img src="${photo.imageUrl}" alt="${photo.title}" loading="lazy">
            <div class="gallery-overlay">
                <h4>${photo.title}</h4>
                <p>
                    <span class="badge">${PERIOD_NAMES[photo.period] || photo.period}</span>
                    <span class="badge">${CATEGORY_NAMES[photo.category] || photo.category}</span>
                </p>
            </div>
        `;
        
        photoCard.addEventListener('click', function() {
            openLightbox(index, filteredPhotos);
        });
        
        photoGallery.appendChild(photoCard);
    });
    
    console.log('✅ Показано', filteredPhotos.length, 'фото');
}

function initGalleryFilters() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    const categoryBtns = document.querySelectorAll('.category-btn');
    
    filterBtns.forEach(function(btn) {
        btn.addEventListener('click', function() {
            filterBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentFilter = this.getAttribute('data-filter');
            displayPhotos();
            console.log('Фільтр періоду:', currentFilter);
        });
    });
    
    categoryBtns.forEach(function(btn) {
        btn.addEventListener('click', function() {
            categoryBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentCategory = this.getAttribute('data-category');
            displayPhotos();
            console.log('Фільтр категорії:', currentCategory);
        });
    });
    
    console.log('✅ Фільтри ініціалізовано');
}

function openLightbox(index, photos) {
    const lightbox = document.getElementById('lightbox');
    const lightboxImage = document.getElementById('lightboxImage');
    const lightboxCaption = document.getElementById('lightboxCaption');
    const lightboxMeta = document.getElementById('lightboxMeta');
    
    if (!lightbox || !photos || photos.length === 0) return;
    
    currentPhotoIndex = index;
    const photo = photos[currentPhotoIndex];
    
    lightboxImage.src = photo.imageUrl;
    lightboxCaption.textContent = photo.title;
    lightboxMeta.textContent = `${PERIOD_NAMES[photo.period]} • ${CATEGORY_NAMES[photo.category]}`;
    
    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    const prevBtn = lightbox.querySelector('.lightbox-prev');
    const nextBtn = lightbox.querySelector('.lightbox-next');
    
    if (prevBtn) {
        prevBtn.onclick = function() {
            currentPhotoIndex = (currentPhotoIndex - 1 + photos.length) % photos.length;
            const newPhoto = photos[currentPhotoIndex];
            lightboxImage.src = newPhoto.imageUrl;
            lightboxCaption.textContent = newPhoto.title;
            lightboxMeta.textContent = `${PERIOD_NAMES[newPhoto.period]} • ${CATEGORY_NAMES[newPhoto.category]}`;
        };
    }
    
    if (nextBtn) {
        nextBtn.onclick = function() {
            currentPhotoIndex = (currentPhotoIndex + 1) % photos.length;
            const newPhoto = photos[currentPhotoIndex];
            lightboxImage.src = newPhoto.imageUrl;
            lightboxCaption.textContent = newPhoto.title;
            lightboxMeta.textContent = `${PERIOD_NAMES[newPhoto.period]} • ${CATEGORY_NAMES[newPhoto.category]}`;
        };
    }
}

function initLightbox() {
    const lightbox = document.getElementById('lightbox');
    const closeBtn = lightbox?.querySelector('.lightbox-close');
    
    if (closeBtn) {
        closeBtn.addEventListener('click', function() {
            lightbox.classList.remove('active');
            document.body.style.overflow = '';
        });
    }
    
    if (lightbox) {
        lightbox.addEventListener('click', function(e) {
            if (e.target === lightbox) {
                lightbox.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    }
    
    document.addEventListener('keydown', function(e) {
        if (!lightbox || !lightbox.classList.contains('active')) return;
        
        if (e.key === 'Escape') {
            lightbox.classList.remove('active');
            document.body.style.overflow = '';
        } else if (e.key === 'ArrowLeft') {
            lightbox.querySelector('.lightbox-prev')?.click();
        } else if (e.key === 'ArrowRight') {
            lightbox.querySelector('.lightbox-next')?.click();
        }
    });
    
    console.log('✅ Lightbox готовий');
}

// ================================================
// 10. АДМІН ПАНЕЛЬ
// ================================================
const ADMIN_PASSWORD = 'admin2026';

function initAdmin() {
    const adminLoginBtn = document.getElementById('adminLoginBtn');
    const adminPassword = document.getElementById('adminPassword');
    const loginSection = document.getElementById('loginSection');
    const adminContent = document.getElementById('adminContent');
    
    if (adminLoginBtn && adminPassword) {
        adminLoginBtn.addEventListener('click', function() {
            if (adminPassword.value === ADMIN_PASSWORD) {
                loginSection.style.display = 'none';
                adminContent.style.display = 'block';
                console.log('✅ Адмін увійшов');
            } else {
                alert('❌ Невірний пароль!');
                adminPassword.value = '';
            }
        });
        
        adminPassword.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                adminLoginBtn.click();
            }
        });
    }
}

// ================================================
// ІНІЦІАЛІЗАЦІЯ
// ================================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Запуск Дубровиця v4.0...');
    
    // Основні функції (працюють на всіх сторінках)
    initTheme();
    initMobileNav();
    initScrollAnimations();
    initSmoothScroll();
    initHeaderScroll();
    initCounters();
    
    // Специфічні функції
    initBooksSearch();
    initMetricSearch();
    
    // Фотогалерея
    if (document.getElementById('photoGallery')) {
        initPhotoGallery();
    }
    
    // Адмін
    if (document.getElementById('adminLoginBtn')) {
        initAdmin();
    }
    
    console.log('✅ ВСЕ ПРАЦЮЄ ІДЕАЛЬНО! 🎉');
});

// Обробка помилок
window.addEventListener('error', function(e) {
    console.error('❌ Помилка:', e.message);
});

console.log('✅ Скрипт завантажено повністю');
