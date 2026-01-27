/**
 * UI 渲染模块
 * 负责表格行的渲染和交互元素的初始化
 * 支持字典格式和数组格式的状态数据
 */

class UIRenderer {
    constructor() {
        // 从技能常量获取技能列表
        this.type1Skills = window.SKILL_CONSTANTS?.TYPE1_SKILLS || [];
        this.type2Skills = window.SKILL_CONSTANTS?.TYPE2_SKILLS || [];
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
                        placeholder="请输入中文"
                        value="${rowData.chineseText || ''}"
                        oninput="validator.validateAndUpdate(${rowData.id}, 'chinese')"
                        onblur="dataHandler.updateData(${rowData.id})"
                    >
                    <div class="error-message" id="chinese-error-${rowData.id}">只能输入中文字符</div>
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
                <div class="interactive-cell type1" id="type1-${rowData.id}">
                    <!-- 交互类型1的元素将动态生成 -->
                </div>
            </td>
            <td>
                <div class="interactive-cell type2" id="type2-${rowData.id}">
                    <!-- 交互类型2的元素将动态生成 -->
                </div>
            </td>
            <td class="summary-cell" id="summary-${rowData.id}">
                ${rowData.summary ? rowData.summary.toFixed(2) : '0'}
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
        // 初始化交互类型1的元素（使用技能常量）
        this.initType1Elements(rowData);

        // 初始化交互类型2的元素（使用技能常量）
        this.initType2Elements(rowData);
    }

    /**
     * 判断是否为字典格式
     * @param {*} states - 状态数据
     * @returns {boolean} 是否为字典格式
     */
    isDictFormat(states) {
        return states && typeof states === 'object' && !Array.isArray(states);
    }

    /**
     * 初始化类型1交互元素（支持字典和数组格式）
     * @param {Object} rowData - 行数据对象
     */
    initType1Elements(rowData) {
        const type1Container = document.getElementById(`type1-${rowData.id}`);
        type1Container.innerHTML = '';

        // 如果没有技能常量，使用默认的13个元素
        const skillCount = this.type1Skills.length || 13;
        const skills = this.type1Skills.length > 0 ? this.type1Skills : null;
        const isDict = this.isDictFormat(rowData.type1States);

        if (isDict && skills) {
            // 字典格式：遍历技能名称
            skills.forEach((skillName, index) => {
                const isActive = Boolean(rowData.type1States[skillName]);

                const element = this.createInteractionElement(
                    `type1-${rowData.id}-${index}`,
                    `figs/type1/${index + 1}.png`,
                    skillName,  // 使用技能名称作为提示文本
                    () => interactionHandler.handleType1Interaction(rowData.id, skillName)
                );

                if (isActive) {
                    element.classList.add('active');
                }

                type1Container.appendChild(element);
            });
        } else {
            // 数组格式：向后兼容
            const statesArray = rowData.type1States || [];

            for (let i = 0; i < skillCount; i++) {
                // 如果状态不存在，创建默认状态
                if (!statesArray[i]) {
                    statesArray[i] = { id: i, active: false };
                }

                const element = this.createInteractionElement(
                    `type1-${rowData.id}-${i}`,
                    `figs/type1/${i + 1}.png`,
                    skills ? skills[i] : `类型1-选项${i + 1}`,
                    () => interactionHandler.handleType1Interaction(rowData.id, i)
                );

                if (statesArray[i].active) {
                    element.classList.add('active');
                }

                type1Container.appendChild(element);
            }
        }
    }

    /**
     * 初始化类型2交互元素（支持字典和数组格式）
     * @param {Object} rowData - 行数据对象
     */
    initType2Elements(rowData) {
        const type2Container = document.getElementById(`type2-${rowData.id}`);
        type2Container.innerHTML = '';

        // 如果没有技能常量，使用默认的3个元素
        const skillCount = this.type2Skills.length || 3;
        const skills = this.type2Skills.length > 0 ? this.type2Skills : null;
        const isDict = this.isDictFormat(rowData.type2States);

        if (isDict && skills) {
            // 字典格式：遍历技能名称
            skills.forEach((skillName, index) => {
                const isActive = Boolean(rowData.type2States[skillName]);

                const element = this.createInteractionElement(
                    `type2-${rowData.id}-${index}`,
                    `figs/type2/${index + 1}.png`,
                    skillName,  // 使用技能名称作为提示文本
                    () => interactionHandler.handleType2Interaction(rowData.id, skillName)
                );

                if (isActive) {
                    element.classList.add('active');
                }

                type2Container.appendChild(element);
            });
        } else {
            // 数组格式：向后兼容
            const statesArray = rowData.type2States || [];

            for (let i = 0; i < skillCount; i++) {
                // 如果状态不存在，创建默认状态
                if (!statesArray[i]) {
                    statesArray[i] = { id: i, active: false };
                }

                const element = this.createInteractionElement(
                    `type2-${rowData.id}-${i}`,
                    `figs/type2/${i + 1}.png`,
                    skills ? skills[i] : `类型2-选项${i + 1}`,
                    () => interactionHandler.handleType2Interaction(rowData.id, i)
                );

                if (statesArray[i].active) {
                    element.classList.add('active');
                }

                type2Container.appendChild(element);
            }
        }
    }

    /**
     * 创建交互元素
     * @param {string} id - 元素ID
     * @param {string} imgSrc - 图片路径
     * @param {string} altText - 替代文本（技能名称）
     * @param {Function} clickHandler - 点击事件处理器
     * @returns {HTMLElement} 交互元素
     */
    createInteractionElement(id, imgSrc, altText, clickHandler) {
        const element = document.createElement('div');
        element.className = 'interaction-state';
        element.id = id;
        element.style.marginRight = '4px';
        element.style.marginBottom = '4px';

        const img = document.createElement('img');
        img.src = imgSrc;
        img.alt = altText;
        element.appendChild(img);

        element.onclick = clickHandler;

        return element;
    }

    /**
     * 更新总结显示
     * @param {number} rowId - 行ID
     * @param {number} value - 总结值
     */
    updateSummary(rowId, value) {
        const summaryElement = document.getElementById(`summary-${rowId}`);
        if (summaryElement) {
            summaryElement.textContent = value.toFixed(2);
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

    /**
     * 添加更多交互元素（扩展功能）
     * @param {Object} rowData - 行数据对象
     * @param {number} type - 交互类型（1或2）
     * @param {number} count - 要添加的数量
     */
    addInteractiveElements(rowData, type, count) {
        const container = document.getElementById(`type${type}-${rowData.id}`);
        const isDict = this.isDictFormat(
            type === 1 ? rowData.type1States : rowData.type2States
        );

        if (isDict) {
            console.warn('字典格式不支持动态添加元素');
            return;
        }

        const statesArray = type === 1 ? rowData.type1States : rowData.type2States;

        for (let i = 0; i < count; i++) {
            const newId = statesArray.length;
            const state = { id: newId, active: false };
            statesArray.push(state);

            const element = this.createInteractionElement(
                `type${type}-${rowData.id}-${newId}`,
                `figs/type${type}/${newId + 1}.png`,
                `类型${type}-选项${newId + 1}`,
                () => {
                    if (type === 1) {
                        interactionHandler.handleType1Interaction(rowData.id, newId);
                    } else {
                        interactionHandler.handleType2Interaction(rowData.id, newId);
                    }
                }
            );

            container.appendChild(element);
        }
    }
}

// 导出单例
const uiRenderer = new UIRenderer();
