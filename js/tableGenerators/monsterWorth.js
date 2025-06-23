import i18n from '../i18n.js'; // 導入 i18n 模組

export function generateMonsterWorthTable(npcBase, generateTableHTML, createItemNameMap, itemBase) {
    const container = document.getElementById('monster-worth-page-content');
    if (!container) {
        console.error('Monster Worth table container not found.');
        return;
    }

    if (!npcBase) {
        container.innerHTML = `<p>${i18n.translate('monster_worth_data_not_loaded')}</p>`;
        return;
    }

    const itemNameMap = createItemNameMap(itemBase, i18n.translate);

    // 使用 i18n.translate 翻譯表頭
    const headerKeys = ['id', 'name', 'health', 'defense', 'strength', 'accuracy', 'drops', 'worth'];

    const rowMapper = (monster) => {
        // 篩選沒有 drops 資料的對象
        if (!monster.params || !monster.params.drops || monster.params.drops.length === 0) {
            return null; // 返回 null 表示跳過此行
        }

        const drops = monster.params.drops.map(drop => {
            const dropName = itemNameMap.get(drop.id) || i18n.translate('unknown_item', drop.id);
            return `${dropName} (${(drop.chance * 100).toFixed(6).replace(/\.?0+$/, '')}%)`;
        }).join(', ');
        
        return [
            monster.b_i,
            i18n.translate(monster.name), // 直接翻譯 Monster 名稱
            monster.temp ? monster.temp.health : 'N/A',
            monster.temp ? monster.temp.total_defense : 'N/A',
            monster.temp ? monster.temp.total_strength : 'N/A',
            monster.temp ? monster.temp.total_accuracy : 'N/A',
            drops,
            monster.worth ? monster.worth : 'N/A' // 新增 worth 欄位
        ];
    };

    const filteredNpcBase = npcBase.filter(monster =>
        monster.params && monster.params.drops && monster.params.drops.length > 0
    );
    const tableHTML = generateTableHTML(headerKeys, filteredNpcBase, rowMapper, i18n.translate);
    container.innerHTML = tableHTML;
}