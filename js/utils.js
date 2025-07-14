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
 * @param {Object} fletchingFormulas - 箭矢組成數據
 * @param {Object} arrowMaterialImg - 箭矢材料圖片對應數據
 * @returns {string} - 圖片 HTML 或 fallback 文字
 */
export function generateItemImage(itemId, itemBase, imageSheet, translateFunction, fletchingFormulas, arrowMaterialImg) {
    // 查找物品數據
    const item = Array.isArray(itemBase) 
        ? itemBase.find(item => item.b_i === itemId)
        : itemBase[itemId];
    
    if (!item) {
        return `<span class="item-fallback" title="${translateFunction('unknown_item')}">[${itemId}]</span>`;
    }

    // 🟡 特別處理箭矢（無一般 img，但為 arrow 類型）
    if ((!item.img || !('sheet' in item.img)) && item.img?.arrow === true && fletchingFormulas && arrowMaterialImg) {
        const { style, valid } = getArrowImageBackgroundStyleFromFormula(itemId, fletchingFormulas, arrowMaterialImg, imageSheet);
        if (valid) {
            const itemName = translateFunction(item.name);
            return `<span class="item-container">
                <div class="item-image"
                     title="${itemName}"
                     data-item-id="${itemId}"
                     style="${style}">
                </div>
                <span class="item-search-text">${itemName} ${item.name}</span>
            </span>`;
        }
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
    
    const resItemName = item.name
    const itemName = translateFunction(item.name);
    
    return `<span class="item-container">
        <div class="item-image" 
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
        </div>
        <span class="item-search-text">${itemName} ${resItemName}</span>
    </span>`;
}

/**
 * 統一的物品顯示內容獲取函數
 * @param {number} itemId - 物品 ID
 * @param {Array} itemBase - 物品基礎數據
 * @param {Function} translateFunction - 翻譯函數
 * @param {string} displayType - 顯示類型 ('name' 或 'image')
 * @param {Object} imageSheet - 圖片表數據 (當 displayType 為 'image' 時需要)
 * @param {Object} fletchingFormulas - 箭矢組成數據
 * @param {Object} arrowMaterialImg - 箭矢材料圖片對應數據
 * @returns {string} - 顯示內容
 */
export function getItemDisplayContent(itemId, itemBase, translateFunction, displayType = 'name', imageSheet = null, fletchingFormulas = null, arrowMaterialImg = null) {
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
        return generateItemImage(itemId, itemBase, imageSheet, translateFunction, fletchingFormulas, arrowMaterialImg);
    }
    
    console.warn(`Unknown display type: ${displayType}`);
    return getItemDisplayContent(itemId, itemBase, translateFunction, 'name');
}

/**
 * 根據 FLETCHING_FORMULAS 直接產生箭矢圖片 style（模擬 background-image 疊圖）
 * @param {number} itemId - 物品 ID
 * @param {Object} fletchingFormulas - 原始配方資料
 * @param {Object} arrowMaterialImg - ARROW_MATERIAL_IMG
 * @param {Object} imageSheet - IMAGE_SHEET
 * @returns {{ style: string, valid: boolean }}
 */
export function getArrowImageBackgroundStyleFromFormula(itemId, fletchingFormulas, arrowMaterialImg, imageSheet) {
    // 反查 item_id → pattern
    let pattern = null;
    for (const key in fletchingFormulas) {
        const formula = fletchingFormulas[key];
        if (formula?.item_id === itemId) {
            pattern = formula.pattern;
            break;
        }
    }
    if (!pattern || pattern.length !== 3) return { style: '', valid: false };

    // 調整部件順序：箭身、箭頭、箭羽
    const ordered = [pattern[1], pattern[0], pattern[2]];
    const backgrounds = [];

    for (const matId of ordered) {
        const materialInfo = arrowMaterialImg[matId];
        if (!materialInfo) continue;

        const sheet = imageSheet[materialInfo.sheet];
        if (!sheet || !sheet.url) continue;

        const tileW = sheet.tile_width || 32;
        const tileH = sheet.tile_height || 32;
        const bgX = -(materialInfo.x * tileW);
        const bgY = -(materialInfo.y * tileH);
        const url = sheet.url.toLowerCase();

        backgrounds.push(`url('${url}') ${bgX}px ${bgY}px no-repeat`);
    }

    if (backgrounds.length === 0) return { style: '', valid: false };

    const style = `
        background: ${backgrounds.join(', ')};
        width: 32px;
        height: 32px;
        display: inline-block;
        border: 1px solid #ddd;
        margin: 1px;
        cursor: pointer;
        vertical-align: middle;
    `.trim();

    return { style, valid: true };
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
    // 為itemTable添加特殊的容器和固定表頭功能
    let tableHTML = '<div class="table-container"><table class="sticky-header-table"><thead><tr>';
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

    tableHTML += '</tbody></table></div>';
    return tableHTML;
}

/**
 * 比較兩個版本的數據物件，找出新增、刪除和修改的條目。
 * 僅針對 item_base[].name (string內容) 和 item_base[].params (object內容) 進行比較。
 *
 * @param {Array<Object>} dataA - 版本 A 的數據陣列。
 * @param {Array<Object>} dataB - 版本 B 的數據陣列。
 * @param {string} idKey - 用於識別唯一條目的屬性名稱（例如 'b_i'）。
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
            
            // 僅比較 name 和 params 屬性
            const changes = {};
            let hasChanges = false;
            
            // 比較 name 屬性 (string內容)
            if (itemA.name !== itemB.name) {
                changes.name = { old: itemA.name, new: itemB.name };
                hasChanges = true;
            }
            
            // 比較 params 屬性 (object內容)
            const paramsAStr = JSON.stringify(itemA.params || {});
            const paramsBStr = JSON.stringify(itemB.params || {});
            if (paramsAStr !== paramsBStr) {
                changes.params = { old: itemA.params, new: itemB.params };
                hasChanges = true;
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

    // 找出刪除的條目 (在 A 中存在但不在 B 中)
    for (const [id, itemA] of mapA.entries()) {
        if (!mapB.has(id)) {
            result.removed.push(itemA);
        }
    }

    return result;
}
// 快取特殊道具ID清單
let _specialItemIdsCache = null;
let _lastNpcBaseHash = null;

/**
 * 建立特殊道具ID清單，從npc_base數據中提取spawn為true的道具ID。
 * @param {Array<Object>} npcBase - NPC基礎數據。
 * @returns {Set<number>} 特殊道具ID的Set集合。
 */
export function createSpecialItemIdList(npcBase) {
    if (!Array.isArray(npcBase)) {
        console.warn("npcBase 未定義或不是陣列，無法建立特殊道具清單。");
        return new Set();
    }
    
    // 建立簡單的hash來檢查npcBase是否有變化
    const npcBaseHash = JSON.stringify(npcBase.map(npc => ({
        temp: npc.temp?.content ? npc.temp.content.map(item => ({ id: item.id, spawn: item.spawn })) : null
    })));
    
    // 如果快取存在且數據沒有變化，直接返回快取
    if (_specialItemIdsCache && _lastNpcBaseHash === npcBaseHash) {
        return _specialItemIdsCache;
    }
    
    const specialItemIds = new Set();
    
    npcBase.forEach(npc => {
        // 1. 過濾沒有npc_base[].temp.content或npc_base[].temp.content為空的對象
        if (!npc.temp || !npc.temp.content || !Array.isArray(npc.temp.content) || npc.temp.content.length === 0) {
            return;
        }
        
        // 2. 蒐集剩下對象的content進行整理
        npc.temp.content.forEach(item => {
            // 3. 將spawn不為true的項目去除
            if (item.spawn === true && typeof item.id === 'number') {
                // 4. 最後將剩下的npc_base[].temp.content[].id建立成一個list供查詢
                specialItemIds.add(item.id);
            }
        });
    });
    
    // 更新快取
    _specialItemIdsCache = specialItemIds;
    _lastNpcBaseHash = npcBaseHash;
    
    return specialItemIds;
}

/**
 * 取得物品出售價格。
 * @param {number|string} item_id - 物品ID。
 * @param {Array<Object>} itemBase - 物品基礎數據。
 * @param {Array<Object>} npcBase - NPC基礎數據（可選，用於特殊價格計算）。
 * @returns {number} 物品出售價格。
 */
export function getItemSellPrice(item_id, itemBase, npcBase = null) {
    // 確保 item_id 是數字格式
    const numericItemId = typeof item_id === 'string' ? parseInt(item_id) : item_id;
    let price_data = localStorage.getItem('price_data');
    if (price_data) {
        try {
            price_data = JSON.parse(price_data);
            const row = price_data.find(row => parseInt(row[0]) === numericItemId); // 確保 item_id 比較時類型一致
            if (row) {
                // 移除千分位符號後再解析
                const customPrice = parseFloat(String(row[3]).replace(/,/g, ''));
                if (!isNaN(customPrice) && customPrice > 0) {
                    return customPrice;
                }
                const marketSell = parseFloat(String(row[2]).replace(/,/g, ''));
                if (!isNaN(marketSell) && marketSell > 0) {
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
        // 檢查是否為特殊道具
        if (npcBase) {
            const specialItemIds = createSpecialItemIdList(npcBase);
            if (specialItemIds.has(numericItemId)) {
                // 當getItemSellPrice收到的item id在上述list時，最後面改用itemInfo.params.price * 0.5
                return itemInfo.params.price * 0.5;
            }
        }
        // 其他不在list裡的item id一樣使用itemInfo.params.price * 0.4
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
                // 移除千分位符號後再解析
                const customPrice = parseFloat(String(row[3]).replace(/,/g, ''));
                if (!isNaN(customPrice) && customPrice > 0) {
                    return customPrice;
                }
                const marketBuy = parseFloat(String(row[1]).replace(/,/g, ''));
                if (!isNaN(marketBuy) && marketBuy > 0) {
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