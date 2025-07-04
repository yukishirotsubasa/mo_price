// js/managers/TranslationManager.js
import i18n from '../i18n.js';

export class TranslationManager {
    static initializeTranslations() {
        if (!i18n.translations[i18n.currentLang]) {
            return;
        }

        const translations = {
            'enchanting_cost_data_will_be_displayed_here': '附魔成本數據將顯示在這裡。',
            'Enchanting': '附魔',
            'explanation': '說明',
            'failed_to_load_explanation_page': '載入說明頁面失敗: {0}',
            'Open Item': '開啟物品',
            'No data available for this item.': '此物品無可用數據。',
            'Key': '鑰匙',
            'Level': '等級',
            'Name': '名稱',
            'Base Chance': '基礎機率',
            'Real Chance': '實際機率',
            'Price': '價格',
            'base chance': '基礎機率',
            'real chance': '實際機率',
            'parent1': '父寵物1',
            'parent2': '父寵物2',
            'plan': '計劃',
            'one bar': '一格',
            'full': '滿格',
            'comp': '完成',
            'exp': '經驗值',
            'adjustment': '修正機率',
            'total value': '總價值',
            'Breeding': '繁殖',
            'Breeding Cost Calculator': '繁殖成本計算器',
            'other plans': '其他計劃',
            'no available plans': '無可用計劃',
            'pet data not loaded or unavailable': '寵物數據未載入或不可用',
            'item data not loaded': '物品數據未載入',
            'no available breeding combinations': '沒有可用的繁殖組合',
            'cost': '成本',
            'Recycle': '分解',
            'Recycle Cost Calculator': '分解成本計算器',
            'recycle_data_not_available': '分解數據未載入或不可用',
            'itemName': '物品名稱',
            'worth': '價值',
            'MonsterBook': '怪物圖鑑',
            'monster_book_data_not_loaded': '怪物圖鑑數據未載入或不可用',
            'unknown_npc': '未知NPC',
            'kills': '擊殺數',
            'count': '數量',
            'drop': '掉落'
        };

        Object.entries(translations).forEach(([key, value]) => {
            if (!i18n.translations[i18n.currentLang][key]) {
                i18n.translations[i18n.currentLang][key] = value;
            }
        });
    }
}