// ================================================
// ДУБРОВИЦЯ - ВИПРАВЛЕНА ВЕРСІЯ
// ✅ Фото для всіх через GitHub Pages
// ✅ Робоча навігація в lightbox
// ================================================

console.log('✅ Дубровиця v5.0 — з динамічним photos.json');

// ================================================
// ФОТО ЗБЕРІГАЮТЬСЯ В photos.json
// Додавайте через admin.html — без редагування коду!
// ================================================

let ALL_PHOTOS = [];

const PERIOD_NAMES = {
    'before-1900': 'До 1900',
    '1900-1939': '1900—1939',
    '1939-1945': '1939—1945',
    '1945-1991': '1945—1991',
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
    const counters = document.querySelectorAll('[data-target]');
    counters.forEach(counter => {
        const target = parseInt(counter.getAttribute('data-target'));
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
// ФОТОГАЛЕРЕЯ - ВИПРАВЛЕНА ВЕРСІЯ
// ================================================
let currentFilter = 'all';
let currentCategory = 'all';
let filteredPhotos = [];  // ✅ Зберігаємо відфільтровані фото глобально
let currentPhotoIndex = 0;

async function initPhotoGallery() {
    console.log('🖼️ Ініціалізація галереї — завантаження photos.json');
    
    const gallery = document.getElementById('photoGallery');
    if (gallery) {
        gallery.innerHTML = '<p style="grid-column:1/-1;text-align:center;padding:3rem;color:var(--color-text-secondary);">⏳ Завантаження фотографій...</p>';
    }
    
    try {
        const resp = await fetch('photos.json?v=' + Date.now());
        if (resp.ok) {
            ALL_PHOTOS = await resp.json();
            console.log(`📸 Завантажено ${ALL_PHOTOS.length} фото з photos.json`);
        } else {
            throw new Error('photos.json not found');
        }
    } catch(e) {
        console.warn('⚠️ Не вдалося завантажити photos.json:', e.message);
        if (gallery) {
            gallery.innerHTML = '<p style="grid-column:1/-1;text-align:center;padding:3rem;color:var(--color-text-secondary);">Фотоархів порожній. Додайте фото через <a href="admin.html">адмін-панель</a>.</p>';
        }
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
    
    // Фільтруємо фото
    filteredPhotos = ALL_PHOTOS.filter(photo => {
        const matchesPeriod = currentFilter === 'all' || photo.period === currentFilter;
        const matchesCategory = currentCategory === 'all' || photo.category === currentCategory;
        return matchesPeriod && matchesCategory;
    });
    
    console.log(`📊 Показано ${filteredPhotos.length} фото (з ${ALL_PHOTOS.length})`);
    
    if (filteredPhotos.length === 0) {
        gallery.innerHTML = '<p style="grid-column: 1/-1; text-align: center; padding: 2rem; color: var(--color-text-secondary);">Нічого не знайдено за обраними фільтрами</p>';
        return;
    }
    
    // ✅ ВИПРАВЛЕНО: Використовуємо onclick з індексом
    gallery.innerHTML = filteredPhotos.map((photo, index) => `
        <div class="photo-card" onclick="openLightbox(${index})">
            <img src="${photo.imageUrl}" alt="${photo.title}" loading="lazy">
            <div class="photo-overlay">
                <div class="photo-info">
                    <h3>${photo.title}</h3>
                    <p>${PERIOD_NAMES[photo.period]} · ${CATEGORY_NAMES[photo.category]}</p>
                </div>
            </div>
        </div>
    `).join('');
}

function initGalleryFilters() {
    // Фільтри періодів
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentFilter = this.dataset.filter;
            displayPhotos();
        });
    });
    
    // Фільтри категорій
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentCategory = this.dataset.category;
            displayPhotos();
        });
    });
}

// ✅ ВИПРАВЛЕНО: Функція відкриття lightbox
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
        lightboxMeta.textContent = `${PERIOD_NAMES[photo.period]} · ${CATEGORY_NAMES[photo.category]}${photo.date ? ` · ${photo.date}` : ''}`;
    }
    
    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    console.log(`🖼️ Відкрито фото ${index + 1}/${filteredPhotos.length}: ${photo.title}`);
}

// ✅ ВИПРАВЛЕНО: Навігація в lightbox
function navigateLightbox(direction) {
    if (filteredPhotos.length === 0) return;
    
    if (direction === 'next') {
        currentPhotoIndex = (currentPhotoIndex + 1) % filteredPhotos.length;
    } else {
        currentPhotoIndex = (currentPhotoIndex - 1 + filteredPhotos.length) % filteredPhotos.length;
    }
    
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
    
    // ✅ Кнопка закриття
    const closeBtn = lightbox.querySelector('.lightbox-close');
    if (closeBtn) {
        closeBtn.addEventListener('click', closeLightbox);
    }
    
    // ✅ Навігація вперед/назад
    const prevBtn = lightbox.querySelector('.lightbox-prev');
    const nextBtn = lightbox.querySelector('.lightbox-next');
    
    if (prevBtn) {
        prevBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            navigateLightbox('prev');
        });
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            navigateLightbox('next');
        });
    }
    
    // ✅ Закриття при кліку на фон
    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) {
            closeLightbox();
        }
    });
    
    // ✅ Клавіатурна навігація
    document.addEventListener('keydown', (e) => {
        if (!lightbox.classList.contains('active')) return;
        
        if (e.key === 'ArrowLeft') {
            navigateLightbox('prev');
        } else if (e.key === 'ArrowRight') {
            navigateLightbox('next');
        } else if (e.key === 'Escape') {
            closeLightbox();
        }
    });
    
    console.log('✅ Lightbox ініціалізовано з навігацією');
}

// ================================================
// ПОШУК КНИГ
// ================================================
const BOOKS_DATA = [
    {
        title: 'Історія Дубровиці та околиць',
        author: 'Іван Петренко',
        year: '1995',
        description: 'Всебічне дослідження історії міста від найдавніших часів до сучасності',
        category: 'history'
    },
    {
        title: 'Дубровицькі родини: генеалогічні нариси',
        author: 'Марія Коваленко',
        year: '2003',
        description: 'Дослідження родоводів найвідоміших дубровицьких сімей',
        category: 'genealogy'
    },
    {
        title: 'Церкви та храми Дубровиччини',
        author: 'Петро Савчук',
        year: '2010',
        description: 'Архітектурний огляд релігійних споруд регіону',
        category: 'architecture'
    },
    {
        title: 'Спогади старожилів',
        author: 'Збірка',
        year: '2015',
        description: 'Усні історії жителів Дубровиці про життя у XX столітті',
        category: 'memories'
    },
    {
        title: 'Дубровиця у старих фотографіях',
        author: 'Олександр Мельник',
        year: '2018',
        description: 'Альбом рідкісних історичних світлин міста',
        category: 'photo'
    }
];

function initBooksSearch() {
    const searchInput = document.getElementById('booksSearch');
    if (!searchInput) return;
    
    function displayBooks() {
        const term = searchInput.value.toLowerCase().trim();
        const filtered = BOOKS_DATA.filter(book => 
            book.title.toLowerCase().includes(term) ||
            book.author.toLowerCase().includes(term) ||
            book.description.toLowerCase().includes(term)
        );
        
        const grid = document.getElementById('booksGrid');
        if (!grid) return;
        
        if (filtered.length === 0) {
            grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; padding: 2rem; color: var(--color-text-secondary);">Нічого не знайдено</p>';
            return;
        }
        
        grid.innerHTML = filtered.map(book => `
            <div class="book-card fade-in-up">
                <div class="book-icon">📖</div>
                <h3>${book.title}</h3>
                <p class="book-author">Автор: ${book.author}</p>
                <p class="book-year">Рік видання: ${book.year}</p>
                <p class="book-description">${book.description}</p>
            </div>
        `).join('');
        
        // Реініціалізуємо анімації
        initScrollAnimations();
    }
    
    searchInput.addEventListener('input', displayBooks);
    displayBooks();
    console.log('✅ Пошук книг ініціалізовано');
}

// ================================================
// МЕТРИЧНІ КНИГИ
// ================================================
const METRIC_BOOKS = [
    {
        type: 'birth',
        year: '1850-1870',
        parish: 'Парафія Святої Трійці',
        records: 1243,
        details: 'Записи про народження'
    },
    {
        type: 'marriage',
        year: '1850-1870',
        parish: 'Парафія Святої Трійці',
        records: 324,
        details: 'Записи про шлюби'
    },
    {
        type: 'death',
        year: '1850-1870',
        parish: 'Парафія Святої Трійці',
        records: 876,
        details: 'Записи про смерті'
    },
    {
        type: 'birth',
        year: '1871-1900',
        parish: 'Костел Іоана Хрестителя',
        records: 2156,
        details: 'Записи про народження'
    },
    {
        type: 'marriage',
        year: '1871-1900',
        parish: 'Костел Іоана Хрестителя',
        records: 567,
        details: 'Записи про шлюби'
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
            grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; padding: 2rem; color: var(--color-text-secondary);">Нічого не знайдено</p>';
            return;
        }
        
        const icons = { birth: '👶', marriage: '💍', death: '🕊️' };
        const names = { birth: 'Народження', marriage: 'Шлюби', death: 'Смерті' };
        
        grid.innerHTML = filtered.map(book => `
            <div class="metric-card fade-in-up">
                <div class="metric-icon">${icons[book.type]}</div>
                <h3>${names[book.type]}</h3>
                <p class="metric-year">${book.year}</p>
                <p class="metric-parish">${book.parish}</p>
                <p class="metric-records">Кількість записів: ${book.records}</p>
                <p class="metric-details">${book.details}</p>
            </div>
        `).join('');
        
        initScrollAnimations();
    }
    
    typeFilter.addEventListener('change', displayMetrics);
    yearFilter.addEventListener('change', displayMetrics);
    displayMetrics();
    console.log('✅ Пошук метричних книг ініціалізовано');
}

// ================================================
// АДМІН ПАНЕЛЬ (тільки для вас)
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
                console.log('✅ Вхід в адмін-панель');
            } else {
                alert('❌ Невірний пароль!');
                password.value = '';
            }
        });
        
        password.addEventListener('keypress', e => {
            if (e.key === 'Enter') loginBtn.click();
        });
    }
    
    // Кнопка "Показати код для додавання"
    const generateBtn = document.getElementById('generateCode');
    if (generateBtn) {
        generateBtn.addEventListener('click', () => {
            const url = document.getElementById('photoUrl')?.value;
            const title = document.getElementById('photoTitle')?.value;
            const period = document.getElementById('photoPeriod')?.value;
            const category = document.getElementById('photoCategory')?.value;
            const date = document.getElementById('photoDate')?.value || new Date().getFullYear().toString();
            
            if (!url || !title || !period || !category) {
                alert('❌ Заповніть всі обов\'язкові поля!');
                return;
            }
            
            if (!url.startsWith('http')) {
                alert('❌ URL має починатися з http:// або https://');
                return;
            }
            
            // Генеруємо код для додавання
            const code = `    {
        imageUrl: '${url}',
        title: '${title}',
        period: '${period}',
        category: '${category}',
        date: '${date}'
    },`;
            
            // Показуємо код
            const codeDisplay = document.getElementById('codeDisplay');
            if (codeDisplay) {
                codeDisplay.textContent = code;
                codeDisplay.style.display = 'block';
            }
            
            alert(`✅ Код згенеровано!\n\nТепер:\n1. Скопіюйте код нижче\n2. Відкрийте script.js на GitHub\n3. Знайдіть масив ALL_PHOTOS\n4. Вставте код перед коментарем "=== ДОДАЙТЕ СВОЇ ФОТО ТУТ ==="\n5. Збережіть файл\n6. Через 2-5 хвилин фото з'явиться для всіх!`);
        });
    }
    
    // Кнопка копіювання коду
    const copyBtn = document.getElementById('copyCode');
    if (copyBtn) {
        copyBtn.addEventListener('click', () => {
            const codeDisplay = document.getElementById('codeDisplay');
            if (codeDisplay && codeDisplay.textContent) {
                navigator.clipboard.writeText(codeDisplay.textContent).then(() => {
                    alert('✅ Код скопійовано!');
                });
            }
        });
    }
}

// ================================================
// ІНІЦІАЛІЗАЦІЯ
// ================================================
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Запуск Дубровиця...');
    
    // Базові функції
    initTheme();
    initMobileNav();
    initScrollAnimations();
    initSmoothScroll();
    initHeaderScroll();
    initCounters();
    
    // Контент-специфічні функції
    if (document.getElementById('photoGallery')) {
        initPhotoGallery(); // async - no need to await at top level
    }
    
    if (document.getElementById('booksSearch')) {
        initBooksSearch();
    }
    
    if (document.getElementById('typeFilter')) {
        initMetricSearch();
    }
    
    if (document.getElementById('adminLoginBtn')) {
        initAdmin();
    }
    
    console.log('✅ Сайт готовий!');
});

// Обробка помилок
window.addEventListener('error', e => {
    console.error('❌ Помилка:', e.message);
});

console.log('📋 Підказка: Всі фото зберігаються в масиві ALL_PHOTOS на початку файлу');
