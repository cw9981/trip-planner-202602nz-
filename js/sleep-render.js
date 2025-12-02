// sleep-render.js 修改后的版本 - 暗色系配色
// 暗色系颜色映射 - 配合整體設計
const colorMap = {
    1: '#3b82f6', // 蓝色 - 1晚
    2: '#2563eb', // 深蓝色 - 2晚
    3: '#1d4ed8', // 更深的蓝色 - 3晚
    4: '#1e40af', // 深蓝紫色 - 4晚
    5: '#1e3a8a', // 深蓝色 - 5晚
    6: '#1c1f8a', // 蓝黑色 - 6晚
    7: '#0f172a', // 深蓝黑色 - 7晚
    default: '#334155' // 默认深灰色
};

// 浅色文本颜色映射，确保在深色背景上的可读性
const textColorMap = {
    1: '#f1f5f9',
    2: '#f1f5f9',
    3: '#f1f5f9',
    4: '#f1f5f9',
    5: '#f1f5f9',
    6: '#f1f5f9',
    7: '#f1f5f9',
    default: '#cbd5e1'
};

// 格式化日期顯示
function formatDate(dateString) {
    const date = new Date(dateString);
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
}

// 計算住宿天數
function calculateNights(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// 获取颜色基于住宿天数
function getColorByNights(nights) {
    return colorMap[nights] || colorMap.default;
}

// 获取文本颜色基于住宿天数
function getTextColorByNights(nights) {
    return textColorMap[nights] || textColorMap.default;
}

// 计算住宿在时间线上的位置和宽度
function calculateTimelinePosition(item, tripStart, tripEnd) {
    const tripStartDate = new Date(tripStart);
    const tripEndDate = new Date(tripEnd);
    const itemStartDate = new Date(item.date_start);
    const itemEndDate = new Date(item.date_end);
    
    const tripDuration = (tripEndDate - tripStartDate) / (1000 * 60 * 60 * 24);
    const daysFromStart = (itemStartDate - tripStartDate) / (1000 * 60 * 60 * 24);
    const itemDuration = (itemEndDate - itemStartDate) / (1000 * 60 * 60 * 24);
    
    const position = (daysFromStart / tripDuration) * 100;
    const width = (itemDuration / tripDuration) * 100;
    
    return {
        position: Math.max(0, position),
        width: Math.min(100 - position, width)
    };
}

// 渲染住宿項目
function renderAccommodationItem(item, status, index) {
    const nights = calculateNights(item.date_start, item.date_end);
    const itemColor = getColorByNights(nights);
    const textColor = getTextColorByNights(nights);

    // 計算日期範圍文字
    const dateRange = `${formatDate(item.date_start)} – ${formatDate(item.date_end)}`;
    
    // 处理链接显示
    let linksHtml = '';
    if (item.links) {
        const linkArray = item.links.split(',').filter(link => link.trim());
        linksHtml = `<div class="links-container"><strong>相關連結：</strong><div class="links-list">`;
        linkArray.forEach(link => {
            const cleanLink = link.trim();
            if (cleanLink) {
                linksHtml += `<a href="${cleanLink}" target="_blank" rel="noopener" class="link-button">
                    <span class="link-icon">🔗</span>
                    <span class="link-text">${getLinkSource(cleanLink)}</span>
                </a>`;
            }
        });
        linksHtml += '</div></div>';
    }

    return `
        <div class="accommodation-item" data-index="${index}" data-nights="${nights}">
            <div class="accommodation-header">
                <div class="accommodation-title">
                    <h3>${item.accommodation}</h3>
                    <div class="location-badge">${item.location}</div>
                </div>
                <span class="status ${status}">${status === 'confirmed' ? '已確認' : '待取消'}</span>
            </div>
            <div class="stay-duration">
                <div class="nights-badge" style="background-color: ${itemColor}; color: ${textColor}; border-color: ${itemColor}">
                    ${nights}<span>晚</span>
                </div>
                <div class="date-range">${dateRange}</div>
            </div>
            <div class="accommodation-details">
                <div class="detail-row">
                    <span class="detail-label">預訂來源：</span>
                    <span class="detail-value">${item.booking_source}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">住宿類型：</span>
                    <span class="detail-value">${item.details}</span>
                </div>
                ${item.address ? `
                <div class="detail-row">
                    <span class="detail-label">地址：</span>
                    <span class="detail-value">${item.address}</span>
                </div>` : ''}
                ${item.check_in ? `
                <div class="detail-row">
                    <span class="detail-label">入住時間：</span>
                    <span class="detail-value">${item.check_in}</span>
                </div>` : ''}
                ${item.check_out ? `
                <div class="detail-row">
                    <span class="detail-label">退房時間：</span>
                    <span class="detail-value">${item.check_out}</span>
                </div>` : ''}
                ${linksHtml}
            </div>
        </div>
    `;
}

// 获取链接来源名称
function getLinkSource(link) {
    if (link.includes('booking.com')) return 'Booking.com';
    if (link.includes('airbnb.com')) return 'Airbnb';
    if (link.includes('google.com') || link.includes('goo.gl')) return 'Google 地圖';
    return '查看詳情';
}

// 渲染时间线概览项目
function renderTimelineItem(item, status, position, width, index) {
    const nights = calculateNights(item.date_start, item.end_date || item.date_end);
    const itemColor = getColorByNights(nights);
    const textColor = getTextColorByNights(nights);
    
    return `
        <div class="overview-item ${status}" 
             style="left: ${position}%; width: ${width}%; background-color: ${itemColor}; color: ${textColor}"
             title="${item.location} - ${nights}晚"
             data-index="${index}">
            <span class="overview-nights">${nights}</span>
        </div>
    `;
}