// js/tableGenerators/fireloadSet.js - Fireload Set 功能
import i18n from '../i18n.js';
import { getMaterialPrice, getItemSellPrice, formatNumberWithThousandsSeparator, formatAsPercentage, getItemDisplayContent } from '../utils.js';
import { getEnchantingPlans } from '../enchantCost.js';

/**
 * 生成 Fireload Set 表格數據
 * @param {string} containerId - 容器ID
 * @param {object} itemBase - 物品基礎數據
 * @param {function} generateTableHTML - 生成表格HTML的函數
 * @param {function} createItemNameMap - 創建物品名稱映射的函數
 */
export function generateFireloadSetTableData(containerId, itemBase, generateTableHTML, createItemNameMap) {
    // 將generateTableHTML存儲為全局變量，供按鈕事件使用
    window.generateTableHTML = generateTableHTML;
    
    // 初始化選擇狀態管理
    if (!window.fireloadSetState) {
        window.fireloadSetState = {
            selectedPlans: new Map(), // Map<itemId, selectedPlanIndex>
            enchantChain: [],
            itemBase: null,
            imageSheet: null,
            enchantingChances: null
        };
    }
    
    const container = document.getElementById(containerId);
    const buttonContainer = document.getElementById('fireload-set-button-container');
    
    if (!itemBase) {
        container.innerHTML = '<p>Item base data not loaded.</p>';
        return;
    }

    // 獲取enchantingChances數據
    const enchantingChances = window.allData?.forge || null;
    if (!enchantingChances) {
        container.innerHTML = '<p>Enchanting chances data not loaded.</p>';
        return;
    }

    // 目標道具ID [357, 354]
    const targetItems = [357, 354];
    
    // 獲取 imageSheet 數據
    const imageSheet = window.allData?.imageSheet || null;
    
    // 更新全局狀態
    window.fireloadSetState.itemBase = itemBase;
    window.fireloadSetState.imageSheet = imageSheet;
    window.fireloadSetState.enchantingChances = enchantingChances;
    
    // 創建按鈕區域
    createTargetItemButtons(buttonContainer, targetItems, itemBase, imageSheet, enchantingChances, generateTableHTML);
    
    // 初始化顯示第一個目標道具的表格
    if (targetItems.length > 0) {
        generateEnchantChainTable(container, targetItems[0], itemBase, generateTableHTML, imageSheet, enchantingChances);
    }
}

/**
 * 創建目標道具按鈕
 * @param {HTMLElement} buttonContainer - 按鈕容器
 * @param {Array} targetItems - 目標道具ID數組
 * @param {object} itemBase - 物品基礎數據
 * @param {object} imageSheet - 圖片數據
 */
function createTargetItemButtons(buttonContainer, targetItems, itemBase, imageSheet, enchantingChances, generateTableHTML) {
    if (!buttonContainer) return;
    
    buttonContainer.innerHTML = '';
    
    targetItems.forEach((itemId, index) => {
        const item = itemBase[itemId];
        if (!item) return;
        
        const button = document.createElement('button');
        button.className = `fireload-set-target-btn ${index === 0 ? 'active' : ''}`;
        button.setAttribute('data-item-id', itemId);
        
        // 使用道具圖片作為按鈕內容
        const itemDisplay = getItemDisplayContent(itemId, itemBase, i18n.translate, 'image', imageSheet);
        button.innerHTML = itemDisplay;
        
        // 添加點擊事件
        button.addEventListener('click', () => {
            // 移除其他按鈕的active狀態
            buttonContainer.querySelectorAll('.fireload-set-target-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            
            // 添加當前按鈕的active狀態
            button.classList.add('active');
            
            // 生成對應的表格
            const tableContainer = document.getElementById('fireload-set-table-container');
            generateEnchantChainTable(tableContainer, itemId, itemBase, generateTableHTML, imageSheet, enchantingChances);
        });
        
        buttonContainer.appendChild(button);
    });
}

/**
 * 生成附魔鏈表格
 * @param {HTMLElement} container - 表格容器
 * @param {number} startItemId - 起始道具ID
 * @param {object} itemBase - 物品基礎數據
 * @param {function} generateTableHTML - 生成表格HTML的函數
 * @param {object} imageSheet - 圖片數據
 */
function generateEnchantChainTable(container, startItemId, itemBase, generateTableHTML, imageSheet, enchantingChances) {
    if (!container) return;
    
    // 獲取附魔鏈
    const enchantChain = getEnchantChain(startItemId, itemBase);
    
    if (enchantChain.length === 0) {
        container.innerHTML = '<p>No enchant chain found for this item.</p>';
        return;
    }
    
    // 更新全局狀態中的enchant chain
    window.fireloadSetState.enchantChain = enchantChain;
    
    // 完全仿照enchantCost的表格結構
    const headers = ['id', 'name', 'level', 'bonus', 'price', 'plan', 'prod price', 'prod name', 'prod id'];
    const data = [];
    
    enchantChain.forEach((itemId, index) => {
        const item = itemBase[itemId];
        if (!item) return;
        
        const params = item.params;
        const enchantTargetId = params?.enchant_id;
        
        // 只顯示有enchant_id的項目，最後一個沒有enchant_id的不顯示
        if (!enchantTargetId) return;
        
        let level = 0;
        const levelKeys = ['min_accuracy', 'min_archery', 'min_defense', 'min_health', 'min_magic', 'min_strength', 'min_jewelry'];
        for (const levelKey of levelKeys) {
            if (params[levelKey]) {
                level = params[levelKey];
                break;
            }
        }
        
        // 計算price：第一行使用原始price，後續行使用上一行選中plan的cost
        let price;
        if (data.length === 0) {
            // 第一行：使用原始材料價格
            price = getMaterialPrice(itemId, itemBase);
        } else {
            // 後續行：需要計算上一行選中plan的cost
            const previousItemId = enchantChain[data.length - 1];
            const previousItem = itemBase[previousItemId];
            
            if (previousItem && previousItem.params) {
                const previousParams = previousItem.params;
                
                // 計算上一行的level和slot
                let previousLevel = 0;
                const levelKeys = ['min_accuracy', 'min_archery', 'min_defense', 'min_health', 'min_magic', 'min_strength', 'min_jewelry'];
                for (const levelKey of levelKeys) {
                    if (previousParams[levelKey]) {
                        previousLevel = previousParams[levelKey];
                        break;
                    }
                }
                
                let previousSlot = previousParams.slot;
                if (previousSlot === 3 && previousItem.b_t === 3) {
                    previousSlot = 7;
                }
                
                // 計算上一行的price（遞歸）
                let previousPrice;
                if (data.length === 1) {
                    previousPrice = getMaterialPrice(previousItemId, itemBase);
                } else {
                    // 獲取上上一行的選中plan cost
                    const prevPrevRowData = data[data.length - 2];
                    const prevPrevSelectedPlanIndex = window.fireloadSetState.selectedPlans.get(prevPrevRowData.id) || 0;
                    const prevPrevSelectedPlan = prevPrevRowData.all_plans[prevPrevSelectedPlanIndex];
                    previousPrice = prevPrevSelectedPlan ? prevPrevSelectedPlan.cost : getMaterialPrice(previousItemId, itemBase);
                }
                
                // 計算上一行的plans
                const previousPlans = getEnchantingPlans(previousSlot, previousLevel, enchantingChances, itemBase);
                if (previousPlans && previousPlans.length > 0) {
                    const LUCKY_STONE_ID = 593;
                    
                    const previousAllPlans = previousPlans.map(plan => {
                        const scrollName = getItemDisplayContent(plan.combo[0], itemBase, i18n.translate, 'image', imageSheet);
                        const luckyStoneCount = plan.combo[1];
                        
                        const combo = luckyStoneCount > 0
                            ? `${scrollName}+${getItemDisplayContent(LUCKY_STONE_ID, itemBase, i18n.translate, 'image', imageSheet)}*${luckyStoneCount}`
                            : scrollName;
                            
                        const chance = Math.min(1, plan.probability + (previousParams.enchant_bonus || 0));
                        const cost = chance > 0 ? (plan.cost + previousPrice) / chance : Infinity;

                        return {
                            ...plan,
                            combo,
                            chance,
                            cost
                        };
                    });

                    const previousBestPlansByChance = new Map();
                    previousAllPlans.forEach(plan => {
                        if (!previousBestPlansByChance.has(plan.chance) || plan.cost < previousBestPlansByChance.get(plan.chance).cost) {
                            previousBestPlansByChance.set(plan.chance, plan);
                        }
                    });

                    const previousFilteredPlans = Array.from(previousBestPlansByChance.values());
                    previousFilteredPlans.sort((a, b) => a.cost - b.cost);
                    
                    const previousSelectedPlanIndex = window.fireloadSetState.selectedPlans.get(previousItemId) || 0;
                    const previousSelectedPlan = previousFilteredPlans[previousSelectedPlanIndex] || previousFilteredPlans[0];
                    
                    price = previousSelectedPlan ? previousSelectedPlan.cost : getMaterialPrice(itemId, itemBase);
                } else {
                    price = getMaterialPrice(itemId, itemBase);
                }
            } else {
                price = getMaterialPrice(itemId, itemBase);
            }
        }
        
        const targetPrice = getItemSellPrice(enchantTargetId, itemBase);
        
        // 完全仿照enchantCost的plan欄位結構
        let slot = params.slot;
        if (slot === 3 && item.b_t === 3) {
            slot = 7;
        }

        const plans = getEnchantingPlans(slot, level, enchantingChances, itemBase);
        
        let planContent;
        let filtered_plans = []; // 在外層聲明
        
        if (!plans || plans.length === 0) {
            planContent = '<div class="no-plans">No enchanting plans available</div>';
        } else {
            const LUCKY_STONE_ID = 593;
            
            const all_plans = plans.map(plan => {
                const scrollName = getItemDisplayContent(plan.combo[0], itemBase, i18n.translate, 'image', imageSheet);
                const luckyStoneCount = plan.combo[1];
                
                const combo = luckyStoneCount > 0
                    ? `${scrollName}+${getItemDisplayContent(LUCKY_STONE_ID, itemBase, i18n.translate, 'image', imageSheet)}*${luckyStoneCount}`
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

            // 過濾邏輯：當多個附魔方案的 chance（成功率）相同時，只保留其中 cost（期望成本）最低的那一個
            const bestPlansByChance = new Map();
            all_plans.forEach(plan => {
                if (!bestPlansByChance.has(plan.chance) || plan.cost < bestPlansByChance.get(plan.chance).cost) {
                    bestPlansByChance.set(plan.chance, plan);
                }
            });

            filtered_plans = Array.from(bestPlansByChance.values());
            filtered_plans.sort((a, b) => a.cost - b.cost);

            if (filtered_plans.length === 0) {
                planContent = '<div class="no-plans">No valid enchanting plans</div>';
            } else {
                const accordionId = `accordion-${itemId}-${index}`;
                const bestPlan = filtered_plans[0];

                const otherPlansBody = filtered_plans.slice(1).map(plan => `
                    <tr>
                        <td>${plan.combo}</td>
                        <td>${formatAsPercentage(plan.chance)}</td>
                        <td>${formatNumberWithThousandsSeparator(plan.cost)}</td>
                    </tr>
                `).join('');

                // 只有當有其他方案時才顯示手風琴
                const hasOtherPlans = filtered_plans.length > 1;

                // 獲取當前選中的plan索引（預設為0，即最佳方案）
                const selectedPlanIndex = window.fireloadSetState.selectedPlans.get(itemId) || 0;
                const selectedPlan = filtered_plans[selectedPlanIndex] || bestPlan;
                
                if (hasOtherPlans) {
                    // 生成所有可選擇的方案（包括當前選中的）
                    const allSelectableOptions = filtered_plans.map((plan, planIndex) => `
                        <tr class="plan-option ${planIndex === selectedPlanIndex ? 'selected' : ''}" 
                            data-plan-index="${planIndex}"
                            data-item-id="${itemId}"
                            data-plan-idx="${planIndex}">
                            <td>${plan.combo}</td>
                            <td>${formatAsPercentage(plan.chance)}</td>
                            <td>${formatNumberWithThousandsSeparator(plan.cost)}</td>
                        </tr>
                    `).join('');
                    
                    planContent = `
                        <table class="table table-sm table-bordered mb-0">
                            <thead>
                                <tr>
                                    <th>${i18n.translate('combo')}</th>
                                    <th>${i18n.translate('chance')}</th>
                                    <th>${i18n.translate('cost')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr class="accordion-toggle" 
                                    data-bs-toggle="collapse" 
                                    data-bs-target="#${accordionId}" 
                                    aria-expanded="false" 
                                    aria-controls="${accordionId}">
                                    <td>${selectedPlan.combo}</td>
                                    <td>${formatAsPercentage(selectedPlan.chance)}</td>
                                    <td>${formatNumberWithThousandsSeparator(selectedPlan.cost)}</td>
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
                } else {
                    // 只有一個方案時，仍然可以選擇
                    planContent = `
                        <table class="table table-sm table-bordered mb-0">
                            <thead>
                                <tr>
                                    <th>${i18n.translate('combo')}</th>
                                    <th>${i18n.translate('chance')}</th>
                                    <th>${i18n.translate('cost')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr class="plan-option selected" data-plan-index="0" data-item-id="${itemId}" data-plan-idx="0">
                                    <td>${selectedPlan.combo}</td>
                                    <td>${formatAsPercentage(selectedPlan.chance)}</td>
                                    <td>${formatNumberWithThousandsSeparator(selectedPlan.cost)}</td>
                                </tr>
                            </tbody>
                        </table>
                    `;
                }
            }
        }
        
        data.push({
            'id': itemId,
            'name': getItemDisplayContent(itemId, itemBase, i18n.translate, 'image', imageSheet),
            'level': level,
            'bonus': params.enchant_bonus || 0,
            'price': price,
            'plan': planContent,
            'prod price': targetPrice,
            'prod name': getItemDisplayContent(enchantTargetId, itemBase, i18n.translate, 'image', imageSheet),
            'prod id': enchantTargetId,
            'all_plans': filtered_plans
        });
    });
    
    const rowMapper = (item, index) => {
        return `
            <tr>
                <td>${item.id}</td>
                <td>${item.name}</td>
                <td>${item.level}</td>
                <td>${formatAsPercentage(item.bonus)}</td>
                <td>${formatNumberWithThousandsSeparator(item.price)}</td>
                <td>${item.plan}</td>
                <td>${formatNumberWithThousandsSeparator(item['prod price'])}</td>
                <td>${item['prod name']}</td>
                <td>${item['prod id']}</td>
            </tr>
        `;
    };
    
    const tableHTML = generateTableHTML(headers, data, rowMapper, i18n.translate, true); // Pass true for custom row rendering
    container.innerHTML = tableHTML;

    // 初始化所有行的選擇狀態（預設選擇最佳方案）
    data.forEach(item => {
        if (!window.fireloadSetState.selectedPlans.has(item.id)) {
            window.fireloadSetState.selectedPlans.set(item.id, 0); // 預設選擇索引0（最佳方案）
        }
    });

    // 手動綁定所有手風琴和選擇事件
    bindAccordionEvents(container);
}

/**
 * 獲取附魔鏈 - 從指定道具開始，持續追蹤enchant_id直到沒有enchant_id的物品
 * @param {number} startItemId - 起始道具ID
 * @param {object} itemBase - 物品基礎數據
 * @returns {Array} 附魔鏈道具ID數組
 */
function getEnchantChain(startItemId, itemBase) {
    const chain = [];
    let currentItemId = startItemId;
    const visited = new Set(); // 防止無限循環
    
    while (currentItemId && !visited.has(currentItemId)) {
        const item = itemBase[currentItemId];
        if (!item) break;
        
        visited.add(currentItemId);
        chain.push(currentItemId);
        
        // 獲取下一個enchant_id
        currentItemId = item.params?.enchant_id;
        
        // 如果沒有enchant_id，結束鏈
        if (!currentItemId) break;
    }
    
    return chain;
}

/**
 * 選擇plan選項的處理函數
 * @param {number} itemId - 道具ID
 * @param {number} planIndex - 選中的plan索引
 */
function selectPlanOption(itemId, planIndex) {
    // 更新選擇狀態
    window.fireloadSetState.selectedPlans.set(itemId, planIndex);
    
    // 由於price依賴關係，重新生成整個表格
    updateEntireTable();
    
    console.log(`Selected plan ${planIndex} for item ${itemId}`);
}

// 將函數暴露到全局作用域
window.selectPlanOption = selectPlanOption;



/**
 * 重新生成整個表格（當依賴關係複雜時使用）
 */
function updateEntireTable() {
    const tableContainer = document.getElementById('fireload-set-table-container');
    if (!tableContainer) return;
    
    const { enchantChain, itemBase, imageSheet, enchantingChances } = window.fireloadSetState;
    if (!enchantChain || !itemBase || !enchantingChances) return;
    
    // 重新生成表格
    generateEnchantChainTable(tableContainer, enchantChain[0], itemBase, window.generateTableHTML, imageSheet, enchantingChances);
}

/**
 * 綁定手風琴展開/收合事件
 * @param {HTMLElement} container - 容器元素
 */
function bindAccordionEvents(container) {
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
                selectPlanOption(itemId, planIndex);
                
                // 選擇後收起手風琴
                const accordionContent = option.closest('.collapse');
                if (accordionContent) {
                    accordionContent.classList.remove('show');
                }
            }
        });
    });
}