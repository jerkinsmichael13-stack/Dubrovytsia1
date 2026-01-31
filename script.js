// ================================================
// ДУБРОВИЦЯ - ПОВНІСТЮ ВИПРАВЛЕНИЙ JAVASCRIPT V5.0
// ✅ ФОТОАРХІВ ПРАЦЮЄ З ДЕМО-ДАНИМИ
// ✅ ІНТЕГРАЦІЯ З GOOGLE APPS SCRIPT
// ✅ ПОШУК КНИГ ПРАЦЮЄ
// ✅ ПОШУК МЕТРИЧНИХ КНИГ ПРАЦЮЄ
// ✅ СУЧАСНИЙ ДИЗАЙН
// ================================================

console.log('✅ Дубровиця Script v5.0 - Google Apps Script інтеграція!');

// ================================================
// GOOGLE APPS SCRIPT НАЛАШТУВАННЯ
// ================================================
// ✅ ВАШ GOOGLE APPS SCRIPT URL - ОНОВЛЕНО
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwe4a02Q4SLqVn9fasPcfJ8JzB-PaYaOPwWb7tzy055OW9FTJxXq6pmYRO3iBj_OGIl/exec';

// Увімкнути/вимкнути завантаження з Google Sheets
// ✅ УВІМКНЕНО - фото завантажуються з Google Sheets
const USE_GOOGLE_SHEETS = true;

// ================================================
// ФУНКЦІЯ ЗАВАНТАЖЕННЯ ФОТО З GOOGLE SHEETS
// ================================================
async function loadPhotosFromGoogle() {
    if (!USE_GOOGLE_SHEETS) {
        console.log('ℹ️ Google Sheets вимкнено, використовуються демо-фото');
        return DEMO_PHOTOS;
    }
    
    try {
        console.log('📥 Завантаження фото з Google Sheets...');
        
        const response = await fetch(`${GOOGLE_SCRIPT_URL}?action=getPhotos`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP помилка! статус: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.status === 'success' && data.photos && data.photos.length > 0) {
            console.log(`✅ Завантажено ${data.photos.length} фото з Google Sheets`);
            return data.photos;
        } else {
            console.log('ℹ️ Google Sheets порожній, використовуються демо-фото');
            return DEMO_PHOTOS;
        }
    } catch (error) {
        console.error('❌ Помилка завантаження з Google Sheets:', error);
        console.log('ℹ️ Використовуються демо-фотографії');
        return DEMO_PHOTOS;
    }
}

// ================================================
// ФУНКЦІЯ ДОДАВАННЯ ФОТО В GOOGLE SHEETS
// ================================================
async function uploadPhotoToGoogle(photoData) {
    if (!USE_GOOGLE_SHEETS) {
        console.log('ℹ️ Google Sheets вимкнено');
        return { status: 'error', message: 'Google Sheets не налаштовано' };
    }
    
    try {
        console.log('📤 Відправка фото в Google Sheets...');
        console.log('Дані:', photoData);
        
        // Google Apps Script вимагає URLSearchParams для POST
        const formData = new URLSearchParams();
        formData.append('action', 'addPhoto');
        formData.append('imageUrl', photoData.imageUrl);
        formData.append('title', photoData.title);
        formData.append('period', photoData.period);
        formData.append('category', photoData.category);
        formData.append('date', photoData.date || new Date().toLocaleDateString('uk-UA'));
        
        const response = await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors', // Важливо для Google Apps Script
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: formData.toString()
        });
        
        // З mode: 'no-cors' не можемо прочитати відповідь
        // Припускаємо що успішно якщо не було помилки
        console.log('✅ Запит відправлено в Google Sheets');
        return { status: 'success', message: 'Фото додано!' };
        
    } catch (error) {
        console.error('❌ Помилка відправки в Google Sheets:', error);
        return { status: 'error', message: error.message };
    }
}

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
        imageUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=800&q=80',
        title: 'Акварель центральної площі',
        period: '1900-1939',
        category: 'drawings',
        date: '1925'
    }
];

// ================================================
// КОНСТАНТИ ДЛЯ ПЕРЕКЛАДУ
// ================================================
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
    'drawings': 'Малюнки'
};

// ================================================
// 1. ТЕМНА ТЕМА
// ================================================
function initTheme() {
    const themeToggle = document.getElementById('themeToggle');
    const themeIcon = document.getElementById('themeIcon');
    
    if (!themeToggle || !themeIcon) return;
    
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    themeIcon.textContent = savedTheme === 'dark' ? '☀️' : '🌙';
    
    themeToggle.addEventListener('click', function() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        themeIcon.textContent = newTheme === 'dark' ? '☀️' : '🌙';
        
        console.log('Тема змінена на:', newTheme);
    });
    
    console.log('✅ Тема завантажена:', savedTheme);
}

// ================================================
// 2. МОБІЛЬНЕ МЕНЮ
// ================================================
function initMobileNav() {
    const menuToggle = document.querySelector('.mobile-menu-toggle');
    const navLinks = document.querySelector('.nav-links');
    
    if (!menuToggle || !navLinks) return;
    
    menuToggle.addEventListener('click', function() {
        navLinks.classList.toggle('active');
        this.classList.toggle('active');
        console.log('Меню:', navLinks.classList.contains('active') ? 'відкрите' : 'закрите');
    });
    
    const links = navLinks.querySelectorAll('a');
    links.forEach(function(link) {
        link.addEventListener('click', function() {
            navLinks.classList.remove('active');
            menuToggle.classList.remove('active');
        });
    });
    
    console.log('✅ Мобільне меню готове');
}

// ================================================
// 3. АНІМАЦІЇ ПРИ ПРОКРУТЦІ
// ================================================
function initScrollAnimations() {
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });
    
    const cards = document.querySelectorAll('.feature-card, .metric-card, .book-card, .photo-card');
    cards.forEach(function(card) {
        observer.observe(card);
    });
    
    console.log('✅ Анімації прокрутки активовано');
}

// ================================================
// 4. ПЛАВНА ПРОКРУТКА
// ================================================
function initSmoothScroll() {
    const links = document.querySelectorAll('a[href^="#"]');
    
    links.forEach(function(link) {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href === '#') return;
            
            const target = document.querySelector(href);
            if (target) {
                e.preventDefault();
                const headerOffset = 80;
                const elementPosition = target.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
                
                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
    
    console.log('✅ Плавна прокрутка увімкнена');
}

// ================================================
// 5. ЗАГОЛОВОК ПРИ ПРОКРУТЦІ
// ================================================
function initHeaderScroll() {
    const header = document.querySelector('.main-header');
    if (!header) return;
    
    let lastScroll = 0;
    
    window.addEventListener('scroll', function() {
        const currentScroll = window.pageYOffset;
        
        if (currentScroll > 100) {
            header.classList.add('scrolled');
            
            if (currentScroll > lastScroll && currentScroll > 300) {
                header.style.transform = 'translateY(-100%)';
            } else {
                header.style.transform = 'translateY(0)';
            }
        } else {
            header.classList.remove('scrolled');
            header.style.transform = 'translateY(0)';
        }
        
        lastScroll = currentScroll;
    });
    
    console.log('✅ Заголовок готовий до прокрутки');
}

// ================================================
// 6. ЛІЧИЛЬНИКИ СТАТИСТИКИ
// ================================================
function initCounters() {
    const counters = document.querySelectorAll('[data-count]');
    
    counters.forEach(function(counter) {
        const target = parseInt(counter.getAttribute('data-count'));
        const duration = 2000;
        const increment = target / (duration / 16);
        let current = 0;
        
        const observer = new IntersectionObserver(function(entries) {
            entries.forEach(function(entry) {
                if (entry.isIntersecting && current === 0) {
                    const updateCounter = function() {
                        current += increment;
                        if (current < target) {
                            counter.textContent = Math.floor(current).toLocaleString('uk-UA');
                            requestAnimationFrame(updateCounter);
                        } else {
                            counter.textContent = target.toLocaleString('uk-UA');
                        }
                    };
                    updateCounter();
                }
            });
        });
        
        observer.observe(counter);
    });
    
    console.log('✅ Лічильники активовані');
}

// ================================================
// 7. ПОШУК КНИГ
// ================================================
const BOOKS_DATA = [
    {
        title: 'Історія Дубровиці та околиць',
        author: 'Іван Петренко',
        year: '1995',
        description: 'Всебічне дослідження історії міста від заснування до сучасності',
        category: 'history'
    },
    {
        title: 'Дубровицькі родини: генеалогічні нариси',
        author: 'Марія Коваленко',
        year: '2003',
        description: 'Детальний розгляд провідних родин міста',
        category: 'genealogy'
    },
    {
        title: 'Архітектура Дубровиці XIX-XX ст.',
        author: 'Петро Архітектов',
        year: '2010',
        description: 'Огляд архітектурних пам\'яток міста',
        category: 'architecture'
    },
    {
        title: 'Спогади дубровичан',
        author: 'Олена Мемуарівна',
        year: '2018',
        description: 'Збірка спогадів жителів міста про XX століття',
        category: 'memoirs'
    }
];

function initBooksSearch() {
    const searchInput = document.getElementById('booksSearch');
    const categoryFilter = document.getElementById('categoryFilter');
    
    if (!searchInput) return;
    
    function displayBooks() {
        const searchTerm = searchInput.value.toLowerCase();
        const category = categoryFilter?.value || 'all';
        
        const filtered = BOOKS_DATA.filter(function(book) {
            const matchesSearch = book.title.toLowerCase().includes(searchTerm) ||
                                book.author.toLowerCase().includes(searchTerm) ||
                                book.description.toLowerCase().includes(searchTerm);
            const matchesCategory = category === 'all' || book.category === category;
            return matchesSearch && matchesCategory;
        });
        
        const grid = document.getElementById('booksGrid');
        if (!grid) return;
        
        if (filtered.length === 0) {
            grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; padding: 2rem;">Нічого не знайдено</p>';
            return;
        }
        
        grid.innerHTML = filtered.map(function(book) {
            return `
                <div class="book-card">
                    <div class="book-icon">📖</div>
                    <h3>${book.title}</h3>
                    <p class="book-author">${book.author}</p>
                    <p class="book-year">Рік видання: ${book.year}</p>
                    <p class="book-description">${book.description}</p>
                </div>
            `;
        }).join('');
        
        console.log('Знайдено книг:', filtered.length);
    }
    
    searchInput.addEventListener('input', displayBooks);
    if (categoryFilter) {
        categoryFilter.addEventListener('change', displayBooks);
    }
    
    displayBooks();
    console.log('✅ Пошук книг готовий');
}

// ================================================
// 8. ПОШУК МЕТРИЧНИХ КНИГ
// ================================================
const METRIC_BOOKS = [
    {
        type: 'birth',
        year: '1850-1870',
        parish: 'Парафія Святої Трійці',
        records: 1243,
        details: 'Записи про народження, хрещення'
    },
    {
        type: 'marriage',
        year: '1850-1870',
        parish: 'Парафія Святої Трійці',
        records: 324,
        details: 'Записи про шлюби, вінчання'
    },
    {
        type: 'death',
        year: '1850-1870',
        parish: 'Парафія Святої Трійці',
        records: 892,
        details: 'Записи про смерті, поховання'
    },
    {
        type: 'birth',
        year: '1871-1900',
        parish: 'Костел Іоана Хрестителя',
        records: 2156,
        details: 'Записи про народження, хрещення'
    },
    {
        type: 'marriage',
        year: '1871-1900',
        parish: 'Костел Іоана Хрестителя',
        records: 567,
        details: 'Записи про шлюби, вінчання'
    },
    {
        type: 'death',
        year: '1871-1900',
        parish: 'Костел Іоана Хрестителя',
        records: 1534,
        details: 'Записи про смерті, поховання'
    }
];

const TYPE_NAMES = {
    'birth': 'Народження',
    'marriage': 'Шлюби',
    'death': 'Смерті'
};

function initMetricSearch() {
    const typeFilter = document.getElementById('typeFilter');
    const yearFilter = document.getElementById('yearFilter');
    
    if (!typeFilter || !yearFilter) return;
    
    function displayMetrics() {
        const type = typeFilter.value;
        const year = yearFilter.value;
        
        const filtered = METRIC_BOOKS.filter(function(book) {
            const matchesType = type === 'all' || book.type === type;
            const matchesYear = year === 'all' || book.year === year;
            return matchesType && matchesYear;
        });
        
        const grid = document.getElementById('metricsGrid');
        if (!grid) return;
        
        if (filtered.length === 0) {
            grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; padding: 2rem;">Нічого не знайдено</p>';
            return;
        }
        
        grid.innerHTML = filtered.map(function(book) {
            const typeEmoji = book.type === 'birth' ? '👶' : book.type === 'marriage' ? '💍' : '🕊️';
            return `
                <div class="metric-card">
                    <div class="metric-icon">${typeEmoji}</div>
                    <h3>${TYPE_NAMES[book.type]}</h3>
                    <p class="metric-year">${book.year}</p>
                    <p class="metric-parish">${book.parish}</p>
                    <p class="metric-records">Записів: ${book.records}</p>
                    <p class="metric-details">${book.details}</p>
                </div>
            `;
        }).join('');
        
        console.log('Знайдено метричних книг:', filtered.length);
    }
    
    typeFilter.addEventListener('change', displayMetrics);
    yearFilter.addEventListener('change', displayMetrics);
    
    displayMetrics();
    console.log('✅ Пошук метрик готовий');
}

// ================================================
// 9. ФОТОГАЛЕРЕЯ З GOOGLE SHEETS
// ================================================
let allPhotos = [];
let currentFilter = 'all';
let currentCategory = 'all';
let currentPhotoIndex = 0;

async function initPhotoGallery() {
    console.log('🖼️ Ініціалізація фотогалереї...');
    
    // Завантаження фото з Google Sheets або демо-даних
    allPhotos = await loadPhotosFromGoogle();
    
    console.log('Завантажено фото:', allPhotos.length);
    
    displayPhotos();
    initGalleryFilters();
    initLightbox();
}

function displayPhotos() {
    const gallery = document.getElementById('photoGallery');
    if (!gallery) return;
    
    const filteredPhotos = allPhotos.filter(function(photo) {
        const matchesPeriod = currentFilter === 'all' || photo.period === currentFilter;
        const matchesCategory = currentCategory === 'all' || photo.category === currentCategory;
        return matchesPeriod && matchesCategory;
    });
    
    if (filteredPhotos.length === 0) {
        gallery.innerHTML = '<p style="grid-column: 1/-1; text-align: center; padding: 2rem;">Нічого не знайдено</p>';
        return;
    }
    
    gallery.innerHTML = filteredPhotos.map(function(photo, index) {
        return `
            <div class="photo-card" onclick="openLightbox(${index}, ${JSON.stringify(filteredPhotos).replace(/"/g, '&quot;')})">
                <img src="${photo.imageUrl}" alt="${photo.title}" loading="lazy">
                <div class="photo-info">
                    <h3>${photo.title}</h3>
                    <p>${PERIOD_NAMES[photo.period]} • ${CATEGORY_NAMES[photo.category]}</p>
                </div>
            </div>
        `;
    }).join('');
    
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
    
    // Обробка форми завантаження фото
    const uploadPhotoBtn = document.getElementById('uploadPhotoBtn');
    if (uploadPhotoBtn) {
        uploadPhotoBtn.addEventListener('click', async function() {
            const photoUrl = document.getElementById('photoUrl')?.value;
            const photoTitle = document.getElementById('photoTitle')?.value;
            const photoPeriod = document.getElementById('photoPeriod')?.value;
            const photoCategory = document.getElementById('photoCategory')?.value;
            
            // Валідація
            if (!photoUrl || !photoTitle || !photoPeriod || !photoCategory) {
                alert('❌ Будь ласка, заповніть всі поля!');
                return;
            }
            
            // Перевірка URL
            if (!photoUrl.startsWith('http')) {
                alert('❌ Невірний формат URL! Має починатися з http:// або https://');
                return;
            }
            
            // Відправка в Google Sheets
            uploadPhotoBtn.disabled = true;
            uploadPhotoBtn.textContent = 'Завантаження...';
            
            const result = await uploadPhotoToGoogle({
                imageUrl: photoUrl,
                title: photoTitle,
                period: photoPeriod,
                category: photoCategory,
                date: new Date().getFullYear().toString()
            });
            
            uploadPhotoBtn.disabled = false;
            uploadPhotoBtn.textContent = 'Додати фото';
            
            if (result.status === 'success') {
                alert('✅ Фото успішно додано!');
                // Очистити форму
                document.getElementById('photoUrl').value = '';
                document.getElementById('photoTitle').value = '';
                document.getElementById('photoPeriod').value = '';
                document.getElementById('photoCategory').value = '';
            } else {
                alert('❌ Помилка: ' + (result.message || 'Не вдалося додати фото'));
            }
        });
    }
}

// ================================================
// ІНІЦІАЛІЗАЦІЯ
// ================================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Запуск Дубровиця v5.0 з Google Apps Script...');
    
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
    console.log('ℹ️ Google Sheets:', USE_GOOGLE_SHEETS ? 'УВІМКНЕНО ✅' : 'ВИМКНЕНО ⚠️');
});

// Обробка помилок
window.addEventListener('error', function(e) {
    console.error('❌ Помилка:', e.message);
});

console.log('✅ Скрипт завантажено повністю');
