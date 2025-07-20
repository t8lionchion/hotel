// 漢堡選單功能腳本
// 本腳本適用於所有頁面，請確保每頁皆有引入

// 日期輸入框初始化（iOS相容性）
function initDateInputs() {
    const checkinDate = document.getElementById('checkin-date');
    const checkoutDate = document.getElementById('checkout-date');
    
    if (checkinDate && checkoutDate) {
        // 設置今天為最小日期
        const today = new Date().toISOString().split('T')[0];
        checkinDate.min = today;
        checkoutDate.min = today;
        
        // 設置預設值（今天和明天）
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = tomorrow.toISOString().split('T')[0];
        
        checkinDate.value = today;
        checkoutDate.value = tomorrowStr;
        
        // 入住日期變更時，更新退房日期的最小值
        checkinDate.addEventListener('change', function() {
            if (this.value) {
                const selectedDate = new Date(this.value);
                const nextDay = new Date(selectedDate);
                nextDay.setDate(selectedDate.getDate() + 1);
                const nextDayStr = nextDay.toISOString().split('T')[0];
                
                checkoutDate.min = nextDayStr;
                if (checkoutDate.value && checkoutDate.value <= this.value) {
                    checkoutDate.value = nextDayStr;
                }
            }
        });
        
        // iOS 特定處理
        if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
            // 確保在iOS上能正常觸發日期選擇器
            checkinDate.addEventListener('focus', function() {
                this.click();
            });
            checkoutDate.addEventListener('focus', function() {
                this.click();
            });
        }
    }
}

// 初始化大人小孩選擇框
function initGuestSelectors() {
    const adultsSelect = document.getElementById('adults');
    const childrenSelect = document.getElementById('children');
    
    if (adultsSelect && childrenSelect) {
        // 為手機版添加更清楚的選項文字
        if (window.innerWidth <= 900) {
            // 更新大人選項文字
            Array.from(adultsSelect.options).forEach(option => {
                const value = option.value;
                option.textContent = `${value}位成人`;
            });
            
            // 更新小孩選項文字
            Array.from(childrenSelect.options).forEach(option => {
                const value = option.value;
                if (value === '0') {
                    option.textContent = '0位小孩';
                } else {
                    option.textContent = `${value}位小孩`;
                }
            });
        }
        
        // 添加選擇變更事件
        adultsSelect.addEventListener('change', function() {
        });
        
        childrenSelect.addEventListener('change', function() {
        });
    }
}

// 頁面載入完成後初始化日期輸入框
document.addEventListener('DOMContentLoaded', function() {
    initHomepageParallax(); // 初始化首页视差效果
    initDateInputs();
    initLoginTabs(); // 初始化登入頁面標籤頁
    initGuestSelectors(); // 初始化大人小孩選擇框
    initFilterTabs(); // 初始化過濾標籤功能
    initSearchFunction(); // 初始化搜尋功能
    
    // 初始化輪播（僅在首頁）
    if (window.location.pathname.includes('index.html') || window.location.pathname.endsWith('/')) {
        setTimeout(() => {
            initCarousel();
        }, 100);
    }

    // ===== Masonry 瀑布流圖片動畫區塊 Intersection Observer =====
    const masonryCards = document.querySelectorAll('.masonry-card');
    if (masonryCards.length > 0 && 'IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.15 });
        masonryCards.forEach(card => observer.observe(card));
    } else if (masonryCards.length > 0) {
        // Fallback: 直接顯示
        masonryCards.forEach(card => card.classList.add('visible'));
    }
    
    // 初始化Masonry视差效果
    updateMasonryParallax();

    // 初始化緩慢顯示效果（僅在首頁）
    if (window.location.pathname.includes('index.html') || window.location.pathname.endsWith('/')) {
        initSlowReveal();
    }
});

// 登入頁面標籤頁切換功能
function initLoginTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    if (tabBtns.length === 0) return; // 如果不在登入頁面，直接返回
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetTab = this.getAttribute('data-tab');
            
            // 移除所有活動狀態
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // 添加活動狀態到當前選中的標籤頁
            this.classList.add('active');
            const targetContent = document.getElementById(targetTab);
            if (targetContent) {
                targetContent.classList.add('active');
            }
        });
    });
}

// 過濾標籤功能
function initFilterTabs() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    const bookingCards = document.querySelectorAll('.booking-card');
    
    if (filterBtns.length === 0) return; // 如果不在預訂頁面，直接返回
    
    filterBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const filter = this.getAttribute('data-filter');
            
            // 移除所有按鈕的活動狀態
            filterBtns.forEach(b => b.classList.remove('active'));
            
            // 添加活動狀態到當前選中的按鈕
            this.classList.add('active');
            
            // 過濾預訂卡片
            bookingCards.forEach(card => {
                const category = card.getAttribute('data-category');
                
                if (filter === 'all' || 
                    (filter === 'current' && (category === 'current' || category === 'upcoming')) ||
                    category === filter) {
                    card.style.display = 'block';
                    // 添加淡入動畫
                    card.style.opacity = '0';
                    card.style.transform = 'translateY(20px)';
                    setTimeout(() => {
                        card.style.transition = 'all 0.3s ease';
                        card.style.opacity = '1';
                        card.style.transform = 'translateY(0)';
                    }, 50);
                } else {
                    card.style.display = 'none';
                }
            });
        });
    });
}

// 取得漢堡按鈕、行動選單、關閉按鈕、頁面遮罩
const hamburgerBtn = document.getElementById('hamburger-btn');
const mobileNav = document.getElementById('mobile-nav');
const closeNavBtn = document.getElementById('close-nav-btn');
const overlay = document.querySelector('.overlay');

// 開啟行動選單
function openMobileNav() {
    if (mobileNav) mobileNav.classList.add('is-open');
    if (overlay) overlay.classList.add('is-open');
    document.body.style.overflow = 'hidden'; // 禁止背景滾動
}

// 關閉行動選單
function closeMobileNav() {
    if (mobileNav) mobileNav.classList.remove('is-open');
    if (overlay) overlay.classList.remove('is-open');
    document.body.style.overflow = '';
}

// 點擊漢堡按鈕開啟選單
if (hamburgerBtn) {
    hamburgerBtn.addEventListener('click', openMobileNav);
}

// 點擊關閉按鈕關閉選單
if (closeNavBtn) {
    closeNavBtn.addEventListener('click', closeMobileNav);
}

// 按下ESC鍵也可關閉選單
window.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeMobileNav();
        closeSearchModal();
    }
});

// 點擊任意位置關閉選單和搜尋視窗
document.addEventListener('click', function(e) {
    // 如果點擊的不是漢堡按鈕、搜尋按鈕、選單內容或搜尋視窗內容
    if (!hamburgerBtn?.contains(e.target) && 
        !searchBtn?.contains(e.target) && 
        !mobileNav?.contains(e.target) && 
        !searchModal?.contains(e.target)) {
        closeMobileNav();
        closeSearchModal();
    }
});

// 搜尋功能
// 取得搜尋相關元素（全域變數）
const searchBtn = document.querySelector('.search-button');
const searchModal = document.getElementById('search-modal');
const closeSearchBtn = document.getElementById('close-search-btn');
const searchInput = document.getElementById('search-input');
const searchSubmitBtn = document.getElementById('search-submit-btn');
const searchResults = document.getElementById('search-results');
const searchSuggestions = document.getElementById('search-suggestions');
const suggestionTags = document.querySelectorAll('.suggestion-tag');

// 房型資料庫
const roomData = [
    {
        id: 'room1',
        title: '濱海豪華客房',
        description: '享受寬敞的私人露台，俯瞰壯麗的濱海景致',
        keywords: ['濱海', '豪華', '客房', '海景', '現代'],
        image: 'room/room1.webp',
        url: 'order.html?room=room1'
    },
    {
        id: 'room2',
        title: '濱海步道豪華客房',
        description: '充滿自然光的現代空間，擁有壯觀的私人濱海步道景觀',
        keywords: ['濱海', '步道', '豪華', '客房', '海景'],
        image: 'room/room2.webp',
        url: 'order.html?room=room2'
    },
    {
        id: 'room3',
        title: '濱海露台客房',
        description: '金色色調與柔和設計，享受壯麗的濱海全景',
        keywords: ['濱海', '露台', '客房', '海景', '戶外'],
        image: 'room/room3.webp',
        url: 'order.html?room=room3'
    },
    {
        id: 'room4',
        title: '海景豪華客房',
        description: '開放式浴室設計，享受杜拜地標性海景',
        keywords: ['海景', '豪華', '客房', '現代', '舒適'],
        image: 'room/room4.webp',
        url: 'order.html?room=room4'
    },
    {
        id: 'room5',
        title: '海景露台客房',
        description: '專屬露台，欣賞杜拜地標性海景日落',
        keywords: ['海景', '露台', '客房', '戶外', '休閒'],
        image: 'room/room5.webp',
        url: 'order.html?room=room5'
    },
    {
        id: 'room6',
        title: '海景家庭房',
        description: '為家庭設計，享有壯觀海景與額外舒適設施',
        keywords: ['海景', '家庭', '房', '舒適', '設施'],
        image: 'room/room6.webp',
        url: 'order.html?room=room6'
    },
    {
        id: 'room7',
        title: '濱海豪華套房',
        description: '寬敞的獨立客廳與露台，俯瞰壯麗濱海景致',
        keywords: ['濱海', '豪華', '套房', '海景', '寬敞'],
        image: 'room/room7.webp',
        url: 'order.html?room=room7'
    },
    {
        id: 'room8',
        title: '濱海步道豪華套房',
        description: '享受陽光與壯觀步道景觀的寬敞套房',
        keywords: ['濱海', '步道', '豪華', '套房', '海景'],
        image: 'room/room8.webp',
        url: 'order.html?room=room8'
    },
    {
        id: 'room9',
        title: '濱海露台套房',
        description: '適合家庭入住，享有壯觀濱海露台景觀',
        keywords: ['濱海', '露台', '套房', '海景', '專屬'],
        image: 'room/room9.webp',
        url: 'order.html?room=room9'
    },
    {
        id: 'room10',
        title: '海景豪華套房',
        description: '寬敞的獨立客廳與壯觀海景露台',
        keywords: ['海景', '豪華', '套房', '寬敞', '視野'],
        image: 'room/room10.webp',
        url: 'order.html?room=room10'
    },
    {
        id: 'room11',
        title: '海景全景客房',
        description: '全景露台，俯瞰杜拜閃耀海岸線',
        keywords: ['海景', '全景', '客房', '視野', '體驗'],
        image: 'room/room11.webp',
        url: 'order.html?room=room11'
    },
    {
        id: 'room12',
        title: '海景露台套房',
        description: '寬敞套房，享受室內外生活與壯觀海景',
        keywords: ['海景', '露台', '套房', '專屬', '地標'],
        image: 'room/room12.webp',
        url: 'order.html?room=room12'
    },
    {
        id: 'room13',
        title: '海景尊貴露台套房',
        description: '尊貴套房，享有阿拉伯灣與私人濱海景觀',
        keywords: ['海景', '尊貴', '露台', '套房', '豪華'],
        image: 'room/room13.webp',
        url: 'order.html?room=room13'
    },
    {
        id: 'room14',
        title: '珍珠套房',
        description: '兩臥室尊貴套房，適合高端活動與聚會',
        keywords: ['珍珠', '套房', '奢華', '珍貴', '極致'],
        image: 'room/room14.webp',
        url: 'order.html?room=room14'
    },
    {
        id: 'room15',
        title: '總統套房',
        description: '兩臥室宮殿級套房，配備私人泳池與專屬管家',
        keywords: ['總統', '套房', '奢華', '地標', '全景'],
        image: 'room/room15.webp',
        url: 'order.html?room=room15'
    },
    {
        id: 'room16',
        title: '皇家套房',
        description: '一臥室尊榮套房，享有壯觀全景與私人泳池',
        keywords: ['皇家', '套房', '奢華', '級別', '體驗'],
        image: 'room/room16.webp',
        url: 'order.html?room=room16'
    },
    {
        id: 'room17',
        title: '兩臥室濱海家庭房',
        description: '兩間濱海客房連通，適合全家舒適入住',
        keywords: ['兩臥室', '濱海', '家庭', '房', '寬敞'],
        image: 'room/room17.webp',
        url: 'order.html?room=room17'
    },
    {
        id: 'room18',
        title: '兩臥室海景家庭房',
        description: '兩間海景客房連通，享受壯觀海景與寬敞空間',
        keywords: ['兩臥室', '海景', '家庭', '房', '寬敞'],
        image: 'room/room18.webp',
        url: 'order.html?room=room18'
    },
    {
        id: 'room19',
        title: '兩臥室濱海家庭套房',
        description: '濱海豪華套房與客房連通，適合家庭或團體',
        keywords: ['兩臥室', '濱海', '家庭', '套房', '寬敞'],
        image: 'room/room19.webp',
        url: 'order.html?room=room19'
    },
    {
        id: 'room20',
        title: '兩臥室海景家庭套房',
        description: '兩臥室套房，享有壯觀海景與寬敞露台',
        keywords: ['兩臥室', '海景', '家庭', '套房', '寬敞'],
        image: 'room/room20.webp',
        url: 'order.html?room=room20'
    },
    {
        id: 'room21',
        title: '五臥室皇家套房',
        description: '尊榮五臥室套房，配備私人泳池、酒吧與遊戲區',
        keywords: ['五臥室', '皇家', '套房', '奢華', '極致'],
        image: 'room/room21.webp',
        url: 'order.html?room=room21'
    }
];

// 開啟搜尋視窗
function openSearchModal() {
    if (searchModal) searchModal.classList.add('is-open');
    if (overlay) overlay.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    if (searchInput) {
        setTimeout(() => searchInput.focus(), 300);
    }
}

// 關閉搜尋視窗
function closeSearchModal() {
    if (searchModal) searchModal.classList.remove('is-open');
    if (overlay) overlay.classList.remove('is-open');
    document.body.style.overflow = '';
    if (searchInput) {
        searchInput.value = '';
        searchResults.innerHTML = '';
        searchSuggestions.style.display = 'block';
    }
}

// 搜尋功能
function performSearch(query) {
    if (!query.trim()) {
        searchResults.innerHTML = '';
        searchSuggestions.style.display = 'block';
        return;
    }

    const results = roomData.filter(room => {
        const searchTerm = query.toLowerCase();
        return room.title.toLowerCase().includes(searchTerm) ||
               room.description.toLowerCase().includes(searchTerm) ||
               room.keywords.some(keyword => keyword.toLowerCase().includes(searchTerm));
    });

    displaySearchResults(results);
}

// 顯示搜尋結果
function displaySearchResults(results) {
    searchSuggestions.style.display = 'none';
    
    if (results.length === 0) {
        searchResults.innerHTML = `
            <div class="search-result-item">
                <div class="search-result-title">沒有找到相關結果</div>
                <div class="search-result-description">請嘗試其他關鍵字</div>
            </div>
        `;
        return;
    }

    const resultsHTML = results.map(room => `
        <div class="search-result-item" onclick="window.location.href='${room.url}'">
            <div class="search-result-title">${room.title}</div>
            <div class="search-result-description">${room.description}</div>
        </div>
    `).join('');

    searchResults.innerHTML = resultsHTML;
}

// 初始化搜尋功能
function initSearchFunction() {
    // 事件監聽器
    if (searchBtn) {
        searchBtn.addEventListener('click', openSearchModal);
    }

    if (closeSearchBtn) {
        closeSearchBtn.addEventListener('click', closeSearchModal);
    }

    if (searchInput) {
        // 輸入搜尋
        searchInput.addEventListener('input', function() {
            performSearch(this.value);
        });

        // 按下Enter鍵搜尋
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                performSearch(this.value);
            }
        });
    }

    if (searchSubmitBtn) {
        searchSubmitBtn.addEventListener('click', function() {
            performSearch(searchInput.value);
        });
    }

    // 熱門搜尋標籤點擊
    suggestionTags.forEach(tag => {
        tag.addEventListener('click', function() {
            const searchTerm = this.getAttribute('data-search');
            searchInput.value = searchTerm;
            performSearch(searchTerm);
        });
    });
}



// 輪播功能
// 取得輪播相關元素
const navigationGrid = document.querySelector('.navigation-grid');
const navCards = document.querySelectorAll('.nav-card');
const prevBtn = document.getElementById('nav-btn-prev');
const nextBtn = document.getElementById('nav-btn-next');

// 輪播狀態變數
let currentIndex = 0;
let isDragging = false;
let startX = 0;
let currentX = 0;
let cardWidth = 0;
let gap = 20; // 卡片間距
let visibleCards = 0;

function bindCarouselEvents() {
    
    // 按鈕事件
    if (prevBtn) {
        prevBtn.addEventListener('click', () => { if (!isDragging) goToPrevious(); });
    }
    if (nextBtn) {
        nextBtn.addEventListener('click', () => { if (!isDragging) goToNext(); });
    }

    // 觸控事件（手機）
    let touchStartX = 0;
    let isTouching = false;
    
    navigationGrid.addEventListener('touchstart', (e) => {
        touchStartX = e.touches[0].clientX;
        isTouching = true;
        isDragging = false;
    }, { passive: true });
    
    navigationGrid.addEventListener('touchmove', (e) => {
        if (!isTouching) return;
        
        const touchX = e.touches[0].clientX;
        const diff = touchX - touchStartX;
        
        // 如果移动超过10px，开始拖拽
        if (Math.abs(diff) > 10) {
            isDragging = true;
            e.preventDefault();
            
            const translateX = -currentIndex * (cardWidth + gap) + diff;
            navigationGrid.style.transform = `translateX(${translateX}px)`;
        }
    }, { passive: false });
    
    navigationGrid.addEventListener('touchend', (e) => {
        if (!isTouching) return;
        
        const touchEndX = e.changedTouches[0].clientX;
        const diff = touchStartX - touchEndX;
        
        if (isDragging) {
            // 如果滑动距离超过卡片宽度的1/3，切换轮播图
            const threshold = cardWidth / 3;
            if (Math.abs(diff) > threshold) {
                if (diff > 0) {
                    goToNext();
                } else {
                    goToPrevious();
                }
            } else {
                // 回到原位置
                updateCarouselPosition(currentIndex);
            }
        }
        
        isTouching = false;
        isDragging = false;
    });

    // 滑鼠事件（桌機）
    let mouseStartTime = 0;
    
    navigationGrid.addEventListener('mousedown', (e) => {
        startX = e.clientX;
        mouseStartTime = Date.now();
        isDragging = false;
        navigationGrid.classList.add('is-dragging');
        navigationGrid.style.cursor = 'grabbing';
    });
    
    navigationGrid.addEventListener('mousemove', (e) => {
        if (navigationGrid.classList.contains('is-dragging')) {
            isDragging = true;
            e.preventDefault();
            currentX = e.clientX;
            const diff = currentX - startX;
            const translateX = -currentIndex * (cardWidth + gap) + diff;
            navigationGrid.style.transform = `translateX(${translateX}px)`;
        }
    });
    
    navigationGrid.addEventListener('mouseup', (e) => {
        const mouseEndTime = Date.now();
        const mouseDuration = mouseEndTime - mouseStartTime;
        
        if (navigationGrid.classList.contains('is-dragging')) {
            const diff = startX - currentX;
            const threshold = cardWidth / 3;
            if (Math.abs(diff) > threshold) {
                if (diff > 0) goToNext();
                else goToPrevious();
            } else {
                updateCarouselPosition(currentIndex);
            }
            isDragging = false;
            navigationGrid.classList.remove('is-dragging');
            navigationGrid.style.cursor = 'grab';
        }
    });
    
    navigationGrid.addEventListener('mouseleave', () => {
        if (navigationGrid.classList.contains('is-dragging')) {
            isDragging = false;
            navigationGrid.classList.remove('is-dragging');
            navigationGrid.style.cursor = 'grab';
            updateCarouselPosition(currentIndex);
        }
    });
    
    navigationGrid.style.cursor = 'grab';

    // 移除所有卡片的點擊事件監聽器，讓a標籤的默認行為工作
    const cards = navigationGrid.querySelectorAll('.nav-card');
    
    cards.forEach(card => {
        // 移除舊的事件監聽器
        if (card._carouselClickHandler) {
            card.removeEventListener('click', card._carouselClickHandler);
            delete card._carouselClickHandler;
        }
        
        // 直接为每个卡片添加点击事件
        card.addEventListener('click', function(e) {
            if (isDragging) {
                e.preventDefault();
                e.stopPropagation();
                return false;
            }
            // 允许正常跳转
            return true;
        });
    });
    
}

function initCarousel() {
    if (!navigationGrid) {
        return;
    }

    // 确保移除任何可能存在的is-dragging类
    navigationGrid.classList.remove('is-dragging');
    isDragging = false;

    // 重新取得所有卡片（包括新增的）
    const allCards = navigationGrid.querySelectorAll('.nav-card');
    if (allCards.length === 0) {
        return;
    }

    // 1. 先移除所有 clone，只保留原始卡片
    const originalCards = Array.from(allCards);
    navigationGrid.innerHTML = '';
    originalCards.forEach(card => navigationGrid.appendChild(card));

    // 2. 重新計算
    cardWidth = originalCards[0].offsetWidth;
    const containerWidth = navigationGrid.parentElement.offsetWidth;
    visibleCards = Math.floor(containerWidth / (cardWidth + gap));
    
    // 確保至少複製 2 張卡片
    const cardsToClone = Math.max(visibleCards, 2);

    // 3. 複製卡片（確保是a標籤且保留href）
    for (let i = 0; i < cardsToClone; i++) {
        const card = originalCards[i % originalCards.length];
        const clone = card.cloneNode(true);
        
        // 確保複製的卡片保持a標籤的完整性
        if (card.tagName === 'A') {
            const href = card.getAttribute('href');
            if (href) {
                clone.setAttribute('href', href);
            }
            // 確保複製的卡片也是a標籤
            if (clone.tagName !== 'A') {
                const newLink = document.createElement('a');
                newLink.setAttribute('href', href);
                newLink.className = card.className;
                newLink.innerHTML = card.innerHTML;
                clone = newLink;
            }
        }
        navigationGrid.appendChild(clone);
    }

    // 4. 重新設置 currentIndex
    currentIndex = 0;
    updateCarouselPosition(currentIndex);

    // 5. 重新綁定事件
    bindCarouselEvents();
}

// 前往下一張
function goToNext() {
    const allCards = navigationGrid.querySelectorAll('.nav-card');
    const originalCardCount = allCards.length - Math.floor(allCards.length / (allCards.length / 7)); // 估算原始卡片數量
    
    currentIndex++;
    // 無限循環：到達最後一張時跳回第一張
    if (currentIndex >= 7) { // 使用固定的 7 張卡片
        setTimeout(() => {
            currentIndex = 0;
            updateCarouselPosition(currentIndex);
        }, 300);
    }
    updateCarouselPosition(currentIndex);
}

// 前往上一張
function goToPrevious() {
    currentIndex--;
    // 無限循環：到達第一張前時跳到最後一張
    if (currentIndex < 0) {
        setTimeout(() => {
            currentIndex = 6; // 使用固定的 6 (7-1)
            updateCarouselPosition(currentIndex);
        }, 300);
    }
    updateCarouselPosition(currentIndex);
}

// 更新輪播位置
function updateCarouselPosition(index) {
    const translateX = -index * (cardWidth + gap);
    navigationGrid.style.transform = `translateX(${translateX}px)`;
}

// resize 時重新初始化
window.addEventListener('resize', function() {
    initCarousel();
});

// Masonry 圖片視差效果
function updateMasonryParallax() {
  const cards = document.querySelectorAll('.masonry-card img');
  const wh = window.innerHeight;
  cards.forEach(img => {
    const rect = img.getBoundingClientRect();
    // 視差強度大幅提升（160px 為最大偏移）
    const parallax = ((rect.top + rect.height/2 - wh/2) / wh) * 80;
    img.style.transform = `scale(1.15) translateY(${parallax}px)`;
  });
}
window.addEventListener('scroll', updateMasonryParallax);
window.addEventListener('resize', updateMasonryParallax);

// 首页视差滚动效果
function initHomepageParallax() {
    const parallaxBg = document.getElementById('homepage-parallax-bg');
    const body = document.body;
    
    // 只在首页执行
    if (!parallaxBg || !body.classList.contains('homepage')) {
        return;
    }
    
    
    
    let ticking = false;
    
    function updateParallax() {
        const scrolled = window.pageYOffset;
        const windowHeight = window.innerHeight;
        const documentHeight = document.documentElement.scrollHeight;
        
        // 计算滚动进度（0-1）
        const scrollProgress = Math.min(scrolled / (documentHeight - windowHeight), 1);
        
        // 背景图缩放效果
        const scale = 1.2 + (scrollProgress * 0.0); 
        
        // 背景位置移动：创造由近到远的效果（向上移动）
        const moveY = -(scrolled * 0.1); // 减少移动速度，避免露出边界
        
        // 应用变换
        parallaxBg.style.backgroundSize = `${scale * 100}% ${scale * 100}%`;
        parallaxBg.style.backgroundPosition = `center ${moveY}px`;
        

        
        ticking = false;
    }
    
    function requestTick() {
        if (!ticking) {
            requestAnimationFrame(updateParallax);
            ticking = true;
        }
    }
    
    // 监听滚动事件
    window.addEventListener('scroll', requestTick, { passive: true });
    
    // 监听窗口大小变化
    window.addEventListener('resize', requestTick, { passive: true });
    
    // 初始化
    updateParallax();
    
}

// 緩慢顯示背景圖片效果
function initSlowReveal() {
  const slowRevealBg = document.getElementById('slow-reveal-bg');
  const slowRevealSection = document.querySelector('.slow-reveal-section');
  const parallaxBg = document.getElementById('homepage-parallax-bg');
  
  if (!slowRevealBg || !slowRevealSection) return;
  
  function updateSlowReveal() {
    const rect = slowRevealSection.getBoundingClientRect();
    const windowHeight = window.innerHeight;
    
    // 計算滾動進度 (0 到 1)
    const progress = Math.max(0, Math.min(1, 
      (windowHeight - rect.top) / (rect.height + windowHeight)
    ));
    
    // 根據進度調整透明度
    slowRevealBg.style.opacity = progress;
    
    // 根據進度調整縮放
    const scale = 1.1 - (progress * 0.1);
    slowRevealBg.style.transform = `scale(${scale})`;
    
    // 當 2bg 開始顯示時（進度 > 0），立即隱藏原本的視差背景
    if (progress > 0 && parallaxBg) {
      parallaxBg.style.opacity = '0';
      parallaxBg.style.transition = 'opacity 0.3s ease';
    } else if (progress <= 0 && parallaxBg) {
      parallaxBg.style.opacity = '1';
      parallaxBg.style.transition = 'opacity 0.3s ease';
    }
    
    // 當完全滾動到底部時添加 revealed 類
    if (progress >= 0.95) {
      slowRevealBg.classList.add('revealed');
    } else {
      slowRevealBg.classList.remove('revealed');
    }
  }
  
  window.addEventListener('scroll', updateSlowReveal);
  window.addEventListener('resize', updateSlowReveal);
  
  // 初始化
  updateSlowReveal();
}

// 登出功能（桌面與手機版）
function setupLogoutIcon() {
    // 桌面版
    const userBtn = document.querySelector('.user-btn');
    if (userBtn) {
        userBtn.addEventListener('click', function(e) {
            const user = localStorage.getItem('user');
            if (user) {
                e.preventDefault();
                if (confirm('確定要登出嗎？')) {
                    localStorage.removeItem('user');
                    window.location.href = 'login.html';
                }
            }
        });
    }
    // 手機版
    const mobileUserBtn = document.querySelector('.mobile-nav-links .footer-link[href="login.html"]');
    if (mobileUserBtn) {
        mobileUserBtn.addEventListener('click', function(e) {
            const user = localStorage.getItem('user');
            if (user) {
                e.preventDefault();
                if (confirm('確定要登出嗎？')) {
                    localStorage.removeItem('user');
                    window.location.href = 'login.html';
                }
            }
        });
    }
}

// 若有登入/登出狀態變化時也可呼叫 updateMobileNavLoginText();
function updateMobileNavLoginText() {
    const mobileUserBtn = document.querySelector('.mobile-nav-links .footer-link[href="login.html"]');
    const user = localStorage.getItem('user');
    if (mobileUserBtn) {
        if (user) {
            mobileUserBtn.textContent = '登出';
        } else {
            mobileUserBtn.textContent = '登入';
        }
    }
}

// 頁面載入時自動啟用
window.addEventListener('DOMContentLoaded', function() {
    setupLogoutIcon();
    updateMobileNavLoginText();
});

