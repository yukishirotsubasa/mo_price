import i18n from './i18n.js'; // 導入 i18n 模組
import { getMaterialPrice, getItemSellPrice } from './utils.js'; // 導入所需函式

function testEnchantPlan(enchantingChances, itemBase) {
    for (const i of [0,1,4,7]) {
        for (const j of [1,20,50,100,135]) {
            console.log(getEnchantingPlans(i, j, enchantingChances, itemBase));
        }
    }
}

export function generateEnchantCostTableData(containerId, enchantingChances, generateTableHTML, createItemNameMap, itemBase) {
    const container = document.getElementById(containerId);

    if (!itemBase || !enchantingChances) {
        container.innerHTML = '<p>Item base data or enchanting chances not loaded.</p>';
        return;
    }

    const headers = ['id', 'name', 'level', 'bonus', 'price', 'plan', 'prod price', 'prod name', 'prod id'];
    const data = [];
    const LUCKY_STONE_ID = 593;

    for (const key in itemBase) {
        const item = itemBase[key];
        if (!item || !item.params || !item.params.enchant_id) {
            continue;
        }

        const params = item.params;
        let level = 0;
        const levelKeys = ['min_accuracy', 'min_archery', 'min_defense', 'min_health', 'min_magic', 'min_strength', 'min_jewelry'];
        for (const levelKey of levelKeys) {
            if (params[levelKey]) {
                level = params[levelKey];
                break;
            }
        }

        let slot = params.slot;
        if (slot === 3 && item.b_t === 3) {
            slot = 7;
        }

        const plans = getEnchantingPlans(slot, level, enchantingChances, itemBase);
        const price = getMaterialPrice(key, itemBase);

        if (!plans || plans.length === 0) {
            continue;
        }

        const all_plans = plans.map(plan => {
            const scrollName = i18n.translate(itemBase[plan.combo[0]].name);
            const luckyStoneCount = plan.combo[1];
            
            const combo = luckyStoneCount > 0
                ? `${scrollName}+${i18n.translate(itemBase[LUCKY_STONE_ID].name)}*${luckyStoneCount}`
                : scrollName;
                
            const chance = Math.min(1, plan.probability + (params.enchant_bonus || 0));
            const cost = chance > 0 ? (plan.cost + price) / chance : Infinity;

            return {
                ...plan,
                combo,
                chance,
                cost
            };
        });

        // --- 新增過濾邏輯 ---
        // 當多個附魔方案的 chance（成功率）相同時，只保留其中 cost（期望成本）最低的那一個。
        const bestPlansByChance = new Map();
        all_plans.forEach(plan => {
            if (!bestPlansByChance.has(plan.chance) || plan.cost < bestPlansByChance.get(plan.chance).cost) {
                bestPlansByChance.set(plan.chance, plan);
            }
        });

        // 從 Map 中取出所有值，形成一個新的、已過濾的 all_plans 陣列
        let filtered_plans = Array.from(bestPlansByChance.values());

        // 對這個新的 all_plans 陣列進行最終的成本排序
        filtered_plans.sort((a, b) => a.cost - b.cost);

        if (filtered_plans.length === 0) {
            return;
        }

        const bestPlan = filtered_plans[0];

        data.push({
            'id': key,
            'name': i18n.translate(item.name),
            'level': level,
            'bonus': params.enchant_bonus || '',
            'price': price,
            'prod price': getItemSellPrice(params.enchant_id, itemBase),
            'prod name': i18n.translate(itemBase[params.enchant_id].name),
            'prod id': params.enchant_id,
            'all_plans': filtered_plans
        });
    }

    const rowMapper = (item, index) => {
        const accordionId = `accordion-${item.id}-${index}`;
        const bestPlan = item.all_plans[0]; // 假設第一個方案是最佳方案

        const otherPlansBody = item.all_plans.slice(1).map(plan => `
            <tr>
                <td>${plan.combo}</td>
                <td>${(plan.chance * 100).toFixed(2)}%</td>
                <td>${plan.cost.toFixed(2)}</td>
            </tr>
        `).join('');

        const planColumnContent = `
            <table class="table table-sm table-bordered mb-0">
                <thead>
                    <tr>
                        <th>${i18n.translate('combo')}</th>
                        <th>${i18n.translate('chance')}</th>
                        <th>${i18n.translate('cost')}</th>
                    </tr>
                </thead>
                <tbody>
                    <tr class="accordion-toggle" data-bs-toggle="collapse" data-bs-target="#${accordionId}" aria-expanded="false" aria-controls="${accordionId}">
                        <td>${bestPlan.combo}</td>
                        <td>${(bestPlan.chance * 100).toFixed(2)}%</td>
                        <td>${bestPlan.cost.toFixed(2)}</td>
                    </tr>
                    <tr>
                        <td colspan="3">
                            <div id="${accordionId}" class="collapse">
                                <table class="table table-sm table-bordered mb-0">
                                    <tbody>
                                        ${otherPlansBody}
                                    </tbody>
                                </table>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
        `;

        return `
            <tr>
                <td>${item.id}</td>
                <td>${item.name}</td>
                <td>${item.level}</td>
                <td>${item.bonus}</td>
                <td>${item.price.toFixed(2)}</td>
                <td>${planColumnContent}</td>
                <td>${item['prod price'].toFixed(2)}</td>
                <td>${item['prod name']}</td>
                <td>${item['prod id']}</td>
            </tr>
        `;
    };

    const tableHTML = generateTableHTML(headers, data, rowMapper, i18n.translate, true); // Pass true for custom row rendering
    container.innerHTML = tableHTML;

    // --- 新增手風琴功能修復 ---
    // 手動綁定點擊事件來觸發 Bootstrap 的 collapse 功能
    const toggles = container.querySelectorAll('.accordion-toggle');
    toggles.forEach(toggle => {
        toggle.addEventListener('click', () => {
            const targetId = toggle.getAttribute('data-bs-target');
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                targetElement.classList.toggle('show');
            }
        });
    });
}

/**
 * 根據裝備槽位、等級計算所有可能的附魔方案及其成本和成功率。
 * @param {number} slot - 裝備槽位 (0:頭, 1:披風, 2:胸甲, 3:盾牌, 4:武器, 5:手套, 6:鞋子, 7:項鍊, 8:戒指, 11:護腿)。
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
    } else if ([0, 2, 3, 5, 6, 11].includes(slot)) {
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

                // 構建組合陣列
                const combo = [parseInt(scrollId), count];

                // 檢查 probabilityMap 中是否已存在此 finalProbability
                if (!probabilityMap.has(finalProbability)) {
                    // 如果不存在，則直接添加
                    probabilityMap.set(finalProbability, {
                        combo: combo,
                        probability: finalProbability,
                        cost: comboCost
                    });
                } else {
                    // 如果存在，比較現有成本和新組合成本，保留成本較低者
                    const existingPlan = probabilityMap.get(finalProbability);
                    if (comboCost < existingPlan.cost) {
                        probabilityMap.set(finalProbability, {
                            combo: combo,
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