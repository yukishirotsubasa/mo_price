// js/renderers/CostTableRenderer.js - 成本計算表格專用渲染器

import { TableRenderer } from './TableRenderer.js';
import i18n from '../i18n.js';
import { getItemDisplayContent } from '../utils.js';

/**
 * CostTableRenderer 類別 - 專門用於渲染成本計算相關的表格
 */
export class CostTableRenderer extends TableRenderer {
    constructor() {
        super();
        this.costTableClass = 'cost-table';
    }

    /**
     * 渲染鍛造成本表格
     * @param {string} containerId - 容器元素的ID
     * @param {Array<Object>} forgingCostData - 鍛造成本數據
     */
    renderForgingCostTable(containerId, forgingCostData) {
        const headers = [
            'id',
            'name', 
            'level',
            'pattern',
            'material price',
            'chance',
            'cost',
            'sell price'
        ];

        const rowMapper = (row) => [
            row.id,
            row.itemName,
            row.level,
            row.pattern,
            row.materialPrice,
            row.chance,
            row.cost,
            row.sellPrice
        ];

        const options = {
            tableClass: this.costTableClass,
            emptyMessage: i18n.translate('forging_data_not_available')
        };

        this.renderBasicTable(containerId, forgingCostData, headers, rowMapper, options);
    }

    /**
     * 渲染木工成本表格
     * @param {string} containerId - 容器元素的ID
     * @param {Array<Object>} carpentryCostData - 木工成本數據
     */
    renderCarpentryCostTable(containerId, carpentryCostData) {
        const headers = [
            'name',
            'level',
            'pattern',
            'cost',
            'sell price'
        ];

        const rowMapper = (row) => [
            row.itemName,
            row.level,
            row.pattern,
            row.cost,
            row.sellPrice
        ];

        const options = {
            tableClass: this.costTableClass,
            emptyMessage: i18n.translate('carpentry_data_not_available')
        };

        this.renderBasicTable(containerId, carpentryCostData, headers, rowMapper, options);
    }

    /**
     * 渲染分解成本表格
     * @param {string} containerId - 容器元素的ID
     * @param {Array<Object>} recycleCostData - 分解成本數據
     */
    renderRecycleCostTable(containerId, recycleCostData) {
        const headers = [
            'id',
            'itemName',
            'level',
            'pattern',
            'chance',
            'price',
            'worth'
        ];

        const rowMapper = (row) => [
            row.id,
            row.itemName,
            row.level,
            row.pattern,
            row.chance,
            row.price,
            row.worth
        ];

        const options = {
            tableClass: this.costTableClass,
            emptyMessage: i18n.translate('recycle_data_not_available')
        };

        this.renderBasicTable(containerId, recycleCostData, headers, rowMapper, options);
    }

    /**
     * 渲染市場價格表格（可編輯）
     * @param {string} containerId - 容器元素的ID
     * @param {Array} marketData - 市場價格數據
     * @param {Array} itemBase - 物品基礎數據
     * @param {Function} editHandler - 編輯處理函數
     */
    renderMarketDataTable(containerId, marketData, itemBase, editHandler) {
        const headers = [
            'item id',
            'name',
            'wiki price',
            'market buy',
            'market sell',
            'custom price'
        ];

        const rowMapper = (row, index) => {
            const itemId = row[0];
            const marketBuyPrice = row[1];
            const marketSellPrice = row[2];
            const customPrice = row[3];

            const itemInfo = itemBase.find(item => item.b_i === itemId);
            // 預覽表格使用圖片顯示
            const imageSheet = window.allData?.imageSheet || null;
            const itemName = itemInfo ? getItemDisplayContent(itemId, itemBase, i18n.translate, 'image', imageSheet, allData?.fletchingFormulas, allData?.arrowMaterialImg) : i18n.translate('unknown_item');
            const wikiPrice = itemInfo && itemInfo.params && itemInfo.params.price ? itemInfo.params.price : 'N/A';

            return `
                <td>${itemId}</td>
                <td>${itemName}</td>
                <td>${this.formatNumber(wikiPrice)}</td>
                ${this.createEditableCell(marketBuyPrice, 1, index)}
                ${this.createEditableCell(marketSellPrice, 2, index)}
                ${this.createEditableCell(customPrice, 3, index)}
            `;
        };

        const options = {
            tableClass: 'market-data-table',
            emptyMessage: i18n.translate('no_data_to_display')
        };

        // 使用自定義渲染邏輯來處理可編輯表格
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`找不到 ID 為 ${containerId} 的容器元素。`);
            return;
        }

        container.innerHTML = ''; // 清空舊內容

        if (!marketData || marketData.length === 0) {
            container.textContent = options.emptyMessage;
            return;
        }

        let tableHTML = `<table class="${options.tableClass}"><thead><tr>`;
        headers.forEach(header => {
            tableHTML += `<th>${i18n.translate(header)}</th>`;
        });
        tableHTML += '</tr></thead><tbody>';

        marketData.forEach((row, index) => {
            tableHTML += `<tr data-row-index="${index}">`;
            tableHTML += rowMapper(row, index);
            tableHTML += '</tr>';
        });

        tableHTML += '</tbody></table>';
        container.innerHTML = tableHTML;

        // 添加編輯功能
        if (editHandler) {
            this.attachEditHandlers(container, editHandler);
        }
    }
}