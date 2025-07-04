// js/managers/VersionComparisonManager.js
import { loadJsFileVariable } from '../dataLoader.js';
import { compareData } from '../utils.js';
import i18n from '../i18n.js';
import errorHandler from '../core/ErrorHandler.js';

export class VersionComparisonManager {
    // 將main.js中的initVersionComparisonUI函數移動到這裡
    async initVersionComparisonUI() {
        const versionASelect = document.getElementById('versionA-select');
        const versionBSelect = document.getElementById('versionB-select');
        const compareVersionsButton = document.getElementById('compare-versions-button');
        const comparisonResultsDiv = document.getElementById('version-comparison-results');

        if (versionASelect && versionBSelect && compareVersionsButton && comparisonResultsDiv) {
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

            console.log(i18n.translate('version_a_loaded', versionAPath));
            console.log(i18n.translate('version_b_loaded', versionBPath));
            console.log(i18n.translate('version_a_item_count', itemBaseA ? itemBaseA.length : 0));
            console.log(i18n.translate('version_b_item_count', itemBaseB ? itemBaseB.length : 0));

            // 執行比較
            const comparisonResult = compareData(itemBaseA, itemBaseB, 'b_i'); // 假設 'b_i' 是唯一 ID
            console.log(i18n.translate('comparison_results'), comparisonResult);

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
}