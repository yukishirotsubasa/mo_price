# MO Price 故障排除指南

## 概述

本指南提供了 MO Price 專案常見問題的診斷和解決方案，幫助開發者和用戶快速解決遇到的問題。

## 常見問題分類

### 🚨 緊急問題 (影響核心功能)

#### 問題1: 頁面完全無法載入
**症狀**: 白屏或顯示錯誤訊息，無任何內容

**可能原因**:
- JavaScript 模組載入失敗
- 網路連接問題
- 瀏覽器不支援 ES6 模組

**診斷步驟**:
1. 開啟瀏覽器開發者工具 (F12)
2. 檢查 Console 標籤是否有錯誤訊息
3. 檢查 Network 標籤是否有載入失敗的檔案

**解決方案**:
```javascript
// 檢查瀏覽器支援
if (!window.fetch) {
    alert('您的瀏覽器不支援此應用程式，請使用現代瀏覽器');
}

// 檢查模組載入
try {
    import('./js/main.js');
} catch (error) {
    console.error('模組載入失敗:', error);
}
```

**預防措施**:
- 確保使用支援 ES6 的現代瀏覽器
- 檢查網路連接穩定性
- 定期更新瀏覽器版本

#### 問題2: 數據載入失敗
**症狀**: 表格顯示空白或錯誤訊息

**可能原因**:
- releaseJs 檔案路徑錯誤
- 外部 API 無法訪問
- 數據格式變更

**診斷步驟**:
1. 檢查 Console 是否有 "數據載入失敗" 錯誤
2. 確認 releaseJs 檔案是否存在
3. 檢查網路請求是否成功

**解決方案**:
```javascript
// 檢查檔案是否存在
async function checkFileExists(filePath) {
    try {
        const response = await fetch(filePath, { method: 'HEAD' });
        return response.ok;
    } catch (error) {
        console.error(`檔案不存在: ${filePath}`);
        return false;
    }
}

// 使用降級數據
if (!await checkFileExists('releaseJs/release_2025_0417.js')) {
    console.warn('使用備用數據檔案');
    // 載入備用檔案
}
```

### ⚠️ 中等問題 (影響部分功能)

#### 問題3: 語言切換無效
**症狀**: 點擊語言選擇器後介面沒有變化

**可能原因**:
- 翻譯檔案載入失敗
- i18n 模組初始化錯誤
- 語言代碼不正確

**診斷步驟**:
1. 檢查 Console 是否有翻譯相關錯誤
2. 確認 i18n.currentLang 是否正確設定
3. 檢查翻譯檔案是否成功載入

**解決方案**:
```javascript
// 檢查 i18n 狀態
console.log('當前語言:', i18n.currentLang);
console.log('可用語言:', i18n.availableLanguages);
console.log('翻譯數據:', i18n.translations);

// 手動重新載入翻譯
try {
    await i18n.setLanguage('zh-tw');
    console.log('語言設定成功');
} catch (error) {
    console.error('語言設定失敗:', error);
}
```

#### 問題4: 表格顯示異常
**症狀**: 表格格式錯亂、數據缺失或排序錯誤

**可能原因**:
- CSS 樣式衝突
- 數據格式不正確
- 表格生成器邏輯錯誤

**診斷步驟**:
1. 檢查 Console 是否有表格相關錯誤
2. 檢查 Elements 標籤中的 HTML 結構
3. 確認數據格式是否正確

**解決方案**:
```javascript
// 檢查數據格式
function validateTableData(data) {
    if (!Array.isArray(data)) {
        console.error('表格數據必須是陣列');
        return false;
    }
    
    if (data.length === 0) {
        console.warn('表格數據為空');
        return false;
    }
    
    return true;
}

// 重新渲染表格
function forceReloadTable(containerId) {
    const container = document.getElementById(containerId);
    if (container) {
        container.innerHTML = '';
        // 重新生成表格
    }
}
```

#### 問題5: 主題切換失效
**症狀**: 點擊主題切換按鈕後樣式沒有變化

**可能原因**:
- CSS 變數未正確定義
- ThemeManager 初始化失敗
- localStorage 權限問題

**診斷步驟**:
1. 檢查 `data-theme` 屬性是否正確設定
2. 確認 CSS 變數是否正確載入
3. 檢查 localStorage 是否可用

**解決方案**:
```javascript
// 檢查主題系統
function debugThemeSystem() {
    console.log('當前主題:', themeManager.getCurrentTheme());
    console.log('HTML data-theme:', document.documentElement.getAttribute('data-theme'));
    
    // 檢查 CSS 變數
    const styles = getComputedStyle(document.documentElement);
    console.log('主要顏色:', styles.getPropertyValue('--primary-color'));
}

// 手動設定主題
themeManager.applyTheme('dark');
```

### 💡 輕微問題 (不影響主要功能)

#### 問題6: 市場價格數據同步問題
**症狀**: Google Sheets 數據無法正確載入或同步

**可能原因**:
- Google Sheets 權限設定錯誤
- 數據格式不符合要求
- 網路連接問題

**診斷步驟**:
1. 確認 Google Sheets 是否設為公開可檢視
2. 檢查數據格式是否正確
3. 測試 Google Charts API 是否可用

**解決方案**:
```javascript
// 檢查 Google Charts API
if (typeof google === 'undefined' || !google.charts) {
    console.error('Google Charts API 未載入');
    // 重新載入 API
    const script = document.createElement('script');
    script.src = 'https://www.gstatic.com/charts/loader.js';
    document.head.appendChild(script);
}

// 驗證 Google Sheets URL
function validateGoogleSheetsUrl(url) {
    const pattern = /spreadsheets\/d\/([a-zA-Z0-9-_]+)/;
    return pattern.test(url);
}
```

#### 問題7: 計算結果不正確
**症狀**: 成本計算或價值評估結果與預期不符

**可能原因**:
- 公式邏輯錯誤
- 數據精度問題
- 市場價格數據過期

**診斷步驟**:
1. 檢查計算公式是否正確
2. 確認輸入數據的準確性
3. 驗證市場價格數據是否最新

**解決方案**:
```javascript
// 調試計算過程
function debugCalculation(formula, inputs) {
    console.group('計算調試');
    console.log('公式:', formula);
    console.log('輸入:', inputs);
    
    const result = calculateCost(formula, inputs);
    console.log('結果:', result);
    console.groupEnd();
    
    return result;
}

// 驗證數字精度
function roundToDecimal(number, decimals = 2) {
    return Math.round(number * Math.pow(10, decimals)) / Math.pow(10, decimals);
}
```

## 錯誤代碼參考

### ERR_001: 模組載入失敗
**描述**: ES6 模組無法載入
**解決方案**: 檢查檔案路徑和瀏覽器支援

### ERR_002: 數據格式錯誤
**描述**: API 返回的數據格式不正確
**解決方案**: 檢查數據來源和格式驗證

### ERR_003: 權限拒絕
**描述**: 無法訪問 localStorage 或外部資源
**解決方案**: 檢查瀏覽器設定和權限

### ERR_004: 網路連接失敗
**描述**: 無法連接到外部 API
**解決方案**: 檢查網路連接和 API 狀態

### ERR_005: 瀏覽器不支援
**描述**: 瀏覽器不支援所需功能
**解決方案**: 升級瀏覽器或使用相容版本

## 診斷工具

### 內建診斷功能

#### 錯誤日誌檢查
```javascript
// 檢查錯誤統計
const errorStats = errorHandler.getErrorStats();
console.table(errorStats.byType);
console.table(errorStats.bySeverity);

// 匯出錯誤日誌
const errorLog = errorHandler.exportErrorLog();
console.log(errorLog);
```

#### 系統狀態檢查
```javascript
// 檢查系統狀態
function systemHealthCheck() {
    const health = {
        dataLoaded: Object.keys(allData).length > 0,
        i18nReady: i18n.currentLang !== null,
        themeManager: themeManager.getCurrentTheme() !== null,
        errorHandler: errorHandler.isEnabled,
        localStorage: typeof Storage !== 'undefined'
    };
    
    console.table(health);
    return health;
}
```

#### 效能監控
```javascript
// 監控載入時間
console.time('頁面載入');
// ... 載入邏輯
console.timeEnd('頁面載入');

// 監控記憶體使用
if (performance.memory) {
    console.log('記憶體使用:', {
        used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024) + 'MB',
        total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024) + 'MB'
    });
}
```

### 外部診斷工具

#### 瀏覽器開發者工具
1. **Console**: 檢查錯誤訊息和警告
2. **Network**: 監控網路請求和響應
3. **Elements**: 檢查 DOM 結構和樣式
4. **Application**: 檢查 localStorage 和快取
5. **Performance**: 分析效能瓶頸

#### 線上工具
- [Can I Use](https://caniuse.com/): 檢查瀏覽器支援
- [GTmetrix](https://gtmetrix.com/): 效能分析
- [W3C Validator](https://validator.w3.org/): HTML 驗證

## 效能問題

### 載入速度慢

#### 症狀
- 頁面載入時間超過 5 秒
- 表格渲染緩慢
- 操作響應延遲

#### 診斷
```javascript
// 測量載入時間
const loadStart = performance.now();
await loadData();
const loadEnd = performance.now();
console.log(`數據載入時間: ${loadEnd - loadStart}ms`);

// 檢查檔案大小
fetch('releaseJs/release_2025_0417.js', { method: 'HEAD' })
    .then(response => {
        const size = response.headers.get('content-length');
        console.log(`檔案大小: ${Math.round(size / 1024)}KB`);
    });
```

#### 解決方案
1. **優化數據載入**:
   ```javascript
   // 使用 Promise.all 並行載入
   const [itemBase, forgeFormulas] = await Promise.all([
       loadJsFileVariable(jsFilePath, 'item_base'),
       loadJsFileVariable(jsFilePath, 'FORGE_FORMULAS')
   ]);
   ```

2. **實施懶載入**:
   ```javascript
   // 只在需要時載入表格數據
   async function loadTableOnDemand(tabName) {
       if (!tableDataCache[tabName]) {
           tableDataCache[tabName] = await loadTableData(tabName);
       }
       return tableDataCache[tabName];
   }
   ```

3. **優化 DOM 操作**:
   ```javascript
   // 使用 DocumentFragment 批次操作
   const fragment = document.createDocumentFragment();
   items.forEach(item => {
       const element = createItemElement(item);
       fragment.appendChild(element);
   });
   container.appendChild(fragment);
   ```

### 記憶體洩漏

#### 症狀
- 長時間使用後頁面變慢
- 瀏覽器記憶體使用量持續增加
- 頁面最終崩潰

#### 診斷
```javascript
// 監控記憶體使用
setInterval(() => {
    if (performance.memory) {
        const used = performance.memory.usedJSHeapSize;
        const total = performance.memory.totalJSHeapSize;
        console.log(`記憶體: ${Math.round(used/1024/1024)}MB / ${Math.round(total/1024/1024)}MB`);
    }
}, 5000);
```

#### 解決方案
1. **清理事件監聽器**:
   ```javascript
   // 移除不需要的監聽器
   function cleanup() {
       element.removeEventListener('click', handler);
       clearInterval(intervalId);
   }
   ```

2. **避免循環引用**:
   ```javascript
   // 使用 WeakMap 避免循環引用
   const elementData = new WeakMap();
   elementData.set(element, data);
   ```

## 相容性問題

### 瀏覽器支援

#### 支援的瀏覽器
- Chrome 61+
- Firefox 60+
- Safari 11+
- Edge 16+

#### 不支援的功能
- Internet Explorer (所有版本)
- 舊版 Android 瀏覽器 (< 4.4)

#### 檢測和降級
```javascript
// 功能檢測
function checkBrowserSupport() {
    const features = {
        es6Modules: 'noModule' in HTMLScriptElement.prototype,
        fetch: 'fetch' in window,
        promises: 'Promise' in window,
        localStorage: 'localStorage' in window
    };
    
    const unsupported = Object.entries(features)
        .filter(([name, supported]) => !supported)
        .map(([name]) => name);
    
    if (unsupported.length > 0) {
        alert(`您的瀏覽器不支援以下功能: ${unsupported.join(', ')}`);
        return false;
    }
    
    return true;
}
```

### 行動裝置問題

#### 常見問題
- 觸控操作不響應
- 表格在小螢幕上顯示異常
- 效能問題

#### 解決方案
```css
/* 改善觸控體驗 */
.touch-target {
    min-height: 44px;
    min-width: 44px;
    touch-action: manipulation;
}

/* 響應式表格 */
@media (max-width: 768px) {
    .data-table {
        font-size: 14px;
        overflow-x: auto;
    }
}
```

## 數據問題

### 數據不一致

#### 症狀
- 不同頁面顯示的數據不同
- 計算結果前後不一致
- 快取數據與實際數據不符

#### 診斷
```javascript
// 檢查數據一致性
function validateDataConsistency() {
    const itemCount1 = allData.itemBase?.length || 0;
    const itemCount2 = getItemBase()?.length || 0;
    
    if (itemCount1 !== itemCount2) {
        console.error('數據不一致:', { itemCount1, itemCount2 });
        return false;
    }
    
    return true;
}
```

#### 解決方案
1. **清除快取**:
   ```javascript
   // 清除所有快取數據
   localStorage.clear();
   location.reload();
   ```

2. **強制重新載入**:
   ```javascript
   // 強制重新載入數據
   allData = {};
   await loadData();
   ```

### 數據格式錯誤

#### 症狀
- 表格顯示 "undefined" 或空值
- 計算結果為 NaN
- 類型錯誤

#### 診斷
```javascript
// 驗證數據格式
function validateDataFormat(data, expectedFields) {
    if (!Array.isArray(data)) {
        console.error('數據必須是陣列');
        return false;
    }
    
    const sample = data[0];
    const missingFields = expectedFields.filter(field => !(field in sample));
    
    if (missingFields.length > 0) {
        console.error('缺少必要欄位:', missingFields);
        return false;
    }
    
    return true;
}
```

## 聯繫支援

### 回報問題

當遇到無法解決的問題時，請提供以下資訊：

1. **環境資訊**:
   - 瀏覽器名稱和版本
   - 作業系統
   - 螢幕解析度

2. **問題描述**:
   - 具體的錯誤訊息
   - 重現步驟
   - 預期結果 vs 實際結果

3. **診斷資訊**:
   ```javascript
   // 收集診斷資訊
   const diagnosticInfo = {
       userAgent: navigator.userAgent,
       url: window.location.href,
       timestamp: new Date().toISOString(),
       errorLog: errorHandler.exportErrorLog(),
       systemHealth: systemHealthCheck()
   };
   
   console.log('診斷資訊:', JSON.stringify(diagnosticInfo, null, 2));
   ```

### 緊急聯繫

對於影響核心功能的緊急問題：
1. 立即檢查 Console 錯誤訊息
2. 嘗試重新整理頁面
3. 清除瀏覽器快取和 localStorage
4. 使用不同瀏覽器測試

### 預防措施

1. **定期備份**:
   - 匯出重要的市場價格數據
   - 記錄自訂設定

2. **保持更新**:
   - 使用最新版本的瀏覽器
   - 定期檢查專案更新

3. **監控**:
   - 定期檢查錯誤日誌
   - 監控系統效能

這份故障排除指南涵蓋了 MO Price 專案的常見問題和解決方案。遇到問題時，請先參考相應的章節，按照診斷步驟進行排查，並嘗試提供的解決方案。