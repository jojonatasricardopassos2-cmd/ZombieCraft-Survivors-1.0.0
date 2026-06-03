import fs from 'fs';

// 1. Fix GameCanvas.tsx
let gameCanvas = fs.readFileSync('components/GameCanvas.tsx', 'utf8');

gameCanvas = gameCanvas.replace(/BlockType\.DIAMOND_ORE_ORE/g, "BlockType.DIAMOND_ORE");
gameCanvas = gameCanvas.replace(/typeof quest\.rewardItem === 'number' \? 'BLOCK' : 'ITEM'/g, "typeof quest.rewardItem === 'number' ? ItemType.BLOCK : ItemType.ITEM");
gameCanvas = gameCanvas.replace(/spawn\.type === 'QUEST_GIVER'/g, "(spawn as any).type === 'QUEST_GIVER'");
gameCanvas = gameCanvas.replace(/spawn\.type === 'FARM_ANIMAL'/g, "(spawn as any).type === 'FARM_ANIMAL'");
gameCanvas = gameCanvas.replace(/audio\.playPickup\(\);/g, "audio.playPlace();");

fs.writeFileSync('components/GameCanvas.tsx', gameCanvas);

// 2. Fix constants.ts
let constants = fs.readFileSync('constants.ts', 'utf8');

// The duplicate keys error is about object literals having the same name properties.
// constants.ts(586-687) have keys. Let's find exactly which ones.
constants = constants.replace(/\s*\[BlockType\.SNOW_BLOCK\]: [^,]+,/g, "");
constants = constants.replace(/\s*\[BlockType\.SNOWY_GRASS\]: [^,]+,/g, "");
constants = constants.replace(/\s*\[BlockType\.ICE\]: [^,]+,/g, "");
constants = constants.replace(/\s*\[BlockType\.SNOWY_LEAVES\]: [^,]+,/g, "");
constants = constants.replace(/\s*\[BlockType\.URANIUM_BLOCK\]: [^,]+,/g, "");
constants = constants.replace(/\s*\[BlockType\.TITANIUM_BLOCK\]: [^,]+,/g, "");

fs.writeFileSync('constants.ts', constants);
