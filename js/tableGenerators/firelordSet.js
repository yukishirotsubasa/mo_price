// js/tableGenerators/firelordSet.js - Firelord Set 功能
import i18n from '../i18n.js';
import { getMaterialPrice, getItemSellPrice, formatNumberWithThousandsSeparator, formatAsPercentage, getItemDisplayContent } from '../utils.js';
import { getEnchantingPlans } from '../enchantCost.js';

/**
 * 生成 Firelord Set 表格數據
 * @param {string} containerId - 容器ID
 * @param {object} itemBase - 物品基礎數據
 * @param {function} generateTableHTML - 生成表格HTML的函數
 * @param {function} createItemNameMap - 創建物品名稱映射的函數
 */
export function generateFirelordSetTableData(containerId, itemBase, generateTableHTML, createItemNameMap) {
    // 將generateTableHTML存儲為全局變量，供按鈕事件使用
    window.generateTableHTML = generateTableHTML;
    
    // 初始化選擇狀態管理
    if (!window.firelordSetState) {
        window.firelordSetState = {
            selectedPlans: new Map(), // Map<itemId, selectedPlanIndex>
            useMarketPrice: new Map(), // Map<itemId, boolean> - 是否使用市場價格
            selectedForgeFormula: new Map(), // Map<itemId, formulaId> - 選中的鍛造公式
            enchantChain: [],
            itemBase: null,
            imageSheet: null,
            enchantingChances: null
        };
    }
    
    const container = document.getElementById(containerId);
    const buttonContainer = document.getElementById('firelord-set-button-container');
    
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

    // 目標道具ID - 使用二維數組明確表示換行
    const targetItems = [
        // 第一行
        [356, 496, 495, 355, 357, 354, 1327],
        // 第二行  
        [1833, 503, 504, 2709, 2674, 1043],
        // 第三行
        [2427, 2443, 2459, 2475, 2528, 2301, 2397, 2412]
    ];
    
    // 獲取 imageSheet 數據
    const imageSheet = window.allData?.imageSheet || null;
    
    // 更新全局狀態
    window.firelordSetState.itemBase = itemBase;
    window.firelordSetState.imageSheet = imageSheet;
    window.firelordSetState.enchantingChances = enchantingChances;
    
    // 創建按鈕區域
    createTargetItemButtons(buttonContainer, targetItems, itemBase, imageSheet, enchantingChances, generateTableHTML);
    
    // 初始化顯示第一個目標道具的表格
    if (targetItems.length > 0 && targetItems[0].length > 0) {
        generateEnchantChainTable(container, targetItems[0][0], itemBase, generateTableHTML, imageSheet, enchantingChances);
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
    
    let globalIndex = 0;
    
    // 直接使用二維數組 targetItems
    targetItems.forEach((row, rowIndex) => {
        // 創建每一行的容器
        const rowContainer = document.createElement('div');
        rowContainer.className = 'firelord-set-button-row';
        rowContainer.style.display = 'flex';
        rowContainer.style.gap = '10px';
        rowContainer.style.marginBottom = '10px';
        
        row.forEach((itemId) => {
            const item = itemBase[itemId];
            if (!item) return;
            
            const button = document.createElement('button');
            button.className = `firelord-set-target-btn ${globalIndex === 0 ? 'active' : ''}`;
            button.setAttribute('data-item-id', itemId);
            
            // 使用道具圖片作為按鈕內容
            const itemDisplay = getItemDisplayContent(itemId, itemBase, i18n.translate, 'image', imageSheet, allData?.fletchingFormulas, allData?.arrowMaterialImg);
            button.innerHTML = itemDisplay;
            
            // 添加點擊事件
            button.addEventListener('click', () => {
                // 移除其他按鈕的active狀態
                buttonContainer.querySelectorAll('.firelord-set-target-btn').forEach(btn => {
                    btn.classList.remove('active');
                });
                
                // 添加當前按鈕的active狀態
                button.classList.add('active');
                
                // 生成對應的表格
                const tableContainer = document.getElementById('firelord-set-table-container');
                generateEnchantChainTable(tableContainer, itemId, itemBase, generateTableHTML, imageSheet, enchantingChances);
            });
            
            rowContainer.appendChild(button);
            globalIndex++;
        });
        
        buttonContainer.appendChild(rowContainer);
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
    window.firelordSetState.enchantChain = enchantChain;
    
    // 完全仿照enchantCost的表格結構
    const headers = ['market price', 'name', 'level', 'bonus', 'price', 'plan', 'prod price', 'prod name', 'prod id'];
    const data = [];
    
    enchantChain.forEach((itemId, index) => {
        const item = itemBase[itemId];
        if (!item) return;
        
        const params = item.params;
        const enchantTargetId = params?.enchant_id;
        
        // 只顯示有enchant_id的項目，最後一個沒有enchant_id的不顯示
        if (!enchantTargetId) return;
        
        // 特殊處理：當enchantTargetId為608時，插入鍛造公式選擇行
        if (enchantTargetId === 608) {
            // 先添加當前行（附魔到608的行）
            addEnchantRow(itemId, index, item, params, enchantTargetId, enchantChain, itemBase, enchantingChances, imageSheet, data);
            
            // 然後添加鍛造公式選擇行
            addForgeFormulaRow(608, data, itemBase, imageSheet);
            
            // 獲取選中的鍛造公式結果，繼續處理後續的enchant chain
            const selectedFormulaId = window.firelordSetState.selectedForgeFormula.get(608) || 232; // 預設選擇公式232
            const forgeFormulas = window.allData?.FORGE_FORMULAS;
            if (forgeFormulas && forgeFormulas[selectedFormulaId]) {
                const resultItemId = forgeFormulas[selectedFormulaId].item_id;
                // 繼續處理鍛造結果的enchant chain
                const resultEnchantChain = getEnchantChain(resultItemId, itemBase);
                resultEnchantChain.forEach((resultItemId, resultIndex) => {
                    const resultItem = itemBase[resultItemId];
                    if (!resultItem) return;
                    
                    const resultParams = resultItem.params;
                    const resultEnchantTargetId = resultParams?.enchant_id;
                    
                    if (!resultEnchantTargetId) return;
                    
                    // 創建包含鍛造行的enchantChain，讓後續行能正確識別上一行是鍛造行
                    const extendedEnchantChain = [...enchantChain, 608, resultItemId];
                    addEnchantRow(resultItemId, data.length, resultItem, resultParams, resultEnchantTargetId, extendedEnchantChain, itemBase, enchantingChances, imageSheet, data);
                });
            }
            return; // 跳過正常的處理流程
        }
        
        // 使用通用函數處理普通的附魔行
        addEnchantRow(itemId, index, item, params, enchantTargetId, enchantChain, itemBase, enchantingChances, imageSheet, data);
    });
    
    const rowMapper = (item, index) => {
        return `
            <tr>
                <td>${item['market price']}</td>
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
        if (!window.firelordSetState.selectedPlans.has(item.id)) {
            window.firelordSetState.selectedPlans.set(item.id, 0); // 預設選擇索引0（最佳方案）
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
 * 計算指定道具的price（考慮market price開關和依賴關係）
 * @param {number} itemId - 道具ID
 * @param {number} itemIndex - 道具在鏈中的索引
 * @param {Array} enchantChain - 附魔鏈
 * @param {object} itemBase - 物品基礎數據
 * @param {object} enchantingChances - 附魔機率數據
 * @param {object} imageSheet - 圖片數據
 * @param {Array} processedData - 已處理的數據（用於遞歸）
 * @returns {number} 計算出的price
 */
function calculateItemPrice(itemId, itemIndex, enchantChain, itemBase, enchantingChances, imageSheet, processedData = []) {
    if (itemIndex === 0) {
        // 第一行固定使用市場價格
        return getMaterialPrice(itemId, itemBase);
    }
    
    // 檢查當前道具是否使用市場價格
    const useMarketPrice = window.firelordSetState.useMarketPrice.get(itemId);
    if (useMarketPrice) {
        return getMaterialPrice(itemId, itemBase);
    }
    
    // 檢查是否有鍛造行的特殊處理
    // 通過檢查data數組來判斷上一行是否為鍛造行
    if (itemIndex > 0) {
        // 從全局狀態或data中檢查上一行是否為鍛造行
        const tableContainer = document.getElementById('firelord-set-table-container');
        if (tableContainer) {
            const rows = tableContainer.querySelectorAll('tbody tr');
            if (rows.length > itemIndex - 1) {
                const previousRow = rows[itemIndex - 1];
                const planCell = previousRow.querySelector('td:nth-child(6)'); // plan欄位是第6個
                
                // 如果上一行包含鍛造公式選擇，則是鍛造行
                if (planCell && planCell.querySelector('.forge-formula-option')) {
                    const selectedForgeOption = planCell.querySelector('.forge-formula-option.selected');
                    if (selectedForgeOption) {
                        const costCell = selectedForgeOption.querySelector('td:nth-child(3)'); // cost是第3個欄位
                        if (costCell) {
                            const costText = costCell.textContent.replace(/,/g, '');
                            return parseFloat(costText) || getMaterialPrice(itemId, itemBase);
                        }
                    }
                }
            }
        }
        
        // 備用邏輯：通過enchantChain檢查
        const previousItemId = enchantChain[itemIndex - 1];
        if (previousItemId === 608) {
            // 上一行是鍛造行，獲取選中的鍛造公式cost
            const selectedFormulaId = window.firelordSetState.selectedForgeFormula.get(608) || 232;
            const forgeFormulas = window.allData?.FORGE_FORMULAS;
            
            if (forgeFormulas && forgeFormulas[selectedFormulaId]) {
                const formula = forgeFormulas[selectedFormulaId];
                
                // 重新計算鍛造cost（考慮當前的price狀態）
                let patternItems = {};
                if (Array.isArray(formula.pattern)) {
                    formula.pattern.flat().forEach(mid => {
                        if (mid !== -1) {
                            patternItems[mid] = (patternItems[mid] || 0) + 1;
                        }
                    });
                }
                
                let materialPriceTotal = 0;
                Object.entries(patternItems).forEach(([mid, count]) => {
                    const item_id = parseInt(mid);
                    let itemPrice;
                    
                    if (item_id === 608) {
                        // 對於608，檢查是否使用市場價格
                        const useMarketPrice = window.firelordSetState.useMarketPrice.get(608);
                        if (useMarketPrice) {
                            itemPrice = getMaterialPrice(608, itemBase);
                        } else {
                            // 使用上上一行的cost（遞歸計算）
                            itemPrice = calculateItemPrice(608, itemIndex - 1, enchantChain, itemBase, enchantingChances, imageSheet);
                        }
                    } else {
                        itemPrice = getMaterialPrice(item_id, itemBase);
                    }
                    
                    materialPriceTotal += itemPrice * count;
                });
                
                return materialPriceTotal;
            }
        }
    }
    
    // 使用上一行選中plan的cost（原有邏輯）
    const previousItemId = enchantChain[itemIndex - 1];
    const previousItem = itemBase[previousItemId];
    
    if (!previousItem || !previousItem.params) {
        return getMaterialPrice(itemId, itemBase);
    }
    
    // 計算上一行的price（遞歸）
    const previousPrice = calculateItemPrice(previousItemId, itemIndex - 1, enchantChain, itemBase, enchantingChances, imageSheet, processedData);
    
    // 計算上一行的plans和選中的cost
    const previousParams = previousItem.params;
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
    
    const previousPlans = getEnchantingPlans(previousSlot, previousLevel, enchantingChances, itemBase);
    if (!previousPlans || previousPlans.length === 0) {
        return getMaterialPrice(itemId, itemBase);
    }
    
    // 計算上一行的filtered plans
    const LUCKY_STONE_ID = 593;
    const previousAllPlans = previousPlans.map(plan => {
        const scrollName = getItemDisplayContent(plan.combo[0], itemBase, i18n.translate, 'image', imageSheet, allData?.fletchingFormulas, allData?.arrowMaterialImg);
        const luckyStoneCount = plan.combo[1];
        
        const combo = luckyStoneCount > 0
            ? `${scrollName}+${getItemDisplayContent(LUCKY_STONE_ID, itemBase, i18n.translate, 'image', imageSheet, allData?.fletchingFormulas, allData?.arrowMaterialImg)}*${luckyStoneCount}`
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
    
    const previousSelectedPlanIndex = window.firelordSetState.selectedPlans.get(previousItemId) || 0;
    const previousSelectedPlan = previousFilteredPlans[previousSelectedPlanIndex] || previousFilteredPlans[0];
    
    return previousSelectedPlan ? previousSelectedPlan.cost : getMaterialPrice(itemId, itemBase);
}

/**
 * 選擇plan選項的處理函數
 * @param {number} itemId - 道具ID
 * @param {number} planIndex - 選中的plan索引
 */
function selectPlanOption(itemId, planIndex) {
    // 更新選擇狀態
    window.firelordSetState.selectedPlans.set(itemId, planIndex);
    
    // 由於price依賴關係，重新生成整個表格
    updateEntireTable();
    
    console.log(`Selected plan ${planIndex} for item ${itemId}`);
}

// 將函數暴露到全局作用域
window.selectPlanOption = selectPlanOption;

/**
 * 切換市場價格使用狀態
 * @param {number} itemId - 道具ID
 * @param {boolean} useMarketPrice - 是否使用市場價格
 */
function toggleMarketPrice(itemId, useMarketPrice) {
    // 更新狀態
    window.firelordSetState.useMarketPrice.set(itemId, useMarketPrice);
    
    // 重新生成整個表格
    updateEntireTable();
    
    console.log(`Toggled market price for item ${itemId}: ${useMarketPrice}`);
}

// 將函數暴露到全局作用域
window.toggleMarketPrice = toggleMarketPrice;

/**
 * 選擇鍛造公式
 * @param {number} materialItemId - 材料道具ID
 * @param {number} formulaId - 鍛造公式ID
 */
function selectForgeFormula(materialItemId, formulaId) {
    // 更新選擇狀態
    window.firelordSetState.selectedForgeFormula.set(materialItemId, formulaId);
    
    // 同時更新selectedPlans，讓鍛造行的plan選擇與公式選擇同步
    // 找到formulaId在relevantFormulas中的索引
    const relevantFormulas = [232, 233];
    const planIndex = relevantFormulas.indexOf(formulaId);
    if (planIndex !== -1) {
        window.firelordSetState.selectedPlans.set(materialItemId, planIndex);
    }
    
    // 重新生成整個表格
    updateEntireTable();
    
    console.log(`Selected forge formula ${formulaId} for material ${materialItemId}`);
}

// 將函數暴露到全局作用域
window.selectForgeFormula = selectForgeFormula;



/**
 * 重新生成整個表格（當依賴關係複雜時使用）
 */
function updateEntireTable() {
    const tableContainer = document.getElementById('firelord-set-table-container');
    if (!tableContainer) return;
    
    const { enchantChain, itemBase, imageSheet, enchantingChances } = window.firelordSetState;
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
    
    // 綁定market price開關事件
    const marketPriceCheckboxes = container.querySelectorAll('.market-price-checkbox');
    marketPriceCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
            const itemId = parseInt(checkbox.getAttribute('data-item-id'));
            const useMarketPrice = checkbox.checked;
            
            if (!isNaN(itemId)) {
                toggleMarketPrice(itemId, useMarketPrice);
            }
        });
    });
    
    // 綁定鍛造公式選擇事件
    const forgeFormulaOptions = container.querySelectorAll('.forge-formula-option');
    forgeFormulaOptions.forEach(option => {
        option.addEventListener('click', (e) => {
            e.stopPropagation();
            
            const formulaId = parseInt(option.getAttribute('data-formula-id'));
            const materialId = parseInt(option.getAttribute('data-material-id'));
            
            if (!isNaN(formulaId) && !isNaN(materialId)) {
                selectForgeFormula(materialId, formulaId);
            }
        });
    });
}

/**
 * 添加普通的附魔行
 */
function addEnchantRow(itemId, index, item, params, enchantTargetId, enchantChain, itemBase, enchantingChances, imageSheet, data) {
    let level = 0;
    const levelKeys = ['min_accuracy', 'min_archery', 'min_defense', 'min_health', 'min_magic', 'min_strength', 'min_jewelry'];
    for (const levelKey of levelKeys) {
        if (params[levelKey]) {
            level = params[levelKey];
            break;
        }
    }
    
    // 計算price：使用新的遞歸函數來正確處理所有依賴關係
    const price = calculateItemPrice(itemId, index, enchantChain, itemBase, enchantingChances, imageSheet);
    
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
            const scrollName = getItemDisplayContent(plan.combo[0], itemBase, i18n.translate, 'image', imageSheet, allData?.fletchingFormulas, allData?.arrowMaterialImg);
            const luckyStoneCount = plan.combo[1];
            
            const combo = luckyStoneCount > 0
                ? `${scrollName}+${getItemDisplayContent(LUCKY_STONE_ID, itemBase, i18n.translate, 'image', imageSheet, allData?.fletchingFormulas, allData?.arrowMaterialImg)}*${luckyStoneCount}`
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
            const selectedPlanIndex = window.firelordSetState.selectedPlans.get(itemId) || 0;
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
    
    // 生成market price欄位內容
    let marketPriceContent;
    if (data.length === 0) {
        // 第一行：固定顯示市場價格，無開關
        marketPriceContent = formatNumberWithThousandsSeparator(getMaterialPrice(itemId, itemBase));
    } else {
        // 後續行：顯示開關
        const isChecked = window.firelordSetState.useMarketPrice.get(itemId) || false;
        const marketPrice = getMaterialPrice(itemId, itemBase);
        marketPriceContent = `
            <div class="market-price-toggle">
                <label class="market-price-label">
                    <input type="checkbox" 
                           class="market-price-checkbox" 
                           data-item-id="${itemId}"
                           ${isChecked ? 'checked' : ''}>
                    <span class="market-price-value">${formatNumberWithThousandsSeparator(marketPrice)}</span>
                </label>
            </div>
        `;
    }

    data.push({
        'market price': marketPriceContent,
        'name': getItemDisplayContent(itemId, itemBase, i18n.translate, 'image', imageSheet, allData?.fletchingFormulas, allData?.arrowMaterialImg),
        'level': level,
        'bonus': params.enchant_bonus || 0,
        'price': price,
        'plan': planContent,
        'prod price': targetPrice,
        'prod name': getItemDisplayContent(enchantTargetId, itemBase, i18n.translate, 'image', imageSheet, allData?.fletchingFormulas, allData?.arrowMaterialImg),
        'prod id': enchantTargetId,
        'all_plans': filtered_plans,
        'id': itemId // 保留id用於內部邏輯
    });
}

/**
 * 添加鍛造公式選擇行
 */
function addForgeFormulaRow(materialItemId, data, itemBase, imageSheet) {
    const forgeFormulas = window.allData?.FORGE_FORMULAS;
    if (!forgeFormulas) return;
    
    // 獲取使用608作為材料的鍛造公式（232和233）
    const relevantFormulas = [232, 233].filter(formulaId => {
        const formula = forgeFormulas[formulaId];
        if (!formula || !formula.pattern) return false;
        
        // 檢查pattern中是否包含608
        return formula.pattern.flat().includes(materialItemId);
    });
    
    if (relevantFormulas.length === 0) return;
    
    // 獲取當前選中的公式（預設為232）
    const selectedFormulaId = window.firelordSetState.selectedForgeFormula.get(materialItemId) || 232;
    const selectedFormula = forgeFormulas[selectedFormulaId];
    
    // 獲取item_id=608的資料來顯示左側欄位
    const materialItem = itemBase[materialItemId];
    const materialParams = materialItem?.params || {};
    
    // 計算level
    let level = 0;
    const levelKeys = ['min_accuracy', 'min_archery', 'min_defense', 'min_health', 'min_magic', 'min_strength', 'min_jewelry'];
    for (const levelKey of levelKeys) {
        if (materialParams[levelKey]) {
            level = materialParams[levelKey];
            break;
        }
    }
    
    // 計算price：檢查是否使用市場價格，否則使用上一行選中plan的cost
    let price;
    const useMarketPrice = window.firelordSetState.useMarketPrice.get(materialItemId);
    
    if (useMarketPrice) {
        // 如果選擇使用市場價格
        price = getMaterialPrice(materialItemId, itemBase);
    } else if (data.length > 0) {
        // 使用上一行選中plan的cost
        const previousRowData = data[data.length - 1];
        const previousSelectedPlanIndex = window.firelordSetState.selectedPlans.get(previousRowData.id) || 0;
        const previousSelectedPlan = previousRowData.all_plans[previousSelectedPlanIndex];
        price = previousSelectedPlan ? previousSelectedPlan.cost : getMaterialPrice(materialItemId, itemBase);
    } else {
        price = getMaterialPrice(materialItemId, itemBase);
    }
    
    // 生成鍛造公式選擇內容（移除chance欄位，因為是100%）
    const formulaOptions = relevantFormulas.map(formulaId => {
        const formula = forgeFormulas[formulaId];
        const resultItemId = formula.item_id;
        
        // 計算材料成本（仿照forgingCost的邏輯）
        let patternItems = {};
        if (Array.isArray(formula.pattern)) {
            formula.pattern.flat().forEach(mid => {
                if (mid !== -1) {
                    patternItems[mid] = (patternItems[mid] || 0) + 1;
                }
            });
        }
        
        let materialPriceTotal = 0;
        const pattern = Object.entries(patternItems).map(([mid, count]) => {
            const item_id = parseInt(mid);
            const name = getItemDisplayContent(item_id, itemBase, i18n.translate, 'image', imageSheet, allData?.fletchingFormulas, allData?.arrowMaterialImg);
            // 如果是608，使用計算出的price，否則使用市場價格
            const itemPrice = item_id === materialItemId ? price : getMaterialPrice(item_id, itemBase);
            materialPriceTotal += itemPrice * count;
            return `${name}*${count}`;
        }).join(' + ');
        
        return {
            formulaId,
            resultItemId,
            resultName: getItemDisplayContent(resultItemId, itemBase, i18n.translate, 'image', imageSheet, allData?.fletchingFormulas, allData?.arrowMaterialImg),
            pattern,
            cost: formatNumberWithThousandsSeparator(materialPriceTotal.toFixed(2)),
            isSelected: formulaId === selectedFormulaId
        };
    });
    
    // 生成plan欄位內容（鍛造公式選擇，移除chance欄位）
    const planContent = `
        <table class="table table-sm table-bordered mb-0">
            <thead>
                <tr>
                    <th>Formula</th>
                    <th>Materials</th>
                    <th>Cost</th>
                    <th>Result</th>
                </tr>
            </thead>
            <tbody>
                ${formulaOptions.map(option => `
                    <tr class="forge-formula-option ${option.isSelected ? 'selected' : ''}" 
                        data-formula-id="${option.formulaId}"
                        data-material-id="${materialItemId}">
                        <td>${option.formulaId}</td>
                        <td>${option.pattern}</td>
                        <td>${option.cost}</td>
                        <td>${option.resultName}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
    
    // 獲取選中公式的結果物品資料
    const selectedResultItemId = selectedFormula.item_id;
    const selectedResultPrice = getItemSellPrice(selectedResultItemId, itemBase);
    const selectedResultName = getItemDisplayContent(selectedResultItemId, itemBase, i18n.translate, 'image', imageSheet, allData?.fletchingFormulas, allData?.arrowMaterialImg);
    
    // 生成market price欄位內容
    const isChecked = window.firelordSetState.useMarketPrice.get(materialItemId) || false;
    const marketPrice = getMaterialPrice(materialItemId, itemBase);
    const marketPriceContent = `
        <div class="market-price-toggle">
            <label class="market-price-label">
                <input type="checkbox" 
                       class="market-price-checkbox" 
                       data-item-id="${materialItemId}"
                       ${isChecked ? 'checked' : ''}>
                <span class="market-price-value">${formatNumberWithThousandsSeparator(marketPrice)}</span>
            </label>
        </div>
    `;
    
    // 重新計算所有鍛造公式的cost（基於當前price）
    const recalculatedFormulaOptions = relevantFormulas.map(formulaId => {
        const formula = forgeFormulas[formulaId];
        
        // 計算材料成本（使用當前的price）
        let patternItems = {};
        if (Array.isArray(formula.pattern)) {
            formula.pattern.flat().forEach(mid => {
                if (mid !== -1) {
                    patternItems[mid] = (patternItems[mid] || 0) + 1;
                }
            });
        }
        
        let materialPriceTotal = 0;
        Object.entries(patternItems).forEach(([mid, count]) => {
            const item_id = parseInt(mid);
            // 如果是608，使用計算出的price，否則使用市場價格
            const itemPrice = item_id === materialItemId ? price : getMaterialPrice(item_id, itemBase);
            materialPriceTotal += itemPrice * count;
        });
        
        return {
            formulaId,
            cost: materialPriceTotal,
            isSelected: formulaId === selectedFormulaId
        };
    });
    
    // 創建類似附魔plan的結構，讓後續行能夠使用
    const forgeAllPlans = recalculatedFormulaOptions.map((option, index) => ({
        combo: `Formula ${option.formulaId}`,
        chance: 1.0, // 鍛造是100%成功
        cost: option.cost
    }));
    
    data.push({
        'market price': marketPriceContent,
        'name': getItemDisplayContent(materialItemId, itemBase, i18n.translate, 'image', imageSheet, allData?.fletchingFormulas, allData?.arrowMaterialImg),
        'level': level,
        'bonus': materialParams.enchant_bonus || 0,
        'price': price,
        'plan': planContent,
        'prod price': selectedResultPrice,
        'prod name': selectedResultName,
        'prod id': selectedResultItemId,
        'all_plans': forgeAllPlans,
        'id': materialItemId, // 使用materialItemId作為ID
        'isForgeRow': true
    });
}