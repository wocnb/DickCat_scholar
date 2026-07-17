/**
 * FFLogs 承受伤害 CSV 导入模块
 * 支持时间/事件两列的 ACT 导出格式，以及带有常见英文或中文列名的 CSV。
 */
class FFLogsCsvImporter {
    openFilePicker() {
        const input = document.getElementById('fflogsCsvInput');
        if (input) input.click();
    }

    async importFile(file) {
        if (!file) return;

        try {
            const csvText = this.decodeCsv(await file.arrayBuffer());
            const rows = this.buildTimelineRows(csvText);

            if (!rows.length) {
                alert('未找到包含 U: 数值 的实际承伤事件，请确认导出的是 FFLogs 承受伤害 CSV。');
                return;
            }

            const confirmed = confirm(`将从 ${file.name} 生成 ${rows.length} 条时间轴，并覆盖当前表格。是否继续？`);
            if (!confirmed) return;

            this.applyTimeline(rows, file.name);
        } catch (error) {
            console.error('FFLogs CSV 导入失败:', error);
            alert(`FFLogs CSV 导入失败：${error.message}`);
        }
    }

    decodeCsv(buffer) {
        const utf8 = new TextDecoder('utf-8').decode(buffer);

        // UTF-8 解码出现大量替换符时，尝试兼容旧版本地导出编码。
        if ((utf8.match(/\uFFFD/g) || []).length < 3) return utf8;

        try {
            return new TextDecoder('gb18030').decode(buffer);
        } catch (error) {
            return utf8;
        }
    }

    buildTimelineRows(csvText) {
        const records = this.parseRecords(csvText);
        const context = this.collectEventContext(records.map(record => record.event));

        return records
            .map(record => this.createTimelineRow(record, context))
            .filter(Boolean);
    }

    parseRecords(csvText) {
        const csvRows = this.parseCsv(csvText);
        if (csvRows.length < 2) return [];

        const headers = csvRows[0].map(header => String(header).trim().toLowerCase());
        const timeIndex = this.findColumn(headers, ['time', 'timestamp', '时间']) ?? 0;
        const eventIndex = this.findColumn(headers, ['event', 'events', '事件', 'detail', 'details', '描述'])
            ?? this.findEventColumn(csvRows.slice(1))
            ?? 1;

        return csvRows.slice(1)
            .map((columns, index) => ({
                index,
                time: String(columns[timeIndex] || '').trim(),
                event: String(columns[eventIndex] || '').trim()
            }))
            .filter(record => record.time && record.event);
    }

    parseCsv(csvText) {
        const rows = [];
        let row = [];
        let cell = '';
        let quoted = false;

        for (let index = 0; index < csvText.length; index += 1) {
            const char = csvText[index];
            const next = csvText[index + 1];

            if (char === '"') {
                if (quoted && next === '"') {
                    cell += '"';
                    index += 1;
                } else {
                    quoted = !quoted;
                }
            } else if (char === ',' && !quoted) {
                row.push(cell);
                cell = '';
            } else if ((char === '\n' || char === '\r') && !quoted) {
                if (char === '\r' && next === '\n') index += 1;
                row.push(cell);
                if (row.some(value => value.length)) rows.push(row);
                row = [];
                cell = '';
            } else {
                cell += char;
            }
        }

        row.push(cell);
        if (row.some(value => value.length)) rows.push(row);
        return rows;
    }

    findColumn(headers, aliases) {
        for (const alias of aliases) {
            const index = headers.findIndex(header => header === alias);
            if (index >= 0) return index;
        }

        for (const alias of aliases) {
            const index = headers.findIndex(header => header.includes(alias));
            if (index >= 0) return index;
        }

        return null;
    }

    findEventColumn(rows) {
        const widestRow = rows.find(row => row.length > 1) || [];
        const index = widestRow.findIndex(value => /\(\s*U\s*:\s*[\d,]+/i.test(String(value)));
        return index >= 0 ? index : null;
    }

    collectEventContext(events) {
        const sources = new Set();
        const targets = new Set();

        events.forEach(event => {
            const match = String(event).match(/^(.+?)\s+prepares\s+.*?\s+on\s+(.+?)(?:\s+\d[\d,]*\s+\(\s*U\s*:|$)/i);
            if (!match) return;

            sources.add(match[1].trim());
            targets.add(match[2].trim());
        });

        return {
            sources: [...sources].sort((a, b) => b.length - a.length),
            targets: [...targets].sort((a, b) => b.length - a.length)
        };
    }

    createTimelineRow(record, context) {
        const event = record.event;
        const uMatch = event.match(/\(\s*U\s*:\s*([\d,]+)/i);
        if (!uMatch || /\bprepares\b/i.test(event)) return null;

        const seconds = this.parseTime(record.time);
        const amount = Number(uMatch[1].replace(/,/g, ''));
        if (!Number.isFinite(seconds) || !Number.isFinite(amount) || amount <= 0) return null;

        const ability = this.extractAbilityName(event, uMatch.index, context);
        const skills = window.SKILL_CONSTANTS?.createEmptySkillsDict
            ? window.SKILL_CONSTANTS.createEmptySkillsDict()
            : {};

        return {
            string: this.formatTimelineTime(seconds),
            chineseText: ability,
            number: amount,
            skills,
            summary: amount,
            sourceOrder: record.index
        };
    }

    extractAbilityName(event, uIndex, context) {
        // U 前可能还有 A/O 等统计段；全部剥离后，最后一个数字才是本次实际承伤。
        const beforeStats = event.slice(0, uIndex)
            .replace(/(?:\s+\([A-Z]:[^)]*\))*\s*$/, '')
            .replace(/\s+\d[\d,]*\s*$/, '')
            .trim();
        const target = context.targets.find(item => beforeStats.endsWith(item));
        const sourceAndAbility = target
            ? beforeStats.slice(0, -target.length).trim()
            : beforeStats;
        const source = context.sources.find(item => sourceAndAbility === item || sourceAndAbility.startsWith(`${item} `));

        if (source) {
            const ability = sourceAndAbility.slice(source.length).trim();
            if (ability) return ability;
        }

        // 无准备读条记录时保留可读的事件前缀，而不是静默丢失该条伤害。
        return sourceAndAbility || '未知伤害';
    }

    parseTime(value) {
        const text = String(value).trim();
        if (/^\d+(?:\.\d+)?$/.test(text)) return Number(text);

        const parts = text.split(':').map(Number);
        if (!parts.every(Number.isFinite) || parts.length < 2 || parts.length > 3) return NaN;

        if (parts.length === 2) return (parts[0] * 60) + parts[1];
        return (parts[0] * 3600) + (parts[1] * 60) + parts[2];
    }

    formatTimelineTime(seconds) {
        const rounded = Math.round(seconds * 10) / 10;
        const minutes = Math.floor(rounded / 60);
        const remainingSeconds = Number((rounded - (minutes * 60)).toFixed(1));
        return minutes ? `${minutes}m${remainingSeconds}s` : `${remainingSeconds}s`;
    }

    applyTimeline(rows, filename) {
        document.getElementById('tableBody').innerHTML = '';
        const loadedRows = dataManager.loadConfigData(rows);

        loadedRows.forEach(row => uiRenderer.renderRow(row));

        const selector = document.getElementById('configSelector');
        if (selector) selector.value = '';

        if (window.configHandler) {
            window.configHandler.currentConfig = null;
            window.configHandler.updateConfigStatus('success', `已从 ${filename} 生成 ${loadedRows.length} 条 FFLogs 时间轴`);
        }
    }
}

const fflogsCsvImporter = new FFLogsCsvImporter();
window.fflogsCsvImporter = fflogsCsvImporter;
