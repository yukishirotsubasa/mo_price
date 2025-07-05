// js/tableGenerators/carpentryTable.js - 包含 generateCarpentryTable 函數
import i18n from '../i18n.js'; // 導入 i18n 模組
import { getItemDisplayContent } from '../utils.js'; // 導入新的顯示函數

export function generateCarpentryTable(containerId, CARPENTRY_FORMULAS, generateTableHTML, createItemNameMap, itemBase) {
    const carpentryTableContainer = document.getElementById(containerId);

    // 獲取 imageSheet 數據
    const imageSheet = window.allData?.imageSheet || null;

    let allCarpentryItems = [];
    if (typeof CARPENTRY_FORMULAS !== 'undefined') {
        if (CARPENTRY_FORMULAS.floors && Array.isArray(CARPENTRY_FORMULAS.floors)) {
            allCarpentryItems = allCarpentryItems.concat(CARPENTRY_FORMULAS.floors);
        }
        if (CARPENTRY_FORMULAS.furniture && Array.isArray(CARPENTRY_FORMULAS.furniture)) {
            allCarpentryItems = allCarpentryItems.concat(CARPENTRY_FORMULAS.furniture);
        }
        if (CARPENTRY_FORMULAS.walls && Array.isArray(CARPENTRY_FORMULAS.walls)) {
            allCarpentryItems = allCarpentryItems.concat(CARPENTRY_FORMULAS.walls);
        }
    } else {
        console.warn("CARPENTRY_FORMULAS 未定義。");
    }

    // 使用 i18n.translate 翻譯表頭
    const headerKeys = ['item name', 'materials', 'craftable', 'level'];
    const data = allCarpentryItems;
    const rowMapper = (item) => {
        const itemName = getItemDisplayContent(item.item_id, itemBase, i18n.translate, 'image', imageSheet); // 使用圖片顯示
        const craftable = item.craftable ? i18n.translate('yes') : i18n.translate('no');
        const level = item.level !== undefined ? item.level : '';

        let consumesString = '';
        if (item.consumes && Array.isArray(item.consumes) && item.consumes.length > 0) {
            consumesString = item.consumes.map(consume => {
                const consumeName = getItemDisplayContent(consume.id, itemBase, i18n.translate, 'image', imageSheet);
                return `${consumeName}*${consume.count}`;
            }).join(', ');
        }
        return [itemName, consumesString, craftable, level];
    };

    carpentryTableContainer.innerHTML = generateTableHTML(headerKeys, data, rowMapper, i18n.translate);
}