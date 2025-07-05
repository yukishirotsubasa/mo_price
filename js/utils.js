// js/utils.js - 存放通用的輔助函數

/**
 * 從 item_base 創建 item_id 到 item_name 的映射表。
 * @param {Array} itemBase - 物品基礎資料陣列。
 * @param {Function} translateFunction - i18n.translate 函數。
 * @returns {Map<number, string>} - item_id 到 item_name 的映射表。
 */
export function createItemNameMap(itemBase, translateFunction) {
    const itemNameMap = new Map();
    if (typeof itemBase !== 'undefined' && Array.isArray(itemBase)) {
        itemBase.forEach(item => {
            if (item.b_i !== undefined && item.name !== undefined) {
               // 直接將原始名稱傳遞給翻譯函數
                // 嘗試翻譯物品名稱，如果沒有翻譯則使用原始名稱
                const translatedName = translateFunction(item.name);
                itemNameMap.set(item.b_i, translatedName);
            }
        });
    } else {
        console.warn("item_base 未定義或不是陣列，無法建立 itemNameMap。");
    }
    return itemNameMap;
}

/**
 * 生成物品圖片 HTML
 * @param {number} itemId - 物品 ID
 * @param {Array} itemBase - 物品基礎數據
 * @param {Object} imageSheet - 圖片表數據
 * @param {Function} translateFunction - 翻譯函數
 * @returns {string} - 圖片 HTML 或 fallback 文字
 */
export function generateItemImage(itemId, itemBase, imageSheet, translateFunction) {
    // 查找物品數據
    const item = Array.isArray(itemBase) 
        ? itemBase.find(item => item.b_i === itemId)
        : itemBase[itemId];
    
    if (!item) {
        return `<span class="item-fallback" title="${translateFunction('unknown_item')}">[${itemId}]</span>`;
    }
    
    // 檢查是否有圖片數據
    if (!item.img) {
        const itemName = translateFunction(item.name);
        return `<span class="item-fallback" title="${itemName}">${itemName}</span>`;
    }
    
    const { sheet, x, y } = item.img;
    
    // 檢查圖片表是否存在
    if (!imageSheet || !imageSheet[sheet]) {
        const itemName = translateFunction(item.name);
        return `<span class="item-fallback" title="${itemName}">${itemName}</span>`;
    }
    
    const sheetInfo = imageSheet[sheet];
    const tileWidth = sheetInfo.tile_width || 32;
    const tileHeight = sheetInfo.tile_height || 32;
    
    // 計算背景位置
    const backgroundX = -(x * tileWidth);
    const backgroundY = -(y * tileHeight);
    
    const itemName = translateFunction(item.name);
    
    return `<div class="item-image" 
                 title="${itemName}"
                 data-item-id="${itemId}"
                 style="
                     background-image: url('${sheetInfo.url.toLowerCase()}');
                     background-position: ${backgroundX}px ${backgroundY}px;
                     width: ${tileWidth}px;
                     height: ${tileHeight}px;
                     display: inline-block;
                     background-repeat: no-repeat;
                     border: 1px solid #ddd;
                     margin: 1px;
                     cursor: pointer;
                     vertical-align: middle;
                 ">
            </div>`;
}

/**
 * 統一的物品顯示內容獲取函數
 * @param {number} itemId - 物品 ID
 * @param {Array} itemBase - 物品基礎數據
 * @param {Function} translateFunction - 翻譯函數
 * @param {string} displayType - 顯示類型 ('name' 或 'image')
 * @param {Object} imageSheet - 圖片表數據 (當 displayType 為 'image' 時需要)
 * @returns {string} - 顯示內容
 */
export function getItemDisplayContent(itemId, itemBase, translateFunction, displayType = 'name', imageSheet = null) {
    if (displayType === 'name') {
        // 使用現有的 createItemNameMap 邏輯
        const item = Array.isArray(itemBase) 
            ? itemBase.find(item => item.b_i === itemId)
            : itemBase[itemId];
        
        if (!item) {
            return translateFunction('unknown_item');
        }
        
        return translateFunction(item.name);
    } else if (displayType === 'image') {
        if (!imageSheet) {
            console.warn('imageSheet is required for image display type');
            return getItemDisplayContent(itemId, itemBase, translateFunction, 'name');
        }
        return generateItemImage(itemId, itemBase, imageSheet, translateFunction);
    }
    
    console.warn(`Unknown display type: ${displayType}`);
    return getItemDisplayContent(itemId, itemBase, translateFunction, 'name');
}

/**
 * 生成通用的 HTML 表格。
 * @param {Array<string>} headerKeys - 表格的標題鍵陣列 (用於 i18n 翻譯)。
 * @param {Array<Object>} data - 表格的資料陣列。
 * @param {Function} rowMapper - 將資料物件映射為表格行資料的函數。
 * @param {Function} translateFunction - i18n.translate 函數。
 * @returns {string} - 生成的 HTML 表格字串。
 */
export function generateTableHTML(headerKeys, data, rowMapper, translateFunction, customRowRendering = false) {
    let tableHTML = '<table><thead><tr>';
    headerKeys.forEach(key => {
        tableHTML += `<th>${translateFunction(key)}</th>`;
    });
    tableHTML += '</tr></thead><tbody>';

    if (customRowRendering) {
        data.forEach((item, index) => {
            tableHTML += rowMapper(item, index); // rowMapper is expected to return a full HTML string for the row(s)
        });
    } else {
        data.forEach((item, index) => {
            tableHTML += '<tr>';
            const rowData = rowMapper(item, index);
            if (Array.isArray(rowData)) {
                rowData.forEach(cell => {
                    tableHTML += `<td>${cell}</td>`;
                });
            }
            tableHTML += '</tr>';
        });
    }

    tableHTML += '</tbody></table>';
    return tableHTML;
}

/**
 * 比較兩個版本的數據物件，找出新增、刪除和修改的條目。
 * 假設每個物件都有一個唯一的 ID 屬性（例如 'id' 或 'name'）。
 *
 * @param {Array<Object>} dataA - 版本 A 的數據陣列。
 * @param {Array<Object>} dataB - 版本 B 的數據陣列。
 * @param {string} idKey - 用於識別唯一條目的屬性名稱（例如 'id' 或 'name'）。
 * @returns {Object} - 包含 added, removed, modified 陣列的結果物件。
 */
export function compareData(dataA, dataB, idKey) {
    const result = {
        added: [],
        removed: [],
        modified: []
    };

    const mapA = new Map(dataA.map(item => [item[idKey], item]));
    const mapB = new Map(dataB.map(item => [item[idKey], item]));

    // 找出新增和修改的條目 (在 B 中存在)
    for (const [id, itemB] of mapB.entries()) {
        if (!mapA.has(id)) {
            result.added.push(itemB);
        } else {
            const itemA = mapA.get(id);
            // 比較內容是否不同
            if (JSON.stringify(itemA) !== JSON.stringify(itemB)) {
                const changes = {};
                let hasChanges = false;
                for (const key in itemB) {
                    if (itemB.hasOwnProperty(key)) {
                        if (!itemA.hasOwnProperty(key)) {
                            changes[key] = { old: undefined, new: itemB[key] };
                            hasChanges = true;
                        } else if (itemA[key] !== itemB[key]) {
                            changes[key] = { old: itemA[key], new: itemB[key] };
                            hasChanges = true;
                        }
                    }
                }
                // 檢查是否有屬性在 A 中但不在 B 中 (表示屬性被刪除)
                for (const key in itemA) {
                    if (itemA.hasOwnProperty(key) && !itemB.hasOwnProperty(key)) {
                        changes[key] = { old: itemA[key], new: undefined };
                        hasChanges = true;
                    }
                }
                if (hasChanges) {
                    result.modified.push({
                        id: id,
                        itemA: itemA,
                        itemB: itemB,
                        changes: changes
                    });
                }
            }
        }
    }

    // 找出刪除的條目 (在 A 中存在但不在 B 中)
    for (const [id, itemA] of mapA.entries()) {
        if (!mapB.has(id)) {
            result.removed.push(itemA);
        }
    }

    return result;
}
/**
 * 取得物品出售價格。
 * @param {number|string} item_id - 物品ID。
 * @param {Array<Object>} itemBase - 物品基礎數據。
 * @returns {number} 物品出售價格。
 */
export function getItemSellPrice(item_id, itemBase) {
    // 確保 item_id 是數字格式
    const numericItemId = typeof item_id === 'string' ? parseInt(item_id) : item_id;
    let price_data = localStorage.getItem('price_data');
    if (price_data) {
        try {
            price_data = JSON.parse(price_data);
            const row = price_data.find(row => parseInt(row[0]) === numericItemId); // 確保 item_id 比較時類型一致
            if (row) {
                const customPrice = parseFloat(row[3]);
                if (!isNaN(customPrice) && customPrice !== 0) {
                    return customPrice;
                }
                const marketSell = parseFloat(row[2]);
                if (!isNaN(marketSell) && marketSell !== 0) {
                    return marketSell;
                }
            }
        } catch (e) {
            console.error("解析 price_data 失敗:", e);
        }
    }
    // 如果 localStorage 中沒有資料或資料無效，則從 itemBase 取得
    let itemInfo;
    if (Array.isArray(itemBase)) {
        itemInfo = itemBase.find(item => item.b_i === numericItemId);
    } else {
        itemInfo = itemBase[numericItemId];
    }
    if (itemInfo && itemInfo.params && itemInfo.params.price) {
        return itemInfo.params.price * 0.4;
    }
    return 0; // 預設值
}
/**
 * 取得材料價格。
 * @param {number|string} item_id - 物品ID。
 * @param {Array<Object>} itemBase - 物品基礎數據。
 * @returns {number} 材料價格。
 */
export function getMaterialPrice(item_id, itemBase) {
    // 確保 item_id 是數字格式
    const numericItemId = typeof item_id === 'string' ? parseInt(item_id) : item_id;
    let price_data = localStorage.getItem('price_data');
    if (price_data) {
        try {
            price_data = JSON.parse(price_data);
            const row = price_data.find(row => parseInt(row[0]) === numericItemId); // 確保 item_id 比較時類型一致
            if (row) {
                const customPrice = parseFloat(row[3]);
                if (!isNaN(customPrice) && customPrice !== 0) {
                    return customPrice;
                }
                const marketBuy = parseFloat(row[1]);
                if (!isNaN(marketBuy) && marketBuy !== 0) {
                    return marketBuy;
                }
            }
        } catch (e) {
            console.error("解析 price_data 失敗:", e);
        }
    }
    // 如果 localStorage 中沒有資料或資料無效，則從 itemBase 取得
    let itemInfo;
    if (Array.isArray(itemBase)) {
        itemInfo = itemBase.find(item => item.b_i === numericItemId);
    } else {
        itemInfo = itemBase[numericItemId];
    }
    if (itemInfo && itemInfo.params && itemInfo.params.price) {
        return itemInfo.params.price;
    }
    return 0; // 預設值
}
/**
 * 將數字格式化為帶有千分位分隔符號的字串。
 * @param {number} number - 要格式化的數字。
 * @returns {string} - 帶有千分位分隔符號的字串。
 */
export function formatNumberWithThousandsSeparator(number) {
    const numStr = number.toString();
    const parts = numStr.split('.');
    const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");

    if (parts.length > 1) {
        let decimalPart = parts[1];
        // 截斷到最多3位小數
        if (decimalPart.length > 3) {
            decimalPart = decimalPart.substring(0, 3);
        }
        // 移除小數部分末尾的零
        decimalPart = decimalPart.replace(/0+$/, '');

        // 如果小數部分不為空，則連接整數部分和小數部分
        if (decimalPart !== '') {
            return integerPart + '.' + decimalPart;
        }
    }
    return integerPart;
}

/**
 * 將小數格式化為百分比字串。
 * @param {number} decimal - 要格式化的小數 (例如 0.75)。
 * @returns {string} - 百分比字串 (例如 "75%")。
 */
export function formatAsPercentage(decimal) {
    if (typeof decimal !== 'number' || isNaN(decimal)) {
        return "N/A"; // 或者其他你認為合適的預設值
    }
    return `${(decimal * 100).toFixed(2)}%`; // 保留兩位小數
}