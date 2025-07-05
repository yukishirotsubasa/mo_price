/**
 * 生成分解成本表格資料。
 * @param {Object} FORGE_FORMULAS - 鍛造配方數據。
 * @param {Function} generateTableHTML - 生成表格HTML的函數。
 * @param {Function} createItemNameMap - 創建物品名稱映射的函數。
 * @param {Array<Object>} itemBase - 物品基礎數據。
 * @returns {Array<Object>} 包含分解成本計算結果的物件陣列。
 */
import i18n from './i18n.js'; // 導入 i18n 模組
import { createItemNameMap, getItemSellPrice, getMaterialPrice, formatNumberWithThousandsSeparator, formatAsPercentage, getItemDisplayContent } from './utils.js'; // 導入相關函數

export function generateRecycleCostTableData(FORGE_FORMULAS, generateTableHTML, createItemNameMap, itemBase) {
    // 獲取 imageSheet 數據
    const imageSheet = window.allData?.imageSheet || null;

    return Object.keys(FORGE_FORMULAS).flatMap(id => {
        const formula = FORGE_FORMULAS[id];
        
        // 1. only_smelt為true的不可分解，可直接去除
        if (formula.only_smelt || (formula.chance == 1 && !formula.recycle_chance)) {
            return [];
        }

        const itemId = formula.item_id;
        const itemName = getItemDisplayContent(itemId, itemBase, i18n.translate, 'image', imageSheet);
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

        // 計算各材料的價值總和
        let materialWorthTotal = 0;
        const pattern = Object.entries(patternItems).map(([mid, count]) => {
            const item_id = parseInt(mid);
            const name = getItemDisplayContent(item_id, itemBase, i18n.translate, 'image', imageSheet);
            
            const sellPrice = getItemSellPrice(item_id, itemBase);
            
            materialWorthTotal += sellPrice * count;
            return `${name}(${sellPrice})*${count}`;
        }).join(', ');

        // 2. recycle_chance為分解的成功率
        // 3. 其餘的分解邏輯為每個材料皆有50%機會成功
        let chance;
        if (formula.recycle_chance !== undefined && formula.recycle_chance !== null) {
            // 如果recycle_chance有值則轉換成百分比顯示，例如recycle_chance為1則顯示100%
            chance = formula.recycle_chance;
        } else {
            // 其餘的分解邏輯為每個材料皆有50%機會成功
            chance = 0.5;
        }

        // price: 鍛造成品的item id使用getMaterialPrice查找price
        const price = formatNumberWithThousandsSeparator(getMaterialPrice(itemId, itemBase));

        // worth: 各材料的item id使用getItemSellPrice查找price相加後/2
        const worth = formatNumberWithThousandsSeparator((materialWorthTotal * chance).toFixed(2));

        return [{
            id,
            itemName,
            level,
            pattern,
            chance: formatAsPercentage(chance),
            price,
            worth
        }];
    });
}