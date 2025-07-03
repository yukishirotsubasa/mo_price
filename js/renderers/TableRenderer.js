// js/renderers/TableRenderer.js - 統一表格渲染邏輯

import i18n from '../i18n.js';
import { formatNumberWithThousandsSeparator } from '../utils.js';

/**
 * TableRenderer 類別 - 負責統一的表格渲染邏輯
 */
export class TableRenderer {
    constructor() {
        this.defaultTableClass = 'data-table';
    }

    /**
     * 渲染基本表格
     * @param {string} containerId - 容器元素的ID
     * @param {Array} data - 表格數據
     * @param {Array} headers - 表格標題
     * @param {Function} rowMapper - 行數據映射函數
     * @param {Object} options - 渲染選項
     */
    renderBasicTable(containerId, data, headers, rowMapper, options = {}) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`找不到 ID 為 ${containerId} 的容器元素。`);
            return;
        }

        container.innerHTML = ''; // 清空舊內容

        if (!data || data.length === 0) {
            container.textContent = options.emptyMessage || i18n.translate('no_data_available');
            return;
        }

        let tableHTML = `<table class="${options.tableClass || this.defaultTableClass}">`;
        
        // 渲染表頭
        if (headers && headers.length > 0) {
            tableHTML += '<thead><tr>';
            headers.forEach(header => {
                const translatedHeader = typeof header === 'string' ? i18n.translate(header) : header;
                tableHTML += `<th>${translatedHeader}</th>`;
            });
            tableHTML += '</tr></thead>';
        }

        // 渲染表格內容
        tableHTML += '<tbody>';
        data.forEach((item, index) => {
            const rowData = rowMapper(item, index);
            tableHTML += '<tr>';
            if (Array.isArray(rowData)) {
                rowData.forEach(cellData => {
                    tableHTML += `<td>${cellData}</td>`;
                });
            } else {
                tableHTML += rowData; // 如果rowMapper返回完整的行HTML
            }
            tableHTML += '</tr>';
        });
        tableHTML += '</tbody></table>';

        container.innerHTML = tableHTML;
    }

    /**
     * 渲染可編輯表格（用於市場價格等）
     * @param {string} containerId - 容器元素的ID
     * @param {Array} data - 表格數據
     * @param {Array} headers - 表格標題
     * @param {Function} rowMapper - 行數據映射函數
     * @param {Function} editHandler - 編輯處理函數
     * @param {Object} options - 渲染選項
     */
    renderEditableTable(containerId, data, headers, rowMapper, editHandler, options = {}) {
        this.renderBasicTable(containerId, data, headers, rowMapper, options);
        
        // 添加編輯功能
        const container = document.getElementById(containerId);
        if (container && editHandler) {
            this.attachEditHandlers(container, editHandler);
        }
    }

    /**
     * 為表格添加編輯事件處理器
     * @param {HTMLElement} container - 表格容器
     * @param {Function} editHandler - 編輯處理函數
     */
    attachEditHandlers(container, editHandler) {
        container.querySelectorAll('td[contenteditable="true"]').forEach(cellElement => {
            // 移除舊的事件監聽器以避免重複綁定
            cellElement.removeEventListener('blur', editHandler);
            cellElement.removeEventListener('keydown', this.handleKeydown);

            // 綁定新的事件監聽器
            cellElement.addEventListener('blur', editHandler);
            cellElement.addEventListener('keydown', this.handleKeydown);
        });
    }

    /**
     * 處理鍵盤事件
     * @param {Event} event - 鍵盤事件
     */
    handleKeydown(event) {
        if (event.key === 'Enter') {
            event.preventDefault(); // 防止換行
            event.target.blur(); // 觸發 blur 事件來儲存數據
        }
    }

    /**
     * 格式化數字顯示
     * @param {number} value - 數值
     * @returns {string} 格式化後的字串
     */
    formatNumber(value) {
        if (typeof value === 'number') {
            return formatNumberWithThousandsSeparator(value);
        }
        return value;
    }

    /**
     * 創建可編輯的儲存格
     * @param {any} value - 儲存格值
     * @param {number} colIndex - 列索引
     * @param {number} rowIndex - 行索引
     * @returns {string} HTML字串
     */
    createEditableCell(value, colIndex, rowIndex) {
        const formattedValue = this.formatNumber(value);
        return `<td contenteditable="true" data-col-index="${colIndex}" data-row-index="${rowIndex}">${formattedValue}</td>`;
    }

    /**
     * 創建普通儲存格
     * @param {any} value - 儲存格值
     * @returns {string} HTML字串
     */
    createCell(value) {
        const formattedValue = this.formatNumber(value);
        return `<td>${formattedValue}</td>`;
    }

    /**
     * 清空容器內容
     * @param {string} containerId - 容器元素的ID
     */
    clearContainer(containerId) {
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = '';
        }
    }

    /**
     * 顯示錯誤訊息
     * @param {string} containerId - 容器元素的ID
     * @param {string} message - 錯誤訊息
     */
    showError(containerId, message) {
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = `<p style="color: red;">${message}</p>`;
        }
    }

    /**
     * 顯示載入中訊息
     * @param {string} containerId - 容器元素的ID
     * @param {string} message - 載入訊息
     */
    showLoading(containerId, message = null) {
        const container = document.getElementById(containerId);
        if (container) {
            const loadingMessage = message || i18n.translate('loading');
            container.innerHTML = `<p>${loadingMessage}...</p>`;
        }
    }
}