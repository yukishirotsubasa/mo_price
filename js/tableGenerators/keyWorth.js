
// keyWorth.js
import { getItemSellPrice } from '../utils.js';
import i18n from '../i18n.js';

export function generateKeyWorthTable(objectBase, itemBase) {
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
        button.onclick = () => displayKeyDetails(obj, itemBase, tableContainer, valueTableContainer);
        buttonContainer.appendChild(button);
    });
}

function displayKeyDetails(selectedObject, itemBase, tableContainer, valueTableContainer) {
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
    ['Level', 'Name', 'Base Chance', 'Real Chance', 'Price'].forEach(text => {
        const th = document.createElement('th');
        th.textContent = text;
        headerRow.appendChild(th);
    });

    const tbody = table.createTBody();
    let cumulativeChance = 0;
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
            levelGroup.push({ ...ret, realChance: (1 - cumulativeChance) * baseChance });
            previousLevel = level;

            const realChance = (1 - cumulativeChance) * baseChance;
            cumulativeChance += realChance;

            row.insertCell().textContent = level;
            row.insertCell().textContent = i18n.translate(itemBase[itemId]?.name || `Item ID: ${itemId}`);
            row.insertCell().textContent = `${(baseChance * 100).toFixed(2)}%`;
            row.insertCell().textContent = `${(realChance * 100).toFixed(2)}%`;
            row.insertCell().textContent = getItemSellPrice(itemId, itemBase);
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

        levelGroups.forEach(group => {
            if (group.length > 0) {
                const level = group[0].level;
                const th = document.createElement('th');
                th.textContent = `Level ${level}`;
                valueHeaderRow.appendChild(th);

                let totalValue = 0;
                let groupCumulativeChance = 0;
                group.forEach(ret => {
                    const realChance = (1 - groupCumulativeChance) * ret.base_chance;
                    groupCumulativeChance += realChance;
                    const itemPrice = getItemSellPrice(ret.id, itemBase);
                    totalValue += realChance * itemPrice;
                });
                const td = document.createElement('td');
                td.textContent = totalValue.toFixed(2);
                valueDataRow.appendChild(td);
            }
        });
    }
}
