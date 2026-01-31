// ================================================
// ДУБРОВИЦЯ - GITHUB PAGES VERSION
// ✅ БЕЗ ЗОВНІШНІХ API
// ✅ ЛОКАЛЬНЕ ЗБЕРІГАННЯ
// ================================================

console.log('✅ Дубровиця GitHub Pages');

// ================================================
// ЛОКАЛЬНЕ ЗБЕРІГАННЯ ФОТО
// ================================================
function savePhotoLocally(photoData) {
    try {
        let savedPhotos = localStorage.getItem('dubrovytsia_photos');
        savedPhotos = savedPhotos ? JSON.parse(savedPhotos) : [];
        savedPhotos.push(photoData);
        localStorage.setItem('dubrovytsia_photos', JSON.stringify(savedPhotos));
        console.log('✅ Фото збережено');
        return { status: 'success' };
    } catch (error) {
        console.error('❌ Помилка:', error);
        return { status: 'error', message: error.message };
    }
}

function loadPhotosLocally() {
    try {
        let savedPhotos = localStorage.getItem('dubrovytsia_photos');
        savedPhotos = savedPhotos ? JSON.parse(savedPhotos) : [];
        console.log(`✅ Завантажено ${savedPhotos.length} фото`);
        return savedPhotos.length > 0 ? [...savedPhotos, ...DEMO_PHOTOS] : DEMO_PHOTOS;
    } catch (error) {
        console.error('❌ Помилка:', error);
        return DEMO_PHOTOS;
    }
}

function deletePhoto(index) {
    try {
        let savedPhotos = localStorage.getItem('dubrovytsia_photos');
        savedPhotos = savedPhotos ? JSON.parse(savedPhotos) : [];
        savedPhotos.splice(index, 1);
        localStorage.setItem('dubrovytsia_photos', JSON.stringify(savedPhotos));
        return { status: 'success' };
    } catch (error) {
        return { status: 'error', message: error.message };
    }
}

// ================================================
// ДЕМО-ДАНІ
// ================================================
const DEMO_PHOTOS = [
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
    {
        imageUrl: 'https://images.unsplash.com/photo-1590004953392-5aba2e72269a?w=800&q=80',
        title: 'Центральна вулиця Дубровиці',
        period: '1900-1939',
        category: 'streets',
        date: '1930'
    },
    {
        imageUrl: 'https://images.unsplash.com/photo-1583137890236-e5a1b4e3f0b3?w=800&q=80',
        title: 'Ринкова площа',
        period: '1945-1991',
        category: 'streets',
        date: '1960'
    }
];

const PERIOD_NAMES = {
    'before-1900': 'До 1900',
    '1900-1939': '1900-1939',
    '1939-1945': '1939-1945',
    '1945-1991': '1945-1991',
    'after-1991': 'Після 1991'
};

const CATEGORY_NAMES = {
    'churches': 'Церкви',
    'streets': 'Вулиці',
    'people': 'Люди',
    'architecture': 'Архітектура',
    'aerial': 'Аерофото',
    'drawings': 'Малюнки',
    'events': 'Події'
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
            }
        });
    }, { threshold: 0.1 });
    
    document.querySelectorAll('.fade-in-up, .card, .photo-card').forEach(el => {
        observer.observe(el);
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
    
    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 100) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });
}

function initCounters() {
    const counters = document.querySelectorAll('[data-count]');
    counters.forEach(counter => {
        const target = parseInt(counter.getAttribute('data-count'));
        let current = 0;
        const increment = target / 50;
        
        const updateCounter = () => {
            if (current < target) {
                current += increment;
                counter.textContent = Math.floor(current);
                requestAnimationFrame(updateCounter);
            } else {
                counter.textContent = target;
            }
        };
        
        const observer = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && current === 0) {
                updateCounter();
            }
        });
        observer.observe(counter);
    });
}

// ================================================
// ФОТОГАЛЕРЕЯ
// ================================================
let allPhotos = [];
let currentFilter = 'all';
let currentCategory = 'all';
let currentPhotoIndex = 0;

function initPhotoGallery() {
    console.log('🖼️ Ініціалізація галереї');
    allPhotos = loadPhotosLocally();
    displayPhotos();
    initGalleryFilters();
    initLightbox();
}

function displayPhotos() {
    const gallery = document.getElementById('photoGallery');
    if (!gallery) return;
    
    const filtered = allPhotos.filter(photo => {
        const matchesPeriod = currentFilter === 'all' || photo.period === currentFilter;
        const matchesCategory = currentCategory === 'all' || photo.category === currentCategory;
        return matchesPeriod && matchesCategory;
    });
    
    if (filtered.length === 0) {
        gallery.innerHTML = '<p style="grid-column: 1/-1; text-align: center; padding: 2rem;">Нічого не знайдено</p>';
        return;
    }
    
    gallery.innerHTML = filtered.map((photo, index) => `
        <div class="photo-card" onclick="openLightbox(${index}, ${JSON.stringify(filtered).replace(/"/g, '&quot;')})">
            <img src="${photo.imageUrl}" alt="${photo.title}" loading="lazy">
            <div class="photo-info">
                <h3>${photo.title}</h3>
                <p>${PERIOD_NAMES[photo.period]} • ${CATEGORY_NAMES[photo.category]}</p>
            </div>
        </div>
    `).join('');
}

function initGalleryFilters() {
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentFilter = this.getAttribute('data-filter');
            displayPhotos();
        });
    });
    
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentCategory = this.getAttribute('data-category');
            displayPhotos();
        });
    });
}

function openLightbox(index, photos) {
    const lightbox = document.getElementById('lightbox');
    if (!lightbox || !photos) return;
    
    currentPhotoIndex = index;
    const photo = photos[currentPhotoIndex];
    
    document.getElementById('lightboxImage').src = photo.imageUrl;
    document.getElementById('lightboxCaption').textContent = photo.title;
    document.getElementById('lightboxMeta').textContent = 
        `${PERIOD_NAMES[photo.period]} • ${CATEGORY_NAMES[photo.category]}`;
    
    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function initLightbox() {
    const lightbox = document.getElementById('lightbox');
    const closeBtn = lightbox?.querySelector('.lightbox-close');
    
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            lightbox.classList.remove('active');
            document.body.style.overflow = '';
        });
    }
    
    if (lightbox) {
        lightbox.addEventListener('click', e => {
            if (e.target === lightbox) {
                lightbox.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    }
    
    document.addEventListener('keydown', e => {
        if (lightbox?.classList.contains('active') && e.key === 'Escape') {
            lightbox.classList.remove('active');
            document.body.style.overflow = '';
        }
    });
}

// ================================================
// ПОШУК КНИГ
// ================================================
const BOOKS_DATA = [
    {
        title: 'Історія Дубровиці та околиць',
        author: 'Іван Петренко',
        year: '1995',
        description: 'Всебічне дослідження історії міста',
        category: 'history'
    },
    {
        title: 'Дубровицькі родини',
        author: 'Марія Коваленко',
        year: '2003',
        description: 'Генеалогічні нариси',
        category: 'genealogy'
    }
];

function initBooksSearch() {
    const searchInput = document.getElementById('booksSearch');
    if (!searchInput) return;
    
    function displayBooks() {
        const term = searchInput.value.toLowerCase();
        const filtered = BOOKS_DATA.filter(book => 
            book.title.toLowerCase().includes(term) ||
            book.author.toLowerCase().includes(term) ||
            book.description.toLowerCase().includes(term)
        );
        
        const grid = document.getElementById('booksGrid');
        if (!grid) return;
        
        if (filtered.length === 0) {
            grid.innerHTML = '<p style="text-align: center;">Нічого не знайдено</p>';
            return;
        }
        
        grid.innerHTML = filtered.map(book => `
            <div class="book-card">
                <div class="book-icon">📖</div>
                <h3>${book.title}</h3>
                <p class="book-author">${book.author}</p>
                <p class="book-year">Рік: ${book.year}</p>
                <p>${book.description}</p>
            </div>
        `).join('');
    }
    
    searchInput.addEventListener('input', displayBooks);
    displayBooks();
}

// ================================================
// МЕТРИЧНІ КНИГИ
// ================================================
const METRIC_BOOKS = [
    {
        type: 'birth',
        year: '1850-1870',
        parish: 'Парафія Святої Трійці',
        records: 1243
    },
    {
        type: 'marriage',
        year: '1850-1870',
        parish: 'Парафія Святої Трійці',
        records: 324
    }
];

function initMetricSearch() {
    const typeFilter = document.getElementById('typeFilter');
    const yearFilter = document.getElementById('yearFilter');
    if (!typeFilter || !yearFilter) return;
    
    function displayMetrics() {
        const type = typeFilter.value;
        const year = yearFilter.value;
        
        const filtered = METRIC_BOOKS.filter(book => {
            const matchesType = type === 'all' || book.type === type;
            const matchesYear = year === 'all' || book.year === year;
            return matchesType && matchesYear;
        });
        
        const grid = document.getElementById('metricsGrid');
        if (!grid) return;
        
        if (filtered.length === 0) {
            grid.innerHTML = '<p style="text-align: center;">Нічого не знайдено</p>';
            return;
        }
        
        const icons = { birth: '👶', marriage: '💍', death: '🕊️' };
        const names = { birth: 'Народження', marriage: 'Шлюби', death: 'Смерті' };
        
        grid.innerHTML = filtered.map(book => `
            <div class="metric-card">
                <div class="metric-icon">${icons[book.type]}</div>
                <h3>${names[book.type]}</h3>
                <p>${book.year}</p>
                <p>${book.parish}</p>
                <p>Записів: ${book.records}</p>
            </div>
        `).join('');
    }
    
    typeFilter.addEventListener('change', displayMetrics);
    yearFilter.addEventListener('change', displayMetrics);
    displayMetrics();
}

// ================================================
// АДМІН ПАНЕЛЬ
// ================================================
const ADMIN_PASSWORD = 'admin2026';

function initAdmin() {
    const loginBtn = document.getElementById('adminLoginBtn');
    const password = document.getElementById('adminPassword');
    const loginSection = document.getElementById('loginSection');
    const adminContent = document.getElementById('adminContent');
    
    if (loginBtn && password) {
        loginBtn.addEventListener('click', () => {
            if (password.value === ADMIN_PASSWORD) {
                loginSection.style.display = 'none';
                adminContent.style.display = 'block';
            } else {
                alert('❌ Невірний пароль!');
                password.value = '';
            }
        });
        
        password.addEventListener('keypress', e => {
            if (e.key === 'Enter') loginBtn.click();
        });
    }
    
    const uploadBtn = document.getElementById('uploadPhotoBtn');
    if (uploadBtn) {
        uploadBtn.addEventListener('click', () => {
            const url = document.getElementById('photoUrl')?.value;
            const title = document.getElementById('photoTitle')?.value;
            const period = document.getElementById('photoPeriod')?.value;
            const category = document.getElementById('photoCategory')?.value;
            
            if (!url || !title || !period || !category) {
                alert('❌ Заповніть всі поля!');
                return;
            }
            
            if (!url.startsWith('http')) {
                alert('❌ Невірний URL!');
                return;
            }
            
            const result = savePhotoLocally({
                imageUrl: url,
                title: title,
                period: period,
                category: category,
                date: new Date().getFullYear().toString()
            });
            
            if (result.status === 'success') {
                alert('✅ Фото додано!');
                document.getElementById('photoUrl').value = '';
                document.getElementById('photoTitle').value = '';
                document.getElementById('photoPeriod').value = '';
                document.getElementById('photoCategory').value = '';
                
                if (document.getElementById('photoGallery')) {
                    initPhotoGallery();
                }
            } else {
                alert('❌ Помилка: ' + result.message);
            }
        });
    }
    
    const showBtn = document.getElementById('showSavedPhotos');
    if (showBtn) {
        showBtn.addEventListener('click', () => {
            const saved = localStorage.getItem('dubrovytsia_photos');
            const photos = saved ? JSON.parse(saved) : [];
            
            if (photos.length === 0) {
                alert('📭 Немає збережених фото');
            } else {
                alert(`📸 Збережено: ${photos.length}\n\n${photos.map(p => p.title).join('\n')}`);
            }
        });
    }
    
    const clearBtn = document.getElementById('clearAllPhotos');
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            if (confirm('❌ Видалити всі фото?')) {
                localStorage.removeItem('dubrovytsia_photos');
                alert('✅ Видалено');
                if (document.getElementById('photoGallery')) {
                    initPhotoGallery();
                }
            }
        });
    }
}

// ================================================
// ІНІЦІАЛІЗАЦІЯ
// ================================================
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Запуск...');
    
    initTheme();
    initMobileNav();
    initScrollAnimations();
    initSmoothScroll();
    initHeaderScroll();
    initCounters();
    initBooksSearch();
    initMetricSearch();
    
    if (document.getElementById('photoGallery')) {
        initPhotoGallery();
    }
    
    if (document.getElementById('adminLoginBtn')) {
        initAdmin();
    }
    
    console.log('✅ Готово!');
});

window.addEventListener('error', e => console.error('❌', e.message));
