import { createItemNameMap } from './utils.js';
import { getItemBase } from './dataLoader.js';
import { renderMarketDataTable } from './main.js';
import i18n from './i18n.js';

let editorAbortController;

export async function initPriceEditor() {
    // 如果存在舊的控制器，先中止它以移除舊的事件監聽器
    if (editorAbortController) {
        editorAbortController.abort();
    }
    // 建立一個新的 AbortController
    editorAbortController = new AbortController();

    // 獲取 UI 元素
    const searchInput = document.getElementById('item-search-input');
    const searchButton = document.getElementById('search-item-button');
    const editArea = document.getElementById('item-edit-area');
    const refreshButton = document.getElementById('refresh-table-button');

    if (!searchInput || !searchButton || !editArea || !refreshButton) {
        console.error('Price editor UI elements not found!');
        return;
    }

    // 初始化
    let itemBase;
    let itemNameMap;
    let priceData = [];

    try {
        // 使用 dataLoader 中的 getItemBase 來獲取 item_base 數據，它會處理快取
        itemBase = await getItemBase();
        if (!itemBase) {
            console.error('Failed to load item_base data.');
            return;
        }
        // 建立物品 ID 到名稱的映射表
        itemNameMap = createItemNameMap(itemBase, i18n.translate);
        // 從 localStorage 載入現有價格資料
        loadPriceData();
    } catch (error) {
        console.error('Error during price editor initialization:', error);
        return;
    }

    /**
     * 從 localStorage 載入 price_data。
     */
    function loadPriceData() {
        const storedData = localStorage.getItem('price_data');
        if (storedData) {
            try {
                priceData = JSON.parse(storedData);
            } catch (e) {
                console.error('Failed to parse price_data from localStorage:', e);
                priceData = [];
            }
        } else {
            priceData = [];
        }
    }

    /**
     * 將價格資料儲存到 localStorage，並移除無效資料。
     */
    function savePriceData() {
        // 過濾掉所有價格都為 0 或空的項目
        const filteredData = priceData.filter(item => {
            const marketBuy = parseFloat(item[1]) || 0;
            const marketSell = parseFloat(item[2]) || 0;
            const customPrice = parseFloat(item[3]) || 0;
            return marketBuy !== 0 || marketSell !== 0 || customPrice !== 0;
        });
        localStorage.setItem('price_data', JSON.stringify(filteredData));
        priceData = filteredData; // 同步更新記憶體中的資料
    }

    /**
     * 渲染單個物品的編輯行。
     * @param {object} item - 物品物件，來自 item_base。
     * @returns {HTMLElement} - 包含編輯表單的 div 元素。
     */
    function renderEditItem(item) {
        const existingPrice = priceData.find(p => p[0] === item.b_i);
        const marketBuy = existingPrice ? existingPrice[1] : '';
        const marketSell = existingPrice ? existingPrice[2] : '';
        const customPrice = existingPrice ? existingPrice[3] : '';

        const itemRow = document.createElement('div');
        itemRow.classList.add('edit-item-row');
        itemRow.dataset.itemId = item.b_i;

        itemRow.innerHTML = `
            <span class="item-id">${item.b_i}</span>
            <span class="item-name">${itemNameMap.get(item.b_i) || item.name}</span>
            <input type="number" class="price-input" data-price-type="1" placeholder="${i18n.translate('market buy')}" value="${marketBuy}">
            <input type="number" class="price-input" data-price-type="2" placeholder="${i18n.translate('market sell')}" value="${marketSell}">
            <input type="number" class="price-input" data-price-type="3" placeholder="${i18n.translate('custom price')}" value="${customPrice}">
            <button class="save-and-remove-button">${i18n.translate('Complete', 'Complete')}</button>
            <button class="delete-item-button">${i18n.translate('Delete', 'Delete')}</button>
        `;

        // 為價格輸入框添加 'input' 事件監聽器
        itemRow.querySelectorAll('.price-input').forEach(input => {
            input.addEventListener('input', (e) => {
                const itemId = parseInt(itemRow.dataset.itemId);
                const priceType = parseInt(e.target.dataset.priceType);
                const value = e.target.value;

                let itemPrice = priceData.find(p => p[0] === itemId);
                if (!itemPrice) {
                    // 如果是新物品，則新增一筆紀錄
                    itemPrice = [itemId, 0, 0, 0];
                    priceData.push(itemPrice);
                }
                // 更新價格，若輸入無效則視為 0
                itemPrice[priceType] = parseFloat(value) || 0;
                
                savePriceData();
            });
        });

        // 為 "儲存並移除" 按鈕添加 'click' 事件監聽器
        itemRow.querySelector('.save-and-remove-button').addEventListener('click', () => {
            // 資料已在輸入時儲存，這裡只需從畫面移除
            itemRow.remove();
        });

        // 為 "刪除" 按鈕添加 'click' 事件監聽器
        itemRow.querySelector('.delete-item-button').addEventListener('click', () => {
            const itemId = parseInt(itemRow.dataset.itemId);
            const itemName = itemNameMap.get(itemId) || `ID: ${itemId}`;
            const itemExists = priceData.some(p => p[0] === itemId);

            if (itemExists) {
                if (window.confirm(i18n.translate('confirm_delete', `您確定要刪除 [${itemName}] 的價格資料嗎？`, { itemName }))) {
                    priceData = priceData.filter(p => p[0] !== itemId);
                    savePriceData();
                    itemRow.remove();
                }
            } else {
                // 如果資料本來就不在 localStorage 中，直接移除
                itemRow.remove();
            }
        });

        return itemRow;
    }

    /**
     * 處理搜尋邏輯。
     */
    function handleSearch() {
        const searchTerm = searchInput.value.trim().toLowerCase();
        if (!searchTerm) return;

        editArea.innerHTML = ''; // 清空先前的搜尋結果
        const searchResults = new Map(); // 使用 Map 避免重複

        // 判斷是 ID 還是名稱關鍵字
        if (!isNaN(searchTerm) && searchTerm !== '') { // 純數字視為 Item ID
            const itemId = parseInt(searchTerm);
            const itemFromBase = itemBase.find(item => item.b_i === itemId);
            if (itemFromBase) {
                searchResults.set(itemId, itemFromBase);
            }
            // 也檢查 price_data，以防該物品是手動新增的
            const itemFromPriceData = priceData.find(p => p[0] === itemId);
            if (itemFromPriceData && !searchResults.has(itemId)) {
                 searchResults.set(itemId, { b_i: itemId, name: i18n.translate('unknown_item') });
            }
        } else { // 其餘視為名稱關鍵字
            // 從 itemNameMap 搜尋 (涵蓋 item_base)
            for (const [id, name] of itemNameMap.entries()) {
                if (name.toLowerCase().includes(searchTerm)) {
                    const item = itemBase.find(i => i.b_i === id);
                    if (item) searchResults.set(id, item);
                }
            }
        }

        // 渲染搜尋結果
        if (searchResults.size > 0) {
            searchResults.forEach(item => {
                editArea.appendChild(renderEditItem(item));
            });
        } else {
            editArea.innerHTML = `<p>${i18n.translate('no_items_found', 'No items found')}</p>`;
        }
    }

    // 綁定事件監聽器
    searchButton.addEventListener('click', handleSearch, { signal: editorAbortController.signal });
    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    }, { signal: editorAbortController.signal });

    refreshButton.addEventListener('click', () => {
        // 從 localStorage 重新載入最新的 price_data
        loadPriceData();
        // 呼叫 main.js 中的 renderMarketDataTable 來刷新下方的預覽表格
        renderMarketDataTable(priceData);
    }, { signal: editorAbortController.signal });
}