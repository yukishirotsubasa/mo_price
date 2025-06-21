import i18n from '../i18n.js'; // 導入 i18n 模組

export function generateObjectBaseTable(objectBase, generateTableHTML, createItemNameMap, itemBase) {
    const container = document.getElementById('object-base-table-container');
    if (!container) {
        console.error('Object Base table container not found.');
        return;
    }

    if (!objectBase) {
        container.innerHTML = '<p>object data not doaded。</p>';
        return;
    }

    // 使用 i18n.translate 翻譯表頭
    const headers = ['id', 'name'];

    const rowMapper = (obj) => {
        return [
            obj.b_i,
            i18n.translate(obj.name) // 直接翻譯物件名稱
        ];
    };

    const tableHTML = generateTableHTML(headers, objectBase, rowMapper, i18n.translate);
    container.innerHTML = tableHTML;
}