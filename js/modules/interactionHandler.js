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

        const inheritedFrom = dataManager.getInheritedSkillSource(rowData, skillName);
        if (!skills[skillName] && inheritedFrom) {
            alert(`${skillName} 已由 ${inheritedFrom.string} 的施放覆盖。`);
            return;
        }

        if (!skills[skillName]) {
            const schedule = dataManager.getSkillSchedule(rowData, skillName);
            if (!schedule.ready) {
                alert(`${skillName} 仍在冷却中，将于 ${this.formatTimelineTime(schedule.nextReadyAt)} 就绪。`);
                return;
            }
        }

        // 切换技能状态
        skills[skillName] = !skills[skillName];

        console.log(`交互 - 行${rowId}, 技能"${skillName}", 状态: ${skills[skillName]}`);

        dataHandler.refreshTimelineCalculations();
    }

    formatTimelineTime(seconds) {
        return window.fflogsCsvImporter?.formatTimelineTime(seconds) || `${seconds}s`;
    }
}

// 导出单例
const interactionHandler = new InteractionHandler();
