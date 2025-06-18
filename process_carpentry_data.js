// 模擬 CARPENTRY_FORMULAS 和 item_base 資料，因為這些資料已在記憶體中，無法直接讀取。
// 這些模擬資料的結構是根據任務描述推斷的。

// 1. 從 CARPENTRY_FORMULAS 資料中，合併 floors, furniture, 和 walls 這三個類別的所有項目。
const mergedItems = [
    ...(CARPENTRY_FORMULAS.floors || []),
    ...(CARPENTRY_FORMULAS.furniture || []),
    ...(CARPENTRY_FORMULAS.walls || [])
];

// 2. 使用 item_base 資料建立一個 item_id 到 item_name 的映射表。
const itemNameMap = item_base.reduce((map, item) => {
    map[item.b_i] = item.name;
    return map;
}, {});

// 3. 處理每個合併後的項目
const processedData = mergedItems.map(item => {
    // 提取 item_id, consumes, craftable, 和 level 欄位。
    const { item_id, consumes, craftable, level } = item;

    // 將 consumes 陣列中的每個物件轉換為 item_id*數量 的字串格式。
    // 如果 consumes 為空，則顯示為空字串。
    const consumesString = consumes.map(c => `${c.id}*${c.count}`).join(', ');

    // 將整理後的資料中的 item_id 轉換為對應的 item_name。
    const itemName = itemNameMap[item_id] || `未知物品 (${item_id})`;

    // 將 consumes 字串中的所有 item_id 都轉換為對應的 item_name。
    const transformedConsumesString = consumesString.split(', ').map(part => {
        if (part === "") return ""; // 處理空字串
        const [id, count] = part.split('*');
        const name = itemNameMap[id] || `未知物品 (${id})`;
        return `${name}*${count}`;
    }).filter(Boolean).join(', '); // 過濾掉空字串，以防萬一

    return {
        item_name: itemName,
        consumes: transformedConsumesString,
        craftable,
        level
    };
});

// 將最終結果輸出為 JSON 格式
console.log(JSON.stringify(processedData, null, 2));