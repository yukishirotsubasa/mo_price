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
        const CACHE_KEY = 'price_data';

        // 1. 檢查 localStorage 中是否存在快取數據，除非強制重新載入
        if (!forceReload) {
            const cachedData = localStorage.getItem(CACHE_KEY);
            if (cachedData) {
                try {
                    const parsedData = JSON.parse(cachedData);
                    const processedCachedData = processRawDataFromLocalStorage(parsedData);
                    console.log("從 localStorage 載入市場價格數據。");
                    resolve(processedCachedData); // 返回處理後的數據
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
            // 只讀取前 4 欄位
            const colCount = Math.min(dataTable.getNumberOfColumns(), 4);
            const rawSheetData = []; // 儲存從 Google Sheet 獲取的原始數據，包括標頭

            // 獲取標題行 (只取前 4 欄位)
            const headers = [];
            for (let i = 0; i < colCount; i++) {
                headers.push(dataTable.getColumnLabel(i));
            }
            rawSheetData.push(headers);

            // 獲取數據行 (只取前 4 欄位)
            for (let i = 0; i < rowCount; i++) {
                const row = [];
                for (let j = 0; j < colCount; j++) {
                    row.push(dataTable.getValue(i, j)); // 將所有值轉換為字符串
                }
                rawSheetData.push(row);
            }

            // 處理原始數據
            const processedData = processRawData(rawSheetData); // processedData 包含 id, market buy, market sell, custom price

            // 將處理後的數據儲存到 localStorage
            saveMarketDataToLocalStorage(processedData);

            resolve(processedData); // 返回處理後的數據
        });
    });
}

/**
 * 處理從 localStorage 載入的原始數據，轉換為所需格式。
 * localStorage 儲存的數據包含 item id, item name, market buy price, market sell price。
 * @param {Array<Array<any>>} rawData - 從 localStorage 載入的原始數據。
 * @returns {Array<Array<any>>} - 處理後的數據，每行包含 [item id, item name, market buy price, market sell price]。
 */
export function processRawDataFromLocalStorage(rawData) {
    const processedData = [];
    console.log("processRawDataFromLocalStorage: 原始數據", rawData);
    for (const row of rawData) {
        if (row.length < 4) {
            console.warn("processRawDataFromLocalStorage: 行數據不足 4 個欄位，跳過。", row);
            continue;
        }

        const id = parseNumericField(row[0]);
        const marketBuy = parseNumericField(row[1]);
        const marketSell = parseNumericField(row[2]);
        const customPrice = parseNumericField(row[3]);

        if (id === null || marketBuy === null || marketSell === null || customPrice === null) {
            console.warn("processRawDataFromLocalStorage: 欄位轉型失敗，跳過。", row);
            continue;
        }

        if (marketBuy === 0 && marketSell === 0 && customPrice === 0) {
            console.warn("processRawDataFromLocalStorage: 後 3 個數字皆為 0，跳過。", row);
            continue;
        }

        processedData.push([id, marketBuy, marketSell, customPrice]);
    }
    return processedData;
}

/**
 * 處理原始數據，過濾無效行並轉換為所需格式。
 * @param {Array<Array<string>>} rawData - 原始的 Google Sheet 或 CSV 數據 (可能包含標頭行)。
 * @returns {Array<Array<any>>} - 處理後的數據，每行包含 [item id, item name, market buy price, market sell price]。
 */
export function processRawData(rawData) {
    const processedData = [];
    console.log("processRawData: 原始數據", rawData);
    for (let i = 0; i < rawData.length; i++) {
        const row = rawData[i];
        // 只考慮前 4 個欄位
        if (row.length < 4) {
            console.warn("processRawData: 行數據不足 4 個欄位，跳過。", row);
            continue; // 行數據不足，跳過
        }

        // 欄位對應：id, market buy, market sell, custom price
        const id = parseNumericField(row[0]);
        const marketBuy = parseNumericField(row[1]);
        const marketSell = parseNumericField(row[2]);
        const customPrice = parseNumericField(row[3]);

        // 嘗試轉型為數字，如轉型失敗捨棄該行
        if (id === null || marketBuy === null || marketSell === null || customPrice === null) {
            console.warn("processRawData: 欄位轉型失敗，跳過。", row);
            continue; // 轉型失敗，視為無效行
        }

        // 轉型後如後 3 個數字皆為 0 捨棄該行 (market buy, market sell, custom price)
        if (marketBuy === 0 && marketSell === 0 && customPrice === 0) {
            console.warn("processRawData: 後 3 個數字皆為 0，跳過。", row);
            continue; // 後 3 個數字皆為 0，視為無效行
        }

        // 只保留 id, market buy, market sell, custom price 這四個欄位
        processedData.push([id, marketBuy, marketSell, customPrice]);
    }
    return processedData;
}

/**
 * 將市場價格數據儲存到 localStorage。
 * localStorage 應儲存一個二維陣列，其中包含 item id, item name, market buy price 和 market sell price。
 * 不儲存標頭行。
 * @param {Array<Array<any>>} marketData - 處理後的市場價格數據。
 */
export function saveMarketDataToLocalStorage(marketData) {
    const CACHE_KEY = 'price_data'; // 將鍵名設定為 price_data
    // 儲存 id, market buy, market sell, custom price 這四個欄位
    const dataToStore = marketData.map(row => [row[0], row[1], row[2], row[3]]);
    try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(dataToStore));
        //console.log("市場價格數據已儲存到 localStorage。");
    } catch (e) {
        console.error("儲存數據到 localStorage 失敗。", e);
    }
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
            //console.log(`JS 檔案 ${filePath} 載入完成。`);
            // 添加一個小的延遲，確保全域變數完全可用
            setTimeout(() => {
                if (window[variableName]) {
                    //console.log(`從 ${filePath} 提取變數 ${variableName}:`, window[variableName]);
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

/**
 * 輔助函數：將欄位內容轉型為數字。
 * - 如果內容為空字串，轉型為 0。
 * - 如果內容非空但無法轉型為有效數字，返回 null。
 * @param {string} value - 欄位原始字串內容。
 * @returns {number|null} - 轉型後的數字或 null。
 */
function parseNumericField(value) {
    if (value === '' || value === null) {
        return 0;
    }
    const num = Number(value);
    if (isNaN(num)) {
        return null;
    }
    return num;
}