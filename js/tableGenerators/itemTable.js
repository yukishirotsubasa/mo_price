// js/tableGenerators/itemTable.js - 包含 generateItemTable 函數
export function generateItemTable(itemBase, generateTableHTML, createItemNameMap) {
    const tableContainer = document.getElementById('item-table-container');
    if (!tableContainer) {
        console.error("找不到 item-table-container 元素。");
        return;
    }

    const headers = ['b_i', '名稱', '價格'];
    const data = itemBase;
    const rowMapper = (item) => {
        const b_i = item.b_i !== undefined && item.b_i !== null ? item.b_i : "";
        const name = item.name !== undefined && item.name !== null ? item.name : "";
        const price = item.params && item.params.price !== undefined && item.params.price !== null ? item.params.price : "";
        return [b_i, name, price];
    };

    tableContainer.innerHTML = generateTableHTML(headers, data, rowMapper);
}