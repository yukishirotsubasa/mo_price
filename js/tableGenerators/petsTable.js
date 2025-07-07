import i18n from '../i18n.js'; // 導入 i18n 模組
import { getItemDisplayContent } from '../utils.js'; // 導入新的顯示函數

export function generatePetsTable(containerId, pets, generateTableHTML, createItemNameMap, itemBase, allPets, fletchingFormulas, arrowMaterialImg) {
    const container = document.getElementById(containerId);

    if (!pets) {
        container.innerHTML = '<p>pets data not doaded。</p>';
        return;
    }

    // 使用 i18n.translate 翻譯表頭
    const headers = ['id', 'name', 'Inventory Slots', 'breeding_level', 'total_eat', 'eats', 'insurance_cost', 'item_id', 'level', 'likes', 'xp_required'];

    // 獲取 imageSheet 數據
    const imageSheet = window.allData?.imageSheet || null;
    const petNameMap = new Map(allPets.filter(p => p.b_i !== undefined && p.name !== undefined).map(p => [p.b_i, i18n.translate(p.name)]));

    const rowMapper = (pet) => {
        const eats = pet.params && pet.params.eats ? Object.entries(pet.params.eats || {}).map(([itemId, value]) => `${getItemDisplayContent(Number(itemId), itemBase, i18n.translate, 'image', imageSheet, fletchingFormulas, arrowMaterialImg)}(${value * pet.params.eat_interval})`).join(', ') : '無';
        const insuranceCost = pet.params && pet.params.insurance_cost ? pet.params.insurance_cost.join(', ') : '無';
        // likes 欄位：將寵物ID轉換為寵物圖片
        const likes = pet.params && pet.params.likes ? 
            pet.params.likes.map(like => {
                // 直接使用 pets[like.pet_id] 訪問寵物對象
                const likedPet = pets[like.pet_id];
                const petDisplay = likedPet && likedPet.params && likedPet.params.item_id ? 
                    getItemDisplayContent(likedPet.params.item_id, itemBase, i18n.translate, 'image', imageSheet, fletchingFormulas, arrowMaterialImg) : 
                    `Pet ${like.pet_id}`;
                return `${petDisplay} (XP: ${like.xp})`;
            }).join(', ') : '無';

        // name 欄位：使用寵物的道具ID來獲取圖片
        const petImage = pet && pet.params && pet.params.item_id ? 
            getItemDisplayContent(pet.params.item_id, itemBase, i18n.translate, 'image', imageSheet, fletchingFormulas, arrowMaterialImg) : 
            i18n.translate(pet.name);
            
        return [
            pet.b_i,
            petImage, // 寵物圖片而非名稱
            pet.params ? pet.params.inventory_slots : '',
            pet.params ? pet.params.breeding_level : '',
            pet.params ? pet.params.happiness - pet.params.eat_interval : '',
            eats,
            insuranceCost,
            pet.params ? pet.params.item_id : '',
            pet.params ? pet.params.level : '',
            likes,
            pet.params ? pet.params.xp_required : ''
        ];
    };

    const tableHTML = generateTableHTML(headers, pets, rowMapper, i18n.translate);
    container.innerHTML = tableHTML;
}