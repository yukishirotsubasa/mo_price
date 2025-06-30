// rareKeyWorth.js
import { getItemSellPrice } from '../utils.js';
import i18n from '../i18n.js';

export function generateRareKeyWorthTable(objectBase, itemBase) {
    // 直接使用對象 ID: 726
    const targetObject = objectBase[726];
    
    const container = document.getElementById('rare-key-page-content');
    container.innerHTML = ''; // Clear previous content

    if (!objectBase) {
        container.innerHTML = '<p>ObjectBase data not loaded.</p>';
        return;
    }

    if (!targetObject) {
        container.innerHTML = '<p>Object ID 726 not found in objectBase.</p>';
        return;
    }

    if (!targetObject.params) {
        container.innerHTML = '<p>No params found for object ID 726.</p>';
        return;
    }

    if (!targetObject.params.results) {
        container.innerHTML = '<p>No results found in params for object ID 726.</p>';
        return;
    }
    
    // Part 1: 收集所有 unique 的 requires_one_from 作為按鈕
    const uniqueRequires = new Map(); // 使用 Map 來存儲 unique requires_one_from 和對應的 results
    
    targetObject.params.results.forEach((result, index) => {
        if (result.requires_one_from && Array.isArray(result.requires_one_from) && result.requires_one_from.length > 0) {
            // requires_one_from 是 item id 列表，已經是 unique，遍歷每個 item id
            result.requires_one_from.forEach(itemId => {
                if (!uniqueRequires.has(itemId)) {
                    uniqueRequires.set(itemId, {
                        itemId: itemId,
                        results: []
                    });
                }
                
                // 將包含此 itemId 的 result 加入到對應的群組
                uniqueRequires.get(itemId).results.push(result);
            });
        }
    });

    // Part 2: 創建按鈕容器和表格容器
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'key-button-container';
    container.appendChild(buttonContainer);

    const valueTableContainer = document.createElement('div');
    valueTableContainer.className = 'key-value-table-container';
    container.appendChild(valueTableContainer);

    const tableContainer = document.createElement('div');
    tableContainer.className = 'key-table-container';
    container.appendChild(tableContainer);

    // Part 3: 為每個 unique requires_one_from 創建按鈕
    uniqueRequires.forEach((data, itemId) => {
        const button = document.createElement('button');
        
        // 使用 item 名稱作為按鈕文字
        const item = itemBase.find(item => item.b_i === itemId);
        const buttonText = item ? i18n.translate(item.name) : `Item ${itemId}`;
        
        button.textContent = buttonText;
        button.className = 'key-select-button';
        button.onclick = () => displayRareKeyDetails(data, itemId, itemBase, tableContainer, valueTableContainer);
        buttonContainer.appendChild(button);
    });
}

function displayRareKeyDetails(selectedData, selectedItemId, itemBase, tableContainer, valueTableContainer) {
    // Part 2: Generate the main table
    tableContainer.innerHTML = '';
    valueTableContainer.innerHTML = '';

    if (!selectedData || !selectedData.results || selectedData.results.length === 0) {
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
    let cumulative = 1; // 修正為連乘
    let previousLevel = null;
    let levelGroup = [];
    let levelGroups = [];

    // 處理所有 results，但只顯示 returns 中 consumes.id 與 selectedItemId 相同的項目
    selectedData.results.forEach(result => {
        if (result.returns && Array.isArray(result.returns)) {
            result.returns.forEach(ret => {
                // 檢查 ret.consumes 中是否有與 selectedItemId 相同的 id
                const hasMatchingConsume = ret.consumes && Array.isArray(ret.consumes) && 
                    ret.consumes.some(consume => consume.id === selectedItemId);
                
                if (hasMatchingConsume) {                    
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
                    row.insertCell().textContent = i18n.translate(itemBase[itemId]?.name || `Item ID: ${itemId}`);
                    row.insertCell().textContent = `${(baseChance * 100).toFixed(2)}%`;
                    row.insertCell().textContent = `${(realChance * 100).toFixed(2)}%`;
                    row.insertCell().textContent = getItemSellPrice(itemId, itemBase);
                }
            });
        }
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
            const group = levelGroups[i];
            if (group.length > 0) {
                const level = group[0].level;
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
                    const itemPrice = getItemSellPrice(ret.id, itemBase);
                    totalValue += realChance * itemPrice;
                });
                const td = document.createElement('td');
                td.textContent = totalValue.toFixed(2);
                valueDataRow.appendChild(td);
            }
        }
    }
}