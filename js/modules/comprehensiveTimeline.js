/**
 * 综合时间轴页面
 * 合并团队承伤 CSV 与 *-tank*.csv，并为坦克承伤提供筛选和死刑页跳转。
 */
class ComprehensiveTimeline {
    constructor() {
        this.events = [];
        this.sourceFiles = {};
        this.initialized = false;
        this.sharedStoreInitialized = false;
    }

    init() {
        if (this.initialized) return;
        this.initialized = true;
        this.initSharedStore();
        this.render();
    }

    initSharedStore() {
        if (this.sharedStoreInitialized || !window.damageCsvStore) return;

        this.sharedStoreInitialized = true;
        window.damageCsvStore.subscribe(() => {
            if (this.hasAllRequiredFiles()) this.buildTimelineFromSourceFiles();
            else this.render();
        });

        if (this.hasAllRequiredFiles()) this.buildTimelineFromSourceFiles();
    }

    openFilePicker(source) {
        const inputIds = {
            healer: 'healerDamageCsvInput',
            mt: 'mtDamageCsvInput',
            st: 'stDamageCsvInput'
        };
        const input = document.getElementById(inputIds[source]);
        if (input) input.click();
    }

    async importSourceFile(file, source) {
        if (!file) return;
        if (!this.isValidSourceFile(file.name, source)) {
            const expected = source === 'mt' ? '-tank1 或 -mt' : '-tank2 或 -st';
            alert(`${source.toUpperCase()} CSV 文件名必须包含 ${expected}。`);
            return;
        }

        try {
            const importedFile = {
                name: file.name,
                text: fflogsCsvImporter.decodeCsv(await file.arrayBuffer())
            };
            if (window.damageCsvStore) window.damageCsvStore.set(source, importedFile);
            else {
                this.sourceFiles[source] = importedFile;
                if (this.hasAllRequiredFiles()) this.buildTimelineFromSourceFiles();
                else this.render();
            }
        } catch (error) {
            console.error('综合时间轴导入失败:', error);
            alert(`综合时间轴导入失败：${error.message}`);
        }
    }

    isValidSourceFile(filename, source) {
        if (source === 'healer') return !/-tank|-(?:mt|st)(?:[^/\\]*)\.csv$/i.test(filename);
        const pattern = source === 'mt'
            ? /-(?:tank1|mt)(?:[^/\\]*)\.csv$/i
            : /-(?:tank2|st)(?:[^/\\]*)\.csv$/i;
        return pattern.test(filename);
    }

    hasAllRequiredFiles() {
        if (window.damageCsvStore) return window.damageCsvStore.hasAll();
        return ['healer', 'mt', 'st'].every(source => this.sourceFiles[source]);
    }

    updateImportStatus() {
        const status = document.getElementById('comprehensiveImportStatus');
        if (!status) return;

        const labels = {
            healer: '治疗承伤',
            mt: 'MT',
            st: 'ST'
        };
        const loaded = Object.keys(labels).filter(source => window.damageCsvStore
            ? window.damageCsvStore.has(source)
            : this.sourceFiles[source]);
        status.textContent = loaded.length === 3
            ? '三份记录已就绪'
            : `已选择 ${loaded.map(source => labels[source]).join('、') || '0'}，还需 ${3 - loaded.length} 份`;
    }

    buildTimelineFromSourceFiles() {
        const sources = [
            ['healer', { type: 'team', label: '治疗承伤', targetSlot: null }],
            ['mt', { type: 'tank', label: 'MT 承伤', targetSlot: 'row0' }],
            ['st', { type: 'tank', label: 'ST 承伤', targetSlot: 'row1' }]
        ];
        const importedEvents = sources.flatMap(([sourceKey, source]) => {
            const file = window.damageCsvStore
                ? window.damageCsvStore.get(sourceKey)
                : this.sourceFiles[sourceKey];
            return this.parseFileEvents(file.text, source, file.name);
        });

        this.resolveTankImmuneDamage(importedEvents);
        this.events = importedEvents
            .filter(event => event.source.type === 'team' || Number.isFinite(event.damage))
            .sort((left, right) => left.seconds - right.seconds || left.order - right.order);
        this.render();
    }

    parseFileEvents(csvText, source, filename) {
        const records = fflogsCsvImporter.parseRecords(csvText);
        const context = fflogsCsvImporter.collectEventContext(records.map(record => record.event));

        return records.map(record => {
            const event = record.event;
            const uMatch = event.match(/\(\s*U\s*:\s*([\d,]+)/i);
            const isImmune = /\bImmune\b/i.test(event);
            if ((!uMatch && !isImmune) || /\bprepares\b/i.test(event)) return null;

            const seconds = fflogsCsvImporter.parseTime(record.time);
            const damage = uMatch ? Number(uMatch[1].replace(/,/g, '')) : null;
            if (!Number.isFinite(seconds) || (uMatch && (!Number.isFinite(damage) || damage <= 0))) return null;

            const name = this.extractAbilityName(event, context, uMatch?.index, isImmune);
            if (source.type === 'tank' && this.isNormalAttack(name)) return null;

            return {
                id: `${filename}:${record.index}`,
                seconds,
                time: fflogsCsvImporter.formatTimelineTime(seconds),
                name,
                damage,
                damageKind: 'all',
                isImmune,
                damageFromImmuneMatch: false,
                source,
                filename,
                order: record.index
            };
        }).filter(Boolean);
    }

    extractAbilityName(event, context, uIndex, isImmune) {
        let prefix = uIndex === undefined
            ? event
            : event.slice(0, uIndex)
                .replace(/(?:\s+\([A-Z]:[^)]*\))*\s*$/, '')
                .replace(/\s+\d[\d,]*\s*$/, '');

        if (isImmune) prefix = prefix.replace(/\s+Immune\s*$/i, '');

        const normalizedPrefix = prefix.trim();
        const target = context.targets.find(item => normalizedPrefix.endsWith(item));
        const sourceAndAbility = target
            ? normalizedPrefix.slice(0, -target.length).trim()
            : normalizedPrefix;
        const source = context.sources.find(item =>
            sourceAndAbility === item || sourceAndAbility.startsWith(`${item} `)
        );

        return source
            ? sourceAndAbility.slice(source.length).trim() || '未知伤害'
            : sourceAndAbility || '未知伤害';
    }

    isNormalAttack(name) {
        const normalizedName = String(name).trim().toLowerCase();
        return normalizedName === '攻击' || normalizedName === 'attack';
    }

    resolveTankImmuneDamage(events) {
        const normalTankEvents = events.filter(event =>
            event.source.type === 'tank' && !event.isImmune && Number.isFinite(event.damage)
        );

        events.filter(event => event.source.type === 'tank' && event.isImmune).forEach(event => {
            const candidates = normalTankEvents
                .filter(candidate => candidate.name === event.name)
                .sort((left, right) => Math.abs(left.seconds - event.seconds) - Math.abs(right.seconds - event.seconds));
            const closest = candidates[0];

            if (closest) {
                event.damage = closest.damage;
                event.damageFromImmuneMatch = true;
                event.immuneReferenceTime = closest.time;
            }
        });
    }

    render() {
        this.updateImportStatus();
        this.renderTargetFilter();
        this.renderRows();
        this.updateCount();
    }

    renderTargetFilter() {
        const select = document.getElementById('comprehensiveTargetFilter');
        if (!select) return;

        const existingValue = select.value || 'all';
        const tanks = (window.PARTY_SLOTS || []).filter(slot => slot.role === 'tank');
        select.innerHTML = `
            <option value="all">全部目标</option>
            ${tanks.map(slot => `<option value="${slot.key}">${slot.label}</option>`).join('')}
        `;
        select.value = [...select.options].some(option => option.value === existingValue)
            ? existingValue
            : 'all';
    }

    getFilteredEvents() {
        const source = document.getElementById('comprehensiveSourceFilter')?.value || 'all';
        const target = document.getElementById('comprehensiveTargetFilter')?.value || 'all';
        const keyword = (document.getElementById('comprehensiveKeywordFilter')?.value || '').trim().toLowerCase();
        const minDamage = Number(document.getElementById('comprehensiveMinDamage')?.value) || 0;

        return this.events.filter(event => {
            if (source !== 'all' && event.source.type !== source) return false;
            if (target !== 'all' && event.source.targetSlot !== target) return false;
            if ((event.damage || 0) < minDamage) return false;
            return !keyword || event.name.toLowerCase().includes(keyword);
        });
    }

    renderRows() {
        const container = document.getElementById('comprehensiveTimelineRows');
        if (!container) return;

        const events = this.getFilteredEvents();
        if (!events.length) {
            container.innerHTML = '<div class="tankbuster-empty">没有符合筛选条件的伤害记录</div>';
            return;
        }

        container.innerHTML = events.map(event => `
            <article class="comprehensive-row ${event.source.type}">
                <time>${event.time}</time>
                <span class="comprehensive-source ${event.source.type}">${event.source.label}</span>
                <strong title="${this.escapeHtml(event.filename)}">${this.escapeHtml(event.name)}</strong>
                <select class="comprehensive-damage-kind" aria-label="伤害属性" onchange="comprehensiveTimeline.updateDamageKind('${event.id}', this.value)">
                    <option value="all" ${event.damageKind === 'all' ? 'selected' : ''}>待选择</option>
                    <option value="physical" ${event.damageKind === 'physical' ? 'selected' : ''}>物理</option>
                    <option value="magic" ${event.damageKind === 'magic' ? 'selected' : ''}>魔法</option>
                </select>
                <span class="comprehensive-damage">U ${event.damage.toLocaleString()}${event.damageFromImmuneMatch ? ' · Immune 回填' : ''}</span>
                ${event.source.type === 'tank' ? `
                    <button class="btn btn-primary btn-sm" type="button" onclick="comprehensiveTimeline.addToTankbuster('${event.id}')">加入死刑页</button>
                ` : '<span class="comprehensive-action-placeholder"></span>'}
            </article>
        `).join('');
    }

    updateCount() {
        const count = document.getElementById('comprehensiveTimelineCount');
        if (count) count.textContent = `${this.getFilteredEvents().length} / ${this.events.length} 条`;
    }

    applyFilters() {
        this.renderRows();
        this.updateCount();
    }

    updateDamageKind(eventId, damageKind) {
        const event = this.events.find(item => item.id === eventId);
        if (!event) return;
        event.damageKind = ['physical', 'magic'].includes(damageKind) ? damageKind : 'all';
    }

    addToTankbuster(eventId) {
        const event = this.events.find(item => item.id === eventId);
        if (!event?.source.targetSlot) return;

        tankbusterPlanner.addImportedEvent({
            time: event.time,
            name: event.name,
            damage: event.damage,
            damageKind: event.damageKind,
            targetSlot: event.source.targetSlot
        });
    }

    escapeHtml(value) {
        return String(value ?? '').replace(/[&<>'"]/g, character => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        })[character]);
    }
}

const comprehensiveTimeline = new ComprehensiveTimeline();
window.comprehensiveTimeline = comprehensiveTimeline;
