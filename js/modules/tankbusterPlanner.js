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
        this.memberProfiles = this.loadMemberProfiles();
        this.collapsedPanels = { row0: false, row1: false };
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

    addRow(targetSlot = this.targetSlot) {
        this.rows.push({
            id: this.rowIdCounter++,
            targetSlot,
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

        const lethalEvents = events
            .filter(event => Number.isFinite(event.damage))
            .filter(event => {
                const target = this.getTankMembers().find(member => member.slot.key === event.source.targetSlot);
                return !target?.maxHp || event.damage > target.maxHp;
            })
            .sort((left, right) => left.seconds - right.seconds || left.order - right.order)
        const mergedEvents = this.mergeTankEventsByTime(lethalEvents);
        const importedRows = this.getTankMembers().flatMap(target => mergedEvents
            .map(event => ({
                id: this.rowIdCounter++,
                targetSlot: target.slot.key,
                time: event.time,
                name: event.name,
                damage: event.damage,
                damageMode: 'solo',
                splitCount: 2,
                damageKind: event.damageKind || 'all',
                importSources: event.importSources,
                selectedResources: []
            })));

        this.rows = importedRows;
        this.rowIdCounter = Math.max(this.rowIdCounter, importedRows.length);
        this.refreshResources();
        alert(`已合并 ${files.length} 个 MT/ST CSV，按时间去重后得到 ${mergedEvents.length} 条候选死刑，并分别复制到 MT/ST 两个窗口。未设置坦克血量时会保留全部记录；设置后仅纳入 U 超过原承伤坦克血量上限的技能。`);
    }

    mergeTankEventsByTime(events) {
        const tolerance = 0.5;
        return events.reduce((merged, event) => {
            const current = merged[merged.length - 1];
            if (!current || Math.abs(current.seconds - event.seconds) > tolerance) {
                merged.push({
                    ...event,
                    importSources: [event.source.targetSlot]
                });
                return merged;
            }

            current.importSources = [...new Set([...current.importSources, event.source.targetSlot])];
            if (event.damage > current.damage) {
                current.name = event.name;
                current.damage = event.damage;
                current.time = event.time;
                current.seconds = event.seconds;
                current.damageKind = event.damageKind;
            }
            return merged;
        }, []);
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
        if (field === 'damageKind' || field === 'targetSlot' || field === 'time') {
            this.pruneUnavailableResources(row);
            this.renderRows();
            return;
        }

        this.updateRowSummary(row);
    }

    setDamageMode(rowId, damageMode) {
        const row = this.rows.find(item => item.id === rowId);
        if (!row || !['solo', 'shared', 'none'].includes(damageMode)) return;

        row.damageMode = damageMode;
        if (damageMode === 'shared') row.splitCount = Math.max(2, Number(row.splitCount) || 2);
        if (damageMode === 'none') row.selectedResources = [];
        this.renderRows();
    }

    toggleResource(rowId, resourceId) {
        const row = this.rows.find(item => item.id === rowId);
        if (!row) return;

        const resource = this.getAvailableResources(row).find(item => item.id === resourceId);
        if (!resource) return;

        if (!this.isResourceCompatible(resource, row.damageKind)) {
            alert(`${resource.name} 不适用于当前伤害类型。`);
            return;
        }

        if (!row.selectedResources.includes(resourceId) && !this.isResourceReadyForRow(row, resource)) {
            const schedule = this.getResourceSchedule(row, resource);
            alert(`${resource.name} 仍在冷却中，预计 ${this.formatTimelineTime(schedule.nextReadyAt)} 后可再次使用。`);
            return;
        }

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
            <span class="party-member ${member.slot.role}" title="${this.escapeHtml(member.job.name)} / 血量上限 ${member.maxHp || '待设置'}">${member.slot.label} ${this.escapeHtml(member.name)} · ${member.maxHp ? member.maxHp.toLocaleString() : 'HP 待设置'}</span>
        `).join('');
    }

    renderRows() {
        const container = document.getElementById('tankbusterRows');
        if (!container) return;

        const tanks = this.getTankMembers();
        if (!tanks.length) {
            container.innerHTML = '<div class="tankbuster-empty">请先在职业选择中配置两名坦克</div>';
            return;
        }

        container.innerHTML = tanks.map(tank => this.renderTankPanel(tank)).join('');
    }

    renderTankPanel(tank) {
        const rows = this.rows
            .filter(row => row.targetSlot === tank.slot.key)
            .sort((left, right) => this.parseTimelineTime(left.time) - this.parseTimelineTime(right.time));
        const position = tank.slot.key === 'row0' ? 'MT' : 'ST';
        const hpLabel = tank.maxHp ? `HP ${tank.maxHp.toLocaleString()}` : 'HP 待设置';
        const collapsed = Boolean(this.collapsedPanels[tank.slot.key]);

        return `
            <section class="tankbuster-target-panel ${position.toLowerCase()} ${collapsed ? 'is-collapsed' : ''}">
                <header class="tankbuster-target-header">
                    <div>
                        <span class="tankbuster-target-role">${position}</span>
                        <strong>${this.escapeHtml(tank.name)}</strong>
                        <small>${this.escapeHtml(tank.job.name)} · ${hpLabel}</small>
                    </div>
                    <div class="tankbuster-target-actions">
                        <button class="btn btn-primary btn-sm" type="button" onclick="tankbusterPlanner.addRow('${tank.slot.key}')">添加死刑</button>
                        <button class="tankbuster-collapse-button" type="button" title="${collapsed ? '展开' : '折叠'} ${position}" aria-label="${collapsed ? '展开' : '折叠'} ${position}" aria-expanded="${String(!collapsed)}" onclick="tankbusterPlanner.togglePanel('${tank.slot.key}')">${collapsed ? '>' : 'v'}</button>
                    </div>
                </header>
                ${collapsed ? '' : `
                    <div class="tankbuster-target-rows">
                        ${rows.length
                            ? rows.map(row => this.renderRow(row)).join('')
                            : '<div class="tankbuster-empty">暂无死刑条目</div>'}
                    </div>
                `}
            </section>
        `;
    }

    togglePanel(slotKey) {
        this.collapsedPanels[slotKey] = !this.collapsedPanels[slotKey];
        this.renderRows();
    }

    renderRow(row) {
        const resources = this.getAvailableResources(row);
        const selected = this.getAppliedResources(row, resources);
        const calculation = this.calculateDamage(row, selected);
        const deathStatus = this.getDeathStatus(row, calculation);

        return `
            <article class="tankbuster-row" id="tankbuster-row-${row.id}">
                <div class="tankbuster-row-main">
                    <label class="tankbuster-field">
                        <span>时间</span>
                        <input type="text" value="${this.escapeHtml(row.time)}" placeholder="如 1m30s" onblur="tankbusterPlanner.updateRow(${row.id}, 'time', this.value)">
                    </label>
                    <label class="tankbuster-field tankbuster-name-field">
                        <span>技能</span>
                        <input type="text" value="${this.escapeHtml(row.name)}" title="${this.escapeHtml(row.name)}" placeholder="技能名称" onblur="tankbusterPlanner.updateRow(${row.id}, 'name', this.value)">
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
                            <button class="${row.damageMode === 'none' ? 'active' : ''}" type="button" onclick="tankbusterPlanner.setDamageMode(${row.id}, 'none')">不吃</button>
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
                        ${this.renderResultMarkup(calculation, deathStatus)}
                    </div>
                    <button class="btn btn-danger btn-sm" type="button" onclick="tankbusterPlanner.deleteRow(${row.id})">删除</button>
                </div>
                ${row.damageMode === 'none' ? '' : `
                    <div class="tankbuster-resource-groups">
                        ${Object.keys(this.categoryLabels).map(category => this.renderResourceGroup(row, category, resources)).join('')}
                    </div>
                `}
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
            <option value="${member.slot.key}" ${member.slot.key === selectedSlot ? 'selected' : ''}>${member.slot.label}</option>
        `).join('');
    }

    loadMemberProfiles() {
        const profiles = {};
        const slots = window.PARTY_SLOTS || [];

        try {
            const saved = JSON.parse(localStorage.getItem('tankbusterMemberProfiles') || '{}');
            slots.forEach(slot => {
                profiles[slot.key] = {
                    name: String(saved[slot.key]?.name || slot.label).trim() || slot.label,
                    maxHp: Math.max(0, Number(saved[slot.key]?.maxHp) || 0)
                };
            });
        } catch (error) {
            slots.forEach(slot => {
                profiles[slot.key] = { name: slot.label, maxHp: 0 };
            });
        }

        return profiles;
    }

    openPartySettings() {
        const existing = document.getElementById('party-member-settings-modal');
        if (existing) existing.remove();

        const modal = document.createElement('div');
        modal.id = 'party-member-settings-modal';
        modal.className = 'job-modal-overlay';
        modal.innerHTML = `
            <div class="job-modal-content party-settings-modal">
                <div class="job-modal-header">
                    <div>
                        <h2>队伍成员与血量</h2>
                        <div class="job-modal-subtitle">名称可自定义；坦克血量用于死刑判定</div>
                    </div>
                    <button class="job-close-btn" type="button" onclick="tankbusterPlanner.closePartySettings()">✕</button>
                </div>
                <div class="party-settings-list">
                    ${(window.PARTY_SLOTS || []).map(slot => {
                        const profile = this.memberProfiles[slot.key] || { name: slot.label, maxHp: 0 };
                        const member = this.getPartyMembers().find(item => item.slot.key === slot.key);
                        return `
                            <label class="party-settings-row">
                                <span>${slot.label} ${member ? this.escapeHtml(member.job.name) : ''}</span>
                                <input id="party-name-${slot.key}" type="text" value="${this.escapeHtml(profile.name)}" aria-label="${slot.label} 名称">
                                <input id="party-hp-${slot.key}" type="number" min="0" step="1" value="${profile.maxHp || ''}" placeholder="血量上限" aria-label="${slot.label} 血量上限">
                            </label>
                        `;
                    }).join('')}
                </div>
                <div class="job-modal-footer">
                    <button class="btn btn-secondary" type="button" onclick="tankbusterPlanner.closePartySettings()">取消</button>
                    <button class="btn btn-primary" type="button" onclick="tankbusterPlanner.saveMemberProfiles()">保存</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    closePartySettings() {
        document.getElementById('party-member-settings-modal')?.remove();
    }

    saveMemberProfiles() {
        (window.PARTY_SLOTS || []).forEach(slot => {
            const name = document.getElementById(`party-name-${slot.key}`)?.value.trim();
            const maxHp = Number(document.getElementById(`party-hp-${slot.key}`)?.value) || 0;
            this.memberProfiles[slot.key] = { name: name || slot.label, maxHp: Math.max(0, maxHp) };
        });

        try {
            localStorage.setItem('tankbusterMemberProfiles', JSON.stringify(this.memberProfiles));
        } catch (error) {
            console.warn('无法保存队伍血量设置:', error);
        }

        this.closePartySettings();
        this.refreshResources();
        if (window.damageCsvStore?.has('mt') || window.damageCsvStore?.has('st')) {
            this.replaceRowsFromTankCsv();
        }
    }

    getMemberProfiles() {
        return JSON.parse(JSON.stringify(this.memberProfiles));
    }

    setMemberProfiles(profiles) {
        (window.PARTY_SLOTS || []).forEach(slot => {
            const profile = profiles?.[slot.key] || {};
            this.memberProfiles[slot.key] = {
                name: String(profile.name || slot.label).trim() || slot.label,
                maxHp: Math.max(0, Number(profile.maxHp) || 0)
            };
        });

        try {
            localStorage.setItem('tankbusterMemberProfiles', JSON.stringify(this.memberProfiles));
        } catch (error) {
            console.warn('无法保存队伍血量设置:', error);
        }

        this.refreshResources();
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
        const compatible = this.isResourceCompatible(resource, row.damageKind);
        const active = compatible && row.selectedResources.includes(resource.id);
        const inherited = compatible && !active && this.getInheritedResourceUse(row, resource);
        const schedule = this.getResourceSchedule(row, resource);
        const source = `${resource.sourceSlot.label} ${resource.sourceJob.name}`;
        const mitigation = this.getResourceMitigationLabel(resource, row);
        const availability = resource.repeatable
            ? '可重复施放'
            : `CD ${resource.cooldown}s${resource.charges > 1 ? ` / ${resource.charges}充能` : ''}${resource.duration ? ` / 持续 ${resource.duration}s` : ''}`;
        const scheduleText = !schedule.ready
            ? ` / 自 ${this.formatTimelineTime(schedule.cooldownStartsAt)} 冷却至 ${this.formatTimelineTime(schedule.nextReadyAt)}`
            : inherited
                ? ` / 由 ${inherited.row.time} 的施放覆盖`
                : '';
        const compatibilityText = compatible ? '' : ' / 不适用于当前伤害类型';
        const title = `${resource.name} / ${source} / ${mitigation} / ${availability}${compatibilityText}${scheduleText}\n${resource.effect}`;
        const imageName = this.getResourceImageName(resource.name);

        return `
            <button
                class="tank-resource ${active ? 'active' : ''} ${inherited ? 'covered' : ''} ${!compatible ? 'incompatible' : ''} ${compatible && !active && !inherited && !schedule.ready ? 'on-cooldown' : ''}"
                type="button"
                title="${this.escapeHtml(title)}"
                aria-label="${this.escapeHtml(title)}"
                onclick="tankbusterPlanner.toggleResource(${row.id}, '${resource.id}')"
            >
                <img src="figs/skills/${this.escapeHtml(imageName)}" alt="" onerror="this.hidden = true; this.nextElementSibling.hidden = false;">
                <span class="tank-resource-fallback" hidden>${this.escapeHtml(this.getResourceFallbackLabel(resource.name))}</span>
            </button>
        `;
    }

    getResourceImageName(skillName) {
        const aliases = {
            '扩散盾': '展开战术'
        };
        return `${aliases[skillName] || skillName}.png`;
    }

    getResourceMitigationLabel(resource, row) {
        if (resource.type === 2) {
            return resource.shieldMaxHpPercent
                ? `盾 最大HP ${resource.shieldMaxHpPercent}%`
                : `盾 ${resource.coefficient.toLocaleString()}`;
        }

        if (resource.type === 3) return `最大HP +${Math.round(resource.coefficient * 100)}%`;

        const layers = resource.mitigationLayers || [];
        const reduction = (1 - this.getResourceCoefficient(resource, row.damageKind)) * 100;
        const layerText = layers.length > 1 ? `（${layers.join('% + ')}%）` : '';
        const hpText = resource.maxHpPercent ? ` / 最大HP +${resource.maxHpPercent}%` : '';
        return `${reduction % 1 ? reduction.toFixed(2) : Math.round(reduction)}%${layerText}${hpText}`;
    }

    getResourceFallbackLabel(skillName) {
        return String(skillName).replace(/\d+$/, '').slice(0, 2);
    }

    renderResultMarkup(calculation, deathStatus) {
        if (calculation.notTaking) {
            return `
                <span>承伤结果</span>
                <strong>不吃</strong>
                <small class="tankbuster-death-status normal">该坦克不承受此技能</small>
            `;
        }

        const sourceDamage = calculation.multiplier > 1
            ? `U ${calculation.rawDamage.toFixed(2)} × ${calculation.multiplier} = ${calculation.effectiveDamage.toFixed(2)}`
            : `U ${calculation.effectiveDamage.toFixed(2)}`;
        return `
            <span>剩余伤害</span>
            <strong>${calculation.damage.toFixed(2)}</strong>
            <small>${sourceDamage}</small>
            <small>-5% ${calculation.low.toFixed(2)} / +5% ${calculation.high.toFixed(2)}</small>
            <small class="tankbuster-death-status ${deathStatus.kind}">${deathStatus.text}</small>
        `;
    }

    updateRowSummary(row) {
        const element = document.getElementById(`tankbuster-result-${row.id}`);
        if (!element) return;

        const resources = this.getAvailableResources(row);
        const calculation = this.calculateDamage(row, this.getAppliedResources(row, resources));
        element.innerHTML = this.renderResultMarkup(calculation, this.getDeathStatus(row, calculation));
    }

    calculateDamage(row, resources) {
        if (row.damageMode === 'none') {
            return {
                notTaking: true,
                damage: 0,
                low: 0,
                high: 0,
                rawDamage: Number(row.damage) || 0,
                multiplier: 0,
                effectiveDamage: 0,
                maxHpMultiplier: 1
            };
        }

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
            .reduce((total, resource) => total + this.getResourceShieldAmount(resource, row), 0);
        const damage = Math.max(0, (originalDamage * remainingMultiplier) - shieldAmount);
        const maxHpMultiplier = resources
            .filter(resource => resource.type === 3 || resource.maxHpPercent)
            .reduce((multiplier, resource) => {
                const increase = resource.type === 3 ? resource.coefficient : resource.maxHpPercent / 100;
                return multiplier * (1 + increase);
            }, 1);

        return {
            damage,
            low: damage * 0.95,
            high: damage * 1.05,
            rawDamage,
            multiplier,
            effectiveDamage: originalDamage,
            maxHpMultiplier
        };
    }

    getDeathStatus(row, calculation) {
        if (calculation.notTaking) return { kind: 'normal', text: '该坦克不承受此技能' };

        const target = this.getTankMembers().find(member => member.slot.key === row.targetSlot);
        if (!target?.maxHp) return { kind: 'pending', text: '血量上限待设置，无法判断死刑' };

        const rawLethal = calculation.effectiveDamage > target.maxHp;
        const effectiveMaxHp = target.maxHp * calculation.maxHpMultiplier;
        const mitigatedLethal = calculation.damage > effectiveMaxHp;
        const hpText = `HP ${effectiveMaxHp.toLocaleString()}`;

        if (!rawLethal) return { kind: 'normal', text: `原始 U 未超过 ${hpText}，非死刑` };
        if (mitigatedLethal) return { kind: 'lethal', text: `原始致死；减伤后仍会去世（${hpText}）` };
        return { kind: 'survives', text: `原始致死；减伤后存活（${hpText}）` };
    }

    getResourceShieldAmount(resource, row) {
        if (!resource.shieldMaxHpPercent) return resource.coefficient;
        const target = this.getTankMembers().find(member => member.slot.key === row.targetSlot);
        return target?.maxHp ? target.maxHp * resource.shieldMaxHpPercent / 100 : 0;
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

        return resources;
    }

    getAppliedResources(row, resources) {
        const compatibleResources = resources.filter(resource => this.isResourceCompatible(resource, row.damageKind));
        const direct = compatibleResources.filter(resource => row.selectedResources.includes(resource.id));
        const inherited = compatibleResources.filter(resource => !row.selectedResources.includes(resource.id)
            && this.getInheritedResourceUse(row, resource));
        return [...direct, ...inherited];
    }

    getInheritedResourceUse(row, resource) {
        const rowTime = this.parseTimelineTime(row.time);
        if (!Number.isFinite(rowTime) || !resource.duration) return null;

        return this.rows
            .filter(candidate => candidate.id !== row.id && candidate.selectedResources.includes(resource.id))
            .map(candidate => ({ row: candidate, time: this.parseTimelineTime(candidate.time) }))
            .filter(candidate => Number.isFinite(candidate.time) && candidate.time <= rowTime && rowTime - candidate.time <= resource.duration)
            .sort((left, right) => right.time - left.time)[0] || null;
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
            duration: Number(resource.duration) || 0,
            charges: Math.max(1, Number(resource.charges) || 1),
            mitigationLayers: Array.isArray(resource.mitigationLayers) ? resource.mitigationLayers : null,
            maxHpPercent: Number(resource.maxHpPercent) || 0,
            shieldMaxHpPercent: Number(resource.shieldMaxHpPercent) || 0,
            repeatable: Boolean(resource.repeatable),
            damageKind: resource.damageKind || 'all',
            effect: resource.effect || '团队减伤资源'
        };
    }

    isResourceCompatible(resource, damageKind) {
        if (resource.damageCoefficients) return true;
        const resourceDamageKind = resource.damageKind || 'all';
        if (damageKind === 'all' || resourceDamageKind === 'all' || resourceDamageKind === 'mixed') return true;
        return resourceDamageKind === damageKind;
    }

    getResourceCoefficient(resource, damageKind) {
        if (resource.damageCoefficients?.[damageKind]) return resource.damageCoefficients[damageKind];
        return resource.coefficient;
    }

    getResourceSchedule(row, resource) {
        const rowTime = this.parseTimelineTime(row.time);
        if (!Number.isFinite(rowTime) || !resource.cooldown || resource.repeatable) {
            return { ready: true, cooldownStartsAt: 0, nextReadyAt: 0 };
        }

        const previousUses = this.rows
            .filter(candidate => candidate.id !== row.id && candidate.selectedResources.includes(resource.id))
            .map(candidate => ({ row: candidate, time: this.parseTimelineTime(candidate.time) }))
            .filter(candidate => Number.isFinite(candidate.time) && candidate.time <= rowTime)
            .sort((left, right) => left.time - right.time);
        const nextChargeTimes = Array(resource.charges || 1).fill(0);

        previousUses.forEach(use => {
            const earliestCharge = Math.min(...nextChargeTimes);
            const activationTime = this.getResourceActivationTime(use.time, resource);
            if (activationTime < earliestCharge) return;
            const chargeIndex = nextChargeTimes.indexOf(earliestCharge);
            nextChargeTimes[chargeIndex] = activationTime + resource.cooldown;
        });

        const nextReadyAt = Math.min(...nextChargeTimes);
        const requestedActivationTime = this.getResourceActivationTime(rowTime, resource);
        return {
            ready: requestedActivationTime >= nextReadyAt,
            cooldownStartsAt: nextReadyAt ? nextReadyAt - resource.cooldown : 0,
            nextReadyAt
        };
    }

    getResourceActivationTime(selectionTime, resource) {
        return selectionTime;
    }

    getResourceCoverageEnd(castTime, resource) {
        if (!resource.duration) return castTime;

        return this.rows
            .map(candidate => ({ row: candidate, time: this.parseTimelineTime(candidate.time), damage: Number(candidate.damage) || 0 }))
            .filter(candidate => Number.isFinite(candidate.time)
                && candidate.damage > 0
                && candidate.row.damageMode !== 'none'
                && this.isResourceApplicableToRow(resource, candidate.row)
                && candidate.time >= castTime
                && candidate.time <= castTime + resource.duration)
            .reduce((latestTime, candidate) => Math.max(latestTime, candidate.time), castTime);
    }

    isResourceApplicableToRow(resource, row) {
        if (resource.category === 'self') return row.targetSlot === resource.sourceSlot.key;
        if (resource.category === 'cotank') return row.targetSlot !== resource.sourceSlot.key;
        return true;
    }

    isResourceReadyForRow(row, resource) {
        return this.getResourceSchedule(row, resource).ready;
    }

    parseTimelineTime(value) {
        const text = String(value || '').trim();
        const minuteMatch = text.match(/^(?:(\d+(?:\.\d+)?)m)?(?:(\d+(?:\.\d+)?)s)?$/i);
        if (minuteMatch && (minuteMatch[1] || minuteMatch[2])) {
            return (Number(minuteMatch[1]) || 0) * 60 + (Number(minuteMatch[2]) || 0);
        }
        return fflogsCsvImporter?.parseTime(text);
    }

    formatTimelineTime(seconds) {
        return fflogsCsvImporter?.formatTimelineTime(seconds) || `${seconds}s`;
    }

    getPartyMembers() {
        const selection = window.getJobSelection?.() || {};
        return (window.PARTY_SLOTS || []).map(slot => {
            const jobId = selection[slot.key];
            const job = (window.JOBS || []).find(item => item.id === jobId);
            if (!job) return null;
            const profile = this.memberProfiles[slot.key] || { name: slot.label, maxHp: 0 };
            return { slot, job, name: profile.name, maxHp: profile.maxHp };
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

const percentResource = (name, percent, cooldown, effect, options = {}) => {
    const mitigationLayers = options.mitigationLayers || [percent];
    const coefficient = Number(mitigationLayers
        .reduce((remaining, layer) => remaining * (1 - layer / 100), 1)
        .toFixed(6));
    return {
        name,
        type: 1,
        coefficient,
        cooldown,
        effect,
        ...options,
        mitigationLayers
    };
};

const shieldResource = (name, amount, cooldown, effect, options = {}) => ({
    name,
    type: 2,
    coefficient: amount,
    cooldown,
    effect,
    ...options
});

const maxHpResource = (name, percent, cooldown, duration, effect, options = {}) => ({
    name,
    type: 3,
    coefficient: Number((percent / 100).toFixed(2)),
    cooldown,
    duration,
    effect,
    ...options
});

const TANKBUSTER_SELF_RESOURCES = {
    pld: [
        percentResource('铁壁', 20, 90, '自身受到伤害降低20%；额外提高自身受到治疗效果15%', { duration: 20 }),
        percentResource('壁垒', 20, 90, '保证格挡全部伤害；按20%格挡减伤计算', { duration: 10 }),
        percentResource('卫戍', 40, 120, '自身受到伤害降低40%，并获得相当于治疗量1,000 potency的护盾', { duration: 15 }),
        percentResource('神圣盾阵', 15, 5, '8秒内受到伤害降低15%；前4秒额外获得骑士的坚守15%。按重叠阶段计算为27.75%减伤', { duration: 8, mitigationLayers: [15, 15] }),
        percentResource('神圣领域', 100, 420, '免疫绝大多数攻击', { duration: 10 })
    ],
    drk: [
        percentResource('铁壁', 20, 90, '自身受到伤害降低20%；额外提高自身受到治疗效果15%', { duration: 20 }),
        percentResource('暗影卫', 40, 120, '自身受到伤害降低40%；生命低于50%或效果结束时恢复生命', { duration: 15 }),
        percentResource('弃明投暗', 20, 60, '自身受到魔法伤害降低20%', { damageKind: 'magic', duration: 10 }),
        percentResource('献奉', 10, 60, '自身受到伤害降低10%，2充能', { duration: 10, charges: 2 }),
        shieldResource('至黑之夜', 0, 15, '为自身附加相当于最大HP 25%的护盾', { duration: 7, shieldMaxHpPercent: 25 }),
        percentResource('行尸走肉', 100, 300, '不会使HP降至1以下', { duration: 10 })
    ],
    gnb: [
        percentResource('铁壁', 20, 90, '自身受到伤害降低20%；额外提高自身受到治疗效果15%', { duration: 20 }),
        percentResource('大星云', 40, 120, '自身受到伤害降低40%，最大HP提高20%并回复提高的生命值', { duration: 15, maxHpPercent: 20 }),
        percentResource('伪装', 10, 90, '自身受到伤害降低10%，并提高招架率', { duration: 20 }),
        percentResource('刚玉之心', 15, 25, '8秒内受到伤害降低15%；前4秒额外获得刚玉的清晰15%。按重叠阶段计算为27.75%减伤', { duration: 8, mitigationLayers: [15, 15] }),
        percentResource('超火流星', 100, 360, '将自身HP降至1，并使大部分伤害无效', { duration: 10 })
    ],
    war: [
        percentResource('铁壁', 20, 90, '自身受到伤害降低20%；额外提高自身受到治疗效果15%', { duration: 20 }),
        percentResource('原初的血烟', 40, 120, '自身受到伤害降低40%；受到物理伤害时反击，结束后获得持续恢复', { duration: 15 }),
        maxHpResource('战栗', 20, 90, 10, '最大HP提高20%，并回复提高的生命值'),
        percentResource('原初的血气', 10, 25, '8秒内受到伤害降低10%；前4秒额外获得原初的刚毅10%。按重叠阶段计算为19%减伤', { duration: 8, mitigationLayers: [10, 10] }),
        percentResource('死斗', 100, 240, '不会使HP降至1以下', { duration: 10 })
    ]
};

const TANKBUSTER_COTANK_RESOURCES = {
    pld: [percentResource('干预', 10, 10, '目标受到伤害降低10%；若骑士自身开启铁壁或卫戍，额外10%；前4秒另有骑士的坚守10%。按最大重叠阶段计算为27.1%减伤', { duration: 8, mitigationLayers: [10, 10, 10] })],
    drk: [
        percentResource('献奉', 10, 60, '目标队员受到伤害降低10%，2充能', { duration: 10, charges: 2 }),
        shieldResource('至黑之夜', 0, 15, '为目标附加相当于最大HP 25%的护盾', { duration: 7, shieldMaxHpPercent: 25 })
    ],
    gnb: [percentResource('刚玉之心', 15, 25, '8秒内目标受到伤害降低15%；前4秒额外获得刚玉的清晰15%。按重叠阶段计算为27.75%减伤', { duration: 8, mitigationLayers: [15, 15] })],
    war: [percentResource('原初的勇猛', 10, 25, '8秒内目标受到伤害降低10%；前4秒额外获得原初的刚毅10%。按重叠阶段计算为19%减伤', { duration: 8, mitigationLayers: [10, 10] })]
};

const TANKBUSTER_HEALER_RESOURCES = {
    sch: [maxHpResource('生命回生法', 10, 60, 10, '目标最大HP提高10%，并回复提高的生命值；同时提高受到的治疗效果10%')],
    sge: [
        percentResource('均衡清汁', 10, 45, '目标队员受到伤害降低10%，持续15秒', { duration: 15 }),
        shieldResource('寄生清汁', 30000, 120, '单体多层护盾估算值，持续15秒', { duration: 15 })
    ],
    whm: [
        percentResource('水流幕', 10, 60, '目标队员受到伤害降低10%，持续8秒', { duration: 8 }),
        shieldResource('神祝祷', 18000, 30, '单体护盾估算值，持续30秒', { duration: 30 })
    ],
    ast: [
        percentResource('擢升', 10, 60, '目标队员受到伤害降低10%，持续8秒', { duration: 8 }),
        shieldResource('天星交错', 18000, 30, '单体护盾估算值，持续30秒', { duration: 30 })
    ]
};

const tankbusterPlanner = new TankbusterPlanner();
window.tankbusterPlanner = tankbusterPlanner;
window.TANKBUSTER_RESOURCE_CATALOG = {
    self: TANKBUSTER_SELF_RESOURCES,
    cotank: TANKBUSTER_COTANK_RESOURCES,
    healer: TANKBUSTER_HEALER_RESOURCES
};
