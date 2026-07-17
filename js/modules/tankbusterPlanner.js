/**
 * 坦克死刑减伤页面
 * 从当前队伍职业中构建可分配给目标坦克的减伤资源池。
 */
class TankbusterPlanner {
    constructor() {
        this.rows = [];
        this.rowIdCounter = 0;
        this.targetSlot = 'row0';
        this.initialized = false;
        this.sharedStoreInitialized = false;
        this.categoryLabels = {
            self: '自身减伤',
            cotank: '副坦辅助',
            healer: '治疗支援',
            party: '团队减伤'
        };
    }

    init() {
        if (this.initialized) return;

        this.initialized = true;
        this.initSharedStore();
        this.renderTargetOptions();
        this.addRow();
    }

    initSharedStore() {
        if (this.sharedStoreInitialized || !window.damageCsvStore) return;

        this.sharedStoreInitialized = true;
        window.damageCsvStore.subscribe(source => {
            if (source === 'mt' || source === 'st') this.replaceRowsFromTankCsv();
        });

        if (window.damageCsvStore.has('mt') || window.damageCsvStore.has('st')) {
            this.replaceRowsFromTankCsv();
        }
    }

    showPage(page) {
        const teamPage = document.getElementById('teamMitigationPage');
        const tankbusterPage = document.getElementById('tankbusterPage');
        const comprehensivePage = document.getElementById('comprehensiveTimelinePage');
        const teamTab = document.getElementById('teamMitigationTab');
        const tankbusterTab = document.getElementById('tankbusterTab');
        const comprehensiveTab = document.getElementById('comprehensiveTimelineTab');
        const isTeam = page === 'team';
        const isTankbuster = page === 'tankbuster';
        const isComprehensive = page === 'comprehensive';

        teamPage?.classList.toggle('is-hidden', !isTeam);
        tankbusterPage?.classList.toggle('is-hidden', !isTankbuster);
        comprehensivePage?.classList.toggle('is-hidden', !isComprehensive);
        teamTab?.classList.toggle('active', isTeam);
        tankbusterTab?.classList.toggle('active', isTankbuster);
        comprehensiveTab?.classList.toggle('active', isComprehensive);
        teamTab?.setAttribute('aria-selected', String(isTeam));
        tankbusterTab?.setAttribute('aria-selected', String(isTankbuster));
        comprehensiveTab?.setAttribute('aria-selected', String(isComprehensive));

        if (isTankbuster) this.refreshResources();
        if (isComprehensive) window.comprehensiveTimeline?.render();
    }

    addRow() {
        this.rows.push({
            id: this.rowIdCounter++,
            targetSlot: this.targetSlot,
            time: '',
            name: '',
            damage: '',
            damageMode: 'solo',
            splitCount: 2,
            damageKind: 'all',
            selectedResources: []
        });
        this.renderRows();
    }

    addImportedEvent(event) {
        this.setTargetSlot(event.targetSlot);
        this.rows.push({
            id: this.rowIdCounter++,
            targetSlot: event.targetSlot || this.targetSlot,
            time: event.time || '',
            name: event.name || '',
            damage: event.damage || '',
            damageMode: 'solo',
            splitCount: 2,
            damageKind: event.damageKind || 'all',
            selectedResources: []
        });
        this.showPage('tankbuster');
        this.renderRows();
    }

    openTankCsvPicker(targetSlot) {
        const input = document.getElementById(targetSlot === 'row1' ? 'stTankCsvInput' : 'mtTankCsvInput');
        if (input) input.click();
    }

    async importTankCsv(file, targetSlot) {
        if (!file) return;
        if (!this.isExpectedTankFile(file.name, targetSlot)) {
            const label = targetSlot === 'row1' ? 'ST' : 'MT';
            alert(`${label} CSV 文件名必须包含 -${targetSlot === 'row1' ? 'tank2 或 -st' : 'tank1 或 -mt'}。`);
            return;
        }

        try {
            const source = targetSlot === 'row1' ? 'st' : 'mt';
            const importedFile = {
                name: file.name,
                text: fflogsCsvImporter.decodeCsv(await file.arrayBuffer())
            };
            if (window.damageCsvStore) {
                window.damageCsvStore.set(source, importedFile);
            } else {
                this.importedTankFiles = this.importedTankFiles || {};
                this.importedTankFiles[targetSlot] = importedFile;
                this.replaceRowsFromTankCsv();
            }
        } catch (error) {
            console.error('坦克 CSV 导入失败:', error);
            alert(`坦克 CSV 导入失败：${error.message}`);
        }
    }

    isExpectedTankFile(filename, targetSlot) {
        const pattern = targetSlot === 'row1'
            ? /-(?:tank2|st)(?:[^/\\]*)\.csv$/i
            : /-(?:tank1|mt)(?:[^/\\]*)\.csv$/i;
        return pattern.test(filename);
    }

    replaceRowsFromTankCsv() {
        const files = window.damageCsvStore
            ? [['row0', window.damageCsvStore.get('mt')], ['row1', window.damageCsvStore.get('st')]].filter(([, file]) => file)
            : Object.entries(this.importedTankFiles || {});
        if (!files.length || !window.comprehensiveTimeline) return;

        const events = files.flatMap(([targetSlot, file]) => comprehensiveTimeline.parseFileEvents(
            file.text,
            {
                type: 'tank',
                label: targetSlot === 'row1' ? 'ST 承伤' : 'MT 承伤',
                targetSlot
            },
            file.name
        ));
        comprehensiveTimeline.resolveTankImmuneDamage(events);

        const importedRows = events
            .filter(event => Number.isFinite(event.damage))
            .sort((left, right) => left.seconds - right.seconds || left.order - right.order)
            .map(event => ({
                id: this.rowIdCounter++,
                targetSlot: event.source.targetSlot,
                time: event.time,
                name: event.name,
                damage: event.damage,
                damageMode: 'solo',
                splitCount: 2,
                damageKind: event.damageKind || 'all',
                selectedResources: []
            }));

        this.rows = importedRows;
        this.rowIdCounter = Math.max(this.rowIdCounter, importedRows.length);
        this.refreshResources();
        alert(`已从 ${files.length} 个 MT/ST CSV 生成 ${importedRows.length} 条死刑记录。`);
    }

    deleteRow(rowId) {
        this.rows = this.rows.filter(row => row.id !== rowId);
        this.renderRows();
    }

    setTargetSlot(slotKey) {
        const tanks = this.getTankMembers();
        if (!tanks.some(member => member.slot.key === slotKey)) return;

        this.targetSlot = slotKey;
        this.renderTargetOptions();
        this.renderPartySummary();
    }

    updateRow(rowId, field, value) {
        const row = this.rows.find(item => item.id === rowId);
        if (!row) return;

        row[field] = field === 'splitCount'
            ? Math.max(2, Number(value) || 2)
            : value;
        if (field === 'damageKind' || field === 'targetSlot') {
            this.pruneUnavailableResources(row);
            this.renderRows();
            return;
        }

        this.updateRowSummary(row);
    }

    setDamageMode(rowId, damageMode) {
        const row = this.rows.find(item => item.id === rowId);
        if (!row || !['solo', 'shared'].includes(damageMode)) return;

        row.damageMode = damageMode;
        if (damageMode === 'shared') row.splitCount = Math.max(2, Number(row.splitCount) || 2);
        this.renderRows();
    }

    toggleResource(rowId, resourceId) {
        const row = this.rows.find(item => item.id === rowId);
        if (!row) return;

        row.selectedResources = row.selectedResources.includes(resourceId)
            ? row.selectedResources.filter(id => id !== resourceId)
            : [...row.selectedResources, resourceId];
        this.renderRows();
    }

    refreshResources() {
        this.renderTargetOptions();
        this.rows.forEach(row => this.pruneUnavailableResources(row));
        this.renderPartySummary();
        this.renderRows();
    }

    renderTargetOptions() {
        const select = document.getElementById('tankbusterTarget');
        if (!select) return;

        const tanks = this.getTankMembers();
        if (!tanks.some(member => member.slot.key === this.targetSlot)) {
            this.targetSlot = tanks[0]?.slot.key || 'row0';
        }

        select.innerHTML = tanks.map(member => `
            <option value="${member.slot.key}">${member.slot.label} - ${this.escapeHtml(member.job.name)}</option>
        `).join('');
        select.value = this.targetSlot;
    }

    renderPartySummary() {
        const summary = document.getElementById('tankbusterPartySummary');
        if (!summary) return;

        summary.innerHTML = this.getPartyMembers().map(member => `
            <span class="party-member ${member.slot.role}">${member.slot.label} ${this.escapeHtml(member.job.name)}</span>
        `).join('');
    }

    renderRows() {
        const container = document.getElementById('tankbusterRows');
        if (!container) return;

        if (!this.rows.length) {
            container.innerHTML = '<div class="tankbuster-empty">暂无死刑条目</div>';
            return;
        }

        container.innerHTML = this.rows.map(row => this.renderRow(row)).join('');
    }

    renderRow(row) {
        const resources = this.getAvailableResources(row);
        const selected = resources.filter(resource => row.selectedResources.includes(resource.id));
        const calculation = this.calculateDamage(row, selected);

        return `
            <article class="tankbuster-row" id="tankbuster-row-${row.id}">
                <div class="tankbuster-row-main">
                    <label class="tankbuster-field">
                        <span>时间</span>
                        <input type="text" value="${this.escapeHtml(row.time)}" placeholder="如 1m30s" onblur="tankbusterPlanner.updateRow(${row.id}, 'time', this.value)">
                    </label>
                    <label class="tankbuster-field">
                        <span>目标坦克</span>
                        <select onchange="tankbusterPlanner.updateRow(${row.id}, 'targetSlot', this.value)">
                            ${this.renderTankOptions(row.targetSlot)}
                        </select>
                    </label>
                    <label class="tankbuster-field tankbuster-name-field">
                        <span>死刑技能</span>
                        <input type="text" value="${this.escapeHtml(row.name)}" placeholder="技能名称" onblur="tankbusterPlanner.updateRow(${row.id}, 'name', this.value)">
                    </label>
                    <label class="tankbuster-field">
                        <span>伤害</span>
                        <input type="number" min="0" value="${this.escapeHtml(row.damage)}" placeholder="U 值" oninput="tankbusterPlanner.updateRow(${row.id}, 'damage', this.value)">
                    </label>
                    <div class="tankbuster-field tankbuster-mode-field">
                        <span>承伤方式</span>
                        <div class="tankbuster-mode-control" role="group" aria-label="承伤方式">
                            <button class="${row.damageMode === 'solo' ? 'active' : ''}" type="button" onclick="tankbusterPlanner.setDamageMode(${row.id}, 'solo')">单吃</button>
                            <button class="${row.damageMode === 'shared' ? 'active' : ''}" type="button" onclick="tankbusterPlanner.setDamageMode(${row.id}, 'shared')">分摊</button>
                        </div>
                    </div>
                    ${row.damageMode === 'shared' ? `
                        <label class="tankbuster-field tankbuster-split-field">
                            <span>伤害系数</span>
                            <input type="number" min="2" step="1" value="${row.splitCount}" oninput="tankbusterPlanner.updateRow(${row.id}, 'splitCount', this.value)">
                        </label>
                    ` : ''}
                    <label class="tankbuster-field">
                        <span>伤害类型</span>
                        <select onchange="tankbusterPlanner.updateRow(${row.id}, 'damageKind', this.value)">
                            ${this.renderDamageKindOptions(row.damageKind)}
                        </select>
                    </label>
                    <div class="tankbuster-result" id="tankbuster-result-${row.id}">
                        ${this.renderResultMarkup(calculation)}
                    </div>
                    <button class="btn btn-danger btn-sm" type="button" onclick="tankbusterPlanner.deleteRow(${row.id})">删除</button>
                </div>
                <div class="tankbuster-resource-groups">
                    ${Object.keys(this.categoryLabels).map(category => this.renderResourceGroup(row, category, resources)).join('')}
                </div>
            </article>
        `;
    }

    renderDamageKindOptions(selectedKind) {
        const options = [
            ['all', '待选择'],
            ['physical', '物理'],
            ['magic', '魔法']
        ];
        return options.map(([value, label]) => `
            <option value="${value}" ${value === selectedKind ? 'selected' : ''}>${label}</option>
        `).join('');
    }

    renderTankOptions(selectedSlot) {
        return this.getTankMembers().map(member => `
            <option value="${member.slot.key}" ${member.slot.key === selectedSlot ? 'selected' : ''}>${member.slot.label} - ${this.escapeHtml(member.job.name)}</option>
        `).join('');
    }

    renderResourceGroup(row, category, resources) {
        const groupedResources = resources.filter(resource => resource.category === category);
        const buttons = groupedResources.length
            ? groupedResources.map(resource => this.renderResourceButton(row, resource)).join('')
            : '<span class="tank-resource-empty">无可用资源</span>';

        return `
            <section class="tank-resource-group">
                <h3>${this.categoryLabels[category]}</h3>
                <div class="tank-resource-list">${buttons}</div>
            </section>
        `;
    }

    renderResourceButton(row, resource) {
        const active = row.selectedResources.includes(resource.id);
        const source = `${resource.sourceSlot.label} ${resource.sourceJob.name}`;
        const mitigation = resource.type === 1
            ? `${Math.round((1 - this.getResourceCoefficient(resource, row.damageKind)) * 100)}%`
            : `盾 ${resource.coefficient.toLocaleString()}`;
        const availability = resource.repeatable ? '可重复施放' : `CD ${resource.cooldown}s`;
        const title = `${resource.name} / ${source} / ${availability}\n${resource.effect}`;

        return `
            <button
                class="tank-resource ${active ? 'active' : ''}"
                type="button"
                title="${this.escapeHtml(title)}"
                onclick="tankbusterPlanner.toggleResource(${row.id}, '${resource.id}')"
            >
                <span>${this.escapeHtml(resource.name)}</span>
                <small>${source} · ${mitigation}${resource.repeatable ? ' · 可重复' : ''}</small>
            </button>
        `;
    }

    renderResultMarkup(calculation) {
        const sourceDamage = calculation.multiplier > 1
            ? `U ${calculation.rawDamage.toFixed(2)} × ${calculation.multiplier} = ${calculation.effectiveDamage.toFixed(2)}`
            : `U ${calculation.effectiveDamage.toFixed(2)}`;
        return `
            <span>剩余伤害</span>
            <strong>${calculation.damage.toFixed(2)}</strong>
            <small>${sourceDamage}</small>
            <small>-5% ${calculation.low.toFixed(2)} / +5% ${calculation.high.toFixed(2)}</small>
        `;
    }

    updateRowSummary(row) {
        const element = document.getElementById(`tankbuster-result-${row.id}`);
        if (!element) return;

        const selected = this.getAvailableResources(row)
            .filter(resource => row.selectedResources.includes(resource.id));
        element.innerHTML = this.renderResultMarkup(this.calculateDamage(row, selected));
    }

    calculateDamage(row, resources) {
        const rawDamage = Number(row.damage) || 0;
        const multiplier = row.damageMode === 'shared'
            ? Math.max(2, Number(row.splitCount) || 2)
            : 1;
        const originalDamage = rawDamage * multiplier;
        const remainingMultiplier = resources
            .filter(resource => resource.type === 1)
            .reduce((multiplier, resource) => multiplier * this.getResourceCoefficient(resource, row.damageKind), 1);
        const shieldAmount = resources
            .filter(resource => resource.type === 2)
            .reduce((total, resource) => total + resource.coefficient, 0);
        const damage = (originalDamage * remainingMultiplier) - shieldAmount;

        return {
            damage,
            low: damage * 0.95,
            high: damage * 1.05,
            rawDamage,
            multiplier,
            effectiveDamage: originalDamage
        };
    }

    pruneUnavailableResources(row) {
        const availableIds = new Set(this.getAvailableResources(row).map(resource => resource.id));
        row.selectedResources = row.selectedResources.filter(id => availableIds.has(id));
    }

    getAvailableResources(row) {
        const target = this.getTankMembers().find(member => member.slot.key === (row.targetSlot || this.targetSlot));
        if (!target) return [];

        const resources = [
            ...this.getCatalogResources(TANKBUSTER_SELF_RESOURCES[target.job.id], 'self', target),
            ...this.getCoTankResources(target),
            ...this.getHealerResources(),
            ...this.getPartyResources()
        ];

        return resources.filter(resource => this.isResourceCompatible(resource, row.damageKind));
    }

    getCoTankResources(target) {
        return this.getTankMembers()
            .filter(member => member.slot.key !== target.slot.key)
            .flatMap(member => this.getCatalogResources(TANKBUSTER_COTANK_RESOURCES[member.job.id], 'cotank', member));
    }

    getHealerResources() {
        return this.getPartyMembers()
            .filter(member => member.job.role === 'healer')
            .flatMap(member => this.getCatalogResources(TANKBUSTER_HEALER_RESOURCES[member.job.id], 'healer', member));
    }

    getPartyResources() {
        return this.getPartyMembers().flatMap(member => {
            const skills = window.JOB_SKILLS_MAP?.[member.job.id] || {};
            return Object.entries(skills).map(([name, config]) => this.createResource({
                name,
                ...config,
                category: 'party',
                sourceSlot: member.slot,
                sourceJob: member.job
            }));
        });
    }

    getCatalogResources(catalog, category, member) {
        return (catalog || []).map(resource => this.createResource({
            ...resource,
            category,
            sourceSlot: member.slot,
            sourceJob: member.job
        }));
    }

    createResource(resource) {
        return {
            ...resource,
            id: `${resource.category}:${resource.sourceSlot.key}:${resource.name}`,
            type: resource.type || 1,
            coefficient: Number(resource.coefficient),
            cooldown: Number(resource.cooldown) || 0,
            repeatable: Boolean(resource.repeatable),
            damageKind: resource.damageKind || 'all',
            effect: resource.effect || '团队减伤资源'
        };
    }

    isResourceCompatible(resource, damageKind) {
        if (resource.damageCoefficients) return true;
        if (damageKind === 'all' || resource.damageKind === 'all' || resource.damageKind === 'mixed') return true;
        return resource.damageKind === damageKind;
    }

    getResourceCoefficient(resource, damageKind) {
        if (resource.damageCoefficients?.[damageKind]) return resource.damageCoefficients[damageKind];
        return resource.coefficient;
    }

    getPartyMembers() {
        const selection = window.getJobSelection?.() || {};
        return (window.PARTY_SLOTS || []).map(slot => {
            const jobId = selection[slot.key];
            const job = (window.JOBS || []).find(item => item.id === jobId);
            return job ? { slot, job } : null;
        }).filter(Boolean);
    }

    getTankMembers() {
        return this.getPartyMembers().filter(member => member.job.role === 'tank');
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

const percentResource = (name, percent, cooldown, effect, options = {}) => ({
    name,
    type: 1,
    coefficient: Number((1 - percent / 100).toFixed(2)),
    cooldown,
    effect,
    ...options
});

const shieldResource = (name, amount, cooldown, effect, options = {}) => ({
    name,
    type: 2,
    coefficient: amount,
    cooldown,
    effect,
    ...options
});

const TANKBUSTER_SELF_RESOURCES = {
    pld: [
        percentResource('铁壁', 20, 90, '自身受到伤害降低20%'),
        percentResource('卫戍', 40, 120, '自身受到伤害降低40%'),
        percentResource('神圣盾击', 15, 5, '自身受到伤害降低15%'),
        percentResource('神圣领域', 100, 420, '免疫绝大多数攻击')
    ],
    drk: [
        percentResource('铁壁', 20, 90, '自身受到伤害降低20%'),
        percentResource('暗影墙', 30, 120, '自身受到伤害降低30%'),
        percentResource('弃明投暗', 20, 60, '自身受到魔法伤害降低20%', { damageKind: 'magic' }),
        shieldResource('至黑之夜', 25000, 15, '自身护盾估算值')
    ],
    gnb: [
        percentResource('铁壁', 20, 90, '自身受到伤害降低20%'),
        percentResource('大星云', 40, 120, '自身受到伤害降低40%'),
        percentResource('伪装', 10, 90, '自身受到伤害降低10%'),
        percentResource('刚玉之心', 15, 25, '自身受到伤害降低15%'),
        percentResource('超火流星', 100, 360, '将自身HP降至1，并使大部分伤害无效')
    ],
    war: [
        percentResource('铁壁', 20, 90, '自身受到伤害降低20%'),
        percentResource('原初的血烟', 40, 120, '自身受到伤害降低40%'),
        percentResource('原初的血气', 10, 25, '自身受到伤害降低10%'),
        percentResource('死斗', 100, 240, '不会使HP降至1以下')
    ]
};

const TANKBUSTER_COTANK_RESOURCES = {
    pld: [percentResource('干预', 20, 10, '对目标队员的减伤，按副坦开启大减伤时的20%估算')],
    drk: [
        percentResource('献奉', 10, 60, '目标队员受到伤害降低10%，2充能'),
        shieldResource('至黑之夜', 25000, 15, '对目标队员的护盾估算值')
    ],
    gnb: [percentResource('刚玉之心', 15, 25, '目标队员受到伤害降低15%')],
    war: [percentResource('原初的血气', 10, 25, '目标队员受到伤害降低10%')]
};

const TANKBUSTER_HEALER_RESOURCES = {
    sch: [shieldResource('鼓舞激励之策', 24000, 0, '单体鼓舞护盾估算值')],
    sge: [
        percentResource('均衡清汁', 10, 45, '目标队员受到伤害降低10%'),
        shieldResource('寄生清汁', 30000, 120, '单体多层护盾估算值')
    ],
    whm: [
        percentResource('水流幕', 15, 60, '目标队员受到伤害降低15%'),
        shieldResource('神祝祷', 18000, 30, '单体护盾估算值')
    ],
    ast: [
        percentResource('擢升', 10, 60, '目标队员受到伤害降低10%'),
        shieldResource('天星交错', 18000, 30, '单体护盾估算值')
    ]
};

const tankbusterPlanner = new TankbusterPlanner();
window.tankbusterPlanner = tankbusterPlanner;
window.TANKBUSTER_RESOURCE_CATALOG = {
    self: TANKBUSTER_SELF_RESOURCES,
    cotank: TANKBUSTER_COTANK_RESOURCES,
    healer: TANKBUSTER_HEALER_RESOURCES
};
