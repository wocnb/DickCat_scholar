/**
 * ============================================================================
 * 技能配置管理
 * 职业技能字典定义在 jobConstants.js 中
 * 这个文件处理技能配置的生成和管理
 * ============================================================================
 */
const DEFAULT_SKILLS_CONFIG = {
    // 乘法减伤技能 (type: 1)
    '血仇1': { cooldown: 60, type: 1, coefficient: 0.90 },
    '牵制1': { cooldown: 60, type: 1, coefficient: 0.95 },
    '血仇2': { cooldown: 60, type: 1, coefficient: 0.90 },
    '牵制2': { cooldown: 60, type: 1, coefficient: 0.95 },
    '病毒': { cooldown: 90, type: 1, coefficient: 0.90 },
    '光之心': { cooldown: 90, type: 1, coefficient: 0.85 },
    '武装戍卫': { cooldown: 90, type: 1, coefficient: 0.80 },
    '幻光': { cooldown: 60, type: 1, coefficient: 0.90 },
    '疾风怒涛': { cooldown: 90, type: 1, coefficient: 0.90 },
    '野战治疗阵': { cooldown: 60, type: 1, coefficient: 0.90 },
    '全大赦': { cooldown: 90, type: 1, coefficient: 0.90 },
    '节制': { cooldown: 120, type: 1, coefficient: 0.90 },
    // 减法减伤技能 (type: 2)
    '圣光幕帘': { cooldown: 30, type: 2, coefficient: 19000 },
    '群盾': { cooldown: 30, type: 2, coefficient: 27000 },
    '扩散盾': { cooldown: 30, type: 2, coefficient: 72000 }
};

/**
 * 当前技能配置（根据选中职业动态生成）
 */
let SKILLS_CONFIG = { ...DEFAULT_SKILLS_CONFIG };

/**
 * ============================================================================
 * 核心功能：根据职业生成技能配置
 * ============================================================================
 */

/**
 * 根据职业生成技能配置（核心函数）
 * @param {string|Array<string>} jobIds - 单个职业ID或职业ID数组
 * @returns {Object} 合并后的技能配置对象
 */
function generateSkillsConfigByJobs(jobIds) {
    const jobs = Array.isArray(jobIds) ? jobIds : [jobIds];
    const mergedConfig = {};

    // 跟踪每个技能名称出现的次数
    const skillNameCounters = {};

    // 遍历每个选中的职业（保持顺序）
    jobs.forEach((jobId, jobIndex) => {
        const jobSkills = JOB_SKILLS_MAP[jobId];
        if (jobSkills) {
            // 合并该职业的所有技能
            Object.keys(jobSkills).forEach(skillName => {
                const skillConfig = { ...jobSkills[skillName] };

                // 初始化计数器
                if (!skillNameCounters[skillName]) {
                    skillNameCounters[skillName] = 0;
                }

                // 增加计数
                skillNameCounters[skillName]++;

                // 如果是第一次出现，使用原名
                if (skillNameCounters[skillName] === 1) {
                    mergedConfig[skillName] = skillConfig;
                } else {
                    // 如果是重复出现，添加数字后缀
                    const newSkillName = `${skillName}${skillNameCounters[skillName]}`;
                    mergedConfig[newSkillName] = skillConfig;
                }
            });
        }
    });

    return mergedConfig;
}

/**
 * 更新当前技能配置（根据职业）
 * @param {string|Array<string>} jobIds - 单个职业ID或职业ID数组
 */
function updateSkillsConfigByJobs(jobIds) {
    const newConfig = generateSkillsConfigByJobs(jobIds);

    // 如果没有选中任何职业或生成的配置为空，使用默认配置
    if (Object.keys(newConfig).length === 0) {
        console.warn('未找到相关技能，使用默认配置');
        SKILLS_CONFIG = { ...DEFAULT_SKILLS_CONFIG };
    } else {
        SKILLS_CONFIG = newConfig;
    }

    // 同步更新全局导出的对象
    if (window.SKILL_CONSTANTS) {
        window.SKILL_CONSTANTS.SKILLS_CONFIG = SKILLS_CONFIG;
    }

    console.log(`✓ 技能配置已根据职业更新:`, Array.isArray(jobIds) ? jobIds.join(', ') : jobIds);
    console.log(`  - 可用技能数:`, Object.keys(SKILLS_CONFIG).length);

    return SKILLS_CONFIG;
}

/**
 * 重置为默认技能配置
 */
function resetSkillsConfig() {
    SKILLS_CONFIG = { ...DEFAULT_SKILLS_CONFIG };

    // 同步更新全局导出的对象
    if (window.SKILL_CONSTANTS) {
        window.SKILL_CONSTANTS.SKILLS_CONFIG = SKILLS_CONFIG;
    }

    console.log('✓ 已重置为默认技能配置');
    return SKILLS_CONFIG;
}

/**
 * ============================================================================
 * 辅助函数
 * ============================================================================
 */

/**
 * 根据type获取技能名称列表
 * @param {number} type - 技能类型
 * @returns {Array<string>} 技能名称数组
 */
function getSkillNamesByType(type) {
    return Object.keys(SKILLS_CONFIG).filter(skillName =>
        SKILLS_CONFIG[skillName].type === type
    );
}

/**
 * 根据职业获取技能名称列表
 * @param {string|Array<string>} jobIds - 单个职业ID或职业ID数组
 * @returns {Array<string>} 技能名称数组
 */
function getSkillNamesByJob(jobIds) {
    const jobs = Array.isArray(jobIds) ? jobIds : [jobIds];
    const skillNames = [];

    jobs.forEach(jobId => {
        const jobSkills = JOB_SKILLS_MAP[jobId];
        if (jobSkills) {
            Object.keys(jobSkills).forEach(skillName => {
                if (!skillNames.includes(skillName)) {
                    skillNames.push(skillName);
                }
            });
        }
    });

    return skillNames;
}

/**
 * 根据职业和类型获取技能名称列表
 * @param {string|Array<string>} jobIds - 单个职业ID或职业ID数组
 * @param {number} type - 技能类型
 * @returns {Array<string>} 技能名称数组
 */
function getSkillNamesByJobAndType(jobIds, type) {
    const jobs = Array.isArray(jobIds) ? jobIds : [jobIds];
    const skillNames = [];

    jobs.forEach(jobId => {
        const jobSkills = JOB_SKILLS_MAP[jobId];
        if (jobSkills) {
            Object.keys(jobSkills).forEach(skillName => {
                if (jobSkills[skillName].type === type && !skillNames.includes(skillName)) {
                    skillNames.push(skillName);
                }
            });
        }
    });

    return skillNames;
}

/**
 * 获取技能配置
 * @param {string} skillName - 技能名称
 * @returns {Object} 技能配置对象
 */
function getSkillConfig(skillName) {
    return SKILLS_CONFIG[skillName];
}

/**
 * 创建空的技能状态字典（所有技能）
 * @returns {Object} 所有技能为false的字典
 */
function createEmptySkillsDict() {
    const dict = {};
    Object.keys(SKILLS_CONFIG).forEach(skillName => {
        dict[skillName] = false;
    });
    return dict;
}

/**
 * 根据职业创建空的技能状态字典
 * @param {string|Array<string>} jobIds - 单个职业ID或职业ID数组
 * @returns {Object} 该职业相关技能为false的字典
 */
function createEmptySkillsDictByJob(jobIds) {
    const jobs = Array.isArray(jobIds) ? jobIds : [jobIds];
    const dict = {};

    jobs.forEach(jobId => {
        const jobSkills = JOB_SKILLS_MAP[jobId];
        if (jobSkills) {
            Object.keys(jobSkills).forEach(skillName => {
                if (!dict.hasOwnProperty(skillName)) {
                    dict[skillName] = false;
                }
            });
        }
    });

    return dict;
}

// 导出到全局
window.SKILL_CONSTANTS = {
    // 核心数据
    SKILLS_CONFIG,              // 当前技能配置（动态）
    DEFAULT_SKILLS_CONFIG,      // 默认技能配置（完整版）
    JOB_SKILLS_MAP,             // 职业技能映射表

    // 核心功能函数
    generateSkillsConfigByJobs, // 根据职业生成技能配置
    updateSkillsConfigByJobs,   // 更新当前技能配置
    resetSkillsConfig,          // 重置为默认配置

    // 辅助函数
    getSkillNamesByType,
    getSkillNamesByJob,
    getSkillNamesByJobAndType,
    getSkillConfig,
    createEmptySkillsDict,
    createEmptySkillsDictByJob
};

console.log('✓ 技能配置已加载（支持职业动态生成）');
console.log('  - 默认技能数:', Object.keys(DEFAULT_SKILLS_CONFIG).length, '个');
console.log('  - 乘法减伤技能:', getSkillNamesByType(1).length, '个');
console.log('  - 减法减伤技能:', getSkillNamesByType(2).length, '个');
console.log('  - 职业字典数:', Object.keys(JOB_SKILLS_MAP).length, '个');
