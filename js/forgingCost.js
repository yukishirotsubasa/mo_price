/**
 * 生成鍛造成本表格資料。
 * @param {Array<Object>} itemBase - 物品基礎數據。
 * @param {Object} FORGE_FORMULAS - 鍛造配方數據。
 * @returns {Array<Object>} 包含鍛造成本計算結果的物件陣列。
 */
import i18n from './i18n.js'; // 導入 i18n 模組
import { createItemNameMap, getItemSellPrice, getMaterialPrice, formatNumberWithThousandsSeparator, formatAsPercentage, getItemDisplayContent } from './utils.js'; // 導入相關函數

export function generateForgingCostTableData(FORGE_FORMULAS, generateTableHTML, createItemNameMap, itemBase, fletchingFormulas, arrowMaterialImg) {
    // 獲取 imageSheet 數據
    const imageSheet = window.allData?.imageSheet || null;

    return Object.keys(FORGE_FORMULAS).flatMap(id => {
        const formula = FORGE_FORMULAS[id];
        if (formula.chance == 0) return [];

        const itemId = formula.item_id;
        const itemName = getItemDisplayContent(itemId, itemBase, i18n.translate, 'image', imageSheet, fletchingFormulas, arrowMaterialImg);
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
            const name = getItemDisplayContent(item_id, itemBase, i18n.translate, 'image', imageSheet, fletchingFormulas, arrowMaterialImg);
            
            const price = getMaterialPrice(item_id, itemBase);
            
            materialPriceTotal += price * count;
            return `${name}(${price})*${count}`;
        }).join(', ');

        const chance = formula.chance ?? 0;
        const formattedChance = formatAsPercentage(chance);
        const cost = chance > 0 ? (materialPriceTotal / chance) : Infinity; // 計算成本，如果 chance 為 0 則為 Infinity
        const formattedCost = cost === Infinity ? '∞' : formatNumberWithThousandsSeparator(cost.toFixed(2)); // 格式化成本
        const npcBase = window.allData?.npcBase || null;
        const sellPrice = formatNumberWithThousandsSeparator(getItemSellPrice(itemId, itemBase, npcBase));

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