/**
 * 导出管理模块
 * 负责数据导出功能（支持 JS、JSON、CSV 格式）
 * 导出的 JS 文件使用字典格式，更易读
 */

class ExportManager {
    /**
     * 判断是否为字典格式
     * @param {*} states - 状态数据
     * @returns {boolean} 是否为字典格式
     */
    isDictFormat(states) {
        return states && typeof states === 'object' && !Array.isArray(states);
    }

    /**
     * 导出数据为 JavaScript 文件（字典格式）
     * @param {string} configName - 配置名称（可选）
     */
    exportAsJS(configName = 'custom') {
        const data = dataManager.getAllData();

        if (data.length === 0) {
            alert('表格中没有数据，无法导出');
            return;
        }

        const timestamp = new Date().toISOString().split('T')[0];
        const configKey = configName === 'custom' ? `export_${timestamp}` : configName;

        // 生成 JS 配置文件内容（字典格式）
        const jsContent = this.generateJSConfigContent(configKey, data);

        // 创建并下载文件
        const blob = new Blob([jsContent], { type: 'application/javascript' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${configKey}.js`;
        a.click();
        URL.revokeObjectURL(url);

        console.log('导出 JS 配置成功:', configKey);
    }

    /**
     * 生成 JS 配置文件内容（字典格式）
     * @param {string} configName - 配置名称
     * @param {Array} data - 数据数组
     * @returns {string} JS 文件内容
     */
    generateJSConfigContent(configName, data) {
        const displayName = configName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

        // 转换数据格式（使用dataManager的exportData方法）
        const exportedData = dataManager.exportData();
        const rawData = exportedData.data || [];

        // 生成配置数据数组（字典格式）
        const configDataArray = rawData.map(row => {
            return {
                string: row.string,
                chineseText: row.chineseText,
                number: row.number,
                skills: row.skills,
                summary: row.summary
            };
        });

        // 生成配置数据字符串（手动格式化）
        let dataString = '[\n';
        configDataArray.forEach((row, index) => {
            dataString += '    {\n';
            dataString += `        string: "${row.string}",\n`;
            dataString += `        chineseText: "${row.chineseText}",\n`;
            dataString += `        number: "${row.number}",\n`;

            // 格式化 skills
            dataString += '        skills: {\n';
            const skillKeys = Object.keys(row.skills);
            skillKeys.forEach((key, i) => {
                dataString += `            "${key}": ${row.skills[key]}`;
                if (i < skillKeys.length - 1) dataString += ',';
                dataString += '\n';
            });
            dataString += '        },\n';

            dataString += `        summary: ${row.summary}\n`;
            dataString += '    }';
            if (index < configDataArray.length - 1) dataString += ',';
            dataString += '\n';
        });
        dataString += ']';

        // 生成职业选择字符串
        let jobSelectionString = 'null';
        if (exportedData.meta && exportedData.meta.jobSelection) {
            jobSelectionString = JSON.stringify(exportedData.meta.jobSelection, null, 8);
        }

        // 生成 JS 文件
        return `/**
 * ${displayName} 配置文件
 * 自动导出于 ${new Date().toLocaleString('zh-CN')}
 */

// 配置元数据
const ${configName.toUpperCase()}_CONFIG_META = {
    name: '${configName}',
    displayName: '${displayName}',
    version: '1.0.0',
    description: '导出的配置数据',
    updatedAt: '${new Date().toISOString().split('T')[0]}',
    dataCount: ${rawData.length},
    jobSelection: ${jobSelectionString}
};

// 配置数据（使用字典格式，更易读）
const ${configName.toUpperCase()}_CONFIG_DATA = ${dataString};

// 导出到全局作用域
window.TABLE_CONFIGS = window.TABLE_CONFIGS || {};
window.TABLE_CONFIGS['${configName}'] = {
    meta: ${configName.toUpperCase()}_CONFIG_META,
    data: ${configName.toUpperCase()}_CONFIG_DATA
};

console.log(\`✓ 配置加载成功: ${displayName} (${rawData.length} 条数据)\`);
`;
    }

    /**
     * 格式化字典对象为字符串
     * @param {Object} dict - 字典对象
     * @returns {string} 格式化后的字符串
     */
    formatDictToString(dict) {
        const keys = Object.keys(dict);
        const pairs = keys.map(key => `    ${key}: ${dict[key]}`);
        return '{\n' + pairs.join(',\n') + '\n}';
    }

    /**
     * 导出数据为 JSON 文件
     */
    exportAsJSON() {
        const exportData = dataManager.getAllData();

        if (exportData.length === 0) {
            alert('表格中没有数据，无法导出');
            return;
        }

        // 使用dataManager的exportData方法（已处理字典格式）
        const data = dataManager.exportData();

        const dataStr = JSON.stringify(data, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'table-data.json';
        a.click();
        URL.revokeObjectURL(url);

        console.log('导出 JSON 数据成功:', data);
    }

    /**
     * 导出数据为 CSV 文件
     */
    exportToCSV() {
        const data = dataManager.getAllData();

        if (data.length === 0) {
            alert('表格中没有数据，无法导出');
            return;
        }

        // 获取所有技能名称（作为CSV列头）
        const allSkillNames = new Set();
        data.forEach(row => {
            if (row.skills && typeof row.skills === 'object') {
                Object.keys(row.skills).forEach(skillName => allSkillNames.add(skillName));
            }
        });
        const sortedSkillNames = Array.from(allSkillNames).sort();

        // CSV 头部
        let csv = '字符串,中文文本,数字,' + sortedSkillNames.join(',') + ',总结\n';

        // 数据行
        data.forEach(row => {
            csv += `"${row.string}",`;
            csv += `"${row.chineseText}",`;
            csv += `"${row.number}",`;

            // 处理技能状态
            sortedSkillNames.forEach(skillName => {
                const skillValue = (row.skills && row.skills[skillName]) ? '1' : '0';
                csv += `"${skillValue}",`;
            });

            csv += `"${row.summary.toFixed(2)}"\n`;
        });

        const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'table-data.csv';
        a.click();
        URL.revokeObjectURL(url);
    }

    /**
     * 导出数据（默认为 JS 格式）
     */
    exportData() {
        this.exportAsJS();
    }
}

// 导出单例
const exportManager = new ExportManager();
