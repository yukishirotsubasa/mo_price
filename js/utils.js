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
 * 生成通用的 HTML 表格。
 * @param {Array<string>} headerKeys - 表格的標題鍵陣列 (用於 i18n 翻譯)。
 * @param {Array<Object>} data - 表格的資料陣列。
 * @param {Function} rowMapper - 將資料物件映射為表格行資料的函數。
 * @param {Function} translateFunction - i18n.translate 函數。
 * @returns {string} - 生成的 HTML 表格字串。
 */
export function generateTableHTML(headerKeys, data, rowMapper, translateFunction) {
    let tableHTML = '<table><thead><tr>';
    headerKeys.forEach(key => {
        tableHTML += `<th>${translateFunction(key)}</th>`;
    });
    tableHTML += '</tr></thead><tbody>';

    data.forEach(item => {
        tableHTML += '<tr>';
        rowMapper(item).forEach(cell => {
            tableHTML += `<td>${cell}</td>`;
        });
        tableHTML += '</tr>';
    });

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
 * 安全地從物件中獲取巢狀屬性。
 * @param {Object} obj - 要獲取屬性的物件。
 * @param {string} path - 屬性的路徑，例如 "params.price" 或 "params.contains[]"。
 * @returns {any} - 獲取到的屬性值，如果路徑無效則返回空字符串。
 */
export const getNestedValue = (obj, path) => {
    return path.split('.').reduce((current, key) => {
        // 處理 'params.contains[]' 這種帶有 [] 的 keyPath
        if (key.endsWith('[]')) {
            const actualKey = key.slice(0, -2);
            return current && current[actualKey] ? current[actualKey] : '';
        }
        return current && current[key] !== undefined && current[key] !== null ? current[key] : '';
    }, obj);
};

/**
 * 根據類型格式化單元格值。
 * @param {any} value - 原始值。
 * @param {string} type - 顯示類型 (e.g., 'number', 'text', 'boolean', 'image')。
 * @param {Function} translateFunction - i18n.translate 函數。
 * @returns {string} - 格式化後的 HTML 字串。
 */
export const formatCellValue = (value, type, translateFunction) => {
    if (value === '') return ''; // 如果值為空，直接返回空字符串
    switch (type) {
        case 'image':
            return `<img src="${value}" alt="Icon" style="width: 32px; height: 32px;">`;
        case 'boolean':
            return value ? translateFunction('yes') : translateFunction('no');
        case 'number':
            return typeof value === 'number' ? value.toLocaleString() : value;
        default:
            return value;
    }
};

/**
 * 根據配置檔動態生成表格。
 * @param {Object} config - 表格的配置物件。
 * @param {Array<Object>} data - 表格的資料陣列。
 * @param {Function} generateTableHTML - 生成 HTML 表格的函數。
 * @param {Function} createItemNameMap - 創建物品名稱映射的函數。
 * @param {Array} itemBase - 物品基礎資料陣列。
 * @param {Function} translateFunction - i18n.translate 函數。
 * @param {Array} [allPets] - 所有寵物數據 (僅用於 petsTable)。
 * @returns {string} - 生成的 HTML 表格字串。
 */
export function generateDynamicTable(config, data, generateTableHTML, createItemNameMap, itemBase, translateFunction, allPets) {
    const itemNameMap = createItemNameMap(itemBase, translateFunction);
    let petNameMap;
    if (allPets) {
        petNameMap = new Map(allPets.filter(p => p.b_i !== undefined && p.name !== undefined).map(p => [p.b_i, translateFunction(p.name)]));
    }

    // 過濾並排序要顯示的欄位
    const displayFields = config.fields
        .filter(field => field.display.inTable)
        .sort((a, b) => a.display.order - b.display.order);

    // 動態生成表頭
    const headerKeys = displayFields.map(field => {
        return translateFunction(field.label) || field.label;
    });

    const rowMapper = (item) => {
        return displayFields.map(field => {
            let value;
            if (field.keyPath === 'name') {
                value = translateFunction(item.name);
            } else if (field.keyPath === 'materials[]') {
                let consumesString = '';
                if (item.consumes && Array.isArray(item.consumes) && item.consumes.length > 0) {
                    consumesString = item.consumes.map(consume => {
                        const consumeName = itemNameMap.get(consume.id) || translateFunction('unknown_material', consume.id);
                        return `${consumeName}*${consume.count}`;
                    }).join(', ');
                }
                value = consumesString;
            } else if (field.keyPath === 'params.drops[]') {
                const drops = item.params && item.params.drops ?
                    item.params.drops.map(drop => {
                        const dropName = itemNameMap.get(drop.id) || translateFunction('unknown_item', drop.id);
                        return `${dropName} (${(drop.chance * 100).toFixed(6).replace(/\.?0+$/, '')}%)`;
                    }).join(', ') :
                    translateFunction('none');
                value = drops;
            } else if (field.keyPath === 'params.eats') {
                const eats = item.params && item.params.eats ? Object.entries(item.params.eats || {}).map(([itemId, val]) => `${itemNameMap.get(Number(itemId)) || `未知物品ID: ${itemId}`}(${val})`).join(', ') : '無';
                value = eats;
            } else if (field.keyPath === 'params.insurance_cost') {
                const insuranceCost = item.params && item.params.insurance_cost ? item.params.insurance_cost.join(', ') : '無';
                value = insuranceCost;
            } else if (field.keyPath === 'params.likes') {
                const likes = item.params && item.params.likes ? item.params.likes.map(like => `${petNameMap.get(like.pet_id) || `未知寵物ID: ${like.pet_id}`} (XP: ${like.xp})`).join(', ') : '無';
                value = likes;
            } else if (field.keyPath === 'reward[]') {
                const rewards = item.reward ? item.reward.map(id => itemNameMap.get(id) || id).join(', ') : '無';
                value = rewards;
            } else if (field.keyPath === 'level') { // For forgeTable.js dynamic level
                if (item.level !== undefined) {
                    value = item.level;
                } else if (item.fletching_level !== undefined) {
                    value = item.fletching_level;
                } else if (item.wizardry_level !== undefined) {
                    value = item.wizardry_level;
                } else {
                    value = getNestedValue(item, field.keyPath);
                }
            } else if (field.keyPath === 'patternString') { // For forgeTable.js dynamic pattern
                let patternString = '';
                if (item.pattern && Array.isArray(item.pattern)) {
                    const patternItems = {};
                    item.pattern.flat().forEach(id => {
                        if (id !== -1) {
                            patternItems[id] = (patternItems[id] || 0) + 1;
                        }
                    });

                    patternString = Object.keys(patternItems).map(id => {
                        const name = itemNameMap.get(parseInt(id)) || translateFunction('unknown_item', id);
                        return `${name}*${patternItems[id]}`;
                    }).join(', ');
                }
                value = patternString;
            } else if (field.keyPath === 'successRate') { // For enchantingChancesTable.js dynamic successRate
                value = item.successRate;
            }
            else {
                value = getNestedValue(item, field.keyPath);
            }
            return formatCellValue(value, field.display.type, translateFunction);
        });
    };

    return generateTableHTML(headerKeys, data, rowMapper, translateFunction);
}