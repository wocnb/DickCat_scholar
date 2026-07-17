/**
 * 数据处理模块
 * 协调数据更新和计算的中间层
 * 拆解自 index.html (第768-782行, 638-693行)
 */

class DataHandler {
    /**
     * 更新行数据
     * @param {number} rowId - 行ID
     */
    updateData(rowId) {
        const rowData = dataManager.getRow(rowId);
        if (!rowData) return;

        const stringInput = document.getElementById(`string-${rowId}`);
        const chineseInput = document.getElementById(`chinese-${rowId}`);
        const numberInput = document.getElementById(`number-${rowId}`);

        rowData.string = stringInput.value;
        rowData.chineseText = chineseInput.value;
        rowData.number = numberInput.value;

        // 重新计算总结
        this.calculateAndUpdateSummary(rowId);
    }

    updateDamageKind(rowId, damageKind) {
        const rowData = dataManager.getRow(rowId);
        if (!rowData) return;

        rowData.damageKind = ['physical', 'magic'].includes(damageKind) ? damageKind : 'all';
        this.calculateAndUpdateSummary(rowId);
    }

    /**
     * 计算并更新总结值
     * @param {number} rowId - 行ID
     */
    calculateAndUpdateSummary(rowId) {
        const rowData = dataManager.getRow(rowId);
        if (!rowData) return;

        const summary = calculator.calculateSummary(rowData);
        rowData.summary = summary;

        // 更新UI
        uiRenderer.updateSummary(rowId, summary);
    }

    /**
     * 添加新行
     */
    addRow() {
        const rowData = dataManager.addRow();
        uiRenderer.renderRow(rowData);
    }

    /**
     * 删除行
     * @param {number} rowId - 行ID
     */
    deleteRow(rowId) {
        if (dataManager.deleteRow(rowId)) {
            uiRenderer.removeRow(rowId);
        }
    }

    /**
     * 清空所有数据
     */
    clearAll() {
        if (confirm('确定要清空所有数据吗？')) {
            dataManager.clearAll();
            document.getElementById('tableBody').innerHTML = '';
            this.addRow();
        }
    }
}

// 导出单例
const dataHandler = new DataHandler();
