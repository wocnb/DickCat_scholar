/**
 * 职业选择器模块
 * 提供 2T + 2H + 4DPS 队伍选择功能
 */
class JobSelector {
    constructor() {
        this.isOpen = false;
        this.selection = window.normalizeJobSelection
            ? window.normalizeJobSelection(window.DEFAULT_JOB_SELECTION)
            : { ...window.DEFAULT_JOB_SELECTION };
    }

    /**
     * 打开职业选择器
     */
    open() {
        if (this.isOpen) return;
        this.isOpen = true;
        this.render();
        console.log('职业选择器已打开');
    }

    /**
     * 关闭职业选择器
     */
    close() {
        this.isOpen = false;
        const modal = document.getElementById('job-selector-modal');
        if (modal) {
            modal.remove();
        }
        console.log('职业选择器已关闭');
    }

    /**
     * 渲染职业选择器
     */
    render() {
        // 如果已存在，先移除
        const existing = document.getElementById('job-selector-modal');
        if (existing) {
            existing.remove();
        }

        const modal = document.createElement('div');
        modal.id = 'job-selector-modal';
        modal.className = 'job-modal-overlay';
        modal.innerHTML = `
            <div class="job-modal-content">
                <div class="job-modal-header">
                    <div>
                        <h2>选择职业配置</h2>
                        <div class="job-modal-subtitle">2T / 2H / 4DPS</div>
                    </div>
                    <button class="job-close-btn" onclick="jobSelector.close()">✕</button>
                </div>
                <div class="job-modal-body" id="job-rows-container">
                    <!-- 职业行将动态生成 -->
                </div>
                <div class="job-modal-footer">
                    <button class="btn btn-secondary" onclick="jobSelector.reset()">重置默认</button>
                    <button class="btn btn-primary" onclick="jobSelector.confirm()">确认选择</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        this.renderRows();
    }

    /**
     * 渲染所有队伍槽位
     */
    renderRows() {
        const container = document.getElementById('job-rows-container');
        if (!container) return;

        container.innerHTML = '';

        const slots = window.PARTY_SLOTS || [];
        slots.forEach((slot, rowIndex) => {
            const jobs = window.getJobsForSlot
                ? window.getJobsForSlot(slot)
                : (window.JOB_MATRIX?.[rowIndex] || []);
            const rowDiv = document.createElement('div');
            rowDiv.className = `job-row job-row-${slot.role}`;

            const rowLabel = document.createElement('div');
            rowLabel.className = 'job-row-label';
            rowLabel.innerHTML = `
                <span class="job-slot-label">${slot.label}</span>
                <span class="job-role-label">${this.getRoleLabel(slot.role)}</span>
            `;
            rowDiv.appendChild(rowLabel);

            const selectedJobId = this.selection[slot.key];

            jobs.forEach(job => {
                const isSelected = selectedJobId === job.id;
                const jobDiv = document.createElement('div');
                jobDiv.className = `job-item ${isSelected ? 'selected' : ''}`;
                jobDiv.dataset.slot = slot.key;
                jobDiv.dataset.jobId = job.id;
                jobDiv.title = `${job.name} (${job.nameEn})\n${this.getJobSkillSummary(job.id)}`;

                jobDiv.innerHTML = `
                    <div class="job-icon-small ${isSelected ? 'selected' : ''}">
                        <img src="figs/jobs/${job.id}.png" alt="${job.name}" title="${job.name} (${job.nameEn})" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                        <span class="job-icon-fallback">${job.name[0]}</span>
                    </div>
                    <span class="job-name">${job.name}</span>
                `;

                jobDiv.onclick = () => this.selectJob(slot.key, job.id);
                rowDiv.appendChild(jobDiv);
            });

            container.appendChild(rowDiv);
        });
    }

    /**
     * 选择职业
     */
    selectJob(slotKey, jobId) {
        const slot = (window.PARTY_SLOTS || []).find(item => item.key === slotKey);
        if (window.isJobAllowedInSlot && !window.isJobAllowedInSlot(jobId, slot)) {
            console.warn(`职业 ${jobId} 不能选择到 ${slotKey}`);
            return;
        }

        this.selection[slotKey] = jobId;

        this.renderRows();

        console.log(`${slot?.label || slotKey} 选择: ${jobId}`);
    }

    /**
     * 重置为默认选择
     */
    reset() {
        this.selection = window.normalizeJobSelection
            ? window.normalizeJobSelection(window.DEFAULT_JOB_SELECTION)
            : { ...window.DEFAULT_JOB_SELECTION };
        this.renderRows();
        console.log('已重置为默认选择');
    }

    /**
     * 确认选择
     */
    confirm() {
        const slots = window.PARTY_SLOTS || [];
        const normalizedSelection = window.normalizeJobSelection
            ? window.normalizeJobSelection(this.selection)
            : { ...this.selection };

        for (const slot of slots) {
            const jobId = normalizedSelection[slot.key];
            if (!jobId || (window.isJobAllowedInSlot && !window.isJobAllowedInSlot(jobId, slot))) {
                alert(`${slot.label} 必须选择一个${this.getRoleLabel(slot.role)}职业！`);
                return;
            }
        }

        window.setJobSelection(normalizedSelection);

        const selectedJobs = window.getSelectedJobIds
            ? window.getSelectedJobIds(normalizedSelection)
            : Object.values(normalizedSelection);
        if (window.skillsConfigManager) {
            window.skillsConfigManager.updateConfigByJob(selectedJobs);
        }

        if (this.onConfirmCallback) {
            this.onConfirmCallback(normalizedSelection);
        }

        this.selection = normalizedSelection;
        this.close();
        alert(`✓ 职业配置已保存！\n✓ 已自动导入减伤技能：${selectedJobs.join(', ')}`);
    }

    /**
     * 设置确认回调
     */
    onConfirm(callback) {
        this.onConfirmCallback = callback;
    }

    /**
     * 获取当前选择
     */
    getSelection() {
        return { ...this.selection };
    }

    /**
     * 从外部设置选择（用于导入配置等场景）
     * @param {Object} selection - 职业选择对象
     */
    setSelection(selection) {
        if (!selection || typeof selection !== 'object') {
            console.warn('无效的职业选择对象');
            return;
        }

        this.selection = window.normalizeJobSelection
            ? window.normalizeJobSelection(selection)
            : { ...selection };

        if (this.isOpen) {
            this.renderRows();
        }

        console.log('✓ 职业选择已更新:', this.selection);
    }

    getRoleLabel(role) {
        return window.ROLE_LABELS?.[role] || role;
    }

    getJobSkillSummary(jobId) {
        const skills = Object.keys(window.JOB_SKILLS_MAP?.[jobId] || {});
        return skills.length > 0
            ? `减伤技能: ${skills.join('、')}`
            : '暂无可导入的团队减伤技能';
    }
}

// 导出单例
const jobSelector = new JobSelector();
