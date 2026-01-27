/**
 * 数据管理模块
 * 负责全局数据存储和行数据管理
 * 支持字典格式和数组格式的状态数据
 */

class DataManager {
    constructor() {
        this.tableData = [];
        this.rowIdCounter = 0;
    }

    /**
     * 创建新行数据
     * @returns {Object} 行数据对象
     */
    createRowData() {
        const rowId = this.rowIdCounter++;

        // 使用技能常量创建空的字典格式状态
        let type1States, type2States;

        if (window.SKILL_CONSTANTS) {
            // 使用字典格式
            type1States = window.SKILL_CONSTANTS.createEmptyType1Dict();
            type2States = window.SKILL_CONSTANTS.createEmptyType2Dict();
        } else {
            // 向后兼容：使用数组格式
            type1States = [];
            type2States = [];
        }

        return {
            id: rowId,
            string: '',
            chineseText: '',
            number: '',
            type1States: type1States,
            type2States: type2States,
            summary: 0
        };
    }

    /**
     * 添加行
     * @returns {Object} 新创建的行数据
     */
    addRow() {
        const rowData = this.createRowData();
        this.tableData.push(rowData);
        return rowData;
    }

    /**
     * 删除行
     * @param {number} rowId - 行ID
     * @returns {boolean} 删除是否成功
     */
    deleteRow(rowId) {
        const initialLength = this.tableData.length;
        this.tableData = this.tableData.filter(r => r.id !== rowId);
        return this.tableData.length < initialLength;
    }

    /**
     * 获取行数据
     * @param {number} rowId - 行ID
     * @returns {Object|null} 行数据对象
     */
    getRow(rowId) {
        return this.tableData.find(r => r.id === rowId) || null;
    }

    /**
     * 更新行数据
     * @param {number} rowId - 行ID
     * @param {Object} data - 要更新的数据
     */
    updateRow(rowId, data) {
        const rowData = this.getRow(rowId);
        if (rowData) {
            Object.assign(rowData, data);
        }
    }

    /**
     * 获取所有数据
     * @returns {Array} 所有行数据
     */
    getAllData() {
        return [...this.tableData];
    }

    /**
     * 清空所有数据
     */
    clearAll() {
        this.tableData = [];
        this.rowIdCounter = 0;
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
     * 导出数据（用于导出功能）- 导出为字典格式
     * @returns {Array} 格式化的导出数据
     */
    exportData() {
        return this.tableData.map(row => {
            // 判断状态格式并导出
            let type1States, type2States;

            if (this.isDictFormat(row.type1States)) {
                // 字典格式：直接复制
                type1States = { ...row.type1States };
                type2States = { ...row.type2States };
            } else {
                // 数组格式：转换为字典
                if (window.SKILL_CONSTANTS) {
                    type1States = window.SKILL_CONSTANTS.convertArrayToDict(
                        row.type1States.map(s => s.active),
                        window.SKILL_CONSTANTS.TYPE1_SKILLS
                    );
                    type2States = window.SKILL_CONSTANTS.convertArrayToDict(
                        row.type2States.map(s => s.active),
                        window.SKILL_CONSTANTS.TYPE2_SKILLS
                    );
                } else {
                    // 没有常量配置，导出数组格式
                    type1States = row.type1States.map(s => s.active);
                    type2States = row.type2States.map(s => s.active);
                }
            }

            return {
                string: row.string,
                chineseText: row.chineseText,
                number: row.number,
                type1States: type1States,
                type2States: type2States,
                summary: row.summary
            };
        });
    }

    /**
     * 批量加载数据（用于配置加载）
     * 支持字典格式和数组格式
     * @param {Array} configData - 配置数据数组
     * @returns {Array} 加载的行数据
     */
    loadConfigData(configData) {
        // 清空现有数据
        this.tableData = [];
        this.rowIdCounter = 0;

        // 加载配置数据
        configData.forEach((item, index) => {
            let type1States, type2States;

            // 判断配置格式
            const isType1Dict = this.isDictFormat(item.type1States);
            const isType2Dict = this.isDictFormat(item.type2States);

            if (isType1Dict && isType2Dict) {
                // 字典格式：直接使用
                type1States = { ...item.type1States };
                type2States = { ...item.type2States };
            } else {
                // 数组格式：转换为内部格式
                if (window.SKILL_CONSTANTS) {
                    // 转换为字典格式
                    type1States = window.SKILL_CONSTANTS.convertArrayToDict(
                        item.type1States || [],
                        window.SKILL_CONSTANTS.TYPE1_SKILLS
                    );
                    type2States = window.SKILL_CONSTANTS.convertArrayToDict(
                        item.type2States || [],
                        window.SKILL_CONSTANTS.TYPE2_SKILLS
                    );
                } else {
                    // 向后兼容：保持数组格式
                    type1States = (item.type1States || []).map((active, i) => ({
                        id: i,
                        active: Boolean(active)
                    }));
                    type2States = (item.type2States || []).map((active, i) => ({
                        id: i,
                        active: Boolean(active)
                    }));
                }
            }

            const rowData = {
                id: this.rowIdCounter++,
                string: item.string || '',
                chineseText: item.chineseText || '',
                number: item.number || '',
                type1States: type1States,
                type2States: type2States,
                summary: item.summary || 0
            };
            this.tableData.push(rowData);
        });

        return this.tableData;
    }
}

// 导出单例
const dataManager = new DataManager();
