/**
 * 主入口文件
 * 负责初始化和全局API暴露
 * 拆解自 index.html (第428-432行, 877-888行)
 */

class App {
    constructor() {
        this.initialized = false;
    }

    /**
     * 初始化应用
     */
    async init() {
        if (this.initialized) return;

        console.log('初始化交互式表格应用...');

        // 0. 保存默认技能配置
        if (window.SKILL_CONSTANTS && window.SKILL_CONSTANTS.DEFAULT_SKILLS_CONFIG) {
            window.DEFAULT_SKILLS_CONFIG = JSON.parse(
                JSON.stringify(window.SKILL_CONSTANTS.DEFAULT_SKILLS_CONFIG)
            );
            console.log('✓ 默认技能配置已保存');
        }

        // 订阅技能配置变化
        if (window.skillsConfigManager) {
            window.skillsConfigManager.subscribe((action, skillName, data) => {
                console.log(`技能配置变化: ${action} - ${skillName}`);
                // 当技能配置变化时，重新渲染所有行的技能按钮
                this.refreshAllSkills();
            });
        }

        // 1. 自动加载所有配置文件
        if (window.AUTO_CONFIG_LOADER) {
            try {
                const loadResults = await window.AUTO_CONFIG_LOADER.loadAll();
                console.log('配置加载结果:', loadResults);
            } catch (error) {
                console.error('配置自动加载失败:', error);
            }
        }

        // 2. 自动填充下拉菜单
        if (window.AUTO_CONFIG_LOADER) {
            try {
                const configs = window.AUTO_CONFIG_LOADER.populateSelector();
                console.log('下拉菜单填充完成:', configs);
            } catch (error) {
                console.error('下拉菜单填充失败:', error);
            }
        }

        // 3. 加载保存的职业选择并应用技能过滤
        if (window.loadJobSelectionFromStorage) {
            const savedJobs = window.loadJobSelectionFromStorage();
            if (savedJobs) {
                const selectedJobs = Object.values(savedJobs);
                console.log('✓ 已加载保存的职业配置:', selectedJobs);
                // 根据职业生成技能配置
                if (window.SKILL_CONSTANTS?.updateSkillsConfigByJobs) {
                    window.SKILL_CONSTANTS.updateSkillsConfigByJobs(selectedJobs);
                }
            }
        }

        // 4. 添加默认行
        dataHandler.addRow();
        dataHandler.addRow();
        dataHandler.addRow();

        this.initialized = true;
        console.log('应用初始化完成');
    }

    /**
     * 刷新所有行的技能按钮
     */
    refreshAllSkills() {
        const allData = dataManager.getAllData();
        allData.forEach(rowData => {
            // 重新渲染技能按钮
            const tbody = document.getElementById('tableBody');
            const existingRow = document.getElementById(`row-${rowData.id}`);
            if (existingRow) {
                existingRow.remove();
            }
            uiRenderer.renderRow(rowData);
        });
        console.log('✓ 所有行的技能按钮已刷新');
    }
}

// 创建应用实例
const app = new App();

// 页面加载完成后初始化
window.onload = async function() {
    await app.init();
};

/**
 * 暴露全局API供外部扩展使用
 */
window.TableAPI = {
    /**
     * 添加更多交互元素
     * @param {number} rowId - 行ID
     * @param {number} type - 交互类型（1或2）
     * @param {number} count - 要添加的数量
     */
    addInteractiveElements: (rowId, type, count) => {
        const rowData = dataManager.getRow(rowId);
        if (rowData) {
            uiRenderer.addInteractiveElements(rowData, type, count);
        }
    },

    /**
     * 获取表格数据
     * @returns {Array} 表格数据的深拷贝
     */
    getTableData: () => {
        return JSON.parse(JSON.stringify(dataManager.getAllData()));
    },

    /**
     * 更新总结计算逻辑
     * @param {Function} newLogic - 新的计算逻辑函数
     * @returns {Function} 原始计算逻辑
     */
    updateSummaryLogic: (newLogic) => {
        const originalCalculate = (rowId) => calculator.calculateSummary(dataManager.getRow(rowId));
        // 允许外部注入自定义逻辑
        window.customCalculateSummary = newLogic;
        return originalCalculate;
    },

    /**
     * 导出数据
     */
    exportData: () => {
        exportManager.exportData();
    },

    /**
     * 添加新行
     */
    addRow: () => {
        dataHandler.addRow();
    },

    /**
     * 清空表格
     */
    clearAll: () => {
        dataHandler.clearAll();
    },

    /**
     * 更新计算系数
     * @param {number} type - 类型（1或2）
     * @param {Array} coefficients - 新的系数数组
     */
    updateCoefficients: (type, coefficients) => {
        if (type === 1) {
            calculator.updateType1Coefficients(coefficients);
        } else if (type === 2) {
            calculator.updateType2Coefficients(coefficients);
        }
    },

    /**
     * 加载配置文件
     * @param {string} filename - 配置文件名
     * @returns {Promise} 加载结果
     */
    loadConfig: async (filename) => {
        return await configHandler.onConfigChange(filename);
    },

    /**
     * 获取可用配置列表
     * @returns {Array} 配置列表
     */
    getAvailableConfigs: () => {
        return configHandler.getAvailableConfigs();
    },

    /**
     * 获取当前加载的配置
     * @returns {string|null} 配置文件名
     */
    getCurrentConfig: () => {
        return configHandler.getCurrentConfig();
    },

    /**
     * 刷新配置选择器
     */
    refreshConfigs: async () => {
        await configHandler.refreshConfigSelector();
    },

    /**
     * 技能配置管理API（简化版）
     */
    skills: {
        /**
         * 更新技能配置
         */
        update: (skillName, skillConfig) => {
            return skillsConfigManager.updateSkill(skillName, skillConfig);
        },

        /**
         * 重置为默认配置
         */
        reset: () => {
            skillsConfigManager.resetToDefault();
        }
    }
};

// 导出到全局作用域（供HTML中的事件处理器使用）
window.dataHandler = dataHandler;
window.validator = validator;
window.interactionHandler = interactionHandler;
window.configHandler = configHandler;
window.configLoader = configLoader;
window.skillsConfigManager = skillsConfigManager;
window.jobSelector = jobSelector;

