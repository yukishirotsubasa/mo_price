// js/dataLoader.js - 負責載入外部 JS 檔案

let _itemBase = null;
let _forgeFormulas = null;
let _carpentryFormulas = null;
let _npcBase = null;
let _pets = null;
let _skillQuest = null;
let _objectBase = null;
let _forge = null; // 新增 _forge 變數
let _imageSheet = null;

export function loadData() {
    return new Promise(async (resolve, reject) => {
        const jsFilePath = 'releaseJs/release_2025_0417.js'; // 主要的 JS 檔案路徑

        try {
            // 載入所有需要的變數
            _itemBase = await loadJsFileVariable(jsFilePath, 'item_base');
            _forgeFormulas = await loadJsFileVariable(jsFilePath, 'FORGE_FORMULAS');
            _carpentryFormulas = await loadJsFileVariable(jsFilePath, 'CARPENTRY_FORMULAS');
            _npcBase = await loadJsFileVariable(jsFilePath, 'npc_base');
            _pets = await loadJsFileVariable(jsFilePath, 'pets');
            _skillQuest = await loadJsFileVariable(jsFilePath, 'SkillQuest');
            _objectBase = await loadJsFileVariable(jsFilePath, 'object_base');
            _forge = await loadJsFileVariable(jsFilePath, 'Forge');
            _imageSheet = await loadJsFileVariable(jsFilePath, 'IMAGE_SHEET');

            resolve({
                itemBase: _itemBase,
                FORGE_FORMULAS: _forgeFormulas,
                CARPENTRY_FORMULAS: _carpentryFormulas,
                npcBase: _npcBase,
                pets: _pets,
                skillQuest: _skillQuest,
                objectBase: _objectBase,
                forge: _forge,
                imageSheet: _imageSheet
            });
        } catch (error) {
            console.error("數據載入失敗:", error);
            reject(error);
        }
    });
}

// 提供 getter 函數，以便其他模組可以獲取數據
export function getItemBase() {
    return _itemBase;
}

export function getForgeFormulas() {
    return _forgeFormulas;
}

export function getCarpentryFormulas() {
    return _carpentryFormulas;
}

export function getNpcBase() {
    return _npcBase;
}

export function getPets() {
    return _pets;
}

export function getSkillQuest() {
    return _skillQuest;
}

export function getObjectBase() {
    return _objectBase;
}

export function getEnchantingChances() {
    return _forge; // 返回 Forge 物件，因為 enchantingChances 在其中
}

export function getImageSheet() {
    return _imageSheet;
}

/**
 * 從 Google Sheet 載入數據。
 * @param {string} urlOrId - Google Sheet 的 URL 或 ID。
 * @param {string} [sheetName=''] - 工作表名稱 (可選)。
 * @returns {Promise<Array<Array<string>>>} - 解析後的 Google Sheet 數據 (陣列的陣列)。
 */
export function loadGoogleSheetData(urlOrId, sheetName = '', forceReload = false) {
    return new Promise((resolve, reject) => {
        const CACHE_KEY = 'marketPricesCache';

        // 1. 檢查 localStorage 中是否存在快取數據，除非強制重新載入
        if (!forceReload) {
            const cachedData = localStorage.getItem(CACHE_KEY);
            if (cachedData) {
                try {
                    const parsedData = JSON.parse(cachedData);
                    console.log("從 localStorage 載入市場價格數據。");
                    resolve(parsedData);
                    return;
                } catch (e) {
                    console.error("解析 localStorage 中的快取數據失敗，將重新載入。", e);
                    // 如果解析失敗，則繼續從 Google Sheet 載入
                }
            }
        }

        // 在 main.js 中已經確保 Google Charts Library 載入完成，這裡不再檢查

        let spreadsheetId;
        // 嘗試從 URL 中解析 spreadsheetId
        const urlMatch = urlOrId.match(/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
        if (urlMatch) {
            spreadsheetId = urlMatch[1];
        } else {
            // 如果不是 URL，則假設是 ID
            spreadsheetId = urlOrId;
        }

        if (!spreadsheetId) {
            reject(new Error("無效的 Google Sheet URL 或 ID。"));
            return;
        }

        // 預設工作表名稱為 'Sheet1'，如果使用者沒有提供
        const actualSheetName = sheetName || 'Sheet1';

        const query = new google.visualization.Query(
            `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?sheet=${encodeURIComponent(actualSheetName)}`
        );

        query.send(response => {
            if (response.isError()) {
                console.error('Google Charts Query Error: ' + response.getMessage());
                reject(new Error('Google Charts Query Error: ' + response.getMessage()));
                return;
            }

            const dataTable = response.getDataTable();
            const rowCount = dataTable.getNumberOfRows();
            const colCount = dataTable.getNumberOfColumns();
            const resultData = [];

            // 獲取標題行
            const headers = [];
            for (let i = 0; i < colCount; i++) {
                headers.push(dataTable.getColumnLabel(i));
            }
            resultData.push(headers);

            // 獲取數據行
            for (let i = 0; i < rowCount; i++) {
                const row = [];
                for (let j = 0; j < colCount; j++) {
                    row.push(String(dataTable.getValue(i, j))); // 將所有值轉換為字符串
                }
                resultData.push(row);
            }

            // 2. 將解析後的數據儲存到 localStorage
            try {
                localStorage.setItem(CACHE_KEY, JSON.stringify(resultData));
                console.log("市場價格數據已儲存到 localStorage。");
            } catch (e) {
                console.error("儲存數據到 localStorage 失敗。", e);
            }

            resolve(resultData);
        });
    });
}

/**
 * 載入指定的 JS 檔案並從中提取一個全域變數。
 * @param {string} filePath - JS 檔案的路徑。
 * @param {string} variableName - 要提取的全域變數名稱。
 * @returns {Promise<any>} - 包含提取到的變數值的 Promise。
 */
export function loadJsFileVariable(filePath, variableName) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = filePath;
        script.onload = () => {
            console.log(`JS 檔案 ${filePath} 載入完成。`);
            // 添加一個小的延遲，確保全域變數完全可用
            setTimeout(() => {
                if (window[variableName]) {
                    console.log(`從 ${filePath} 提取變數 ${variableName}:`, window[variableName]);
                    resolve(window[variableName]);
                } else {
                    console.error(`變數 ${variableName} 在 ${filePath} 中未找到。`);
                    reject(new Error(`變數 ${variableName} 在 ${filePath} 中未找到。`));
                }
                document.head.removeChild(script); // 清理 DOM
            }, 50); // 50 毫秒延遲
        };
        script.onerror = () => {
            reject(new Error(`載入 JS 檔案失敗: ${filePath}`));
            document.head.removeChild(script); // 清理 DOM
        };
        document.head.appendChild(script);
    });
}