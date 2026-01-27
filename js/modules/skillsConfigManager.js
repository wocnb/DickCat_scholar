/**
 * 技能配置管理器（简化版）
 * 只提供更新技能和恢复默认配置两个功能
 */
class SkillsConfigManager {
    constructor() {
        // 从全局配置初始化
        this.config = window.SKILL_CONSTANTS?.SKILLS_CONFIG || {};
        // 当前启用的职业（用于过滤技能）
        this.activeJobs = [];
        // 是否启用职业过滤模式
        this.jobFilterMode = false;
    }

    /**
     * 更新技能配置
     * @param {string} skillName - 技能名称
     * @param {Object} skillConfig - 新的技能配置
     * @returns {boolean} 是否更新成功
     */
    updateSkill(skillName, skillConfig) {
        // 检查技能是否存在
        if (!this.config[skillName]) {
            console.error(`技能 "${skillName}" 不存在`);
            return false;
        }

        // 验证配置对象
        if (!this.validateSkillConfig(skillConfig)) {
            return false;
        }

        // 更新配置
        this.config[skillName] = {
            cooldown: Number(skillConfig.cooldown) || 0,
            type: Number(skillConfig.type),
            coefficient: Number(skillConfig.coefficient),
            jobs: skillConfig.jobs || [] // 保留jobs字段
        };

        // 更新全局配置
        this.updateGlobalConfig();

        // 通知订阅者
        this.notifySubscribers('update', skillName, this.config[skillName]);

        console.log(`✓ 技能 "${skillName}" 已更新`);
        return true;
    }

    /**
     * 重置为默认配置
     */
    resetToDefault() {
        // 从全局常量重新加载默认配置
        if (window.DEFAULT_SKILLS_CONFIG) {
            this.config = { ...window.DEFAULT_SKILLS_CONFIG };
            this.updateGlobalConfig();
            this.notifySubscribers('reset', null, this.config);
            console.log('✓ 已重置为默认配置');
        } else {
            console.error('未找到默认配置');
        }
    }

    /**
     * 根据职业更新技能配置
     * @param {string|Array<string>} jobIds - 单个职业ID或职业ID数组
     */
    updateConfigByJob(jobIds) {
        const jobs = Array.isArray(jobIds) ? jobIds : [jobIds];
        this.activeJobs = jobs;
        this.jobFilterMode = true;

        // 使用新的函数生成技能配置
        if (window.SKILL_CONSTANTS?.updateSkillsConfigByJobs) {
            this.config = window.SKILL_CONSTANTS.updateSkillsConfigByJobs(jobs);
            this.updateGlobalConfig();
            this.notifySubscribers('job-filter', jobs, this.config);
        } else {
            console.error('updateSkillsConfigByJobs 函数不存在');
        }
    }

    /**
     * 禁用职业过滤，恢复所有技能
     */
    disableJobFilter() {
        this.jobFilterMode = false;
        this.activeJobs = [];

        if (window.DEFAULT_SKILLS_CONFIG) {
            this.config = { ...window.DEFAULT_SKILLS_CONFIG };
            this.updateGlobalConfig();
            this.notifySubscribers('job-filter-disabled', null, this.config);
            console.log('✓ 已禁用职业过滤，恢复所有技能');
        }
    }

    /**
     * 获取当前配置的技能名称列表
     * @returns {Array<string>} 技能名称数组
     */
    getActiveSkillNames() {
        return Object.keys(this.config);
    }

    /**
     * 检查技能是否在当前配置中
     * @param {string} skillName - 技能名称
     * @returns {boolean} 是否可用
     */
    isSkillActive(skillName) {
        return this.config.hasOwnProperty(skillName);
    }

    /**
     * 验证技能配置对象
     * @param {Object} skillConfig - 技能配置
     * @returns {boolean} 是否有效
     */
    validateSkillConfig(skillConfig) {
        if (!skillConfig || typeof skillConfig !== 'object') {
            console.error('技能配置必须是对象');
            return false;
        }

        // 验证 cooldown
        if (typeof skillConfig.cooldown !== 'number' && typeof skillConfig.cooldown !== 'string') {
            console.error('cooldown 必须是数字');
            return false;
        }

        const cooldown = Number(skillConfig.cooldown);
        if (isNaN(cooldown) || cooldown < 0) {
            console.error('cooldown 必须是非负数');
            return false;
        }

        // 验证 type
        if (skillConfig.type !== 1 && skillConfig.type !== 2) {
            console.error('type 必须是 1 或 2');
            return false;
        }

        // 验证 coefficient
        if (typeof skillConfig.coefficient !== 'number' && typeof skillConfig.coefficient !== 'string') {
            console.error('coefficient 必须是数字');
            return false;
        }

        const coefficient = Number(skillConfig.coefficient);
        if (isNaN(coefficient)) {
            console.error('coefficient 必须是有效数字');
            return false;
        }

        return true;
    }

    /**
     * 更新全局配置
     */
    updateGlobalConfig() {
        if (window.SKILL_CONSTANTS) {
            // 更新当前技能配置
            window.SKILL_CONSTANTS.SKILLS_CONFIG = { ...this.config };

            // 更新辅助函数
            if (window.SKILL_CONSTANTS.getSkillNamesByType) {
                const self = this;
                window.SKILL_CONSTANTS.getSkillNamesByType = function(type) {
                    return Object.keys(self.config).filter(skillName =>
                        self.config[skillName].type === type
                    );
                };
            }

            if (window.SKILL_CONSTANTS.getSkillConfig) {
                window.SKILL_CONSTANTS.getSkillConfig = (skillName) => this.config[skillName];
            }

            if (window.SKILL_CONSTANTS.createEmptySkillsDict) {
                window.SKILL_CONSTANTS.createEmptySkillsDict = () => {
                    const dict = {};
                    Object.keys(this.config).forEach(skillName => {
                        dict[skillName] = false;
                    });
                    return dict;
                };
            }

            console.log('✓ 全局配置已更新');
        }
    }

    /**
     * 订阅配置变化
     * @param {Function} callback - 回调函数 (action, skillName, config)
     * @returns {Function} 取消订阅函数
     */
    subscribe(callback) {
        if (!this.subscribers) {
            this.subscribers = [];
        }

        if (typeof callback !== 'function') {
            console.error('回调必须是函数');
            return null;
        }

        this.subscribers.push(callback);

        // 返回取消订阅函数
        return () => {
            const index = this.subscribers.indexOf(callback);
            if (index > -1) {
                this.subscribers.splice(index, 1);
            }
        };
    }

    /**
     * 通知所有订阅者
     * @param {string} action - 动作类型
     * @param {string} skillName - 技能名称
     * @param {*} data - 相关数据
     */
    notifySubscribers(action, skillName, data) {
        if (!this.subscribers) return;

        this.subscribers.forEach(callback => {
            try {
                callback(action, skillName, data);
            } catch (error) {
                console.error('订阅者回调出错:', error);
            }
        });
    }
}

// 导出单例
const skillsConfigManager = new SkillsConfigManager();
