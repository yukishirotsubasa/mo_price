import i18n from '../i18n.js';
import { getItemSellPrice, createItemNameMap, formatNumberWithThousandsSeparator } from '../utils.js';

/**
 * 生成繁殖成本表格
 * @param {string} containerId - 容器元素的 ID
 * @param {Array} pets - 寵物數據
 * @param {Array} itemBase - 物品基礎數據
 */
export function generateBreedingCostTable(containerId, pets, itemBase) {
    const container = document.getElementById(containerId);
    
    if (!container) {
        console.error(`找不到 ID 為 ${containerId} 的容器元素。`);
        return;
    }

    // 檢查寵物數據是否可用
    if (!pets || !Array.isArray(pets) || pets.length === 0) {
        container.innerHTML = `<p>${i18n.translate('pet data not loaded or unavailable')}</p>`;
        return;
    }

    if (!itemBase || !Array.isArray(itemBase)) {
        container.innerHTML = `<p>${i18n.translate('item data not loaded')}</p>`;
        return;
    }

    // 轉換寵物數據為可以通過 ID 直接訪問的格式，只保留能飼養的pets（有likes內容的）
    const petsById = {};
    pets.forEach(pet => {
        if (pet && pet.b_i !== undefined && pet.params && pet.params.likes && Array.isArray(pet.params.likes) && pet.params.likes.length > 0) {
            petsById[pet.b_i] = pet;
        }
    });

    // 創建物品名稱映射
    const itemNameMap = createItemNameMap(itemBase, i18n.translate);
    
    // 生成所有可能的繁殖組合
    const breedingCombinations = generateBreedingCombinations(petsById, itemBase, pets);
    
    if (breedingCombinations.length === 0) {
        container.innerHTML = `<p>${i18n.translate('no available breeding combinations')}</p>`;
        return;
    }

    // 按 level 遞增排序
    breedingCombinations.sort((a, b) => a.level - b.level);

    // 生成表格 HTML
    let tableHTML = '<table class="breeding-table"><thead><tr>';
    tableHTML += `<th>${i18n.translate('level')}</th>`;
    tableHTML += `<th style="width: 200px;">${i18n.translate('parent1')}</th>`;
    tableHTML += `<th style="width: 200px;">${i18n.translate('parent2')}</th>`;
    tableHTML += `<th>${i18n.translate('plan')}</th>`;
    tableHTML += `<th>${i18n.translate('cost')}</th>`;
    tableHTML += `<th>${i18n.translate('one bar')}</th>`;
    tableHTML += `<th>${i18n.translate('full')}</th>`;
    tableHTML += `<th>${i18n.translate('comp')}</th>`;
    tableHTML += `<th>${i18n.translate('exp')}</th>`;
    tableHTML += '</tr></thead><tbody>';

    breedingCombinations.forEach((combination, index) => {
        const { parent1, parent2, level, plan, oneBar, full, comp, exp, cost } = combination;
        
        tableHTML += '<tr>';
        tableHTML += `<td>${level}</td>`;
        tableHTML += `<td>${generateParentInfo(parent1, itemNameMap)}</td>`;
        tableHTML += `<td>${generateParentInfo(parent2, itemNameMap)}</td>`;
        tableHTML += `<td>${generatePlanInfo(plan, pets, itemBase, index)}</td>`;
        tableHTML += `<td>${cost}</td>`;
        tableHTML += `<td>${oneBar}</td>`;
        tableHTML += `<td>${full}</td>`;
        tableHTML += `<td>${comp}</td>`;
        tableHTML += `<td>${exp}</td>`;
        tableHTML += '</tr>';
    });

    tableHTML += '</tbody></table>';
    container.innerHTML = tableHTML;
    
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
 * 生成所有可能的繁殖組合
 * @param {Object} petsById - 按 ID 索引的寵物數據
 * @param {Array} itemBase - 物品基礎數據
 * @param {Array} originalPets - 原始寵物數據陣列
 * @returns {Array} 繁殖組合數組
 */
function generateBreedingCombinations(petsById, itemBase, originalPets) {
    const combinations = [];
    const completedCache = new Set(); // 已完成的暫存器
    
    // 使用 forEach 來遍歷剩餘對象，此對象當作 parent1
    Object.values(petsById).forEach(parent1 => {
        if (!parent1 || !parent1.params || !parent1.params.likes) return;
        
        // 使用 parent1 的 pets[].params.likes[]，裡面可有多個對象
        parent1.params.likes.forEach(like => {
            const parent2Id = like.pet_id;
            const parent2 = petsById[parent2Id];
            
            // 確認 parent2 不在已完成的暫存器裡，若在暫存器裡則不再重複使用
            if (!parent2 || completedCache.has(parent2Id)) return;
            
            // 將 parent1 和 parent2 作為一列資料
            const combination = calculateBreedingCombination(parent1, parent2, like, null, itemBase, originalPets);
            if (combination) {
                combinations.push(combination);
            }
        });
        
        // 將 parent1 加入已完成的暫存器裡
        completedCache.add(parent1.b_i);
    });
    
    return combinations;
}

/**
 * 計算繁殖組合的詳細信息
 * @param {Object} parent1 - 父寵物1
 * @param {Object} parent2 - 父寵物2
 * @param {Object} activeLike - 有效的喜好關係
 * @param {Object} unused - 未使用參數（保持兼容性）
 * @param {Array} itemBase - 物品基礎數據
 * @param {Array} originalPets - 原始寵物數據陣列
 * @returns {Object} 繁殖組合信息
 */
function calculateBreedingCombination(parent1, parent2, activeLike, unused, itemBase, originalPets) {
    // level: 取兩隻寵物的最大等級
    const level = Math.max(parent1.params.breeding_level || 0, parent2.params.breeding_level || 0);
    
    // 計算 plan (使用有效的 likes 關係)
    const plan = activeLike ? calculateOptimalPlan(activeLike, itemBase, originalPets) : null;
    
    // one bar: pets[parent1].params.eat_interval | pets[parent2].params.eat_interval，尾巴敘述加上min
    const oneBar = `${parent1.params.eat_interval || 0} | ${parent2.params.eat_interval || 0} (min)`;
    
    // full: pets[parent1].params.happiness-pets[parent1].params.eat_interval | pets[parent2].params.happiness-pets[parent2].params.insurance_cost，尾巴敘述加上min
    const full1 = (parent1.params.happiness || 0) - (parent1.params.eat_interval || 0);
    const full2 = (parent2.params.happiness || 0) - (parent2.params.eat_interval || 0);
    const full = `${full1} | ${full2} (min)`;
    
    // comp: pets[parent1].params.happiness | pets[parent2].params.happiness，尾巴敘述加上min
    const comp = `${parent1.params.happiness || 0} | ${parent2.params.happiness || 0} (min)`;
    
    // exp: pets[parent1].params.likes[parent2].xp
    const exp = activeLike ? activeLike.xp || 0 : 0;
    
    // cost: parent1的insurance_cost[0]和getItemSellPrice(parent1的pets[].params.item_id,item_base)*0.25取小的
    // + parent2的insurance_cost[0]和getItemSellPrice(parent2的pets[].params.item_id,item_base)*0.25取小的
    const parent1InsuranceCost = parent1.params.insurance_cost ? parent1.params.insurance_cost[0] : 0;
    const parent1ItemPrice = parent1.params.item_id ? getItemSellPrice(parent1.params.item_id, itemBase) * 0.25 : 0;
    const parent1Cost = Math.min(parent1InsuranceCost, parent1ItemPrice);
    
    const parent2InsuranceCost = parent2.params.insurance_cost ? parent2.params.insurance_cost[0] : 0;
    const parent2ItemPrice = parent2.params.item_id ? getItemSellPrice(parent2.params.item_id, itemBase) * 0.25 : 0;
    const parent2Cost = Math.min(parent2InsuranceCost, parent2ItemPrice);
    
    const totalCost = parent1Cost + parent2Cost;
    const cost = `${formatNumberWithThousandsSeparator(parent1Cost)}+${formatNumberWithThousandsSeparator(parent2Cost)}=${formatNumberWithThousandsSeparator(totalCost)}`;
    
    return {
        parent1,
        parent2,
        level,
        plan,
        oneBar,
        full,
        comp,
        exp,
        cost
    };
}

/**
 * 計算最優繁殖計劃
 * @param {Object} like - 喜好關係
 * @param {Array} itemBase - 物品基礎數據
 * @param {Array} originalPets - 原始寵物數據陣列
 * @returns {Array} 最優計劃數組
 */
function calculateOptimalPlan(like, itemBase, originalPets) {
    if (!like.returns || !Array.isArray(like.returns)) {
        return [];
    }
    
    const plans = [];
    
    // 計算所有可能的修正機率組合
    for (let adjustment = 0; adjustment <= getMaxAdjustment(like.returns); adjustment++) {
        const planData = {
            adjustment,
            items: [],
            totalValue: 0
        };
        
        like.returns.forEach(returnItem => {
            // 原始資料為機率（0.6 = 60%），需要轉換為百分比
            const baseChancePercent = (returnItem.base_chance || 0) * 100;
            const maxChancePercent = (returnItem.max_chance || 0) * 100;
            
            const adjustedChancePercent = Math.min(
                baseChancePercent + adjustment,
                maxChancePercent
            );
            
            // 根據需求，使用 pets[item.pet_id].params.item_id 來查找價格
            // 首先找到對應的寵物，然後使用其 item_id 來查找價格
            const pet = originalPets[returnItem.pet_id];
            const itemId = pet?.params?.item_id;
            const itemPrice = itemId ? getItemSellPrice(itemId, itemBase) : 0;
            const expectedValue = (adjustedChancePercent / 100) * itemPrice;
            
            planData.items.push({
                ...returnItem,
                baseChancePercent,
                maxChancePercent,
                adjustedChance: adjustedChancePercent,
                itemPrice,
                expectedValue
            });
            
            planData.totalValue += expectedValue;
        });
        
        plans.push(planData);
    }
    
    // 按總價值排序，返回最優解
    plans.sort((a, b) => b.totalValue - a.totalValue);
    return plans;
}

/**
 * 獲取最大修正機率
 * @param {Array} returns - 返回物品數組
 * @returns {number} 最大修正機率
 */
function getMaxAdjustment(returns) {
    let maxAdjustment = 0;
    returns.forEach(returnItem => {
        // 原始資料為機率，轉換為百分比後計算差值
        const baseChancePercent = (returnItem.base_chance || 0) * 100;
        const maxChancePercent = (returnItem.max_chance || 0) * 100;
        const adjustment = maxChancePercent - baseChancePercent;
        maxAdjustment = Math.max(maxAdjustment, adjustment);
    });
    return maxAdjustment;
}

/**
 * 生成父寵物信息的 HTML
 * @param {Object} parent - 父寵物
 * @param {Map} itemNameMap - 物品名稱映射
 * @returns {string} HTML 字符串
 */
function generateParentInfo(parent, itemNameMap) {
    let html = '<div class="parent-info-table">';
    html += '<table class="parent-table">';
    
    // 第1列：寵物名稱
    html += '<tr>';
    html += `<td class="pet-name" colspan="100%">${i18n.translate(parent.name || 'Unknown Pet')}</td>`;
    html += '</tr>';
    
    // 第2列：保險成本
    const insuranceCost = parent.params.insurance_cost || [0, 0];
    html += '<tr>';
    html += `<td class="insurance-cost" colspan="100%">${insuranceCost[0]} coins / ${insuranceCost[1]} mos</td>`;
    html += '</tr>';
    
    // 第3列：食物消耗 - 所有食物放在同一列不同欄
    const eats = parent.params.eats || {};
    const eatInterval = parent.params.eat_interval || 1;
    
    if (Object.keys(eats).length > 0) {
        html += '<tr>';
        Object.entries(eats).forEach(([itemId, value]) => {
            const itemName = itemNameMap.get(Number(itemId)) || `Unknown Item ${itemId}`;
            const totalConsumption = (value * eatInterval).toFixed(2);
            html += `<td class="food-item">${itemName}(${totalConsumption})</td>`;
        });
        html += '</tr>';
    }
    
    html += '</table>';
    html += '</div>';
    return html;
}

/**
 * 生成計劃信息的 HTML
 * @param {Array} plans - 計劃數組
 * @param {Array} originalPets - 原始寵物數據陣列
 * @param {Array} itemBase - 物品基礎數據
 * @param {number} index - 組合索引
 * @returns {string} HTML 字符串
 */
function generatePlanInfo(plans, originalPets, itemBase, index) {
    if (!plans || plans.length === 0) {
        return `<div class="no-plan">${i18n.translate('no available plans')}</div>`;
    }
    
    // 按總價值排序，最優解在最上方
    const sortedPlans = [...plans].sort((a, b) => b.totalValue - a.totalValue);
    const bestPlan = sortedPlans[0];
    
    const accordionId = `plan-accordion-${index}`;
    
    // 构建其他计划的行
    const otherPlansBody = sortedPlans.slice(1).map(plan => {
        let row = `<tr><td>+${plan.adjustment}</td>`;
        
        plan.items.forEach(item => {
            const pet = originalPets[item.pet_id];
            const petName = pet ? i18n.translate(pet.name || 'Unknown Pet') : `Pet ${item.pet_id}`;
            row += `<td>${petName}(${item.adjustedChance.toFixed(1)}% | ${formatNumberWithThousandsSeparator(item.itemPrice)})</td>`;
        });
        
        row += `<td>${formatNumberWithThousandsSeparator(plan.totalValue.toFixed(2))}</td></tr>`;
        return row;
    }).join('');
    
    // 构建表格HTML，参考enchantCost的方式
    let html = `
        <table class="table table-sm table-bordered mb-0">
            <tbody>
                <tr class="accordion-toggle" data-bs-toggle="collapse" data-bs-target="#${accordionId}" aria-expanded="false" aria-controls="${accordionId}">
                    <td>+${bestPlan.adjustment}</td>`;
    
    // 最佳计划的数据
    bestPlan.items.forEach(item => {
        const pet = originalPets[item.pet_id];
        const petName = pet ? i18n.translate(pet.name || 'Unknown Pet') : `Pet ${item.pet_id}`;
        html += `<td>${petName}(${item.adjustedChance.toFixed(1)}% | ${formatNumberWithThousandsSeparator(item.itemPrice)})</td>`;
    });
    
    html += `<td>${formatNumberWithThousandsSeparator(bestPlan.totalValue.toFixed(2))}</td>
                </tr>`;
    
    // 如果有其他计划，添加折叠内容
    if (sortedPlans.length > 1) {
        html += `
                <tr>
                    <td colspan="${bestPlan.items.length + 2}">
                        <div id="${accordionId}" class="collapse">
                            <table class="table table-sm table-bordered mb-0">
                                <tbody>
                                    ${otherPlansBody}
                                </tbody>
                            </table>
                        </div>
                    </td>
                </tr>`;
    }
    
    html += `
            </tbody>
        </table>`;
    
    return html;
}


