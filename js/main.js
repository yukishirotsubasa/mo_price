// js/main.js - 應用程式主入口點
import themeManager from './themeManager.js';

import { generateCarpentryCostTableData } from './carpentryCost.js';
import { generateEnchantCostTableData } from './enchantCost.js';
import { loadData, getItemBase, getForgeFormulas, getCarpentryFormulas, getNpcBase, getPets, getSkillQuest, getObjectBase, getEnchantingChances, getImageSheet, loadGoogleSheetData, loadJsFileVariable, processRawData, processRawDataFromLocalStorage, saveMarketDataToLocalStorage, handleDataConflict } from './dataLoader.js';
import { createItemNameMap, generateTableHTML, compareData, formatNumberWithThousandsSeparator, getItemSellPrice } from './utils.js';
import { generateItemTable } from './tableGenerators/itemTable.js';
import { generateCarpentryTable } from './tableGenerators/carpentryTable.js';
import { generateForgeTable } from './tableGenerators/forgeTable.js';
import { generateNpcTable } from './tableGenerators/npcTable.js';
import { generatePetsTable } from './tableGenerators/petsTable.js';
import { generateSkillQuestTable } from './tableGenerators/skillQuestTable.js';
import { generateObjectBaseTable } from './tableGenerators/objectBaseTable.js';
import { generateEnchantingChancesTable } from './tableGenerators/enchantingChancesTable.js';
import { generateImageSheetTable } from './tableGenerators/imageSheetTable.js';
import { generateMonsterWorthTable } from './tableGenerators/monsterWorth.js';
import { generateMonsterBookTable } from './tableGenerators/monsterBookTable.js';
import openItemTable from './tableGenerators/openItemTable.js';
import { generateKeyWorthTable } from './tableGenerators/keyWorth.js';
import { generateRareKeyWorthTable } from './tableGenerators/rareKeyWorth.js';
import { generatePresentTable } from './tableGenerators/presentTable.js';
import { generateBreedingCostTable } from './tableGenerators/breedingCost.js';
import { generateForgingCostTableData } from './forgingCost.js';
import { generateRecycleCostTableData } from './recycleCost.js';
import i18n from './i18n.js';
import { initPriceEditor } from './priceEditor.js';

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

let allData = {}; // 用於儲存所有載入的數據，以便在語言切換時重新渲染
let currentMarketPricesData = []; // 用於儲存當前市場價格數據的記憶體變數，提升至全域
window.ui = {};

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
async function renderAllTablesIfDataLoaded() {
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
}

/**
 * 根據頁面名稱渲染對應的表格。
 * @param {string} pageName - 要渲染的頁面名稱 (對應 data-tab 屬性)。
 */
async function renderPage(pageName) {
    try {
        // 清空表格內容
        if (uiController) {
            uiController.clearTableContents();
        }

        // 如果 allData 為空，則異步載入數據
        if (Object.keys(allData).length === 0) {
            console.log("allData 未載入，正在載入數據...");
            allData = await loadData();
            // 數據載入後，更新所有 UI 文本
            if (uiController) {
                uiController.updateTabTitles();
                uiController.updateGoogleSheetUIText();
                uiController.updateVersionComparisonUIText();
            }
        }

        const { itemBase, FORGE_FORMULAS, CARPENTRY_FORMULAS, npcBase, pets, skillQuest, objectBase, forge, imageSheet, enchantingChances, items, monsterBook } = allData;

        let containerId;
        let generateFunction;
        let args = [];


        switch (pageName) {
            case 'tab1': // 物品資料
                containerId = 'item-table-container';
                generateFunction = generateItemTable;
                args = [containerId, itemBase, generateTableHTML, createItemNameMap];
                break;
            case 'tab2': // 木工資料
                containerId = 'carpentry-table-container';
                generateFunction = generateCarpentryTable;
                args = [containerId, CARPENTRY_FORMULAS, generateTableHTML, createItemNameMap, itemBase];
                break;
            case 'tab3': // 鍛造資料
                containerId = 'forge-table-container';
                generateFunction = generateForgeTable;
                args = [containerId, FORGE_FORMULAS, generateTableHTML, createItemNameMap, itemBase];
                break;
            case 'tab4': // NPC 資料
                containerId = 'npc-table-container';
                generateFunction = generateNpcTable;
                args = [containerId, npcBase, generateTableHTML, createItemNameMap, itemBase];
                break;
            case 'tab5': // 寵物資料
                containerId = 'pets-table-container';
                generateFunction = generatePetsTable;
                args = [containerId, pets, generateTableHTML, createItemNameMap, itemBase, pets];
                break;
            case 'tab6': // 技能任務
                containerId = 'skill-quest-table-container';
                generateFunction = generateSkillQuestTable;
                args = [containerId, skillQuest, generateTableHTML, createItemNameMap, itemBase];
                break;
            case 'tab7': // 物件資料
                containerId = 'object-base-table-container';
                generateFunction = generateObjectBaseTable;
                args = [containerId, objectBase, generateTableHTML, createItemNameMap, itemBase];
                break;
            case 'tab8': // 附魔機率
                containerId = 'enchanting-chances-table-container';
                generateFunction = generateEnchantingChancesTable;
                args = [containerId, forge, generateTableHTML, createItemNameMap, itemBase];
                break;
            case 'tab9': // 圖片資料
                containerId = 'image-sheet-table-container';
                generateFunction = generateImageSheetTable;
                args = [containerId, imageSheet, generateTableHTML, createItemNameMap, itemBase];
                break;
            case 'monster-book': // MonsterBook 資料
                containerId = 'monster-book-table-container';
                generateFunction = generateMonsterBookTable;
                args = [containerId, monsterBook, npcBase, itemBase, generateTableHTML, createItemNameMap];
                break;
            case 'monster-worth-page': // 怪物價值
                containerId = 'monster-worth-table-container';
                generateFunction = generateMonsterWorthTable;
                args = [containerId, npcBase, generateTableHTML, createItemNameMap, itemBase];
                break;
            case 'forging-cost-page': // 鍛造成本
                containerId = 'forging-table-container';
                if (itemBase && FORGE_FORMULAS) {
                    const forgingCostData = generateForgingCostTableData(FORGE_FORMULAS, generateTableHTML, createItemNameMap, itemBase);
                    if (costTableRenderer) {
                        costTableRenderer.renderForgingCostTable(containerId, forgingCostData);
                    }
                } else {
                    if (tableRenderer) {
                        tableRenderer.showError(containerId, i18n.translate('forging_data_not_available'));
                    }
                    console.error("For Forging Cost Tab, itemBase or FORGE_FORMULAS data is not available.");
                }
                return;
            case 'carpentry-cost-page': // 木工成本
                containerId = 'carpentry-cost-table-container';
                if (itemBase && CARPENTRY_FORMULAS) {
                    const carpentryCostData = generateCarpentryCostTableData(CARPENTRY_FORMULAS, generateTableHTML, createItemNameMap, itemBase);
                    if (costTableRenderer) {
                        costTableRenderer.renderCarpentryCostTable(containerId, carpentryCostData);
                    }
                } else {
                    if (tableRenderer) {
                        tableRenderer.showError(containerId, i18n.translate('carpentry_data_not_available'));
                    }
                    console.error("For Carpentry Cost Tab, itemBase or CARPENTRY_FORMULAS data is not available.");
                }
                return;
            case 'enchanting-cost-page': // 附魔成本
                containerId = 'enchanting-cost-table-container';
                generateFunction = generateEnchantCostTableData;
                args = [containerId, forge, generateTableHTML, createItemNameMap, itemBase];
                break;
            case 'tab10': // 市場價格整合
                initMarketPriceIntegrationUI();
                initPriceEditor(); // 初始化價格編輯器
                return;
            case 'tab11': // 版本比較
                initVersionComparisonUI();
                return;
case 'explanation-page': // 說明頁面
    containerId = 'explanation-page-content';
    generateFunction = loadExplanationPage; // 使用新的函數來載入說明頁面
    args = [containerId];
    break;
case 'open-item-page': // Open Item 頁面
    containerId = 'open-item-page-content';
    generateFunction = openItemTable.initOpenItemPage;
    const utils = { getItemSellPrice };
    args = [itemBase, i18n, utils]; // 傳遞 itemBase, i18n, utils
    break;
case 'key-page': // Key 頁面
    containerId = 'key-page-content';
    generateFunction = generateKeyWorthTable;
    args = [objectBase, itemBase];
    break;
case 'rare-key-page': // Rare Key 頁面
    containerId = 'rare-key-page-content';
    generateFunction = generateRareKeyWorthTable;
    args = [objectBase, itemBase];
    break;
case 'present-page': // Present 頁面
    containerId = 'present-page-content';
    generateFunction = generatePresentTable;
    args = [items, itemBase];
    break;
case 'breeding-page': // Breeding 頁面
    containerId = 'breeding-cost-table-container';
    generateFunction = generateBreedingCostTable;
    args = [containerId, pets, itemBase];
    break;
case 'recycle-page': // Recycle 頁面
    containerId = 'recycle-cost-table-container';
    if (itemBase && FORGE_FORMULAS) {
        const recycleCostData = generateRecycleCostTableData(FORGE_FORMULAS, generateTableHTML, createItemNameMap, itemBase);
        if (costTableRenderer) {
            costTableRenderer.renderRecycleCostTable(containerId, recycleCostData);
        }
    } else {
        if (tableRenderer) {
            tableRenderer.showError(containerId, i18n.translate('recycle_data_not_available'));
        }
        console.error("For Recycle Cost Tab, itemBase or FORGE_FORMULAS data is not available.");
    }
    return;
default:
    console.warn(`未知頁面名稱: ${pageName}`);
    return;
}

        const container = document.getElementById(containerId);
        if (container) {
            generateFunction(...args);
        } else {
            console.error(`找不到 ID 為 ${containerId} 的容器元素。`);
        }

    } catch (error) {
        console.error("渲染頁面失敗:", error);
        errorHandler.logUIError('renderPage', error, { pageName, dataLoaded: Object.keys(allData).length > 0 });
    }
}

// 這些渲染函數已移動到 CostTableRenderer 中

// 這些函數已移動到 UIController 中

/**
 * 初始化版本比較功能的所有邏輯，包括按鈕事件和數據載入。
 * 這個函數應該在版本比較頁面 HTML 載入完成後被調用。
 */
async function initVersionComparisonUI() {
    const versionASelect = document.getElementById('versionA-select');
    const versionBSelect = document.getElementById('versionB-select');
    const compareVersionsButton = document.getElementById('compare-versions-button');
    const comparisonResultsDiv = document.getElementById('version-comparison-results');

    if (versionASelect && versionBSelect && compareVersionsButton && comparisonResultsDiv) {
        // 移除舊的事件監聽器以避免重複綁定
        compareVersionsButton.removeEventListener('click', handleCompareVersions);
        // 綁定新的事件監聽器
        compareVersionsButton.addEventListener('click', handleCompareVersions);
    } else {
        console.error(i18n.translate('version_comparison_ui_not_found'));
    }

    async function handleCompareVersions() {
        const versionAPath = versionASelect.value;
        const versionBPath = versionBSelect.value;

        comparisonResultsDiv.innerHTML = i18n.translate('loading_and_comparing_data');

        try {
            // 載入兩個版本的 item_base 數據
            const itemBaseA = await loadJsFileVariable(versionAPath, 'item_base');
            const itemBaseB = await loadJsFileVariable(versionBPath, 'item_base');

            console.log(i18n.translate('version_a_loaded', versionAPath));
            console.log(i18n.translate('version_b_loaded', versionBPath));
            console.log(i18n.translate('version_a_item_count', itemBaseA ? itemBaseA.length : 0));
            console.log(i18n.translate('version_b_item_count', itemBaseB ? itemBaseB.length : 0));

            // 執行比較
            const comparisonResult = compareData(itemBaseA, itemBaseB, 'b_i'); // 假設 'b_i' 是唯一 ID
            console.log(i18n.translate('comparison_results'), comparisonResult);

            // 顯示結果
            renderComparisonResults(comparisonResult, comparisonResultsDiv);

        } catch (error) {
            comparisonResultsDiv.innerHTML = `<p style="color: red;">${i18n.translate('failed_to_load_or_compare_data', error.message)}</p>`;
            console.error(i18n.translate('version_comparison_failed'), error);
            errorHandler.logDataError('versionComparison', error, { versionAPath, versionBPath });
        }
    }
}

/**
 * 初始化市場價格整合（Google Sheet/CSV）UI 事件與流程。
 * 可重複呼叫於 renderPage('tab10') 載入 HTML 後。
 */
function initMarketPriceIntegrationUI() {
    // 需等 google.charts 載入
    if (window.google && google.charts) {
        google.charts.load('current', { packages: ['corechart', 'table'] });
        google.charts.setOnLoadCallback(initializeMarketPriceIntegrationLogic);
    } else {
        console.error('Google Charts library not loaded.');
    }
}

/**
 * 渲染市場價格數據到表格。
 * @param {Array<Array<any>>} data - 處理後的市場價格數據，每行包含 [item id, item name, market buy price, market sell price]。
 */
export const renderMarketDataTable = (data) => {
    if (!costTableRenderer) {
        console.error("CostTableRenderer 未初始化。");
        return;
    }

    const itemBase = allData.itemBase;
    const itemNameMap = createItemNameMap(itemBase, i18n.translate);
    
    costTableRenderer.renderMarketDataTable(
        'sheet-data-display', 
        data, 
        itemNameMap, 
        itemBase, 
        handleCellEditWrapper
    );
};

/**
 * 處理儲存格編輯的包裝函數，用於事件監聽器。
 * @param {Event} event - 觸發事件的事件物件。
 */
const handleCellEditWrapper = (event) => {
    handleCellEdit(event.target, currentMarketPricesData);
};

/**
 * 處理儲存格編輯的鍵盤事件包裝函數。
 * @param {Event} event - 觸發事件的事件物件。
 */
const handleCellEditKeydownWrapper = (event) => {
    if (event.key === 'Enter') {
        event.preventDefault(); // 防止換行
        event.target.blur(); // 觸發 blur 事件來儲存數據
    }
};

/**
 * 處理儲存格編輯。
 * @param {HTMLElement} cellElement - 被編輯的儲存格元素。
 * @param {Array<Array<any>>} dataToUpdate - 要更新的數據陣列。
 */
const handleCellEdit = (cellElement, dataToUpdate) => {
    const rowIndex = parseInt(cellElement.closest('tr').dataset.rowIndex);
    const colIndex = parseInt(cellElement.dataset.colIndex);
    let newValue = cellElement.textContent.trim();

    const parsedValue = parseFloat(newValue);
    if (isNaN(parsedValue)) {
        alert(i18n.translate('please_enter_valid_number'));
        cellElement.textContent = dataToUpdate[rowIndex][colIndex];
        return;
    }
    newValue = parsedValue;

    dataToUpdate[rowIndex][colIndex] = newValue;

    const dataToStore = dataToUpdate.map(row => [row[0], row[1], row[2], row[3]]);
    try {
        localStorage.setItem('price_data', JSON.stringify(dataToStore));
        console.log(i18n.translate('market_data_updated_and_saved'));
    } catch (e) {
        console.error(i18n.translate('failed_to_save_updated_data'), e);
    }
};

/**
 * 初始化市場價格整合功能的所有邏輯，包括按鈕事件和數據載入。
 * 這個函數應該在 Google Charts 載入完成後被調用。
 */
async function initializeMarketPriceIntegrationLogic() {
    const googleSheetUrlInput = document.getElementById('google-sheet-url');
    const loadSheetButton = document.getElementById('load-sheet-button');
    const sheetStatusDiv = document.getElementById('sheet-status');
    const sheetDataDisplayDiv = document.getElementById('sheet-data-display');
    const exportCsvButton = document.getElementById('export-csv-button');
    const importCsvButton = document.getElementById('import-csv-button');
    const csvFileInput = document.getElementById('csv-file-input');

    if (!googleSheetUrlInput || !loadSheetButton || !sheetStatusDiv || !sheetDataDisplayDiv || !exportCsvButton || !importCsvButton || !csvFileInput) {
        console.error("市場價格整合相關 UI 元素未找到。");
        return;
    }

    // 移除舊的事件監聽器以避免重複綁定
    loadSheetButton.removeEventListener('click', loadAndDisplaySheetDataWrapper);
    exportCsvButton.removeEventListener('click', exportCsvData);
    importCsvButton.removeEventListener('click', triggerCsvFileInput);
    csvFileInput.removeEventListener('change', handleCsvFileChange);

    // 綁定新的事件監聽器
    loadSheetButton.addEventListener('click', loadAndDisplaySheetDataWrapper);
    exportCsvButton.addEventListener('click', exportCsvData);
    importCsvButton.addEventListener('click', triggerCsvFileInput);
    csvFileInput.addEventListener('change', handleCsvFileChange);

    // 在 Google Charts Library 載入完成後，嘗試從 localStorage 載入數據
    loadMarketDataFromLocalStorage();

    // 載入上次成功讀取的 Google Sheet URL
    const lastUrl = localStorage.getItem('lastSuccessfulGoogleSheetUrl');
    if (lastUrl) {
        googleSheetUrlInput.value = lastUrl;
    }
}

/**
 * loadAndDisplaySheetData 的包裝函數，用於事件監聽器。
 */
const loadAndDisplaySheetDataWrapper = () => loadAndDisplaySheetData();

/**
 * 匯出 CSV 數據。
 */
const exportCsvData = () => {
    const sheetStatusDiv = document.getElementById('sheet-status');
    let dataToExport = currentMarketPricesData;
    if (dataToExport.length === 0) { // 只有標頭或沒有數據
        sheetStatusDiv.textContent = i18n.translate('no_data_to_export');
        return;
    }

    const exportableData = [
        ['item_id', 'market_buy', 'market_sell', 'custom_price'] // 匯出標頭
    ];
    dataToExport.forEach(row => {
        exportableData.push([
            row[0], // item_id
            row[1], // market_buy
            row[2], // market_sell
            row[3]  // custom_price
        ]);
    });

    const csvString = exportableData.map(row => row.map(cell => {
        const stringValue = String(cell);
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
            return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
    }).join(',')).join('\n');

    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'market_prices.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    sheetStatusDiv.textContent = i18n.translate('data_exported_successfully');
};

/**
 * 觸發 CSV 檔案輸入。
 */
const triggerCsvFileInput = () => {
    document.getElementById('csv-file-input').click();
};

/**
 * 處理 CSV 檔案變更事件。
 * @param {Event} event - 檔案輸入事件。
 */
const handleCsvFileChange = async (event) => {
    const file = event.target.files[0];
    const sheetStatusDiv = document.getElementById('sheet-status');
    if (!file) {
        sheetStatusDiv.textContent = i18n.translate('please_select_csv_file');
        return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const csvContent = e.target.result;
            const rawImportedData = csvContent.split(/\r?\n/).map(row => row.split(',').map(cell => cell.trim()));
            const newData = processRawData(rawImportedData);

            // 從 localStorage 讀取舊數據
            const oldDataRaw = localStorage.getItem('price_data');
            const oldData = oldDataRaw ? processRawDataFromLocalStorage(JSON.parse(oldDataRaw)) : [];

            // 處理數據衝突
            const finalData = await handleDataConflict(newData, oldData);

            if (finalData.length > 0) {
                currentMarketPricesData = finalData;
                saveMarketDataToLocalStorage(currentMarketPricesData);
                renderMarketDataTable(currentMarketPricesData);
                sheetStatusDiv.textContent = i18n.translate('csv_data_imported_successfully');
                console.log(i18n.translate('csv_data_imported_and_updated'), currentMarketPricesData);
            } else {
                sheetStatusDiv.textContent = i18n.translate('no_valid_data_in_csv');
            }
        } catch (error) {
            sheetStatusDiv.textContent = i18n.translate('import_failed', error.message);
            console.error(i18n.translate('failed_to_parse_or_import_csv'), error);
        } finally {
            event.target.value = '';
        }
    };
    reader.onerror = () => {
        sheetStatusDiv.textContent = i18n.translate('failed_to_read_file');
    };
    reader.readAsText(file);
};

/**
 * 從 localStorage 載入市場價格數據並顯示。
 */
async function loadMarketDataFromLocalStorage() {
    const sheetStatusDiv = document.getElementById('sheet-status');
    const sheetDataDisplayDiv = document.getElementById('sheet-data-display');
    const CACHE_KEY = 'price_data';

    if (!sheetStatusDiv || !sheetDataDisplayDiv) {
        console.error("市場價格整合相關 UI 元素未找到。");
        return;
    }

    sheetStatusDiv.textContent = i18n.translate('loading_cached_data');
    sheetDataDisplayDiv.innerHTML = '';

    try {
        const cachedData = localStorage.getItem(CACHE_KEY);
        if (cachedData) {
            const rawCachedData = JSON.parse(cachedData);
            const processedCachedData = processRawDataFromLocalStorage(rawCachedData);

            if (processedCachedData.length > 0) {
                currentMarketPricesData = processedCachedData;
                renderMarketDataTable(currentMarketPricesData);
                sheetStatusDiv.textContent = i18n.translate('cached_data_loaded_successfully');
            } else {
                sheetStatusDiv.textContent = i18n.translate('no_valid_data_in_cache');
            }
        } else {
            sheetStatusDiv.textContent = i18n.translate('no_cached_data_found');
        }
    } catch (error) {
        sheetStatusDiv.textContent = i18n.translate('failed_to_load_cached_data', error.message);
        console.error("從 localStorage 載入市場價格數據失敗:", error);
    }
}

/**
 * 載入並顯示 Google Sheet 數據。
 * @param {boolean} forceReload - 是否強制重新載入數據。
 */
async function loadAndDisplaySheetData() {
    const googleSheetUrlInput = document.getElementById('google-sheet-url');
    const sheetStatusDiv = document.getElementById('sheet-status');
    const sheetDataDisplayDiv = document.getElementById('sheet-data-display');

    if (!googleSheetUrlInput || !sheetStatusDiv || !sheetDataDisplayDiv) {
        console.error("Google Sheet 相關 UI 元素未找到。");
        return;
    }

    const urlOrId = googleSheetUrlInput.value.trim();
    if (!urlOrId) {
        sheetStatusDiv.textContent = i18n.translate('enter_google_sheet_url_or_id_message');
        return;
    }

    sheetStatusDiv.textContent = i18n.translate('loading_data');
    sheetDataDisplayDiv.innerHTML = '';

    try {
        // loadGoogleSheetData 現在會處理衝突並返回最終數據
        const finalData = await loadGoogleSheetData(urlOrId, '');

        sheetStatusDiv.textContent = i18n.translate('data_loaded_successfully');
        currentMarketPricesData = finalData;
        
        renderMarketDataTable(currentMarketPricesData);

        // 成功載入後，將當前 URL 儲存到 localStorage
        localStorage.setItem('lastSuccessfulGoogleSheetUrl', urlOrId);

    } catch (error) {
        sheetStatusDiv.textContent = i18n.translate('load_failed', error.message);
        sheetDataDisplayDiv.innerHTML = '';
        console.error("載入或處理 Google Sheet 數據失敗:", error);
    }
}


document.addEventListener('DOMContentLoaded', async () => {
    // 初始化控制器
    uiController = new UIController();
    tabController = new TabController();
    languageController = new LanguageController(uiController);

    // 初始化渲染器
    tableRenderer = new TableRenderer();
    costTableRenderer = new CostTableRenderer();

    // 初始化事件管理器
    eventManager = new EventManager();
    eventManager.init();

    // 監聽Tab切換事件
    document.addEventListener('tabChanged', async (event) => {
        await renderPage(event.detail.tabName);
    });

    // 監聽語言變更事件
    eventManager.registerCustomEventHandler('languageChanged', async (event) => {
        // 獲取當前活躍的Tab並重新渲染
        const currentTab = tabController.getCurrentActiveTab();
        if (currentTab) {
            await renderPage(currentTab);
        }
    });

    // 監聽怪物價值過濾器變更事件
    eventManager.registerCustomEventHandler('monsterWorthFilterChanged', async (event) => {
        // 只有當怪物價值頁面是活躍狀態時才重新渲染
        const currentTab = tabController.getCurrentActiveTab();
        if (currentTab === 'monster-worth-page') {
            await renderPage('monster-worth-page');
        }
    });

    // 確保在 DOMContentLoaded 時，如果 open-item-page 是預設活躍的 Tab，則正確初始化
    const initialActiveTabButton = document.querySelector('.tab-button.active');
    if (initialActiveTabButton && initialActiveTabButton.dataset.tab === 'open-item-page') {
        // 由於 renderPage 會處理數據載入，這裡不需要額外處理 itemBase, i18n, utils
        await renderPage('open-item-page');
    }

    // Tab切換邏輯已移動到TabController中
    // 摺疊功能邏輯已移動到EventManager中
    // 怪物價值過濾器邏輯已移動到EventManager中

});

/**
 * 渲染版本比較結果到指定的 DOM 元素。
 * @param {Object} results - 比較結果物件 (added, removed, modified)。
 * @param {HTMLElement} containerElement - 顯示結果的 DOM 容器。
 */
function renderComparisonResults(results, containerElement) {
    console.log(i18n.translate('rendering_comparison_results'), results);
    console.log(i18n.translate('added_count', results.added.length));
    console.log(i18n.translate('removed_count', results.removed.length));
    console.log(i18n.translate('modified_count', results.modified.length));

    let html = '';

    // 新增的條目
    if (results.added.length > 0) {
        html += `<div class="comparison-section added">
                    <h3>${i18n.translate('added_items', results.added.length)}</h3>
                    <ul class="comparison-list">`;
        results.added.forEach(item => {
            html += `<li>${i18n.translate('id')}: ${item.b_i}, ${i18n.translate('name')}: ${item.name || 'N/A'}</li>`;
        });
        html += `</ul></div>`;
    }

    // 刪除的條目
    if (results.removed.length > 0) {
        html += `<div class="comparison-section removed">
                    <h3>${i18n.translate('removed_items', results.removed.length)}</h3>
                    <ul class="comparison-list">`;
        results.removed.forEach(item => {
            html += `<li>${i18n.translate('id')}: ${item.b_i}, ${i18n.translate('name')}: ${item.name || 'N/A'}</li>`;
        });
        html += `</ul></div>`;
    }
    
    // 在 i18n 模組中添加新的翻譯鍵值（如果不存在）
    // 由於 i18n.js 是從遠端載入翻譯，這裡僅為新的 UI 文本提供一個預設值
    // 實際的翻譯應該在 lang_xx.json 檔案中維護
    if (i18n.translations[i18n.currentLang] && !i18n.translations[i18n.currentLang]['enchanting_cost_data_will_be_displayed_here']) {
        i18n.translations[i18n.currentLang]['enchanting_cost_data_will_be_displayed_here'] = '附魔成本數據將顯示在這裡。';
    }
    if (i18n.translations[i18n.currentLang] && !i18n.translations[i18n.currentLang]['Enchanting']) {
        i18n.translations[i18n.currentLang]['Enchanting'] = '附魔';
    }
    if (i18n.translations[i18n.currentLang] && !i18n.translations[i18n.currentLang]['explanation']) {
        i18n.translations[i18n.currentLang]['explanation'] = '說明';
    }
    if (i18n.translations[i18n.currentLang] && !i18n.translations[i18n.currentLang]['failed_to_load_explanation_page']) {
        i18n.translations[i18n.currentLang]['failed_to_load_explanation_page'] = '載入說明頁面失敗: {0}';
    }
    if (i18n.translations[i18n.currentLang] && !i18n.translations[i18n.currentLang]['Open Item']) {
        i18n.translations[i18n.currentLang]['Open Item'] = '開啟物品';
    }
    if (i18n.translations[i18n.currentLang] && !i18n.translations[i18n.currentLang]['No data available for this item.']) {
        i18n.translations[i18n.currentLang]['No data available for this item.'] = '此物品無可用數據。';
    }
    if (i18n.translations[i18n.currentLang] && !i18n.translations[i18n.currentLang]['Key']) {
        i18n.translations[i18n.currentLang]['Key'] = '鑰匙';
    }
    if (i18n.translations[i18n.currentLang] && !i18n.translations[i18n.currentLang]['Level']) {
        i18n.translations[i18n.currentLang]['Level'] = '等級';
    }
    if (i18n.translations[i18n.currentLang] && !i18n.translations[i18n.currentLang]['Name']) {
        i18n.translations[i18n.currentLang]['Name'] = '名稱';
    }
    if (i18n.translations[i18n.currentLang] && !i18n.translations[i18n.currentLang]['Base Chance']) {
        i18n.translations[i18n.currentLang]['Base Chance'] = '基礎機率';
    }
    if (i18n.translations[i18n.currentLang] && !i18n.translations[i18n.currentLang]['Real Chance']) {
        i18n.translations[i18n.currentLang]['Real Chance'] = '實際機率';
    }
    if (i18n.translations[i18n.currentLang] && !i18n.translations[i18n.currentLang]['Price']) {
        i18n.translations[i18n.currentLang]['Price'] = '價格';
    }
    if (i18n.translations[i18n.currentLang] && !i18n.translations[i18n.currentLang]['base chance']) {
        i18n.translations[i18n.currentLang]['base chance'] = '基礎機率';
    }
    if (i18n.translations[i18n.currentLang] && !i18n.translations[i18n.currentLang]['real chance']) {
        i18n.translations[i18n.currentLang]['real chance'] = '實際機率';
    }
    
    // 添加 breeding 相關的翻譯鍵值
    if (i18n.translations[i18n.currentLang] && !i18n.translations[i18n.currentLang]['parent1']) {
        i18n.translations[i18n.currentLang]['parent1'] = '父寵物1';
    }
    if (i18n.translations[i18n.currentLang] && !i18n.translations[i18n.currentLang]['parent2']) {
        i18n.translations[i18n.currentLang]['parent2'] = '父寵物2';
    }
    if (i18n.translations[i18n.currentLang] && !i18n.translations[i18n.currentLang]['plan']) {
        i18n.translations[i18n.currentLang]['plan'] = '計劃';
    }
    if (i18n.translations[i18n.currentLang] && !i18n.translations[i18n.currentLang]['one bar']) {
        i18n.translations[i18n.currentLang]['one bar'] = '一格';
    }
    if (i18n.translations[i18n.currentLang] && !i18n.translations[i18n.currentLang]['full']) {
        i18n.translations[i18n.currentLang]['full'] = '滿格';
    }
    if (i18n.translations[i18n.currentLang] && !i18n.translations[i18n.currentLang]['comp']) {
        i18n.translations[i18n.currentLang]['comp'] = '完成';
    }
    if (i18n.translations[i18n.currentLang] && !i18n.translations[i18n.currentLang]['exp']) {
        i18n.translations[i18n.currentLang]['exp'] = '經驗值';
    }
    if (i18n.translations[i18n.currentLang] && !i18n.translations[i18n.currentLang]['adjustment']) {
        i18n.translations[i18n.currentLang]['adjustment'] = '修正機率';
    }
    if (i18n.translations[i18n.currentLang] && !i18n.translations[i18n.currentLang]['total value']) {
        i18n.translations[i18n.currentLang]['total value'] = '總價值';
    }
    if (i18n.translations[i18n.currentLang] && !i18n.translations[i18n.currentLang]['Breeding']) {
        i18n.translations[i18n.currentLang]['Breeding'] = '繁殖';
    }
    if (i18n.translations[i18n.currentLang] && !i18n.translations[i18n.currentLang]['Breeding Cost Calculator']) {
        i18n.translations[i18n.currentLang]['Breeding Cost Calculator'] = '繁殖成本計算器';
    }
    if (i18n.translations[i18n.currentLang] && !i18n.translations[i18n.currentLang]['other plans']) {
        i18n.translations[i18n.currentLang]['other plans'] = '其他計劃';
    }
    if (i18n.translations[i18n.currentLang] && !i18n.translations[i18n.currentLang]['no available plans']) {
        i18n.translations[i18n.currentLang]['no available plans'] = '無可用計劃';
    }
    if (i18n.translations[i18n.currentLang] && !i18n.translations[i18n.currentLang]['pet data not loaded or unavailable']) {
        i18n.translations[i18n.currentLang]['pet data not loaded or unavailable'] = '寵物數據未載入或不可用';
    }
    if (i18n.translations[i18n.currentLang] && !i18n.translations[i18n.currentLang]['item data not loaded']) {
        i18n.translations[i18n.currentLang]['item data not loaded'] = '物品數據未載入';
    }
    if (i18n.translations[i18n.currentLang] && !i18n.translations[i18n.currentLang]['no available breeding combinations']) {
        i18n.translations[i18n.currentLang]['no available breeding combinations'] = '沒有可用的繁殖組合';
    }
    if (i18n.translations[i18n.currentLang] && !i18n.translations[i18n.currentLang]['cost']) {
        i18n.translations[i18n.currentLang]['cost'] = '成本';
    }

    // 添加 Recycle 相關的翻譯鍵值
    if (i18n.translations[i18n.currentLang] && !i18n.translations[i18n.currentLang]['Recycle']) {
        i18n.translations[i18n.currentLang]['Recycle'] = '分解';
    }
    if (i18n.translations[i18n.currentLang] && !i18n.translations[i18n.currentLang]['Recycle Cost Calculator']) {
        i18n.translations[i18n.currentLang]['Recycle Cost Calculator'] = '分解成本計算器';
    }
    if (i18n.translations[i18n.currentLang] && !i18n.translations[i18n.currentLang]['recycle_data_not_available']) {
        i18n.translations[i18n.currentLang]['recycle_data_not_available'] = '分解數據未載入或不可用';
    }
    if (i18n.translations[i18n.currentLang] && !i18n.translations[i18n.currentLang]['itemName']) {
        i18n.translations[i18n.currentLang]['itemName'] = '物品名稱';
    }
    if (i18n.translations[i18n.currentLang] && !i18n.translations[i18n.currentLang]['worth']) {
        i18n.translations[i18n.currentLang]['worth'] = '價值';
    }

    // 添加 MonsterBook 相關的翻譯鍵值
    if (i18n.translations[i18n.currentLang] && !i18n.translations[i18n.currentLang]['MonsterBook']) {
        i18n.translations[i18n.currentLang]['MonsterBook'] = '怪物圖鑑';
    }
    if (i18n.translations[i18n.currentLang] && !i18n.translations[i18n.currentLang]['monster_book_data_not_loaded']) {
        i18n.translations[i18n.currentLang]['monster_book_data_not_loaded'] = '怪物圖鑑數據未載入或不可用';
    }
    if (i18n.translations[i18n.currentLang] && !i18n.translations[i18n.currentLang]['unknown_npc']) {
        i18n.translations[i18n.currentLang]['unknown_npc'] = '未知NPC';
    }
    if (i18n.translations[i18n.currentLang] && !i18n.translations[i18n.currentLang]['kills']) {
        i18n.translations[i18n.currentLang]['kills'] = '擊殺數';
    }
    if (i18n.translations[i18n.currentLang] && !i18n.translations[i18n.currentLang]['count']) {
        i18n.translations[i18n.currentLang]['count'] = '數量';
    }
    if (i18n.translations[i18n.currentLang] && !i18n.translations[i18n.currentLang]['drop']) {
        i18n.translations[i18n.currentLang]['drop'] = '掉落';
    }

    // 修改的條目
    if (results.modified.length > 0) {
        html += `<div class="comparison-section modified">
                    <h3>${i18n.translate('modified_items', results.modified.length)}</h3>
                    <ul class="comparison-list">`;
        results.modified.forEach(modItem => {
            html += `<li>
                        ${i18n.translate('id')}: ${modItem.id}, ${i18n.translate('name')}: ${modItem.itemB.name || modItem.itemA.name || 'N/A'}
                        <div class="modified-details">`;
            for (const key in modItem.changes) {
                const change = modItem.changes[key];
                if (change.old === undefined) {
                    html += `<span>${i18n.translate('attribute', key)}: <span class="new-value">${i18n.translate('added', JSON.stringify(change.new))}</span></span>`;
                } else if (change.new === undefined) {
                    html += `<span>${i18n.translate('attribute', key)}: <span class="old-value">${i18n.translate('removed', JSON.stringify(change.old))}</span></span>`;
                } else {
                    html += `<span>${i18n.translate('attribute', key)}: <span class="old-value">${JSON.stringify(change.old)}</span> &rarr; <span class="new-value">${JSON.stringify(change.new)}</span></span>`;
                }
            }
            html += `</div></li>`;
        });
        html += `</ul></div>`;
    }

    if (results.added.length === 0 && results.removed.length === 0 && results.modified.length === 0) {
        html = `<p>${i18n.translate('no_differences_found')}</p>`;
    }

    containerElement.innerHTML = html;
}

/**
 * 載入說明頁面內容。
 * @param {string} containerId - 容器元素的 ID。
 */
async function loadExplanationPage(containerId) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.error(`找不到 ID 為 ${containerId} 的容器元素。`);
        return;
    }

    const currentLang = i18n.currentLang;
    let explanationPagePath = '';

    if (currentLang === 'zh-tw' || currentLang === 'zh') {
        explanationPagePath = 'views/explanation.html';
    } else {
        explanationPagePath = 'views/explanation_en.html';
    }

    try {
        const response = await fetch(explanationPagePath);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const htmlContent = await response.text();
        container.innerHTML = htmlContent;
        console.log(`說明頁面 ${explanationPagePath} 載入成功。`);
    } catch (error) {
        container.innerHTML = `<p style="color: red;">${i18n.translate('failed_to_load_explanation_page', error.message)}</p>`;
        console.error(`載入說明頁面 ${explanationPagePath} 失敗:`, error);
    }
}