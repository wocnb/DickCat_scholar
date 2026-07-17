/**
 * UI 渲染模块
 * 按技能type分组渲染交互元素
 */
class UIRenderer {
    constructor() {
        // 不再保存快照，而是使用 getter 实时获取配置
    }

    // 获取当前的技能配置
    get skillsConfig() {
        return window.SKILL_CONSTANTS?.SKILLS_CONFIG || {};
    }

    // 获取当前的 getSkillNamesByType 函数
    get getSkillNamesByType() {
        return window.SKILL_CONSTANTS?.getSkillNamesByType || (() => []);
    }

    /**
     * 渲染单行数据
     * @param {Object} rowData - 行数据对象
     */
    renderRow(rowData) {
        const tbody = document.getElementById('tableBody');
        const tr = document.createElement('tr');
        tr.id = `row-${rowData.id}`;

        tr.innerHTML = `
            <td>
                <div class="input-group">
                    <input
                        type="text"
                        class="string-input"
                        id="string-${rowData.id}"
                        placeholder="数字/sm"
                        value="${rowData.string || ''}"
                        oninput="validator.validateAndUpdate(${rowData.id}, 'string')"
                        onblur="dataHandler.updateData(${rowData.id})"
                    >
                    <div class="error-message" id="string-error-${rowData.id}">只能输入数字或字母s/m</div>
                </div>
            </td>
            <td>
                <div class="input-group">
                    <input
                        type="text"
                        class="chinese-input"
                        id="chinese-${rowData.id}"
                        placeholder="技能/机制名称"
                        value="${this.escapeHtml(rowData.chineseText || '')}"
                        oninput="validator.validateAndUpdate(${rowData.id}, 'chinese')"
                        onblur="dataHandler.updateData(${rowData.id})"
                    >
                    <div class="error-message" id="chinese-error-${rowData.id}">可输入中英文、数字和常用符号</div>
                </div>
            </td>
            <td>
                <div class="input-group">
                    <input
                        type="text"
                        class="number-input"
                        id="number-${rowData.id}"
                        placeholder="请输入数字"
                        value="${rowData.number || ''}"
                        oninput="validator.validateAndUpdate(${rowData.id}, 'number')"
                        onblur="dataHandler.updateData(${rowData.id})"
                    >
                    <div class="error-message" id="number-error-${rowData.id}">只能输入数字</div>
                </div>
            </td>
            <td>
                <select class="damage-kind-select" aria-label="伤害属性" onchange="dataHandler.updateDamageKind(${rowData.id}, this.value)">
                    <option value="all" ${rowData.damageKind === 'all' ? 'selected' : ''}>待选择</option>
                    <option value="physical" ${rowData.damageKind === 'physical' ? 'selected' : ''}>物理</option>
                    <option value="magic" ${rowData.damageKind === 'magic' ? 'selected' : ''}>魔法</option>
                </select>
            </td>
            <td>
                <div class="interactive-cell type1" id="type1-${rowData.id}">
                    <!-- 乘法减伤技能将动态生成 -->
                </div>
            </td>
            <td>
                <div class="interactive-cell type2" id="type2-${rowData.id}">
                    <!-- 减法减伤技能将动态生成 -->
                </div>
            </td>
            <td class="summary-cell" id="summary-${rowData.id}">
                ${this.createSummaryMarkup(rowData.summary)}
            </td>
            <td style="text-align: center;">
                <button class="btn btn-danger btn-sm" onclick="dataHandler.deleteRow(${rowData.id})">删除</button>
            </td>
        `;

        tbody.appendChild(tr);

        // 初始化交互元素
        this.initInteractiveElements(rowData);
    }

    /**
     * 初始化交互元素
     * @param {Object} rowData - 行数据对象
     */
    initInteractiveElements(rowData) {
        const skills = dataManager.getEffectiveSkills(rowData);

        // 渲染type1技能 (乘法减伤)
        this.renderSkillsByType(rowData.id, 1, skills);

        // 渲染type2技能 (减法减伤)
        this.renderSkillsByType(rowData.id, 2, skills);
    }

    /**
     * 根据type渲染技能
     * @param {number} rowId - 行ID
     * @param {number} type - 技能类型
     * @param {Object} skills - 技能状态字典
     */
    renderSkillsByType(rowId, type, skills) {
        const container = document.getElementById(`type${type}-${rowId}`);
        container.innerHTML = '';

        const skillNames = this.getSkillNamesByType(type);

        skillNames.forEach((skillName) => {
            const config = this.skillsConfig[skillName];
            const isActive = Boolean(skills[skillName]);

            // 获取图片文件名（去除数字后缀，如"血仇1" -> "血仇.png"）
            const imageName = this.getSkillImageName(skillName);

            const element = this.createInteractionElement(
                rowId,
                skillName,
                `figs/skills/${imageName}`,
                skillName,
                () => interactionHandler.handleSkillInteraction(rowId, skillName)
            );

            if (isActive) {
                element.classList.add('active');
            }

            container.appendChild(element);
        });
    }

    /**
     * 获取技能图片文件名
     * @param {string} skillName - 技能名称
     * @returns {string} 图片文件名
     */
    getSkillImageName(skillName) {
        // 去除数字后缀（例如："血仇1" -> "血仇.png"）
        const baseName = skillName.replace(/\d+$/, '');
        const imageAliases = {
            '扩散盾': '展开战术'
        };

        if (imageAliases[baseName]) {
            return `${imageAliases[baseName]}.png`;
        }

        return `${baseName}.png`;
    }

    /**
     * 创建交互元素
     * @param {number} rowId - 行ID
     * @param {string} skillName - 技能名称
     * @param {string} imgSrc - 图片路径
     * @param {string} altText - 替代文本
     * @param {Function} clickHandler - 点击事件处理器
     * @returns {HTMLElement} 交互元素
     */
    createInteractionElement(rowId, skillName, imgSrc, altText, clickHandler) {
        const element = document.createElement('div');
        element.className = 'interaction-state';
        element.id = `skill-${rowId}-${skillName}`;  // 使用 rowId + skillName 确保唯一性
        element.style.marginRight = '4px';
        element.style.marginBottom = '4px';
        element.title = this.getSkillTooltip(skillName);

        const img = document.createElement('img');
        img.src = imgSrc;
        img.alt = altText;
        img.onerror = () => {
            element.classList.add('missing-icon');
            const fallback = document.createElement('span');
            fallback.className = 'skill-fallback';
            fallback.textContent = this.getFallbackLabel(skillName);
            element.replaceChildren(fallback);
        };
        element.appendChild(img);

        element.onclick = clickHandler;

        return element;
    }

    /**
     * 获取技能提示文案
     * @param {string} skillName - 技能名称
     * @returns {string} tooltip文案
     */
    getSkillTooltip(skillName) {
        const config = this.skillsConfig[skillName] || {};
        const baseName = config.baseName || skillName.replace(/\d+$/, '');
        const sourceJob = config.sourceJob ? ` / ${config.sourceJob.toUpperCase()}` : '';
        const cooldown = Number.isFinite(config.cooldown) ? ` / CD ${config.cooldown}s` : '';
        const effect = config.effect ? `\n${config.effect}` : '';

        return `${skillName}${sourceJob}${cooldown}${effect || `\n${baseName}`}`;
    }

    getFallbackLabel(skillName) {
        const baseName = (this.skillsConfig[skillName]?.baseName || skillName).replace(/\d+$/, '');
        return baseName.length <= 2 ? baseName : baseName.slice(0, 2);
    }

    escapeHtml(value) {
        return String(value).replace(/[&<>'"]/g, character => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        })[character]);
    }

    createSummaryMarkup(value) {
        const damage = Number(value) || 0;
        const low = damage * 0.95;
        const high = damage * 1.05;

        return `
            <div class="summary-value">${damage.toFixed(2)}</div>
            <div class="summary-range">-5% ${low.toFixed(2)} / +5% ${high.toFixed(2)}</div>
        `;
    }

    /**
     * 更新总结显示
     * @param {number} rowId - 行ID
     * @param {number} value - 总结值
     */
    updateSummary(rowId, value) {
        const summaryElement = document.getElementById(`summary-${rowId}`);
        if (summaryElement) {
            summaryElement.innerHTML = this.createSummaryMarkup(value);
        }
    }

    /**
     * 更新技能状态显示
     * @param {number} rowId - 行ID
     * @param {string} skillName - 技能名称
     * @param {boolean} isActive - 是否激活
     */
    updateSkillState(rowId, skillName, isActive) {
        const element = document.getElementById(`skill-${rowId}-${skillName}`);
        if (element) {
            if (isActive) {
                element.classList.add('active');
            } else {
                element.classList.remove('active');
            }
        }
    }

    /**
     * 移除行DOM
     * @param {number} rowId - 行ID
     */
    removeRow(rowId) {
        const row = document.getElementById(`row-${rowId}`);
        if (row) {
            row.remove();
        }
    }
}

// 导出单例
const uiRenderer = new UIRenderer();
