// js/main.js - 應用程式主入口點

import { loadData, getItemBase, getForgeFormulas, getCarpentryFormulas, loadGoogleSheetData, loadJsFileVariable } from './dataLoader.js';
import { createItemNameMap, generateTableHTML, compareData } from './utils.js';
import { generateItemTable } from './tableGenerators/itemTable.js';
import { generateCarpentryTable } from './tableGenerators/carpentryTable.js';
import { generateForgeTable } from './tableGenerators/forgeTable.js';

// 在 DOMContentLoaded 之前就開始載入數據，因為 release_2025_0417.js 是同步載入的
loadData().then(({ itemBase, FORGE_FORMULAS, CARPENTRY_FORMULAS }) => { // 直接解構數據
    document.addEventListener('DOMContentLoaded', () => {
        // 處理 Tab 切換邏輯
        document.querySelectorAll('.tab-button').forEach(button => {
            button.addEventListener('click', () => {
                document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
                document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

                button.classList.add('active');
                document.getElementById(`${button.dataset.tab}-content`).classList.add('active');
            });
        });

        // 預設激活「版本比較」Tab，方便測試
        const defaultTabButton = document.querySelector('.tab-button[data-tab="tab5"]');
        if (defaultTabButton) {
            defaultTabButton.click();
        }

        // 生成表格 (確保在數據載入後執行)
        generateItemTable(itemBase, generateTableHTML, createItemNameMap);
        generateCarpentryTable(CARPENTRY_FORMULAS, generateTableHTML, createItemNameMap, itemBase);
        generateForgeTable(FORGE_FORMULAS, generateTableHTML, createItemNameMap, itemBase);

        // Google Sheet 市場整合功能邏輯
        // 在 Google Charts Library 載入完成後初始化
        google.charts.load('current', { packages: ['corechart', 'table'] });
        google.charts.setOnLoadCallback(() => {
            const googleSheetUrlInput = document.getElementById('google-sheet-url');
            const loadSheetButton = document.getElementById('load-sheet-button');
            const forceReloadSheetButton = document.getElementById('force-reload-sheet-button'); // 新增
            const sheetStatusDiv = document.getElementById('sheet-status');
            const sheetDataDisplayDiv = document.getElementById('sheet-data-display');
            const exportCsvButton = document.getElementById('export-csv-button');
            const importCsvButton = document.getElementById('import-csv-button');
            const importCsvFileInput = document.getElementById('import-csv-file-input');
 
            if (!googleSheetUrlInput || !loadSheetButton || !forceReloadSheetButton || !sheetStatusDiv || !sheetDataDisplayDiv || !exportCsvButton || !importCsvButton || !importCsvFileInput) {
                console.error("Google Sheet 或 CSV 相關 UI 元素未找到。");
                return;
            }
 
            let currentMarketPricesData = []; // 用於儲存當前市場價格數據的記憶體變數
 
            // 輔助函數：將數據轉換為 CSV 格式
            const convertToCsv = (data) => {
                if (!data || data.length === 0) {
                    return '';
                }
 
                const escapeCsv = (value) => {
                    if (value === null || value === undefined) {
                        return '';
                    }
                    let stringValue = String(value);
                    // 如果值包含逗號、雙引號或換行符，則用雙引號包圍，並將內部雙引號轉義為兩個雙引號
                    if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
                        return `"${stringValue.replace(/"/g, '""')}"`;
                    }
                    return stringValue;
                };
 
                return data.map(row => row.map(escapeCsv).join(',')).join('\n');
            };
 
            // 輔助函數：解析 CSV 格式的字串
            const parseCsv = (csvString) => {
                const rows = csvString.split(/\r?\n/).filter(line => line.trim() !== ''); // 分割行並過濾空行
                if (rows.length === 0) {
                    return [];
                }
 
                const parsedData = [];
                rows.forEach(row => {
                    const cells = [];
                    let inQuote = false;
                    let currentCell = '';
                    for (let i = 0; i < row.length; i++) {
                        const char = row[i];
                        if (char === '"') {
                            if (inQuote && row[i + 1] === '"') { // 處理轉義的雙引號
                                currentCell += '"';
                                i++; // 跳過下一個雙引號
                            } else {
                                inQuote = !inQuote;
                            }
                        } else if (char === ',' && !inQuote) {
                            cells.push(currentCell);
                            currentCell = '';
                        } else {
                            currentCell += char;
                        }
                    }
                    cells.push(currentCell); // 添加最後一個單元格
                    parsedData.push(cells);
                });
                return parsedData;
            };
 
            // 輔助函數：載入並顯示 Google Sheet 數據
            const loadAndDisplaySheetData = async (forceReload = false) => {
                const urlOrId = googleSheetUrlInput.value.trim();
                if (!urlOrId) {
                    sheetStatusDiv.textContent = '請輸入 Google Sheet URL 或 ID。';
                    return;
                }
 
                sheetStatusDiv.textContent = forceReload ? '正在強制重新載入數據...' : '正在載入數據...';
                sheetDataDisplayDiv.innerHTML = ''; // 清空之前的數據
 
                try {
                    const sheetData = await loadGoogleSheetData(urlOrId, '', forceReload); // 傳遞 forceReload 參數
                    sheetStatusDiv.textContent = '數據載入成功！';
                    currentMarketPricesData = sheetData; // 更新記憶體中的數據
                    
                    renderSheetData(currentMarketPricesData); // 渲染數據
 
                } catch (error) {
                    sheetStatusDiv.textContent = `載入失敗: ${error.message}`;
                    sheetDataDisplayDiv.innerHTML = '';
                }
            };
 
            // 輔助函數：渲染數據到表格
            const renderSheetData = (data) => {
                if (data.length > 0) {
                    let tableHTML = '<table><thead><tr>';
                    // 假設第一行是標題
                    data[0].forEach(header => {
                        tableHTML += `<th>${header}</th>`;
                    });
                    tableHTML += '</tr></thead><tbody>';
 
                    for (let i = 1; i < data.length; i++) {
                        tableHTML += `<tr data-row-index="${i}">`; // 添加行索引
                        data[i].forEach((cell, colIndex) => {
                            // 假設第一列是項目名稱，不可編輯；其他列是價格，可編輯
                            if (colIndex === 0) {
                                tableHTML += `<td>${cell}</td>`; // 項目名稱不可編輯
                            } else {
                                tableHTML += `<td contenteditable="true" data-col-index="${colIndex}">${cell}</td>`; // 價格可編輯
                            }
                        });
                        tableHTML += '</tr>';
                    }
                    tableHTML += '</tbody></table>';
                    sheetDataDisplayDiv.innerHTML = tableHTML;
 
                    // 添加事件監聽器以處理行內編輯
                    sheetDataDisplayDiv.querySelectorAll('td[contenteditable="true"]').forEach(cellElement => {
                        cellElement.addEventListener('blur', (event) => {
                            handleCellEdit(event.target, currentMarketPricesData);
                        });
                        cellElement.addEventListener('keydown', (event) => {
                            if (event.key === 'Enter') {
                                event.preventDefault(); // 防止換行
                                event.target.blur(); // 觸發 blur 事件來儲存數據
                            }
                        });
                    });
 
                } else {
                    sheetDataDisplayDiv.textContent = 'Google Sheet 中沒有數據。';
                }
            };
 
            // 輔助函數：處理儲存格編輯
            const handleCellEdit = (cellElement, dataToUpdate) => {
                const rowIndex = parseInt(cellElement.closest('tr').dataset.rowIndex);
                const colIndex = parseInt(cellElement.dataset.colIndex);
                let newValue = cellElement.textContent.trim();
 
                // 數據驗證：確保輸入的是數字（如果不是第一列）
                if (colIndex !== 0) {
                    const parsedValue = parseFloat(newValue);
                    if (isNaN(parsedValue)) {
                        alert('請輸入有效的數字。');
                        cellElement.textContent = dataToUpdate[rowIndex][colIndex]; // 恢復原始值
                        return;
                    }
                    newValue = parsedValue.toString(); // 確保儲存為數字字符串
                }
 
                // 更新記憶體中的數據模型
                dataToUpdate[rowIndex][colIndex] = newValue;
 
                // 將更新後的數據同步回 localStorage
                try {
                    localStorage.setItem('marketPricesCache', JSON.stringify(dataToUpdate));
                    console.log("市場價格數據已更新並儲存到 localStorage。");
                } catch (e) {
                    console.error("儲存更新後的數據到 localStorage 失敗。", e);
                }
            };
 
            // CSV 匯出功能
            exportCsvButton.addEventListener('click', () => {
                let dataToExport = currentMarketPricesData;
                if (dataToExport.length === 0) {
                    // 如果記憶體中沒有數據，嘗試從 localStorage 載入
                    const cachedData = localStorage.getItem('marketPricesCache');
                    if (cachedData) {
                        try {
                            dataToExport = JSON.parse(cachedData);
                        } catch (e) {
                            console.error("解析 localStorage 中的快取數據失敗。", e);
                            sheetStatusDiv.textContent = '匯出失敗：無法解析快取數據。';
                            return;
                        }
                    } else {
                        sheetStatusDiv.textContent = '沒有數據可供匯出。';
                        return;
                    }
                }
 
                const csvString = convertToCsv(dataToExport);
                const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'market_prices.csv';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                sheetStatusDiv.textContent = '數據已成功匯出為 market_prices.csv。';
            });
 
            // CSV 匯入功能
            importCsvButton.addEventListener('click', () => {
                importCsvFileInput.click(); // 觸發隱藏的檔案輸入點擊事件
            });
 
            importCsvFileInput.addEventListener('change', (event) => {
                const file = event.target.files[0];
                if (!file) {
                    sheetStatusDiv.textContent = '請選擇一個 CSV 檔案。';
                    return;
                }
 
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const csvContent = e.target.result;
                        const importedData = parseCsv(csvContent);
 
                        if (importedData.length > 0) {
                            // 更新記憶體中的數據模型
                            currentMarketPricesData = importedData;
                            // 將更新後的數據同步回 localStorage
                            localStorage.setItem('marketPricesCache', JSON.stringify(currentMarketPricesData));
                            // 更新 UI
                            renderSheetData(currentMarketPricesData);
                            sheetStatusDiv.textContent = 'CSV 數據已成功匯入並更新。';
                            console.log("CSV 數據已成功匯入並更新到 localStorage。", currentMarketPricesData);
                        } else {
                            sheetStatusDiv.textContent = '匯入的 CSV 檔案中沒有有效數據。';
                        }
                    } catch (error) {
                        sheetStatusDiv.textContent = `匯入失敗: ${error.message}`;
                        console.error("解析或匯入 CSV 數據失敗。", error);
                    } finally {
                        // 清空檔案輸入，以便再次選擇同一個檔案時能觸發 change 事件
                        event.target.value = '';
                    }
                };
                reader.onerror = () => {
                    sheetStatusDiv.textContent = '讀取檔案失敗。';
                };
                reader.readAsText(file);
            });
 
            // 初始載入：如果輸入框有值，則嘗試載入數據（優先從快取）
            // 這裡需要調整，因為現在 currentMarketPricesData 是記憶體中的主要數據源
            // 應該先嘗試從 localStorage 載入，如果沒有再嘗試從 Google Sheet 載入
            const cachedData = localStorage.getItem('marketPricesCache');
            if (cachedData) {
                try {
                    currentMarketPricesData = JSON.parse(cachedData);
                    renderSheetData(currentMarketPricesData);
                    sheetStatusDiv.textContent = '數據已從 localStorage 載入。';
                } catch (e) {
                    console.error("解析 localStorage 中的快取數據失敗。", e);
                    sheetStatusDiv.textContent = '從 localStorage 載入數據失敗，嘗試從 Google Sheet 載入。';
                    if (googleSheetUrlInput.value.trim()) {
                        loadAndDisplaySheetData();
                    }
                }
            } else if (googleSheetUrlInput.value.trim()) {
                loadAndDisplaySheetData();
            }
 
            // 綁定事件監聽器
            loadSheetButton.addEventListener('click', () => loadAndDisplaySheetData(false)); // 預設載入，不強制重新載入
            forceReloadSheetButton.addEventListener('click', () => loadAndDisplaySheetData(true)); // 強制重新載入
        });
    });

    // 版本比較功能邏輯
    const versionASelect = document.getElementById('versionA-select');
    const versionBSelect = document.getElementById('versionB-select');
    const compareVersionsButton = document.getElementById('compare-versions-button');
    const comparisonResultsDiv = document.getElementById('version-comparison-results');

    if (versionASelect && versionBSelect && compareVersionsButton && comparisonResultsDiv) {
        compareVersionsButton.addEventListener('click', async () => {
            const versionAPath = versionASelect.value;
            const versionBPath = versionBSelect.value;

            comparisonResultsDiv.innerHTML = '正在載入並比較數據...';

            try {
                // 載入兩個版本的 item_base 數據
                const itemBaseA = await loadJsFileVariable(versionAPath, 'item_base');
                const itemBaseB = await loadJsFileVariable(versionBPath, 'item_base');

                console.log(`版本 A (${versionAPath}): 載入成功`);
                console.log(`版本 B (${versionBPath}): 載入成功`);
                console.log(`版本 A (item_base 數量): ${itemBaseA ? itemBaseA.length : 0}`);
                console.log(`版本 B (item_base 數量): ${itemBaseB ? itemBaseB.length : 0}`);

                // 執行比較
                const comparisonResult = compareData(itemBaseA, itemBaseB, 'b_i'); // 假設 'b_i' 是唯一 ID
                console.log("比較結果:", comparisonResult);

                // 顯示結果
                renderComparisonResults(comparisonResult, comparisonResultsDiv);

            } catch (error) {
                comparisonResultsDiv.innerHTML = `<p style="color: red;">載入或比較數據失敗: ${error.message}</p>`;
                console.error("版本比較失敗:", error);
            }
        });
    } else {
        console.error("版本比較相關 UI 元素未找到。");
    }

}).catch(error => {
    console.error("應用程式初始化失敗:", error);
});

/**
 * 渲染版本比較結果到指定的 DOM 元素。
 * @param {Object} results - 比較結果物件 (added, removed, modified)。
 * @param {HTMLElement} containerElement - 顯示結果的 DOM 容器。
 */
function renderComparisonResults(results, containerElement) {
    console.log("渲染比較結果:", results);
    console.log("新增數量:", results.added.length);
    console.log("刪除數量:", results.removed.length);
    console.log("修改數量:", results.modified.length);

    let html = '';

    // 新增的條目
    if (results.added.length > 0) {
        html += `<div class="comparison-section added">
                    <h3>新增的條目 (${results.added.length})</h3>
                    <ul class="comparison-list">`;
        results.added.forEach(item => {
            html += `<li>ID: ${item.b_i}, 名稱: ${item.name || 'N/A'}</li>`;
        });
        html += `</ul></div>`;
    }

    // 刪除的條目
    if (results.removed.length > 0) {
        html += `<div class="comparison-section removed">
                    <h3>刪除的條目 (${results.removed.length})</h3>
                    <ul class="comparison-list">`;
        results.removed.forEach(item => {
            html += `<li>ID: ${item.b_i}, 名稱: ${item.name || 'N/A'}</li>`;
        });
        html += `</ul></div>`;
    }

    // 修改的條目
    if (results.modified.length > 0) {
        html += `<div class="comparison-section modified">
                    <h3>修改的條目 (${results.modified.length})</h3>
                    <ul class="comparison-list">`;
        results.modified.forEach(modItem => {
            html += `<li>
                        ID: ${modItem.id}, 名稱: ${modItem.itemB.name || modItem.itemA.name || 'N/A'}
                        <div class="modified-details">`;
            for (const key in modItem.changes) {
                const change = modItem.changes[key];
                if (change.old === undefined) {
                    html += `<span>屬性 '${key}': <span class="new-value">新增: ${JSON.stringify(change.new)}</span></span>`;
                } else if (change.new === undefined) {
                    html += `<span>屬性 '${key}': <span class="old-value">刪除: ${JSON.stringify(change.old)}</span></span>`;
                } else {
                    html += `<span>屬性 '${key}': <span class="old-value">${JSON.stringify(change.old)}</span> &rarr; <span class="new-value">${JSON.stringify(change.new)}</span></span>`;
                }
            }
            html += `</div></li>`;
        });
        html += `</ul></div>`;
    }

    if (results.added.length === 0 && results.removed.length === 0 && results.modified.length === 0) {
        html = '<p>兩個版本之間沒有發現差異。</p>';
    }

    containerElement.innerHTML = html;
}