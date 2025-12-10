
// 航班頁面專用腳本

// 語言變數
let currentLang = 'zh-TW';
let translations = {};

// 偵測語言
function detectLanguage() {
    const browserLang = navigator.language || navigator.userLanguage;
    return browserLang.startsWith('zh') ? 'zh-TW' : 'en';
}

// 載入語言資料
async function loadLanguageData() {
    try {
        currentLang = detectLanguage();
        const response = await fetch('data/language.json');
        const data = await response.json();
        translations = data[currentLang] || data['zh-TW'];
        document.documentElement.lang = currentLang;
        return translations;
    } catch (error) {
        console.error('載入語言資料失敗:', error);
        return null;
    }
}

// 生成表頭
function createTableHeaders() {
    const headers = [
        translations.flightNumber,
        translations.departure,
        translations.destination,
        translations.date,
        translations.departureTime,
        translations.arrivalTime,
        translations.flightDuration
    ];
    
    return headers.map(header => `<th>${header}</th>`).join('');
}

// 設定頁面標題和表頭
function setupPageHeaders() {
    // 設定區段標題
    const outboundTitle = document.querySelector('main h2:nth-of-type(1)');
    const inboundTitle = document.querySelector('main h2:nth-of-type(2)');
    
    if (outboundTitle) outboundTitle.textContent = translations.outboundFlights;
    if (inboundTitle) inboundTitle.textContent = translations.inboundFlights;
    
    // 設定表格表頭
    const outboundThead = document.querySelector('#outbound-table thead tr');
    const inboundThead = document.querySelector('#inbound-table thead tr');
    
    if (outboundThead) outboundThead.innerHTML = createTableHeaders();
    if (inboundThead) inboundThead.innerHTML = createTableHeaders();
}

// 渲染航班數據的函數
function renderFlights(flights, tbodyId) {
    const tbody = document.getElementById(tbodyId);
    if (!tbody) {
        console.error(`找不到元素: ${tbodyId}`);
        return;
    }
    
    tbody.innerHTML = ''; // 清空現有內容
    
    flights.forEach((flight, index) => {
        // 創建航班行
        const flightRow = document.createElement('tr');
        
        // 解析機場信息
        const departureParts = flight.departure ? flight.departure.split('/') : ['', '', ''];
        const destinationParts = flight.destination ? flight.destination.split('/') : ['', '', ''];
        
        // 構建航班行 HTML
        flightRow.innerHTML = `
            <td data-label="${translations.flightNumber}">${flight.flight || 'N/A'}</td>
            <td data-label="${translations.departure}">${departureParts[0] || 'N/A'}<br>${departureParts[2] || 'N/A'}<br>${departureParts[1] || 'N/A'}</td>
            <td data-label="${translations.destination}">${destinationParts[0] || 'N/A'}<br>${destinationParts[2] || 'N/A'}<br>${destinationParts[1] || 'N/A'}</td>
            <td data-label="${translations.date}">${formatDate(flight.date)}</td>
            <td data-label="${translations.departureTime}">${flight.departure_time || 'N/A'}</td>
            <td data-label="${translations.arrivalTime}">${flight.arrival_time || 'N/A'}</td>
            <td data-label="${translations.flightDuration}" class="flight-duration">${flight.flight_duration || 'N/A'}</td>
        `;
        
        tbody.appendChild(flightRow);
        
        // 如果不是最後一個航班，添加轉機信息
        if (index < flights.length - 1 && flight.layover) {
            const transferRow = document.createElement('tr');
            transferRow.className = 'transfer';
            transferRow.innerHTML = `<td colspan="7"> ${translations.transferAt} ${destinationParts[2] || 'N/A'}：${flight.layover}</td>`;
            tbody.appendChild(transferRow);
        }
    });
}

// 格式化日期函數
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '日期格式錯誤';
        
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const day = date.getDate();
        
        // 根據語言格式化日期
        if (currentLang === 'zh-TW') {
            return `${year}年${month}月${day}日`;
        } else {
            return date.toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric' 
            });
        }
    } catch (error) {
        console.error('日期格式化錯誤:', error);
        return '日期錯誤';
    }
}

// 主初始化函數
async function initFlightsPage() {
    // 載入語言資料
    const langData = await loadLanguageData();
    if (!langData) {
        console.error('無法載入語言資料');
        return;
    }
    
    // 設定頁面標題和表頭
    setupPageHeaders();
    
    try {
        // 獲取航班數據
        const response = await fetch('data/data_flights.json');
        if (!response.ok) {
            throw new Error('網絡響應不正常');
        }
        const data = await response.json();
        
        // 渲染去程航班
        renderFlights(data[0].outbound, 'outbound-tbody');
        
        // 渲染回程航班
        renderFlights(data[0].inbound, 'inbound-tbody');
        
    } catch (error) {
        console.error('獲取航班數據時出錯:', error);
        
        // 顯示錯誤訊息
        const outboundTbody = document.getElementById('outbound-tbody');
        const inboundTbody = document.getElementById('inbound-tbody');
        
        const errorMsg = currentLang === 'zh-TW' ? 
            '無法加載航班數據，請檢查網絡連接' : 
            'Unable to load flight data, please check network connection';
        
        if (outboundTbody) {
            outboundTbody.innerHTML = `<tr><td colspan="7">${errorMsg}</td></tr>`;
        }
        
        if (inboundTbody) {
            inboundTbody.innerHTML = `<tr><td colspan="7">${errorMsg}</td></tr>`;
        }
    }
}

// DOM 載入完成後執行
document.addEventListener('DOMContentLoaded', function() {
    initFlightsPage();
});
