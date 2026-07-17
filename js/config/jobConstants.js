// 旧版任意8行职业矩阵实现保留在本地作用域，实际导出由文件底部 v2 覆盖。
(function legacyJobConstants() {
    return;
/**
 * ============================================================================
 * 职业常量配置
 * FF14 21个职业（8行 × 21列矩阵）+ 职业技能定义
 * ============================================================================
 */

// 定义21个职业（使用短ID格式）
const JOBS = [
    // 防护职业
    { id: 'pld', name: '骑士', nameEn: 'Paladin', role: 'tank' },
    { id: 'drk', name: '暗骑', nameEn: 'Dark Knight', role: 'tank' },
    { id: 'gnb', name: '绝枪', nameEn: 'Gunbreaker', role: 'tank' },
    { id: 'war', name: '战士', nameEn: 'Warrior', role: 'tank' },

    // 治疗职业
    { id: 'sch', name: '学者', nameEn: 'Scholar', role: 'healer' },
    { id: 'sge', name: '贤者', nameEn: 'Sage', role: 'healer' },
    { id: 'whm', name: '白魔', nameEn: 'White Mage', role: 'healer' },
    { id: 'ast', name: '占星', nameEn: 'Astrologian', role: 'healer' },

    // 近战DPS
    { id: 'mnk', name: '武僧', nameEn: 'Monk', role: 'melee' },
    { id: 'nin', name: '忍者', nameEn: 'Ninja', role: 'melee' },
    { id: 'drg', name: '龙骑', nameEn: 'Dragoon', role: 'melee' },
    { id: 'rpr', name: '镰刀', nameEn: 'Reaper', role: 'melee' },
    { id: 'vpr', name: '蝰蛇', nameEn: 'Viper', role: 'melee' },
    { id: 'sam', name: '武士', nameEn: 'Samurai', role: 'melee' },

    // 远程DPS
    { id: 'dnc', name: '舞者', nameEn: 'Dancer', role: 'ranged' },
    { id: 'brd', name: '诗人', nameEn: 'Bard', role: 'ranged' },
    { id: 'mch', name: '机工', nameEn: 'Machinist', role: 'ranged' },

    // 法系DPS
    { id: 'blm', name: '黑魔', nameEn: 'Black Mage', role: 'caster' },
    { id: 'smn', name: '召唤', nameEn: 'Summoner', role: 'caster' },
    { id: 'rdm', name: '赤魔', nameEn: 'Red Mage', role: 'caster' },
    { id: 'pct', name: '绘魔', nameEn: 'Pictomancer', role: 'caster' }
];

// 职业矩阵：8行，每行包含所有21个职业
const JOB_MATRIX = [];
for (let i = 0; i < 8; i++) {
    JOB_MATRIX.push([...JOBS]);
}

// 默认职业选择（8行的默认配置）
const DEFAULT_JOB_SELECTION = {
    row0: 'pld',   // 第1行默认：骑士
    row1: 'drk',   // 第2行默认：暗骑
    row2: 'sch',   // 第3行默认：学者
    row3: 'whm',   // 第4行默认：白魔
    row4: 'mnk',   // 第5行默认：武僧
    row5: 'nin',   // 第6行默认：忍者
    row6: 'brd',   // 第7行默认：诗人
    row7: 'blm'    // 第8行默认：黑魔
};

// 当前职业选择状态
let currentJobSelection = { ...DEFAULT_JOB_SELECTION };

/**
 * ============================================================================
 * 各职业独立技能字典
 * 每个职业只包含自己特有的技能
 * ============================================================================
 */

// 骑士 (PLD)
const Paladin = {
    '圣光幕帘': {
        'type': 2,
        'coefficient': 19000,
        'cooldown': 90
    },
    '武装戍卫': {
        'type': 1,
        'coefficient': 0.15,
        'cooldown': 120
    },
    '血仇': {
        'type': 1,
        'coefficient': 0.1,
        'cooldown': 60
    }
};

// 暗骑 (DRK)
const DarkKnight = {
    '暗黑步道': {
        'type': 1,
        'coefficient': 0.1,
        'cooldown': 90
    },
    '血仇': {
        'type': 1,
        'coefficient': 0.1,
        'cooldown': 60
    }
};

// 绝枪 (GNB)
const Gunbreaker = {
    '光之心': {
        'type': 1,
        'coefficient': 0.1,
        'cooldown': 90
    },
    '血仇': {
        'type': 1,
        'coefficient': 0.1,
        'cooldown': 60
    }
};

// 战士 (WAR)
const Warrior = {
    '摆脱': {
        'type': 2,
        'coefficient': 19000,
        'cooldown': 90
    },
    '血仇': {
        'type': 1,
        'coefficient': 0.1,
        'cooldown': 60
    }
};

// 学者 (SCH)
const Scholar = {
    '疾风怒涛之计': {
        'type': 1,
        'coefficient': 0.1,
        'cooldown': 120
    },
    '幻光': {
        'type': 1,
        'coefficient': 0.05,
        'cooldown': 120
    },
    '群盾': {
        'type': 2,
        'coefficient': 27000,
        'cooldown': 0
    },
    '展开战术': {
        'type': 2,
        'coefficient': 73000,
        'cooldown': 0
    },
    '野战治疗阵': {
        'type': 1,
        'coefficient': 0.1,
        'cooldown': 30
    },
};

// 贤者 (SGE)
const Sage = {
};

// 白魔 (WHM)
const WhiteMage = {
    '节制': { cooldown: 120, type: 1, coefficient: 0.10 },
    '全大赦': { cooldown: 60, type: 1, coefficient: 0.10 }
};

// 占星 (AST)
const Astrologian = {
    '太阳星座': { cooldown: 120, type: 1, coefficient: 0.10 },
    '命运之轮': { cooldown: 60, type: 1, coefficient: 0.10 }
};

// 诗人 (BRD)
const Bard = {
    '行吟': { cooldown: 90, type: 1, coefficient: 0.15 }
};

// 机工 (MCH)
const Machinist = {
    '策动': { cooldown: 90, type: 1, coefficient: 0.15 },
    '武装接触': { cooldown: 120, type: 1, coefficient: 0.1 },
};

// 舞者 (DNC)
const Dancer = {
    '防守之桑巴': { cooldown: 90, type: 1, coefficient: 0.15 },
};

// 武僧 (MNK)
const Monk = {
    '牵制': { cooldown: 90, type: 1, coefficient: 0.05 }
};

// 忍者 (NIN)
const Ninja = {
    '牵制': { cooldown: 90, type: 1, coefficient: 0.05 }
};

// 龙骑 (DRG)
const Dragoon = {
    '牵制': { cooldown: 90, type: 1, coefficient: 0.05 }
};

// 镰刀 (RPR)
const Reaper = {
    '牵制': { cooldown: 90, type: 1, coefficient: 0.05 }
};

// 蝰蛇 (VPR)
const Viper = {
    '牵制': { cooldown: 90, type: 1, coefficient: 0.05 }
};

// 武士 (SAM)
const Samurai = {
    '牵制': { cooldown: 90, type: 1, coefficient: 0.05 }
};

// 黑魔 (BLM)
const BlackMage = {
    '病毒': { cooldown: 90, type: 1, coefficient: 0.10 }
};

// 召唤 (SMN)
const Summoner = {
    '病毒': { cooldown: 90, type: 1, coefficient: 0.10 }
};

// 赤魔 (RDM)
const RedMage = {
    '病毒': { cooldown: 90, type: 1, coefficient: 0.10 },
    '抗死': { cooldown: 120, type: 1, coefficient: 0.10 }
};

// 绘魔 (PCT)
const Pictomancer = {
    '病毒': { cooldown: 90, type: 1, coefficient: 0.10 }
};

/**
 * ============================================================================
 * 职业技能字典映射表
 * 将职业ID映射到对应的技能字典
 * ============================================================================
 */
const JOB_SKILLS_MAP = {
    'pld': Paladin,
    'drk': DarkKnight,
    'gnb': Gunbreaker,
    'war': Warrior,
    'sch': Scholar,
    'sge': Sage,
    'whm': WhiteMage,
    'ast': Astrologian,
    'brd': Bard,
    'mch': Machinist,
    'dnc': Dancer,
    'mnk': Monk,
    'nin': Ninja,
    'drg': Dragoon,
    'rpr': Reaper,
    'vpr': Viper,
    'sam': Samurai,
    'blm': BlackMage,
    'smn': Summoner,
    'rdm': RedMage,
    'pct': Pictomancer
};

/**
 * ============================================================================
 * 职业选择管理功能
 * ============================================================================
 */

/**
 * 设置职业选择
 * @param {Object} selection - 职业选择对象 {row0: 'pld', row1: 'drk', ...}
 */
function setJobSelection(selection) {
    currentJobSelection = { ...selection };
    console.log('职业配置已更新:', currentJobSelection);

    // 保存到localStorage
    try {
        localStorage.setItem('jobSelection', JSON.stringify(currentJobSelection));
        console.log('✓ 职业配置已保存到本地存储');
    } catch (error) {
        console.warn('无法保存到本地存储:', error);
    }

    // 自动更新技能配置（根据选中的职业生成）
    const selectedJobs = Object.values(selection);
    if (window.SKILL_CONSTANTS?.updateSkillsConfigByJobs) {
        window.SKILL_CONSTANTS.updateSkillsConfigByJobs(selectedJobs);
    } else if (window.skillsConfigManager) {
        window.skillsConfigManager.updateConfigByJob(selectedJobs);
    }
}

/**
 * 获取当前职业选择
 * @returns {Object} 当前职业选择
 */
function getJobSelection() {
    return { ...currentJobSelection };
}

/**
 * 重置为默认职业选择
 */
function resetJobSelection() {
    currentJobSelection = { ...DEFAULT_JOB_SELECTION };
    console.log('职业选择已重置为默认配置');

    try {
        localStorage.setItem('jobSelection', JSON.stringify(currentJobSelection));
    } catch (error) {
        console.warn('无法保存到本地存储:', error);
    }

    return currentJobSelection;
}

/**
 * 从本地存储加载职业选择
 */
function loadJobSelectionFromStorage() {
    try {
        const saved = localStorage.getItem('jobSelection');
        if (saved) {
            currentJobSelection = JSON.parse(saved);
            console.log('✓ 从本地存储加载职业配置:', currentJobSelection);
            return currentJobSelection;
        }
    } catch (error) {
        console.warn('无法从本地存储加载职业配置:', error);
    }
    return null;
}

/**
 * 获取指定行的职业信息
 * @param {number} rowIndex - 行索引（0-7）
 * @returns {Object|null} 职业信息对象
 */
function getJobForRow(rowIndex) {
    const jobId = currentJobSelection[`row${rowIndex}`];
    if (!jobId) return null;

    return JOBS.find(job => job.id === jobId);
}

/**
 * 获取所有行的职业信息
 * @returns {Array} 8行的职业信息数组
 */
function getAllJobsForRows() {
    const jobs = [];
    for (let i = 0; i < 8; i++) {
        jobs.push(getJobForRow(i));
    }
    return jobs;
}

/**
 * 获取指定行的选择
 * @param {number} rowIndex - 行索引（0-7）
 * @returns {string} 职业ID
 */
function getJobSelectionByRow(rowIndex) {
    return currentJobSelection[`row${rowIndex}`];
}

/**
 * 设置指定行的选择
 * @param {number} rowIndex - 行索引（0-7）
 * @param {string} jobId - 职业ID
 */
function setJobSelectionByRow(rowIndex, jobId) {
    currentJobSelection[`row${rowIndex}`] = jobId;
    console.log(`第${rowIndex + 1}行选择: ${jobId}`);
}

/**
 * ============================================================================
 * 导出到全局作用域
 * ============================================================================
 */

// 职业数据
window.JOBS = JOBS;
window.JOB_MATRIX = JOB_MATRIX;
window.DEFAULT_JOB_SELECTION = DEFAULT_JOB_SELECTION;

// 职业技能映射
window.JOB_SKILLS_MAP = JOB_SKILLS_MAP;
window.Paladin = Paladin;
window.DarkKnight = DarkKnight;
window.Gunbreaker = Gunbreaker;
window.Warrior = Warrior;
window.Scholar = Scholar;
window.Sage = Sage;
window.WhiteMage = WhiteMage;
window.Astrologian = Astrologian;
window.Bard = Bard;
window.Machinist = Machinist;
window.Dancer = Dancer;
window.Monk = Monk;
window.Ninja = Ninja;
window.Dragoon = Dragoon;
window.Reaper = Reaper;
window.Viper = Viper;
window.Samurai = Samurai;
window.BlackMage = BlackMage;
window.Summoner = Summoner;
window.RedMage = RedMage;
window.Pictomancer = Pictomancer;

// 职业选择管理函数
window.setJobSelection = setJobSelection;
window.getJobSelection = getJobSelection;
window.resetJobSelection = resetJobSelection;
window.loadJobSelectionFromStorage = loadJobSelectionFromStorage;
window.getJobForRow = getJobForRow;
window.getAllJobsForRows = getAllJobsForRows;
window.getJobSelectionByRow = getJobSelectionByRow;
window.setJobSelectionByRow = setJobSelectionByRow;

console.log('✓ 职业配置已加载');
console.log(`  - 职业行数: ${JOB_MATRIX.length}`);
console.log(`  - 总职业数: ${JOBS.length}`);
console.log(`  - 职业技能字典数: ${Object.keys(JOB_SKILLS_MAP).length}`);

})();

/**
 * ============================================================================
 * 职业常量配置 v2
 * 2T + 2H + 4DPS 队伍选择 + 职业减伤技能定义
 * ============================================================================
 */

const JOBS = [
    { id: 'pld', name: '骑士', nameEn: 'Paladin', role: 'tank' },
    { id: 'drk', name: '暗骑', nameEn: 'Dark Knight', role: 'tank' },
    { id: 'gnb', name: '绝枪', nameEn: 'Gunbreaker', role: 'tank' },
    { id: 'war', name: '战士', nameEn: 'Warrior', role: 'tank' },

    { id: 'sch', name: '学者', nameEn: 'Scholar', role: 'healer' },
    { id: 'sge', name: '贤者', nameEn: 'Sage', role: 'healer' },
    { id: 'whm', name: '白魔', nameEn: 'White Mage', role: 'healer' },
    { id: 'ast', name: '占星', nameEn: 'Astrologian', role: 'healer' },

    { id: 'mnk', name: '武僧', nameEn: 'Monk', role: 'melee' },
    { id: 'nin', name: '忍者', nameEn: 'Ninja', role: 'melee' },
    { id: 'drg', name: '龙骑', nameEn: 'Dragoon', role: 'melee' },
    { id: 'rpr', name: '镰刀', nameEn: 'Reaper', role: 'melee' },
    { id: 'vpr', name: '蝰蛇', nameEn: 'Viper', role: 'melee' },
    { id: 'sam', name: '武士', nameEn: 'Samurai', role: 'melee' },

    { id: 'dnc', name: '舞者', nameEn: 'Dancer', role: 'ranged' },
    { id: 'brd', name: '诗人', nameEn: 'Bard', role: 'ranged' },
    { id: 'mch', name: '机工', nameEn: 'Machinist', role: 'ranged' },

    { id: 'blm', name: '黑魔', nameEn: 'Black Mage', role: 'caster' },
    { id: 'smn', name: '召唤', nameEn: 'Summoner', role: 'caster' },
    { id: 'rdm', name: '赤魔', nameEn: 'Red Mage', role: 'caster' },
    { id: 'pct', name: '绘魔', nameEn: 'Pictomancer', role: 'caster' }
];

const ROLE_LABELS = {
    tank: '防护',
    healer: '治疗',
    melee: '近战',
    ranged: '远敏',
    caster: '法系',
    dps: '输出'
};

const DPS_ROLES = ['melee', 'ranged', 'caster'];

const PARTY_SLOTS = [
    { key: 'row0', label: 'T1', role: 'tank', allowedRoles: ['tank'] },
    { key: 'row1', label: 'T2', role: 'tank', allowedRoles: ['tank'] },
    { key: 'row2', label: 'H1', role: 'healer', allowedRoles: ['healer'] },
    { key: 'row3', label: 'H2', role: 'healer', allowedRoles: ['healer'] },
    { key: 'row4', label: 'D1', role: 'dps', allowedRoles: DPS_ROLES },
    { key: 'row5', label: 'D2', role: 'dps', allowedRoles: DPS_ROLES },
    { key: 'row6', label: 'D3', role: 'dps', allowedRoles: DPS_ROLES },
    { key: 'row7', label: 'D4', role: 'dps', allowedRoles: DPS_ROLES }
];

const JOB_MATRIX = PARTY_SLOTS.map(slot =>
    JOBS.filter(job => slot.allowedRoles.includes(job.role))
);

const DEFAULT_JOB_SELECTION = {
    row0: 'pld',
    row1: 'drk',
    row2: 'sch',
    row3: 'whm',
    row4: 'mnk',
    row5: 'nin',
    row6: 'brd',
    row7: 'blm'
};

let currentJobSelection = { ...DEFAULT_JOB_SELECTION };

function createSkill(type, coefficient, cooldown, effect, options = {}) {
    return {
        type,
        coefficient,
        cooldown,
        effect,
        scope: options.scope || 'party',
        damageKind: options.damageKind || 'all'
    };
}

function createMitigation(percent, cooldown, effect, options = {}) {
    const coefficient = Number((1 - percent / 100).toFixed(2));
    return createSkill(1, coefficient, cooldown, effect, options);
}

function createBarrier(amount, cooldown, effect, options = {}) {
    return createSkill(2, amount, cooldown, effect, options);
}

const Reprisal = () => createMitigation(10, 60, '使周围敌人造成伤害降低10%，持续15秒', {
    scope: 'enemy'
});

const Feint = () => createMitigation(5, 90, '目标物理伤害降低10%、魔法伤害降低5%，当前按5%通用减伤估算', {
    scope: 'enemy',
    damageKind: 'mixed'
});

const Addle = () => createMitigation(10, 90, '目标物理伤害降低5%、魔法伤害降低10%，当前按10%魔法减伤估算', {
    scope: 'enemy',
    damageKind: 'magic'
});

const Paladin = {
    '血仇': Reprisal(),
    '圣光幕帘': createBarrier(19000, 90, '为自身和附近队友附加相当于自身最大HP 10%的护盾，持续30秒'),
    '武装戍卫': createMitigation(15, 120, '身后扇形范围内队友受到伤害变为85%，持续18秒')
};

const DarkKnight = {
    '血仇': Reprisal(),
    '暗黑布道': createMitigation(10, 90, '自身和附近队友受到的物理伤害降低5%、魔法伤害降低10%，持续15秒', {
        damageKind: 'magic'
    })
};

const Gunbreaker = {
    '血仇': Reprisal(),
    '光之心': createMitigation(10, 90, '自身和附近队友受到的物理伤害降低5%、魔法伤害降低10%，持续15秒', {
        damageKind: 'magic'
    })
};

const Warrior = {
    '血仇': Reprisal(),
    '摆脱': createBarrier(28500, 90, '为自身和附近队友附加相当于最大HP 15%的护盾，持续30秒')
};

const Scholar = {
    '野战治疗阵': createMitigation(10, 30, '区域内队友受到伤害变为90%，持续15秒'),
    '疾风怒涛': createMitigation(10, 120, '附近队友获得移动速度提升，并受到伤害降低10%，持续20秒'),
    '幻光': createMitigation(5, 120, '附近队友治疗魔法效果提高10%，受到魔法伤害降低5%，持续20秒', {
        damageKind: 'magic'
    }),
    '群盾': createBarrier(27000, 0, '学者群体护盾估算值，用于减法减伤列'),
    '扩散盾': createBarrier(73000, 120, '展开战术扩散后的大盾估算值，用于减法减伤列')
};

const Sage = {
    '坚角清汁': createMitigation(10, 30, '自身和附近队友受到伤害降低10%，持续15秒'),
    '整体论': createMitigation(10, 120, '治疗全队并附加护盾，同时使附近队友受到伤害降低10%，持续20秒'),
    '泛输血': createBarrier(30000, 120, '为自身和附近队友附加可刷新护盾，持续15秒'),
    '均衡预后': createBarrier(27000, 0, '贤者群体护盾估算值，用于减法减伤列')
};

const WhiteMage = {
    '全大赦': createMitigation(10, 60, '为自身和附近队友附加Confession，并使受到伤害降低10%，持续10秒'),
    '节制': createMitigation(10, 120, '治疗魔法效果提高20%，自身和50米内队友受到伤害降低10%，持续20秒'),
    '神爱抚': createBarrier(24000, 120, '消耗Divine Grace，为自身和附近队友附加400治疗威力护盾')
};

const Astrologian = {
    '命运之轮': createMitigation(10, 60, '自身和附近队友受到伤害降低10%，并附加持续恢复'),
    '中间学派': createBarrier(27000, 120, '强化治疗并让部分治疗附加魔法护盾'),
    '太阳星座': createMitigation(10, 120, '在Suntouched状态下，使自身和附近队友受到伤害降低10%，持续15秒')
};

const Bard = {
    '行吟': createMitigation(15, 90, '自身和附近队友受到伤害降低15%，持续15秒')
};

const Machinist = {
    '策动': createMitigation(15, 90, '自身和附近队友受到伤害降低15%，持续15秒'),
    '拆除': createMitigation(10, 120, '降低目标造成的伤害10%，持续10秒', {
        scope: 'enemy'
    })
};

const Dancer = {
    '防守之桑巴': createMitigation(15, 90, '自身和附近队友受到伤害降低15%，持续15秒')
};

const Monk = { '牵制': Feint() };
const Ninja = { '牵制': Feint() };
const Dragoon = { '牵制': Feint() };
const Reaper = {
    '牵制': Feint(),
    '神秘纹': createBarrier(19000, 30, '自身10%最大HP护盾，破盾后为附近队友附加持续恢复')
};
const Viper = { '牵制': Feint() };
const Samurai = { '牵制': Feint() };

const BlackMage = { '病毒': Addle() };
const Summoner = { '病毒': Addle() };
const RedMage = {
    '病毒': Addle(),
    '抗死': createMitigation(10, 120, '自身和附近队友受到魔法伤害降低10%，并提高受到的治疗效果5%，持续10秒', {
        damageKind: 'magic'
    })
};
const Pictomancer = {
    '病毒': Addle(),
    '坦培拉厚涂': createBarrier(19000, 120, '移除Tempera Coat，为自身和附近队友附加10%最大HP护盾')
};

const JOB_SKILLS_MAP = {
    pld: Paladin,
    drk: DarkKnight,
    gnb: Gunbreaker,
    war: Warrior,
    sch: Scholar,
    sge: Sage,
    whm: WhiteMage,
    ast: Astrologian,
    brd: Bard,
    mch: Machinist,
    dnc: Dancer,
    mnk: Monk,
    nin: Ninja,
    drg: Dragoon,
    rpr: Reaper,
    vpr: Viper,
    sam: Samurai,
    blm: BlackMage,
    smn: Summoner,
    rdm: RedMage,
    pct: Pictomancer
};

function getJobsForSlot(slot) {
    return JOBS.filter(job => slot.allowedRoles.includes(job.role));
}

function getPartySlot(rowIndex) {
    return PARTY_SLOTS[rowIndex] || null;
}

function isJobAllowedInSlot(jobId, slot) {
    const job = JOBS.find(item => item.id === jobId);
    return Boolean(job && slot && slot.allowedRoles.includes(job.role));
}

function normalizeJobSelection(selection = {}) {
    const normalized = {};

    PARTY_SLOTS.forEach(slot => {
        const selectedJobId = selection[slot.key];
        normalized[slot.key] = isJobAllowedInSlot(selectedJobId, slot)
            ? selectedJobId
            : DEFAULT_JOB_SELECTION[slot.key];
    });

    return normalized;
}

function getSelectedJobIds(selection = currentJobSelection) {
    const normalized = normalizeJobSelection(selection);
    return PARTY_SLOTS.map(slot => normalized[slot.key]);
}

function setJobSelection(selection) {
    currentJobSelection = normalizeJobSelection(selection);
    console.log('职业配置已更新:', currentJobSelection);

    try {
        localStorage.setItem('jobSelection', JSON.stringify(currentJobSelection));
        console.log('✓ 职业配置已保存到本地存储');
    } catch (error) {
        console.warn('无法保存到本地存储:', error);
    }

    const selectedJobs = getSelectedJobIds(currentJobSelection);
    if (window.SKILL_CONSTANTS?.updateSkillsConfigByJobs) {
        window.SKILL_CONSTANTS.updateSkillsConfigByJobs(selectedJobs);
    } else if (window.skillsConfigManager) {
        window.skillsConfigManager.updateConfigByJob(selectedJobs);
    }
}

function getJobSelection() {
    return { ...currentJobSelection };
}

function resetJobSelection() {
    currentJobSelection = { ...DEFAULT_JOB_SELECTION };
    console.log('职业选择已重置为默认配置');

    try {
        localStorage.setItem('jobSelection', JSON.stringify(currentJobSelection));
    } catch (error) {
        console.warn('无法保存到本地存储:', error);
    }

    return currentJobSelection;
}

function loadJobSelectionFromStorage() {
    try {
        const saved = localStorage.getItem('jobSelection');
        if (saved) {
            currentJobSelection = normalizeJobSelection(JSON.parse(saved));
            console.log('✓ 从本地存储加载职业配置:', currentJobSelection);
            return currentJobSelection;
        }
    } catch (error) {
        console.warn('无法从本地存储加载职业配置:', error);
    }
    return null;
}

function getJobForRow(rowIndex) {
    const slot = getPartySlot(rowIndex);
    if (!slot) return null;

    const jobId = currentJobSelection[slot.key];
    return JOBS.find(job => job.id === jobId) || null;
}

function getAllJobsForRows() {
    return PARTY_SLOTS.map((slot, index) => getJobForRow(index));
}

function getJobSelectionByRow(rowIndex) {
    const slot = getPartySlot(rowIndex);
    return slot ? currentJobSelection[slot.key] : undefined;
}

function setJobSelectionByRow(rowIndex, jobId) {
    const slot = getPartySlot(rowIndex);
    if (!slot || !isJobAllowedInSlot(jobId, slot)) {
        console.warn(`无效的职业槽位选择: row=${rowIndex}, job=${jobId}`);
        return;
    }

    currentJobSelection[slot.key] = jobId;
    console.log(`${slot.label} 选择: ${jobId}`);
}

window.JOBS = JOBS;
window.ROLE_LABELS = ROLE_LABELS;
window.PARTY_SLOTS = PARTY_SLOTS;
window.JOB_MATRIX = JOB_MATRIX;
window.DEFAULT_JOB_SELECTION = DEFAULT_JOB_SELECTION;

window.JOB_SKILLS_MAP = JOB_SKILLS_MAP;
window.Paladin = Paladin;
window.DarkKnight = DarkKnight;
window.Gunbreaker = Gunbreaker;
window.Warrior = Warrior;
window.Scholar = Scholar;
window.Sage = Sage;
window.WhiteMage = WhiteMage;
window.Astrologian = Astrologian;
window.Bard = Bard;
window.Machinist = Machinist;
window.Dancer = Dancer;
window.Monk = Monk;
window.Ninja = Ninja;
window.Dragoon = Dragoon;
window.Reaper = Reaper;
window.Viper = Viper;
window.Samurai = Samurai;
window.BlackMage = BlackMage;
window.Summoner = Summoner;
window.RedMage = RedMage;
window.Pictomancer = Pictomancer;

window.getJobsForSlot = getJobsForSlot;
window.getPartySlot = getPartySlot;
window.isJobAllowedInSlot = isJobAllowedInSlot;
window.normalizeJobSelection = normalizeJobSelection;
window.getSelectedJobIds = getSelectedJobIds;
window.setJobSelection = setJobSelection;
window.getJobSelection = getJobSelection;
window.resetJobSelection = resetJobSelection;
window.loadJobSelectionFromStorage = loadJobSelectionFromStorage;
window.getJobForRow = getJobForRow;
window.getAllJobsForRows = getAllJobsForRows;
window.getJobSelectionByRow = getJobSelectionByRow;
window.setJobSelectionByRow = setJobSelectionByRow;

console.log('✓ 职业配置已加载（2T/2H/4DPS）');
console.log(`  - 队伍槽位: ${PARTY_SLOTS.map(slot => slot.label).join(', ')}`);
console.log(`  - 总职业数: ${JOBS.length}`);
console.log(`  - 职业技能字典数: ${Object.keys(JOB_SKILLS_MAP).length}`);
