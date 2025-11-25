// 行程渲染模块 - 负责渲染行程阶段
class ItineraryRenderer {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.notesData = {}; // 存储意见数据
        this.scriptUrl = 'https://script.google.com/macros/s/AKfycbyKs2l6MedR-NhCP5PSuhv7AF_h1sly8byERatD-zw-TjPCDx3ACIRY6JaXoXBD8hPN/exec';
        this.isNotesLoaded = false; // 标记意见数据是否已加载
    }

    // 渲染所有阶段
    renderStages(stagesData) {
        // 清空容器
        this.container.innerHTML = '';
        
        // 先渲染阶段内容，不包含意见数据
        stagesData.forEach(stage => {
            const stageElement = this.createStageElement(stage);
            this.container.appendChild(stageElement);
        });

        // 在后台加载意见数据
        this.loadNotesDataInBackground();
    }

    // 后台加载意见数据
    async loadNotesDataInBackground() {
        try {
            await this.loadNotesData();
            this.isNotesLoaded = true;
            console.log('意见数据加载完成');
        } catch (error) {
            console.error('加载意见数据失败:', error);
            // 即使失败也标记为已加载，避免无限等待
            this.isNotesLoaded = true;
        }
    }

    // 创建单个阶段的HTML元素
    createStageElement(stage) {
        const stageElement = document.createElement('div');
        stageElement.className = 'itinerary-stage expanded';
        stageElement.dataset.stageId = stage.stage_id;
        
        stageElement.innerHTML = `
            <div class="stage-header">
                <div>
                    <h2>第${stage.stage_id}階段：${stage.location}</h2>
                    <div class="stage-meta">
                        <span>日期：${stage.dates}</span>
                    </div>
                </div>
                <div class="stage-toggle">▼</div>
            </div>
            <div class="stage-content">
                ${this.renderItinerary(stage.itinerary)}
                <div class="stage-notes">
                    <div class="notes-header">
                        <h3>意見與備註</h3>
                        <div class="notes-actions">
                            <button class="toggle-notes-btn" data-stage-id="${stage.stage_id}">展開意見</button>
                            <button class="edit-notes-btn" data-stage-id="${stage.stage_id}" disabled>編輯意見</button>
                        </div>
                    </div>
                    <div class="notes-content" id="notes-${stage.stage_id}">
                        <div class="loading-notes">載入意見中...</div>
                    </div>
                </div>
            </div>
        `;
        
        // 添加点击事件
        const header = stageElement.querySelector('.stage-header');
        header.addEventListener('click', () => {
            stageElement.classList.toggle('expanded');
        });
        
        // 添加意见展开/收起按钮事件
        const toggleBtn = stageElement.querySelector('.toggle-notes-btn');
        toggleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleNotes(stage.stage_id, toggleBtn);
        });
        
        // 添加编辑按钮事件
        const editBtn = stageElement.querySelector('.edit-notes-btn');
        editBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.handleEditStage(stage.stage_id, stage.location);
        });
        
        return stageElement;
    }

    // 渲染行程详情
    renderItinerary(itinerary) {
        let html = '';
        
        itinerary.forEach(day => {
            html += `
                <div class="itinerary-date">
                    <div class="date-header">${day.date}</div>
                    <ul class="activity-list">
                        ${day.activities.map(activity => {
                            if (activity.includes('注意:')) {
                                const parts = activity.split('注意:');
                                return `
                                    <li class="activity-item">
                                        <div class="normal-activity">${parts[0]}</div>
                                        <div class="important-note">注意:${parts[1]}</div>
                                    </li>
                                `;
                            } else {
                                return `<li class="activity-item">${activity}</li>`;
                            }
                        }).join('')}
                    </ul>
                </div>
            `;
        });
        
        return html;
    }

    // 切换意见展开/收起状态
    toggleNotes(stageId, toggleBtn) {
        const notesContent = document.getElementById(`notes-${stageId}`);
        const editBtn = toggleBtn.closest('.notes-actions').querySelector('.edit-notes-btn');
        
        if (notesContent.classList.contains('expanded')) {
            // 收起
            notesContent.classList.remove('expanded');
            toggleBtn.textContent = '展開意見';
            editBtn.disabled = true;
        } else {
            // 展开
            if (!this.isNotesLoaded) {
                // 如果意见数据还没加载完成，显示加载状态
                notesContent.innerHTML = '<div class="loading-notes">載入意見中...</div>';
                // 等待数据加载完成
                this.waitForNotesLoad().then(() => {
                    this.renderNotesContent(stageId);
                    notesContent.classList.add('expanded');
                    toggleBtn.textContent = '收起意見';
                    editBtn.disabled = false;
                });
            } else {
                // 数据已加载，直接渲染
                this.renderNotesContent(stageId);
                notesContent.classList.add('expanded');
                toggleBtn.textContent = '收起意見';
                editBtn.disabled = false;
            }
        }
    }

    // 等待意见数据加载完成
    waitForNotesLoad() {
        return new Promise((resolve) => {
            const checkInterval = setInterval(() => {
                if (this.isNotesLoaded) {
                    clearInterval(checkInterval);
                    resolve();
                }
            }, 100);
            
            // 10秒超时
            setTimeout(() => {
                clearInterval(checkInterval);
                resolve();
            }, 10000);
        });
    }

    // 渲染意见内容
    renderNotesContent(stageId) {
        const notesContent = document.getElementById(`notes-${stageId}`);
        const stageNotes = this.getStageNotes(stageId);
        
        if (!stageNotes || stageNotes.length === 0) {
            notesContent.innerHTML = '<p class="no-notes">尚無意見</p>';
            return;
        }

        let html = '';
        const people = ['chingwen', 'jane', 'zhi'];
        
        people.forEach(person => {
            const personNotes = stageNotes.filter(note => note.person === person);
            if (personNotes.length > 0) {
                html += `<div class="person-notes">
                    <strong>${this.getPersonDisplayName(person)}</strong>
                    <ul>
                        ${personNotes.map(note => `<li>${this.formatNoteText(note.activity)}</li>`).join('')}
                    </ul>
                </div>`;
            }
        });

        notesContent.innerHTML = html;
    }

    // 格式化意見文本，支持換行且避免额外空格
    formatNoteText(text) {
        if (!text) return '';
        
        // 1. 先分割成行
        const lines = text.split('\n');
        
        // 2. 對每一行進行處理
        const processedLines = lines.map(line => {
            // 移除行首和行尾的空格
            const trimmedLine = line.trim();
            
            // 轉義HTML特殊字符
            return trimmedLine
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;');
        });
        
        // 3. 過濾掉空行，然後用 <br> 連接
        const nonEmptyLines = processedLines.filter(line => line.length > 0);
        
        return nonEmptyLines.join('<br>');
    }

    // 获取人员显示名称
    getPersonDisplayName(person) {
        const names = {
            'chingwen': 'chingwen',
            'jane': 'jane',
            'zhi': 'zhī'
        };
        return names[person] || person;
    }

    // 获取阶段的意见数据
    getStageNotes(stageId) {
        return this.notesData[stageId] || [];
    }

    // 获取特定人员和阶段的意见
    getPersonNote(stageId, person) {
        const notes = this.getStageNotes(stageId);
        const personNote = notes.find(note => note.person === person);
        return personNote ? personNote.activity : '';
    }

    // 加载意见数据
    async loadNotesData() {
        try {
            this.notesData = await this.fetchNotesFromGoogleAppsScript();
        } catch (error) {
            console.error('加载意见数据失败:', error);
            // 使用空数据继续
            this.notesData = {};
        }
    }

    // 从Google Apps Script获取数据
    async fetchNotesFromGoogleAppsScript() {
        try {
            const response = await fetch(`${this.scriptUrl}?path=data`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            
            // 将数据转换为内部格式
            return this.transformNotesData(data);
        } catch (error) {
            console.error('从Google Apps Script获取数据失败:', error);
            throw error;
        }
    }

    // 转换数据格式
    transformNotesData(data) {
        const transformed = {};
        data.forEach(row => {
            const stageId = parseInt(row.stage);
            const person = row.person.trim();
            if (!transformed[stageId]) {
                transformed[stageId] = [];
            }
            transformed[stageId].push({
                person: person,
                activity: row.activity
            });
        });
        return transformed;
    }

    // 处理编辑阶段
    handleEditStage(stageId, location) {
        this.openEditModal(stageId, location);
    }

    // 打开编辑模态框
    openEditModal(stageId, location) {
        // 获取该阶段的现有意见
        const currentNotes = this.getStageNotes(stageId);
        
        // 创建模态框
        const modal = document.createElement('div');
        modal.className = 'edit-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>編輯意見 - 第${stageId}階段：${location}</h2>
                    <span class="close-modal">&times;</span>
                </div>
                <div class="modal-body">
                    <div class="form-section">
                        <h3>選擇人員</h3>
                        <div class="person-options">
                            <label class="person-option">
                                <input type="radio" name="person" value="chingwen" class="person-radio">
                                <span class="person-name">chingwen</span>
                            </label>
                            <label class="person-option">
                                <input type="radio" name="person" value="jane" class="person-radio">
                                <span class="person-name">jane</span>
                            </label>
                            <label class="person-option">
                                <input type="radio" name="person" value="zhi" class="person-radio">
                                <span class="person-name">zhi</span>
                            </label>
                        </div>
                    </div>
                    <div class="form-section">
                        <h3>意見內容</h3>
                        <textarea id="note-content" class="note-content" placeholder="請輸入您的意見...（支援換行）" rows="6"></textarea>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="cancel-btn">取消</button>
                    <button class="save-btn">保存</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // 设置默认选中第一个人员
        const firstRadio = modal.querySelector('.person-radio');
        if (firstRadio) {
            firstRadio.checked = true;
            this.updateNoteContent(stageId, firstRadio.value, modal);
        }

        // 添加人员选择事件
        const personRadios = modal.querySelectorAll('.person-radio');
        personRadios.forEach(radio => {
            radio.addEventListener('change', () => {
                if (radio.checked) {
                    this.updateNoteContent(stageId, radio.value, modal);
                }
            });
        });

        // 设置事件监听器
        const closeModal = () => document.body.removeChild(modal);
        
        modal.querySelector('.close-modal').addEventListener('click', closeModal);
        modal.querySelector('.cancel-btn').addEventListener('click', closeModal);
        
        // 保存按钮事件
        modal.querySelector('.save-btn').addEventListener('click', () => {
            const selectedPerson = modal.querySelector('input[name="person"]:checked').value;
            const noteContent = modal.querySelector('#note-content').value;
            
            this.saveNote(stageId, selectedPerson, noteContent)
                .then(() => {
                    closeModal();
                    // 重新加载意见数据并刷新显示
                    this.loadNotesData().then(() => {
                        // 如果当前意见区域是展开状态，则更新显示
                        const notesContent = document.getElementById(`notes-${stageId}`);
                        if (notesContent.classList.contains('expanded')) {
                            this.renderNotesContent(stageId);
                        }
                    });
                })
                .catch(error => {
                    console.error('保存失败:', error);
                    alert('保存失败，请稍后重试');
                });
        });

        // 点击模态框外部关闭
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });
    }

    // 更新意见内容
    updateNoteContent(stageId, person, modal) {
        const noteContent = this.getPersonNote(stageId, person);
        const textarea = modal.querySelector('#note-content');
        textarea.value = noteContent;
    }


    // 保存意见到Google Apps Script（使用 AJAX 避免页面跳转）
    async saveNote(stageId, person, activity) {
    try {
        // 构造表单数据（和原来一样，但用 fetch 发送）
        const formData = new FormData();
        formData.append('stage', stageId);
        formData.append('person', person);
        formData.append('activity', activity);

        // 使用 fetch 发送 POST 请求
        const response = await fetch(`${this.scriptUrl}?path=update`, {
        method: 'POST',
        body: formData,
        headers: {
            'Accept': 'application/json' // 明确要求返回 JSON
        }
        });

        // 1. 从响应中获取 JSON 数据（避免浏览器直接显示）
        const result = await response.json();
        
        console.log('意见已保存:', result);
        
        // 2. 仅当成功时提示（不跳转页面）
        if (result.success) {
        alert('保存成功！'); // 或用 Toast 提示
        }
        return result;
    } catch (error) {
        console.error('保存失败:', error);
        alert('保存失败，请重试！');
        throw error;
    }
    }
}