// js/controllers/TabController.js - 管理頁面切換邏輯

/**
 * TabController 類別 - 負責管理所有頁面切換相關的邏輯
 */
export class TabController {
    constructor() {
        this.currentActiveTab = null;
        this.initializeTabEvents();
    }

    /**
     * 初始化所有Tab相關的事件監聽器
     */
    initializeTabEvents() {
        // 處理巢狀選單邏輯
        document.querySelectorAll('.sidebar-menu .submenu-toggle').forEach(toggle => {
            toggle.addEventListener('click', (event) => {
                event.preventDefault();
                this.handleSubmenuToggle(toggle);
            });
        });

        // 處理子選單 Tab 切換邏輯
        document.querySelectorAll('.sidebar-menu .submenu .tab-button').forEach(button => {
            button.addEventListener('click', async (event) => {
                event.preventDefault();
                await this.switchTab(button);
            });
        });
    }

    /**
     * 處理子選單的展開/收合
     * @param {HTMLElement} toggle - 被點擊的選單切換元素
     */
    handleSubmenuToggle(toggle) {
        const parentLi = toggle.closest('.has-submenu');
        const submenu = parentLi.querySelector('.submenu');

        // 切換 active 類別
        toggle.classList.toggle('active');
        submenu.classList.toggle('active');
    }

    /**
     * 切換到指定的Tab
     * @param {HTMLElement} button - 被點擊的Tab按鈕
     */
    async switchTab(button) {
        // 移除所有 tab-button 和 tab-content 的 active 類別
        document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

        // 為當前點擊的按鈕和對應的內容添加 active 類別
        button.classList.add('active');
        const targetTabContent = document.getElementById(`${button.dataset.tab}-content`);
        if (targetTabContent) {
            targetTabContent.classList.add('active');
        }

        // 更新當前活躍Tab
        this.currentActiveTab = button.dataset.tab;

        // 觸發頁面渲染事件
        const event = new CustomEvent('tabChanged', {
            detail: { tabName: button.dataset.tab }
        });
        document.dispatchEvent(event);
    }

    /**
     * 獲取當前活躍的Tab
     * @returns {string|null} 當前活躍Tab的名稱
     */
    getCurrentActiveTab() {
        const activeTabButton = document.querySelector('.tab-button.active');
        return activeTabButton ? activeTabButton.dataset.tab : null;
    }

    /**
     * 程式化切換到指定Tab
     * @param {string} tabName - Tab名稱
     */
    async activateTab(tabName) {
        const tabButton = document.querySelector(`.tab-button[data-tab="${tabName}"]`);
        if (tabButton) {
            await this.switchTab(tabButton);
        } else {
            console.warn(`找不到Tab: ${tabName}`);
        }
    }
}