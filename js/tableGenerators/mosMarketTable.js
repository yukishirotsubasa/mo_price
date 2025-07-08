// js/tableGenerators/mosMarketTable.js - MOS Market 表格生成器
import i18n from '../i18n.js';
import { generateItemImage, getItemSellPrice, formatNumberWithThousandsSeparator, generateTableHTML } from '../utils.js';

/**
 * 生成 MOS Market 表格
 * @param {string} containerId - 容器元素的 ID
 * @param {Array} itemBase - 物品基礎數據
 * @param {Object} imageSheet - 圖片表數據
 */
export async function generateMosMarketTable(containerId, itemBase, imageSheet, fletchingFormulas, arrowMaterialImg) {
    const tableContainer = document.getElementById(containerId);
    
    // 檢查 ItemPacks 全域變數是否存在
    if (typeof window.ItemPacks === 'undefined' || !Array.isArray(window.ItemPacks)) {
        tableContainer.innerHTML = `<p style="color: red;">ItemPacks 數據未載入，請確認 releaseJs 文件已正確載入。</p>`;
        return;
    }
    
    // 過濾掉 enabled=false 和 price_mos=0 的項目
    const filteredItemPacks = window.ItemPacks.filter(pack => 
        pack.enabled !== false && pack.price_mos > 0
    );
    
    if (filteredItemPacks.length === 0) {
        tableContainer.innerHTML = `<p>沒有可用的 MOS Market 數據。</p>`;
        return;
    }
    
    // 定義表格標題
    const headerKeys = ['Name', 'Item', 'mos', 'price', 'worth'];
    
    // 行映射函數
    const rowMapper = (pack) => {
        // name: 使用 i18n 翻譯
        const name = i18n.translate(pack.name);
        
        // items: 顯示物品圖片和數量
        let itemsDisplay = '';
        if (pack.items && Array.isArray(pack.items)) {
            const itemDisplays = pack.items.map(item => {
                const itemImage = generateItemImage(item.id, itemBase, imageSheet, i18n.translate, fletchingFormulas, arrowMaterialImg);
                return `${itemImage}*${item.count}`;
            });
            itemsDisplay = itemDisplays.join(', ');
        }
        
        // mos: 直接顯示 price_mos
        const mos = formatNumberWithThousandsSeparator(pack.price_mos);
        
        // price: 計算所有物品的價值總和
        let totalPrice = 0;
        if (pack.items && Array.isArray(pack.items)) {
            totalPrice = pack.items.reduce((sum, item) => {
                const npcBase = window.allData?.npcBase || null;
                const itemPrice = getItemSellPrice(item.id, itemBase, npcBase);
                return sum + (itemPrice * item.count);
            }, 0);
        }
        const priceDisplay = formatNumberWithThousandsSeparator(totalPrice);
        
        // worth: price/mos 的運算結果
        const worthValue = pack.price_mos > 0 ? totalPrice / pack.price_mos : 0;
        const worthDisplay = formatNumberWithThousandsSeparator(worthValue.toFixed(2));
        
        return [name, itemsDisplay, mos, priceDisplay, worthDisplay];
    };
    
    // 生成表格 HTML
    const tableHTML = generateTableHTML(headerKeys, filteredItemPacks, rowMapper, i18n.translate);
    tableContainer.innerHTML = tableHTML;
}