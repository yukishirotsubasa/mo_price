// js/managers/PageRenderer.js
import { loadData } from '../dataLoader.js';
import { generateItemTable } from '../tableGenerators/itemTable.js';
import { generateCarpentryTable } from '../tableGenerators/carpentryTable.js';
import { generateForgeTable } from '../tableGenerators/forgeTable.js';
import { generateNpcTable } from '../tableGenerators/npcTable.js';
import { generatePetsTable } from '../tableGenerators/petsTable.js';
import { generateSkillQuestTable } from '../tableGenerators/skillQuestTable.js';
import { generateObjectBaseTable } from '../tableGenerators/objectBaseTable.js';
import { generateEnchantingChancesTable } from '../tableGenerators/enchantingChancesTable.js';
import { generateImageSheetTable } from '../tableGenerators/imageSheetTable.js';
import { generateMonsterWorthTable } from '../tableGenerators/monsterWorth.js';
import { generateMonsterBookTable } from '../tableGenerators/monsterBookTable.js';
import openItemTable from '../tableGenerators/openItemTable.js';
import { generateKeyWorthTable } from '../tableGenerators/keyWorth.js';
import { generateRareKeyWorthTable } from '../tableGenerators/rareKeyWorth.js';
import { generatePresentTable } from '../tableGenerators/presentTable.js';
import { generateBreedingCostTable } from '../tableGenerators/breedingCost.js';
import { generateForgingCostTableData } from '../forgingCost.js';
import { generateCarpentryCostTableData } from '../carpentryCost.js';
import { generateEnchantCostTableData } from '../enchantCost.js';
import { generateRecycleCostTableData } from '../recycleCost.js';
import { generateFirelordSetTableData } from '../tableGenerators/firelordSet.js';
import { generateMosMarketTable } from '../tableGenerators/mosMarketTable.js';
import { createItemNameMap, generateTableHTML, getItemSellPrice } from '../utils.js';
import { initPriceEditor } from '../priceEditor.js';
import i18n from '../i18n.js';

export class PageRenderer {
    constructor(marketPriceManager, versionComparisonManager) {
        this.marketPriceManager = marketPriceManager;
        this.versionComparisonManager = versionComparisonManager;
    }

    // 將main.js中的renderPage函數移動到這裡
    async renderPage(pageName) {
        try {
            // 清空表格內容
            if (window.uiController) {
                window.uiController.clearTableContents();
            }

            // 如果 allData 為空，則異步載入數據
            if (Object.keys(window.allData || {}).length === 0) {
                console.log("allData 未載入，正在載入數據...");
                window.allData = await loadData();
                // 數據載入後，更新所有 UI 文本
                if (window.uiController) {
                    window.uiController.updateTabTitles();
                    window.uiController.updateGoogleSheetUIText();
                    window.uiController.updateVersionComparisonUIText();
                }
            }

            const { itemBase, FORGE_FORMULAS, CARPENTRY_FORMULAS, npcBase, pets, skillQuest, objectBase, forge, imageSheet, enchantingChances, items, monsterBook } = window.allData;

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
                        if (window.costTableRenderer) {
                            window.costTableRenderer.renderForgingCostTable(containerId, forgingCostData);
                        }
                    } else {
                        if (window.tableRenderer) {
                            window.tableRenderer.showError(containerId, i18n.translate('forging_data_not_available'));
                        }
                        console.error("For Forging Cost Tab, itemBase or FORGE_FORMULAS data is not available.");
                    }
                    return;
                case 'carpentry-cost-page': // 木工成本
                    containerId = 'carpentry-cost-table-container';
                    if (itemBase && CARPENTRY_FORMULAS) {
                        const carpentryCostData = generateCarpentryCostTableData(CARPENTRY_FORMULAS, generateTableHTML, createItemNameMap, itemBase);
                        if (window.costTableRenderer) {
                            window.costTableRenderer.renderCarpentryCostTable(containerId, carpentryCostData);
                        }
                    } else {
                        if (window.tableRenderer) {
                            window.tableRenderer.showError(containerId, i18n.translate('carpentry_data_not_available'));
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
                    this.marketPriceManager.initMarketPriceIntegrationUI();
                    initPriceEditor(); // 初始化價格編輯器
                    return;
                case 'tab11': // 版本比較
                    this.versionComparisonManager.initVersionComparisonUI();
                    return;
                case 'explanation-page': // 說明頁面
                    containerId = 'explanation-page-content';
                    generateFunction = this.loadExplanationPage; // 使用新的函數來載入說明頁面
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
                        if (window.costTableRenderer) {
                            window.costTableRenderer.renderRecycleCostTable(containerId, recycleCostData);
                        }
                    } else {
                        if (window.tableRenderer) {
                            window.tableRenderer.showError(containerId, i18n.translate('recycle_data_not_available'));
                        }
                        console.error("For Recycle Cost Tab, itemBase or FORGE_FORMULAS data is not available.");
                    }
                    return;
                case 'firelord-set-page': // Firelord Set 頁面
                    containerId = 'firelord-set-table-container';
                    generateFunction = generateFirelordSetTableData;
                    args = [containerId, itemBase, generateTableHTML, createItemNameMap];
                    break;
                case 'mos-market-page': // MOS Market 頁面
                    containerId = 'mos-market-table-container';
                    generateFunction = generateMosMarketTable;
                    args = [containerId, itemBase, imageSheet];
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
            if (window.errorHandler) {
                window.errorHandler.logUIError('renderPage', error, { pageName, dataLoaded: Object.keys(window.allData || {}).length > 0 });
            }
        }
    }

    // 將main.js中的loadExplanationPage函數移動到這裡
    async loadExplanationPage(containerId) {
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
            
            // 提取body內容，避免重複的HTML結構
            const parser = new DOMParser();
            const doc = parser.parseFromString(htmlContent, 'text/html');
            const bodyContent = doc.body.innerHTML;
            
            container.innerHTML = bodyContent;
            
            // 確保載入的內容繼承主頁面的主題
            const currentTheme = document.documentElement.getAttribute('data-theme');
            if (currentTheme) {
                // 為載入的內容添加主題屬性
                const explanationElements = container.querySelectorAll('*');
                explanationElements.forEach(element => {
                    element.setAttribute('data-theme-inherited', currentTheme);
                });
            }
            
            console.log(`說明頁面 ${explanationPagePath} 載入成功。`);
        } catch (error) {
            container.innerHTML = `<p style="color: red;">${i18n.translate('failed_to_load_explanation_page', error.message)}</p>`;
            console.error(`載入說明頁面 ${explanationPagePath} 失敗:`, error);
        }
    }
}