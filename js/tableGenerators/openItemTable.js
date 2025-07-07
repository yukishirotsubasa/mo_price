import { getItemDisplayContent } from '../utils.js'; // 導入新的顯示函數

export default (() => {
    const itemIdsToFilter = [1396, 3853, 3854, 3849, 2030, 2031, 2032, 3333, 4129, 4130, 4131];
    let currentItemBase = {};
    let currentI18n = null;
    let currentUtils = null;
    let currentImageSheet = null;
    let currentFletchingFormulas = null;
    let currentArrowMaterialImg = null;

    const createButtonArea = (filteredItemBase) => {
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'open-item-buttons btn-group-vertical';
        buttonContainer.setAttribute('role', 'group');
        buttonContainer.setAttribute('aria-label', 'Open Item Categories');

        Object.values(filteredItemBase).forEach(item => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'btn btn-outline-primary';
            button.innerHTML = getItemDisplayContent(item.b_i, currentItemBase, currentI18n.translate, 'image', currentImageSheet, currentFletchingFormulas, currentArrowMaterialImg);
            button.dataset.itemId = item.id;
            button.addEventListener('click', () => {
                // Remove active class from all buttons
                document.querySelectorAll('.open-item-buttons .btn').forEach(btn => {
                    btn.classList.remove('active');
                });
                // Add active class to the clicked button
                button.classList.add('active');
                generateTable(item);
            });
            buttonContainer.appendChild(button);
        });
        return buttonContainer;
    };

    const generateTable = (selectedItem) => {
        const tableContainer = document.getElementById('open-item-table-container');
        if (!tableContainer) {
            console.error('Table container not found.');
            return;
        }
        tableContainer.innerHTML = ''; // Clear previous table

        if (!selectedItem || !selectedItem.params || !selectedItem.params.results) {
            tableContainer.textContent = currentI18n.translate('No data available for this item.');
            return;
        }

        const table = document.createElement('table');
        table.className = 'table table-striped table-hover';
        const thead = document.createElement('thead');
        const tbody = document.createElement('tbody');

        // Table Header
        const headerRow = document.createElement('tr');
        ['Image', 'base chance', 'real chance', 'price'].forEach(headerText => {
            const th = document.createElement('th');
            th.textContent = currentI18n.translate(headerText);
            headerRow.appendChild(th);
        });
        thead.appendChild(headerRow);
        table.appendChild(thead);

        // Table Body
        let cumulative = 1; // 連乘法
        let totalPrice = 0; // 宣告 totalPrice 變數並初始化為 0

        selectedItem.params.results.forEach(result => {
            if (result.returns && Array.isArray(result.returns)) {
                result.returns.forEach(returnItem => {
                    const tr = document.createElement('tr');

                    // Name
                    const nameTd = document.createElement('td');
                    const item = currentItemBase[returnItem.id];
                    nameTd.innerHTML = getItemDisplayContent(returnItem.id, currentItemBase, currentI18n.translate, 'image', currentImageSheet);
                    tr.appendChild(nameTd);

                    // Base Chance
                    const baseChanceTd = document.createElement('td');
                    const baseChance = (returnItem.base_chance * 100).toFixed(2);
                    baseChanceTd.textContent = `${baseChance}%`;
                    tr.appendChild(baseChanceTd);

                    // Real Chance (連乘)
                    const realChanceTd = document.createElement('td');
                    const realChance = cumulative * returnItem.base_chance;
                    realChanceTd.textContent = `${(realChance * 100).toFixed(2)}%`;
                    cumulative *= (1 - returnItem.base_chance);
                    tr.appendChild(realChanceTd);

                    // Price
                    const priceTd = document.createElement('td');
                    const price = currentUtils.getItemSellPrice(returnItem.id, currentItemBase);
                    priceTd.textContent = price !== undefined ? price.toLocaleString() : currentI18n.translate('N/A');
                    tr.appendChild(priceTd);
                    
                    // 累加 price 到 totalPrice
                    if (price !== undefined) {
                        totalPrice += realChance * price;
                    }

                    tbody.appendChild(tr);
                });
            }
        });

        // 在迴圈結束後，新增一個 tr 元素，price 欄位填上 totalPrice 總和，其他欄位空白
        const totalRow = document.createElement('tr');
        const totalNameTd = document.createElement('td');
        totalNameTd.textContent = ''; // 其他欄位空白
        totalRow.appendChild(totalNameTd);

        const totalBaseChanceTd = document.createElement('td');
        totalBaseChanceTd.textContent = ''; // 其他欄位空白
        totalRow.appendChild(totalBaseChanceTd);

        const totalRealChanceTd = document.createElement('td');
        totalRealChanceTd.textContent = ''; // 其他欄位空白
        totalRow.appendChild(totalRealChanceTd);

        const totalPriceTd = document.createElement('td');
        totalPriceTd.textContent = totalPrice.toLocaleString(); // price 欄位填上 totalPrice 總和
        totalRow.appendChild(totalPriceTd);
        tbody.appendChild(totalRow);

        table.appendChild(tbody);
        tableContainer.appendChild(table);
    };

    const initOpenItemPage = (itemBase, i18n, utils, fletchingFormulas, arrowMaterialImg) => {
        currentItemBase = itemBase;
        currentI18n = i18n;
        currentUtils = utils;
        currentImageSheet = window.allData?.imageSheet || null;
        currentFletchingFormulas = fletchingFormulas || null;
        currentArrowMaterialImg = arrowMaterialImg || null;

        const openItemPageContent = document.getElementById('open-item-page-content');
        if (!openItemPageContent) {
            console.error('Element with id "open-item-page-content" not found.');
            return;
        }
        openItemPageContent.innerHTML = ''; // Clear existing content

        // Filter item_base data
        const filteredItemBase = {};
        itemIdsToFilter.forEach(id => {
            if (currentItemBase[id]) {
                filteredItemBase[id] = currentItemBase[id];
            }
        });

        // Create button area
        const buttonArea = createButtonArea(filteredItemBase);
        openItemPageContent.appendChild(buttonArea);

        // Create table container
        const tableContainer = document.createElement('div');
        tableContainer.id = 'open-item-table-container';
        openItemPageContent.appendChild(tableContainer);

        // Automatically select the first item and generate its table if available
        const firstItemId = itemIdsToFilter.find(id => filteredItemBase[id]);
        if (firstItemId) {
            const firstButton = buttonArea.querySelector(`[data-item-id="${firstItemId}"]`);
            if (firstButton) {
                firstButton.classList.add('active');
                generateTable(filteredItemBase[firstItemId]);
            }
        }
    };

    return {
        initOpenItemPage
    };
})();