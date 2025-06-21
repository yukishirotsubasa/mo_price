import i18n from '../i18n.js'; // 導入 i18n 模組

export function generatePetsTable(pets, generateTableHTML, createItemNameMap, itemBase, allPets) {
    const container = document.getElementById('pets-table-container');
    if (!container) {
        console.error('Pets table container not found.');
        return;
    }

    if (!pets) {
        container.innerHTML = '<p>pets data not doaded。</p>';
        return;
    }

    // 使用 i18n.translate 翻譯表頭
    const headers = ['id', 'name', 'breeding_level', 'eat_interval', 'eats', 'happiness', 'insurance_cost', 'item_id', 'level', 'likes', 'xp_required'];

    const itemNameMap = createItemNameMap(itemBase, i18n.translate);
    const petNameMap = new Map(allPets.filter(p => p.b_i !== undefined && p.name !== undefined).map(p => [p.b_i, i18n.translate(p.name)]));

    const rowMapper = (pet) => {
        const eats = pet.params && pet.params.eats ? Object.entries(pet.params.eats || {}).map(([itemId, value]) => `${itemNameMap.get(Number(itemId)) || `未知物品ID: ${itemId}`}(${value})`).join(', ') : '無';
        const insuranceCost = pet.params && pet.params.insurance_cost ? pet.params.insurance_cost.join(', ') : '無';
        const likes = pet.params && pet.params.likes ? pet.params.likes.map(like => `${petNameMap.get(like.pet_id) || `未知寵物ID: ${like.pet_id}`} (XP: ${like.xp})`).join(', ') : '無';

        return [
            pet.b_i,
            i18n.translate(pet.name), // 直接翻譯寵物名稱
            pet.params ? pet.params.breeding_level : 'N/A',
            pet.params ? pet.params.eat_interval : 'N/A',
            eats,
            pet.params ? pet.params.happiness : 'N/A',
            insuranceCost,
            pet.params ? pet.params.item_id : 'N/A',
            pet.params ? pet.params.level : 'N/A',
            likes,
            pet.params ? pet.params.xp_required : 'N/A'
        ];
    };

    const tableHTML = generateTableHTML(headers, pets, rowMapper, i18n.translate);
    container.innerHTML = tableHTML;
}