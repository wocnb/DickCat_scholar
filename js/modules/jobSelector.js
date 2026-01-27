/**
 * 职业选择器模块
 * 提供8行职业矩阵选择功能
 */
class JobSelector {
    constructor() {
        this.isOpen = false;
        this.selection = { ...window.DEFAULT_JOB_SELECTION };
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
                    <h2>选择职业配置</h2>
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
     * 渲染所有职业行
     */
    renderRows() {
        const container = document.getElementById('job-rows-container');
        if (!container) return;

        container.innerHTML = '';

        window.JOB_MATRIX.forEach((jobs, rowIndex) => {
            const rowDiv = document.createElement('div');
            rowDiv.className = 'job-row';

            // 添加行标签
            const rowLabel = document.createElement('div');
            rowLabel.className = 'job-row-label';
            rowLabel.textContent = `第${rowIndex + 1}行`;
            rowDiv.appendChild(rowLabel);

            const selectedJobId = this.selection[`row${rowIndex}`];

            jobs.forEach(job => {
                const isSelected = selectedJobId === job.id;
                const jobDiv = document.createElement('div');
                jobDiv.className = `job-item ${isSelected ? 'selected' : ''}`;
                jobDiv.dataset.row = rowIndex;
                jobDiv.dataset.jobId = job.id;

                jobDiv.innerHTML = `
                    <div class="job-icon-small ${isSelected ? 'selected' : ''}">
                        <img src="figs/jobs/${job.id}.png" alt="${job.name}" title="${job.name} (${job.nameEn})" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2250%22 fill=%234a5568%22>${job.name[0]}</text></svg>'">
                    </div>
                `;

                jobDiv.onclick = () => this.selectJob(rowIndex, job.id);
                rowDiv.appendChild(jobDiv);
            });

            container.appendChild(rowDiv);
        });
    }

    /**
     * 选择职业
     */
    selectJob(rowIndex, jobId) {
        // 更新选择
        this.selection[`row${rowIndex}`] = jobId;

        // 重新渲染
        this.renderRows();

        console.log(`第${rowIndex + 1}行选择: ${jobId}`);
    }

    /**
     * 重置为默认选择
     */
    reset() {
        this.selection = { ...window.DEFAULT_JOB_SELECTION };
        this.renderRows();
        console.log('已重置为默认选择');
    }

    /**
     * 确认选择
     */
    confirm() {
        // 验证：每行都必须有选择
        for (let i = 0; i < 8; i++) {
            if (!this.selection[`row${i}`]) {
                alert(`第${i + 1}行必须选择一个职业！`);
                return;
            }
        }

        // 保存到全局变量
        window.setJobSelection(this.selection);

        // 更新技能配置（根据所有选中的职业）
        const selectedJobs = Object.values(this.selection);
        if (window.skillsConfigManager) {
            window.skillsConfigManager.updateConfigByJob(selectedJobs);
        }

        // 触发回调
        if (this.onConfirmCallback) {
            this.onConfirmCallback(this.selection);
        }

        this.close();
        alert(`✓ 职业配置已保存！\n✓ 技能已根据选中职业更新：${selectedJobs.join(', ')}`);
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

        // 更新内部状态
        this.selection = { ...selection };

        // 如果选择器是打开状态，重新渲染UI
        if (this.isOpen) {
            this.renderRows();
        }

        console.log('✓ 职业选择已更新:', this.selection);
    }
}

// 导出单例
const jobSelector = new JobSelector();
