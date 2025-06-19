// js/tableGenerators/itemTable.js - 包含 generateItemTable 函數
import i18n from '../i18n.js'; // 導入 i18n 模組
import { generateDynamicTable } from '../utils.js'; // 導入通用表格生成函數

export async function generateItemTable(itemBase, generateTableHTML, createItemNameMap) {
    const tableContainer = document.getElementById('item-table-container');
    if (!tableContainer) {
        console.error("找不到 item-table-container 元素。");
        return;
    }

    let item_base_config;
    try {
        const response = await fetch('./config/item_base_config.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        item_base_config = await response.json();
    } catch (error) {
        console.error("載入 item_base_config.json 失敗:", error);
        tableContainer.innerHTML = `<p style="color: red;">載入配置檔案失敗，請檢查控制台。</p>`;
        return;
    }

    tableContainer.innerHTML = generateDynamicTable(item_base_config, itemBase, generateTableHTML, createItemNameMap, itemBase, i18n.translate);
}
