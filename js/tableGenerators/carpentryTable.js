// js/tableGenerators/carpentryTable.js - 包含 generateCarpentryTable 函數
import i18n from '../i18n.js'; // 導入 i18n 模組

export function generateCarpentryTable(CARPENTRY_FORMULAS, generateTableHTML, createItemNameMap, itemBase) {
    const carpentryTableContainer = document.getElementById('carpentry-table-container');
    if (!carpentryTableContainer) {
        console.error("找不到 carpentry-table-container 元素。");
        return;
    }

    const itemNameMap = createItemNameMap(itemBase, i18n.translate);

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
    const headerKeys = ['item_name', 'required_materials', 'craftable', 'level'];
    const data = allCarpentryItems;
    const rowMapper = (item) => {
        const itemName = itemNameMap.get(item.item_id) || item.item_name; // 如果沒有翻譯，使用原始名稱
        const craftable = item.craftable ? i18n.translate('yes') : i18n.translate('no');
        const level = item.level !== undefined ? item.level : '';

        let consumesString = '';
        if (item.consumes && Array.isArray(item.consumes) && item.consumes.length > 0) {
            consumesString = item.consumes.map(consume => {
                const consumeName = itemNameMap.get(consume.id) || i18n.translate('unknown_material', consume.id);
                return `${consumeName}*${consume.count}`;
            }).join(', ');
        }
        return [itemName, consumesString, craftable, level];
    };

    carpentryTableContainer.innerHTML = generateTableHTML(headerKeys, data, rowMapper, i18n.translate);
}