import i18n from '../i18n.js'; // 導入 i18n 模組

export function generateSkillQuestTable(skillQuest, generateTableHTML, createItemNameMap, itemBase) {
    const container = document.getElementById('skill-quest-table-container');
    if (!container) {
        console.error('Skill Quest table container not found.');
        return;
    }

    if (!skillQuest) {
        container.innerHTML = '<p>skill quest data not doaded。</p>';
        return;
    }

    const headers = ['ID', 'skill', 'count', 'item ID', 'min QP', 'QP', 'rewards'];

    const rowMapper = (quest) => {
        const rewards = quest.reward ? quest.reward.join(', ') : '無';
        return [
            quest.id,
            quest.skill,
            quest.amount,
            quest.item_id,
            quest.min_qp,
            quest.qp,
            rewards
        ];
    };

    const tableHTML = generateTableHTML(headers, skillQuest.quests, rowMapper, i18n.translate); // SkillQuest 是一個物件，包含 quests 陣列
    container.innerHTML = tableHTML;
}