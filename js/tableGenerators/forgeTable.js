// js/tableGenerators/forgeTable.js - 包含 generateForgeTable 函數
import i18n from '../i18n.js'; // 導入 i18n 模組

export function generateForgeTable(FORGE_FORMULAS, generateTableHTML, createItemNameMap, itemBase) {
    const forgeTableContainer = document.getElementById('forge-table-container');
    if (!forgeTableContainer) {
        console.error("找不到 forge-table-container 元素。");
        return;
    }

    const itemNameMap = createItemNameMap(itemBase, i18n.translate);

    // 使用 i18n.translate 翻譯表頭
    const headerKeys = ['serial_id', 'item_name', 'level', 'pattern', 'chance', 'hidden', 'only_smelt'];
    const data = Object.keys(FORGE_FORMULAS).map(id => {
        const formula = FORGE_FORMULAS[id];
        const itemId = formula.item_id;
        const itemName = itemNameMap.get(itemId) || formula.item_name; // 如果沒有翻譯，使用原始名稱

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
                const name = itemNameMap.get(parseInt(id)) || i18n.translate('unknown_item', id);
                return `${name}*${patternItems[id]}`;
            }).join(', ');
        }

        const chance = formula.chance !== undefined ? formula.chance : '';
        const hidden = formula.hidden ? i18n.translate('yes') : i18n.translate('no');
        const onlySmelt = formula.only_smelt ? i18n.translate('yes') : i18n.translate('no');

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

    forgeTableContainer.innerHTML = generateTableHTML(headerKeys, data, rowMapper, i18n.translate);
}