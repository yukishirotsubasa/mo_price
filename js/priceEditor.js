import { createItemNameMap, getItemDisplayContent } from './utils.js';
import { getItemBase, getNpcBase } from './dataLoader.js';
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
    const searchMonsterButton = document.getElementById('search-monster-button'); // 新增怪物搜尋按鈕
    const editArea = document.getElementById('item-edit-area');
    const refreshButton = document.getElementById('refresh-table-button');

    if (!searchInput || !searchButton || !editArea || !refreshButton || !searchMonsterButton) {
        console.error('Price editor UI elements not found!');
        return;
    }

    // 初始化
    let itemBase;
    let itemNameMap;
    let npcBase; // 新增 npcBase 變數
    let monsterNameMap; // 新增 monsterNameMap 變數
    let priceData = [];

    try {
        // 使用 dataLoader 中的 getItemBase 來獲取 item_base 數據，它會處理快取
        itemBase = await getItemBase();
        if (!itemBase) {
            console.error('Failed to load item_base data.');
            return;
        }
        // 建立 itemNameMap（搜尋功能仍需要）
        itemNameMap = createItemNameMap(itemBase, i18n.translate);
        
        // 檢查 itemNameMap 是否創建成功
        if (!itemNameMap) {
            console.error('Failed to create itemNameMap.');
            return;
        }
        
        // 載入 npcBase 資料
        npcBase = await getNpcBase();
        if (!npcBase) {
            console.error('Failed to load npcBase data.');
            return;
        }

        // 建立怪物名稱到物件的映射表 (只包含有掉落物的怪物)
        monsterNameMap = new Map();
        npcBase.forEach(npc => {
            if (npc.params && npc.params.drops) {
                monsterNameMap.set(npc.name.toLowerCase(), npc);
            }
        });

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
            <span class="item-name">${getItemDisplayContent(item.b_i, itemBase, i18n.translate, 'name')}</span>
            <input type="number" class="price-input" data-price-type="1" placeholder="${i18n.translate('market buy')}" value="${marketBuy}">
            <input type="number" class="price-input" data-price-type="2" placeholder="${i18n.translate('market sell')}" value="${marketSell}">
            <input type="number" class="price-input" data-price-type="3" placeholder="${i18n.translate('custom price')}" value="${customPrice}">
            <button class="save-and-remove-button">${i18n.translate('Complete')}</button>
            <button class="delete-item-button">${i18n.translate('Delete')}</button>
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
            const itemName = getItemDisplayContent(itemId, itemBase, i18n.translate, 'name');
            const itemExists = priceData.some(p => p[0] === itemId);

            if (itemExists) {
                if (window.confirm(i18n.translate('confirm_delete', itemName))) {
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

    /**
     * 渲染單個怪物的掉落物編輯區。
     * @param {object} monster - 怪物物件，來自 npcBase。
     */
    function renderMonsterDropsEditArea(monster) {
        editArea.innerHTML = ''; // 清空編輯區

        const title = document.createElement('h3');
        title.textContent = `${i18n.translate('editing_monster_drops', '編輯怪物掉落物')}: ${monster.name}`;
        editArea.appendChild(title);

        if (!monster.params || !monster.params.drops || monster.params.drops.length === 0) {
            const noDropsMsg = document.createElement('p');
            noDropsMsg.textContent = i18n.translate('no_drops_found', '此怪物沒有掉落物。');
            editArea.appendChild(noDropsMsg);
            return;
        }

        monster.params.drops.forEach(drop => {
            // 掉落物結構可能只有 id，需要轉換成 renderEditItem 期望的 item 結構
            const item = {
                b_i: drop.id,
                name: getItemDisplayContent(drop.id, itemBase, i18n.translate, 'name'), // 採用其他檔案的模式
            };
            editArea.appendChild(renderEditItem(item));
        });
    }

    /**
     * 處理怪物搜尋邏輯。
     */
    function handleMonsterSearch() {
        const searchTerm = searchInput.value.trim().toLowerCase();
        if (!searchTerm) {
            editArea.innerHTML = `<p>${i18n.translate('enter_monster_name_or_id', '請輸入怪物名稱或ID')}</p>`;
            return;
        }

        editArea.innerHTML = ''; // 清空先前的搜尋結果
        let searchResults = [];

        // 判斷是 ID 還是名稱關鍵字
        if (!isNaN(searchTerm) && searchTerm !== '') { // 純數字視為怪物 ID
            const monsterId = parseInt(searchTerm);
            const monsterFromBase = npcBase.find(npc => npc.b_i === monsterId && npc.params && npc.params.drops);
            if (monsterFromBase) {
                searchResults.push(monsterFromBase);
            }
        } else { // 其餘視為名稱關鍵字
            // 針對 npcBase 中每個物件的 name 屬性進行模糊匹配
            npcBase.forEach(npc => {
                const originalName = npc.name.toLowerCase();
                const translatedName = i18n.translate(npc.name).toLowerCase(); // 獲取翻譯後的名稱
                
                if ((originalName.includes(searchTerm) || translatedName.includes(searchTerm)) && npc.params && npc.params.drops) {
                    searchResults.push(npc);
                }
            });
        }

        // 處理搜尋結果
        if (searchResults.length === 1) {
            // 單一結果：直接顯示其掉落物
            renderMonsterDropsEditArea(searchResults[0]);
        } else if (searchResults.length > 1) {
            // 多個結果：顯示列表讓使用者選擇
            const resultList = document.createElement('div');
            resultList.innerHTML = `<h4>${i18n.translate('multiple_monsters_found', '找到多個怪物，請選擇:')}</h4>`;
            searchResults.forEach(monster => {
                const monsterDiv = document.createElement('div');
                monsterDiv.classList.add('monster-search-result-item');
                monsterDiv.innerHTML = `
                    <span>${i18n.translate(monster.name)} (ID: ${monster.b_i})</span>
                    <button class="select-monster-button" data-monster-id="${monster.b_i}">${i18n.translate('select', '選擇')}</button>
                `;
                resultList.appendChild(monsterDiv);
            });
            editArea.appendChild(resultList);

            // 為每個「選擇」按鈕添加事件監聽器
            resultList.querySelectorAll('.select-monster-button').forEach(button => {
                button.addEventListener('click', (e) => {
                    const monsterId = parseInt(e.target.dataset.monsterId);
                    const selectedMonster = npcBase.find(npc => npc.b_i === monsterId);
                    if (selectedMonster) {
                        renderMonsterDropsEditArea(selectedMonster);
                    }
                });
            });
        } else {
            // 無結果
            editArea.innerHTML = `<p>${i18n.translate('no_monsters_found', '未找到怪物')}</p>`;
        }
    }

    // 綁定怪物搜尋按鈕事件監聽器
    searchMonsterButton.addEventListener('click', handleMonsterSearch, { signal: editorAbortController.signal });

    // 綁定事件監聽器
    searchButton.addEventListener('click', handleSearch, { signal: editorAbortController.signal });
    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            // 根據哪個按鈕被點擊來決定執行物品搜尋還是怪物搜尋
            // 這裡假設 Enter 鍵預設觸發物品搜尋，如果需要區分，可能需要更複雜的邏輯
            // 或者讓使用者明確點擊按鈕
            handleSearch();
        }
    }, { signal: editorAbortController.signal });

    refreshButton.addEventListener('click', () => {
        // 從 localStorage 重新載入最新的 price_data
        loadPriceData();
        // 呼叫 MarketPriceManager 中的 renderMarketDataTable 來刷新下方的預覽表格
        if (window.marketPriceManager) {
            window.marketPriceManager.currentMarketPricesData = priceData;
            window.marketPriceManager.renderMarketDataTable(priceData);
        }
    }, { signal: editorAbortController.signal });
}