# MO Price 設計系統

## 概述

本設計系統為 MO Price 專案建立了統一的視覺風格和組件規範，確保整個應用程式的一致性和可維護性。

## 顏色系統

### 主要顏色
```css
/* 亮色主題 */
--primary-color: #333;           /* 主要色彩 - 深灰色 */
--secondary-color: #575757;      /* 次要色彩 - 中灰色 */
--background-color: #f4f4f4;     /* 背景色 - 淺灰色 */
--surface-color: #ffffff;        /* 表面色 - 白色 */
--text-color: #333;              /* 主要文字色 */
--text-secondary: #666;          /* 次要文字色 */
--border-color: #ddd;            /* 邊框色 */
--hover-color: #f0f0f0;          /* 懸停色 */
```

### 功能性顏色
```css
/* 狀態顏色 */
--success-color: #22c55e;        /* 成功 - 綠色 */
--error-color: #ef4444;          /* 錯誤 - 紅色 */
--warning-color: #f59e0b;        /* 警告 - 橙色 */
--info-color: #3b82f6;           /* 資訊 - 藍色 */

/* 按鈕專用顏色 */
--button-primary: #007bff;       /* 主要按鈕 - 藍色 */
--button-hover: #e3f2fd;         /* 按鈕懸停背景 */
```

### 暗色主題
```css
/* 暗色主題覆蓋 */
--primary-color: #2d2d2d;
--secondary-color: #404040;
--background-color: #1a1a1a;
--surface-color: #2d2d2d;
--text-color: #ffffff;
--text-secondary: #cccccc;
--border-color: #404040;
--hover-color: #404040;
```

## 間距系統

### 間距變數
```css
--spacing-xs: 5px;               /* 極小間距 */
--spacing-sm: 10px;              /* 小間距 */
--spacing-md: 15px;              /* 中等間距 */
--spacing-lg: 20px;              /* 大間距 */
--spacing-xl: 30px;              /* 極大間距 */
```

### 使用指南
- **xs (5px)**: 元素內部微調、圖標間距
- **sm (10px)**: 按鈕內邊距、小元素間距
- **md (15px)**: 一般元素間距、表格內邊距
- **lg (20px)**: 區塊間距、頁面內邊距
- **xl (30px)**: 大區塊間距、標題下方間距

## 字體系統

### 字體族
```css
--font-family: Arial, sans-serif; /* 主要字體 */
```

### 字體大小
```css
--font-size-sm: 0.8em;           /* 小字體 - 12.8px */
--font-size-base: 1em;           /* 基礎字體 - 16px */
--font-size-lg: 1.2em;           /* 大字體 - 19.2px */
--font-size-xl: 1.5em;           /* 特大字體 - 24px */
```

### 使用指南
- **sm**: 輔助文字、標籤、註解
- **base**: 正文內容、按鈕文字
- **lg**: 小標題、重要資訊
- **xl**: 主標題、頁面標題

## 邊框和陰影

### 邊框半徑
```css
--border-radius-sm: 3px;         /* 小圓角 */
--border-radius-md: 5px;         /* 中等圓角 */
--border-radius-lg: 8px;         /* 大圓角 */
```

### 陰影系統
```css
--shadow-sm: 0 1px 3px var(--shadow-color);      /* 輕微陰影 */
--shadow-md: 0 2px 5px var(--shadow-color);      /* 中等陰影 */
--shadow-lg: 0 4px 10px var(--shadow-color);     /* 明顯陰影 */
--shadow-color: rgba(0,0,0,0.1);                 /* 陰影顏色 */
```

## 動畫和轉場

### 轉場時間
```css
--transition-fast: 0.2s ease;    /* 快速轉場 */
--transition-normal: 0.3s ease;  /* 標準轉場 */
--transition-slow: 0.5s ease;    /* 慢速轉場 */
```

### 使用指南
- **fast**: 按鈕懸停、小元素變化
- **normal**: 頁面切換、模態框顯示
- **slow**: 大區塊動畫、載入效果

## 組件規範

### 按鈕組件

#### 基礎按鈕樣式
```css
.btn {
    padding: 8px 16px;
    border: 2px solid #007bff;
    border-radius: 4px;
    background-color: white;
    color: #007bff;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s ease;
    white-space: nowrap;
}
```

#### 按鈕狀態
- **Normal**: 白色背景 + 藍色邊框和文字
- **Hover**: 淡藍色背景 + 輕微上移效果
- **Active**: 藍色背景 + 白色文字
- **Focus**: 藍色外框陰影
- **Disabled**: 透明度60% + 禁用游標

#### 按鈕變體
- **刪除按鈕**: 紅色邊框和文字 `#dc3545`
- **保存按鈕**: 綠色邊框和文字 `#28a745`
- **Active狀態**: 對應顏色的背景 + 白色文字

### 表格組件

#### 基礎表格樣式
```css
.data-table {
    width: 100%;
    border-collapse: collapse;
    background-color: var(--surface-color);
    border-radius: var(--border-radius-md);
    box-shadow: var(--shadow-sm);
    margin-bottom: var(--spacing-lg);
}
```

#### 表格元素
- **表頭**: 深色背景 + 白色文字 + 粗體
- **表格行**: 交替背景色 + 懸停效果
- **邊框**: 統一的邊框顏色和樣式

#### 表格變體
- **data-table**: 一般數據表格
- **cost-table**: 成本計算表格
- **market-data-table**: 市場數據表格
- **breeding-table**: 繁殖表格

### 表單組件

#### 輸入框樣式
```css
.form-input {
    padding: var(--spacing-sm);
    border: 1px solid var(--border-color);
    border-radius: var(--border-radius-md);
    background-color: var(--surface-color);
    color: var(--text-color);
}
```

#### 表單狀態
- **Normal**: 標準邊框和背景
- **Focus**: 主色邊框 + 外框陰影
- **Error**: 紅色邊框
- **Disabled**: 灰色背景 + 禁用樣式

### 卡片組件

#### 基礎卡片
```css
.card {
    background-color: var(--surface-color);
    border-radius: var(--border-radius-lg);
    box-shadow: var(--shadow-sm);
    padding: var(--spacing-lg);
}
```

#### 卡片元素
- **標題**: 大字體 + 底部邊框
- **內容**: 標準文字樣式
- **懸停**: 增強陰影效果

### 摺疊組件

#### 摺疊標題
```css
.collapsible-header {
    cursor: pointer;
    padding: var(--spacing-sm);
    background-color: var(--hover-color);
    border: 1px solid var(--border-color);
    border-radius: var(--border-radius-md);
}
```

#### 摺疊狀態
- **展開**: 向下箭頭 `▼`
- **收合**: 向右箭頭 `▶`
- **內容**: 顯示/隱藏切換

## 佈局系統

### 主要佈局
- **Sidebar**: 固定寬度250px + 深色背景
- **Main Content**: 彈性寬度 + 淺色背景
- **響應式**: 768px以下切換為垂直佈局

### 網格系統
```css
.grid-2 { grid-template-columns: repeat(2, 1fr); }
.grid-3 { grid-template-columns: repeat(3, 1fr); }
.grid-4 { grid-template-columns: repeat(4, 1fr); }
```

### Flexbox工具
```css
.flex { display: flex; }
.flex-center { justify-content: center; align-items: center; }
.flex-between { justify-content: space-between; }
```

## 主題系統

### 主題切換
- **亮色主題**: 預設主題，適合日間使用
- **暗色主題**: 深色背景，適合夜間使用
- **系統偏好**: 自動檢測系統主題設定

### 主題實作
```javascript
// 主題管理器
const themeManager = new ThemeManager();
themeManager.setLanguage('dark'); // 切換到暗色主題
```

## 響應式設計

### 斷點
- **Desktop**: > 768px
- **Tablet**: 768px - 480px
- **Mobile**: < 480px

### 響應式規則
- 768px以下：側邊欄變為頂部導航
- 480px以下：減少內邊距和字體大小
- 網格系統自動變為單列

## 無障礙設計

### 顏色對比
- 文字對比度 ≥ 4.5:1
- 大文字對比度 ≥ 3:1
- 支援高對比度模式

### 鍵盤導航
- 所有互動元素支援Tab導航
- Focus狀態清晰可見
- 支援Enter和Space鍵操作

### 螢幕閱讀器
- 語義化HTML結構
- 適當的ARIA標籤
- 有意義的alt文字

## 使用指南

### 新增組件時
1. 使用設計系統中定義的顏色變數
2. 遵循間距系統規範
3. 確保響應式相容性
4. 測試主題切換功能
5. 驗證無障礙性

### 修改現有組件時
1. 檢查是否影響其他組件
2. 保持設計系統一致性
3. 更新相關文件
4. 進行跨瀏覽器測試

### 開發最佳實踐
1. 優先使用CSS變數而非硬編碼值
2. 遵循BEM命名規範
3. 保持CSS模組化
4. 定期檢查設計系統合規性

## 維護和更新

### 版本控制
- 設計系統變更需要版本記錄
- 重大變更需要遷移指南
- 保持向後相容性

### 文件更新
- 新增組件時更新此文件
- 定期檢查範例的準確性
- 收集使用者反饋並改進
