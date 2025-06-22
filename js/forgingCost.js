/**
 * 取得材料價格。
 * @param {number} item_id - 物品ID。
 * @param {Array<Object>} itemBase - 物品基礎數據。
 * @returns {number} 材料價格。
 */
import i18n from './i18n.js'; // 導入 i18n 模組
import { createItemNameMap } from './utils.js'; // 導入 createItemNameMap 函數

export function getMaterialPrice(item_id, itemBase) {
    let price_data = localStorage.getItem('price_data');
    if (price_data) {
        try {
            price_data = JSON.parse(price_data);
            const row = price_data.find(row => parseInt(row[0]) === item_id); // 確保 item_id 比較時類型一致
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
    const itemInfo = itemBase[item_id];
    if (itemInfo && itemInfo.params && itemInfo.params.price) {
        return itemInfo.params.price;
    }
    return 0; // 預設值
}

/**
 * 取得物品出售價格。
 * @param {number} item_id - 物品ID。
 * @param {Array<Object>} itemBase - 物品基礎數據。
 * @returns {number} 物品出售價格。
 */
export function getItemSellPrice(item_id, itemBase) {
    let price_data = localStorage.getItem('price_data');
    if (price_data) {
        try {
            price_data = JSON.parse(price_data);
            const row = price_data.find(row => parseInt(row[0]) === item_id); // 確保 item_id 比較時類型一致
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
    const itemInfo = itemBase[item_id];
    if (itemInfo && itemInfo.params && itemInfo.params.price) {
        return itemInfo.params.price * 0.4;
    }
    return 0; // 預設值
}

/**
 * 生成鍛造成本表格資料。
 * @param {Array<Object>} itemBase - 物品基礎數據。
 * @param {Object} FORGE_FORMULAS - 鍛造配方數據。
 * @returns {Array<Object>} 包含鍛造成本計算結果的物件陣列。
 */
export function generateForgingCostTableData(FORGE_FORMULAS, generateTableHTML, createItemNameMap, itemBase) {
    const itemNameMap = createItemNameMap(itemBase, i18n.translate);

    return Object.keys(FORGE_FORMULAS).flatMap(id => {
        const formula = FORGE_FORMULAS[id];
        if (formula.hidden) return [];

        const itemId = formula.item_id;
        const itemName = itemNameMap.get(itemId) || formula.item_name;
        let level = formula.level ?? formula.fletching_level ?? formula.wizardry_level ?? '';

        // 處理材料與價格
        let patternItems = {};
        if (Array.isArray(formula.pattern)) {
            formula.pattern.flat().forEach(mid => {
                if (mid !== -1) {
                    patternItems[mid] = (patternItems[mid] || 0) + 1;
                }
            });
        }

        let materialPriceTotal = 0;
        const pattern = Object.entries(patternItems).map(([mid, count]) => {
            const item_id = parseInt(mid);
            const name = itemNameMap.get(item_id) || i18n.translate('unknown_item', item_id);
            const price = getMaterialPrice(item_id, itemBase);
            materialPriceTotal += price * count;
            return `${name}(${price})*${count}`;
        }).join(', ');

        const chance = formula.chance ?? 0;
        const cost = chance > 0 ? (materialPriceTotal / chance).toFixed(2) : '∞';
        const sellPrice = getItemSellPrice(itemId, itemBase);

        return [{
            id,
            itemName,
            level,
            pattern,
            materialPrice: materialPriceTotal,
            chance,
            cost,
            sellPrice
        }];
    });
}