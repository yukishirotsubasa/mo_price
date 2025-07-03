// js/tableGenerators/presentTable.js - Present 功能
import { getItemSellPrice } from '../utils.js';
import i18n from '../i18n.js';

export function generatePresentTable(items, itemBase) {
    const container = document.getElementById('present-page-content');
    container.innerHTML = ''; // Clear previous content

    if (!items || !items.presents) {
        container.innerHTML = '<p>Items.presents data not loaded.</p>';
        return;
    }

    if (!itemBase) {
        container.innerHTML = '<p>ItemBase data not loaded.</p>';
        return;
    }

    // target_id=[764,765,766,1149,1160]
    const targetIds = [764, 765, 766, 1149, 1160];

    // Part 1: 創建上方選項按鈕
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'present-button-container';
    container.appendChild(buttonContainer);

    // Part 2: 創建表格容器
    const tableContainer = document.createElement('div');
    tableContainer.className = 'present-table-container';
    container.appendChild(tableContainer);

    // Part 3: 為每個 target_id 創建按鈕
    targetIds.forEach(targetId => {
        const button = document.createElement('button');
        
        // 使用 item_base[target_id].name 作為按鈕文字，並使用 i18n 翻譯
        const item = itemBase.find(item => item.b_i === targetId);
        const buttonText = item ? i18n.translate(item.name) : `Item ${targetId}`;
        
        button.textContent = buttonText;
        button.className = 'present-select-button';
        button.addEventListener('click', () => {
            // Remove active class from all buttons
            buttonContainer.querySelectorAll('.present-select-button').forEach(btn => {
                btn.classList.remove('active');
            });
            // Add active class to the clicked button
            button.classList.add('active');
            displayPresentDetails(targetId, items, itemBase, tableContainer);
        });
        buttonContainer.appendChild(button);
    });
}

function displayPresentDetails(selectedItemId, items, itemBase, tableContainer) {
    tableContainer.innerHTML = '';

    // 透過 Items.presents 獲得價格上限和下限
    const maxPrice = items.presents.max_prices[selectedItemId];
    const minPrice = items.presents.min_prices[selectedItemId];

    if (maxPrice === undefined || minPrice === undefined) {
        tableContainer.innerHTML = `<p>No price range data found for item ${selectedItemId}</p>`;
        return;
    }

    console.log(`Price range for item ${selectedItemId}: ${minPrice} - ${maxPrice}`);

    // 篩選符合條件的物品
    const filteredItems = itemBase.filter(item => {
        const itemPrice = item.params?.price;
        const noPresent = item.params?.no_present;
        
        // 價格在範圍內(包含相等)並且 no_present 不為 true
        return itemPrice !== undefined && 
               itemPrice >= minPrice && 
               itemPrice <= maxPrice && 
               noPresent !== true;
    });

    console.log(`Found ${filteredItems.length} items in price range`);

    // 創建表格
    const table = document.createElement('table');
    table.className = 'present-details-table';
    tableContainer.appendChild(table);

    const thead = table.createTHead();
    const headerRow = thead.insertRow();
    ['Name', 'Wiki Price', 'Custom Price'].forEach(text => {
        const th = document.createElement('th');
        th.textContent = i18n.translate(text);
        headerRow.appendChild(th);
    });

    const tbody = table.createTBody();
    let totalCustomPrice = 0;

    // 添加數據行
    filteredItems.forEach(item => {
        const row = tbody.insertRow();
        
        // Name: 使用 i18n 翻譯
        const nameCell = row.insertCell();
        nameCell.textContent = i18n.translate(item.name);
        
        // Wiki Price: item_base[].params.price
        const wikiPriceCell = row.insertCell();
        wikiPriceCell.textContent = item.params.price;
        
        // Custom Price: 使用 getItemSellPrice 查找價格
        const customPriceCell = row.insertCell();
        const customPrice = getItemSellPrice(item.b_i, itemBase);
        customPriceCell.textContent = customPrice;
        
        // 累加到總價值
        const numericCustomPrice = parseFloat(customPrice) || 0;
        totalCustomPrice += numericCustomPrice;
    });

    // 添加 total value 行
    const totalRow = tbody.insertRow();
    totalRow.className = 'total-row';
    
    // 前兩欄空白
    totalRow.insertCell().textContent = '';
    totalRow.insertCell().textContent = '';
    
    // Custom Price 欄顯示 total value
    const totalCell = totalRow.insertCell();
    totalCell.textContent = `avg: ${(totalCustomPrice/filteredItems.length).toFixed(2)}`;
    totalCell.style.fontWeight = 'bold';
}