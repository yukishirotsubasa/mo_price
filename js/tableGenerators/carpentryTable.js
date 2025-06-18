// js/tableGenerators/carpentryTable.js - 包含 generateCarpentryTable 函數
export function generateCarpentryTable(CARPENTRY_FORMULAS, generateTableHTML, createItemNameMap, itemBase) {
    const carpentryTableContainer = document.getElementById('carpentry-table-container');
    if (!carpentryTableContainer) {
        console.error("找不到 carpentry-table-container 元素。");
        return;
    }

    const itemNameMap = createItemNameMap(itemBase);

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

    const headers = ['物品名稱', '所需材料', '可製作', '等級'];
    const data = allCarpentryItems;
    const rowMapper = (item) => {
        const itemName = itemNameMap.get(item.item_id) || `未知物品 (${item.item_id})`;
        const craftable = item.craftable ? '是' : '否';
        const level = item.level !== undefined ? item.level : '';

        let consumesString = '';
        if (item.consumes && Array.isArray(item.consumes) && item.consumes.length > 0) {
            consumesString = item.consumes.map(consume => {
                const consumeName = itemNameMap.get(consume.id) || `未知材料 (${consume.id})`;
                return `${consumeName}*${consume.count}`;
            }).join(', ');
        }
        return [itemName, consumesString, craftable, level];
    };

    carpentryTableContainer.innerHTML = generateTableHTML(headers, data, rowMapper);
}