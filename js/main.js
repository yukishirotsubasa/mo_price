import { generateCarpentryCostTableData } from './carpentryCost.js';
// js/main.js - 應用程式主入口點

import { loadData, getItemBase, getForgeFormulas, getCarpentryFormulas, getNpcBase, getPets, getSkillQuest, getObjectBase, getEnchantingChances, getImageSheet, loadGoogleSheetData, loadJsFileVariable, processRawData, processRawDataFromLocalStorage, saveMarketDataToLocalStorage } from './dataLoader.js';
import { createItemNameMap, generateTableHTML, compareData } from './utils.js';
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
import { generateForgingCostTableData } from './forgingCost.js'; // 導入 ForgingCost 模組
import i18n from './i18n.js'; // 導入 i18n 模組

let allData = {}; // 用於儲存所有載入的數據，以便在語言切換時重新渲染

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
        generateItemTable('tab1-content', itemBase, generateTableHTML, createItemNameMap);
        generateCarpentryTable('tab2-content', CARPENTRY_FORMULAS, generateTableHTML, createItemNameMap, itemBase);
        generateForgeTable('tab3-content', FORGE_FORMULAS, generateTableHTML, createItemNameMap, itemBase);
        generateNpcTable('tab4-content', npcBase, generateTableHTML, createItemNameMap, itemBase);
        generatePetsTable('tab5-content', pets, generateTableHTML, createItemNameMap, itemBase, pets);
        generateSkillQuestTable('tab6-content', skillQuest, generateTableHTML, createItemNameMap, itemBase);
        generateObjectBaseTable('tab7-content', objectBase, generateTableHTML, createItemNameMap, itemBase);
        generateEnchantingChancesTable('tab8-content', forge, generateTableHTML, createItemNameMap, itemBase);
        generateImageSheetTable('tab9-content', imageSheet, generateTableHTML, createItemNameMap, itemBase);
        generateMonsterWorthTable('monster-worth-page-content', npcBase, generateTableHTML, createItemNameMap, itemBase);

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
        // 如果 allData 為空，則異步載入數據
        if (Object.keys(allData).length === 0) {
            console.log("allData 未載入，正在載入數據...");
            allData = await loadData();
            // 數據載入後，更新所有 UI 文本
            updateTabTitles();
            updateGoogleSheetUIText();
            updateVersionComparisonUIText();
        }

        const { itemBase, FORGE_FORMULAS, CARPENTRY_FORMULAS, npcBase, pets, skillQuest, objectBase, forge, imageSheet } = allData;

        let containerId;
        let generateFunction;
        let args = [];

        // 清空所有 tab-content 的內容，避免重複渲染和記憶體洩漏
        document.querySelectorAll('.tab-content').forEach(content => {
            content.innerHTML = '';
        });

        switch (pageName) {
            case 'tab1': // 物品資料
                containerId = 'tab1-content';
                generateFunction = generateItemTable;
                args = [containerId, itemBase, generateTableHTML, createItemNameMap];
                break;
            case 'tab2': // 木工資料
                containerId = 'tab2-content';
                generateFunction = generateCarpentryTable;
                args = [containerId, CARPENTRY_FORMULAS, generateTableHTML, createItemNameMap, itemBase];
                break;
            case 'tab3': // 鍛造資料
                containerId = 'tab3-content';
                generateFunction = generateForgeTable;
                args = [containerId, FORGE_FORMULAS, generateTableHTML, createItemNameMap, itemBase];
                break;
            case 'tab4': // NPC 資料
                containerId = 'tab4-content';
                generateFunction = generateNpcTable;
                args = [containerId, npcBase, generateTableHTML, createItemNameMap, itemBase];
                break;
            case 'tab5': // 寵物資料
                containerId = 'tab5-content';
                generateFunction = generatePetsTable;
                args = [containerId, pets, generateTableHTML, createItemNameMap, itemBase, pets];
                break;
            case 'tab6': // 技能任務
                containerId = 'tab6-content';
                generateFunction = generateSkillQuestTable;
                args = [containerId, skillQuest, generateTableHTML, createItemNameMap, itemBase];
                break;
            case 'tab7': // 物件資料
                containerId = 'tab7-content';
                generateFunction = generateObjectBaseTable;
                args = [containerId, objectBase, generateTableHTML, createItemNameMap, itemBase];
                break;
            case 'tab8': // 附魔機率
                containerId = 'tab8-content';
                generateFunction = generateEnchantingChancesTable;
                args = [containerId, forge, generateTableHTML, createItemNameMap, itemBase];
                break;
            case 'tab9': // 圖片資料
                containerId = 'tab9-content';
                generateFunction = generateImageSheetTable;
                args = [containerId, imageSheet, generateTableHTML, createItemNameMap, itemBase];
                break;
            case 'monster-worth-page': // 怪物價值
                containerId = 'monster-worth-page-content';
                generateFunction = generateMonsterWorthTable;
                args = [containerId, npcBase, generateTableHTML, createItemNameMap, itemBase];
                break;
            case 'forging-cost-page': // 鍛造成本
                const forgingCostContainer = document.getElementById('forging-cost-page-content');
                if (forgingCostContainer) {
                    forgingCostContainer.innerHTML = ''; // 清空舊內容
                    if (itemBase && FORGE_FORMULAS) {
                        const forgingCostData = generateForgingCostTableData(FORGE_FORMULAS, generateTableHTML, createItemNameMap, itemBase);
                        let tableHTML = '<table><thead><tr>';
                        tableHTML += `<th>${i18n.translate('id')}</th>`;
                        tableHTML += `<th>${i18n.translate('item_name')}</th>`;
                        tableHTML += `<th>${i18n.translate('level')}</th>`;
                        tableHTML += `<th>${i18n.translate('pattern')}</th>`;
                        tableHTML += `<th>${i18n.translate('material_price')}</th>`;
                        tableHTML += `<th>${i18n.translate('chance')}</th>`;
                        tableHTML += `<th>${i18n.translate('cost')}</th>`;
                        tableHTML += `<th>${i18n.translate('sell_price')}</th>`;
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
                        console.error("For Forging Cost Tab, itemBase or FORGE_FORMULAS data is not available.");
                    }
                } else {
                    console.error("Forging Cost Container element not found.");
                }
                return; // 鍛造成本有特殊渲染邏輯，直接返回
            case 'carpentry-cost-page': // 木工成本
                const carpentryCostContainer = document.getElementById('carpentry-cost-page-content');
                if (carpentryCostContainer) {
                    carpentryCostContainer.innerHTML = '';
                    if (itemBase && CARPENTRY_FORMULAS) {
                        const carpentryCostData = generateCarpentryCostTableData(CARPENTRY_FORMULAS, generateTableHTML, createItemNameMap, itemBase);
                        let tableHTML = '<table><thead><tr>';
                        tableHTML += `<th>${i18n.translate('item_name')}</th>`;
                        tableHTML += `<th>${i18n.translate('level')}</th>`;
                        tableHTML += `<th>${i18n.translate('pattern')}</th>`;
                        tableHTML += `<th>${i18n.translate('material_price')}</th>`;
                        tableHTML += `<th>${i18n.translate('cost')}</th>`;
                        tableHTML += `<th>${i18n.translate('sell_price')}</th>`;
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
                        console.error("For Carpentry Cost Tab, itemBase or CARPENTRY_FORMULAS data is not available.");
                    }
                } else {
                    console.error("Carpentry Cost Container element not found.");
                }
                return; // 木工成本有特殊渲染邏輯，直接返回
            case 'tab10': // 市場價格整合
            case 'tab11': // 版本比較
                // 這兩個 Tab 有自己的渲染邏輯，不需要在這裡處理
                return;
            default:
                console.warn(`未知頁面名稱: ${pageName}`);
                return;
        }

        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = ''; // 清空目標表格的 DOM 容器
            generateFunction(...args);
        } else {
            console.error(`找不到 ID 為 ${containerId} 的容器元素。`);
        }

    } catch (error) {
        console.error("渲染頁面失敗:", error);
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
const monsterWorthTabButton = document.querySelector('.tab-button[data-tab="monster-worth-page"]');
if (monsterWorthTabButton) monsterWorthTabButton.textContent = i18n.translate('monster_worth');

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
const tab10ContentH2 = document.querySelector('#tab10-content h2');
if (tab10ContentH2) tab10ContentH2.textContent = i18n.translate('Market Price Integration');
const tab11ContentH2 = document.querySelector('#tab11-content h2');
if (tab11ContentH2) tab11ContentH2.textContent = i18n.translate('Version Comparison');
const monsterWorthContentH2 = document.querySelector('#monster-worth-page-content h2');
if (monsterWorthContentH2) monsterWorthContentH2.textContent = i18n.translate('monster_worth');
}

/**
 * 更新市場價格整合功能中的 UI 文本。
 */
function updateGoogleSheetUIText() {
    const googleSheetUrlInput = document.getElementById('google-sheet-url');
    const loadSheetButton = document.getElementById('load-sheet-button');
    const forceReloadSheetButton = document.getElementById('force-reload-sheet-button');
    const exportCsvButton = document.getElementById('export-csv-button');
    const importCsvButton = document.getElementById('import-csv-button');
    const csvFileInput = document.getElementById('csv-file-input');

    if (googleSheetUrlInput) googleSheetUrlInput.placeholder = i18n.translate('enter_google_sheet_url_or_id');
    if (loadSheetButton) loadSheetButton.textContent = i18n.translate('load_data');
    if (forceReloadSheetButton) forceReloadSheetButton.textContent = i18n.translate('force_reload');
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

        // 監聽語言切換事件
        langSelect.addEventListener('change', async (event) => {
            const newLang = event.target.value;
            await i18n.setLanguage(newLang);
            // 語言切換後重新渲染所有表格和 UI 文本
            await renderAllTablesIfDataLoaded(); // 語言切換後重新渲染所有表格
            // 重新填充語言選擇器以更新語言名稱翻譯
            populateLanguageSelector();
            // 更新 UI 文本
            updateTabTitles();
            updateGoogleSheetUIText();
            updateVersionComparisonUIText();
        });
    } else {
        console.error("語言選擇器元素未找到。");
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
    google.charts.load('current', { packages: ['corechart', 'table'] });

    let currentMarketPricesData = []; // 用於儲存當前市場價格數據的記憶體變數

    /**
     * 渲染市場價格數據到表格。
     * @param {Array<Array<any>>} data - 處理後的市場價格數據，每行包含 [item id, item name, market buy price, market sell price]。
     */
    const renderMarketDataTable = (data) => {
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
        tableHTML += `<th>${i18n.translate('item_id')}</th>`;
        tableHTML += `<th>${i18n.translate('item_name')}</th>`;
        tableHTML += `<th>${i18n.translate('wiki_price')}</th>`;
        tableHTML += `<th>${i18n.translate('market_buy')}</th>`;
        tableHTML += `<th>${i18n.translate('market_sell')}</th>`;
        tableHTML += `<th>${i18n.translate('custom_price')}</th>`; // 新增 custom price 標頭
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
            tableHTML += `<td>${wikiPrice}</td>`;
            tableHTML += `<td contenteditable="true" data-col-index="1">${marketBuyPrice}</td>`; // 調整 col-index
            tableHTML += `<td contenteditable="true" data-col-index="2">${marketSellPrice}</td>`; // 調整 col-index
            tableHTML += `<td contenteditable="true" data-col-index="3">${customPrice}</td>`; // 新增 custom price
            tableHTML += '</tr>';
        }
        tableHTML += '</tbody></table>';
        sheetDataDisplayDiv.innerHTML = tableHTML;

        // 添加事件監聽器以處理行內編輯
        sheetDataDisplayDiv.querySelectorAll('td[contenteditable="true"]').forEach(cellElement => {
            cellElement.addEventListener('blur', (event) => {
                handleCellEdit(event.target, currentMarketPricesData);
            });
            cellElement.addEventListener('keydown', (event) => {
                if (event.key === 'Enter') {
                    event.preventDefault(); // 防止換行
                    event.target.blur(); // 觸發 blur 事件來儲存數據
                }
            });
        });
    };

    /**
     * 處理儲存格編輯。
     * @param {HTMLElement} cellElement - 被編輯的儲存格元素。
     * @param {Array<Array<any>>} dataToUpdate - 要更新的數據陣列。
     */
    const handleCellEdit = (cellElement, dataToUpdate) => {
        const rowIndex = parseInt(cellElement.closest('tr').dataset.rowIndex);
        const colIndex = parseInt(cellElement.dataset.colIndex); // 這裡的 colIndex 是原始數據的索引 (2 或 3)
        let newValue = cellElement.textContent.trim();

        // 數據驗證：確保輸入的是數字
        const parsedValue = parseFloat(newValue);
        if (isNaN(parsedValue)) {
            alert(i18n.translate('please_enter_valid_number'));
            cellElement.textContent = dataToUpdate[rowIndex][colIndex]; // 恢復原始值
            return;
        }
        newValue = parsedValue; // 儲存為數字

        // 更新記憶體中的數據模型
        dataToUpdate[rowIndex][colIndex] = newValue;

        // 將更新後的數據同步回 localStorage
        // localStorage 儲存 item id, market buy price, market sell price, custom price
        const dataToStore = dataToUpdate.map(row => [row[0], row[1], row[2], row[3]]); // 調整索引
        try {
            localStorage.setItem('price_data', JSON.stringify(dataToStore)); // 更改鍵名為 price_data
            console.log(i18n.translate('market_data_updated_and_saved'));
        } catch (e) {
            console.error(i18n.translate('failed_to_save_updated_data'), e);
        }
    };

    google.charts.setOnLoadCallback(() => {
        const googleSheetUrlInput = document.getElementById('google-sheet-url');
        const loadSheetButton = document.getElementById('load-sheet-button');
        const forceReloadSheetButton = document.getElementById('force-reload-sheet-button');
        const sheetStatusDiv = document.getElementById('sheet-status');
        const sheetDataDisplayDiv = document.getElementById('sheet-data-display');
        const exportCsvButton = document.getElementById('export-csv-button');
        const importCsvButton = document.getElementById('import-csv-button');
        const csvFileInput = document.getElementById('csv-file-input'); // 修改為 csv-file-input

        if (!googleSheetUrlInput || !loadSheetButton || !forceReloadSheetButton || !sheetStatusDiv || !sheetDataDisplayDiv || !exportCsvButton || !importCsvButton || !csvFileInput) {
            console.error("市場價格整合相關 UI 元素未找到。");
            return;
        }

        // CSV 匯出功能
        exportCsvButton.addEventListener('click', () => {
            let dataToExport = currentMarketPricesData;
            if (dataToExport.length <= 1) { // 只有標頭或沒有數據
                sheetStatusDiv.textContent = i18n.translate('no_data_to_export');
                return;
            }

            // 提取 item_id, market_buy, market_sell
            const exportableData = [
                ['item_id', 'market_buy', 'market_sell'] // 匯出標頭
            ];
            for (let i = 1; i < dataToExport.length; i++) {
                exportableData.push([
                    dataToExport[i][0], // item_id
                    dataToExport[i][3], // market_buy
                    dataToExport[i][4]  // market_sell
                ]);
            }

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
        });

        // CSV 匯入功能
        importCsvButton.addEventListener('click', () => {
            csvFileInput.click(); // 觸發隱藏的檔案輸入點擊事件
        });

        csvFileInput.addEventListener('change', async (event) => { // 修改為 async
            const file = event.target.files[0];
            if (!file) {
                sheetStatusDiv.textContent = i18n.translate('please_select_csv_file');
                return;
            }

            const reader = new FileReader();
            reader.onload = async (e) => { // 修改為 async
                try {
                    const csvContent = e.target.result;
                    // 簡單解析 CSV，不處理複雜的 CSV 格式 (例如包含逗號的欄位)
                    const rawImportedData = csvContent.split(/\r?\n/).map(row => row.split(',').map(cell => cell.trim()));

                    // 使用 dataLoader 中的 processRawData 函數
                    const processedImportedData = processRawData(rawImportedData);

                    if (processedImportedData.length > 0) {
                        currentMarketPricesData = processedImportedData;
                        // 將更新後的數據同步回 localStorage
                        // localStorage 只儲存 item id, market buy price, market sell price
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
        });

        // 綁定事件監聽器
        loadSheetButton.addEventListener('click', () => loadAndDisplaySheetData(false)); // 預設載入，不強制重新載入
        forceReloadSheetButton.addEventListener('click', () => loadAndDisplaySheetData(true)); // 強制重新載入

        // 在 Google Charts Library 載入完成後，嘗試從 localStorage 載入數據
        loadMarketDataFromLocalStorage();
    });

    /**
     * 從 localStorage 載入市場價格數據並顯示。
     */
    async function loadMarketDataFromLocalStorage() {
        const sheetStatusDiv = document.getElementById('sheet-status');
        const sheetDataDisplayDiv = document.getElementById('sheet-data-display');
        const CACHE_KEY = 'price_data'; // 更改鍵名為 price_data

        if (!sheetStatusDiv || !sheetDataDisplayDiv) {
            console.error("市場價格整合相關 UI 元素未找到。");
            return;
        }

        sheetStatusDiv.textContent = i18n.translate('loading_cached_data');
        sheetDataDisplayDiv.innerHTML = ''; // 清空之前的數據

        try {
            const cachedData = localStorage.getItem(CACHE_KEY);
            if (cachedData) {
                const rawCachedData = JSON.parse(cachedData);
                // 使用 dataLoader 中的 processRawDataFromLocalStorage 函數
                const processedCachedData = processRawDataFromLocalStorage(rawCachedData);

                if (processedCachedData.length > 0) {
                    currentMarketPricesData = processedCachedData;
                    renderMarketDataTable(currentMarketPricesData);
                    sheetStatusDiv.textContent = i18n.translate('cached_data_loaded_successfully');
                    console.log(i18n.translate('market_data_loaded_from_localstorage'), currentMarketPricesData);
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
    async function loadAndDisplaySheetData(forceReload = false) {
        const googleSheetUrlInput = document.getElementById('google-sheet-url');
        const sheetStatusDiv = document.getElementById('sheet-status');
        const sheetDataDisplayDiv = document.getElementById('sheet-data-display');
        // currentMarketPricesData 在外部作用域定義，這裡不需要重新定義

        if (!googleSheetUrlInput || !sheetStatusDiv || !sheetDataDisplayDiv) {
            console.error("Google Sheet 相關 UI 元素未找到。");
            return;
        }

        const urlOrId = googleSheetUrlInput.value.trim();
        if (!urlOrId) {
            sheetStatusDiv.textContent = i18n.translate('enter_google_sheet_url_or_id_message');
            return;
        }

        sheetStatusDiv.textContent = forceReload ? i18n.translate('force_reloading_data') : i18n.translate('loading_data');
        sheetDataDisplayDiv.innerHTML = ''; // 清空之前的數據

        try {
            const rawSheetData = await loadGoogleSheetData(urlOrId, '', forceReload); // loadGoogleSheetData 現在直接返回處理後的數據

            sheetStatusDiv.textContent = i18n.translate('data_loaded_successfully');
            currentMarketPricesData = rawSheetData; // loadGoogleSheetData 已經返回處理後的數據，直接使用
            
            renderMarketDataTable(currentMarketPricesData); // 渲染數據

        } catch (error) {
            sheetStatusDiv.textContent = i18n.translate('load_failed', error.message);
            sheetDataDisplayDiv.innerHTML = '';
            console.error("載入或處理 Google Sheet 數據失敗:", error);
        }
    }

    // 版本比較功能邏輯 (現在是 tab11)
    const versionASelect = document.getElementById('versionA-select');
    const versionBSelect = document.getElementById('versionB-select');
    const compareVersionsButton = document.getElementById('compare-versions-button');
    const comparisonResultsDiv = document.getElementById('version-comparison-results');

    if (versionASelect && versionBSelect && compareVersionsButton && comparisonResultsDiv) {
        compareVersionsButton.addEventListener('click', async () => {
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
        });
    } else {
        console.error(i18n.translate('version_comparison_ui_not_found'));
    }
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