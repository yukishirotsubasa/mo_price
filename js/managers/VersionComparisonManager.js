// js/managers/VersionComparisonManager.js
import { loadJsFileVariable } from '../dataLoader.js';
import { compareData } from '../utils.js';
import i18n from '../i18n.js';
import { getItemDisplayContent } from '../utils.js';
import errorHandler from '../core/ErrorHandler.js';

export class VersionComparisonManager {
    constructor() {
        this.versions = null;
    }

    // 載入版本配置
    async loadVersions() {
        try {
            const response = await fetch('config/versions.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            this.versions = await response.json();
            return this.versions;
        } catch (error) {
            console.error('Failed to load versions:', error);
            errorHandler.logDataError('loadVersions', error);
            return null;
        }
    }

    // 填充版本選擇器
    populateVersionSelects() {
        if (!this.versions) return;

        const versionASelect = document.getElementById('versionA-select');
        const versionBSelect = document.getElementById('versionB-select');

        if (!versionASelect || !versionBSelect) return;

        // 清空現有選項
        versionASelect.innerHTML = '';
        versionBSelect.innerHTML = '';

        // 按版本號降序排列
        const sortedVersions = Object.entries(this.versions)
            .sort(([a], [b]) => parseInt(b) - parseInt(a));

        sortedVersions.forEach(([version, date], index) => {
            // 將底線格式的日期轉換為顯示格式 (2025_0417 -> 2025-04-17)
            const displayDate = date.replace('_', '-').replace(/(\d{4})-(\d{2})(\d{2})/, '$1-$2-$3');
            const optionText = `${displayDate} - ${version}`;
            // 直接使用設定檔中的日期格式，無需轉換
            const optionValue = `releaseJs/release_${date}.js`;
            
            const optionA = new Option(optionText, optionValue);
            const optionB = new Option(optionText, optionValue);
            
            versionASelect.add(optionA);
            versionBSelect.add(optionB);
        });

        // 預設選擇最新的兩個版本
        if (sortedVersions.length >= 2) {
            versionASelect.selectedIndex = 1; // 第二新版本（舊版本）
            versionBSelect.selectedIndex = 0; // 最新版本（新版本）
        } else if (sortedVersions.length === 1) {
            versionASelect.selectedIndex = 0;
            versionBSelect.selectedIndex = 0;
        }

        // 自動執行比較
        if (sortedVersions.length >= 1) {
            // 延遲執行以確保DOM已完全更新
            setTimeout(() => {
                this.handleCompareVersions();
            }, 100);
        }
    }

    // 將main.js中的initVersionComparisonUI函數移動到這裡
    async initVersionComparisonUI() {
        const versionASelect = document.getElementById('versionA-select');
        const versionBSelect = document.getElementById('versionB-select');
        const compareVersionsButton = document.getElementById('compare-versions-button');
        const comparisonResultsDiv = document.getElementById('version-comparison-results');

        if (versionASelect && versionBSelect && compareVersionsButton && comparisonResultsDiv) {
            // 載入版本配置並填充選擇器
            await this.loadVersions();
            this.populateVersionSelects();

            // 移除舊的事件監聽器以避免重複綁定
            compareVersionsButton.removeEventListener('click', this.handleCompareVersions);
            // 綁定新的事件監聽器
            compareVersionsButton.addEventListener('click', () => this.handleCompareVersions());
        } else {
            console.error(i18n.translate('version_comparison_ui_not_found'));
        }
    }

    // 將handleCompareVersions函數從initVersionComparisonUI中提取出來
    async handleCompareVersions() {
        const versionASelect = document.getElementById('versionA-select');
        const versionBSelect = document.getElementById('versionB-select');
        const comparisonResultsDiv = document.getElementById('version-comparison-results');

        const versionAPath = versionASelect.value;
        const versionBPath = versionBSelect.value;

        comparisonResultsDiv.innerHTML = i18n.translate('loading_and_comparing_data');

        try {
            // 載入兩個版本的 item_base 數據
            const itemBaseA = await loadJsFileVariable(versionAPath, 'item_base');
            const itemBaseB = await loadJsFileVariable(versionBPath, 'item_base');

            // 執行比較
            const comparisonResult = compareData(itemBaseA, itemBaseB, 'b_i'); // 假設 'b_i' 是唯一 ID

            // 顯示結果
            this.renderComparisonResults(comparisonResult, comparisonResultsDiv);

        } catch (error) {
            comparisonResultsDiv.innerHTML = `<p style="color: red;">${i18n.translate('failed_to_load_or_compare_data', error.message)}</p>`;
            console.error(i18n.translate('version_comparison_failed'), error);
            errorHandler.logDataError('versionComparison', error, { versionAPath, versionBPath });
        }
    }

    // 將main.js中的renderComparisonResults函數移動到這裡
    renderComparisonResults(results, containerElement) {

        let html = '';

        // 新增的條目 - 改為手風琴樣式
        if (results.added.length > 0) {
            html += `<div class="comparison-section added collapsible">
                        <h3 class="collapsible-header">${i18n.translate('New') + " " + i18n.translate('Item')}</h3>
                        <div class="collapsible-content">
                            ${this.renderAddedItemsTable(results.added)}
                        </div>
                    </div>`;
        }

        // 刪除的條目 - 改為手風琴樣式
        if (results.removed.length > 0) {
            html += `<div class="comparison-section removed collapsible">
                        <h3 class="collapsible-header">${i18n.translate('Remove') + " " + i18n.translate('Item')}</h3>
                        <div class="collapsible-content">
                            <ul class="comparison-list">`;
            results.removed.forEach(item => {
                html += `<li>${i18n.translate('Id')}: ${item.b_i}, ${i18n.translate('Image')}: ${getItemDisplayContent(item.b_i, window.allData?.itemBase || [], i18n.translate, 'image', window.allData?.imageSheet || null)}</li>`;
            });
            html += `</ul></div></div>`;
        }

        // 修改的條目 - 改為手風琴樣式
        if (results.modified.length > 0) {
            html += `<div class="comparison-section modified collapsible">
                        <h3 class="collapsible-header">${i18n.translate('modified') + " " + i18n.translate('Item')}</h3>
                        <div class="collapsible-content">
                            <ul class="comparison-list">`;
            results.modified.forEach(modItem => {
                html += `<li>
                            ${i18n.translate('Id')}: ${modItem.id}, ${i18n.translate('Name')}: ${i18n.translate(modItem.itemB.name || modItem.itemA.name || 'N/A')}
                            <div class="modified-details">`;
                for (const key in modItem.changes) {
                    const change = modItem.changes[key];
                    if (key === 'name') {
                        // 對於 name 屬性，直接顯示字串內容
                        html += `<div><strong>${i18n.translate('Name')}:</strong> <span class="old-value">${change.old || 'N/A'}</span> &rarr; <span class="new-value">${change.new || 'N/A'}</span></div>`;
                    } else if (key === 'params') {
                        // 對於 params 屬性，格式化顯示 object 內容
                        const oldParams = change.old ? JSON.stringify(change.old, null, 2) : 'N/A';
                        const newParams = change.new ? JSON.stringify(change.new, null, 2) : 'N/A';
                        html += `<div><strong>Params:</strong></div>`;
                        html += `<div class="params-comparison">`;
                        html += `<div class="old-params"><strong>${i18n.translate('version') + " old"}:</strong><pre class="old-value">${oldParams}</pre></div>`;
                        html += `<div class="new-params"><strong>${i18n.translate('version') + " new"}:</strong><pre class="new-value">${newParams}</pre></div>`;
                        html += `</div>`;
                    }
                }
                html += `</div></li>`;
            });
            html += `</ul></div></div>`;
        }

        if (results.added.length === 0 && results.removed.length === 0 && results.modified.length === 0) {
            html = `<p>${i18n.translate('no_differences_found')}</p>`;
        }

        containerElement.innerHTML = html;
        
        // 重新註冊手風琴事件監聽器（因為內容是動態生成的）
        this.setupCollapsibleEvents(containerElement);
    }

    // 為動態生成的手風琴元素設置事件
    setupCollapsibleEvents(container) {
        const headers = container.querySelectorAll('.collapsible-header');
        headers.forEach(header => {
            // 移除可能存在的舊事件監聽器
            header.removeEventListener('click', this.handleCollapsibleClick);
            // 添加新的事件監聽器
            header.addEventListener('click', this.handleCollapsibleClick.bind(this));
        });

        // 預設讓所有 collapsible-content 區塊為收合狀態
        const contents = container.querySelectorAll('.collapsible-content');
        contents.forEach(content => {
            content.classList.add('collapsed');
            const header = content.previousElementSibling;
            if (header && header.classList.contains('collapsible-header')) {
                header.classList.add('collapsed');
            }
        });
    }

    // 手風琴點擊處理函數
    handleCollapsibleClick(event) {
        const header = event.currentTarget;
        const content = header.nextElementSibling;
        if (content && content.classList.contains('collapsible-content')) {
            content.classList.toggle('collapsed');
            header.classList.toggle('collapsed');
        }
    }

    // 渲染新增物品表格
    renderAddedItemsTable(addedItems) {
        const itemBase = window.allData?.itemBase || [];
        const imageSheet = window.allData?.imageSheet || null;
        const pets = window.allData?.pets || [];
        const fletchingFormulas = window.allData?.fletchingFormulas || null;
        const arrowMaterialImg = window.allData?.arrowMaterialImg || null;

        // 按照 id (b_i) 降序排列
        const sortedItems = [...addedItems].sort((a, b) => b.b_i - a.b_i);

        let tableHTML = `<table class="data-table">
            <thead>
                <tr>
                    <th>${i18n.translate('Id')}</th>
                    <th>${i18n.translate('Name')}</th>
                    <th>${i18n.translate('Image')}</th>
                    <th>${i18n.translate('Inventory Slots')}</th>
                    <th>Params</th>
                </tr>
            </thead>
            <tbody>`;

        sortedItems.forEach(item => {
            const itemId = item.b_i;
            const itemName = i18n.translate(item.name || 'unknown_item');
            const itemImage = getItemDisplayContent(itemId, itemBase, i18n.translate, 'image', imageSheet, fletchingFormulas, arrowMaterialImg);
            
            // 處理 Inventory Slots
            let inventorySlots = '';
            if (item.params && item.params.pet !== undefined) {
                // 直接使用 pets[item.params.pet] 來訪問寵物數據
                const petData = pets[item.params.pet];
                if (petData && petData.params && petData.params.inventory_slots !== undefined) {
                    inventorySlots = petData.params.inventory_slots;
                }
            }

            // 處理 params - 轉為純文字，太長自動換行
            let paramsText = '';
            if (item.params) {
                paramsText = JSON.stringify(item.params, null, 2)
                    .replace(/[{}]/g, '')
                    .replace(/"/g, '')
                    .replace(/,\s*\n/g, '\n')
                    .trim();
            }

            tableHTML += `<tr>
                <td>${itemId}</td>
                <td>${itemName}</td>
                <td>${itemImage}</td>
                <td>${inventorySlots}</td>
                <td style="white-space: pre-wrap; word-wrap: break-word; max-width: 300px;">${paramsText}</td>
            </tr>`;
        });

        tableHTML += '</tbody></table>';
        return tableHTML;
    }
}