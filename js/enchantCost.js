import i18n from './i18n.js'; // 導入 i18n 模組
import { getMaterialPrice, getItemSellPrice, formatNumberWithThousandsSeparator, formatAsPercentage, getItemDisplayContent } from './utils.js'; // 導入所需函式

export function generateEnchantCostTableData(containerId, enchantingChances, generateTableHTML, createItemNameMap, itemBase, fletchingFormulas, arrowMaterialImg) {
    const container = document.getElementById(containerId);

    if (!itemBase || !enchantingChances) {
        container.innerHTML = '<p>Item base data or enchanting chances not loaded.</p>';
        return;
    }

    // 獲取 imageSheet 數據
    const imageSheet = window.allData?.imageSheet || null;
    const headers = ['Id', 'Image', 'level', 'Bonuses', 'price', 'plan', 'prod price', 'prod', 'prod id'];
    const data = [];
    const LUCKY_STONE_ID = 593;

    for (const key in itemBase) {
        const item = itemBase[key];
        if (!item || !item.params || !item.params.enchant_id) {
            continue;
        }

        const params = item.params;
        let level = 0;
        const levelKeys = ['min_accuracy', 'min_archery', 'min_defense', 'min_health', 'min_magic', 'min_strength'];
        for (const levelKey of levelKeys) {
            if (params[levelKey]) {
                level = Math.max(level, params[levelKey]);
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
            const scrollName = getItemDisplayContent(plan.combo[0], itemBase, i18n.translate, 'image', imageSheet, fletchingFormulas, arrowMaterialImg);
            const luckyStoneCount = plan.combo[1];
            
            const combo = luckyStoneCount > 0
                ? `${scrollName}+${getItemDisplayContent(LUCKY_STONE_ID, itemBase, i18n.translate, 'image', imageSheet, fletchingFormulas, arrowMaterialImg)}*${luckyStoneCount}`
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
            'name': getItemDisplayContent(parseInt(key), itemBase, i18n.translate, 'image', imageSheet, fletchingFormulas, arrowMaterialImg),
            'level': level,
            'bonus': params.enchant_bonus || 0, // 確保 bonus 為數字，以便 formatAsPercentage 處理
            'price': price,
            'prod price': getItemSellPrice(params.enchant_id, itemBase, window.allData?.npcBase || null),
            'prod name': getItemDisplayContent(params.enchant_id, itemBase, i18n.translate, 'image', imageSheet, fletchingFormulas, arrowMaterialImg),
            'prod id': params.enchant_id,
            'all_plans': filtered_plans
        });
    }

    const rowMapper = (item, index) => {
        const accordionId = `accordion-${item.id}-${index}`;
        const bestPlan = item.all_plans[0]; // 假設第一個方案是最佳方案

        // 參考firelordSet：生成所有可選擇的方案（包括當前選中的）
        const allSelectableOptions = item.all_plans.map((plan, planIndex) => `
            <tr class="plan-option ${planIndex === 0 ? 'selected' : ''}" 
                data-plan-index="${planIndex}"
                data-item-id="${item.id}"
                data-plan-idx="${planIndex}">
                <td>${plan.combo}</td>
                <td>${formatAsPercentage(plan.chance)}</td>
                <td>${formatNumberWithThousandsSeparator(plan.cost)}</td>
            </tr>
        `).join('');

        const planColumnContent = `
            <table class="table table-sm table-bordered mb-0">
                <thead>
                    <tr>
                        <th>${i18n.translate('set')}</th>
                        <th>${i18n.translate('Chance')}</th>
                        <th>${i18n.translate('cost')}</th>
                    </tr>
                </thead>
                <tbody>
                    <tr class="accordion-toggle" data-bs-toggle="collapse" data-bs-target="#${accordionId}" aria-expanded="false" aria-controls="${accordionId}">
                        <td>${bestPlan.combo}</td>
                        <td>${formatAsPercentage(bestPlan.chance)}</td>
                        <td>${formatNumberWithThousandsSeparator(bestPlan.cost)}</td>
                    </tr>
                    <tr>
                        <td colspan="3">
                            <div id="${accordionId}" class="collapse">
                                <table class="table table-sm table-bordered mb-0">
                                    <tbody>
                                        ${allSelectableOptions}
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
                <td>${formatAsPercentage(item.bonus)}</td>
                <td>${formatNumberWithThousandsSeparator(item.price)}</td>
                <td>${planColumnContent}</td>
                <td>${formatNumberWithThousandsSeparator(item['prod price'])}</td>
                <td>${item['prod name']}</td>
                <td>${item['prod id']}</td>
            </tr>
        `;
    };

    const tableHTML = generateTableHTML(headers, data, rowMapper, i18n.translate, true); // Pass true for custom row rendering
    container.innerHTML = tableHTML;

    // --- 參考firelordSet：綁定手風琴和plan選擇事件 ---
    // 綁定手風琴展開/收合事件
    const toggles = container.querySelectorAll('.accordion-toggle');
    toggles.forEach(toggle => {
        toggle.addEventListener('click', (e) => {
            const targetId = toggle.getAttribute('data-bs-target');
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                targetElement.classList.toggle('show');
            }
        });
    });
    
    // 綁定plan選擇事件
    const planOptions = container.querySelectorAll('.plan-option');
    planOptions.forEach(option => {
        option.addEventListener('click', (e) => {
            e.stopPropagation();
            
            const itemId = parseInt(option.getAttribute('data-item-id'));
            const planIndex = parseInt(option.getAttribute('data-plan-idx'));
            
            if (!isNaN(itemId) && !isNaN(planIndex)) {
                // 更新選中狀態的視覺效果
                const parentTable = option.closest('table');
                if (parentTable) {
                    // 移除同一表格中其他選項的selected類
                    parentTable.querySelectorAll('.plan-option').forEach(opt => {
                        opt.classList.remove('selected');
                    });
                    // 為當前選項添加selected類
                    option.classList.add('selected');
                }
                
                // 更新外面的主要顯示區域（accordion-toggle行）
                const accordionContent = option.closest('.collapse');
                if (accordionContent) {
                    // 找到對應的accordion-toggle行
                    const accordionToggle = accordionContent.closest('tr').previousElementSibling;
                    if (accordionToggle && accordionToggle.classList.contains('accordion-toggle')) {
                        // 獲取選中plan的數據
                        const selectedCombo = option.cells[0].innerHTML;
                        const selectedChance = option.cells[1].innerHTML;
                        const selectedCost = option.cells[2].innerHTML;
                        
                        // 更新accordion-toggle行的內容
                        accordionToggle.cells[0].innerHTML = selectedCombo;
                        accordionToggle.cells[1].innerHTML = selectedChance;
                        accordionToggle.cells[2].innerHTML = selectedCost;
                    }
                    
                    // 選擇後收起手風琴
                    accordionContent.classList.remove('show');
                }
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