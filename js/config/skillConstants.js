/**
 * 技能名称常量配置
 * 统一管理所有技能的名称和顺序
 */

/**
 * 乘法减伤技能列表（13种）
 * 按照UI中的顺序定义
 */
const TYPE1_SKILLS = [
    '血仇1',
    '牵制1',
    '血仇2',
    '牵制2',
    '病毒',
    '策动',
    '光之心',
    '武装戍卫',
    '幻光',
    '疾风怒涛',
    '野战治疗阵',
    '全大赦',
    '节制'
];

/**
 * 减法减伤技能列表（3种）
 * 按照UI中的顺序定义
 */
const TYPE2_SKILLS = [
    '圣光幕帘',
    '群盾',
    '扩散盾'
];

/**
 * 乘法减伤系数（对应TYPE1_SKILLS）
 * 根据实际游戏数据设置
 */
const TYPE1_COEFFICIENTS = [
    0.10,  // 血仇1 - 10%
    0.05,  // 牵制1 - 5%
    0.10,  // 血仇2 - 10%
    0.05,  // 牵制2 - 5%
    0.10,  // 病毒 - 10%
    0.20,  // 策动 - 20%
    0.15,  // 光之心 - 15%
    0.20,  // 武装戍卫 - 20%
    0.10,  // 幻光 - 10%
    0.10,  // 疾风怒涛 - 10%
    0.10,  // 野战治疗阵 - 10%
    0.10,  // 全大赦 - 10%
    0.10   // 节制 - 10%
];

/**
 * 减法减伤系数（对应TYPE2_SKILLS）
 * 根据实际游戏数据设置
 */
const TYPE2_COEFFICIENTS = [
    0,     // 圣光幕帘 - 需要实际数据
    0,     // 群盾 - 需要实际数据
    0      // 扩散盾 - 需要实际数据
];

/**
 * 将数组格式的状态转换为字典格式
 * @param {Array} stateArray - 布尔值数组
 * @param {Array} skillNames - 技能名称数组
 * @returns {Object} 字典格式的状态对象
 */
function convertArrayToDict(stateArray, skillNames) {
    const dict = {};
    skillNames.forEach((skillName, index) => {
        dict[skillName] = Boolean(stateArray[index]);
    });
    return dict;
}

/**
 * 将字典格式的状态转换为数组格式
 * @param {Object} stateDict - 字典格式的状态对象
 * @param {Array} skillNames - 技能名称数组
 * @returns {Array} 布尔值数组
 */
function convertDictToArray(stateDict, skillNames) {
    return skillNames.map(skillName => Boolean(stateDict[skillName]));
}

/**
 * 创建空的乘法减伤状态字典
 * @returns {Object} 所有技能为false的字典
 */
function createEmptyType1Dict() {
    const dict = {};
    TYPE1_SKILLS.forEach(skillName => {
        dict[skillName] = false;
    });
    return dict;
}

/**
 * 创建空的减法减伤状态字典
 * @returns {Object} 所有技能为false的字典
 */
function createEmptyType2Dict() {
    const dict = {};
    TYPE2_SKILLS.forEach(skillName => {
        dict[skillName] = false;
    });
    return dict;
}

// 导出到全局作用域（供配置文件使用）
window.SKILL_CONSTANTS = {
    TYPE1_SKILLS,
    TYPE2_SKILLS,
    TYPE1_COEFFICIENTS,
    TYPE2_COEFFICIENTS,
    convertArrayToDict,
    convertDictToArray,
    createEmptyType1Dict,
    createEmptyType2Dict
};

console.log('✓ 技能常量配置已加载');
console.log('  - 乘法减伤技能:', TYPE1_SKILLS.length, '个');
console.log('  - 减法减伤技能:', TYPE2_SKILLS.length, '个');
