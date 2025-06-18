// js/tableGenerators/forgeTable.js - 包含 generateForgeTable 函數
export function generateForgeTable(FORGE_FORMULAS, generateTableHTML, createItemNameMap, itemBase) {
    const forgeTableContainer = document.getElementById('forge-table-container');
    if (!forgeTableContainer) {
        console.error("找不到 forge-table-container 元素。");
        return;
    }

    const itemNameMap = createItemNameMap(itemBase);

    const headers = ['序號ID', '物品名稱', '等級', '圖案', '機率', '隱藏', '僅熔煉'];
    const data = Object.keys(FORGE_FORMULAS).map(id => {
        const formula = FORGE_FORMULAS[id];
        const itemId = formula.item_id;
        const itemName = itemNameMap.get(itemId) || `未知物品 (${itemId})`;

        let level = '';
        if (formula.level !== undefined) {
            level = formula.level;
        } else if (formula.fletching_level !== undefined) {
            level = formula.fletching_level;
        } else if (formula.wizardry_level !== undefined) {
            level = formula.wizardry_level;
        }

        let patternString = '';
        if (formula.pattern && Array.isArray(formula.pattern)) {
            const patternItems = {};
            formula.pattern.flat().forEach(id => {
                if (id !== -1) { // 忽略 pattern 中的 0 和 -1
                    patternItems[id] = (patternItems[id] || 0) + 1;
                }
            });

            patternString = Object.keys(patternItems).map(id => {
                const name = itemNameMap.get(parseInt(id)) || `未知物品 (${id})`;
                return `${name}*${patternItems[id]}`;
            }).join(', ');
        }

        const chance = formula.chance !== undefined ? formula.chance : '';
        const hidden = formula.hidden ? '是' : '否';
        const onlySmelt = formula.only_smelt ? '是' : '否';

        return {
            id,
            itemName,
            level,
            patternString,
            chance,
            hidden,
            onlySmelt
        };
    });

    const rowMapper = (formula) => {
        return [
            formula.id,
            formula.itemName,
            formula.level,
            formula.patternString,
            formula.chance,
            formula.hidden,
            formula.onlySmelt
        ];
    };

    forgeTableContainer.innerHTML = generateTableHTML(headers, data, rowMapper);
}