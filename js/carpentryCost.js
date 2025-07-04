import i18n from './i18n.js';
import { createItemNameMap, getMaterialPrice, getItemSellPrice, formatNumberWithThousandsSeparator } from './utils.js';



/**
 * 生成木工成本表格資料。
 * @param {Object} CARPENTRY_FORMULAS - 木工配方數據。
 * @param {Function} generateTableHTML - 生成表格 HTML 的函數。
 * @param {Function} createItemNameMap - 創建物品名稱映射的函數。
 * @param {Array<Object>} itemBase - 物品基礎數據。
 * @returns {Array<Object>} 包含木工成本計算結果的物件陣列。
 */
export function generateCarpentryCostTableData(CARPENTRY_FORMULAS, generateTableHTML, createItemNameMap, itemBase) {
    const itemNameMap = createItemNameMap(itemBase, i18n.translate);
    let allCarpentryFormulas = [];

    if (CARPENTRY_FORMULAS.floors && Array.isArray(CARPENTRY_FORMULAS.floors)) {
        allCarpentryFormulas = allCarpentryFormulas.concat(CARPENTRY_FORMULAS.floors);
    }
    if (CARPENTRY_FORMULAS.furniture && Array.isArray(CARPENTRY_FORMULAS.furniture)) {
        allCarpentryFormulas = allCarpentryFormulas.concat(CARPENTRY_FORMULAS.furniture);
    }
    if (CARPENTRY_FORMULAS.walls && Array.isArray(CARPENTRY_FORMULAS.walls)) {
        allCarpentryFormulas = allCarpentryFormulas.concat(CARPENTRY_FORMULAS.walls);
    }

    return allCarpentryFormulas.map(formula => {
        const itemId = formula.item_id;
        const itemName = itemNameMap.get(itemId) || formula.item_name;
        const level = formula.level !== undefined ? formula.level : '';

        let materialPriceTotal = 0;
        let patternString = '';

        if (formula.consumes && Array.isArray(formula.consumes)) {
            const consumedMaterials = formula.consumes.map(consume => {
                const materialId = consume.id;
                const count = consume.count;
                const materialName = itemNameMap.get(materialId) || i18n.translate('unknown_material', materialId);
                const price = getMaterialPrice(materialId, itemBase);
                materialPriceTotal += price * count;
                return `${materialName}(${price})*${count}`;
            });
            patternString = consumedMaterials.join(', ');
        }

        const cost = materialPriceTotal; // 刪除 chance 相關邏輯
        const sellPrice = getItemSellPrice(itemId, itemBase);

        return {
            itemName,
            level,
            pattern: patternString,
            cost: formatNumberWithThousandsSeparator(cost),
            sellPrice: formatNumberWithThousandsSeparator(sellPrice)
        };
    });
}