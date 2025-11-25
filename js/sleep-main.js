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
            
            data.confirmed.forEach((item, index) => {
                confirmedList.innerHTML += renderAccommodationItem(item, 'confirmed', index);
                
                // 添加到时间线概览
                const timelinePos = calculateTimelinePosition(item, tripStart, tripEnd);
                overviewContainer.innerHTML += renderTimelineItem(item, 'confirmed', timelinePos.position, timelinePos.width, index);
            });
            
            confirmedSection.appendChild(confirmedList);
            container.appendChild(confirmedSection);
        }
        
        // 渲染待取消的住宿
        if (data.canceled && data.canceled.length > 0) {
            const canceledSection = document.createElement('div');
            canceledSection.className = 'canceled';
            
            const canceledTitle = document.createElement('h2');
            canceledTitle.textContent = '待取消';
            canceledSection.appendChild(canceledTitle);
            
            const canceledList = document.createElement('div');
            canceledList.className = 'accommodation-list';
            
            data.canceled.forEach((item, index) => {
                canceledList.innerHTML += renderAccommodationItem(item, 'canceled', index + data.confirmed.length);
            });
            
            canceledSection.appendChild(canceledList);
            container.appendChild(canceledSection);
        }
        
        // 添加交互效果
        addTimelineInteractions();
        
    } catch (error) {
        console.error('載入住宿資料時發生錯誤:', error);
        container.innerHTML = `
            <div class="error">
                載入住宿資料時發生錯誤：${error.message}
            </div>
        `;
    }
}

// 添加时间轴交互效果
function addTimelineInteractions() {
    const timelineItems = document.querySelectorAll('.overview-item');
    const accommodationItems = document.querySelectorAll('.accommodation-item');
    
    timelineItems.forEach(timelineItem => {
        const index = timelineItem.getAttribute('data-index');
        const accommodationItem = document.querySelector(`.accommodation-item[data-index="${index}"]`);
        
        if (accommodationItem) {
            // 鼠标悬停效果
            timelineItem.addEventListener('mouseenter', () => {
                accommodationItem.style.transform = 'translateY(-5px)';
                accommodationItem.style.boxShadow = '0 8px 20px rgba(0,0,0,0.15)';
                accommodationItem.style.zIndex = '10';
            });
            
            timelineItem.addEventListener('mouseleave', () => {
                accommodationItem.style.transform = '';
                accommodationItem.style.boxShadow = '';
                accommodationItem.style.zIndex = '';
            });
            
            // 点击跳转到对应住宿项
            timelineItem.addEventListener('click', () => {
                accommodationItem.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'center' 
                });
                
                // 添加高亮效果
                accommodationItem.classList.add('highlight');
                setTimeout(() => {
                    accommodationItem.classList.remove('highlight');
                }, 2000);
            });
        }
    });
}

// 页面载入完成后执行
document.addEventListener('DOMContentLoaded', loadAccommodationData);