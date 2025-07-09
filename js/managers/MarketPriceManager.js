// js/managers/MarketPriceManager.js
import { loadGoogleSheetData, processRawData, processRawDataFromLocalStorage, saveMarketDataToLocalStorage, handleDataConflict } from '../dataLoader.js';
import { createItemNameMap, getItemDisplayContent } from '../utils.js';
import i18n from '../i18n.js';

export class MarketPriceManager {
    constructor() {
        this.currentMarketPricesData = [];
    }

    // 將main.js中的initMarketPriceIntegrationUI函數移動到這裡
    initMarketPriceIntegrationUI() {
        // 需等 google.charts 載入
        if (window.google && google.charts) {
            google.charts.load('current', { packages: ['corechart', 'table'] });
            google.charts.setOnLoadCallback(() => this.initializeMarketPriceIntegrationLogic());
        } else {
            console.error('Google Charts library not loaded.');
        }
    }

    // 將main.js中的initializeMarketPriceIntegrationLogic函數移動到這裡
    async initializeMarketPriceIntegrationLogic() {
        const googleSheetUrlInput = document.getElementById('google-sheet-url');
        const loadSheetButton = document.getElementById('load-sheet-button');
        const sheetStatusDiv = document.getElementById('sheet-status');
        const sheetDataDisplayDiv = document.getElementById('sheet-data-display');
        const exportCsvButton = document.getElementById('export-csv-button');
        const importCsvButton = document.getElementById('import-csv-button');
        const csvFileInput = document.getElementById('csv-file-input');

        if (!googleSheetUrlInput || !loadSheetButton || !sheetStatusDiv || !sheetDataDisplayDiv || !exportCsvButton || !importCsvButton || !csvFileInput) {
            console.error("市場價格整合相關 UI 元素未找到。");
            return;
        }

        // 移除舊的事件監聽器以避免重複綁定
        loadSheetButton.removeEventListener('click', this.loadAndDisplaySheetDataWrapper);
        exportCsvButton.removeEventListener('click', this.exportCsvData);
        importCsvButton.removeEventListener('click', this.triggerCsvFileInput);
        csvFileInput.removeEventListener('change', this.handleCsvFileChange);

        // 綁定新的事件監聽器
        loadSheetButton.addEventListener('click', () => this.loadAndDisplaySheetData());
        exportCsvButton.addEventListener('click', () => this.exportCsvData());
        importCsvButton.addEventListener('click', () => this.triggerCsvFileInput());
        csvFileInput.addEventListener('change', (event) => this.handleCsvFileChange(event));

        // 在 Google Charts Library 載入完成後，嘗試從 localStorage 載入數據
        this.loadMarketDataFromLocalStorage();

        // 載入上次成功讀取的 Google Sheet URL
        const lastUrl = localStorage.getItem('lastSuccessfulGoogleSheetUrl');
        if (lastUrl) {
            googleSheetUrlInput.value = lastUrl;
        }
    }

    // 將main.js中的loadAndDisplaySheetData函數移動到這裡
    async loadAndDisplaySheetData() {
        const googleSheetUrlInput = document.getElementById('google-sheet-url');
        const sheetStatusDiv = document.getElementById('sheet-status');
        const sheetDataDisplayDiv = document.getElementById('sheet-data-display');

        if (!googleSheetUrlInput || !sheetStatusDiv || !sheetDataDisplayDiv) {
            console.error("Google Sheet 相關 UI 元素未找到。");
            return;
        }

        const urlOrId = googleSheetUrlInput.value.trim();
        if (!urlOrId) {
            sheetStatusDiv.textContent = i18n.translate('enter_google_sheet_url_or_id_message');
            return;
        }

        sheetStatusDiv.textContent = i18n.translate('loading_data');
        sheetDataDisplayDiv.innerHTML = '';

        try {
            // loadGoogleSheetData 現在會處理衝突並返回最終數據
            const finalData = await loadGoogleSheetData(urlOrId, '');

            sheetStatusDiv.textContent = i18n.translate('data_loaded_successfully');
            this.currentMarketPricesData = finalData;
            
            this.renderMarketDataTable(this.currentMarketPricesData);

            // 成功載入後，將當前 URL 儲存到 localStorage
            localStorage.setItem('lastSuccessfulGoogleSheetUrl', urlOrId);

        } catch (error) {
            sheetStatusDiv.textContent = i18n.translate('load_failed', error.message);
            sheetDataDisplayDiv.innerHTML = '';
            console.error("載入或處理 Google Sheet 數據失敗:", error);
        }
    }

    // 將main.js中的loadMarketDataFromLocalStorage函數移動到這裡
    async loadMarketDataFromLocalStorage() {
        const sheetStatusDiv = document.getElementById('sheet-status');
        const sheetDataDisplayDiv = document.getElementById('sheet-data-display');
        const CACHE_KEY = 'price_data';

        if (!sheetStatusDiv || !sheetDataDisplayDiv) {
            console.error("市場價格整合相關 UI 元素未找到。");
            return;
        }

        sheetStatusDiv.textContent = i18n.translate('loading_cached_data');
        sheetDataDisplayDiv.innerHTML = '';

        try {
            const cachedData = localStorage.getItem(CACHE_KEY);
            if (cachedData) {
                const rawCachedData = JSON.parse(cachedData);
                const processedCachedData = processRawDataFromLocalStorage(rawCachedData);

                if (processedCachedData.length > 0) {
                    this.currentMarketPricesData = processedCachedData;
                    this.renderMarketDataTable(this.currentMarketPricesData);
                    sheetStatusDiv.textContent = i18n.translate('price data loaded successfully');
                } else {
                    sheetStatusDiv.textContent = i18n.translate('no valid price data');
                }
            } else {
                sheetStatusDiv.textContent = i18n.translate('no valid price data');
            }
        } catch (error) {
            sheetStatusDiv.textContent = i18n.translate('failed to load price data', error.message);
            console.error("從 localStorage 載入市場價格數據失敗:", error);
        }
    }

    // 將main.js中的renderMarketDataTable函數移動到這裡
    renderMarketDataTable(data) {
        // 需要從main.js獲取相關變數和函數
        if (!window.costTableRenderer) {
            console.error("CostTableRenderer 未初始化。");
            return;
        }

        if (!window.allData || !window.allData.itemBase) {
            console.error("itemBase 數據未載入。");
            return;
        }

        // 採用其他檔案的模式：直接在渲染器中處理名稱獲取
        window.costTableRenderer.renderMarketDataTable(
            'sheet-data-display', 
            data, 
            window.allData.itemBase, 
            this.handleCellEditWrapper.bind(this)
        );
    }

    // 處理儲存格編輯的包裝函數
    handleCellEditWrapper(event) {
        this.handleCellEdit(event.target, this.currentMarketPricesData);
    }

    // 處理儲存格編輯
    handleCellEdit(cellElement, dataToUpdate) {
        const rowIndex = parseInt(cellElement.closest('tr').dataset.rowIndex);
        const colIndex = parseInt(cellElement.dataset.colIndex);
        let newValue = cellElement.textContent.trim();

        // 移除千分位符號後再解析
        const cleanedValue = newValue.replace(/,/g, '');
        const parsedValue = parseFloat(cleanedValue);
        if (isNaN(parsedValue)) {
            cellElement.textContent = dataToUpdate[rowIndex][colIndex];
            return;
        }
        newValue = parsedValue;

        dataToUpdate[rowIndex][colIndex] = newValue;

        const dataToStore = dataToUpdate.map(row => [row[0], row[1], row[2], row[3]]);
        try {
            localStorage.setItem('price_data', JSON.stringify(dataToStore));
        } catch (e) {
            console.error(i18n.translate('failed to save data'), e);
        }
    }

    // 匯出 CSV 數據
    exportCsvData() {
        const sheetStatusDiv = document.getElementById('sheet-status');
        let dataToExport = this.currentMarketPricesData;
        if (dataToExport.length === 0) {
            sheetStatusDiv.textContent = i18n.translate('no data');
            return;
        }

        const exportableData = [
            ['item_id', 'market_buy', 'market_sell', 'custom_price']
        ];
        dataToExport.forEach(row => {
            exportableData.push([
                row[0], // item_id
                row[1], // market_buy
                row[2], // market_sell
                row[3]  // custom_price
            ]);
        });

        const csvString = exportableData.map(row => row.map(cell => {
            const stringValue = String(cell);
            if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
                return `"${stringValue.replace(/"/g, '""')}"`;
            }
            return stringValue;
        }).join(',')).join('\n');

        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'market_prices.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        sheetStatusDiv.textContent = i18n.translate('data exported successfully');
    }

    // 觸發 CSV 檔案輸入
    triggerCsvFileInput() {
        document.getElementById('csv-file-input').click();
    }

    // 處理 CSV 檔案變更事件
    async handleCsvFileChange(event) {
        const file = event.target.files[0];
        const sheetStatusDiv = document.getElementById('sheet-status');
        if (!file) {
            sheetStatusDiv.textContent = i18n.translate('select csv file');
            return;
        }

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const csvContent = e.target.result;
                const rawImportedData = csvContent.split(/\r?\n/).map(row => row.split(',').map(cell => cell.trim()));
                const newData = processRawData(rawImportedData);

                // 從 localStorage 讀取舊數據
                const oldDataRaw = localStorage.getItem('price_data');
                const oldData = oldDataRaw ? processRawDataFromLocalStorage(JSON.parse(oldDataRaw)) : [];

                // 處理數據衝突
                const finalData = await handleDataConflict(newData, oldData);

                if (finalData.length > 0) {
                    this.currentMarketPricesData = finalData;
                    saveMarketDataToLocalStorage(this.currentMarketPricesData);
                    this.renderMarketDataTable(this.currentMarketPricesData);
                    sheetStatusDiv.textContent = i18n.translate('import successfully');
                } else {
                    sheetStatusDiv.textContent = i18n.translate('no valid data in csv');
                }
            } catch (error) {
                sheetStatusDiv.textContent = i18n.translate('import failed', error.message);
            } finally {
                event.target.value = '';
            }
        };
        reader.onerror = () => {
            sheetStatusDiv.textContent = i18n.translate('failed to read file');
        };
        reader.readAsText(file);
    }
}