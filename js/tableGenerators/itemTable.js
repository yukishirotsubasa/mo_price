// js/tableGenerators/itemTable.js - 包含 generateItemTable 函數
import i18n from '../i18n.js'; // 導入 i18n 模組

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

    // 輔助函數：安全地從物件中獲取巢狀屬性
    const getNestedValue = (obj, path) => {
        return path.split('.').reduce((current, key) => {
            // 處理 'params.contains[]' 這種帶有 [] 的 keyPath
            if (key.endsWith('[]')) {
                const actualKey = key.slice(0, -2);
                return current && current[actualKey] ? current[actualKey].join(', ') : '';
            }
            return current && current[key] !== undefined && current[key] !== null ? current[key] : '';
        }, obj);
    };

    // 輔助函數：根據類型格式化單元格值
    const formatCellValue = (value, type) => {
        if (value === '') return ''; // 如果值為空，直接返回空字符串
        switch (type) {
            case 'image':
                return `<img src="${value}" alt="Icon" style="width: 32px; height: 32px;">`;
            case 'boolean':
                return value ? i18n.translate('yes') : i18n.translate('no');
            case 'number':
                return typeof value === 'number' ? value.toLocaleString() : value;
            default:
                return value;
        }
    };

    // 過濾並排序要顯示的欄位
    const displayFields = item_base_config.fields
        .filter(field => field.display.inTable)
        .sort((a, b) => a.display.order - b.display.order);

    // 動態生成表頭
    const headerKeys = displayFields.map(field => {
        // 嘗試從 i18n 獲取翻譯，如果沒有則使用 label 作為 fallback
        return i18n.translate(field.label) || field.label;
    });

    const data = [...itemBase].sort((a, b) => b.b_i - a.b_i); // 依 ID (b_i) 降序排序
    const rowMapper = (item) => {
        return displayFields.map(field => {
            let value;
            if (field.keyPath === 'name') {
                // 對於 'name' 欄位，使用 createItemNameMap 獲取翻譯後的物品名稱
                value = createItemNameMap(itemBase, i18n.translate).get(item.b_i) || item.name;
            } else {
                value = getNestedValue(item, field.keyPath);
            }
            return formatCellValue(value, field.display.type);
        });
    };

    tableContainer.innerHTML = generateTableHTML(headerKeys, data, rowMapper, i18n.translate);
}
