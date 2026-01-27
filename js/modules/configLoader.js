/**
 * 配置加载器模块
 * 负责从全局配置对象读取配置数据（通过 script 标签加载）
 */

class ConfigLoader {
    constructor() {
        this.currentConfig = null;
    }

    /**
     * 获取所有已加载的配置列表
     * @returns {Array} 配置文件列表
     */
    fetchAvailableConfigs() {
        // 从全局配置对象中获取已加载的配置
        const configs = [];

        if (window.TABLE_CONFIGS) {
            for (const [key, config] of Object.entries(window.TABLE_CONFIGS)) {
                configs.push({
                    name: key,
                    displayName: config.meta.displayName || key,
                    file: key,
                    version: config.meta.version,
                    dataCount: config.data.length
                });
            }
        }

        this.availableConfigs = configs;
        console.log('已加载的配置:', configs);
        return configs;
    }

    /**
     * 加载指定的配置
     * @param {string} configKey - 配置键名（如 'm12s'）
     * @returns {Array} 配置数据
     */
    loadConfig(configKey) {
        return new Promise((resolve, reject) => {
            try {
                // 检查全局配置是否存在
                if (!window.TABLE_CONFIGS || !window.TABLE_CONFIGS[configKey]) {
                    throw new Error(
                        `配置 "${configKey}" 未找到。` +
                        `请确保在 HTML 中加载了对应的配置文件。` +
                        `可用配置: ${this.getAvailableConfigKeys().join(', ') || '无'}`
                    );
                }

                const config = window.TABLE_CONFIGS[configKey];
                const configData = config.data;

                this.currentConfig = {
                    key: configKey,
                    meta: config.meta,
                    data: configData,
                    loadedAt: new Date().toISOString()
                };

                console.log(`配置加载成功: ${configKey}`, {
                    meta: config.meta,
                    dataCount: configData.length
                });

                resolve(configData);
            } catch (error) {
                console.error('加载配置时出错:', error);
                reject(error);
            }
        });
    }

    /**
     * 获取当前配置
     * @returns {Object|null} 当前配置对象
     */
    getCurrentConfig() {
        return this.currentConfig;
    }

    /**
     * 获取可用配置列表
     * @returns {Array} 配置列表
     */
    getAvailableConfigs() {
        return this.availableConfigs || this.fetchAvailableConfigs();
    }

    /**
     * 获取所有可用的配置键名
     * @returns {Array} 配置键名数组
     */
    getAvailableConfigKeys() {
        if (!window.TABLE_CONFIGS) return [];
        return Object.keys(window.TABLE_CONFIGS);
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
     * 验证配置数据格式（使用新的 skills 字典格式）
     * @param {Array} configData - 配置数据
     * @returns {boolean} 是否有效
     */
    validateConfig(configData) {
        if (!Array.isArray(configData)) {
            console.error('配置数据必须是数组');
            return false;
        }

        for (let i = 0; i < configData.length; i++) {
            const item = configData[i];

            // 检查基本字段
            if (!item.hasOwnProperty('string') ||
                !item.hasOwnProperty('chineseText') ||
                !item.hasOwnProperty('number')) {
                console.error(`配置项 ${i} 缺少必要字段`, item);
                return false;
            }

            // 检查 skills 字段（新格式）
            if (!item.hasOwnProperty('skills')) {
                console.error(`配置项 ${i} 缺少 skills 字段`, item);
                return false;
            }

            // 验证 skills 是字典格式
            if (!this.isDictFormat(item.skills)) {
                console.error(`配置项 ${i} 的 skills 必须是字典格式`, item);
                return false;
            }

            // 验证 skills 中的技能是否在配置中
            if (window.SKILL_CONSTANTS && window.SKILL_CONSTANTS.SKILLS_CONFIG) {
                const validSkills = window.SKILL_CONSTANTS.SKILLS_CONFIG;
                for (const skillName in item.skills) {
                    if (!validSkills.hasOwnProperty(skillName)) {
                        console.warn(`配置项 ${i} 包含未定义的技能: ${skillName}`);
                    }
                }
            }
        }

        return true;
    }

    /**
     * 检查配置是否已加载
     * @param {string} configKey - 配置键名
     * @returns {boolean} 是否已加载
     */
    isConfigLoaded(configKey) {
        return window.TABLE_CONFIGS && !!window.TABLE_CONFIGS[configKey];
    }

    /**
     * 获取配置元数据
     * @param {string} configKey - 配置键名
     * @returns {Object|null} 配置元数据
     */
    getConfigMeta(configKey) {
        if (!this.isConfigLoaded(configKey)) {
            return null;
        }
        return window.TABLE_CONFIGS[configKey].meta;
    }
}

// 导出单例
const configLoader = new ConfigLoader();
