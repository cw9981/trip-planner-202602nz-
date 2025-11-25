// 行程主应用逻辑
document.addEventListener('DOMContentLoaded', function() {
    const itineraryRenderer = new ItineraryRenderer('itinerary-container');
    
    // 加载行程数据
    loadItineraryData()
        .then(stagesData => {
            itineraryRenderer.renderStages(stagesData);
        })
        .catch(error => {
            console.error('加载行程数据失败:', error);
            displayErrorMessage();
        });
    
    // 加载行程数据的函数
    async function loadItineraryData() {
        try {
            const response = await fetch('data/data_itinerary.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('获取行程数据时出错:', error);
            throw error;
        }
    }
    
    // 显示错误信息
    function displayErrorMessage() {
        const container = document.getElementById('itinerary-container');
        container.innerHTML = `
            <div class="loading">
                <p>無法加載行程數據，請稍後再試。</p>
                <button id="retry-btn" class="edit-stage-btn">重新載入</button>
            </div>
        `;
        
        document.getElementById('retry-btn').addEventListener('click', function() {
            location.reload();
        });
    }
});