import i18n from '../i18n.js'; // 導入 i18n 模組
import { getItemDisplayContent } from '../utils.js'; // 導入新的顯示函數

export function generateMonsterBookTable(containerId, monsterBook, npcBase, itemBase, generateTableHTML, createItemNameMap, fletchingFormulas, arrowMaterialImg) {
    const container = document.getElementById(containerId);

    if (!monsterBook || !monsterBook.sacrifices) {
        container.innerHTML = `<p>${i18n.translate('monster_book_data_not_loaded')}</p>`;
        return;
    }

    if (!npcBase) {
        container.innerHTML = `<p>${i18n.translate('npc_data_not_loaded')}</p>`;
        return;
    }

    if (!itemBase) {
        container.innerHTML = `<p>${i18n.translate('item data not loaded')}</p>`;
        return;
    }

    // 獲取 imageSheet 數據
    const imageSheet = window.allData?.imageSheet || null;

    // 使用 i18n.translate 翻譯表頭
    const headerKeys = ['Name', 'Kill counts', 'Item', 'Count', 'drops'];

    // 將 MonsterBook.sacrifices 轉換為陣列格式
    const sacrificesArray = [];
    for (const key in monsterBook.sacrifices) {
        const sacrifice = monsterBook.sacrifices[key];
        sacrificesArray.push({
            npcKey: key,
            ...sacrifice
        });
    }

    const rowMapper = (sacrifice) => {
        // 找到對應的 NPC
        const npc = npcBase.find(n => n.b_i.toString() === sacrifice.npcKey);
        const npcName = npc ? i18n.translate(npc.name) : i18n.translate('unknown_npc');

        // 找到對應的物品
        const item = itemBase.find(i => i.b_i === sacrifice.item_id);
        const itemName = item ? getItemDisplayContent(sacrifice.item_id, itemBase, i18n.translate, 'image', imageSheet) : i18n.translate('unknown_item');

        // 查找所有 mon_book_only 為 true 的掉落物品
        const monBookDrops = [];
        if (npc && npc.params && npc.params.drops) {
            npc.params.drops.forEach(drop => {
                if (drop.mon_book_only === true) {
                    const dropItem = itemBase.find(i => i.b_i === drop.id);
                    if (dropItem) {
                        const dropItemName = getItemDisplayContent(drop.id, itemBase, i18n.translate, 'image', imageSheet, fletchingFormulas, arrowMaterialImg);
                        monBookDrops.push(dropItemName);
                    }
                }
            });
        }

        const dropsText = monBookDrops.length > 0 ? monBookDrops.join(', ') : i18n.translate('none');

        return [
            npcName,
            sacrifice.kills,
            itemName,
            sacrifice.sacrifices,
            dropsText
        ];
    };

    const tableHTML = generateTableHTML(headerKeys, sacrificesArray, rowMapper, i18n.translate);
    container.innerHTML = tableHTML;
}