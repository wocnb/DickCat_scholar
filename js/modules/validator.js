/**
 * 输入验证模块
 * 负责各种输入字段的验证
 * 拆解自 index.html (第699-762行)
 */

class Validator {
    /**
     * 验证字符串输入（只能输入数字和字母s/m）
     * @param {string} value - 输入值
     * @returns {boolean} 验证是否通过
     */
    validateString(value) {
        const stringRegex = /^[0-9smSM]*$/;
        return stringRegex.test(value);
    }

    /**
     * 验证中文输入
     * @param {string} value - 输入值
     * @returns {boolean} 验证是否通过
     */
    validateChinese(value) {
        // 正则表达式：只允许中文字符（包括中文标点）
        const chineseRegex = /^[\u4e00-\u9fa5\u3000-\u303f\uff00-\uffef]*$/;
        return chineseRegex.test(value);
    }

    /**
     * 验证数字输入
     * @param {string} value - 输入值
     * @returns {boolean} 验证是否通过
     */
    validateNumber(value) {
        // 正则表达式：只允许数字（包括小数和负数）
        const numberRegex = /^-?\d*\.?\d*$/;
        return !value || numberRegex.test(value);
    }

    /**
     * 显示错误状态
     * @param {HTMLElement} inputElement - 输入元素
     * @param {HTMLElement} errorElement - 错误提示元素
     */
    showError(inputElement, errorElement) {
        inputElement.classList.add('error');
        errorElement.style.display = 'block';
    }

    /**
     * 清除错误状态
     * @param {HTMLElement} inputElement - 输入元素
     * @param {HTMLElement} errorElement - 错误提示元素
     */
    clearError(inputElement, errorElement) {
        inputElement.classList.remove('error');
        errorElement.style.display = 'none';
    }

    /**
     * 验证并更新UI
     * @param {number} rowId - 行ID
     * @param {string} type - 验证类型 ('string' | 'chinese' | 'number')
     * @returns {boolean} 验证是否通过
     */
    validateAndUpdate(rowId, type) {
        const input = document.getElementById(`${type}-${rowId}`);
        const errorMsg = document.getElementById(`${type}-error-${rowId}`);
        const value = input.value;

        let isValid = false;

        switch (type) {
            case 'string':
                isValid = this.validateString(value);
                break;
            case 'chinese':
                isValid = this.validateChinese(value);
                break;
            case 'number':
                isValid = this.validateNumber(value);
                break;
            default:
                return false;
        }

        if (value && !isValid) {
            this.showError(input, errorMsg);
        } else {
            this.clearError(input, errorMsg);
        }

        return isValid;
    }
}

// 导出单例
const validator = new Validator();
