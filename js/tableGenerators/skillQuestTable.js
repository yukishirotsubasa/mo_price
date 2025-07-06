import i18n from '../i18n.js'; // 導入 i18n 模組
import { getItemDisplayContent } from '../utils.js'; // 導入新的顯示函數

export function generateSkillQuestTable(containerId, skillQuest, generateTableHTML, createItemNameMap, itemBase) {
    const container = document.getElementById(containerId);

    if (!skillQuest || !skillQuest.quests || !Array.isArray(skillQuest.quests)) {
        container.innerHTML = `
            <div class="skill-quest-controls">
                <p style="color: red;">${i18n.translate('skill_quest_data_not_loaded')}</p>
            </div>
        `;
        return;
    }

    // 獲取 imageSheet 數據
    const imageSheet = window.allData?.imageSheet || null;

    // Create the controls section
    const controlsHTML = createSkillQuestControls(skillQuest);
    
    // Create the table section with default difficulty (0)
    const tableHTML = createSkillQuestTable(skillQuest, itemBase, generateTableHTML, 0);
    
    container.innerHTML = controlsHTML + tableHTML;
    
    // Add event listeners for the controls
    setupSkillQuestEventListeners(skillQuest, itemBase, generateTableHTML);
}

function createSkillQuestControls(skillQuest) {
    // Get unique skills from quests
    const uniqueSkills = [...new Set(skillQuest.quests.map(quest => quest.skill))];
    
    // Create difficulty options using GRADE_TO_NAME
    const gradeOptions = skillQuest.GRADE_TO_NAME || {0: 'Common', 1: 'Rare', 2: 'Legendary'};
    
    let controlsHTML = `
        <div class="skill-quest-controls">
            <div class="control-group">
                <label>${i18n.translate('difficulty')}:</label>
                <div class="difficulty-buttons" data-current-difficulty="0">
    `;
    
    // Add difficulty buttons
    Object.entries(gradeOptions).forEach(([key, value]) => {
        const activeClass = key === '0' ? 'active' : '';
        controlsHTML += `<button class="difficulty-btn ${activeClass}" data-difficulty="${key}">${i18n.translate(value)}</button>`;
    });
    
    controlsHTML += `
                </div>
            </div>
            <div class="control-group">
                <label for="skill-select">${i18n.translate('skill')}:</label>
                <select id="skill-select">
                    <option value="">${i18n.translate('all_skills')}</option>
    `;
    
    // Add skill options
    uniqueSkills.forEach(skill => {
        controlsHTML += `<option value="${skill}">${i18n.translate(skill)}</option>`;
    });
    
    controlsHTML += `
                </select>
            </div>
        </div>
    `;
    
    return controlsHTML;
}

function createSkillQuestTable(skillQuest, itemBase, generateTableHTML, currentDifficulty = 0) {
    // 獲取 imageSheet 數據
    const imageSheet = window.allData?.imageSheet || null;
    const headers = ['id', 'skill', 'min_point', 'name', 'amount', 'exp', 'coins', 'mos', 'item', 'point'];
    
    const rowMapper = (quest, index) => {
        // Get multipliers based on difficulty
        const itemMultiplier = getMultiplier(skillQuest.ITEM_MULTIPLIER, currentDifficulty);
        const expMultiplier = getMultiplier(skillQuest.EXP_MULTIPLIER, currentDifficulty);
        const coinsMultiplier = getMultiplier(skillQuest.COINS_MULTIPLIER, currentDifficulty);
        const mosMultiplier = getMultiplier(skillQuest.MOS_MULTIPLIER, currentDifficulty);
        
        
        // Calculate values
        const amount = quest.amount * itemMultiplier;
        const exp = quest.reward && quest.reward[0] ? quest.reward[0] * expMultiplier : 0;
        const coins = quest.reward && quest.reward[1] ? quest.reward[1] * coinsMultiplier : 0;
        const mos = quest.reward && quest.reward[2] ? quest.reward[2] * mosMultiplier : 0;
        
        // Get item names
        const questItemName = getItemDisplayContent(quest.item_id, itemBase, i18n.translate, 'image', imageSheet, allData?.fletchingFormulas, allData?.arrowMaterialImg);
        const rewardItemId = quest.reward && quest.reward[3] ? quest.reward[3] : null;
        const rewardItemName = rewardItemId ? getItemDisplayContent(rewardItemId, itemBase, i18n.translate, 'image', imageSheet, allData?.fletchingFormulas, allData?.arrowMaterialImg) : i18n.translate('none');
        
        return [
            index + 1, // Sequential ID
            i18n.translate(quest.skill),
            quest.min_qp,
            questItemName,
            Math.round(amount),
            Math.round(exp),
            Math.round(coins),
            Math.round(mos),
            rewardItemName,
            quest.qp
        ];
    };
    
    return `<div id="skill-quest-table-content">${generateTableHTML(headers, skillQuest.quests, rowMapper, i18n.translate)}</div>`;
}

function getMultiplier(multiplierArray, difficulty) {
    return multiplierArray[difficulty] || 1;
}

function setupSkillQuestEventListeners(skillQuest, itemBase, generateTableHTML) {
    // Use setTimeout to ensure DOM elements are ready
    setTimeout(() => {
        const difficultyButtons = document.querySelectorAll('.difficulty-btn');
        const skillSelect = document.getElementById('skill-select');
        const difficultyContainer = document.querySelector('.difficulty-buttons');
        
        const getCurrentDifficulty = () => {
            return difficultyContainer ? parseInt(difficultyContainer.dataset.currentDifficulty) : 0;
        };
        
        const updateTable = () => {
            const selectedSkill = skillSelect ? skillSelect.value : '';
            const currentDifficulty = getCurrentDifficulty();
            let filteredQuests = skillQuest.quests;
            
            // Filter by skill if selected
            if (selectedSkill) {
                filteredQuests = skillQuest.quests.filter(quest => quest.skill === selectedSkill);
            }
            
            // Create a temporary skillQuest object with filtered data
            const filteredSkillQuest = {
                ...skillQuest,
                quests: filteredQuests
            };
            
            // Generate new table with current difficulty and filtered quests
            const newTableHTML = createSkillQuestTable(filteredSkillQuest, itemBase, generateTableHTML, currentDifficulty);
            
            // Replace the table content
            const tableContainer = document.getElementById('skill-quest-table-content');
            if (tableContainer) {
                // Extract just the table HTML from the wrapper div
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = newTableHTML;
                const tableContent = tempDiv.querySelector('#skill-quest-table-content');
                if (tableContent) {
                    tableContainer.innerHTML = tableContent.innerHTML;
                }
            }
        };
        
        // Add event listeners for difficulty buttons
        difficultyButtons.forEach(button => {
            button.addEventListener('click', () => {
                const difficulty = button.dataset.difficulty;
                
                // Update active state
                difficultyButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                
                // Update current difficulty
                if (difficultyContainer) {
                    difficultyContainer.dataset.currentDifficulty = difficulty;
                }
                
                // Update table
                updateTable();
            });
        });
        
        if (skillSelect) {
            skillSelect.addEventListener('change', updateTable);
        } else {
            console.error('Skill select element not found');
        }
    }, 100);
}