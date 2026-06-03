import fs from 'fs';

// 1. Fix GameCanvas.tsx
let gameCanvas = fs.readFileSync('components/GameCanvas.tsx', 'utf8');

gameCanvas = gameCanvas.replace(/spawnMob\(zombieTypes\[Math\.floor\(Math\.random\(\) \* zombieTypes\.length\)\]\)/g, "spawnMob(zombieTypes[Math.floor(Math.random() * zombieTypes.length)] as any)");
gameCanvas = gameCanvas.replace(/typeof quest\.rewardItem === 'number' \? ItemType\.BLOCK : ItemType\.ITEM/g, "typeof quest.rewardItem === 'number' ? ItemType.BLOCK : ItemType.MATERIAL");

fs.writeFileSync('components/GameCanvas.tsx', gameCanvas);

// 2. Fix constants.ts
let constants = fs.readFileSync('constants.ts', 'utf8');

// Remove duplicate keys (lines 560-680 range)
// I will just use a node script to remove property duplicates inside ITEM_NAMES objects.
// Since it's easier, I'll just write a quick replacer for the specific lines that failed.
constants = constants.replace(/\s*\[BlockType\.CACTUS\]: [^,]+,/g, "");
constants = constants.replace(/\s*\[BlockType\.DRY_LEAVES\]: [^,]+,/g, "");
constants = constants.replace(/\s*\[BlockType\.GLASS_GREEN\]: [^,]+,/g, "");
constants = constants.replace(/\s*\[BlockType\.GLASS_BLUE\]: [^,]+,/g, "");
constants = constants.replace(/\s*\[BlockType\.SPIKE\]: [^,]+,/g, "");
constants = constants.replace(/\s*\[BlockType\.MOSS\]: [^,]+,/g, "");
constants = constants.replace(/\s*\[BlockType\.VINES\]: [^,]+,/g, "");
constants = constants.replace(/\s*\[BlockType\.COBWEB\]: [^,]+,/g, "");
constants = constants.replace(/\s*\[BlockType\.MEDICAL_BENCH\]: [^,]+,/g, "");
constants = constants.replace(/\s*\[BlockType\.SCIENCE_BENCH\]: [^,]+,/g, "");
constants = constants.replace(/\s*\[BlockType\.CABLE\]: [^,]+,/g, "");
constants = constants.replace(/\s*\[BlockType\.BUTTON\]: [^,]+,/g, "");
constants = constants.replace(/\s*\[BlockType\.LEVER\]: [^,]+,/g, "");
constants = constants.replace(/\s*\[BlockType\.LAMP\]: [^,]+,/g, "");
constants = constants.replace(/\s*\[BlockType\.CABLE_ON\]: [^,]+,/g, "");
constants = constants.replace(/\s*\[BlockType\.BUTTON_ON\]: [^,]+,/g, "");
constants = constants.replace(/\s*\[BlockType\.LEVER_ON\]: [^,]+,/g, "");
constants = constants.replace(/\s*\[BlockType\.LAMP_ON\]: [^,]+,/g, "");

fs.writeFileSync('constants.ts', constants);
