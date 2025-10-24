import i18n from '../i18n.js';
import { getItemDisplayContent } from '../utils.js';

export function generateMonsterBookDebuffTable(containerId, monsterBook, itemBase, generateTableHTML, createItemNameMap, fletchingFormulas, arrowMaterialImg) {
    const container = document.getElementById(containerId);

    if (!monsterBook || !monsterBook.scrolls) {
        container.innerHTML = `<p>${i18n.translate('monster_book_scrolls_data_not_loaded')}</p>`;
        return;
    }

    const monsterBookScrolls = monsterBook.scrolls;

    if (!itemBase) {
        container.innerHTML = `<p>${i18n.translate('item data not loaded')}</p>`;
        return;
    }

    // 獲取 imageSheet 數據
    const imageSheet = window.allData?.imageSheet || null;

    // 創建表格結構
    let tableHTML = '<div class="monster-book-debuff-container">';
    
    // 為每個debuff類型創建一個表格
    Object.keys(monsterBookScrolls).forEach(debuffType => {
        const debuffData = monsterBookScrolls[debuffType];
        
        // 跳過 item_ids 陣列
        if (debuffType === 'item_ids' || !debuffData.item_ids) {
            return;
        }

        tableHTML += `<div class="debuff-section">`;
        tableHTML += `<h3>${i18n.translate(debuffType) || debuffType}</h3>`;
        
        // 表頭 - 使用翻譯函數
        const headerKeys = [i18n.translate('Item'), i18n.translate('Min Value'), i18n.translate('Max Value')];
        
        // 準備資料陣列
        const scrollsArray = debuffData.item_ids.map(itemId => {
            const itemIdStr = itemId.toString();
            const scrollData = debuffData[itemIdStr];
            
            if (!scrollData) {
                return null;
            }

            return {
                itemId: itemId,
                min: scrollData.min,
                max: scrollData.max
            };
        }).filter(item => item !== null);

        const rowMapper = (scroll) => {
            // 找到對應的物品
            const item = itemBase.find(i => i.b_i === scroll.itemId);
            const itemName = item ? getItemDisplayContent(scroll.itemId, itemBase, i18n.translate, 'image', imageSheet, fletchingFormulas, arrowMaterialImg) : i18n.translate('unknown_item');

            return [
                itemName,
                scroll.min,
                scroll.max
            ];
        };

        const sectionTableHTML = generateTableHTML(headerKeys, scrollsArray, rowMapper, i18n.translate);
        tableHTML += sectionTableHTML;
        tableHTML += `</div>`;
    });

    tableHTML += '</div>';
    container.innerHTML = tableHTML;
}