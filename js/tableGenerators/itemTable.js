// js/tableGenerators/itemTable.js - 包含 generateItemTable 函數
import i18n from '../i18n.js'; // 導入 i18n 模組

export function generateItemTable(itemBase, generateTableHTML, createItemNameMap) {
    const tableContainer = document.getElementById('item-table-container');
    if (!tableContainer) {
        console.error("找不到 item-table-container 元素。");
        return;
    }

    // 使用 i18n.translate 翻譯表頭
    const headerKeys = ['item_id', 'item_name', 'item_price'];
    const data = itemBase;
    const rowMapper = (item) => {
        const b_i = item.b_i !== undefined && item.b_i !== null ? item.b_i : "";
        // 使用 createItemNameMap 獲取翻譯後的物品名稱
        const name = createItemNameMap(itemBase, i18n.translate).get(item.b_i) || item.name;
        const price = item.params && item.params.price !== undefined && item.params.price !== null ? item.params.price : "";
        return [b_i, name, price];
    };

    tableContainer.innerHTML = generateTableHTML(headerKeys, data, rowMapper, i18n.translate);
}
