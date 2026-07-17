/**
 * 交互处理模块
 * 使用技能名称作为key进行交互
 */
class InteractionHandler {
    /**
     * 处理技能点击事件
     * @param {number} rowId - 行ID
     * @param {string} skillName - 技能名称
     */
    handleSkillInteraction(rowId, skillName) {
        const rowData = dataManager.getRow(rowId);
        if (!rowData) return;

        const skills = rowData.skills || {};

        // 切换技能状态
        skills[skillName] = !skills[skillName];

        console.log(`交互 - 行${rowId}, 技能"${skillName}", 状态: ${skills[skillName]}`);

        // 更新UI
        uiRenderer.updateSkillState(rowId, skillName, skills[skillName]);

        // 更新总结
        dataHandler.calculateAndUpdateSummary(rowId);
    }
}

// 导出单例
const interactionHandler = new InteractionHandler();
