# MO Price 代碼規範

## 概述

本文件定義了 MO Price 專案的代碼規範，確保代碼品質、一致性和可維護性。所有開發者都應遵循這些規範。

## JavaScript 編碼規範

### 模組系統
- **使用 ES6+ 模組系統**
```javascript
// 正確：使用 import/export
import { functionName } from './module.js';
export default className;

// 錯誤：使用 CommonJS
const module = require('./module');
module.exports = className;
```

### 命名規範
- **變數和函數**：使用 camelCase
```javascript
// 正確
const itemBaseData = [];
function calculateCost() {}

// 錯誤
const item_base_data = [];
function calculate_cost() {}
```

- **類別**：使用 PascalCase
```javascript
// 正確
class TableRenderer {}
class UIController {}

// 錯誤
class tableRenderer {}
class uiController {}
```

- **常數**：使用 UPPER_SNAKE_CASE
```javascript
// 正確
const MAX_ITEMS_PER_PAGE = 100;
const API_BASE_URL = 'https://data.mo.ee/';

// 錯誤
const maxItemsPerPage = 100;
const apiBaseUrl = 'https://data.mo.ee/';
```

- **檔案名稱**：使用 camelCase，類別檔案使用 PascalCase
```javascript
// 正確
utils.js
dataLoader.js
TableRenderer.js
UIController.js

// 錯誤
Utils.js
data_loader.js
table-renderer.js
```

### 函數規範
- **使用 async/await 處理異步操作**
```javascript
// 正確
async function loadData() {
    try {
        const response = await fetch(url);
        return await response.json();
    } catch (error) {
        console.error('載入數據失敗:', error);
        throw error;
    }
}

// 錯誤
function loadData() {
    return fetch(url)
        .then(response => response.json())
        .catch(error => {
            console.error('載入數據失敗:', error);
        });
}
```

- **函數應該單一職責**
```javascript
// 正確：功能單一
function formatPrice(price) {
    return formatNumberWithThousandsSeparator(price);
}

function validatePrice(price) {
    return typeof price === 'number' && price >= 0;
}

// 錯誤：功能混雜
function formatAndValidatePrice(price) {
    if (typeof price !== 'number' || price < 0) {
        throw new Error('Invalid price');
    }
    return formatNumberWithThousandsSeparator(price);
}
```

### 錯誤處理
- **必須使用 try-catch 處理可能的錯誤**
```javascript
// 正確
async function fetchData(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error(`Error fetching data from ${url}:`, error);
        return null; // 或適當的預設值
    }
}

// 錯誤：沒有錯誤處理
async function fetchData(url) {
    const response = await fetch(url);
    return await response.json();
}
```

### 註解規範
- **使用 JSDoc 格式為函數添加註解**
```javascript
/**
 * 計算鍛造成本
 * @param {Object} item - 物品資料
 * @param {number} item.basePrice - 基礎價格
 * @param {number} quantity - 數量
 * @returns {number} 總成本
 */
function calculateForgingCost(item, quantity) {
    return item.basePrice * quantity;
}
```

- **複雜邏輯添加說明註解**
```javascript
// 計算附魔成功率，考慮物品等級和附魔石品質
const successRate = Math.min(
    baseRate * (1 + itemLevel * 0.1) * stoneQuality,
    0.95 // 最大成功率限制為95%
);
```

### 變數宣告
- **使用 const 和 let，避免 var**
```javascript
// 正確
const API_URL = 'https://data.mo.ee/';
let currentData = [];

// 錯誤
var API_URL = 'https://data.mo.ee/';
var currentData = [];
```

- **在使用前宣告變數**
```javascript
// 正確
const itemData = getItemData();
processItemData(itemData);

// 錯誤
processItemData(itemData);
const itemData = getItemData();
```

## CSS 編碼規範

### 選擇器命名
- **使用 kebab-case**
```css
/* 正確 */
.data-table {}
.sidebar-menu {}
.tab-content {}

/* 錯誤 */
.dataTable {}
.sidebar_menu {}
.tabContent {}
```

### CSS 變數使用
- **優先使用 CSS 變數**
```css
/* 正確：使用定義的變數 */
.button {
    background-color: var(--primary-color);
    padding: var(--spacing-md);
    border-radius: var(--border-radius-md);
}

/* 錯誤：硬編碼值 */
.button {
    background-color: #333;
    padding: 15px;
    border-radius: 5px;
}
```

### 屬性順序
- **按邏輯分組排列 CSS 屬性**
```css
.example {
    /* 定位 */
    position: relative;
    top: 0;
    left: 0;
    
    /* 盒模型 */
    display: flex;
    width: 100%;
    height: auto;
    margin: 0;
    padding: var(--spacing-md);
    
    /* 視覺 */
    background-color: var(--surface-color);
    border: 1px solid var(--border-color);
    border-radius: var(--border-radius-md);
    
    /* 字體 */
    font-size: var(--font-size-base);
    color: var(--text-color);
    
    /* 其他 */
    transition: all var(--transition-normal);
}
```

### 響應式設計
- **使用行動優先的方法**
```css
/* 正確：行動優先 */
.container {
    padding: var(--spacing-sm);
}

@media (min-width: 768px) {
    .container {
        padding: var(--spacing-lg);
    }
}

/* 錯誤：桌面優先 */
.container {
    padding: var(--spacing-lg);
}

@media (max-width: 767px) {
    .container {
        padding: var(--spacing-sm);
    }
}
```

## 檔案組織規範

### 目錄結構
```
js/
├── controllers/     # 控制器（業務邏輯）
├── renderers/       # 渲染器（視圖邏輯）
├── core/           # 核心系統組件
├── tableGenerators/ # 表格生成器
└── *.js            # 其他模組

css/
├── base.css        # 基礎樣式和變數
├── layout.css      # 佈局樣式
├── components.css  # 組件樣式
├── themes.css      # 主題樣式
└── overrides.css   # 覆蓋樣式
```

### 檔案命名
- **JavaScript 檔案**：功能描述 + 類型
  - `dataLoader.js` - 功能模組
  - `TableRenderer.js` - 類別檔案
  - `utils.js` - 工具函數

- **CSS 檔案**：功能描述
  - `base.css` - 基礎樣式
  - `components.css` - 組件樣式

### 匯入順序
```javascript
// 1. 外部函式庫（如果有）
import externalLib from 'external-lib';

// 2. 核心模組
import { EventManager } from './core/EventManager.js';

// 3. 控制器
import { TabController } from './controllers/TabController.js';

// 4. 渲染器
import { TableRenderer } from './renderers/TableRenderer.js';

// 5. 工具函數
import { formatNumber } from './utils.js';

// 6. 配置和數據
import config from '../config/item_base_config.json';
```

## 效能規範

### DOM 操作
- **批次處理 DOM 操作**
```javascript
// 正確：使用 DocumentFragment
const fragment = document.createDocumentFragment();
items.forEach(item => {
    const element = createItemElement(item);
    fragment.appendChild(element);
});
container.appendChild(fragment);

// 錯誤：逐個添加
items.forEach(item => {
    const element = createItemElement(item);
    container.appendChild(element); // 每次都觸發重排
});
```

### 記憶體管理
- **移除事件監聽器**
```javascript
// 正確：清理事件監聽器
function cleanup() {
    element.removeEventListener('click', handleClick);
}

// 錯誤：沒有清理
function cleanup() {
    // 沒有移除事件監聽器，可能造成記憶體洩漏
}
```

### 數據處理
- **避免不必要的數據複製**
```javascript
// 正確：直接處理
function processItems(items) {
    return items.filter(item => item.active)
                .map(item => ({ ...item, processed: true }));
}

// 錯誤：不必要的複製
function processItems(items) {
    const copy = JSON.parse(JSON.stringify(items)); // 不必要的深拷貝
    return copy.filter(item => item.active)
               .map(item => ({ ...item, processed: true }));
}
```

## 安全規範

### 數據驗證
- **驗證外部數據**
```javascript
// 正確：驗證數據
function processApiData(data) {
    if (!data || typeof data !== 'object') {
        console.warn('Invalid API data received');
        return [];
    }
    
    if (!Array.isArray(data.items)) {
        console.warn('API data.items is not an array');
        return [];
    }
    
    return data.items.filter(item => 
        item && typeof item.id === 'number' && typeof item.name === 'string'
    );
}

// 錯誤：直接使用
function processApiData(data) {
    return data.items.map(item => item.name); // 可能出錯
}
```

### XSS 防護
- **避免直接插入 HTML**
```javascript
// 正確：使用 textContent
element.textContent = userInput;

// 或使用安全的 HTML 建構
const safeHTML = `<span>${escapeHtml(userInput)}</span>`;

// 錯誤：直接插入
element.innerHTML = userInput; // XSS 風險
```

## 測試規範

### 手動測試
- **每次修改後測試核心功能**
  1. 頁面載入正常
  2. 語言切換功能
  3. 表格顯示正確
  4. 計算結果準確
  5. 無 JavaScript 錯誤

### 瀏覽器相容性
- **測試目標瀏覽器**
  - Chrome (最新版本)
  - Firefox (最新版本)
  - Safari (最新版本)
  - Edge (最新版本)

## 版本控制規範

### 提交訊息格式
```
類型: 簡短描述

詳細說明（如果需要）

範例：
feat: 新增主題切換功能
fix: 修復表格排序錯誤
docs: 更新 API 文件
style: 統一按鈕樣式
refactor: 重構數據載入邏輯
```

### 分支策略
- **main**: 穩定版本
- **develop**: 開發版本
- **feature/功能名稱**: 功能開發分支

## 部署規範

### GitHub Pages 要求
- **所有路徑使用相對路徑**
- **檔案大小限制**：單檔 < 100MB
- **支援 HTTPS**：所有外部 API 必須支援 HTTPS
- **靜態檔案**：不使用服務器端處理

### 效能優化
- **最小化 HTTP 請求**
- **使用適當的快取策略**
- **優化圖片和資源大小**

## 總結

遵循這些代碼規範將確保：
1. **代碼一致性**：所有開發者使用相同的風格
2. **可維護性**：代碼易於理解和修改
3. **效能**：遵循最佳實踐確保良好效能
4. **安全性**：避免常見的安全問題
5. **相容性**：確保在目標環境中正常運作

所有開發者都應該熟悉並遵循這些規範，在代碼審查時也應該檢查是否符合這些標準。