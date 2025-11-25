// 行程渲染模块 - 负责渲染行程阶段
class ItineraryRenderer {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.notesData = {}; // 存储意见数据
        this.scriptUrl = 'https://script.google.com/macros/s/AKfycbyKs2l6MedR-NhCP5PSuhv7AF_h1sly8byERatD-zw-TjPCDx3ACIRY6JaXoXBD8hPN/exec';
    }

    // 渲染所有阶段
    renderStages(stagesData) {
        // 清空容器
        this.container.innerHTML = '';
        
        // 加载意见数据
        this.loadNotesData()
            .then(() => {
                // 为每个阶段创建HTML
                stagesData.forEach(stage => {
                    const stageElement = this.createStageElement(stage);
                    this.container.appendChild(stageElement);
                });
            })
            .catch(error => {
                console.error('加载意见数据失败:', error);
                // 即使意见数据加载失败，仍然渲染阶段
                stagesData.forEach(stage => {
                    const stageElement = this.createStageElement(stage);
                    this.container.appendChild(stageElement);
                });
            });
    }

    // 创建单个阶段的HTML元素
    createStageElement(stage) {
        const stageElement = document.createElement('div');
        stageElement.className = 'itinerary-stage expanded';
        stageElement.dataset.stageId = stage.stage_id;
        
        // 获取该阶段的意见
        const stageNotes = this.getStageNotes(stage.stage_id);
        
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
                    <h3>意見與備註</h3>
                    ${this.renderNotes(stageNotes)}
                </div>
                <button class="edit-stage-btn" data-stage-id="${stage.stage_id}">編輯意見</button>
            </div>
        `;
        
        // 添加点击事件
        const header = stageElement.querySelector('.stage-header');
        header.addEventListener('click', () => {
            stageElement.classList.toggle('expanded');
        });
        
        // 添加编辑按钮事件
        const editBtn = stageElement.querySelector('.edit-stage-btn');
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

    // 渲染意见区域
    renderNotes(notes) {
        if (!notes || notes.length === 0) {
            return '<p class="no-notes">尚無意見</p>';
        }

        let html = '';
        const people = ['chingwen', 'jane', 'zhi'];
        
        people.forEach(person => {
            const personNotes = notes.filter(note => note.person === person);
            if (personNotes.length > 0) {
                html += `<div class="person-notes">
                    <strong>${this.getPersonDisplayName(person)}</strong>
                    <ul>
                        ${personNotes.map(note => `<li>${note.activity}</li>`).join('')}
                    </ul>
                </div>`;
            }
        });

        return html;
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
            const person = row.person.trim(); // 去除可能的多余空格
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
                        <textarea id="note-content" class="note-content" placeholder="請輸入您的意見..." rows="6"></textarea>
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
                        this.refreshStage(stageId);
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

    // 保存意见到Google Apps Script
    async saveNote(stageId, person, activity) {
        try {
            // 使用表单提交方式，路径为 update
            return new Promise((resolve, reject) => {
                const form = document.createElement('form');
                form.method = 'POST';
                form.action = `${this.scriptUrl}?path=update`;
                form.target = '_blank'; // 在新窗口打开，避免页面跳转
                
                // 添加参数
                const stageInput = document.createElement('input');
                stageInput.name = 'stage';
                stageInput.value = stageId;
                form.appendChild(stageInput);
                
                const personInput = document.createElement('input');
                personInput.name = 'person';
                personInput.value = person;
                form.appendChild(personInput);
                
                const activityInput = document.createElement('input');
                activityInput.name = 'activity';
                activityInput.value = activity;
                form.appendChild(activityInput);
                
                // 添加到页面并提交
                document.body.appendChild(form);
                form.submit();
                document.body.removeChild(form);
                
                console.log('意见已提交到Google Apps Script');
                resolve();
            });
        } catch (error) {
            console.error('保存意见失败:', error);
            throw error;
        }
    }

    // 刷新特定阶段
    refreshStage(stageId) {
        // 简单实现：重新加载整个页面
        location.reload();
    }
}