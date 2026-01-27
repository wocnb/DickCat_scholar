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
     * 验证配置数据格式（支持字典格式和数组格式）
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
            if (!item.hasOwnProperty('string') ||
                !item.hasOwnProperty('chineseText') ||
                !item.hasOwnProperty('number') ||
                !item.hasOwnProperty('type1States') ||
                !item.hasOwnProperty('type2States')) {
                console.error(`配置项 ${i} 缺少必要字段`, item);
                return false;
            }

            // 验证 type1States（支持字典和数组格式）
            const isType1Dict = this.isDictFormat(item.type1States);
            if (isType1Dict) {
                // 字典格式：检查包含所有必需的技能键
                if (window.SKILL_CONSTANTS && window.SKILL_CONSTANTS.TYPE1_SKILLS) {
                    const requiredSkills = window.SKILL_CONSTANTS.TYPE1_SKILLS;
                    for (const skill of requiredSkills) {
                        if (!item.type1States.hasOwnProperty(skill)) {
                            console.error(`配置项 ${i} 的 type1States 缺少技能键: ${skill}`);
                            return false;
                        }
                    }
                }
            } else if (Array.isArray(item.type1States)) {
                // 数组格式：检查长度
                if (item.type1States.length !== 13) {
                    console.error(`配置项 ${i} 的 type1States 数组必须包含13个元素`);
                    return false;
                }
            } else {
                console.error(`配置项 ${i} 的 type1States 格式无效`);
                return false;
            }

            // 验证 type2States（支持字典和数组格式）
            const isType2Dict = this.isDictFormat(item.type2States);
            if (isType2Dict) {
                // 字典格式：检查包含所有必需的技能键
                if (window.SKILL_CONSTANTS && window.SKILL_CONSTANTS.TYPE2_SKILLS) {
                    const requiredSkills = window.SKILL_CONSTANTS.TYPE2_SKILLS;
                    for (const skill of requiredSkills) {
                        if (!item.type2States.hasOwnProperty(skill)) {
                            console.error(`配置项 ${i} 的 type2States 缺少技能键: ${skill}`);
                            return false;
                        }
                    }
                }
            } else if (Array.isArray(item.type2States)) {
                // 数组格式：检查长度
                if (item.type2States.length !== 3) {
                    console.error(`配置项 ${i} 的 type2States 数组必须包含3个元素`);
                    return false;
                }
            } else {
                console.error(`配置项 ${i} 的 type2States 格式无效`);
                return false;
            }
        }

        return true;
    }

    /**
     * 将配置数据转换为表格数据格式
     * @param {Array} configData - 配置数据
     * @returns {Array} 表格数据
     */
    configToTableData(configData) {
        return configData.map((item, index) => ({
            id: index,
            string: item.string || '',
            chineseText: item.chineseText || '',
            number: item.number || '',
            type1States: item.type1States.map((active, i) => ({ id: i, active })),
            type2States: item.type2States.map((active, i) => ({ id: i, active })),
            summary: item.summary || 0
        }));
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
