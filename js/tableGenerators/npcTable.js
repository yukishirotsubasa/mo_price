import i18n from '../i18n.js'; // 導入 i18n 模組

export function generateNpcTable(npcBase, generateTableHTML, createItemNameMap, itemBase) {
    const container = document.getElementById('npc-table-container');
    if (!container) {
        console.error('NPC table container not found.');
        return;
    }

    if (!npcBase) {
        container.innerHTML = `<p>${i18n.translate('npc_data_not_loaded')}</p>`;
        return;
    }

    const itemNameMap = createItemNameMap(itemBase, i18n.translate);

    // 使用 i18n.translate 翻譯表頭
    const headerKeys = ['id', 'name', 'health', 'total_defense', 'total_strength', 'total_accuracy', 'drops'];

    const rowMapper = (npc) => {
        const drops = npc.params && npc.params.drops ?
            npc.params.drops.map(drop => {
                const dropName = itemNameMap.get(drop.id) || i18n.translate('unknown_item', drop.id);
                return `${dropName} (${(drop.chance * 100).toFixed(6).replace(/\.?0+$/, '')}%)`;
            }).join(', ') :
            i18n.translate('none');
        return [
            npc.b_i,
            i18n.translate(npc.name), // 直接翻譯 NPC 名稱
            npc.temp ? npc.temp.health : 'N/A',
            npc.temp ? npc.temp.total_defense : 'N/A',
            npc.temp ? npc.temp.total_strength : 'N/A',
            npc.temp ? npc.temp.total_accuracy : 'N/A',
            drops
        ];
    };

    const tableHTML = generateTableHTML(headerKeys, npcBase, rowMapper, i18n.translate);
    container.innerHTML = tableHTML;
}