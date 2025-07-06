// js/controllers/UIController.js - 管理UI元素更新

import i18n from '../i18n.js';

/**
 * UIController 類別 - 負責管理所有UI元素的更新和翻譯
 */
export class UIController {
    constructor() {
        // UI元素快取
        this.cachedElements = new Map();
    }

    /**
     * 快取常用的DOM元素以提升性能
     */
    cacheElements() {
        const selectors = {
            // 主選單元素
            newToggle: '.sidebar-menu .has-submenu:nth-child(1) > .submenu-toggle',
            priceToggle: '.sidebar-menu .has-submenu:nth-child(2) > .submenu-toggle',
            wikiToggle: '.sidebar-menu .has-submenu:nth-child(3) > .submenu-toggle',
            
            // Tab按鈕元素
            explanationTabButton: '.tab-button[data-tab="explanation-page"]',
            itemTabButton: '.tab-button[data-tab="tab1"]',
            carpentryTabButton: '.tab-button[data-tab="tab2"]',
            forgingTabButton: '.tab-button[data-tab="tab3"]',
            npcTabButton: '.tab-button[data-tab="tab4"]',
            petTabButton: '.tab-button[data-tab="tab5"]',
            skillQuestTabButton: '.tab-button[data-tab="tab6"]',
            objectsTabButton: '.tab-button[data-tab="tab7"]',
            enchantingTabButton: '.tab-button[data-tab="tab8"]',
            imageSheetTabButton: '.tab-button[data-tab="tab9"]',
            monsterBookTabButton: '.tab-button[data-tab="monster-book"]',
            marketPriceIntegrationTabButton: '.tab-button[data-tab="tab10"]',
            versionComparisonTabButton: '.tab-button[data-tab="tab11"]',
            forgingCostTabButton: '.tab-button[data-tab="forging-cost-page"]',
            carpentryCostTabButton: '.tab-button[data-tab="carpentry-cost-page"]',
            monsterWorthTabButton: '.tab-button[data-tab="monster-worth-page"]',
            enchantingCostTabButton: '.tab-button[data-tab="enchanting-cost-page"]',
            openItemTabButton: '.tab-button[data-tab="open-item-page"]',
            keyTabButton: '.tab-button[data-tab="key-page"]',
            rareKeyTabButton: '.tab-button[data-tab="rare-key-page"]',
            presentTabButton: '.tab-button[data-tab="present-page"]',
            breedingTabButton: '.tab-button[data-tab="breeding-page"]',
            recycleTabButton: '.tab-button[data-tab="recycle-page"]',
            firelordSetTabButton: '.tab-button[data-tab="firelord-set-page"]',
            mosMarketTabButton: '.tab-button[data-tab="mos-market-page"]',

            // 內容標題元素
            tab1ContentH2: '#tab1-content h2',
            tab2ContentH2: '#tab2-content h2',
            tab3ContentH2: '#tab3-content h2',
            tab4ContentH2: '#tab4-content h2',
            tab5ContentH2: '#tab5-content h2',
            tab6ContentH2: '#tab6-content h2',
            tab7ContentH2: '#tab7-content h2',
            tab8ContentH2: '#tab8-content h2',
            tab9ContentH2: '#tab9-content h2',
            monsterBookContentH2: '#monster-book-content h2',
            tab10ContentH2: '#tab10-content > h2',
            tab11ContentH2: '#tab11-content > h2',
            monsterWorthContentH2: '#monster-worth-page-content h2',
            keyContentH2: '#key-page-content h2',
            rareKeyContentH2: '#rare-key-page-content h2',
            presentContentH2: '#present-page-content h2',
            breedingContentH2: '#breeding-page-content h2',
            recycleContentH2: '#recycle-page-content h2',
            firelordSetContentH2: '#firelord-set-page-content h2',
            mosMarketContentH2: '#mos-market-page-content h2'
        };

        // 快取所有元素
        for (const [key, selector] of Object.entries(selectors)) {
            this.cachedElements.set(key, document.querySelector(selector));
        }
    }

    /**
     * 獲取快取的元素
     * @param {string} key - 元素鍵名
     * @returns {HTMLElement|null} DOM元素
     */
    getElement(key) {
        if (!this.cachedElements.has(key)) {
            this.cacheElements();
        }
        return this.cachedElements.get(key);
    }

    /**
     * 更新所有Tab標題的翻譯
     */
    updateTabTitles() {
        // 更新上層選單標題
        const newToggle = this.getElement('newToggle');
        if (newToggle) newToggle.textContent = i18n.translate('New');
        
        const priceToggle = this.getElement('priceToggle');
        if (priceToggle) priceToggle.textContent = i18n.translate('Price');
        
        const wikiToggle = this.getElement('wikiToggle');
        if (wikiToggle) wikiToggle.textContent = i18n.translate('Wiki');

        // 更新子選單標題
        this.updateTabButton('explanationTabButton', 'explanation');
        this.updateTabButton('itemTabButton', 'Item');
        this.updateTabButton('carpentryTabButton', 'carpentry');
        this.updateTabButton('forgingTabButton', 'forging');
        this.updateTabButton('npcTabButton', 'npc');
        this.updateTabButton('petTabButton', 'Pet');
        this.updateTabButton('skillQuestTabButton', 'Skill Quest');
        this.updateTabButton('objectsTabButton', 'objects');
        this.updateTabButton('enchantingTabButton', 'Enchanting');
        this.updateTabButton('imageSheetTabButton', 'image_sheet');
        this.updateTabButton('monsterBookTabButton', 'Monster Book');
        this.updateTabButton('marketPriceIntegrationTabButton', 'Market Price Integration');
        this.updateTabButton('versionComparisonTabButton', 'Version Comparison');
        this.updateTabButton('forgingCostTabButton', 'forging');
        this.updateTabButton('carpentryCostTabButton', 'Carpentry');
        this.updateTabButton('monsterWorthTabButton', 'monster worth');
        this.updateTabButton('enchantingCostTabButton', 'Enchanting');
        this.updateTabButton('openItemTabButton', 'Open Item');
        this.updateTabButton('keyTabButton', 'Key');
        this.updateTabButton('rareKeyTabButton', 'Rare Key');
        this.updateTabButton('presentTabButton', 'Present');
        this.updateTabButton('breedingTabButton', 'Breeding');
        this.updateTabButton('recycleTabButton', 'Recycle');
        this.updateTabButton('firelordSetTabButton', 'Firelord Set');
        this.updateTabButton('mosMarketTabButton', 'MOS Market');

        // 更新Tab內容標題
        this.updateContentTitle('tab1ContentH2', 'Item');
        this.updateContentTitle('tab2ContentH2', 'carpentry');
        this.updateContentTitle('tab3ContentH2', 'forging');
        this.updateContentTitle('tab4ContentH2', 'npc');
        this.updateContentTitle('tab5ContentH2', 'Pet');
        this.updateContentTitle('tab6ContentH2', 'Skill Quest');
        this.updateContentTitle('tab7ContentH2', 'objects');
        this.updateContentTitle('tab8ContentH2', 'Enchanting');
        this.updateContentTitle('tab9ContentH2', 'image_sheet');
        this.updateContentTitle('monsterBookContentH2', 'Monster Book');
        this.updateContentTitle('tab10ContentH2', 'Market Price Integration');
        this.updateContentTitle('tab11ContentH2', 'Version Comparison');
        this.updateContentTitle('monsterWorthContentH2', 'monster worth');
        this.updateContentTitle('keyContentH2', 'Key');
        this.updateContentTitle('rareKeyContentH2', 'Rare Key');
        this.updateContentTitle('presentContentH2', 'Present');
        this.updateContentTitle('breedingContentH2', 'Breeding Cost Calculator');
        this.updateContentTitle('recycleContentH2', 'Recycle Cost Calculator');
        this.updateContentTitle('firelordSetContentH2', 'Firelord Set');
        this.updateContentTitle('mosMarketContentH2', 'MOS Market');
    }

    /**
     * 更新單個Tab按鈕的文字
     * @param {string} elementKey - 元素鍵名
     * @param {string} translationKey - 翻譯鍵名
     */
    updateTabButton(elementKey, translationKey) {
        const element = this.getElement(elementKey);
        if (element) {
            element.textContent = i18n.translate(translationKey);
        }
    }

    /**
     * 更新單個內容標題的文字
     * @param {string} elementKey - 元素鍵名
     * @param {string} translationKey - 翻譯鍵名
     */
    updateContentTitle(elementKey, translationKey) {
        const element = this.getElement(elementKey);
        if (element) {
            element.textContent = i18n.translate(translationKey);
        }
    }

    /**
     * 更新市場價格整合功能中的UI文本
     */
    updateGoogleSheetUIText() {
        const googleSheetUrlInput = document.getElementById('google-sheet-url');
        const loadSheetButton = document.getElementById('load-sheet-button');
        const exportCsvButton = document.getElementById('export-csv-button');
        const importCsvButton = document.getElementById('import-csv-button');
        const csvFileInput = document.getElementById('csv-file-input');

        if (googleSheetUrlInput) googleSheetUrlInput.placeholder = i18n.translate('enter_google_sheet_url_or_id');
        if (loadSheetButton) loadSheetButton.textContent = i18n.translate('load_data');
        if (exportCsvButton) exportCsvButton.textContent = i18n.translate('export_as_csv');
        if (importCsvButton) importCsvButton.textContent = i18n.translate('import_csv');
        if (csvFileInput) csvFileInput.setAttribute('accept', '.csv');
    }

    /**
     * 更新版本比較功能中的UI文本
     */
    updateVersionComparisonUIText() {
        const versionALabel = document.querySelector('label[for="versionA-select"]');
        const versionBLabel = document.querySelector('label[for="versionB-select"]');
        const compareVersionsButton = document.getElementById('compare-versions-button');

        if (versionALabel) versionALabel.textContent = i18n.translate('version_a');
        if (versionBLabel) versionBLabel.textContent = i18n.translate('version_b');
        if (compareVersionsButton) compareVersionsButton.textContent = i18n.translate('compare_versions');
    }

    /**
     * 清空所有可清除的表格內容
     */
    clearTableContents() {
        document.querySelectorAll('.clearable-table-content').forEach(content => {
            content.innerHTML = '';
        });
    }

    /**
     * 重新快取所有元素（在DOM結構變更後使用）
     */
    refreshCache() {
        this.cachedElements.clear();
        this.cacheElements();
    }
}