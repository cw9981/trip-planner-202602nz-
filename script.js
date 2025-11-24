// Google Apps Script Web App URL - 请替换为您的实际URL
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyKs2l6MedR-NhCP5PSuhv7AF_h1sly8byERatD-zw-TjPCDx3ACIRY6JaXoXBD8hPN/exec';

// 获取模态框和表单元素
const modal = document.getElementById('opinionModal');
const opinionForm = document.getElementById('opinionForm');
const personSelect = document.getElementById('personSelect');
const opinionTextarea = document.getElementById('opinionTextarea');
const closeBtn = document.querySelector('.close-btn');
const cancelBtn = document.querySelector('.cancel-btn');

// 当前编辑的阶段和人员
let currentPhase = null;
let currentPerson = null;

// 打开编辑对话框
function openOpinionModal(phase) {
    currentPhase = phase;
    modal.style.display = 'flex';
    
    // 重置表单
    personSelect.value = 'chingwen';
    updateTextarea();
}

// 更新文本区域内容
function updateTextarea() {
    const person = personSelect.value;
    const opinionElement = document.getElementById(`phase${currentPhase}-${person}`);
    opinionTextarea.value = opinionElement.textContent;
}

// 保存意见到Google Sheets
async function saveOpinion() {
    const person = personSelect.value;
    const content = opinionTextarea.value;
    const opinionElement = document.getElementById(`phase${currentPhase}-${person}`);
    
    try {
        // 显示加载状态
        const saveBtn = document.querySelector('.save-btn');
        const originalText = saveBtn.textContent;
        saveBtn.textContent = '保存中...';
        saveBtn.disabled = true;
        
        // 发送数据到Google Apps Script
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'update',
                stage: currentPhase,
                person: person,
                activity: content
            })
        });
        
        if (!response.ok) {
            throw new Error('保存失败');
        }
        
        const result = await response.json();
        
        if (result.status === 'success') {
            // 更新页面显示
            opinionElement.textContent = content;
            closeModal();
        } else {
            throw new Error(result.message || '保存失败');
        }
        
    } catch (error) {
        console.error('保存意见时出错:', error);
        alert('保存失败，请重试: ' + error.message);
    } finally {
        // 恢复按钮状态
        const saveBtn = document.querySelector('.save-btn');
        saveBtn.textContent = '保存';
        saveBtn.disabled = false;
    }
}

// 从Google Sheets加载所有意见
async function loadOpinionsFromGoogleSheets() {
    try {
        // 显示加载状态
        const loadingElement = document.createElement('div');
        loadingElement.className = 'loading';
        loadingElement.textContent = '正在加载意见...';
        document.body.appendChild(loadingElement);
        
        // 发送请求到Google Apps Script
        const response = await fetch(`${SCRIPT_URL}?action=getAll`);
        
        if (!response.ok) {
            throw new Error('加载数据失败');
        }
        
        const result = await response.json();
        
        if (result.status === 'success') {
            // 将数据填充到页面
            result.data.forEach(item => {
                const element = document.getElementById(`phase${item.stage}-${item.person}`);
                if (element) {
                    element.textContent = item.activity;
                }
            });
        } else {
            throw new Error(result.message || '加载数据失败');
        }
        
    } catch (error) {
        console.error('加载意见时出错:', error);
        const errorElement = document.createElement('div');
        errorElement.className = 'error-message';
        errorElement.textContent = '加载意见失败: ' + error.message;
        document.body.appendChild(errorElement);
    } finally {
        // 移除加载状态
        const loadingElement = document.querySelector('.loading');
        if (loadingElement) {
            loadingElement.remove();
        }
    }
}

// 关闭模态框
function closeModal() {
    modal.style.display = 'none';
    currentPhase = null;
}

// 事件监听器
document.addEventListener('DOMContentLoaded', function() {
    // 加载意见数据
    loadOpinionsFromGoogleSheets();
    
    // 设置编辑按钮事件
    document.querySelectorAll('.edit-opinion-btn').forEach(button => {
        button.addEventListener('click', function() {
            const phase = this.getAttribute('data-phase');
            openOpinionModal(phase);
        });
    });
    
    // 设置其他事件
    personSelect.addEventListener('change', updateTextarea);
    
    opinionForm.addEventListener('submit', function(e) {
        e.preventDefault();
        saveOpinion();
    });
    
    closeBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);
    
    // 点击模态框外部关闭
    window.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeModal();
        }
    });
});