// 优化后的共用 header 功能
class CommonHeader {
    constructor() {
        this.currentLanguage = this.detectLanguage();
        this.currentPage = this.getCurrentPage();
        this.buttonConfig = {
            'flight': { file: 'flight.html', key: 'flight' },
            'itinerary': { file: 'itinerary.html', key: 'itinerary' },
            'accommodation': { file: 'accommodation.html', key: 'accommodation' },
            'task': { file: 'task.html', key: 'task' }
        };
        this.init();
    }

    // 侦测系统语系
    detectLanguage() {
        const browserLang = navigator.language || navigator.userLanguage;
        return browserLang.startsWith('zh') ? 'zh-TW' : 'en';
    }

    // 获取当前页面名称
    getCurrentPage() {
        const path = window.location.pathname;
        const page = path.split('/').pop();
        return page;
    }

    // 格式化日期
    formatDate(dateString) {
        const date = new Date(dateString);
        if (this.currentLanguage === 'zh-TW') {
            return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
        } else {
            return date.toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            });
        }
    }

    // 计算天数
    calculateDays(startDate, endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const timeDiff = end - start;
        return Math.ceil(timeDiff / (1000 * 60 * 60 * 24)) + 1;
    }

    // 载入旅行资讯
    async loadTripInfo() {
        try {
            const response = await fetch('../data/trip-info.json');
            const tripInfo = await response.json();
            return tripInfo;
        } catch (error) {
            console.error('载入旅行资讯失败:', error);
            return null;
        }
    }

    // 载入语言资料
    async loadLanguageData() {
        try {
            const response = await fetch('../data/language.json');
            const languageData = await response.json();
            return languageData;
        } catch (error) {
            console.error('载入语言资料失败:', error);
            return null;
        }
    }

    // 設定當前頁面標題（包括 HTML 的 <title>）
    setCurrentPageTitle(languageData) {
        const currentPageTitle = document.getElementById('current-page-title');
        if (languageData) {
            const pageName = this.currentPage.replace('.html', '');
            const pageTitle = languageData[this.currentLanguage][pageName] || 
                            (this.currentLanguage === 'zh-TW' ? '當前頁面' : 'Current Page');
            
            // 設定 h1 標題
            if (currentPageTitle) {
                currentPageTitle.textContent = pageTitle;
            }
            
            // 設定 HTML 的 <title>
            document.title = pageTitle;
        }
    }

    // 建立 header HTML
    async createHeaderHTML() {
        const tripInfo = await this.loadTripInfo();
        const languageData = await this.loadLanguageData();

        if (!tripInfo || !languageData) {
            return '<div class="error-message">载入资料失败</div>';
        }

        // 设置页面标题
        this.setCurrentPageTitle(languageData);

        const startDateFormatted = this.formatDate(tripInfo.startDate);
        const endDateFormatted = this.formatDate(tripInfo.endDate);
        const totalDays = this.calculateDays(tripInfo.startDate, tripInfo.endDate);
        const participants = tripInfo.participants.join(', ');
        const tripTitle = languageData[this.currentLanguage].title;
        
        const buttonTexts = languageData[this.currentLanguage];

        // 过滤掉当前页面对应的按钮
        const filteredButtons = Object.entries(this.buttonConfig)
            .filter(([key, config]) => config.file !== this.currentPage)
            .map(([key, config]) => ({
                key: config.key,
                file: config.file,
                text: buttonTexts[config.key]
            }));

        return `
            <header class="common-header">
                <div class="trip-info">
                    <div class="trip-info-container">
                        <div class="trip-title">
                            ${tripTitle}
                        </div>
                        <div class="trip-dates">
                            <span>${this.currentLanguage === 'zh-TW' ? '旅行日期：' : 'Travel Dates: '}</span>
                            ${startDateFormatted} - ${endDateFormatted} 
                            (${this.currentLanguage === 'zh-TW' ? '共' : 'total '}${totalDays}${this.currentLanguage === 'zh-TW' ? '天' : ' days'})
                        </div>
                    </div>
                </div>
                
                <nav class="navigation-buttons">
                    ${filteredButtons.map(button => 
                        `<a href="${button.file}" class="nav-btn">${button.text}</a>`
                    ).join('')}
                </nav>
            </header>
        `;
    }

    // 初始化
    async init() {
        const headerHTML = await this.createHeaderHTML();
        const headerContainer = document.getElementById('common-header');
        if (headerContainer) {
            headerContainer.innerHTML = headerHTML;
        }
    }
}

// 当 DOM 载入完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    new CommonHeader();
});