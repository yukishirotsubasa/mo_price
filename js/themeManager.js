// js/themeManager.js - 主題管理器

/**
 * ThemeManager 類別 - 負責管理主題切換功能
 */
export class ThemeManager {
    constructor() {
        this.currentTheme = this.getStoredTheme() || this.getSystemTheme();
        this.init();
    }

    /**
     * 初始化主題管理器
     */
    init() {
        // 應用當前主題
        this.applyTheme(this.currentTheme);
        
        // 創建主題切換按鈕
        this.createThemeToggle();
        
        // 監聽系統主題變化
        this.watchSystemTheme();
    }

    /**
     * 獲取儲存的主題偏好
     * @returns {string|null} 主題名稱或null
     */
    getStoredTheme() {
        return localStorage.getItem('theme');
    }

    /**
     * 獲取系統主題偏好
     * @returns {string} 主題名稱
     */
    getSystemTheme() {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    /**
     * 應用主題
     * @param {string} theme - 主題名稱 ('light' 或 'dark')
     */
    applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        this.currentTheme = theme;
        
        // 儲存主題偏好
        localStorage.setItem('theme', theme);
        
        // 更新主題切換按鈕
        this.updateThemeToggleIcon();
        
        // 觸發主題變更事件
        document.dispatchEvent(new CustomEvent('themeChanged', {
            detail: { theme }
        }));
    }

    /**
     * 切換主題
     */
    toggleTheme() {
        const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        this.applyTheme(newTheme);
    }

    /**
     * 創建主題切換按鈕
     */
    createThemeToggle() {
        // 檢查是否已存在主題切換按鈕
        if (document.querySelector('.theme-toggle')) {
            return;
        }

        const toggleButton = document.createElement('button');
        toggleButton.className = 'theme-toggle';
        toggleButton.setAttribute('aria-label', 'Toggle theme');
        toggleButton.setAttribute('title', 'Switch between light and dark theme');
        
        const icon = document.createElement('span');
        icon.className = 'theme-toggle-icon';
        toggleButton.appendChild(icon);
        
        // 添加點擊事件
        toggleButton.addEventListener('click', () => {
            this.toggleTheme();
        });
        
        // 添加到頁面
        document.body.appendChild(toggleButton);
        
        // 初始化圖標
        this.updateThemeToggleIcon();
    }

    /**
     * 更新主題切換按鈕圖標
     */
    updateThemeToggleIcon() {
        const icon = document.querySelector('.theme-toggle-icon');
        if (!icon) return;
        
        if (this.currentTheme === 'light') {
            icon.innerHTML = '🌙'; // 月亮圖標，表示可以切換到暗色主題
        } else {
            icon.innerHTML = '☀️'; // 太陽圖標，表示可以切換到亮色主題
        }
    }

    /**
     * 監聽系統主題變化
     */
    watchSystemTheme() {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        
        mediaQuery.addEventListener('change', (e) => {
            // 只有在沒有手動設定主題時才跟隨系統主題
            if (!this.getStoredTheme()) {
                const systemTheme = e.matches ? 'dark' : 'light';
                this.applyTheme(systemTheme);
            }
        });
    }

    /**
     * 重置為系統主題
     */
    resetToSystemTheme() {
        localStorage.removeItem('theme');
        const systemTheme = this.getSystemTheme();
        this.applyTheme(systemTheme);
    }

    /**
     * 獲取當前主題
     * @returns {string} 當前主題名稱
     */
    getCurrentTheme() {
        return this.currentTheme;
    }

    /**
     * 檢查是否為暗色主題
     * @returns {boolean} 是否為暗色主題
     */
    isDarkTheme() {
        return this.currentTheme === 'dark';
    }

    /**
     * 檢查是否為亮色主題
     * @returns {boolean} 是否為亮色主題
     */
    isLightTheme() {
        return this.currentTheme === 'light';
    }
}

// 創建全域主題管理器實例
const themeManager = new ThemeManager();

// 將主題管理器作為預設匯出
export default themeManager;