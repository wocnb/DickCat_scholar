/**
 * 交互处理模块
 * 负责处理用户点击交互元素的事件
 * 支持字典格式和数组格式的状态数据
 */

class InteractionHandler {
    /**
     * 判断是否为字典格式
     * @param {*} states - 状态数据
     * @returns {boolean} 是否为字典格式
     */
    isDictFormat(states) {
        return states && typeof states === 'object' && !Array.isArray(states);
    }

    /**
     * 处理交互类型1的点击事件（支持字典和数组格式）
     * @param {number} rowId - 行ID
     * @param {string|number} elementId - 元素索引或技能名称
     */
    handleType1Interaction(rowId, elementId) {
        const rowData = dataManager.getRow(rowId);
        if (!rowData) return;

        const isDict = this.isDictFormat(rowData.type1States);
        let isActive;
        let elementIndex;

        if (isDict) {
            // 字典格式：elementId 是技能名称
            const skillName = elementId;
            isActive = !rowData.type1States[skillName];
            rowData.type1States[skillName] = isActive;

            // 获取技能索引用于更新UI
            if (window.SKILL_CONSTANTS) {
                elementIndex = window.SKILL_CONSTANTS.TYPE1_SKILLS.indexOf(skillName);
            } else {
                elementIndex = 0; // fallback
            }

            console.log(`交互类型1 - 行${rowId}, 技能"${skillName}", 状态: ${isActive}`);
        } else {
            // 数组格式：elementId 是数组索引
            elementIndex = elementId;
            isActive = !rowData.type1States[elementIndex].active;
            rowData.type1States[elementIndex].active = isActive;

            console.log(`交互类型1 - 行${rowId}, 元素${elementIndex}, 状态: ${isActive}`);
        }

        // 更新UI
        this.updateElementState(`type1-${rowId}-${elementIndex}`, isActive);

        // 更新总结
        dataHandler.calculateAndUpdateSummary(rowId);
    }

    /**
     * 处理交互类型2的点击事件（支持字典和数组格式）
     * @param {number} rowId - 行ID
     * @param {string|number} elementId - 元素索引或技能名称
     */
    handleType2Interaction(rowId, elementId) {
        const rowData = dataManager.getRow(rowId);
        if (!rowData) return;

        const isDict = this.isDictFormat(rowData.type2States);
        let isActive;
        let elementIndex;

        if (isDict) {
            // 字典格式：elementId 是技能名称
            const skillName = elementId;
            isActive = !rowData.type2States[skillName];
            rowData.type2States[skillName] = isActive;

            // 获取技能索引用于更新UI
            if (window.SKILL_CONSTANTS) {
                elementIndex = window.SKILL_CONSTANTS.TYPE2_SKILLS.indexOf(skillName);
            } else {
                elementIndex = 0; // fallback
            }

            console.log(`交互类型2 - 行${rowId}, 技能"${skillName}", 状态: ${isActive}`);
        } else {
            // 数组格式：elementId 是数组索引
            elementIndex = elementId;
            isActive = !rowData.type2States[elementIndex].active;
            rowData.type2States[elementIndex].active = isActive;

            console.log(`交互类型2 - 行${rowId}, 元素${elementIndex}, 状态: ${isActive}`);
        }

        // 更新UI
        this.updateElementState(`type2-${rowId}-${elementIndex}`, isActive);

        // 更新总结
        dataHandler.calculateAndUpdateSummary(rowId);
    }

    /**
     * 更新元素状态
     * @param {string} elementId - 元素ID
     * @param {boolean} isActive - 是否激活
     */
    updateElementState(elementId, isActive) {
        const element = document.getElementById(elementId);
        if (element) {
            if (isActive) {
                element.classList.add('active');
            } else {
                element.classList.remove('active');
            }
        }
    }
}

// 导出单例
const interactionHandler = new InteractionHandler();
