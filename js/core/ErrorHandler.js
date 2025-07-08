// js/core/ErrorHandler.js - 統一錯誤處理系統

/**
 * ErrorHandler 類別 - 負責統一的錯誤處理和報告
 */
export class ErrorHandler {
    constructor() {
        this.errorLog = [];
        this.maxLogSize = 100; // 最多保存100條錯誤記錄
        this.isEnabled = true;
        this.init();
    }

    /**
     * 初始化錯誤處理系統
     */
    init() {
        // 監聽全域未捕獲的錯誤
        window.addEventListener('error', (event) => {
            this.handleGlobalError({
                type: 'JavaScript Error',
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                error: event.error,
                stack: event.error?.stack
            });
        });

        // 監聽 Promise 未捕獲的拒絕
        window.addEventListener('unhandledrejection', (event) => {
            this.handleGlobalError({
                type: 'Unhandled Promise Rejection',
                message: event.reason?.message || event.reason,
                promise: event.promise,
                stack: event.reason?.stack
            });
        });

        // 從 localStorage 載入之前的錯誤記錄
        this.loadErrorLog();
    }

    /**
     * 處理全域錯誤
     * @param {Object} errorInfo - 錯誤資訊
     */
    handleGlobalError(errorInfo) {
        if (!this.isEnabled) return;

        // 忽略來自 release.js 文件的所有錯誤
        if (this.isReleaseJsError(errorInfo)) {
            return;
        }

        const error = this.createErrorObject({
            ...errorInfo,
            severity: 'high',
            source: 'global'
        });

        this.logError(error);
        this.reportError(error);
    }

    /**
     * 記錄 API 錯誤
     * @param {string} url - API URL
     * @param {Error} error - 錯誤物件
     * @param {Object} context - 額外上下文資訊
     */
    logApiError(url, error, context = {}) {
        if (!this.isEnabled) return;

        const errorObj = this.createErrorObject({
            type: 'API Error',
            message: error.message,
            url: url,
            status: error.status || 'unknown',
            severity: 'medium',
            source: 'api',
            context: context,
            stack: error.stack
        });

        this.logError(errorObj);
        this.reportError(errorObj);
        return errorObj;
    }

    /**
     * 記錄數據處理錯誤
     * @param {string} operation - 操作名稱
     * @param {Error} error - 錯誤物件
     * @param {Object} data - 相關數據
     */
    logDataError(operation, error, data = null) {
        if (!this.isEnabled) return;

        const errorObj = this.createErrorObject({
            type: 'Data Processing Error',
            message: error.message,
            operation: operation,
            severity: 'medium',
            source: 'data',
            data: data ? this.sanitizeData(data) : null,
            stack: error.stack
        });

        this.logError(errorObj);
        this.reportError(errorObj);
        return errorObj;
    }

    /**
     * 記錄 UI 錯誤
     * @param {string} component - 組件名稱
     * @param {Error} error - 錯誤物件
     * @param {Object} context - 上下文資訊
     */
    logUIError(component, error, context = {}) {
        if (!this.isEnabled) return;

        const errorObj = this.createErrorObject({
            type: 'UI Error',
            message: error.message,
            component: component,
            severity: 'low',
            source: 'ui',
            context: context,
            stack: error.stack
        });

        this.logError(errorObj);
        this.reportError(errorObj);
        return errorObj;
    }

    /**
     * 記錄驗證錯誤
     * @param {string} field - 欄位名稱
     * @param {string} message - 錯誤訊息
     * @param {any} value - 驗證失敗的值
     */
    logValidationError(field, message, value = null) {
        if (!this.isEnabled) return;

        const errorObj = this.createErrorObject({
            type: 'Validation Error',
            message: message,
            field: field,
            value: this.sanitizeData(value),
            severity: 'low',
            source: 'validation'
        });

        this.logError(errorObj);
        return errorObj;
    }

    /**
     * 建立標準化的錯誤物件
     * @param {Object} errorInfo - 錯誤資訊
     * @returns {Object} 標準化的錯誤物件
     */
    createErrorObject(errorInfo) {
        return {
            id: this.generateErrorId(),
            timestamp: new Date().toISOString(),
            type: errorInfo.type || 'Unknown Error',
            message: errorInfo.message || 'No message provided',
            severity: errorInfo.severity || 'medium',
            source: errorInfo.source || 'unknown',
            url: window.location.href,
            userAgent: navigator.userAgent,
            ...errorInfo
        };
    }

    /**
     * 記錄錯誤到內部日誌
     * @param {Object} error - 錯誤物件
     */
    logError(error) {
        // 添加到內部日誌
        this.errorLog.unshift(error);

        // 限制日誌大小
        if (this.errorLog.length > this.maxLogSize) {
            this.errorLog = this.errorLog.slice(0, this.maxLogSize);
        }

        // 保存到 localStorage
        this.saveErrorLog();

        // 輸出到控制台
        console.error(`[ErrorHandler] ${error.type}:`, error);
    }

    /**
     * 報告錯誤（顯示給用戶或發送到服務器）
     * @param {Object} error - 錯誤物件
     */
    reportError(error) {
        // 根據嚴重程度決定是否顯示給用戶
        if (error.severity === 'high') {
            this.showUserNotification(error);
        }

        // 在開發模式下，所有錯誤都顯示詳細資訊
        if (this.isDevelopmentMode()) {
            console.group(`🚨 Error Report: ${error.type}`);
            console.error('Message:', error.message);
            console.error('Source:', error.source);
            console.error('Timestamp:', error.timestamp);
            if (error.stack) {
                console.error('Stack:', error.stack);
            }
            console.error('Full Error Object:', error);
            console.groupEnd();
        }
    }

    /**
     * 顯示用戶通知
     * @param {Object} error - 錯誤物件
     */
    showUserNotification(error) {
        // 建立簡單的錯誤通知
        const notification = document.createElement('div');
        notification.className = 'error-notification';
        notification.innerHTML = `
            <div class="error-notification-content">
                <strong>發生錯誤</strong>
                <p>${this.getUserFriendlyMessage(error)}</p>
                <button onclick="this.parentElement.parentElement.remove()">關閉</button>
            </div>
        `;

        // 添加樣式
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #ff4444;
            color: white;
            padding: 15px;
            border-radius: 5px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.3);
            z-index: 10000;
            max-width: 400px;
        `;

        document.body.appendChild(notification);

        // 5秒後自動移除
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }

    /**
     * 獲取用戶友好的錯誤訊息
     * @param {Object} error - 錯誤物件
     * @returns {string} 用戶友好的訊息
     */
    getUserFriendlyMessage(error) {
        switch (error.type) {
            case 'API Error':
                return '無法載入數據，請檢查網路連接或稍後再試。';
            case 'Data Processing Error':
                return '數據處理時發生錯誤，請重新整理頁面。';
            case 'UI Error':
                return '介面顯示異常，請重新整理頁面。';
            case 'Validation Error':
                return `輸入驗證失敗：${error.message}`;
            default:
                return '發生未知錯誤，請重新整理頁面或聯繫技術支援。';
        }
    }

    /**
     * 清理敏感數據
     * @param {any} data - 要清理的數據
     * @returns {any} 清理後的數據
     */
    sanitizeData(data) {
        if (data === null || data === undefined) {
            return data;
        }

        // 如果是字串且過長，則截斷
        if (typeof data === 'string' && data.length > 1000) {
            return data.substring(0, 1000) + '... (truncated)';
        }

        // 如果是物件，移除可能的敏感資訊
        if (typeof data === 'object') {
            try {
                const sanitized = JSON.parse(JSON.stringify(data));
                // 移除可能的敏感欄位
                const sensitiveFields = ['password', 'token', 'key', 'secret'];
                this.removeSensitiveFields(sanitized, sensitiveFields);
                return sanitized;
            } catch (e) {
                return '[Object - could not serialize]';
            }
        }

        return data;
    }

    /**
     * 移除敏感欄位
     * @param {Object} obj - 物件
     * @param {Array} sensitiveFields - 敏感欄位列表
     */
    removeSensitiveFields(obj, sensitiveFields) {
        if (typeof obj !== 'object' || obj === null) return;

        for (const key in obj) {
            if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
                obj[key] = '[REDACTED]';
            } else if (typeof obj[key] === 'object') {
                this.removeSensitiveFields(obj[key], sensitiveFields);
            }
        }
    }

    /**
     * 生成錯誤 ID
     * @returns {string} 唯一的錯誤 ID
     */
    generateErrorId() {
        return 'err_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * 檢查是否為來自 release.js 的錯誤
     * @param {Object} errorInfo - 錯誤資訊
     * @returns {boolean} 是否為 release.js 錯誤
     */
    isReleaseJsError(errorInfo) {
        // 檢查檔案名稱是否包含 release
        if (errorInfo.filename && errorInfo.filename.includes('release_')) {
            return true;
        }
        
        // 檢查錯誤訊息是否與 UIRules.restore_lock 相關
        /*if (errorInfo.message && errorInfo.message.includes('UIRules.restore_lock')) {
            return true;
        }*/
        
        return false;
    }

    /**
     * 檢查是否為開發模式
     * @returns {boolean} 是否為開發模式
     */
    isDevelopmentMode() {
        return window.location.hostname === 'localhost' || 
               window.location.hostname === '127.0.0.1' ||
               window.location.protocol === 'file:';
    }

    /**
     * 保存錯誤日誌到 localStorage
     */
    saveErrorLog() {
        try {
            const logToSave = this.errorLog.slice(0, 50); // 只保存最近50條
            localStorage.setItem('mo_price_error_log', JSON.stringify(logToSave));
        } catch (e) {
            console.warn('無法保存錯誤日誌到 localStorage:', e);
        }
    }

    /**
     * 從 localStorage 載入錯誤日誌
     */
    loadErrorLog() {
        try {
            const savedLog = localStorage.getItem('mo_price_error_log');
            if (savedLog) {
                this.errorLog = JSON.parse(savedLog);
            }
        } catch (e) {
            console.warn('無法從 localStorage 載入錯誤日誌:', e);
            this.errorLog = [];
        }
    }

    /**
     * 獲取錯誤統計
     * @returns {Object} 錯誤統計資訊
     */
    getErrorStats() {
        const stats = {
            total: this.errorLog.length,
            byType: {},
            bySeverity: {},
            recent: this.errorLog.slice(0, 10)
        };

        this.errorLog.forEach(error => {
            // 按類型統計
            stats.byType[error.type] = (stats.byType[error.type] || 0) + 1;
            
            // 按嚴重程度統計
            stats.bySeverity[error.severity] = (stats.bySeverity[error.severity] || 0) + 1;
        });

        return stats;
    }

    /**
     * 清除錯誤日誌
     */
    clearErrorLog() {
        this.errorLog = [];
        localStorage.removeItem('mo_price_error_log');
    }

    /**
     * 匯出錯誤日誌
     * @returns {string} JSON 格式的錯誤日誌
     */
    exportErrorLog() {
        return JSON.stringify({
            exportTime: new Date().toISOString(),
            stats: this.getErrorStats(),
            errors: this.errorLog
        }, null, 2);
    }

    /**
     * 啟用/停用錯誤處理
     * @param {boolean} enabled - 是否啟用
     */
    setEnabled(enabled) {
        this.isEnabled = enabled;
    }

    /**
     * 手動觸發錯誤報告（用於測試）
     * @param {string} message - 測試訊息
     */
    testError(message = 'Test error') {
        const testError = new Error(message);
        this.logDataError('test', testError, { test: true });
    }
}

// 建立全域錯誤處理器實例
const errorHandler = new ErrorHandler();

// 將錯誤處理器作為預設匯出
export default errorHandler;