/**
 * 数据管理模块
 * 使用统一的skills字典管理技能状态
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

        // 创建空的技能状态字典
        const skills = window.SKILL_CONSTANTS
            ? window.SKILL_CONSTANTS.createEmptySkillsDict()
            : {};

        return {
            id: rowId,
            string: '',
            chineseText: '',
            number: '',
            damageKind: 'all',
            skills: skills,
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

    getEffectiveSkills(rowData) {
        const effectiveSkills = { ...(rowData?.skills || {}) };
        const rowTime = this.parseTimelineTime(rowData?.string);
        if (!Number.isFinite(rowTime)) return effectiveSkills;

        this.tableData.forEach(sourceRow => {
            const sourceTime = this.parseTimelineTime(sourceRow.string);
            if (!Number.isFinite(sourceTime) || sourceTime > rowTime) return;

            Object.entries(sourceRow.skills || {}).forEach(([skillName, isActive]) => {
                const config = window.SKILL_CONSTANTS?.SKILLS_CONFIG?.[skillName];
                if (!isActive || !config?.duration) return;
                if (rowTime - sourceTime <= config.duration) effectiveSkills[skillName] = true;
            });
        });

        return effectiveSkills;
    }

    getInheritedSkillSource(rowData, skillName) {
        if (rowData?.skills?.[skillName]) return null;

        const rowTime = this.parseTimelineTime(rowData?.string);
        const config = window.SKILL_CONSTANTS?.SKILLS_CONFIG?.[skillName];
        if (!Number.isFinite(rowTime) || !config?.duration) return null;

        return this.tableData
            .filter(candidate => candidate.id !== rowData.id && candidate.skills?.[skillName])
            .map(candidate => ({ row: candidate, time: this.parseTimelineTime(candidate.string) }))
            .filter(candidate => Number.isFinite(candidate.time)
                && candidate.time <= rowTime
                && rowTime - candidate.time <= config.duration)
            .sort((left, right) => right.time - left.time)[0]?.row || null;
    }

    getSkillSchedule(rowData, skillName) {
        const rowTime = this.parseTimelineTime(rowData?.string);
        const config = window.SKILL_CONSTANTS?.SKILLS_CONFIG?.[skillName];
        if (!Number.isFinite(rowTime) || !config?.cooldown || config.repeatable) {
            return { ready: true, cooldownStartsAt: 0, nextReadyAt: 0 };
        }

        const previousUses = this.tableData
            .filter(candidate => candidate.id !== rowData.id && candidate.skills?.[skillName])
            .map(candidate => ({ row: candidate, time: this.parseTimelineTime(candidate.string) }))
            .filter(candidate => Number.isFinite(candidate.time) && candidate.time <= rowTime)
            .sort((left, right) => left.time - right.time);

        let nextReadyAt = 0;
        previousUses.forEach(use => {
            const activationTime = this.getSkillActivationTime(use.time, config);
            if (activationTime < nextReadyAt) return;
            nextReadyAt = activationTime + config.cooldown;
        });

        const requestedActivationTime = this.getSkillActivationTime(rowTime, config);

        return {
            ready: requestedActivationTime >= nextReadyAt,
            cooldownStartsAt: nextReadyAt ? nextReadyAt - config.cooldown : 0,
            nextReadyAt
        };
    }

    getSkillActivationTime(selectionTime, config) {
        return selectionTime;
    }

    getSkillCoverageEnd(castTime, config) {
        if (!config?.duration) return castTime;

        return this.tableData
            .map(candidate => ({ time: this.parseTimelineTime(candidate.string), damage: Number(candidate.number) || 0 }))
            .filter(candidate => Number.isFinite(candidate.time)
                && candidate.damage > 0
                && candidate.time >= castTime
                && candidate.time <= castTime + config.duration)
            .reduce((latestTime, candidate) => Math.max(latestTime, candidate.time), castTime);
    }

    parseTimelineTime(value) {
        const text = String(value || '').trim();
        const minuteMatch = text.match(/^(?:(\d+(?:\.\d+)?)m)?(?:(\d+(?:\.\d+)?)s)?$/i);
        if (minuteMatch && (minuteMatch[1] || minuteMatch[2])) {
            return (Number(minuteMatch[1]) || 0) * 60 + (Number(minuteMatch[2]) || 0);
        }
        return window.fflogsCsvImporter?.parseTime(text);
    }

    /**
     * 清空所有数据
     */
    clearAll() {
        this.tableData = [];
        this.rowIdCounter = 0;
    }

    /**
     * 导出数据
     * @returns {Object} 格式化的导出数据（包含职业信息）
     */
    exportData() {
        // 获取当前职业选择
        const jobSelection = window.getJobSelection ? window.getJobSelection() : null;

        return {
            meta: {
                version: '1.0.0',
                exportedAt: new Date().toISOString(),
                dataCount: this.tableData.length,
                jobSelection: jobSelection,
                memberProfiles: window.tankbusterPlanner?.getMemberProfiles()
            },
            data: this.tableData.map(row => ({
                string: row.string,
                chineseText: row.chineseText,
                number: row.number,
                damageKind: row.damageKind || 'all',
                skills: { ...row.skills },
                summary: row.summary
            }))
        };
    }

    /**
     * 批量加载数据（用于配置加载）
     * @param {Array|Object} configData - 配置数据数组或包含meta和数据对象
     * @returns {Array} 加载的行数据
     */
    loadConfigData(configData) {
        // 清空现有数据
        this.tableData = [];
        this.rowIdCounter = 0;

        // 处理包含meta的新格式
        let dataArray = configData;
        let jobSelection = null;
        let memberProfiles = null;

        if (configData && typeof configData === 'object' && !Array.isArray(configData)) {
            // 新格式：{meta: {...}, data: [...]}
            if (configData.meta && configData.meta.jobSelection) {
                jobSelection = configData.meta.jobSelection;
            }
            memberProfiles = configData.meta?.memberProfiles || null;
            dataArray = configData.data || [];
        }

        // 加载配置数据
        dataArray.forEach((item) => {
            const rowData = {
                id: this.rowIdCounter++,
                string: item.string || '',
                chineseText: item.chineseText || '',
                number: item.number || '',
                damageKind: item.damageKind || 'all',
                skills: item.skills ? { ...item.skills } : {},
                summary: item.summary || 0
            };
            this.tableData.push(rowData);
        });

        // 如果导出数据中包含职业信息，则应用职业配置
        if (jobSelection) {
            // 更新全局职业选择
            if (window.setJobSelection) {
                window.setJobSelection(jobSelection);
            }

            // 同步更新jobSelector的内部状态
            if (window.jobSelector && window.jobSelector.setSelection) {
                window.jobSelector.setSelection(jobSelection);
            }

            window.tankbusterPlanner?.refreshResources();
            window.comprehensiveTimeline?.render();

            console.log('✓ 已从导出数据加载职业配置:', jobSelection);
        }

        if (memberProfiles) {
            window.tankbusterPlanner?.setMemberProfiles(memberProfiles);
        }

        return this.tableData;
    }
}

// 导出单例
const dataManager = new DataManager();
