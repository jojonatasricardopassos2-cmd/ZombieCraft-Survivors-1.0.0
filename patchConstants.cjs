const fs = require('fs');

let code = fs.readFileSync('constants.ts', 'utf-8');

const importStatement = "import { GUN_STATS, WEAPON_COMPONENTS, AMMO_TYPES, WEAPON_NAMES } from './weaponsData';\n";

if (!code.includes('weaponsData')) {
    // Add import statement at top
    const lines = code.split('\n');
    lines.splice(2, 0, importStatement);
    code = lines.join('\n');
    
    // Add logic at the end of the file to populate the records
    const logic = `
// Inject Weapons Data
WEAPON_COMPONENTS.forEach(comp => {
  ITEM_COLORS[comp.id] = '#888888';
  ITEM_NAMES['EN'][comp.id] = comp.name_en;
  ITEM_NAMES['PT'][comp.id] = comp.name_pt;
  ITEM_NAMES['ES'][comp.id] = comp.name_en; // Fallback
  ITEM_NAMES['JA'][comp.id] = comp.name_en; // Fallback
  ITEM_ICONS[comp.id] = '⚙️';
});

AMMO_TYPES.forEach(ammo => {
  ITEM_COLORS[ammo.id] = ammo.color;
  ITEM_NAMES['EN'][ammo.id] = ammo.name_en;
  ITEM_NAMES['PT'][ammo.id] = ammo.name_pt;
  ITEM_NAMES['ES'][ammo.id] = ammo.name_en; // Fallback
  ITEM_NAMES['JA'][ammo.id] = ammo.name_en; // Fallback
  ITEM_ICONS[ammo.id] = '🍬'; // Bullet emoji doesn't exist, using something small, or box
});

Object.keys(GUN_STATS).forEach(gunId => {
  ITEM_COLORS[gunId] = '#404040';
  ITEM_NAMES['EN'][gunId] = WEAPON_NAMES[gunId].en;
  ITEM_NAMES['PT'][gunId] = WEAPON_NAMES[gunId].pt;
  ITEM_NAMES['ES'][gunId] = WEAPON_NAMES[gunId].en;
  ITEM_NAMES['JA'][gunId] = WEAPON_NAMES[gunId].en;
  ITEM_ICONS[gunId] = '🔫';
  DAMAGE_VALUES[gunId] = GUN_STATS[gunId].damage;
});

// We need recipes
// For components:
const componentsRecipes: CraftingRecipe[] = [
  { result: { id: 'metal_structure', count: 1, type: ItemType.MATERIAL }, ingredients: [{ id: 'iron_ingot', count: 5 }], station: BlockType.WEAPON_BENCH, category: 'COMPONENTS' },
  { result: { id: 'reinforced_structure', count: 1, type: ItemType.MATERIAL }, ingredients: [{ id: 'metal_structure', count: 1 }, { id: 'copper_ingot', count: 3 }], station: BlockType.WEAPON_BENCH, category: 'COMPONENTS' },
  { result: { id: 'grip', count: 1, type: ItemType.MATERIAL }, ingredients: [{ id: 'iron_ingot', count: 2 }, { id: 'wood', count: 1 }], station: BlockType.WEAPON_BENCH, category: 'COMPONENTS' },
  { result: { id: 'mechanical_mechanism', count: 1, type: ItemType.MATERIAL }, ingredients: [{ id: 'iron_ingot', count: 3 }, { id: 'copper_ingot', count: 1 }], station: BlockType.WEAPON_BENCH, category: 'COMPONENTS' },
  { result: { id: 'ammo_chamber', count: 1, type: ItemType.MATERIAL }, ingredients: [{ id: 'iron_ingot', count: 4 }], station: BlockType.WEAPON_BENCH, category: 'COMPONENTS' },
  { result: { id: 'simple_sight', count: 1, type: ItemType.MATERIAL }, ingredients: [{ id: 'iron_ingot', count: 1 }, { id: 'glass', count: 1 }], station: BlockType.WEAPON_BENCH, category: 'COMPONENTS' },
  { result: { id: 'advanced_sight', count: 1, type: ItemType.MATERIAL }, ingredients: [{ id: 'iron_ingot', count: 2 }, { id: 'glass', count: 2 }, { id: 'blue_crystal', count: 1 }], station: BlockType.WEAPON_BENCH, category: 'COMPONENTS' },
  { result: { id: 'energy_core', count: 1, type: ItemType.MATERIAL }, ingredients: [{ id: 'gold_ingot', count: 3 }, { id: 'blue_crystal', count: 1 }, { id: 'red_crystal', count: 1 }], station: BlockType.WEAPON_BENCH, category: 'COMPONENTS' },
  { result: { id: 'reinforced_tube', count: 1, type: ItemType.MATERIAL }, ingredients: [{ id: 'iron_ingot', count: 4 }, { id: 'titanium_ingot', count: 2 }], station: BlockType.WEAPON_BENCH, category: 'COMPONENTS' },
  
  // Custom materials that needed to be added
  { result: { id: 'refined_iron', count: 1, type: ItemType.MATERIAL }, ingredients: [{ id: 'iron_ingot', count: 2 }, { id: 'coal', count: 1 }], station: BlockType.FURNACE, category: 'MATERIALS' },
  { result: { id: 'refined_wood', count: 1, type: ItemType.MATERIAL }, ingredients: [{ id: 'planks', count: 4 }], station: BlockType.CRAFTING_TABLE, category: 'MATERIALS' },
  { result: { id: 'energetic_coal', count: 1, type: ItemType.MATERIAL }, ingredients: [{ id: 'coal', count: 2 }, { id: 'blue_crystal', count: 1 }], station: BlockType.SCIENCE_BENCH, category: 'MATERIALS' },
  { result: { id: 'blue_crystal', count: 1, type: ItemType.MATERIAL }, ingredients: [{ id: 'diamond', count: 1 }], station: BlockType.SCIENCE_BENCH, category: 'MATERIALS' },
  { result: { id: 'red_crystal', count: 1, type: ItemType.MATERIAL }, ingredients: [{ id: 'diamond', count: 1 }, { id: 'copper_ingot', count: 2 }], station: BlockType.SCIENCE_BENCH, category: 'MATERIALS' },
  { result: { id: 'packed_ice', count: 1, type: ItemType.MATERIAL }, ingredients: [{ id: BlockType.ICE, count: 4 }], station: BlockType.CRAFTING_TABLE, category: 'MATERIALS' }
];

RECIPES.push(...componentsRecipes);

// Add Ammo Recipes
RECIPES.push(
  { result: { id: 'common_ammo', count: 30, type: ItemType.AMMO }, ingredients: [{ id: 'iron_ingot', count: 1 }, { id: 'coal', count: 1 }], station: BlockType.AMMO_BENCH, category: 'AMMO' },
  { result: { id: 'heavy_ammo', count: 20, type: ItemType.AMMO }, ingredients: [{ id: 'iron_ingot', count: 2 }, { id: 'copper_ingot', count: 1 }], station: BlockType.AMMO_BENCH, category: 'AMMO' },
  { result: { id: 'piercing_ammo', count: 15, type: ItemType.AMMO }, ingredients: [{ id: 'refined_iron', count: 1 }, { id: 'blue_crystal', count: 1 }], station: BlockType.AMMO_BENCH, category: 'AMMO' },
  { result: { id: 'energy_ammo', count: 30, type: ItemType.AMMO }, ingredients: [{ id: 'blue_crystal', count: 1 }, { id: 'gold_ingot', count: 1 }], station: BlockType.AMMO_BENCH, category: 'AMMO' },
  { result: { id: 'incendiary_ammo', count: 20, type: ItemType.AMMO }, ingredients: [{ id: 'red_crystal', count: 1 }, { id: 'energetic_coal', count: 1 }], station: BlockType.AMMO_BENCH, category: 'AMMO' },
  { result: { id: 'freezing_ammo', count: 20, type: ItemType.AMMO }, ingredients: [{ id: 'blue_crystal', count: 1 }, { id: 'packed_ice', count: 1 }], station: BlockType.AMMO_BENCH, category: 'AMMO' }
);

// Add Benches Recipes
RECIPES.push(
  { result: { id: BlockType.WEAPON_BENCH, count: 1, type: ItemType.BLOCK }, ingredients: [{ id: 'iron_ingot', count: 10 }, { id: 'planks', count: 10 }], station: BlockType.CRAFTING_TABLE, category: 'DECOR' },
  { result: { id: BlockType.AMMO_BENCH, count: 1, type: ItemType.BLOCK }, ingredients: [{ id: 'copper_ingot', count: 8 }, { id: 'iron_ingot', count: 5 }], station: BlockType.CRAFTING_TABLE, category: 'DECOR' }
);
BLOCK_COLORS[BlockType.WEAPON_BENCH] = '#444444';
BLOCK_COLORS[BlockType.AMMO_BENCH] = '#555544';
ITEM_NAMES['EN'][BlockType.WEAPON_BENCH] = 'Weapon Workbench';
ITEM_NAMES['PT'][BlockType.WEAPON_BENCH] = 'Bancada de Armas';
ITEM_NAMES['ES'][BlockType.WEAPON_BENCH] = 'Banco de Armas';
ITEM_NAMES['JA'][BlockType.WEAPON_BENCH] = 'Weapon Workbench';
ITEM_NAMES['EN'][BlockType.AMMO_BENCH] = 'Ammo Workbench';
ITEM_NAMES['PT'][BlockType.AMMO_BENCH] = 'Bancada de Munição';
ITEM_NAMES['ES'][BlockType.AMMO_BENCH] = 'Banco de Munición';
ITEM_NAMES['JA'][BlockType.AMMO_BENCH] = 'Ammo Workbench';

// Weapon Recipes
const weaponRecipes: CraftingRecipe[] = [
    { result: { id: 'glock_19', count: 1, type: ItemType.WEAPON }, ingredients: [{ id: 'metal_structure', count: 1 }, { id: 'grip', count: 1 }, { id: 'ammo_chamber', count: 1 }, { id: 'simple_sight', count: 1 }], station: BlockType.WEAPON_BENCH, category: 'SMALL_ARMS' },
    { result: { id: 'ak_47', count: 1, type: ItemType.WEAPON }, ingredients: [{ id: 'reinforced_structure', count: 1 }, { id: 'reinforced_tube', count: 1 }, { id: 'ammo_chamber', count: 2 }, { id: 'simple_sight', count: 1 }], station: BlockType.WEAPON_BENCH, category: 'LARGE_ARMS' },
    { result: { id: 'desert_eagle', count: 1, type: ItemType.WEAPON }, ingredients: [{ id: 'reinforced_structure', count: 1 }, { id: 'grip', count: 1 }, { id: 'ammo_chamber', count: 2 }], station: BlockType.WEAPON_BENCH, category: 'SMALL_ARMS' },
    { result: { id: 'beretta_m9', count: 1, type: ItemType.WEAPON }, ingredients: [{ id: 'metal_structure', count: 1 }, { id: 'grip', count: 1 }, { id: 'ammo_chamber', count: 1 }], station: BlockType.WEAPON_BENCH, category: 'SMALL_ARMS' },
    { result: { id: 'usp', count: 1, type: ItemType.WEAPON }, ingredients: [{ id: 'metal_structure', count: 1 }, { id: 'grip', count: 1 }, { id: 'ammo_chamber', count: 1 }], station: BlockType.WEAPON_BENCH, category: 'SMALL_ARMS' },
    { result: { id: 'five_seven', count: 1, type: ItemType.WEAPON }, ingredients: [{ id: 'metal_structure', count: 1 }, { id: 'grip', count: 1 }, { id: 'ammo_chamber', count: 1 }, { id: 'advanced_sight', count: 1 }], station: BlockType.WEAPON_BENCH, category: 'SMALL_ARMS' },
    { result: { id: 'p250', count: 1, type: ItemType.WEAPON }, ingredients: [{ id: 'metal_structure', count: 1 }, { id: 'grip', count: 1 }, { id: 'ammo_chamber', count: 1 }], station: BlockType.WEAPON_BENCH, category: 'SMALL_ARMS' },
    { result: { id: 'cz75', count: 1, type: ItemType.WEAPON }, ingredients: [{ id: 'metal_structure', count: 1 }, { id: 'grip', count: 1 }, { id: 'mecanical_mechanism', count: 1 }, { id: 'ammo_chamber', count: 1 }], station: BlockType.WEAPON_BENCH, category: 'SMALL_ARMS' },
    { result: { id: 'm1911', count: 1, type: ItemType.WEAPON }, ingredients: [{ id: 'reinforced_structure', count: 1 }, { id: 'grip', count: 1 }, { id: 'ammo_chamber', count: 1 }], station: BlockType.WEAPON_BENCH, category: 'SMALL_ARMS' },
    { result: { id: 'revolver_357', count: 1, type: ItemType.WEAPON }, ingredients: [{ id: 'reinforced_structure', count: 1 }, { id: 'grip', count: 1 }, { id: 'ammo_chamber', count: 2 }], station: BlockType.WEAPON_BENCH, category: 'SMALL_ARMS' },
    { result: { id: 'tec_9', count: 1, type: ItemType.WEAPON }, ingredients: [{ id: 'metal_structure', count: 1 }, { id: 'grip', count: 1 }, { id: 'mecanical_mechanism', count: 1 }, { id: 'ammo_chamber', count: 2 }], station: BlockType.WEAPON_BENCH, category: 'SMALL_ARMS' },
    
    { result: { id: 'm4a1', count: 1, type: ItemType.WEAPON }, ingredients: [{ id: 'reinforced_structure', count: 1 }, { id: 'reinforced_tube', count: 1 }, { id: 'ammo_chamber', count: 2 }, { id: 'advanced_sight', count: 1 }], station: BlockType.WEAPON_BENCH, category: 'LARGE_ARMS' },
    { result: { id: 'scar_h', count: 1, type: ItemType.WEAPON }, ingredients: [{ id: 'reinforced_structure', count: 2 }, { id: 'reinforced_tube', count: 1 }, { id: 'ammo_chamber', count: 2 }, { id: 'advanced_sight', count: 1 }], station: BlockType.WEAPON_BENCH, category: 'LARGE_ARMS' },
    { result: { id: 'famas', count: 1, type: ItemType.WEAPON }, ingredients: [{ id: 'reinforced_structure', count: 1 }, { id: 'reinforced_tube', count: 1 }, { id: 'ammo_chamber', count: 1 }, { id: 'advanced_sight', count: 1 }], station: BlockType.WEAPON_BENCH, category: 'LARGE_ARMS' },
    { result: { id: 'g36', count: 1, type: ItemType.WEAPON }, ingredients: [{ id: 'reinforced_structure', count: 1 }, { id: 'reinforced_tube', count: 1 }, { id: 'mecanical_mechanism', count: 1 }, { id: 'advanced_sight', count: 1 }], station: BlockType.WEAPON_BENCH, category: 'LARGE_ARMS' },
    { result: { id: 'aug', count: 1, type: ItemType.WEAPON }, ingredients: [{ id: 'reinforced_structure', count: 1 }, { id: 'reinforced_tube', count: 1 }, { id: 'ammo_chamber', count: 1 }, { id: 'advanced_sight', count: 1 }], station: BlockType.WEAPON_BENCH, category: 'LARGE_ARMS' },
    { result: { id: 'awp', count: 1, type: ItemType.WEAPON }, ingredients: [{ id: 'reinforced_structure', count: 2 }, { id: 'reinforced_tube', count: 2 }, { id: 'ammo_chamber', count: 2 }, { id: 'advanced_sight', count: 2 }], station: BlockType.WEAPON_BENCH, category: 'LARGE_ARMS' },
    { result: { id: 'barrett_m82', count: 1, type: ItemType.WEAPON }, ingredients: [{ id: 'reinforced_structure', count: 3 }, { id: 'reinforced_tube', count: 2 }, { id: 'ammo_chamber', count: 3 }, { id: 'advanced_sight', count: 2 }], station: BlockType.WEAPON_BENCH, category: 'LARGE_ARMS' },
    { result: { id: 'mp5', count: 1, type: ItemType.WEAPON }, ingredients: [{ id: 'metal_structure', count: 1 }, { id: 'reinforced_tube', count: 1 }, { id: 'mecanical_mechanism', count: 1 } ], station: BlockType.WEAPON_BENCH, category: 'LARGE_ARMS' },
    { result: { id: 'p90', count: 1, type: ItemType.WEAPON }, ingredients: [{ id: 'reinforced_structure', count: 1 }, { id: 'reinforced_tube', count: 1 }, { id: 'ammo_chamber', count: 2 }, { id: 'advanced_sight', count: 1 }], station: BlockType.WEAPON_BENCH, category: 'LARGE_ARMS' }
];

RECIPES.push(...weaponRecipes);

`;
    code += logic;
    fs.writeFileSync('constants.ts', code);
}
