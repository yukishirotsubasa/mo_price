// js/utils.js - 存放通用的輔助函數

/**
 * 從 item_base 創建 item_id 到 item_name 的映射表。
 * @param {Array} itemBase - 物品基礎資料陣列。
 * @returns {Map<number, string>} - item_id 到 item_name 的映射表。
 */
export function createItemNameMap(itemBase) {
    const itemNameMap = new Map();
    if (typeof itemBase !== 'undefined' && Array.isArray(itemBase)) {
        itemBase.forEach(item => {
            if (item.b_i !== undefined && item.name !== undefined) {
                itemNameMap.set(item.b_i, item.name);
            }
        });
    } else {
        console.warn("item_base 未定義或不是陣列，無法建立 itemNameMap。");
    }
    return itemNameMap;
}

/**
 * 生成通用的 HTML 表格。
 * @param {Array<string>} headers - 表格的標題陣列。
 * @param {Array<Object>} data - 表格的資料陣列。
 * @param {Function} rowMapper - 將資料物件映射為表格行資料的函數。
 * @returns {string} - 生成的 HTML 表格字串。
 */
export function generateTableHTML(headers, data, rowMapper) {
    let tableHTML = '<table><thead><tr>';
    headers.forEach(header => {
        tableHTML += `<th>${header}</th>`;
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