import i18n from './i18n.js'; // 導入 i18n 模組
import { getMaterialPrice } from './utils.js'; // 導入 getMaterialPrice 函式

/*for (const i of [0,1,4,7]) {
    for (const j of [1,20,50,100,135]) {
        console.log(getEnchantingPlans(i, j, enchantingChances, itemBase));
    }
}*/

export function generateEnchantCostTableData(containerId, enchantingChances, generateTableHTML, createItemNameMap, itemBase) {
    const container = document.getElementById(containerId);

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
                            const materialLevels = [1, 20, 50, 100, 135]; // 範例材料等級
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

/**
 * 根據裝備槽位、等級計算所有可能的附魔方案及其成本和成功率。
 * @param {number} slot - 裝備槽位 (0:頭, 1:披風, 2:胸甲, 3:盾牌, 4:武器, 6:鞋子, 7:項鍊, 8:戒指, 11:護腿)。
 * @param {number} level - 裝備等級。
 * @param {object} Forge - 包含附魔機率函式的 Forge 物件。
 * @param {object} itemBase - 包含物品基礎價格的物件。
 * @returns {Array<object>} 附魔方案的陣列，每筆物件包含 combo, probability, cost。
 */
export function getEnchantingPlans(slot, level, Forge, itemBase) {
    // 常數宣告
    const LUCKY_STONE_ID = 593; // 幸運石的 item id
    const LUCKY_STONE_PROBABILITY_BONUS = 0.1; // 每顆幸運石使最終成功率 +0.1
    const LUCKY_STONE_MAX_COUNT = 3; // 幸運石的數量範圍為 0 到 3

    // 用於儲存每個機率對應的最低成本組合
    // Map 的 key 是 probability (number)，value 是 { combo: string, cost: number }
    const probabilityMap = new Map();

    // 獲取幸運石的價格
    const luckyStonePrice = getMaterialPrice(LUCKY_STONE_ID, itemBase);

    // 根據 slot 決定要使用的附魔機率類型
    let chancesToUse = null;

    // 根據 slot 的值，決定要從 Forge 物件中選取哪個 enchantingChances 子物件
    if (slot == 1) {
        chancesToUse = Forge.enchantingChancesCapes;
    } else if (slot == 4) {
        chancesToUse = Forge.enchantingChancesWeapon;
    } else if (slot == 7 || slot == 8) {
        chancesToUse = Forge.enchantingChancesJewelry;
    } else if ([0, 2, 3, 6, 11].includes(slot)) {
        chancesToUse = Forge.enchantingChancesArmor;
    } else {
        // 如果 slot 不符合任何已知類型，則返回空陣列並發出警告
        console.warn(`未知的 slot 類型: ${slot}，無法獲取附魔機率。`);
        return [];
    }

    // 確保選定的附魔機率物件存在且為物件類型
    if (!chancesToUse || typeof chancesToUse !== 'object') {
        console.warn(`無法找到 slot ${slot} 對應的附魔機率數據。`);
        return [];
    }

    // 遍歷選定類型下的所有卷軸 item id 及其對應的機率函式
    for (const scrollId in chancesToUse) {
        const chanceFunction = chancesToUse[scrollId];

        if (typeof chanceFunction === 'function') {
            // 計算該卷軸的基礎成功率
            const baseProbability = chanceFunction(level);

            // 獲取卷軸的價格
            const scrollPrice = getMaterialPrice(parseInt(scrollId), itemBase);

            // 枚舉幸運石數量 (0 到 3)
            for (let count = 0; count <= LUCKY_STONE_MAX_COUNT; count++) {
                // 計算最終成功率
                // 將機率四捨五入到小數點後兩位，以避免浮點數比較問題
                const finalProbability = parseFloat((baseProbability + LUCKY_STONE_PROBABILITY_BONUS * count).toFixed(2));

                // 計算組合成本
                const comboCost = scrollPrice + luckyStonePrice * count;

                // 構建組合字串
                let comboString = `卷軸 ${scrollId}`;
                if (count > 0) {
                    comboString += ` + 幸運石*${count}`;
                }

                // 檢查 probabilityMap 中是否已存在此 finalProbability
                if (!probabilityMap.has(finalProbability)) {
                    // 如果不存在，則直接添加
                    probabilityMap.set(finalProbability, {
                        combo: comboString,
                        probability: finalProbability,
                        cost: comboCost
                    });
                } else {
                    // 如果存在，比較現有成本和新組合成本，保留成本較低者
                    const existingPlan = probabilityMap.get(finalProbability);
                    if (comboCost < existingPlan.cost) {
                        probabilityMap.set(finalProbability, {
                            combo: comboString,
                            probability: finalProbability,
                            cost: comboCost
                        });
                    }
                }
            }
        }
    }

    // 將 Map 中的值轉換為陣列
    let result = Array.from(probabilityMap.values());

    // 排序結果：先依成功率由高到低，若機率相同再依成本由低到高
    result.sort((a, b) => {
        if (b.probability !== a.probability) {
            return b.probability - a.probability; // 成功率由高到低
        }
        return a.cost - b.cost; // 成本由低到高
    });

    // --- 新增規則：機率低的成本不能比機率高的成本高 ---
    const filteredResult = [];
    let minCostForHigherOrEqualProbability = Infinity; // 追蹤到目前為止所見的最高或相等機率方案中的最低成本

    for (const currentPlan of result) {
        // 如果當前方案的成本大於已知的最高或相等機率方案的最低成本，則捨棄此方案
        if (currentPlan.cost > minCostForHigherOrEqualProbability) {
            // 捨棄此方案，因為其機率較低（或相等），但成本卻更高
            continue;
        } else {
            // 否則，此方案是有效的，將其添加到新的結果陣列中
            filteredResult.push(currentPlan);
            // 更新 minCostForHigherOrEqualProbability，確保它始終是當前或更高機率方案中的最低成本
            minCostForHigherOrEqualProbability = Math.min(minCostForHigherOrEqualProbability, currentPlan.cost);
        }
    }

    return filteredResult;
}