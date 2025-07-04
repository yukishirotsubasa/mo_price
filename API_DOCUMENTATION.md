# MO Price API 文件

## 概述

本文件記錄了 MO Price 專案中所有公開函數和類別的 API 介面，提供開發者參考和使用指南。

## 核心模組

### 數據載入模組 (dataLoader.js)

#### `loadData()`
載入所有必要的遊戲數據。

```javascript
async function loadData()
```

**返回值**: `Promise<void>`

**使用範例**:
```javascript
try {
    await loadData();
    console.log('數據載入完成');
} catch (error) {
    console.error('數據載入失敗:', error);
}
```

#### `getItemBase()`
獲取物品基礎數據。

```javascript
function getItemBase()
```

**返回值**: `Array<Object>` - 物品數據陣列

**使用範例**:
```javascript
const items = getItemBase();
console.log('物品數量:', items.length);
```

#### `loadGoogleSheetData(sheetUrl)`
從 Google Sheet 載入市場價格數據。

```javascript
async function loadGoogleSheetData(sheetUrl)
```

**參數**:
- `sheetUrl` (string): Google Sheet 的 URL 或 ID

**返回值**: `Promise<Array<Object>>` - 載入的數據陣列

**使用範例**:
```javascript
const sheetUrl = 'https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID';
try {
    const data = await loadGoogleSheetData(sheetUrl);
    console.log('載入的數據:', data);
} catch (error) {
    console.error('載入失敗:', error);
}
```

### 國際化模組 (i18n.js)

#### `translate(key, ...args)`
翻譯指定的鍵值。

```javascript
function translate(key, ...args)
```

**參數**:
- `key` (string): 翻譯鍵
- `...args` (any[]): 用於替換的參數

**返回值**: `string` - 翻譯後的文字

**使用範例**:
```javascript
// 基本翻譯
const text = i18n.translate('item_name');

// 帶參數的翻譯
const greeting = i18n.translate('hello_user', 'John');
```

#### `setLanguage(langCode)`
設定當前語言。

```javascript
async function setLanguage(langCode)
```

**參數**:
- `langCode` (string): 語言代碼 (例如: 'zh-tw', 'en')

**返回值**: `Promise<void>`

**使用範例**:
```javascript
await i18n.setLanguage('zh-tw');
```

### 工具函數模組 (utils.js)

#### `formatNumberWithThousandsSeparator(number)`
格式化數字，添加千位分隔符。

```javascript
function formatNumberWithThousandsSeparator(number)
```

**參數**:
- `number` (number): 要格式化的數字

**返回值**: `string` - 格式化後的字串

**使用範例**:
```javascript
const formatted = formatNumberWithThousandsSeparator(1234567);
console.log(formatted); // "1,234,567"
```

#### `createItemNameMap(items)`
建立物品名稱對應表。

```javascript
function createItemNameMap(items)
```

**參數**:
- `items` (Array<Object>): 物品數據陣列

**返回值**: `Map<string, Object>` - 名稱到物品的對應表

**使用範例**:
```javascript
const items = getItemBase();
const nameMap = createItemNameMap(items);
const item = nameMap.get('物品名稱');
```

## 控制器類別

### TabController

管理頁面切換邏輯的控制器。

#### 建構子
```javascript
new TabController()
```

#### `switchTab(button)`
切換到指定的頁籤。

```javascript
async switchTab(button)
```

**參數**:
- `button` (HTMLElement): 被點擊的頁籤按鈕

**返回值**: `Promise<void>`

#### `activateTab(tabName)`
程式化切換到指定頁籤。

```javascript
async activateTab(tabName)
```

**參數**:
- `tabName` (string): 頁籤名稱

**返回值**: `Promise<void>`

**使用範例**:
```javascript
const tabController = new TabController();
await tabController.activateTab('item-table');
```

### UIController

管理 UI 元素更新的控制器。

#### 建構子
```javascript
new UIController()
```

#### `updateUI()`
更新整個 UI 介面。

```javascript
updateUI()
```

**返回值**: `void`

### LanguageController

管理語言切換的控制器。

#### 建構子
```javascript
new LanguageController()
```

#### `initLanguageSelector()`
初始化語言選擇器。

```javascript
async initLanguageSelector()
```

**返回值**: `Promise<void>`

## 渲染器類別

### TableRenderer

統一的表格渲染器。

#### 建構子
```javascript
new TableRenderer()
```

#### `renderBasicTable(containerId, data, headers, rowMapper, options)`
渲染基本表格。

```javascript
renderBasicTable(containerId, data, headers, rowMapper, options = {})
```

**參數**:
- `containerId` (string): 容器元素的 ID
- `data` (Array): 表格數據
- `headers` (Array<string>): 表格標題
- `rowMapper` (Function): 行數據映射函數
- `options` (Object): 渲染選項

**返回值**: `void`

**使用範例**:
```javascript
const renderer = new TableRenderer();
renderer.renderBasicTable(
    'table-container',
    items,
    ['ID', '名稱', '價格'],
    (item) => [item.id, item.name, item.price]
);
```

#### `formatNumber(value)`
格式化數字顯示。

```javascript
formatNumber(value)
```

**參數**:
- `value` (number): 數值

**返回值**: `string` - 格式化後的字串

### CostTableRenderer

成本計算表格專用渲染器。

#### 建構子
```javascript
new CostTableRenderer()
```

#### `renderCostTable(containerId, costData, options)`
渲染成本計算表格。

```javascript
renderCostTable(containerId, costData, options = {})
```

**參數**:
- `containerId` (string): 容器元素的 ID
- `costData` (Array): 成本數據
- `options` (Object): 渲染選項

**返回值**: `void`

## 錯誤處理系統

### ErrorHandler

統一的錯誤處理器。

#### `logApiError(url, error, context)`
記錄 API 錯誤。

```javascript
logApiError(url, error, context = {})
```

**參數**:
- `url` (string): API URL
- `error` (Error): 錯誤物件
- `context` (Object): 額外上下文資訊

**返回值**: `Object` - 錯誤物件

**使用範例**:
```javascript
try {
    const response = await fetch(apiUrl);
    if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
    }
} catch (error) {
    errorHandler.logApiError(apiUrl, error, { operation: 'loadData' });
}
```

#### `logDataError(operation, error, data)`
記錄數據處理錯誤。

```javascript
logDataError(operation, error, data = null)
```

**參數**:
- `operation` (string): 操作名稱
- `error` (Error): 錯誤物件
- `data` (any): 相關數據

**返回值**: `Object` - 錯誤物件

#### `getErrorStats()`
獲取錯誤統計。

```javascript
getErrorStats()
```

**返回值**: `Object` - 錯誤統計資訊

**使用範例**:
```javascript
const stats = errorHandler.getErrorStats();
console.log('總錯誤數:', stats.total);
console.log('按類型統計:', stats.byType);
```

## 主題管理系統

### ThemeManager

主題切換管理器。

#### `toggleTheme()`
切換主題。

```javascript
toggleTheme()
```

**返回值**: `void`

#### `applyTheme(theme)`
應用指定主題。

```javascript
applyTheme(theme)
```

**參數**:
- `theme` (string): 主題名稱 ('light' 或 'dark')

**返回值**: `void`

**使用範例**:
```javascript
themeManager.applyTheme('dark');
```

#### `getCurrentTheme()`
獲取當前主題。

```javascript
getCurrentTheme()
```

**返回值**: `string` - 當前主題名稱

## 成本計算模組

### 鍛造成本計算 (forgingCost.js)

#### `generateForgingCostTableData(itemData, marketPrices)`
生成鍛造成本表格數據。

```javascript
function generateForgingCostTableData(itemData, marketPrices)
```

**參數**:
- `itemData` (Array): 物品數據
- `marketPrices` (Array): 市場價格數據

**返回值**: `Array<Object>` - 成本計算結果

### 木工成本計算 (carpentryCost.js)

#### `generateCarpentryCostTableData(carpentryData, marketPrices)`
生成木工成本表格數據。

```javascript
function generateCarpentryCostTableData(carpentryData, marketPrices)
```

**參數**:
- `carpentryData` (Array): 木工數據
- `marketPrices` (Array): 市場價格數據

**返回值**: `Array<Object>` - 成本計算結果

### 附魔成本計算 (enchantCost.js)

#### `generateEnchantCostTableData(enchantData, marketPrices)`
生成附魔成本表格數據。

```javascript
function generateEnchantCostTableData(enchantData, marketPrices)
```

**參數**:
- `enchantData` (Array): 附魔數據
- `marketPrices` (Array): 市場價格數據

**返回值**: `Array<Object>` - 成本計算結果

## 表格生成器

### 物品表格生成器 (itemTable.js)

#### `generateItemTable(containerId, itemData, options)`
生成物品表格。

```javascript
function generateItemTable(containerId, itemData, options = {})
```

**參數**:
- `containerId` (string): 容器元素的 ID
- `itemData` (Array): 物品數據
- `options` (Object): 生成選項

**返回值**: `void`

### NPC 表格生成器 (npcTable.js)

#### `generateNpcTable(containerId, npcData, options)`
生成 NPC 表格。

```javascript
function generateNpcTable(containerId, npcData, options = {})
```

**參數**:
- `containerId` (string): 容器元素的 ID
- `npcData` (Array): NPC 數據
- `options` (Object): 生成選項

**返回值**: `void`

## 事件系統

### EventManager

統一的事件管理器。

#### `addEventListener(element, event, handler)`
添加事件監聽器。

```javascript
addEventListener(element, event, handler)
```

**參數**:
- `element` (HTMLElement): 目標元素
- `event` (string): 事件類型
- `handler` (Function): 事件處理函數

**返回值**: `void`

#### `removeEventListener(element, event, handler)`
移除事件監聽器。

```javascript
removeEventListener(element, event, handler)
```

**參數**:
- `element` (HTMLElement): 目標元素
- `event` (string): 事件類型
- `handler` (Function): 事件處理函數

**返回值**: `void`

## 價格編輯器

### 價格編輯器 (priceEditor.js)

#### `initPriceEditor()`
初始化價格編輯器。

```javascript
function initPriceEditor()
```

**返回值**: `void`

#### `editPrice(itemId, newPrice)`
編輯物品價格。

```javascript
function editPrice(itemId, newPrice)
```

**參數**:
- `itemId` (number): 物品 ID
- `newPrice` (number): 新價格

**返回值**: `boolean` - 是否編輯成功

## 常見使用模式

### 1. 載入和顯示數據
```javascript
// 載入數據
await loadData();

// 獲取物品數據
const items = getItemBase();

// 渲染表格
const renderer = new TableRenderer();
renderer.renderBasicTable(
    'item-container',
    items,
    ['ID', '名稱', '價格'],
    (item) => [item.b_i, item.name, item.params?.price || 0]
);
```

### 2. 錯誤處理
```javascript
try {
    const data = await loadGoogleSheetData(sheetUrl);
    processData(data);
} catch (error) {
    errorHandler.logApiError(sheetUrl, error, { 
        operation: 'loadMarketData' 
    });
}
```

### 3. 語言切換
```javascript
// 切換語言
await i18n.setLanguage('zh-tw');

// 翻譯文字
const translatedText = i18n.translate('item_name');
```

### 4. 主題切換
```javascript
// 切換主題
themeManager.toggleTheme();

// 或直接設定主題
themeManager.applyTheme('dark');
```

## 配置選項

### 表格渲染選項
```javascript
const options = {
    tableClass: 'custom-table',     // 自訂表格 CSS 類別
    emptyMessage: '沒有數據',        // 空數據時的訊息
    sortable: true,                 // 是否可排序
    filterable: true,               // 是否可篩選
    pageSize: 50                    // 每頁顯示數量
};
```

### 錯誤處理選項
```javascript
// 停用錯誤處理
errorHandler.setEnabled(false);

// 清除錯誤日誌
errorHandler.clearErrorLog();

// 匯出錯誤日誌
const logData = errorHandler.exportErrorLog();
```

## 注意事項

1. **異步操作**: 所有數據載入操作都是異步的，需要使用 `await` 或 `.then()`
2. **錯誤處理**: 建議在所有可能出錯的地方使用 try-catch 並調用錯誤處理器
3. **記憶體管理**: 使用完事件監聽器後記得移除，避免記憶體洩漏
4. **國際化**: 所有用戶可見的文字都應該通過 i18n.translate() 處理
5. **主題支援**: 新增的 UI 組件應該支援亮色和暗色主題

## 版本資訊

- **API 版本**: 1.0
- **最後更新**: 2024年12月19日
- **相容性**: 支援現代瀏覽器 (Chrome, Firefox, Safari, Edge)