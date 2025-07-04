# MO Price 開發流程指南

## 概述

本指南定義了 MO Price 專案的開發工作流程，確保開發過程的一致性、品質和效率。

## 開發環境設置

### 必要工具
- **Git**: 版本控制
- **現代瀏覽器**: Chrome, Firefox, Safari, Edge（用於測試）
- **代碼編輯器**: 推薦 VS Code
- **本地服務器**: 用於開發測試

### 本地服務器設置
```bash
# 方法1: 使用 Python
python -m http.server 8000

# 方法2: 使用 Node.js
npx serve .

# 方法3: 使用 VS Code Live Server 擴展
```

### 專案結構理解
```
MO Price/
├── index.html              # 主頁面
├── style.css               # 舊版樣式（逐步淘汰）
├── config/                 # 配置檔案
├── css/                    # 模組化 CSS
├── js/                     # JavaScript 模組
├── views/                  # 說明頁面
├── releaseJs/              # ❌ 禁止修改
├── CODING_STANDARDS.md     # 代碼規範
├── DEVELOPMENT_GUIDE.md    # 本指南
└── PROJECT_REFACTORING_PLAN.md # 重構計畫
```

## 開發工作流程

### 1. 開始新工作

#### 1.1 檢查當前狀態
```bash
# 確保在最新版本
git pull origin main

# 檢查工作目錄狀態
git status
```

#### 1.2 建立功能分支（如果需要）
```bash
# 建立並切換到新分支
git checkout -b feature/功能名稱

# 或直接在 main 分支工作（小修改）
```

#### 1.3 確認約束條件
- ✅ 不修改 `/releaseJs/` 資料夾
- ✅ 使用現有真實數據，不建立模擬數據
- ✅ 保持純前端架構
- ✅ 避免需要打包的框架

### 2. 開發過程

#### 2.1 代碼撰寫
- 遵循 `CODING_STANDARDS.md` 中的規範
- 使用 ES6+ 模組系統
- 添加適當的 JSDoc 註解
- 實施錯誤處理

#### 2.2 即時測試
```bash
# 啟動本地服務器
python -m http.server 8000

# 在瀏覽器中測試
# http://localhost:8000
```

#### 2.3 功能驗證清單
每次修改後檢查：
- [ ] 頁面正常載入，無 JavaScript 錯誤
- [ ] 語言切換功能正常
- [ ] 相關表格顯示正確
- [ ] 計算結果準確（如果涉及）
- [ ] 主題切換正常（如果涉及）

### 3. 代碼審查

#### 3.1 自我審查清單
- [ ] **功能性**：功能按預期工作
- [ ] **代碼品質**：遵循代碼規範
- [ ] **效能**：沒有明顯的效能問題
- [ ] **安全性**：沒有安全漏洞
- [ ] **相容性**：在目標瀏覽器中正常工作
- [ ] **文件**：更新相關文件

#### 3.2 代碼審查要點
```javascript
// 檢查點1: 模組匯入是否正確
import { functionName } from './module.js'; // ✅ 正確
// import { functionName } from './module'; // ❌ 缺少 .js

// 檢查點2: 錯誤處理是否完整
try {
    const data = await fetchData();
    return processData(data);
} catch (error) {
    console.error('Error:', error); // ✅ 有錯誤處理
    return null;
}

// 檢查點3: 函數是否有適當註解
/**
 * 計算物品價格
 * @param {Object} item - 物品資料
 * @returns {number} 計算後的價格
 */
function calculatePrice(item) { // ✅ 有 JSDoc 註解
    // 實作
}
```

### 4. 測試流程

#### 4.1 基本功能測試
1. **頁面載入測試**
   - 開啟 `index.html`
   - 檢查控制台無錯誤
   - 確認所有資源正常載入

2. **核心功能測試**
   - 語言切換：測試所有支援語言
   - 頁面切換：測試所有選單項目
   - 數據載入：確認表格正常顯示

3. **計算功能測試**（如果涉及）
   - 鍛造成本計算
   - 木工成本計算
   - 附魔成本計算
   - 分解成本計算

#### 4.2 跨瀏覽器測試
```
測試瀏覽器清單：
- Chrome（最新版本）
- Firefox（最新版本）
- Safari（最新版本）
- Edge（最新版本）
```

#### 4.3 響應式測試
```
測試解析度：
- 手機：375px × 667px
- 平板：768px × 1024px
- 桌面：1920px × 1080px
```

#### 4.4 效能測試
- 頁面載入時間 < 3秒
- 表格渲染時間 < 2秒
- 操作響應時間 < 500ms

### 5. 提交流程

#### 5.1 提交前檢查
```bash
# 檢查修改的檔案
git status

# 檢查具體修改內容
git diff

# 確保沒有意外修改 releaseJs
git diff --name-only | grep releaseJs
# 應該沒有輸出
```

#### 5.2 提交訊息格式
```
類型: 簡短描述（50字以內）

詳細說明（如果需要，72字換行）

範例：
feat: 新增主題切換功能

- 實作 ThemeManager 類別
- 支援亮色和暗色主題
- 主題偏好儲存在 localStorage
- 自動偵測系統主題偏好

fix: 修復表格排序錯誤

修復當數據包含 null 值時排序失敗的問題

docs: 更新開發流程指南

新增代碼審查清單和測試流程說明
```

#### 5.3 提交類型
- `feat`: 新功能
- `fix`: 錯誤修復
- `docs`: 文件更新
- `style`: 代碼格式調整（不影響功能）
- `refactor`: 代碼重構
- `test`: 測試相關
- `chore`: 其他雜項

### 6. 部署流程

#### 6.1 部署前檢查
- [ ] 所有功能測試通過
- [ ] 跨瀏覽器測試通過
- [ ] 沒有控制台錯誤
- [ ] 效能測試通過
- [ ] 代碼審查完成

#### 6.2 GitHub Pages 部署
```bash
# 推送到 main 分支
git push origin main

# GitHub Pages 會自動部署
# 檢查部署狀態：Settings > Pages
```

#### 6.3 部署後驗證
1. 訪問線上版本
2. 執行基本功能測試
3. 檢查所有外部 API 連接正常
4. 確認 HTTPS 正常工作

## 問題處理流程

### 1. 發現問題

#### 1.1 問題記錄模板
```
問題編號: #001
發現時間: 2024-XX-XX
發現者: [姓名]
嚴重程度: [高/中/低]

問題描述:
[詳細描述問題現象]

重現步驟:
1. [步驟1]
2. [步驟2]
3. [步驟3]

預期結果:
[描述預期的正確行為]

實際結果:
[描述實際發生的情況]

環境資訊:
- 瀏覽器: [瀏覽器名稱和版本]
- 作業系統: [作業系統]
- 螢幕解析度: [解析度]

相關檔案:
[列出相關的檔案]
```

#### 1.2 嚴重程度分級
- **高**: 影響核心功能，阻止正常使用
- **中**: 影響部分功能，有替代方案
- **低**: 小問題，不影響主要功能

### 2. 問題分析

#### 2.1 初步分析
1. 檢查瀏覽器控制台錯誤
2. 確認問題是否可重現
3. 識別影響範圍
4. 檢查最近的修改

#### 2.2 根本原因分析
1. 檢查相關代碼
2. 檢查數據流程
3. 檢查外部依賴
4. 檢查環境差異

### 3. 問題修復

#### 3.1 修復流程
1. 建立修復分支（如果需要）
2. 實施修復
3. 本地測試修復效果
4. 回歸測試確保沒有新問題
5. 提交修復

#### 3.2 修復驗證
- [ ] 原問題已解決
- [ ] 沒有引入新問題
- [ ] 相關功能正常
- [ ] 效能沒有下降

## 代碼審查清單

### JavaScript 審查要點
- [ ] **模組匯入**：使用正確的 ES6 匯入語法
- [ ] **命名規範**：遵循 camelCase/PascalCase 規範
- [ ] **錯誤處理**：有適當的 try-catch 處理
- [ ] **異步操作**：使用 async/await 而非 Promise.then
- [ ] **函數註解**：有 JSDoc 註解
- [ ] **單一職責**：函數功能單一明確
- [ ] **變數宣告**：使用 const/let 而非 var
- [ ] **效能考量**：避免不必要的計算和 DOM 操作

### CSS 審查要點
- [ ] **命名規範**：使用 kebab-case
- [ ] **CSS 變數**：優先使用定義的 CSS 變數
- [ ] **響應式**：使用行動優先的方法
- [ ] **屬性順序**：按邏輯分組排列
- [ ] **瀏覽器相容性**：避免使用不支援的屬性
- [ ] **效能**：避免複雜的選擇器

### 檔案組織審查要點
- [ ] **檔案位置**：檔案放在正確的目錄
- [ ] **檔案命名**：遵循命名規範
- [ ] **匯入順序**：按照規定的順序匯入
- [ ] **依賴關係**：避免循環依賴
- [ ] **檔案大小**：避免單一檔案過大

## 效能優化指南

### 1. JavaScript 效能
```javascript
// ✅ 好的做法：批次 DOM 操作
const fragment = document.createDocumentFragment();
items.forEach(item => {
    const element = createItemElement(item);
    fragment.appendChild(element);
});
container.appendChild(fragment);

// ❌ 避免：逐個 DOM 操作
items.forEach(item => {
    const element = createItemElement(item);
    container.appendChild(element); // 每次都觸發重排
});

// ✅ 好的做法：快取 DOM 查詢
const container = document.getElementById('container');
for (let i = 0; i < 100; i++) {
    // 使用快取的 container
}

// ❌ 避免：重複 DOM 查詢
for (let i = 0; i < 100; i++) {
    const container = document.getElementById('container'); // 重複查詢
}
```

### 2. CSS 效能
```css
/* ✅ 好的做法：使用 CSS 變數 */
.button {
    background-color: var(--primary-color);
    transition: background-color var(--transition-normal);
}

/* ❌ 避免：複雜的選擇器 */
.sidebar .menu .item .link:hover .icon {
    /* 過於複雜的選擇器 */
}

/* ✅ 好的做法：簡單的選擇器 */
.menu-link-icon:hover {
    /* 簡單明確的選擇器 */
}
```

### 3. 數據處理效能
```javascript
// ✅ 好的做法：避免不必要的處理
const filteredItems = items.filter(item => item.active);
const processedItems = filteredItems.map(item => processItem(item));

// ❌ 避免：重複處理
const processedItems = items
    .filter(item => item.active)
    .map(item => processItem(item))
    .filter(item => item.processed); // 可能的重複過濾
```

## 安全最佳實踐

### 1. 數據驗證
```javascript
// ✅ 驗證外部數據
function processApiResponse(response) {
    if (!response || typeof response !== 'object') {
        throw new Error('Invalid API response');
    }
    
    if (!Array.isArray(response.data)) {
        throw new Error('API response data is not an array');
    }
    
    return response.data.filter(item => 
        item && 
        typeof item.id === 'number' && 
        typeof item.name === 'string'
    );
}
```

### 2. XSS 防護
```javascript
// ✅ 安全的 HTML 插入
function createSafeElement(text) {
    const element = document.createElement('div');
    element.textContent = text; // 自動轉義
    return element;
}

// ✅ 或使用轉義函數
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ❌ 避免直接插入用戶輸入
element.innerHTML = userInput; // XSS 風險
```

## 總結

遵循本開發流程指南將確保：

1. **一致性**：所有開發者使用相同的工作流程
2. **品質**：通過代碼審查和測試確保代碼品質
3. **效率**：標準化流程提高開發效率
4. **穩定性**：完整的測試流程確保系統穩定
5. **可維護性**：良好的文件和代碼組織提高可維護性

所有開發者都應該熟悉並遵循這個流程，在遇到問題時參考相應的章節。