import { generateCarpentryCostTableData } from './carpentryCost.js';
import { generateEnchantCostTableData } from './enchantCost.js'; // 導入 EnchantCost 模組
// js/main.js - 應用程式主入口點

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
import openItemTable from './tableGenerators/openItemTable.js'; // 導入 openItemTable 模組
import { generateKeyWorthTable } from './tableGenerators/keyWorth.js'; // 導入 keyCost 模組
import { generateRareKeyWorthTable } from './tableGenerators/rareKeyWorth.js'; // 導入 rareKeyCost 模組
import { generatePresentTable } from './tableGenerators/presentTable.js'; // 導入 present 模組
import { generateForgingCostTableData } from './forgingCost.js'; // 導入 ForgingCost 模組
import i18n from './i18n.js'; // 導入 i18n 模組
import { initPriceEditor } from './priceEditor.js'; // 導入價格編輯器模組

let allData = {}; // 用於儲存所有載入的數據，以便在語言切換時重新渲染
let currentMarketPricesData = []; // 用於儲存當前市場價格數據的記憶體變數，提升至全域
window.ui = {};

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
    }
}

/**
 * 根據頁面名稱渲染對應的表格。
 * @param {string} pageName - 要渲染的頁面名稱 (對應 data-tab 屬性)。
 */
async function renderPage(pageName) {
    try {
        // 統一清空所有帶有 clearable-table-content class 的元素內容
        document.querySelectorAll('.clearable-table-content').forEach(content => {
            content.innerHTML = '';
        });

        // 如果 allData 為空，則異步載入數據
        if (Object.keys(allData).length === 0) {
            console.log("allData 未載入，正在載入數據...");
            allData = await loadData();
            // 數據載入後，更新所有 UI 文本
            updateTabTitles();
            updateGoogleSheetUIText();
            updateVersionComparisonUIText();
        }

        const { itemBase, FORGE_FORMULAS, CARPENTRY_FORMULAS, npcBase, pets, skillQuest, objectBase, forge, imageSheet, enchantingChances, items } = allData;

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
            case 'monster-worth-page': // 怪物價值
                containerId = 'monster-worth-table-container';
                generateFunction = generateMonsterWorthTable;
                args = [containerId, npcBase, generateTableHTML, createItemNameMap, itemBase];
                break;
            case 'forging-cost-page': // 鍛造成本
                containerId = 'forging-table-container';
                if (itemBase && FORGE_FORMULAS) {
                    const forgingCostData = generateForgingCostTableData(FORGE_FORMULAS, generateTableHTML, createItemNameMap, itemBase);
                    generateFunction = renderForgingCostTable;
                    args = [containerId, forgingCostData];
                } else {
                    const forgingCostContainer = document.getElementById(containerId);
                    if (forgingCostContainer) {
                        forgingCostContainer.textContent = i18n.translate('forging_data_not_available');
                    }
                    console.error("For Forging Cost Tab, itemBase or FORGE_FORMULAS data is not available.");
                    return;
                }
                break;
            case 'carpentry-cost-page': // 木工成本
                containerId = 'carpentry-cost-table-container';
                if (itemBase && CARPENTRY_FORMULAS) {
                    const carpentryCostData = generateCarpentryCostTableData(CARPENTRY_FORMULAS, generateTableHTML, createItemNameMap, itemBase);
                    generateFunction = renderCarpentryCostTable;
                    args = [containerId, carpentryCostData];
                } else {
                    const carpentryCostContainer = document.getElementById(containerId);
                    if (carpentryCostContainer) {
                        carpentryCostContainer.textContent = i18n.translate('carpentry_data_not_available');
                    }
                    console.error("For Carpentry Cost Tab, itemBase or CARPENTRY_FORMULAS data is not available.");
                    return;
                }
                break;
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
    }
}

/**
 * 渲染鍛造成本表格。
 * @param {string} containerId - 容器元素的 ID。
 * @param {Array<Object>} forgingCostData - 鍛造成本數據。
 */
function renderForgingCostTable(containerId, forgingCostData) {
    const forgingCostContainer = document.getElementById(containerId);
    if (!forgingCostContainer) {
        console.error(`找不到 ID 為 ${containerId} 的容器元素。`);
        return;
    }

    forgingCostContainer.innerHTML = ''; // 清空舊內容

    if (forgingCostData && forgingCostData.length > 0) {
        let tableHTML = '<table><thead><tr>';
        tableHTML += `<th>${i18n.translate('id')}</th>`;
        tableHTML += `<th>${i18n.translate('name')}</th>`;
        tableHTML += `<th>${i18n.translate('level')}</th>`;
        tableHTML += `<th>${i18n.translate('pattern')}</th>`;
        tableHTML += `<th>${i18n.translate('material price')}</th>`;
        tableHTML += `<th>${i18n.translate('chance')}</th>`;
        tableHTML += `<th>${i18n.translate('cost')}</th>`;
        tableHTML += `<th>${i18n.translate('sell price')}</th>`;
        tableHTML += '</tr></thead><tbody>';
        forgingCostData.forEach(row => {
            tableHTML += '<tr>';
            tableHTML += `<td>${row.id}</td>`;
            tableHTML += `<td>${row.itemName}</td>`;
            tableHTML += `<td>${row.level}</td>`;
            tableHTML += `<td>${row.pattern}</td>`;
            tableHTML += `<td>${row.materialPrice}</td>`;
            tableHTML += `<td>${row.chance}</td>`;
            tableHTML += `<td>${row.cost}</td>`;
            tableHTML += `<td>${row.sellPrice}</td>`;
            tableHTML += '</tr>';
        });
        tableHTML += '</tbody></table>';
        forgingCostContainer.innerHTML = tableHTML;
    } else {
        forgingCostContainer.textContent = i18n.translate('forging_data_not_available');
        console.error("For Forging Cost Tab, data is not available or empty.");
    }
}

/**
 * 渲染木工成本表格。
 * @param {string} containerId - 容器元素的 ID。
 * @param {Array<Object>} carpentryCostData - 木工成本數據。
 */
function renderCarpentryCostTable(containerId, carpentryCostData) {
    const carpentryCostContainer = document.getElementById(containerId);
    if (!carpentryCostContainer) {
        console.error(`找不到 ID 為 ${containerId} 的容器元素。`);
        return;
    }

    carpentryCostContainer.innerHTML = ''; // 清空舊內容

    if (carpentryCostData && carpentryCostData.length > 0) {
        let tableHTML = '<table><thead><tr>';
        tableHTML += `<th>${i18n.translate('name')}</th>`;
        tableHTML += `<th>${i18n.translate('level')}</th>`;
        tableHTML += `<th>${i18n.translate('pattern')}</th>`;
        tableHTML += `<th>${i18n.translate('material price')}</th>`;
        tableHTML += `<th>${i18n.translate('cost')}</th>`;
        tableHTML += `<th>${i18n.translate('sell price')}</th>`;
        tableHTML += '</tr></thead><tbody>';
        carpentryCostData.forEach(row => {
            tableHTML += '<tr>';
            tableHTML += `<td>${row.itemName}</td>`;
            tableHTML += `<td>${row.level}</td>`;
            tableHTML += `<td>${row.pattern}</td>`;
            tableHTML += `<td>${row.materialPrice}</td>`;
            tableHTML += `<td>${row.cost}</td>`;
            tableHTML += `<td>${row.sellPrice}</td>`;
            tableHTML += '</tr>';
        });
        tableHTML += '</tbody></table>';
        carpentryCostContainer.innerHTML = tableHTML;
    } else {
        carpentryCostContainer.textContent = i18n.translate('carpentry_data_not_available');
        console.error("For Carpentry Cost Tab, data is not available or empty.");
    }
}

/**
 * 更新 Tab 標題的翻譯。
 */
function updateTabTitles() {
    // 更新上層選單標題
const newToggle = document.querySelector('.sidebar-menu .has-submenu:nth-child(1) > .submenu-toggle');
if (newToggle) newToggle.textContent = i18n.translate('New');
const priceToggle = document.querySelector('.sidebar-menu .has-submenu:nth-child(2) > .submenu-toggle');
if (priceToggle) priceToggle.textContent = i18n.translate('Price');
const wikiToggle = document.querySelector('.sidebar-menu .has-submenu:nth-child(3) > .submenu-toggle');
if (wikiToggle) wikiToggle.textContent = i18n.translate('Wiki');

// 更新「說明」連結的文本
const explanationTabButton = document.querySelector('.tab-button[data-tab="explanation-page"]');
if (explanationTabButton) explanationTabButton.textContent = i18n.translate('explanation');

// 更新子選單標題
const itemTabButton = document.querySelector('.tab-button[data-tab="tab1"]');
if (itemTabButton) itemTabButton.textContent = i18n.translate('Item');
const carpentryTabButton = document.querySelector('.tab-button[data-tab="tab2"]');
if (carpentryTabButton) carpentryTabButton.textContent = i18n.translate('carpentry');
const forgingTabButton = document.querySelector('.tab-button[data-tab="tab3"]');
if (forgingTabButton) forgingTabButton.textContent = i18n.translate('forging');
const npcTabButton = document.querySelector('.tab-button[data-tab="tab4"]');
if (npcTabButton) npcTabButton.textContent = i18n.translate('npc');
const petTabButton = document.querySelector('.tab-button[data-tab="tab5"]');
if (petTabButton) petTabButton.textContent = i18n.translate('Pet');
const skillQuestTabButton = document.querySelector('.tab-button[data-tab="tab6"]');
if (skillQuestTabButton) skillQuestTabButton.textContent = i18n.translate('Skill Quest');
const objectsTabButton = document.querySelector('.tab-button[data-tab="tab7"]');
if (objectsTabButton) objectsTabButton.textContent = i18n.translate('objects');
const enchantingTabButton = document.querySelector('.tab-button[data-tab="tab8"]');
if (enchantingTabButton) enchantingTabButton.textContent = i18n.translate('Enchanting');
const imageSheetTabButton = document.querySelector('.tab-button[data-tab="tab9"]');
if (imageSheetTabButton) imageSheetTabButton.textContent = i18n.translate('image_sheet');
const marketPriceIntegrationTabButton = document.querySelector('.tab-button[data-tab="tab10"]');
if (marketPriceIntegrationTabButton) marketPriceIntegrationTabButton.textContent = i18n.translate('Market Price Integration');
const versionComparisonTabButton = document.querySelector('.tab-button[data-tab="tab11"]');
if (versionComparisonTabButton) versionComparisonTabButton.textContent = i18n.translate('Version Comparison');
const forgingCostTabButton = document.querySelector('.tab-button[data-tab="forging-cost-page"]');
if (forgingCostTabButton) forgingCostTabButton.textContent = i18n.translate('forging');
const carpentryCostTabButton = document.querySelector('.tab-button[data-tab="carpentry-cost-page"]');
if (carpentryCostTabButton) carpentryCostTabButton.textContent = i18n.translate('Carpentry');
const monsterWorthTabButton = document.querySelector('.tab-button[data-tab="monster-worth-page"]');
if (monsterWorthTabButton) monsterWorthTabButton.textContent = i18n.translate('monster worth');
const enchantingCostTabButton = document.querySelector('.tab-button[data-tab="enchanting-cost-page"]');
if (enchantingCostTabButton) enchantingCostTabButton.textContent = i18n.translate('Enchanting');
const openItemTabButton = document.querySelector('.tab-button[data-tab="open-item-page"]');
if (openItemTabButton) openItemTabButton.textContent = i18n.translate('Open Item');
const keyTabButton = document.querySelector('.tab-button[data-tab="key-page"]');
if (keyTabButton) keyTabButton.textContent = i18n.translate('Key');
const rareKeyTabButton = document.querySelector('.tab-button[data-tab="rare-key-page"]');
if (rareKeyTabButton) rareKeyTabButton.textContent = i18n.translate('Rare Key');
const presentTabButton = document.querySelector('.tab-button[data-tab="present-page"]');
if (presentTabButton) presentTabButton.textContent = i18n.translate('Present');

// 更新 Tab 內容標題
const tab1ContentH2 = document.querySelector('#tab1-content h2');
if (tab1ContentH2) tab1ContentH2.textContent = i18n.translate('Item');
const tab2ContentH2 = document.querySelector('#tab2-content h2');
if (tab2ContentH2) tab2ContentH2.textContent = i18n.translate('carpentry');
const tab3ContentH2 = document.querySelector('#tab3-content h2');
if (tab3ContentH2) tab3ContentH2.textContent = i18n.translate('forging');
const tab4ContentH2 = document.querySelector('#tab4-content h2');
if (tab4ContentH2) tab4ContentH2.textContent = i18n.translate('npc');
const tab5ContentH2 = document.querySelector('#tab5-content h2');
if (tab5ContentH2) tab5ContentH2.textContent = i18n.translate('Pet');
const tab6ContentH2 = document.querySelector('#tab6-content h2');
if (tab6ContentH2) tab6ContentH2.textContent = i18n.translate('Skill Quest');
const tab7ContentH2 = document.querySelector('#tab7-content h2');
if (tab7ContentH2) tab7ContentH2.textContent = i18n.translate('objects');
const tab8ContentH2 = document.querySelector('#tab8-content h2');
if (tab8ContentH2) tab8ContentH2.textContent = i18n.translate('Enchanting');
const tab9ContentH2 = document.querySelector('#tab9-content h2');
if (tab9ContentH2) tab9ContentH2.textContent = i18n.translate('image_sheet');
const tab10ContentH2 = document.querySelector('#tab10-content > h2');
if (tab10ContentH2) tab10ContentH2.textContent = i18n.translate('Market Price Integration');
const tab11ContentH2 = document.querySelector('#tab11-content > h2');
if (tab11ContentH2) tab11ContentH2.textContent = i18n.translate('Version Comparison');
const monsterWorthContentH2 = document.querySelector('#monster-worth-page-content h2');
if (monsterWorthContentH2) monsterWorthContentH2.textContent = i18n.translate('monster worth');
const keyContentH2 = document.querySelector('#key-page-content h2');
if (keyContentH2) keyContentH2.textContent = i18n.translate('Key');
const rareKeyContentH2 = document.querySelector('#rare-key-page-content h2');
if (rareKeyContentH2) rareKeyContentH2.textContent = i18n.translate('Rare Key');
const presentContentH2 = document.querySelector('#present-page-content h2');
if (presentContentH2) presentContentH2.textContent = i18n.translate('Present');
}

/**
 * 更新市場價格整合功能中的 UI 文本。
 */
function updateGoogleSheetUIText() {
    const googleSheetUrlInput = document.getElementById('google-sheet-url');
    const loadSheetButton = document.getElementById('load-sheet-button');
    const exportCsvButton = document.getElementById('export-csv-button');
    const importCsvButton = document.getElementById('import-csv-button');
    const csvFileInput = document.getElementById('csv-file-input');

    if (googleSheetUrlInput) googleSheetUrlInput.placeholder = i18n.translate('enter_google_sheet_url_or_id');
    if (loadSheetButton) loadSheetButton.textContent = i18n.translate('load_data');
    if (exportCsvButton) exportCsvButton.textContent = i18n.translate('export_as_csv');
    if (importCsvButton) importCsvButton.textContent = i18n.translate('import_csv');
    if (csvFileInput) csvFileInput.setAttribute('accept', '.csv'); // 確保只接受 CSV 檔案
}

/**
 * 更新版本比較功能中的 UI 文本。
 */
function updateVersionComparisonUIText() {
    const versionALabel = document.querySelector('label[for="versionA-select"]');
    const versionBLabel = document.querySelector('label[for="versionB-select"]');
    const compareVersionsButton = document.getElementById('compare-versions-button');

    if (versionALabel) versionALabel.textContent = i18n.translate('version_a');
    if (versionBLabel) versionBLabel.textContent = i18n.translate('version_b');
    if (compareVersionsButton) compareVersionsButton.textContent = i18n.translate('compare_versions');
}

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
    const sheetDataDisplayDiv = document.getElementById('sheet-data-display');
    if (!sheetDataDisplayDiv) {
        console.error("sheet-data-display 元素未找到。");
        return;
    }

    if (data.length === 0) {
        sheetDataDisplayDiv.textContent = i18n.translate('no_data_to_display');
        return;
    }

    const itemBase = allData.itemBase;
    const itemNameMap = createItemNameMap(itemBase, i18n.translate);

    let tableHTML = '<table><thead><tr>';
    // 渲染標頭
    tableHTML += `<th>${i18n.translate('item id')}</th>`;
    tableHTML += `<th>${i18n.translate('name')}</th>`;
    tableHTML += `<th>${i18n.translate('wiki price')}</th>`;
    tableHTML += `<th>${i18n.translate('market buy')}</th>`;
    tableHTML += `<th>${i18n.translate('market sell')}</th>`;
    tableHTML += `<th>${i18n.translate('custom price')}</th>`; // 新增 custom price 標頭
    tableHTML += '</tr></thead><tbody>';

    // 渲染數據行
    for (let i = 0; i < data.length; i++) {
        const row = data[i];
        const itemId = row[0];
        const marketBuyPrice = row[1]; // 調整索引
        const marketSellPrice = row[2]; // 調整索引
        const customPrice = row[3]; // 新增 custom price

        const itemInfo = itemBase.find(item => item.b_i === itemId);
        const itemName = itemInfo ? itemNameMap.get(itemId) : i18n.translate('unknown_item');
        const wikiPrice = itemInfo && itemInfo.params && itemInfo.params.price ? itemInfo.params.price : 'N/A';

        tableHTML += `<tr data-row-index="${i}">`;
        tableHTML += `<td>${itemId}</td>`;
        tableHTML += `<td>${itemName}</td>`;
        tableHTML += `<td>${typeof wikiPrice === 'number' ? formatNumberWithThousandsSeparator(wikiPrice) : wikiPrice}</td>`;
        tableHTML += `<td contenteditable="true" data-col-index="1">${typeof marketBuyPrice === 'number' ? formatNumberWithThousandsSeparator(marketBuyPrice) : marketBuyPrice}</td>`; // 調整 col-index
        tableHTML += `<td contenteditable="true" data-col-index="2">${typeof marketSellPrice === 'number' ? formatNumberWithThousandsSeparator(marketSellPrice) : marketSellPrice}</td>`; // 調整 col-index
        tableHTML += `<td contenteditable="true" data-col-index="3">${typeof customPrice === 'number' ? formatNumberWithThousandsSeparator(customPrice) : customPrice}</td>`; // 新增 custom price
        tableHTML += '</tr>';
    }
    tableHTML += '</tbody></table>';
    sheetDataDisplayDiv.innerHTML = tableHTML;

    // 添加事件監聽器以處理行內編輯
    sheetDataDisplayDiv.querySelectorAll('td[contenteditable="true"]').forEach(cellElement => {
        // 移除舊的事件監聽器以避免重複綁定
        cellElement.removeEventListener('blur', handleCellEditWrapper);
        cellElement.removeEventListener('keydown', handleCellEditKeydownWrapper);

        // 綁定新的事件監聽器
        cellElement.addEventListener('blur', handleCellEditWrapper);
        cellElement.addEventListener('keydown', handleCellEditKeydownWrapper);
    });
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
    // 初始化 i18n 模組
    await i18n.init();

    // 語言切換邏輯
    const langSelect = document.getElementById('lang-select');
    if (langSelect) {
        /**
         * 動態填充語言選擇器。
         */
        const populateLanguageSelector = () => {
            langSelect.innerHTML = ''; // 清空現有選項
            // 確保 availableLanguages 是陣列且有數據
            if (Array.isArray(i18n.availableLanguages) && i18n.availableLanguages.length > 0) {
                i18n.availableLanguages.forEach(lang => {
                    const option = document.createElement('option');
                    option.value = lang.code;
                    option.textContent = i18n.translateLangName(lang.name); // 翻譯語言名稱
                    langSelect.appendChild(option);
                });
            } else {
                console.warn("i18n.availableLanguages 為空或不是陣列，無法填充語言選擇器。");
                // 可以添加預設選項，例如：
                const defaultOption = document.createElement('option');
                defaultOption.value = 'en';
                defaultOption.textContent = 'English';
                langSelect.appendChild(defaultOption);
            }
        };

        // 在 i18n 初始化後立即填充語言選擇器
        populateLanguageSelector();
        // 設定當前選定的語言
        langSelect.value = i18n.currentLang;
        // 更新 UI 文本 (確保首次載入時也更新)
        updateTabTitles();
        updateGoogleSheetUIText();
        updateVersionComparisonUIText();

        // 監聽語言切換事件
        langSelect.addEventListener('change', async (event) => {
            const newLang = event.target.value;
            await i18n.setLanguage(newLang);
            // 重新填充語言選擇器以更新語言名稱翻譯
            populateLanguageSelector();
            // 設定當前選定的語言 (確保下拉選單顯示正確)
            langSelect.value = i18n.currentLang;
            // 更新 UI 文本
            updateTabTitles();
            updateGoogleSheetUIText();
            updateVersionComparisonUIText();

            // 獲取當前活躍的 Tab
            const activeTabButton = document.querySelector('.tab-button.active');
            if (activeTabButton) {
                const activeTabName = activeTabButton.dataset.tab;
                await renderPage(activeTabName); // 重新渲染當前活躍的 Tab
            } else {
                // 如果沒有活躍的 Tab，則嘗試渲染預設 Tab (例如：tab1)
                // 這裡可以根據實際需求設定預設行為
                console.log("沒有活躍的 Tab，跳過重新渲染當前頁面。");
            }
        });
    } else {
        console.error("語言選擇器元素未找到。");
    }

    // 確保在 DOMContentLoaded 時，如果 open-item-page 是預設活躍的 Tab，則正確初始化
    const initialActiveTabButton = document.querySelector('.tab-button.active');
    if (initialActiveTabButton && initialActiveTabButton.dataset.tab === 'open-item-page') {
        // 由於 renderPage 會處理數據載入，這裡不需要額外處理 itemBase, i18n, utils
        await renderPage('open-item-page');
    }

    // 處理 Tab 切換邏輯
    // 處理巢狀選單邏輯
    document.querySelectorAll('.sidebar-menu .submenu-toggle').forEach(toggle => {
        toggle.addEventListener('click', (event) => {
            event.preventDefault();
            const parentLi = toggle.closest('.has-submenu');
            const submenu = parentLi.querySelector('.submenu');

            // 切換 active 類別
            toggle.classList.toggle('active');
            submenu.classList.toggle('active');
        });
    });

    // 處理子選單 Tab 切換邏輯
    document.querySelectorAll('.sidebar-menu .submenu .tab-button').forEach(button => {
        button.addEventListener('click', async (event) => { // 添加 async
            event.preventDefault();

            // 移除所有 tab-button 和 tab-content 的 active 類別
            document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

            // 為當前點擊的按鈕和對應的內容添加 active 類別
            button.classList.add('active');
            const targetTabContent = document.getElementById(`${button.dataset.tab}-content`);
            if (targetTabContent) {
                targetTabContent.classList.add('active');
            }

            // 呼叫新的渲染函數
            await renderPage(button.dataset.tab);
        });
    });

    // // 預設激活「Wiki」選單下的「物品資料」Tab
    // const defaultParentMenu = document.querySelector('.sidebar-menu .has-submenu:nth-child(3) > .submenu-toggle'); // Wiki
    // const defaultTabButton = document.querySelector('.tab-button[data-tab="tab1"]'); // 物品資料

    // if (defaultParentMenu) {
    //     defaultParentMenu.classList.add('active');
    //     const defaultSubmenu = defaultParentMenu.closest('.has-submenu').querySelector('.submenu');
    //     if (defaultSubmenu) {
    //         defaultSubmenu.classList.add('active');
    //     }
    // }

    // if (defaultTabButton) {
    //     // 預設激活「物品資料」Tab，並呼叫 renderPage 進行渲染
    //     defaultTabButton.classList.add('active');
    //     const targetTabContent = document.getElementById(`${defaultTabButton.dataset.tab}-content`);
    //     if (targetTabContent) {
    //         targetTabContent.classList.add('active');
    //     }
    //     await renderPage(defaultTabButton.dataset.tab);
    // }

    // 首次載入時不自動渲染所有表格，等待用戶點擊
    // 初始化鍛造成本計算器 (已整合到 Tab 切換邏輯中)


    // Google Sheet 市場整合功能邏輯
    // 在 Google Charts Library 載入完成後初始化
    // initializeMarketPriceIntegrationLogic 將在 initMarketPriceIntegrationUI 中被調用

    // 為怪物價值過濾開關添加事件監聽器
    const monsterWorthToggles = ['hideBossToggle', 'hideRareToggle', 'hideEliteToggle'];
    monsterWorthToggles.forEach(toggleId => {
        const toggleElement = document.getElementById(toggleId);
        if (toggleElement) {
            toggleElement.addEventListener('change', async () => {
                // 只有當怪物價值頁面是活躍狀態時才重新渲染
                const monsterWorthTabButton = document.querySelector('.tab-button[data-tab="monster-worth-page"]');
                if (monsterWorthTabButton && monsterWorthTabButton.classList.contains('active')) {
                    await renderPage('monster-worth-page');
                }
            });
        }
    });


});

// 通用摺疊功能邏輯
document.addEventListener('DOMContentLoaded', () => {
    const collapsibleHeaders = document.querySelectorAll('.collapsible-header');

    collapsibleHeaders.forEach(header => {
        header.addEventListener('click', () => {
            const content = header.nextElementSibling; // 假設內容是標題的下一個兄弟元素
            if (content && content.classList.contains('collapsible-content')) {
                content.classList.toggle('collapsed');
                header.classList.toggle('collapsed'); // 也切換標題的 collapsed class 以更新箭頭圖示
            }
        });
    });

    // 預設讓所有 collapsible-content 區塊的內容為收合狀態
    document.querySelectorAll('.collapsible-content').forEach(content => {
        content.classList.add('collapsed');
        // 同時為其對應的 header 添加 collapsed class
        const header = content.previousElementSibling;
        if (header && header.classList.contains('collapsible-header')) {
            header.classList.add('collapsed');
        }
    });
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