/**
 * 生成分解成本表格資料。
 * @param {Object} FORGE_FORMULAS - 鍛造配方數據。
 * @param {Function} generateTableHTML - 生成表格HTML的函數。
 * @param {Function} createItemNameMap - 創建物品名稱映射的函數。
 * @param {Array<Object>} itemBase - 物品基礎數據。
 * @returns {Array<Object>} 包含分解成本計算結果的物件陣列。
 */
import i18n from './i18n.js'; // 導入 i18n 模組
import { createItemNameMap, getItemSellPrice, getMaterialPrice, formatNumberWithThousandsSeparator, formatAsPercentage, getItemDisplayContent } from './utils.js'; // 導入相關函數

export function generateRecycleCostTableData(FORGE_FORMULAS, generateTableHTML, createItemNameMap, itemBase, fletchingFormulas, arrowMaterialImg) {
    // 獲取 imageSheet 數據
    const imageSheet = window.allData?.imageSheet || null;
    const exception_list = [186,187,188,189,190,191,192,193,194,195,196,197,55,73,74,58,75,76,89,90,91,94,95,96,124,125,126,
        120,121,122,116,117,118,155,156,157,151,152,153,159,160,161,202,203,204,206,207,208,210,211,212,214,215,216,
        276,277,278,280,281,282,284,285,286,288,289,290,292,293,294,296,297,298,300,301,302,304,305,306,308,309,310,
        312,313,314,316,317,318,320,321,322,324,325,1061,327,328,329,331,332,333,335,336,337,339,340,341,343,344,345,
        347,348,349,351,352,353,358,359,360,362,363,364,366,367,368,370,371,372,375,376,377,379,380,381,383,384,385,
        387,388,389,393,394,395,397,398,399,401,402,403,405,406,407,410,411,412,414,415,416,418,419,420,422,423,424,
        438,558,559,560,562,563,564,566,567,568,570,571,572,574,575,576,578,579,580,582,583,584,586,587,588,590,591,592,
        594,595,596,598,599,600,602,603,604,611,612,613,650,719,20,609,440,539,540,541,542,543,765,766,767,768,769,770,
        771,772,773,774,775,776
    ];

    return Object.keys(FORGE_FORMULAS).flatMap(id => {
        const formula = FORGE_FORMULAS[id];
        
        // 1. only_smelt為true的不可分解，可直接去除
        if (exception_list.includes(Number(id)) || formula.only_smelt || itemBase[formula.item_id].params.no_smelt) {
            return [];
        }

        const itemId = formula.item_id;
        const itemName = getItemDisplayContent(itemId, itemBase, i18n.translate, 'image', imageSheet, fletchingFormulas, arrowMaterialImg);
        let level = formula.level ?? formula.fletching_level ?? formula.wizardry_level ?? '';

        // 處理材料與價格
        let patternItems = {};
        if (Array.isArray(formula.pattern)) {
            formula.pattern.flat().forEach(mid => {
                if (mid !== -1) {
                    patternItems[mid] = (patternItems[mid] || 0) + 1;
                }
            });
        }

        // 計算各材料的價值總和
        let materialWorthTotal = 0;
        const pattern = Object.entries(patternItems).map(([mid, count]) => {
            const item_id = parseInt(mid);
            const name = getItemDisplayContent(item_id, itemBase, i18n.translate, 'image', imageSheet, fletchingFormulas, arrowMaterialImg);
            
            const npcBase = window.allData?.npcBase || null;
            const sellPrice = getItemSellPrice(item_id, itemBase, npcBase);
            
            materialWorthTotal += sellPrice * count;
            return `${name}(${sellPrice})*${count}`;
        }).join(', ');

        // 2. recycle_chance為分解的成功率
        // 3. 其餘的分解邏輯為每個材料皆有50%機會成功
        let chance;
        if (formula.recycle_chance !== undefined && formula.recycle_chance !== null) {
            // 如果recycle_chance有值則轉換成百分比顯示，例如recycle_chance為1則顯示100%
            chance = formula.recycle_chance;
        } else {
            // 其餘的分解邏輯為每個材料皆有50%機會成功
            chance = 0.5;
        }

        // price: 鍛造成品的item id使用getMaterialPrice查找price
        const price = formatNumberWithThousandsSeparator(getMaterialPrice(itemId, itemBase));

        // worth: 各材料的item id使用getItemSellPrice查找price相加後/2
        const worth = formatNumberWithThousandsSeparator((materialWorthTotal * chance).toFixed(2));

        return [{
            id,
            itemName,
            level,
            pattern,
            chance: formatAsPercentage(chance),
            price,
            worth
        }];
    });
}