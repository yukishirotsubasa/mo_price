import i18n from '../i18n.js'; // 導入 i18n 模組

export function generateEnchantingChancesTable(enchantingChances, generateTableHTML, createItemNameMap, itemBase) {
    const container = document.getElementById('enchanting-chances-table-container');
    if (!container) {
        console.error('Enchanting Chances table container not found.');
        return;
    }

    if (!enchantingChances) {
        container.innerHTML = '<p>enchanting chances data not doaded。</p>';
        return;
    }

    const headers = ['type', 'item ID', 'level', 'chance'];

    const data = [];
    // enchantingChances 現在是 Forge 物件
    if (enchantingChances && typeof enchantingChances === 'object') {
        for (const key in enchantingChances) {
            if (key.startsWith('enchantingChances')) {
                const type = key.replace('enchantingChances', ''); // 從鍵名提取類型 (Armor, Weapon, etc.)
                const chances = enchantingChances[key];

                if (typeof chances === 'object' && chances !== null) {
                    for (const itemId in chances) {
                        const chanceFunction = chances[itemId];
                        if (typeof chanceFunction === 'function') {
                            // 這裡我們需要執行函數來獲取機率。由於函數是基於材料等級 'a' 的，
                            // 我們需要決定要顯示哪些材料等級的機率。
                            // 為了簡化，我們假設顯示幾個代表性的材料等級的機率。
                            const materialLevels = [1, 20, 50, 100]; // 範例材料等級
                            materialLevels.forEach(level => {
                                try {
                                    const successRate = chanceFunction(level);
                                    data.push({
                                        type: type,
                                        itemId: itemId,
                                        level: level,
                                        successRate: `${(successRate * 100).toFixed(2)}%`
                                    });
                                } catch (e) {
                                    console.warn(`無法計算 ${type} 物品ID ${itemId} 材料等級 ${level} 的附魔機率:`, e);
                                    data.push({
                                        type: type,
                                        itemId: itemId,
                                        level: level,
                                        successRate: '計算失敗'
                                    });
                                }
                            });
                        }
                    }
                }
            }
        }
    }

    const rowMapper = (item) => {
        return [
            item.type,
            item.itemId,
            item.level,
            item.successRate
        ];
    };

    const tableHTML = generateTableHTML(headers, data, rowMapper, i18n.translate);
    container.innerHTML = tableHTML;
}