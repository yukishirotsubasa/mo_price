// js/main.js - 應用程式主入口點
import themeManager from './themeManager.js';

import { loadData } from './dataLoader.js';
import i18n from './i18n.js';

// 導入新的控制器
import { TabController } from './controllers/TabController.js';
import { UIController } from './controllers/UIController.js';
import { LanguageController } from './controllers/LanguageController.js';

// 導入新的渲染器
import { TableRenderer } from './renderers/TableRenderer.js';
import { CostTableRenderer } from './renderers/CostTableRenderer.js';

// 導入事件管理器和錯誤處理器
import { EventManager } from './core/EventManager.js';
import errorHandler from './core/ErrorHandler.js';

// 導入翻譯管理器
import { TranslationManager } from './managers/TranslationManager.js';

// 導入市場價格管理器
import { MarketPriceManager } from './managers/MarketPriceManager.js';

// 導入版本比較管理器
import { VersionComparisonManager } from './managers/VersionComparisonManager.js';

// 導入頁面渲染管理器
import { PageRenderer } from './managers/PageRenderer.js';

let allData = {}; // 用於儲存所有載入的數據，以便在語言切換時重新渲染
let currentMarketPricesData = []; // 用於儲存當前市場價格數據的記憶體變數，提升至全域
window.ui = {};

// 市場價格管理器
let marketPriceManager;

// 版本比較管理器
let versionComparisonManager;

// 頁面渲染管理器
let pageRenderer;

// 初始化控制器
let tabController;
let uiController;
let languageController;

// 初始化渲染器
let tableRenderer;
let costTableRenderer;

// 初始化事件管理器
let eventManager;

/**
 * 顯示衝突解決 Modal。
 * @param {Array} conflictData - 包含衝突項目的陣列。
 * @returns {Promise<string>} - 回傳一個 Promise，解析為用戶的選擇 ('apply_new' 或 'keep_old')。
 */
function showConflictResolutionModal(conflictData) {
    return new Promise((resolve) => {
        const modal = document.getElementById('conflict-resolution-modal');
        const modalText = document.getElementById('conflict-modal-text');
        const applyNewButton = document.getElementById('apply-new-button');
        const keepOldButton = document.getElementById('keep-old-button');

        modalText.textContent = `偵測到 ${conflictData.length} 個資料衝突。請選擇如何處理：`;
        modal.style.display = 'flex';

        const listenerOptions = { once: true };

        const applyNewHandler = () => {
            modal.style.display = 'none';
            // 移除監聽器以避免記憶體洩漏
            keepOldButton.removeEventListener('click', keepOldHandler);
            resolve('apply_new');
        };

        const keepOldHandler = () => {
            modal.style.display = 'none';
            // 移除監聽器以避免記憶體洩漏
            applyNewButton.removeEventListener('click', applyNewHandler);
            resolve('keep_old');
        };

        applyNewButton.addEventListener('click', applyNewHandler, listenerOptions);
        keepOldButton.addEventListener('click', keepOldHandler, listenerOptions);
    });
}

window.ui.showConflictResolutionModal = showConflictResolutionModal;

/**
 * 渲染所有表格。
 * @param {boolean} forceReload - 是否強制重新載入數據。
 */
/*async function renderAllTablesIfDataLoaded() {
    try {
        if (Object.keys(allData).length === 0) {
            console.warn("allData 未載入，跳過 renderAllTablesIfDataLoaded。");
            return;
        }

        const { itemBase, FORGE_FORMULAS, CARPENTRY_FORMULAS, npcBase, pets, skillQuest, objectBase, forge, imageSheet } = allData;

        // 重新生成所有表格
        generateItemTable('item-table-container', itemBase, generateTableHTML, createItemNameMap);
        generateCarpentryTable('tab2-content', CARPENTRY_FORMULAS, generateTableHTML, createItemNameMap, itemBase);
        generateForgeTable('tab3-content', FORGE_FORMULAS, generateTableHTML, createItemNameMap, itemBase);
        generateNpcTable('tab4-content', npcBase, generateTableHTML, createItemNameMap, itemBase);
        generatePetsTable('tab5-content', pets, generateTableHTML, createItemNameMap, itemBase, pets);
        generateSkillQuestTable('tab6-content', skillQuest, generateTableHTML, createItemNameMap, itemBase);
        generateObjectBaseTable('tab7-content', objectBase, generateTableHTML, createItemNameMap, itemBase);
        generateEnchantingChancesTable('tab8-content', forge, generateTableHTML, createItemNameMap, itemBase);
        generateImageSheetTable('tab9-content', imageSheet, generateTableHTML, createItemNameMap, itemBase);
        generateMonsterWorthTable('monster-worth-table-container', npcBase, generateTableHTML, createItemNameMap, itemBase);

    } catch (error) {
        console.error("表格生成失敗:", error);
        errorHandler.logUIError('renderAllTables', error, { dataKeys: Object.keys(allData) });
    }
}*/

document.addEventListener('DOMContentLoaded', async () => {
    // 延遲載入數據，避免與release_2025_0417.js的window.onload衝突
    setTimeout(async () => {
        allData = await loadData();
        // 數據載入完成後更新全域變數
        window.allData = allData;
    }, 100);
    
    // 初始化控制器
    uiController = new UIController();
    tabController = new TabController();
    languageController = new LanguageController(uiController);

    // 初始化渲染器
    tableRenderer = new TableRenderer();
    costTableRenderer = new CostTableRenderer();
    
    // 將渲染器設為全域變數供MarketPriceManager使用
    window.costTableRenderer = costTableRenderer;
    
    // 初始化市場價格管理器
    marketPriceManager = new MarketPriceManager();
    
    // 初始化版本比較管理器
    versionComparisonManager = new VersionComparisonManager();
    
    // 初始化頁面渲染管理器
    pageRenderer = new PageRenderer(marketPriceManager, versionComparisonManager);
    
    // 將管理器設為全域變數
    window.marketPriceManager = marketPriceManager;
    window.versionComparisonManager = versionComparisonManager;
    window.pageRenderer = pageRenderer;
    window.uiController = uiController;
    window.tableRenderer = tableRenderer;
    window.errorHandler = errorHandler;

    // 初始化事件管理器
    eventManager = new EventManager();
    eventManager.init();

    // 監聽Tab切換事件
    document.addEventListener('tabChanged', async (event) => {
        await pageRenderer.renderPage(event.detail.tabName);
    });

    // 監聽語言變更事件
    eventManager.registerCustomEventHandler('languageChanged', async (event) => {
        // 獲取當前活躍的Tab並重新渲染
        const currentTab = tabController.getCurrentActiveTab();
        if (currentTab) {
            await pageRenderer.renderPage(currentTab);
        }
    });

    // 監聽怪物價值過濾器變更事件
    eventManager.registerCustomEventHandler('monsterWorthFilterChanged', async (event) => {
        // 只有當怪物價值頁面是活躍狀態時才重新渲染
        const currentTab = tabController.getCurrentActiveTab();
        if (currentTab === 'monster-worth-page') {
            await pageRenderer.renderPage('monster-worth-page');
        }
    });

    // 確保在 DOMContentLoaded 時，如果 open-item-page 是預設活躍的 Tab，則正確初始化
    const initialActiveTabButton = document.querySelector('.tab-button.active');
    if (initialActiveTabButton && initialActiveTabButton.dataset.tab === 'open-item-page') {
        // 由於 renderPage 會處理數據載入，這裡不需要額外處理 itemBase, i18n, utils
        await pageRenderer.renderPage('open-item-page');
    }

    // Tab切換邏輯已移動到TabController中
    // 摺疊功能邏輯已移動到EventManager中
    // 怪物價值過濾器邏輯已移動到EventManager中

});


