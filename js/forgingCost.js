/**
 * 生成鍛造成本表格資料。
 * @param {Array<Object>} itemBase - 物品基礎數據。
 * @param {Object} FORGE_FORMULAS - 鍛造配方數據。
 * @returns {Array<Object>} 包含鍛造成本計算結果的物件陣列。
 */
import i18n from './i18n.js'; // 導入 i18n 模組
import { createItemNameMap, getItemSellPrice, getMaterialPrice, formatNumberWithThousandsSeparator, formatAsPercentage } from './utils.js'; // 導入相關函數

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
            
            let price_data = localStorage.getItem('price_data');
            let price = 0; // Default price
            if (price_data) {
                try {
                    price_data = JSON.parse(price_data);
                    const row = price_data.find(row => parseInt(row[0]) === item_id);
                    if (row) {
                        const customPrice = parseFloat(row[3]);
                        if (!isNaN(customPrice) && customPrice !== 0) {
                            price = customPrice;
                        } else {
                            const marketBuy = parseFloat(row[1]);
                            if (!isNaN(marketBuy) && marketBuy !== 0) {
                                price = marketBuy;
                            }
                        }
                    }
                } catch (e) {
                    console.error("解析 price_data 失敗:", e);
                }
            }
            if (price === 0) { // If no price from localStorage or invalid, get from itemBase
                const itemInfo = itemBase[item_id];
                if (itemInfo && itemInfo.params && itemInfo.params.price) {
                    price = itemInfo.params.price;
                }
            }
            
            materialPriceTotal += price * count;
            return `${name}(${price})*${count}`;
        }).join(', ');

        const chance = formula.chance ?? 0;
        const formattedChance = formatAsPercentage(chance);
        const cost = chance > 0 ? (materialPriceTotal / chance) : Infinity; // 計算成本，如果 chance 為 0 則為 Infinity
        const formattedCost = cost === Infinity ? '∞' : formatNumberWithThousandsSeparator(cost.toFixed(2)); // 格式化成本
        const sellPrice = formatNumberWithThousandsSeparator(getItemSellPrice(itemId, itemBase));

        return [{
            id,
            itemName,
            level,
            pattern,
            materialPrice: formatNumberWithThousandsSeparator(materialPriceTotal),
            chance: formattedChance,
            cost: formattedCost,
            sellPrice
        }];
    });
}