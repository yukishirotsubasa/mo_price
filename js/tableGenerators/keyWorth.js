// keyWorth.js
import { getItemSellPrice, getItemDisplayContent } from '../utils.js';
import i18n from '../i18n.js';

export function generateKeyWorthTable(objectBase, itemBase, fletchingFormulas, arrowMaterialImg) {
    const targetIds = [443, 444, 445, 657, 708, 709, 710];
    const filteredObjectBase = objectBase.filter(obj => targetIds.includes(obj.b_i));

    const container = document.getElementById('key-page-content');
    container.innerHTML = ''; // Clear previous content

    // Part 1: Buttons for selecting object_base items
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'key-button-container';
    container.appendChild(buttonContainer);

    const valueTableContainer = document.createElement('div');
    valueTableContainer.className = 'key-value-table-container';
    container.appendChild(valueTableContainer);

    const tableContainer = document.createElement('div');
    tableContainer.className = 'key-table-container';
    container.appendChild(tableContainer);

    filteredObjectBase.forEach(obj => {
        const button = document.createElement('button');
        button.textContent = i18n.translate(obj.name);
        button.className = 'key-select-button';
        button.addEventListener('click', () => {
            // Remove active class from all buttons
            buttonContainer.querySelectorAll('.key-select-button').forEach(btn => {
                btn.classList.remove('active');
            });
            // Add active class to the clicked button
            button.classList.add('active');
            displayKeyDetails(obj, itemBase, tableContainer, valueTableContainer, fletchingFormulas, arrowMaterialImg);
        });
        buttonContainer.appendChild(button);
    });
}

function displayKeyDetails(selectedObject, itemBase, tableContainer, valueTableContainer, fletchingFormulas, arrowMaterialImg) {
    // Part 2: Generate the main table
    tableContainer.innerHTML = '';
    valueTableContainer.innerHTML = '';

    if (!selectedObject || !selectedObject.params || !selectedObject.params.results) {
        tableContainer.textContent = 'No data available for this item.';
        return;
    }

    const table = document.createElement('table');
    table.className = 'key-details-table';
    tableContainer.appendChild(table);

    const thead = table.createTHead();
    const headerRow = thead.insertRow();
    ['HP', 'Image', 'base chance', 'real chance', 'price'].forEach(text => {
        const th = document.createElement('th');
        th.textContent = i18n.translate(text);
        headerRow.appendChild(th);
    });

    const tbody = table.createTBody();
    let cumulative = 1; // 修正為連乘
    let previousLevel = null;
    let levelGroup = [];
    let levelGroups = [];

    selectedObject.params.results.forEach(result => {
        result.returns.forEach(ret => {
            const row = tbody.insertRow();
            const level = ret.level;
            const itemId = ret.id;
            const baseChance = ret.base_chance;

            // Group by level for the value table
            if (previousLevel !== null && level !== previousLevel) {
                levelGroups.push(levelGroup);
                levelGroup = [];
            }
            const realChance = cumulative * baseChance;
            levelGroup.push({ ...ret, realChance });
            previousLevel = level;

            cumulative *= (1 - baseChance);

            row.insertCell().textContent = level;
            const nameCell = row.insertCell();
            nameCell.innerHTML = getItemDisplayContent(itemId, itemBase, i18n.translate, 'image', window.allData?.imageSheet || null, fletchingFormulas, arrowMaterialImg);
            row.insertCell().textContent = `${(baseChance * 100).toFixed(2)}%`;
            row.insertCell().textContent = `${(realChance * 100).toFixed(2)}%`;
            const npcBase = window.allData?.npcBase || null;
            row.insertCell().textContent = getItemSellPrice(itemId, itemBase, npcBase);
        });
    });
    if (levelGroup.length > 0) {
        levelGroups.push(levelGroup);
    }

    // Part 3: Generate the value table
    if (levelGroups.length > 0) {
        const valueTable = document.createElement('table');
        valueTable.className = 'key-value-summary-table';
        valueTableContainer.appendChild(valueTable);

        const valueThead = valueTable.createTHead();
        const valueHeaderRow = valueThead.insertRow();
        const valueDataRow = valueTable.createTBody().insertRow();

        // 依序處理每個 group，計算從該 group 開始到最後的所有物品的期望價值總和
        for (let i = 0; i < levelGroups.length; i++) {
            // 排除 group[0].level 為 13 或 132 的 group
            const group = levelGroups[i];
            if (group.length > 0) {
                const level = group[0].level;
                if (level === 13 || level === 132) continue;
                const th = document.createElement('th');
                th.textContent = `Level ${level}`;
                valueHeaderRow.appendChild(th);

                // 將所有 group 從 i 開始展平成一個陣列
                const merged = [];
                for (let j = i; j < levelGroups.length; j++) {
                    merged.push(...levelGroups[j]);
                }
                // 重新計算這一段的期望價值
                let totalValue = 0;
                let cumulative = 1;
                merged.forEach(ret => {
                    const realChance = cumulative * ret.base_chance;
                    cumulative *= (1 - ret.base_chance);
                    const npcBase = window.allData?.npcBase || null;
                    const itemPrice = getItemSellPrice(ret.id, itemBase, npcBase);
                    totalValue += realChance * itemPrice;
                });
                const td = document.createElement('td');
                td.textContent = totalValue.toFixed(2);
                valueDataRow.appendChild(td);
            }
        }
    }
}
