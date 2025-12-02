// task.js - 任務管理頁面邏輯 (四大分類版)
document.addEventListener('DOMContentLoaded', function() {
    // 設置頁面標題
    document.title = '紐西蘭行程 - 任務清單';
    document.getElementById('current-page-title').textContent = '任務清單';
    
    // 隱藏加載訊息
    const loadingMessage = document.getElementById('loading-message');
    
    // 四大分類定義
    const taskCategories = {
        // 規劃類 (藍色)
        planning: {
            name: "規劃",
            icon: "🗺️",
            keywords: ["申請", "安排", "規劃",  "準備", "路線", "行程", "安排"]
        },
        
        // 購物類 (綠色)
        shopping: {
            name: "購物",
            icon: "🛒",
            keywords: ["購買",  "超市"]
        },
        
        // 住宿類 (黃色)
        accommodation: {
            name: "住宿",
            icon: "🏨",
            keywords: ["住宿", "住宿預訂"]
        },
        
        // 交通類 (紫色)
        transportation: {
            name: "交通",
            icon: "🚗",
            keywords: ["駕照", "國際駕照", "租車", "租車預訂"]  // 煎鍋歸為交通類物品
        },
        
        // 其他類 (灰色)
        other: {
            name: "其他",
            icon: "📝",
            keywords: [] // 默認，不匹配任何關鍵字的歸為其他
        }
    };
    
    // 獲取任務數據
    fetch('data/data_task.json')
        .then(response => response.json())
        .then(data => {
            // 隱藏加載訊息
            loadingMessage.style.display = 'none';
            
            // 渲染任務卡片
            renderTaskCards(data);
            
            // 添加事件監聽器
            addEventListeners();
        })
        .catch(error => {
            console.error('載入任務數據時發生錯誤:', error);
            loadingMessage.textContent = '載入任務數據失敗，請刷新頁面重試。';
            loadingMessage.style.color = '#ef4444';
        });
    
    // 渲染任務卡片
    function renderTaskCards(data) {
        const container = document.getElementById('task-container');
        
        // 計算總任務數和各分類統計
        let totalTasks = 0;
        let categoryCounts = {
            planning: 0,
            shopping: 0,
            accommodation: 0,
            transportation: 0,
            other: 0
        };
        
        // 先計算統計數據
        data.forEach(member => {
            totalTasks += member.tasks.length;
            member.tasks.forEach(task => {
                const category = determineCategory(task);
                categoryCounts[category]++;
            });
        });
        
        
        // 創建成員卡片
        data.forEach((member, index) => {
            const card = createMemberCard(member, index);
            container.appendChild(card);
        });
    }
    
    // 創建成員卡片
    function createMemberCard(member, index) {
        const card = document.createElement('div');
        card.className = 'member-card';
        
        // 獲取成員名稱的第一個字符作為圖標
        const memberInitial = member.name.charAt(0);
        
        // 創建卡片HTML
        card.innerHTML = `
            <div class="member-header">
                <h2>
                    <span class="member-icon">${memberInitial}</span>
                    ${member.name}
                    <span class="task-count">${member.tasks.length} 個任務</span>
                </h2>
                <div class="toggle-btn">
                    <span>▼</span>
                </div>
            </div>
            <ul class="task-list">
                ${member.tasks.map(task => createTaskItem(task)).join('')}
            </ul>
        `;
        
        return card;
    }
    
    // 確定任務分類
    function determineCategory(taskText) {
        // 將任務文字轉為小寫以便比對
        const lowerTaskText = taskText.toLowerCase();
        
        // 檢查每個分類的關鍵字
        for (const category in taskCategories) {
            // 跳過"其他"分類
            if (category === 'other') continue;
            
            // 檢查是否包含該分類的關鍵字
            for (const keyword of taskCategories[category].keywords) {
                if (lowerTaskText.includes(keyword.toLowerCase())) {
                    return category;
                }
            }
        }
        
        // 如果沒有匹配任何分類，歸為其他
        return 'other';
    }
    
    // 創建任務項目
    function createTaskItem(taskText) {
        // 確定分類
        const category = determineCategory(taskText);
        const categoryInfo = taskCategories[category];
        
        // 檢查任務是否包含日期
        const dateInfo = getDateInfo(taskText);
        
        // 檢查任務是否包含價格
        const priceInfo = getPriceInfo(taskText);
        
        // 構建額外信息
        let extraInfo = '';
        if (dateInfo) extraInfo += dateInfo;
        if (priceInfo) extraInfo += priceInfo;
        
        return `
            <li class="task-item">
                <div class="task-icon ${category}">${categoryInfo.icon}</div>
                <div class="task-content">
                    ${taskText}
                    <span class="category-tag ${category}">${categoryInfo.name}</span>
                    ${extraInfo}
                </div>
            </li>
        `;
    }
    
    // 獲取日期信息
    function getDateInfo(taskText) {
        const dateMatch = taskText.match(/\d{2}\/\d{2}/);
        if (dateMatch) {
            // 將日期格式化為更易讀的形式
            const dateParts = dateMatch[0].split('/');
            const month = dateParts[0];
            const day = dateParts[1];
            const monthNames = ["1月", "2月", "3月", "4月", "5月", "6月", 
                               "7月", "8月", "9月", "10月", "11月", "12月"];
            const monthName = monthNames[parseInt(month) - 1] || month;
            return `<span class="task-date">${monthName}${day}日</span>`;
        }
        return '';
    }
    
    // 獲取價格信息
    function getPriceInfo(taskText) {
        const priceMatch = taskText.match(/(\d+)\s*紐幣/);
        if (priceMatch) {
            return `<span class="task-price">${priceMatch[1]} NZD</span>`;
        }
        
        // 檢查其他價格格式
        const priceMatch2 = taskText.match(/(\d+)\s*紐西蘭幣/);
        if (priceMatch2) {
            return `<span class="task-price">${priceMatch2[1]} NZD</span>`;
        }
        
        const priceMatch3 = taskText.match(/(\d+)\s*紐/);
        if (priceMatch3) {
            return `<span class="task-price">${priceMatch3[1]} NZD</span>`;
        }
        
        return '';
    }
    
    // 添加事件監聽器
    function addEventListeners() {
        // 成員卡片展開/收合
        const memberHeaders = document.querySelectorAll('.member-header');
        memberHeaders.forEach(header => {
            header.addEventListener('click', function() {
                const toggleBtn = this.querySelector('.toggle-btn');
                const taskList = this.nextElementSibling;
                
                toggleBtn.classList.toggle('collapsed');
                taskList.classList.toggle('collapsed');
            });
        });
        
        // 添加任務點擊效果
        const taskItems = document.querySelectorAll('.task-item');
        taskItems.forEach(item => {
            item.addEventListener('click', function() {
                // 添加短暫的點擊效果
                this.style.backgroundColor = 'rgba(96, 165, 250, 0.1)';
                setTimeout(() => {
                    this.style.backgroundColor = '';
                }, 200);
            });
        });
    }
});