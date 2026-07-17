/**
 * 计算器模块
 * 使用字典结构的技能配置
 */
class Calculator {
    constructor() {
        // 技能配置会随职业选择动态变化，计算时实时读取当前配置。
    }

    get skillsConfig() {
        return window.SKILL_CONSTANTS?.SKILLS_CONFIG || {};
    }

    /**
     * 计算总结值
     * @param {Object} rowData - 行数据 { skills: { '技能名': true/false } }
     * @returns {number} 计算结果
     */
    calculateSummary(rowData) {
        const numberValue = parseFloat(rowData.number) || 0;
        const skills = rowData.skills || {};

        // 计算乘法减伤 (type: 1) - 去重处理
        let type1Product = 1;
        // 记录已计算的技能基础名称（用于去重）
        const calculatedSkillBases = new Set();
        // 计算减法减伤 (type: 2) - 去重处理
        let type2Sum = 0;
        // 记录已计算的type2技能基础名称
        const calculatedType2SkillBases = new Set();

        Object.keys(skills).forEach(skillName => {
            if (skills[skillName]) {
                const config = this.skillsConfig[skillName];
                if (!config) return;

                // 获取技能基础名称（用于同名减伤去重）
                const baseSkillName = config.baseName || skillName.replace(/\d+$/, '');

                if (config.type === 1) {
                    // 乘法减伤 - 检查是否已经计算过该基础技能
                    if (!calculatedSkillBases.has(baseSkillName)) {
                        type1Product *= config.coefficient;
                        calculatedSkillBases.add(baseSkillName);
                    }
                } else if (config.type === 2) {
                    // 减法减伤 - 检查是否已经计算过该基础技能
                    if (!calculatedType2SkillBases.has(baseSkillName)) {
                        type2Sum += config.coefficient;
                        calculatedType2SkillBases.add(baseSkillName);
                    }
                }
            }
        });

        // 最终计算：数字列 × 类型1乘积 - 类型2和
        const summary = (numberValue * type1Product) - type2Sum;

        console.log(`计算 - 行${rowData.id}: 原始=${numberValue}, 乘法乘积=${type1Product}, 减法和=${type2Sum}, 结果=${summary}`);

        return summary;
    }
}

// 导出单例
const calculator = new Calculator();
