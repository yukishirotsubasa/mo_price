// js/controllers/LanguageController.js - 管理語言切換

import i18n from '../i18n.js';
import { TranslationManager } from '../managers/TranslationManager.js';

/**
 * LanguageController 類別 - 負責管理語言切換相關的邏輯
 */
export class LanguageController {
    constructor(uiController) {
        this.uiController = uiController;
        this.langSelect = null;
        this.initializeLanguageSelector();
    }

    /**
     * 初始化語言選擇器
     */
    async initializeLanguageSelector() {
        // 等待i18n初始化完成
        await i18n.init();

        // 在i18n初始化完成後，初始化TranslationManager
        await TranslationManager.initializeTranslations();

        this.langSelect = document.getElementById('lang-select');
        if (!this.langSelect) {
            console.error("語言選擇器元素未找到。");
            return;
        }

        // 填充語言選擇器
        this.populateLanguageSelector();
        
        // 設定當前選定的語言
        this.langSelect.value = i18n.currentLang;
        
        // 初始更新UI文本
        this.updateAllUIText();

        // 監聽語言切換事件
        this.langSelect.addEventListener('change', async (event) => {
            await this.handleLanguageChange(event.target.value);
        });
    }

    /**
     * 動態填充語言選擇器
     */
    populateLanguageSelector() {
        if (!this.langSelect) return;

        this.langSelect.innerHTML = ''; // 清空現有選項
        
        // 確保 availableLanguages 是陣列且有數據
        if (Array.isArray(i18n.availableLanguages) && i18n.availableLanguages.length > 0) {
            i18n.availableLanguages.forEach(lang => {
                const option = document.createElement('option');
                option.value = lang.code;
                option.textContent = i18n.translateLangName(lang.name); // 翻譯語言名稱
                this.langSelect.appendChild(option);
            });
        } else {
            console.warn("i18n.availableLanguages 為空或不是陣列，無法填充語言選擇器。");
            // 添加預設選項
            const defaultOption = document.createElement('option');
            defaultOption.value = 'en';
            defaultOption.textContent = 'English';
            this.langSelect.appendChild(defaultOption);
        }
    }

    /**
     * 處理語言切換
     * @param {string} newLang - 新的語言代碼
     */
    async handleLanguageChange(newLang) {
        try {
            // 切換語言
            await i18n.setLanguage(newLang);
            
            // 重新初始化TranslationManager以確保翻譯正確載入
            await TranslationManager.initializeTranslations(newLang);
            
            // 重新填充語言選擇器以更新語言名稱翻譯
            this.populateLanguageSelector();
            
            // 設定當前選定的語言 (確保下拉選單顯示正確)
            this.langSelect.value = i18n.currentLang;
            
            // 更新所有UI文本
            this.updateAllUIText();

            // 觸發語言變更事件
            const event = new CustomEvent('languageChanged', {
                detail: { newLanguage: newLang }
            });
            document.dispatchEvent(event);

        } catch (error) {
            console.error("語言切換失敗:", error);
        }
    }

    /**
     * 更新所有UI文本
     */
    updateAllUIText() {
        if (this.uiController) {
            this.uiController.updateTabTitles();
            this.uiController.updateGoogleSheetUIText();
            this.uiController.updateVersionComparisonUIText();
            this.uiController.updateStaticUIText();
        }
    }

    /**
     * 獲取當前語言
     * @returns {string} 當前語言代碼
     */
    getCurrentLanguage() {
        return i18n.currentLang;
    }

    /**
     * 程式化設定語言
     * @param {string} langCode - 語言代碼
     */
    async setLanguage(langCode) {
        if (this.langSelect) {
            this.langSelect.value = langCode;
            await this.handleLanguageChange(langCode);
        }
    }
}