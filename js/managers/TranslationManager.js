// js/managers/TranslationManager.js
import i18n from '../i18n.js';

export class TranslationManager {
    /**
     * 從檔案載入翻譯數據
     * @param {string} langCode - 語言代碼
     * @returns {Promise<object>} - 翻譯數據物件
     */
    static async loadTranslationsFromFile(langCode) {
        try {
            const response = await fetch(`./translations/ui_translations_${langCode}.json`);
            if (!response.ok) {
                console.warn(`Failed to load translations for ${langCode}: ${response.status}`);
                return {};
            }
            return await response.json();
        } catch (error) {
            console.error(`Error loading translations for ${langCode}:`, error);
            return {};
        }
    }

    /**
     * 初始化翻譯 - 支援多語言
     * @param {string} langCode - 語言代碼，預設為當前語言
     */
    static async initializeTranslations(langCode = i18n.currentLang) {
        // 跳過英文，因為英文直接使用鍵名
        if (langCode === 'en') {
            console.log(`Skipping translation loading for English (${langCode})`);
            return;
        }

        // 檢查該語言的翻譯是否已存在
        if (!i18n.translations[langCode]) {
            console.log(`Translation data for ${langCode} not found in i18n`);
            return;
        }

        console.log(`Loading UI translations for ${langCode}...`);

        // 從檔案載入翻譯
        const fileTranslations = await this.loadTranslationsFromFile(langCode);
        
        if (Object.keys(fileTranslations).length === 0) {
            console.warn(`No translations loaded from file for ${langCode}`);
            return;
        }

        // 將載入的翻譯合併到i18n中
        Object.entries(fileTranslations).forEach(([key, value]) => {
            if (!i18n.translations[langCode][key]) {
                i18n.translations[langCode][key] = value;
            }
        });

        console.log(`Successfully loaded ${Object.keys(fileTranslations).length} UI translations for ${langCode}`);
    }
}