import i18n from '../i18n.js'; // 導入 i18n 模組
import { getItemSellPrice, formatNumberWithThousandsSeparator } from '../utils.js'; // 導入 getItemSellPrice 和 formatNumberWithThousandsSeparator 函數

export function generateMonsterWorthTable(containerId, npcBase, generateTableHTML, createItemNameMap, itemBase) {
    const container = document.getElementById(containerId);

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

        let cumulativeChance = 1;
        let totalWorth = 0;
        const drops = monster.params.drops.map(drop => {
            const dropName = itemNameMap.get(drop.id) || i18n.translate('unknown_item', drop.id);
            const actualChance = cumulativeChance * drop.chance;
            cumulativeChance *= (1 - drop.chance);

            const itemSellPrice = getItemSellPrice(drop.id, itemBase);
            totalWorth += itemSellPrice * actualChance;

            const dropWorth = itemSellPrice * actualChance;
            const isSignificantDrop = dropWorth > (totalWorth * 0.1);
            const dropText = `${dropName} (${(actualChance * 100).toFixed(6).replace(/\.?0+$/, '')}%)`;
            return isSignificantDrop ? `<span style="color: red;">${dropText}</span>` : dropText;
        }).join(', ');
        
        return [
            monster.b_i,
            i18n.translate(monster.name), // 直接翻譯 Monster 名稱
            monster.temp ? monster.temp.health : 'N/A',
            monster.temp ? monster.temp.total_defense : 'N/A',
            monster.temp ? monster.temp.total_strength : 'N/A',
            monster.temp ? monster.temp.total_accuracy : 'N/A',
            drops,
            formatNumberWithThousandsSeparator(totalWorth.toFixed(2)) // 新增 worth 欄位，並保留兩位小數，應用千分位分隔符號
        ];
    };

    // 獲取開關狀態
    const hideBoss = document.getElementById('hideBossToggle')?.checked || false;
    const hideRare = document.getElementById('hideRareToggle')?.checked || false;
    const hideElite = document.getElementById('hideEliteToggle')?.checked || false;

    const filteredNpcBase = npcBase.filter(monster => {
        // 篩選沒有 drops 資料的對象
        if (!monster.params || !monster.params.drops || monster.params.drops.length === 0) {
            return false;
        }

        const monsterNameLower = monster.name.toLowerCase(); // 直接使用 monster.name 並轉換為小寫

        // 應用過濾邏輯 (不區分大小寫)
        if (hideBoss && monsterNameLower.includes('boss')) {
            return false;
        }
        if (hideRare && monsterNameLower.includes('rare')) {
            return false;
        }
        if (hideElite && monsterNameLower.includes('elite')) {
            return false;
        }

        return true;
    });

    // 先轉換為 rows，並保留原始 monster 與其 worth 值
    const rowsWithWorth = filteredNpcBase.map(monster => {
        let cumulativeChance = 1;
        let totalWorth = 0;
        for (const drop of monster.params.drops) {
            const actualChance = cumulativeChance * drop.chance;
            cumulativeChance *= (1 - drop.chance);
            const itemSellPrice = getItemSellPrice(drop.id, itemBase);
            totalWorth += itemSellPrice * actualChance;
        }
        return { monster, worth: totalWorth };
    });

    // 依 worth 降序排序
    rowsWithWorth.sort((a, b) => b.worth - a.worth);

    // 擷取排序後的 monster 陣列
    const sortedMonsters = rowsWithWorth.map(entry => entry.monster);
    const tableHTML = generateTableHTML(headerKeys, sortedMonsters, rowMapper, i18n.translate);
    container.innerHTML = tableHTML;
}