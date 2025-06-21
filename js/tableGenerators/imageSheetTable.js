import i18n from '../i18n.js'; // 導入 i18n 模組

export function generateImageSheetTable(imageSheet, generateTableHTML, createItemNameMap, itemBase) {
    const container = document.getElementById('image-sheet-table-container');
    if (!container) {
        console.error('Image Sheet table container not found.');
        return;
    }

    if (!imageSheet) {
        container.innerHTML = '<p>image sheet data not doaded。</p>';
        return;
    }

    const headers = ['key', 'URL', 'Tile Width', 'Tile Height'];
    const data = [];

    for (const key in imageSheet) {
        let value = imageSheet[key];
        // 處理別名結構
        while (typeof value === 'string' && imageSheet[value] !== undefined && value !== key) {
            value = imageSheet[value];
        }

        if (typeof value === 'object' && value !== null && value.url) {
            data.push({
                imageName: key,
                url: value.url,
                tileWidth: value.tile_width || 'N/A',
                tileHeight: value.tile_height || 'N/A'
            });
        } else if (typeof value === 'string') {
            // 如果最終還是字串，表示它可能是一個無效的別名或直接的圖片路徑
            data.push({
                imageName: key,
                url: value,
                tileWidth: 'N/A',
                tileHeight: 'N/A'
            });
        }
    }

    const rowMapper = (item) => {
        return [
            item.imageName,
            item.url,
            item.tileWidth,
            item.tileHeight
        ];
    };

    const tableHTML = generateTableHTML(headers, data, rowMapper, i18n.translate);
    container.innerHTML = tableHTML;
}