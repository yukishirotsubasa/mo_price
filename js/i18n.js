// js/i18n.js
const i18n = {
    currentLang: 'en', // 預設語言，將在 init 中從 localStorage 或瀏覽器設定載入
    translations: {},
    langNames: {}, // 用於翻譯語言名稱本身
    availableLanguages: [],

    /**
     * 從遠端 URL 載入 JSON 數據。
     * @param {string} url - JSON 數據的 URL。
     * @returns {Promise<object>} - 載入的 JSON 數據。
     */
    async fetchJson(url) {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status} from ${url}`);
            }
            return await response.json();
        } catch (error) {
            console.error(`Error fetching JSON from ${url}:`, error);
            return {};
        }
    },

    /**
     * 載入可用的語言列表。
     */
    async loadLanguages() {
        const url = 'https://rpg-us2.mo.ee/languages';
        const languagesObject = await this.fetchJson(url);
        // 將物件轉換為陣列，以便於遍歷
        if (languagesObject && typeof languagesObject === 'object') {
            this.availableLanguages = Object.keys(languagesObject).map(code => ({
                code: code,
                name: languagesObject[code].name // 假設值是語言名稱
            }));
        } else {
            this.availableLanguages = []; // 如果獲取到的不是物件，則設置為空陣列
            console.warn('Fetched languages data is not an object:', languagesObject);
        }
    },

    /**
     * 載入指定語言的翻譯數據。
     * @param {string} langCode - 語言代碼 (例如 'zh-tw')。
     */
    async loadTranslation(langCode) {
        const langUrl = `https://data.mo.ee/lang/lang_${langCode}.json`;
        const langNamesUrl = `https://data.mo.ee/lang/lang_names_${langCode}.json`;

        const [langData, langNamesData] = await Promise.all([
            this.fetchJson(langUrl),
            this.fetchJson(langNamesUrl)
        ]);

        // 扁平化 langData 和 langNamesData，將所有翻譯鍵提升到頂層
        const flattenedTranslations = {};
        for (const category in langData) {
            if (langData.hasOwnProperty(category)) {
                Object.assign(flattenedTranslations, langData[category]);
            }
        }
        for (const category in langNamesData) {
            if (langNamesData.hasOwnProperty(category)) {
                Object.assign(flattenedTranslations, langNamesData[category]);
            }
        }

        this.translations[langCode] = flattenedTranslations;
        this.langNames[langCode] = langNamesData; // langNames 仍然用於翻譯語言名稱本身
    },

    /**
     * 設定當前語言並載入對應的翻譯數據。
     * @param {string} langCode - 要設定的語言代碼。
     */
    async setLanguage(langCode) {
        // 儲存選擇的語言到 localStorage
        localStorage.setItem('selectedLanguage', langCode);

        // 如果語言是英文，則不載入翻譯檔案
        if (langCode === 'en') {
            this.currentLang = langCode;
        } else if (!this.translations[langCode]) {
            await this.loadTranslation(langCode);
            this.currentLang = langCode;
        } else {
            this.currentLang = langCode;
        }
        // 在這裡觸發 UI 重新渲染的事件或回調
        document.dispatchEvent(new CustomEvent('languageChanged', { detail: langCode }));
    },

    /**
     * 根據當前語言和提供的鍵獲取翻譯後的字串。
     * 支援參數替換 (例如: translate('hello_name', 'World') -> 'Hello, World!')。
     * @param {string} key - 翻譯鍵。
     * @param {...any} args - 用於替換翻譯字串中的佔位符的參數。
     * @returns {string} - 翻譯後的字串，如果找不到則返回鍵本身。
     */
    translate: (key, ...args) => {
        // 如果當前語言是英文 (en)，則直接返回原始鍵，不進行翻譯
        if (i18n.currentLang === 'en') {
            return key;
        }

        const translation = i18n.translations[i18n.currentLang]?.[key];
        if (translation === undefined) {
            //console.warn(`Translation key "${key}" not found for language "${i18n.currentLang}"`);
            return key; // 如果找不到翻譯，返回鍵本身
        }

        // 處理參數替換，例如 {0}, {1}
        let result = translation;
        args.forEach((arg, index) => {
            result = result.replace(new RegExp(`\\{${index}\\}`, 'g'), arg);
        });
        return result;
    },

    /**
     * 翻譯語言名稱本身。
     * @param {string} langCode - 要翻譯的語言代碼 (例如 'zh-tw')。
     * @returns {string} - 翻譯後的語言名稱，如果找不到則返回語言代碼本身。
     */
    translateLangName: (langCode) => {
        return i18n.langNames[i18n.currentLang]?.[langCode] || langCode;
    },

    /**
     * 初始化 i18n 模組。
     * 載入可用語言列表和預設語言的翻譯。
     */
    async init() {
        await this.loadLanguages();
        // 嘗試從 localStorage 載入上次選擇的語言
        const storedLang = localStorage.getItem('selectedLanguage');
        if (storedLang) {
            this.currentLang = storedLang;
        } else {
            // 如果沒有儲存的語言，嘗試獲取瀏覽器語言
            const browserLang = navigator.language || navigator.userLanguage;
            // 檢查瀏覽器語言是否在可用語言列表中
            const availableLangCodes = this.availableLanguages.map(lang => lang.code);
            if (browserLang && availableLangCodes.includes(browserLang.toLowerCase())) {
                this.currentLang = browserLang.toLowerCase();
            } else if (browserLang && availableLangCodes.includes(browserLang.split('-')[0].toLowerCase())) {
                // 如果瀏覽器語言是 'en-US' 但只有 'en' 可用，則使用 'en'
                this.currentLang = browserLang.split('-')[0].toLowerCase();
            } else {
                this.currentLang = 'en'; // 預設為英文
            }
        }
        await this.setLanguage(this.currentLang); // 載入設定的語言的翻譯
    }
};

// 將 i18n 物件作為預設匯出，以便其他模組可以使用 ES 模組導入
export default i18n;