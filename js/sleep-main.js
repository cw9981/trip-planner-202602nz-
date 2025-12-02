// sleep-main.js 修改后的版本
// 载入并渲染住宿数据
async function loadAccommodationData() {
    const container = document.getElementById('accommodation-container');
    const overviewContainer = document.getElementById('overview-items');
    
    try {
        const response = await fetch('data/data_sleep.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // 清空容器
        container.innerHTML = '';
        overviewContainer.innerHTML = '';
        
        // 旅行日期范围
        const tripStart = '2026-02-07';
        const tripEnd = '2026-03-02';
        
        // 渲染已确认的住宿
        if (data.confirmed && data.confirmed.length > 0) {
            const confirmedSection = document.createElement('div');
            confirmedSection.className = 'confirmed';
            
            const confirmedTitle = document.createElement('h2');
            confirmedTitle.textContent = '已確認入住';
            confirmedSection.appendChild(confirmedTitle);
            
            const confirmedList = document.createElement('div');
            confirmedList.className = 'accommodation-list';
            
            data.confirmed.forEach(item => {
                confirmedList.innerHTML += renderAccommodationItem(item, 'confirmed');
                
                // 添加到时间线概览
                const timelinePos = calculateTimelinePosition(item, tripStart, tripEnd);
                overviewContainer.innerHTML += renderTimelineItem(item, 'confirmed', timelinePos.position, timelinePos.width);
            });
            
            confirmedSection.appendChild(confirmedList);
            container.appendChild(confirmedSection);
        }
        
        // 渲染待取消的住宿
        if (data.canceled && data.canceled.length > 0) {
            const canceledSection = document.createElement('div');
            canceledSection.className = 'canceled';
            
            const canceledTitle = document.createElement('h2');
            canceledTitle.textContent = '待討論';
            canceledSection.appendChild(canceledTitle);
            
            const canceledList = document.createElement('div');
            canceledList.className = 'accommodation-list';
            
            data.canceled.forEach(item => {
                canceledList.innerHTML += renderAccommodationItem(item, 'canceled');
                
                // 添加到时间线概览
                // const timelinePos = calculateTimelinePosition(item, tripStart, tripEnd);
                // overviewContainer.innerHTML += renderTimelineItem(item, 'canceled', timelinePos.position, timelinePos.width);
            });
            
            canceledSection.appendChild(canceledList);
            container.appendChild(canceledSection);
        }
        
    } catch (error) {
        console.error('載入住宿資料時發生錯誤:', error);
        container.innerHTML = `
            <div class="error">
                載入住宿資料時發生錯誤：${error.message}
            </div>
        `;
    }
}

// 页面载入完成后执行
document.addEventListener('DOMContentLoaded', loadAccommodationData);