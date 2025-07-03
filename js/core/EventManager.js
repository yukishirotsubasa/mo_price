// js/core/EventManager.js - 統一事件管理

/**
 * EventManager 類別 - 負責統一的事件管理和處理
 */
export class EventManager {
    constructor() {
        this.eventListeners = new Map(); // 儲存事件監聽器
        this.eventHandlers = new Map(); // 儲存事件處理器
        this.initialized = false;
    }

    /**
     * 初始化事件管理器
     */
    init() {
        if (this.initialized) {
            console.warn('EventManager 已經初始化過了');
            return;
        }

        this.setupGlobalEventHandlers();
        this.initialized = true;
        console.log('EventManager 初始化完成');
    }

    /**
     * 設置全域事件處理器
     */
    setupGlobalEventHandlers() {
        // 摺疊功能事件處理
        this.registerCollapsibleEvents();
        
        // 怪物價值過濾器事件處理
        this.registerMonsterWorthFilterEvents();
        
        // 衝突解決Modal事件處理
        this.registerConflictModalEvents();
    }

    /**
     * 註冊事件監聽器
     * @param {string} eventType - 事件類型
     * @param {string} selector - CSS選擇器
     * @param {Function} handler - 事件處理函數
     * @param {Object} options - 事件選項
     */
    registerEventListener(eventType, selector, handler, options = {}) {
        const key = `${eventType}-${selector}`;
        
        // 如果已經註冊過，先移除舊的
        if (this.eventListeners.has(key)) {
            this.removeEventListener(eventType, selector);
        }

        const elements = document.querySelectorAll(selector);
        const listeners = [];

        elements.forEach(element => {
            const wrappedHandler = (event) => {
                try {
                    handler(event, element);
                } catch (error) {
                    console.error(`事件處理器執行失敗 [${eventType}:${selector}]:`, error);
                }
            };

            element.addEventListener(eventType, wrappedHandler, options);
            listeners.push({ element, handler: wrappedHandler });
        });

        this.eventListeners.set(key, listeners);
        console.log(`註冊事件監聽器: ${key}, 元素數量: ${listeners.length}`);
    }

    /**
     * 移除事件監聽器
     * @param {string} eventType - 事件類型
     * @param {string} selector - CSS選擇器
     */
    removeEventListener(eventType, selector) {
        const key = `${eventType}-${selector}`;
        const listeners = this.eventListeners.get(key);

        if (listeners) {
            listeners.forEach(({ element, handler }) => {
                element.removeEventListener(eventType, handler);
            });
            this.eventListeners.delete(key);
            console.log(`移除事件監聽器: ${key}`);
        }
    }

    /**
     * 註冊摺疊功能事件
     */
    registerCollapsibleEvents() {
        this.registerEventListener('click', '.collapsible-header', (event, element) => {
            const content = element.nextElementSibling;
            if (content && content.classList.contains('collapsible-content')) {
                content.classList.toggle('collapsed');
                element.classList.toggle('collapsed');
            }
        });

        // 預設讓所有 collapsible-content 區塊為收合狀態
        document.querySelectorAll('.collapsible-content').forEach(content => {
            content.classList.add('collapsed');
            const header = content.previousElementSibling;
            if (header && header.classList.contains('collapsible-header')) {
                header.classList.add('collapsed');
            }
        });
    }

    /**
     * 註冊怪物價值過濾器事件
     */
    registerMonsterWorthFilterEvents() {
        const toggleIds = ['hideBossToggle', 'hideRareToggle', 'hideEliteToggle'];
        
        toggleIds.forEach(toggleId => {
            this.registerEventListener('change', `#${toggleId}`, async (event) => {
                // 觸發怪物價值頁面重新渲染事件
                const customEvent = new CustomEvent('monsterWorthFilterChanged', {
                    detail: { toggleId, checked: event.target.checked }
                });
                document.dispatchEvent(customEvent);
            });
        });
    }

    /**
     * 註冊衝突解決Modal事件
     */
    registerConflictModalEvents() {
        // 這些事件會在需要時動態綁定，因為Modal可能不會立即存在
        this.registerDynamicModalEvents();
    }

    /**
     * 動態註冊Modal事件（當Modal顯示時調用）
     */
    registerDynamicModalEvents() {
        const modal = document.getElementById('conflict-resolution-modal');
        if (!modal) return;

        const applyNewButton = document.getElementById('apply-new-button');
        const keepOldButton = document.getElementById('keep-old-button');

        if (applyNewButton && keepOldButton) {
            // 這些事件處理器會在showConflictResolutionModal中設置
            console.log('Modal事件處理器準備就緒');
        }
    }

    /**
     * 註冊自定義事件處理器
     * @param {string} eventName - 自定義事件名稱
     * @param {Function} handler - 事件處理函數
     */
    registerCustomEventHandler(eventName, handler) {
        if (!this.eventHandlers.has(eventName)) {
            this.eventHandlers.set(eventName, []);
        }

        this.eventHandlers.get(eventName).push(handler);
        
        // 在document上監聽自定義事件
        document.addEventListener(eventName, handler);
        console.log(`註冊自定義事件處理器: ${eventName}`);
    }

    /**
     * 移除自定義事件處理器
     * @param {string} eventName - 自定義事件名稱
     * @param {Function} handler - 事件處理函數（可選，如果不提供則移除所有）
     */
    removeCustomEventHandler(eventName, handler = null) {
        const handlers = this.eventHandlers.get(eventName);
        if (!handlers) return;

        if (handler) {
            // 移除特定處理器
            const index = handlers.indexOf(handler);
            if (index > -1) {
                handlers.splice(index, 1);
                document.removeEventListener(eventName, handler);
            }
        } else {
            // 移除所有處理器
            handlers.forEach(h => document.removeEventListener(eventName, h));
            this.eventHandlers.delete(eventName);
        }

        console.log(`移除自定義事件處理器: ${eventName}`);
    }

    /**
     * 觸發自定義事件
     * @param {string} eventName - 事件名稱
     * @param {Object} detail - 事件詳細資料
     */
    dispatchCustomEvent(eventName, detail = {}) {
        const event = new CustomEvent(eventName, { detail });
        document.dispatchEvent(event);
        console.log(`觸發自定義事件: ${eventName}`, detail);
    }

    /**
     * 批量註冊事件監聽器
     * @param {Array} eventConfigs - 事件配置陣列
     */
    registerMultipleEvents(eventConfigs) {
        eventConfigs.forEach(config => {
            const { eventType, selector, handler, options } = config;
            this.registerEventListener(eventType, selector, handler, options);
        });
    }

    /**
     * 清理所有事件監聽器
     */
    cleanup() {
        // 清理一般事件監聽器
        for (const [key, listeners] of this.eventListeners.entries()) {
            listeners.forEach(({ element, handler }) => {
                const [eventType] = key.split('-');
                element.removeEventListener(eventType, handler);
            });
        }
        this.eventListeners.clear();

        // 清理自定義事件處理器
        for (const [eventName, handlers] of this.eventHandlers.entries()) {
            handlers.forEach(handler => {
                document.removeEventListener(eventName, handler);
            });
        }
        this.eventHandlers.clear();

        this.initialized = false;
        console.log('EventManager 清理完成');
    }

    /**
     * 重新初始化事件管理器
     */
    reinitialize() {
        this.cleanup();
        this.init();
    }

    /**
     * 獲取事件統計資訊
     * @returns {Object} 事件統計
     */
    getEventStats() {
        return {
            eventListeners: this.eventListeners.size,
            customEventHandlers: this.eventHandlers.size,
            initialized: this.initialized
        };
    }
}