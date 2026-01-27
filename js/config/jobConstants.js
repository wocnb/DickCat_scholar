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
