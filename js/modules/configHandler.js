/**
 * 配置处理器模块
 * 负责处理配置选择器UI交互和配置加载流程
 */

class ConfigHandler {
    constructor() {
        this.isLoading = false;
        this.currentConfig = null;
    }

    /**
     * 处理配置选择变化
     * @param {string} configKey - 配置键名（如 'm12s'）
     */
    async onConfigChange(configKey) {
        const selector = document.getElementById('configSelector');

        // 如果清空选择，不做处理
        if (!configKey) {
            this.updateConfigStatus('info', '选择配置以加载数据');
            return;
        }

        // 如果正在加载，防止重复请求
        if (this.isLoading) {
            console.log('配置正在加载中，请稍候...');
            // 恢复下拉框选择
            if (selector) selector.value = this.currentConfig || '';
            return;
        }

        try {
            this.isLoading = true;
            this.updateConfigStatus('loading', `正在加载 ${configKey}...`);

            console.log(`开始加载配置: ${configKey}`);

            // 加载配置
            const configData = await configLoader.loadConfig(configKey);

            // 验证配置
            if (!configLoader.validateConfig(configData)) {
                throw new Error('配置数据格式无效');
            }

            // 清空现有表格
            document.getElementById('tableBody').innerHTML = '';

            // 加载配置数据到数据管理器
            const loadedData = dataManager.loadConfigData(configData);

            // 渲染所有行
            loadedData.forEach(rowData => {
                uiRenderer.renderRow(rowData);
            });

            // 更新状态
            this.currentConfig = configKey;

            // 使用 requestAnimationFrame 确保 DOM 更新
            requestAnimationFrame(() => {
                this.updateConfigStatus('success', `成功加载 ${configKey}，共 ${loadedData.length} 条数据`);
            });

            console.log(`配置加载完成: ${configKey}`, {
                configKey,
                dataCount: loadedData.length,
                data: loadedData
            });

        } catch (error) {
            console.error('配置加载失败:', error);
            this.updateConfigStatus('error', `加载失败: ${error.message}`);

            // 恢复默认选择
            if (selector) {
                selector.value = this.currentConfig || '';
            }
        } finally {
            this.isLoading = false;
        }
    }

    /**
     * 更新配置状态显示
     * @param {string} status - 状态类型 ('loading' | 'success' | 'error' | 'info')
     * @param {string} message - 状态消息
     */
    updateConfigStatus(status, message) {
        const statusContainer = document.getElementById('configStatus');
        const statusText = document.getElementById('configStatusText');

        if (!statusContainer || !statusText) return;

        // 移除所有状态类
        statusContainer.className = 'config-info';

        // 添加对应的状态类和消息
        switch (status) {
            case 'loading':
                statusContainer.innerHTML = `
                    <div class="config-loading">
                        <span>⏳</span>
                        <span>${message}</span>
                    </div>
                `;
                break;
            case 'success':
                statusContainer.innerHTML = `
                    <div class="config-success">
                        <span>✓</span>
                        <span>${message}</span>
                    </div>
                `;
                // 3秒后恢复为info状态
                setTimeout(() => {
                    this.updateConfigStatus('info', `${this.currentConfig || '已加载配置'} - ${dataManager.getAllData().length} 条数据`);
                }, 3000);
                break;
            case 'error':
                statusContainer.innerHTML = `
                    <div class="config-error">
                        <span>✗</span>
                        <span>${message}</span>
                    </div>
                `;
                // 5秒后恢复为info状态
                setTimeout(() => {
                    this.updateConfigStatus('info', '选择配置以加载数据');
                }, 5000);
                break;
            case 'info':
            default:
                statusContainer.innerHTML = `
                    <span class="config-info-icon">i</span>
                    <span>${message}</span>
                `;
                break;
        }
    }

    /**
     * 获取当前配置
     * @returns {string|null} 当前配置文件名
     */
    getCurrentConfig() {
        return this.currentConfig;
    }

    /**
     * 重置配置选择
     */
    resetConfig() {
        const selector = document.getElementById('configSelector');
        if (selector) {
            selector.value = '';
        }
        this.currentConfig = null;
        this.updateConfigStatus('info', '选择配置以加载数据');
    }

    /**
     * 获取可用配置列表
     * @returns {Array} 配置列表
     */
    getAvailableConfigs() {
        return configLoader.getAvailableConfigs();
    }

    /**
     * 刷新配置选择器（用于动态添加新配置）
     */
    async refreshConfigSelector() {
        const selector = document.getElementById('configSelector');
        if (!selector) return;

        // 获取当前选中的值
        const currentValue = selector.value;

        // 清空选项
        selector.innerHTML = '<option value="">-- 请选择配置 --</option>';

        // 重新加载配置列表
        const configs = await configLoader.fetchAvailableConfigs();
        configs.forEach(config => {
            const option = document.createElement('option');
            option.value = config.file;
            option.textContent = config.displayName;
            selector.appendChild(option);
        });

        // 恢复之前选中的值
        if (currentValue) {
            selector.value = currentValue;
        }

        console.log('配置选择器已刷新', configs);
    }
}

// 导出单例
const configHandler = new ConfigHandler();
