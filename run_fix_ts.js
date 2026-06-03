import fs from 'fs';

// 1. Fix GameCanvas.tsx
let gameCanvas = fs.readFileSync('components/GameCanvas.tsx', 'utf8');

gameCanvas = gameCanvas.replace(/BlockType\.GOLD_ORE \|\| block === BlockType\.DIAMOND/g, "BlockType.GOLD_ORE || block === BlockType.DIAMOND_ORE");
gameCanvas = gameCanvas.replace(/audio\.playExplosion\(\);/g, "");
gameCanvas = gameCanvas.replace(/addNotification\('Um tubarão te devorou!', 'error'\);/g, "addNotification('Um tubarão te devorou!');");
gameCanvas = gameCanvas.replace(/BlockType\.COAL \|\| ftB === BlockType\.IRON \|\| ftB === BlockType\.GOLD \|\| ftB === BlockType\.DIAMOND \|\| ftB === BlockType\.TITANIUM \|\| ftB === BlockType\.URANIUM/g, "BlockType.COAL_ORE || ftB === BlockType.IRON_ORE || ftB === BlockType.GOLD_ORE || ftB === BlockType.DIAMOND_ORE || ftB === BlockType.TITANIUM_ORE || ftB === BlockType.URANIUM_ORE");
gameCanvas = gameCanvas.replace(/BlockType\.WORKBENCH/g, "BlockType.CRAFTING_TABLE");
gameCanvas = gameCanvas.replace(/BlockType\.SNOW /g, "BlockType.SNOW_BLOCK ");
gameCanvas = gameCanvas.replace(/block === BlockType\.SLAB_WOOD \|\| block === BlockType\.SLAB_STONE \|\| block === BlockType\.SLAB_CONCRETE/g, "block === BlockType.SLAB_WOOD || block === BlockType.SLAB_STONE");
gameCanvas = gameCanvas.replace(/} else if \(block === BlockType\.SLAB_CONCRETE\) {/g, "");

fs.writeFileSync('components/GameCanvas.tsx', gameCanvas);

// 2. Fix constants.ts
let constants = fs.readFileSync('constants.ts', 'utf8');

// Remove duplicate keys
// constants.ts(93,3) - ROOF_WOOD
constants = constants.replace(/\s*\[BlockType\.ROOF_WOOD\]: '#a1887f',/g, "");
constants = constants.replace(/\s*\[BlockType\.ROOF_STONE\]: '#616161',/g, "");
constants = constants.replace(/\s*\[BlockType\.ROOF_WOOD_LEFT\]: '#a1887f',/g, "");
constants = constants.replace(/\s*\[BlockType\.ROOF_STONE_LEFT\]: '#616161',/g, "");
// Other dup keys (maybe around 590-600 translations)
constants = constants.replace(/\s*\[BlockType\.ROOF_WOOD\]: 'Telhado de Madeira',/g, "");
constants = constants.replace(/\s*\[BlockType\.ROOF_STONE\]: 'Telhado de Pedra',/g, "");
constants = constants.replace(/\s*\[BlockType\.ROOF_WOOD_LEFT\]: 'Telhado de Madeira \(Esq\)',/g, "");
constants = constants.replace(/\s*\[BlockType\.ROOF_STONE_LEFT\]: 'Telhado de Pedra \(Esq\)',/g, "");

// Fix crafting recipes categories
constants = constants.replace(/category: 'TOOLS'/g, "category: 'TOOLS' as any");

fs.writeFileSync('constants.ts', constants);

// 3. Fix utils/audio.ts
let audio = fs.readFileSync('utils/audio.ts', 'utf8');
audio = audio.replace(/this\.playSound\(0\.3, 'sine', '24d', 0, 0\.1\);/g, "this.playSound({vol:0.3, type:'sine', freq:'24d', dur:0.1});");
audio = audio.replace(/this\.playSound\(0\.2, 'sine', 'G4', 0, 0\.2\);/g, "this.playSound({vol:0.2, type:'sine', freq:'G4', dur:0.2});");
fs.writeFileSync('utils/audio.ts', audio);

// 4. Fix utils/world.ts
let world = fs.readFileSync('utils/world.ts', 'utf8');
world = world.replace(/OCEAN_LEVEL/g, "SEA_LEVEL");
fs.writeFileSync('utils/world.ts', world);
