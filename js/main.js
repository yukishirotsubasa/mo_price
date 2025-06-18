// js/main.js - 應用程式主入口點

import { loadData, getItemBase, getForgeFormulas, getCarpentryFormulas, getNpcBase, getPets, getSkillQuest, getObjectBase, getEnchantingChances, getImageSheet, loadGoogleSheetData, loadJsFileVariable } from './dataLoader.js';
import { createItemNameMap, generateTableHTML, compareData } from './utils.js';
import { generateItemTable } from './tableGenerators/itemTable.js';
import { generateCarpentryTable } from './tableGenerators/carpentryTable.js';
import { generateForgeTable } from './tableGenerators/forgeTable.js';
import { generateNpcTable } from './tableGenerators/npcTable.js';
import { generatePetsTable } from './tableGenerators/petsTable.js';
import { generateSkillQuestTable } from './tableGenerators/skillQuestTable.js';
import { generateObjectBaseTable } from './tableGenerators/objectBaseTable.js';
import { generateEnchantingChancesTable } from './tableGenerators/enchantingChancesTable.js';
import { generateImageSheetTable } from './tableGenerators/imageSheetTable.js';
import i18n from './i18n.js'; // 導入 i18n 模組

let allData = {}; // 用於儲存所有載入的數據，以便在語言切換時重新渲染

/**
 * 渲染所有表格。
 * @param {boolean} forceReload - 是否強制重新載入數據。
 */
async function renderAllTables(forceReload = false) {
    try {
        // 如果是第一次載入或強制重新載入，則從 dataLoader 載入數據
        if (Object.keys(allData).length === 0 || forceReload) {
            allData = await loadData();
        }

        const { itemBase, FORGE_FORMULAS, CARPENTRY_FORMULAS, npcBase, pets, skillQuest, objectBase, forge, imageSheet } = allData;

        // 重新生成所有表格
        generateItemTable(itemBase, generateTableHTML, createItemNameMap);
        generateCarpentryTable(CARPENTRY_FORMULAS, generateTableHTML, createItemNameMap, itemBase);
        generateForgeTable(FORGE_FORMULAS, generateTableHTML, createItemNameMap, itemBase);
        generateNpcTable(npcBase, generateTableHTML, createItemNameMap, itemBase);
        generatePetsTable(pets, generateTableHTML, createItemNameMap, itemBase, pets);
        generateSkillQuestTable(skillQuest, generateTableHTML, createItemNameMap, itemBase);
        generateObjectBaseTable(objectBase, generateTableHTML, createItemNameMap, itemBase);
        generateEnchantingChancesTable(forge, generateTableHTML, createItemNameMap, itemBase);
        generateImageSheetTable(imageSheet, generateTableHTML, createItemNameMap, itemBase);

        // 更新 Tab 標題
        updateTabTitles();
        // 更新 Google Sheet UI 文本
        updateGoogleSheetUIText();
        // 更新版本比較 UI 文本
        updateVersionComparisonUIText();

    } catch (error) {
        console.error("數據載入或表格生成失敗:", error);
    }
}

/**
 * 更新 Tab 標題的翻譯。
 */
function updateTabTitles() {
    document.querySelector('.tab-button[data-tab="tab1"]').textContent = i18n.translate('item_data');
    document.querySelector('.tab-button[data-tab="tab2"]').textContent = i18n.translate('carpentry_recipes');
    document.querySelector('.tab-button[data-tab="tab3"]').textContent = i18n.translate('forge_recipes');
    document.querySelector('.tab-button[data-tab="tab4"]').textContent = i18n.translate('npc_data');
    document.querySelector('.tab-button[data-tab="tab5"]').textContent = i18n.translate('pet_data');
    document.querySelector('.tab-button[data-tab="tab6"]').textContent = i18n.translate('skill_quests');
    document.querySelector('.tab-button[data-tab="tab7"]').textContent = i18n.translate('object_data');
    document.querySelector('.tab-button[data-tab="tab8"]').textContent = i18n.translate('enchanting_chances');
    document.querySelector('.tab-button[data-tab="tab9"]').textContent = i18n.translate('image_sheet');
    document.querySelector('.tab-button[data-tab="tab10"]').textContent = i18n.translate('google_sheet_market_integration');
    document.querySelector('.tab-button[data-tab="tab11"]').textContent = i18n.translate('version_comparison');

    // 更新 Tab 內容標題
    document.querySelector('#tab1-content h2').textContent = i18n.translate('item_data_table');
    document.querySelector('#tab2-content h2').textContent = i18n.translate('carpentry_recipes_table');
    document.querySelector('#tab3-content h2').textContent = i18n.translate('forge_recipes_table');
    document.querySelector('#tab4-content h2').textContent = i18n.translate('npc_data_table');
    document.querySelector('#tab5-content h2').textContent = i18n.translate('pet_data_table');
    document.querySelector('#tab6-content h2').textContent = i18n.translate('skill_quests_table');
    document.querySelector('#tab7-content h2').textContent = i18n.translate('object_data_table');
    document.querySelector('#tab8-content h2').textContent = i18n.translate('enchanting_chances_table');
    document.querySelector('#tab9-content h2').textContent = i18n.translate('image_sheet_table');
    document.querySelector('#tab10-content h2').textContent = i18n.translate('google_sheet_market_integration');
    document.querySelector('#tab11-content h2').textContent = i18n.translate('version_comparison');
}

/**
 * 更新 Google Sheet 市場整合功能中的 UI 文本。
 */
function updateGoogleSheetUIText() {
    const googleSheetUrlInput = document.getElementById('google-sheet-url');
    const loadSheetButton = document.getElementById('load-sheet-button');
    const forceReloadSheetButton = document.getElementById('force-reload-sheet-button');
    const exportCsvButton = document.getElementById('export-csv-button');
    const importCsvButton = document.getElementById('import-csv-button');

    if (googleSheetUrlInput) googleSheetUrlInput.placeholder = i18n.translate('enter_google_sheet_url_or_id');
    if (loadSheetButton) loadSheetButton.textContent = i18n.translate('load_data');
    if (forceReloadSheetButton) forceReloadSheetButton.textContent = i18n.translate('force_reload');
    if (exportCsvButton) exportCsvButton.textContent = i18n.translate('export_as_csv');
    if (importCsvButton) importCsvButton.textContent = i18n.translate('import_csv');
}

/**
 * 更新版本比較功能中的 UI 文本。
 */
function updateVersionComparisonUIText() {
    const versionALabel = document.querySelector('label[for="versionA-select"]');
    const versionBLabel = document.querySelector('label[for="versionB-select"]');
    const compareVersionsButton = document.getElementById('compare-versions-button');

    if (versionALabel) versionALabel.textContent = i18n.translate('version_a');
    if (versionBLabel) versionBLabel.textContent = i18n.translate('version_b');
    if (compareVersionsButton) compareVersionsButton.textContent = i18n.translate('compare_versions');
}


document.addEventListener('DOMContentLoaded', async () => {
    // 初始化 i18n 模組
    await i18n.init();

    // 語言切換邏輯
    const langSelect = document.getElementById('lang-select');
    if (langSelect) {
        /**
         * 動態填充語言選擇器。
         */
        const populateLanguageSelector = () => {
            langSelect.innerHTML = ''; // 清空現有選項
            // 確保 availableLanguages 是陣列且有數據
            if (Array.isArray(i18n.availableLanguages) && i18n.availableLanguages.length > 0) {
                i18n.availableLanguages.forEach(lang => {
                    const option = document.createElement('option');
                    option.value = lang.code;
                    option.textContent = i18n.translateLangName(lang.name); // 翻譯語言名稱
                    langSelect.appendChild(option);
                });
            } else {
                console.warn("i18n.availableLanguages 為空或不是陣列，無法填充語言選擇器。");
                // 可以添加預設選項，例如：
                const defaultOption = document.createElement('option');
                defaultOption.value = 'en';
                defaultOption.textContent = 'English';
                langSelect.appendChild(defaultOption);
            }
        };

        // 在 i18n 初始化後立即填充語言選擇器
        populateLanguageSelector();

        // 設定當前選定的語言
        langSelect.value = i18n.currentLang;

        // 監聽語言切換事件
        langSelect.addEventListener('change', async (event) => {
            const newLang = event.target.value;
            await i18n.setLanguage(newLang);
            // 語言切換後重新渲染所有表格和 UI 文本
            await renderAllTables(true); // 強制重新載入數據以確保所有文本更新
            // 重新填充語言選擇器以更新語言名稱翻譯
            populateLanguageSelector();
        });
    } else {
        console.error("語言選擇器元素未找到。");
    }

    // 處理 Tab 切換邏輯
    document.querySelectorAll('.tab-button').forEach(button => {
        button.addEventListener('click', () => {
            document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

            button.classList.add('active');
            document.getElementById(`${button.dataset.tab}-content`).classList.add('active');
        });
    });

    // 預設激活「物品資料」Tab
    const defaultTabButton = document.querySelector('.tab-button[data-tab="tab1"]');
    if (defaultTabButton) {
        defaultTabButton.click();
    }

    // 載入數據並生成表格 (首次載入)
    await renderAllTables();


    // Google Sheet 市場整合功能邏輯
    // 在 Google Charts Library 載入完成後初始化
    google.charts.load('current', { packages: ['corechart', 'table'] });
    google.charts.setOnLoadCallback(() => {
        const googleSheetUrlInput = document.getElementById('google-sheet-url');
        const loadSheetButton = document.getElementById('load-sheet-button');
        const forceReloadSheetButton = document.getElementById('force-reload-sheet-button');
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
                sheetStatusDiv.textContent = i18n.translate('enter_google_sheet_url_or_id_message');
                return;
            }

            sheetStatusDiv.textContent = forceReload ? i18n.translate('force_reloading_data') : i18n.translate('loading_data');
            sheetDataDisplayDiv.innerHTML = ''; // 清空之前的數據

            try {
                const sheetData = await loadGoogleSheetData(urlOrId, '', forceReload); // 傳遞 forceReload 參數
                sheetStatusDiv.textContent = i18n.translate('data_loaded_successfully');
                currentMarketPricesData = sheetData; // 更新記憶體中的數據
                
                renderSheetData(currentMarketPricesData); // 渲染數據

            } catch (error) {
                sheetStatusDiv.textContent = i18n.translate('load_failed', error.message);
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
                sheetDataDisplayDiv.textContent = i18n.translate('no_data_in_google_sheet');
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
                    alert(i18n.translate('please_enter_valid_number'));
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
                console.log(i18n.translate('market_data_updated_and_saved'));
            } catch (e) {
                console.error(i18n.translate('failed_to_save_updated_data'), e);
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
                        console.error(i18n.translate('failed_to_parse_cached_data'), e);
                        sheetStatusDiv.textContent = i18n.translate('export_failed_parse_cache');
                        return;
                    }
                } else {
                    sheetStatusDiv.textContent = i18n.translate('no_data_to_export');
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
            sheetStatusDiv.textContent = i18n.translate('data_exported_successfully');
        });

        // CSV 匯入功能
        importCsvButton.addEventListener('click', () => {
            importCsvFileInput.click(); // 觸發隱藏的檔案輸入點擊事件
        });

        importCsvFileInput.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (!file) {
                sheetStatusDiv.textContent = i18n.translate('please_select_csv_file');
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
                        sheetStatusDiv.textContent = i18n.translate('csv_data_imported_successfully');
                        console.log(i18n.translate('csv_data_imported_and_updated'), currentMarketPricesData);
                    } else {
                        sheetStatusDiv.textContent = i18n.translate('no_valid_data_in_csv');
                    }
                } catch (error) {
                    sheetStatusDiv.textContent = i18n.translate('import_failed', error.message);
                    console.error(i18n.translate('failed_to_parse_or_import_csv'), error);
                } finally {
                    // 清空檔案輸入，以便再次選擇同一個檔案時能觸發 change 事件
                    event.target.value = '';
                }
            };
            reader.onerror = () => {
                sheetStatusDiv.textContent = i18n.translate('failed_to_read_file');
            };
            reader.readAsText(file);
        });

        // 初始載入：如果輸入框有值，則嘗試載入數據（優先從快取）
        const cachedData = localStorage.getItem('marketPricesCache');
        if (cachedData) {
            try {
                currentMarketPricesData = JSON.parse(cachedData);
                renderSheetData(currentMarketPricesData);
                sheetStatusDiv.textContent = i18n.translate('data_loaded_from_cache');
            } catch (e) {
                console.error(i18n.translate('failed_to_parse_cached_data'), e);
                sheetStatusDiv.textContent = i18n.translate('failed_to_load_from_cache_try_google_sheet');
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

    // 版本比較功能邏輯 (現在是 tab11)
    const versionASelect = document.getElementById('versionA-select');
    const versionBSelect = document.getElementById('versionB-select');
    const compareVersionsButton = document.getElementById('compare-versions-button');
    const comparisonResultsDiv = document.getElementById('version-comparison-results');

    if (versionASelect && versionBSelect && compareVersionsButton && comparisonResultsDiv) {
        compareVersionsButton.addEventListener('click', async () => {
            const versionAPath = versionASelect.value;
            const versionBPath = versionBSelect.value;

            comparisonResultsDiv.innerHTML = i18n.translate('loading_and_comparing_data');

            try {
                // 載入兩個版本的 item_base 數據
                const itemBaseA = await loadJsFileVariable(versionAPath, 'item_base');
                const itemBaseB = await loadJsFileVariable(versionBPath, 'item_base');

                console.log(i18n.translate('version_a_loaded', versionAPath));
                console.log(i18n.translate('version_b_loaded', versionBPath));
                console.log(i18n.translate('version_a_item_count', itemBaseA ? itemBaseA.length : 0));
                console.log(i18n.translate('version_b_item_count', itemBaseB ? itemBaseB.length : 0));

                // 執行比較
                const comparisonResult = compareData(itemBaseA, itemBaseB, 'b_i'); // 假設 'b_i' 是唯一 ID
                console.log(i18n.translate('comparison_results'), comparisonResult);

                // 顯示結果
                renderComparisonResults(comparisonResult, comparisonResultsDiv);

            } catch (error) {
                comparisonResultsDiv.innerHTML = `<p style="color: red;">${i18n.translate('failed_to_load_or_compare_data', error.message)}</p>`;
                console.error(i18n.translate('version_comparison_failed'), error);
            }
        });
    } else {
        console.error(i18n.translate('version_comparison_ui_not_found'));
    }
});

/**
 * 渲染版本比較結果到指定的 DOM 元素。
 * @param {Object} results - 比較結果物件 (added, removed, modified)。
 * @param {HTMLElement} containerElement - 顯示結果的 DOM 容器。
 */
function renderComparisonResults(results, containerElement) {
    console.log(i18n.translate('rendering_comparison_results'), results);
    console.log(i18n.translate('added_count', results.added.length));
    console.log(i18n.translate('removed_count', results.removed.length));
    console.log(i18n.translate('modified_count', results.modified.length));

    let html = '';

    // 新增的條目
    if (results.added.length > 0) {
        html += `<div class="comparison-section added">
                    <h3>${i18n.translate('added_items', results.added.length)}</h3>
                    <ul class="comparison-list">`;
        results.added.forEach(item => {
            html += `<li>${i18n.translate('id')}: ${item.b_i}, ${i18n.translate('name')}: ${item.name || 'N/A'}</li>`;
        });
        html += `</ul></div>`;
    }

    // 刪除的條目
    if (results.removed.length > 0) {
        html += `<div class="comparison-section removed">
                    <h3>${i18n.translate('removed_items', results.removed.length)}</h3>
                    <ul class="comparison-list">`;
        results.removed.forEach(item => {
            html += `<li>${i18n.translate('id')}: ${item.b_i}, ${i18n.translate('name')}: ${item.name || 'N/A'}</li>`;
        });
        html += `</ul></div>`;
    }

    // 修改的條目
    if (results.modified.length > 0) {
        html += `<div class="comparison-section modified">
                    <h3>${i18n.translate('modified_items', results.modified.length)}</h3>
                    <ul class="comparison-list">`;
        results.modified.forEach(modItem => {
            html += `<li>
                        ${i18n.translate('id')}: ${modItem.id}, ${i18n.translate('name')}: ${modItem.itemB.name || modItem.itemA.name || 'N/A'}
                        <div class="modified-details">`;
            for (const key in modItem.changes) {
                const change = modItem.changes[key];
                if (change.old === undefined) {
                    html += `<span>${i18n.translate('attribute', key)}: <span class="new-value">${i18n.translate('added', JSON.stringify(change.new))}</span></span>`;
                } else if (change.new === undefined) {
                    html += `<span>${i18n.translate('attribute', key)}: <span class="old-value">${i18n.translate('removed', JSON.stringify(change.old))}</span></span>`;
                } else {
                    html += `<span>${i18n.translate('attribute', key)}: <span class="old-value">${JSON.stringify(change.old)}</span> &rarr; <span class="new-value">${JSON.stringify(change.new)}</span></span>`;
                }
            }
            html += `</div></li>`;
        });
        html += `</ul></div>`;
    }

    if (results.added.length === 0 && results.removed.length === 0 && results.modified.length === 0) {
        html = `<p>${i18n.translate('no_differences_found')}</p>`;
    }

    containerElement.innerHTML = html;
}