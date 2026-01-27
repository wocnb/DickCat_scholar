/**
 * 配置索引文件
 * 包含所有需要自动加载的配置文件列表
 *
 * 添加新配置时，只需在此列表中添加配置文件名即可
 */

// 配置文件列表
const CONFIG_FILES = [
    'm12s.js'
    // 在此处添加新配置文件，例如：
    // 'p12s.js',
    // 's12s.js',
    // 'custom.js'
];

// 自动加载所有配置的函数
async function autoLoadConfigs() {
    const results = {
        loaded: [],
        failed: [],
        total: CONFIG_FILES.length
    };

    console.log(`开始自动加载 ${results.total} 个配置文件...`);

    for (const configFile of CONFIG_FILES) {
        try {
            await loadSingleConfig(configFile);
            results.loaded.push(configFile);
            console.log(`✓ 配置加载成功: ${configFile}`);
        } catch (error) {
            results.failed.push({ file: configFile, error: error.message });
            console.error(`✗ 配置加载失败: ${configFile}`, error);
        }
    }

    console.log(`配置自动加载完成: 成功 ${results.loaded.length}/${results.total}`);

    return results;
}

// 加载单个配置文件
function loadSingleConfig(filename) {
    return new Promise((resolve, reject) => {
        // 检查是否已加载
        const configKey = filename.replace('.js', '');
        if (window.TABLE_CONFIGS && window.TABLE_CONFIGS[configKey]) {
            console.log(`配置已存在，跳过: ${filename}`);
            resolve();
            return;
        }

        // 动态创建 script 标签
        const script = document.createElement('script');
        script.src = `dungeons/${filename}`;
        script.async = false; // 保持顺序加载

        script.onload = () => resolve();
        script.onerror = () => reject(new Error(`无法加载: ${filename}`));

        document.head.appendChild(script);
    });
}

// 自动填充下拉菜单
function autoPopulateConfigSelector() {
    const selector = document.getElementById('configSelector');
    if (!selector) {
        console.warn('未找到配置选择器');
        return;
    }

    // 获取已加载的配置
    const configs = [];
    if (window.TABLE_CONFIGS) {
        for (const [key, config] of Object.entries(window.TABLE_CONFIGS)) {
            configs.push({
                key: key,
                displayName: config.meta.displayName || key,
                dataCount: config.data.length,
                version: config.meta.version || '未知'
            });
        }
    }

    if (configs.length === 0) {
        console.warn('没有找到已加载的配置');
        return;
    }

    // 按键名排序
    configs.sort((a, b) => a.key.localeCompare(b.key));

    // 清空现有选项（保留第一个"请选择"选项）
    const currentValue = selector.value;
    selector.innerHTML = '<option value="">-- 请选择配置 --</option>';

    // 添加配置选项
    configs.forEach(config => {
        const option = document.createElement('option');
        option.value = config.key;
        option.textContent = `${config.displayName} (${config.dataCount}条)`;
        selector.appendChild(option);
    });

    // 恢复之前选中的值
    if (currentValue) {
        selector.value = currentValue;
    }

    console.log(`下拉菜单已自动填充，共 ${configs.length} 个配置:`, configs.map(c => c.key));

    return configs;
}

// 导出到全局
window.AUTO_CONFIG_LOADER = {
    files: CONFIG_FILES,
    loadAll: autoLoadConfigs,
    populateSelector: autoPopulateConfigSelector
};

console.log(`配置索引已加载，共 ${CONFIG_FILES.length} 个配置文件待加载`);
