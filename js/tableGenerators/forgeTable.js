// js/tableGenerators/forgeTable.js - 包含 generateForgeTable 函數
import i18n from '../i18n.js'; // 導入 i18n 模組
import { generateForgingCostTableData } from '../forgingCost.js'; // 導入 generateForgingCostTableData 函數

export function generateForgeTable(containerId, FORGE_FORMULAS, generateTableHTML, createItemNameMap, itemBase) {
    const forgeTableContainer = document.getElementById(containerId);

    const itemNameMap = createItemNameMap(itemBase, i18n.translate);

    // 使用 i18n.translate 翻譯表頭
    const headerKeys = ['serial_id', 'item_name', 'level', 'pattern', 'material_price', 'chance', 'cost', 'sell_price'];
    
    // 調用 generateForgingCostTableData 獲取已格式化的數據
    const data = generateForgingCostTableData(FORGE_FORMULAS, generateTableHTML, createItemNameMap, itemBase);

    const rowMapper = (item) => {
        return [
            item.id,
            item.itemName,
            item.level,
            item.pattern,
            item.materialPrice,
            item.chance,
            item.cost,
            item.sellPrice
        ];
    };

    forgeTableContainer.innerHTML = generateTableHTML(headerKeys, data, rowMapper, i18n.translate);
}