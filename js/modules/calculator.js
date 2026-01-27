/**
 * 计算器模块
 * 负责总结列的计算逻辑
 * 支持字典格式和数组格式的状态数据
 */

class Calculator {
    constructor() {
        // 类型1的系数列表（乘法）- 从常量配置获取
        this.type1Coefficients = window.SKILL_CONSTANTS?.TYPE1_COEFFICIENTS || [
            0.9, 0.95, 0.9, 0.95, 0.9, 0.85, 0.9, 0.85, 0.95, 0.9, 0.9, 0.9, 0.9
        ];

        // 类型2的系数列表（减法）- 从常量配置获取
        this.type2Coefficients = window.SKILL_CONSTANTS?.TYPE2_COEFFICIENTS || [
            19000, 27000, 72000
        ];

        // 技能名称列表 - 从常量配置获取
        this.type1Skills = window.SKILL_CONSTANTS?.TYPE1_SKILLS || [];
        this.type2Skills = window.SKILL_CONSTANTS?.TYPE2_SKILLS || [];
    }

    /**
     * 计算总结值
     * @param {Object} rowData - 行数据
     * @returns {number} 计算结果
     */
    calculateSummary(rowData) {
        const numberValue = parseFloat(rowData.number) || 0;

        // 交互类型1：乘法系数计算
        // 计算公式：数字列 × 类型1系数1 × 类型1系数2 × ...
        let type1Product = this.calculateType1Product(rowData.type1States);

        // 交互类型2：减法计算
        // 计算公式：- (类型2系数1) - (类型2系数2) - ...
        let type2Sum = this.calculateType2Sum(rowData.type2States);

        // 最终计算：数字列 × 类型1乘积 - 类型2和
        const summary = (numberValue * type1Product) - type2Sum;

        console.log(`计算总结 - 行${rowData.id}: 数字值=${numberValue}, 类型1乘积=${type1Product}, 类型2和=${type2Sum}, 结果=${summary}`);

        return summary;
    }

    /**
     * 计算类型1的乘积（支持字典和数组格式）
     * @param {Object|Array} states - 状态字典或数组
     * @returns {number} 乘积结果
     */
    calculateType1Product(states) {
        let product = 1;

        // 判断是字典格式还是数组格式
        if (this.isDictFormat(states)) {
            // 字典格式：遍历技能名称
            this.type1Skills.forEach((skillName, index) => {
                if (states[skillName] && this.type1Coefficients[index] !== undefined) {
                    const coefficient = this.type1Coefficients[index];
                    product *= coefficient;
                }
            });
        } else {
            // 数组格式：向后兼容
            states.forEach((state, index) => {
                if (state.active && this.type1Coefficients[index] !== undefined) {
                    const coefficient = this.type1Coefficients[index];
                    product *= coefficient;
                }
            });
        }

        return product;
    }

    /**
     * 计算类型2的和（支持字典和数组格式）
     * @param {Object|Array} states - 状态字典或数组
     * @returns {number} 和的结果
     */
    calculateType2Sum(states) {
        let sum = 0;

        // 判断是字典格式还是数组格式
        if (this.isDictFormat(states)) {
            // 字典格式：遍历技能名称
            this.type2Skills.forEach((skillName, index) => {
                if (states[skillName] && this.type2Coefficients[index] !== undefined) {
                    const coefficient = this.type2Coefficients[index];
                    sum += coefficient;
                }
            });
        } else {
            // 数组格式：向后兼容
            states.forEach((state, index) => {
                if (state.active && this.type2Coefficients[index] !== undefined) {
                    const coefficient = this.type2Coefficients[index];
                    sum += coefficient;
                }
            });
        }

        return sum;
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
     * 更新类型1系数列表
     * @param {Array} coefficients - 新的系数列表
     */
    updateType1Coefficients(coefficients) {
        this.type1Coefficients = coefficients;
    }

    /**
     * 更新类型2系数列表
     * @param {Array} coefficients - 新的系数列表
     */
    updateType2Coefficients(coefficients) {
        this.type2Coefficients = coefficients;
    }
}

// 导出单例
const calculator = new Calculator();
