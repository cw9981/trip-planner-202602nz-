// 从外部JSON文件加载待办事项数据
async function loadTodoData() {
    try {
        const response = await fetch('data/data_todo.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const todoData = await response.json();
        return todoData;
    } catch (error) {
        console.error('載入待辦事項數據時發生錯誤:', error);
        // 显示错误信息
        const container = document.getElementById('todo-container');
        container.innerHTML = `
            <div class="error">
                <p>無法載入待辦事項數據: ${error.message}</p>
                <p>請檢查 data/data_todo.json 文件是否存在且格式正確。</p>
            </div>
        `;
        return null;
    }
}

// 页面加载完成后初始化待办事项
document.addEventListener('DOMContentLoaded', async function() {
    // 隐藏加载消息
    const loadingMessage = document.getElementById('loading-message');
    
    // 加载待办事项数据
    const todoData = await loadTodoData();
    
    if (todoData) {
        // 隐藏加载消息
        loadingMessage.style.display = 'none';
        // 初始化待办事项列表
        initializeTodoList(todoData);
    } else {
        loadingMessage.textContent = '載入待辦事項失敗，請刷新頁面重試。';
        loadingMessage.className = 'error';
    }
});

// 初始化待办事项列表
function initializeTodoList(todoData) {
    const container = document.getElementById('todo-container');
    container.innerHTML = ''; // 清空容器
    
    todoData.forEach(category => {
        // 创建分类容器
        const categoryElement = document.createElement('div');
        categoryElement.className = 'todo-category';
        
        // 创建分类标题
        const titleElement = document.createElement('div');
        titleElement.className = 'category-title';
        
        // 根据类别名称设置不同的图标
        let icon = '📋';
        if (category.name === '所有人') {
            icon = '👥';
        } else {
            icon = '👤';
        }
        
        titleElement.textContent = `${icon} ${category.name}`;
        categoryElement.appendChild(titleElement);
        
        // 创建待办事项列表
        const listElement = document.createElement('div');
        listElement.className = 'todo-list';
        
        category.activities.forEach((activity, index) => {
            // 创建待办事项项
            const todoItem = document.createElement('div');
            todoItem.className = 'todo-item';
            
            // 创建状态图标
            const statusIcon = document.createElement('span');
            statusIcon.className = 'status-icon';
            statusIcon.textContent = '•'; // 使用圆点作为列表标记
            
            // 创建任务文本
            const taskText = document.createElement('span');
            taskText.className = 'task-text';
            taskText.textContent = activity;
            
            // 组装待办事项项
            todoItem.appendChild(statusIcon);
            todoItem.appendChild(taskText);
            
            // 添加到列表
            listElement.appendChild(todoItem);
        });
        
        categoryElement.appendChild(listElement);
        container.appendChild(categoryElement);
    });
}