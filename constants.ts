
import { BlockType, ItemType, CraftingRecipe, PlayerStats, ItemStack } from './types.ts';
import { GUN_STATS, WEAPON_COMPONENTS, AMMO_TYPES, WEAPON_NAMES } from './weaponsData';


export const BLOCK_SIZE = 32;
export const WORLD_WIDTH = 5000;
export const WORLD_HEIGHT = 614; // Bedrock at Y = -250
export const SEA_LEVEL = 64; // User facing sea level
export const INTERNAL_SURFACE_Y = 300; // Internal Y coordinate for surface
export const DEEP_SLATE_LEVEL = 364; // Internal Y where Deep Slate begins (User Y=0)
export const CHUNK_SIZE = 16;
export const ORE_CHUNK_SIZE = 5; 
export const GRAVITY = 0.5;
export const TERMINAL_VELOCITY = 15;
export const PLAYER_SPEED = 4;
export const PLAYER_RUN_SPEED = 7;
export const JUMP_FORCE = 9;
export const REACH_DISTANCE = 5 * BLOCK_SIZE;

// Day/Night Cycle
export const FULL_DAY_TICKS = 36000;
export const TICKS_PER_HOUR = 1500; // 36000 / 24 hours
// New Time System: 0 = 6 AM. 
export const DAWN_START = 0; // 6 AM
export const DUSK_START = 12 * 1500; // 6 PM (18:00) -> 12 hours after 6am
export const NIGHT_START = 13 * 1500; // 7 PM (19:00)

export const MAX_LIGHT = 15;
export const MIN_LIGHT = 1; 

// RPG Constants
export const XP_PER_MOB = 10;
export const MAX_STAMINA = 100;
export const BASE_STAMINA_DRAIN = 0.5; 
export const BASE_STAMINA_REGEN = 0.3; 
export const HUNGER_DECAY_TICK = 3600; 
export const SPRINT_HUNGER_DRAIN = 0.05; 

export const DEFAULT_STATS: PlayerStats = {
    strength: 0,
    reach: 0,
    vitality: 0,
    metabolism: 0,
    endurance: 0,
    agility: 0
};

export const BLOCK_COLORS: Record<number, string> = {
  [BlockType.AIR]: 'transparent',
  [BlockType.DIRT]: '#654321',
  [BlockType.GRASS]: '#41980a',
  [BlockType.DARK_GRASS]: '#2d6a06',
  [BlockType.STONE]: '#888c8d',
  [BlockType.DEEP_STONE]: '#3b434a', 
  [BlockType.WOOD]: '#5c4033',
  [BlockType.DARK_WOOD]: '#3b2f2f', 
  [BlockType.APPLE_LEAVES]: '#3a5f0b',
  [BlockType.LEAVES]: '#3a5f0b',
  [BlockType.DARK_LEAVES]: '#223c07', 
  [BlockType.PLANKS]: '#c19a6b',
  [BlockType.DARK_PLANKS]: '#8b5a2b',
  [BlockType.GOLDEN_PLANKS]: '#ffca28',
  [BlockType.LAVA]: '#ff5722',
  [BlockType.CABINET]: '#4e342e',
  [BlockType.TABLE]: '#6d4c41',
  [BlockType.CAMPFIRE]: '#3e2723',
  [BlockType.ROOF_WOOD]: '#8d6e63',
  [BlockType.ROOF_WOOD_LEFT]: '#8d6e63',
  [BlockType.COAL_ORE]: '#212121',
  [BlockType.IRON_ORE]: '#d7ccc8',
  [BlockType.GOLD_ORE]: '#FFD700',
  [BlockType.DIAMOND_ORE]: '#80deea',
  [BlockType.TITANIUM_ORE]: '#0d47a1', 
  [BlockType.URANIUM_ORE]: '#76ff03', // Light Green
  [BlockType.COPPER_ORE]: '#e67e22',
  [BlockType.BEDROCK]: '#000000',
  [BlockType.SAND]: '#e8c99b', 
  [BlockType.GLASS]: 'rgba(200, 240, 255, 0.3)', 
  [BlockType.CRAFTING_TABLE]: '#6d4c41',
  [BlockType.FURNACE]: '#424242',
  [BlockType.TORCH]: '#ffeb3b',
  [BlockType.CHEST]: '#795548', 
  [BlockType.CHEST_MEDIUM]: '#5d4037', 
  [BlockType.CHEST_LARGE]: '#3e2723', 
  [BlockType.STONE_CHEST]: '#616161', // Dark Grey for Stone Chest
  [BlockType.BUSH]: '#558b2f',
  [BlockType.BERRY_BUSH]: '#2e7d32',
  [BlockType.SEED_BUSH]: '#558b2f',
  [BlockType.WOOL]: '#eeeeee',
  [BlockType.BED]: '#d32f2f', 
  [BlockType.BED_MEDIUM]: '#1976d2', 
  [BlockType.BED_ADVANCED]: '#7b1fa2', 
  [BlockType.WATER]: 'rgba(50, 50, 200, 0.5)',
  [BlockType.WALL_WOOD]: '#5d4037',
  [BlockType.DOOR_BOTTOM_CLOSED]: '#8d6e63',
  [BlockType.DOOR_TOP_CLOSED]: '#8d6e63',
  [BlockType.DOOR_BOTTOM_OPEN]: '#8d6e63',
  [BlockType.DOOR_TOP_OPEN]: '#8d6e63',
  [BlockType.FARMLAND]: '#3e2723',
  [BlockType.CROP_WHEAT]: '#cddc39',
  [BlockType.CROP_CARROT]: '#ff9800',
  [BlockType.CROP_POTATO]: '#ffe0b2',
  [BlockType.FLOWER_RED]: '#e53935',
  [BlockType.FLOWER_GREEN]: '#43a047',
  [BlockType.FLOWER_BLUE]: '#1e88e5', // Light Green // Dark Blue
  [BlockType.IRON_BLOCK]: '#cfd8dc',
  [BlockType.GOLD_BLOCK]: '#fbc02d',
  [BlockType.COPPER_BLOCK]: '#e65100',
  [BlockType.DIAMOND_BLOCK]: '#00bcd4',
  [BlockType.ARMOR_BENCH]: '#37474f', // Blue Grey
  [BlockType.LADDER]: '#8d6e63',
  [BlockType.CACTUS]: '#4caf50',
  [BlockType.DRY_LEAVES]: '#d7ccc8',
  [BlockType.GLASS_GREEN]: 'rgba(76, 175, 80, 0.3)',
  [BlockType.GLASS_BLUE]: 'rgba(33, 150, 243, 0.3)',
  [BlockType.SNOWY_GRASS]: '#ffffff',
  [BlockType.SNOW_BLOCK]: '#f8f9fa',
  [BlockType.ICE]: 'rgba(128, 216, 255, 0.5)',
  [BlockType.SNOWY_LEAVES]: '#e0f7fa',
  [BlockType.SPIKE]: '#757575',
  [BlockType.MOSS]: '#33691e',
  [BlockType.VINES]: '#1b5e20',
  [BlockType.COBWEB]: 'rgba(238, 238, 238, 0.6)',
  [BlockType.MEDICAL_BENCH]: '#f1f8e9',
  [BlockType.SCIENCE_BENCH]: '#e8eaf6',
  [BlockType.CABLE]: '#3e2723',
  [BlockType.BUTTON]: '#5d4037',
  [BlockType.LEVER]: '#5d4037',
  [BlockType.LAMP]: '#ffe082',
  [BlockType.CABLE_ON]: '#b71c1c',
  [BlockType.BUTTON_ON]: '#5d4037',
  [BlockType.LEVER_ON]: '#5d4037',
  [BlockType.LAMP_ON]: '#fff9c4',
  [BlockType.URANIUM_BLOCK]: '#b2ff59',
  [BlockType.TITANIUM_BLOCK]: '#1976d2',
  [BlockType.SLAB_WOOD]: '#8d6e63',
  
  [BlockType.SLAB_STONE]: '#888c8d',
  [BlockType.PINE_WOOD]: '#442d25',
  [BlockType.PINE_LEAVES]: '#1c4a2a',
  [BlockType.GOLDEN_WOOD]: '#FFD54F',
  [BlockType.FROZEN_WOOD]: '#81D4FA',
  [BlockType.GOLDEN_FLOWER]: '#FFF59D',
  [BlockType.GOLDEN_BUSH]: '#FBC02D',
  [BlockType.GOLDEN_LEAVES]: '#FFF176',
  [BlockType.GOLDEN_GRASS]: '#FFF59D',
  [BlockType.FENCE]: '#8d6e63',
  [BlockType.CONCRETE]: '#cfd8dc', [BlockType.WET_SAND]: '#bcaaa4', [BlockType.CONCRETE_PURPLE]: '#8e24aa', [BlockType.CONCRETE_RED]: '#e53935',
  [BlockType.CONCRETE_BLUE]: '#1e88e5',
  [BlockType.CONCRETE_GREEN]: '#43a047',
  [BlockType.CONCRETE_YELLOW]: '#fdd835',
  [BlockType.FLOWER_YELLOW]: '#ffee58',
  [BlockType.FLOWER_PURPLE]: '#ab47bc',
  [BlockType.GLASS_RED]: 'rgba(255, 50, 50, 0.3)',
  [BlockType.GLASS_YELLOW]: 'rgba(255, 255, 50, 0.3)',
  [BlockType.TALL_GRASS]: 'transparent', // Will be custom drawn
  [BlockType.FALLEN_LOG]: '#5c4033', // Bark color
  [BlockType.DOOR_IRON_BOTTOM_CLOSED]: '#b0bec5',
  [BlockType.DOOR_IRON_TOP_CLOSED]: '#b0bec5',
  [BlockType.DOOR_IRON_BOTTOM_OPEN]: '#b0bec5',
  [BlockType.DOOR_IRON_TOP_OPEN]: '#b0bec5',
  [BlockType.DOOR_STONE_BOTTOM_CLOSED]: '#757575',
  [BlockType.DOOR_STONE_TOP_CLOSED]: '#757575',
  [BlockType.DOOR_STONE_BOTTOM_OPEN]: '#757575',
  [BlockType.DOOR_STONE_TOP_OPEN]: '#757575',
  [BlockType.WALLPAPER]: '#f2dc80',
  [BlockType.BR_KEY_BLOCK]: '#ffca28',
  [BlockType.GENERATOR_OFF]: '#444444',
  [BlockType.GENERATOR_ON]: '#44ff44',
  [BlockType.WHITE_DOOR_CLOSED]: '#ffffff',
  [BlockType.WHITE_DOOR_OPEN]: '#eeeeee',
  [BlockType.POOL_TILE]: '#8fc7c5',
  [BlockType.POOL_WATER]: '#298e89',
  [BlockType.CUSHION]: '#5f6916'
};

export const HIDDEN_CREATIVE_BLOCKS = [ BlockType.WALLPAPER, BlockType.BR_KEY_BLOCK, BlockType.CUSHION, BlockType.MOSS, BlockType.GENERATOR_ON, BlockType.GENERATOR_OFF, BlockType.WHITE_DOOR_CLOSED, BlockType.WHITE_DOOR_OPEN,
    BlockType.AIR,
    BlockType.DOOR_TOP_CLOSED,
    BlockType.DOOR_BOTTOM_OPEN,
    BlockType.DOOR_TOP_OPEN,
    BlockType.DOOR_IRON_TOP_CLOSED,
    BlockType.DOOR_IRON_BOTTOM_OPEN,
    BlockType.DOOR_IRON_TOP_OPEN,
    BlockType.DOOR_STONE_TOP_CLOSED,
    BlockType.DOOR_STONE_BOTTOM_OPEN,
    BlockType.DOOR_STONE_TOP_OPEN,
    BlockType.CROP_WHEAT,
    BlockType.CROP_CARROT,
    BlockType.CROP_POTATO,
    BlockType.CABLE_ON,
    BlockType.LAMP_ON,
    BlockType.BUTTON_ON,
    BlockType.LEVER_ON
];

// Hardness values
export const BLOCK_HARDNESS: Record<number, number> = {
    [BlockType.APPLE_LEAVES]: 20, [BlockType.LEAVES]: 20, [BlockType.DARK_LEAVES]: 25, [BlockType.BUSH]: 10, [BlockType.BERRY_BUSH]: 10, [BlockType.SEED_BUSH]: 10,
    [BlockType.FLOWER_RED]: 5, [BlockType.FLOWER_GREEN]: 5, [BlockType.FLOWER_BLUE]: 5, [BlockType.DIRT]: 50, [BlockType.GRASS]: 50,
    [BlockType.DARK_GRASS]: 60, [BlockType.FARMLAND]: 50, [BlockType.SAND]: 40, [BlockType.WOOL]: 30, [BlockType.GLASS]: 20,
    [BlockType.PLANKS]: 150, [BlockType.DOOR_BOTTOM_CLOSED]: 150, [BlockType.DOOR_TOP_CLOSED]: 150, [BlockType.DOOR_BOTTOM_OPEN]: 150,
    [BlockType.DOOR_TOP_OPEN]: 150, [BlockType.CRAFTING_TABLE]: 150, [BlockType.CHEST]: 150, [BlockType.CHEST_MEDIUM]: 200,
    [BlockType.CHEST_LARGE]: 250, [BlockType.STONE_CHEST]: 300, [BlockType.WOOD]: 200, [BlockType.DARK_WOOD]: 250, [BlockType.STONE]: 300,
    [BlockType.DEEP_STONE]: 600, [BlockType.COAL_ORE]: 300, [BlockType.COPPER_ORE]: 300, [BlockType.IRON_ORE]: 400, [BlockType.GOLD_ORE]: 400,
    [BlockType.DIAMOND_ORE]: 500, [BlockType.TITANIUM_ORE]: 800, [BlockType.URANIUM_ORE]: 1200, [BlockType.FURNACE]: 300, [BlockType.TORCH]: 5,
    [BlockType.BED]: 100, [BlockType.BED_MEDIUM]: 150, [BlockType.BED_ADVANCED]: 200, [BlockType.ROOF_WOOD]: 150, [BlockType.ROOF_STONE]: 300,
    [BlockType.ROOF_WOOD_LEFT]: 150, [BlockType.ROOF_STONE_LEFT]: 300, [BlockType.WALL_WOOD]: 100, [BlockType.ARMOR_BENCH]: 350,
    [BlockType.BEDROCK]: 99999999, [BlockType.WATER]: 99999999, [BlockType.CROP_WHEAT]: 1, [BlockType.CROP_CARROT]: 1, [BlockType.CROP_POTATO]: 1, [BlockType.LADDER]: 10,
    [BlockType.CUSHION]: 20,
    [BlockType.BR_KEY_BLOCK]: 50
};

export const MAX_DURABILITY: Record<string, number> = {
    'wood': 100, 'copper': 150, 'stone': 250, 'iron': 350, 'gold': 500, 'diamond': 1000, 'titanium': 2000, 'uranium': 4000,
    'hazmat': 150, 'reinforced_iron': 600
};

// Protection
export const ARMOR_PROTECTION: Record<string, number> = {
    'hazmat_helmet': 0.05, 'hazmat_chestplate': 0.15, 'hazmat_leggings': 0.10, 'hazmat_boots': 0.05,
    'copper_helmet': 0.03, 'copper_chestplate': 0.08, 'copper_leggings': 0.07, 'copper_boots': 0.03,
    'iron_helmet': 0.05, 'iron_chestplate': 0.10, 'iron_leggings': 0.10, 'iron_boots': 0.05,
    'reinforced_iron_helmet': 0.08, 'reinforced_iron_chestplate': 0.18, 'reinforced_iron_leggings': 0.14, 'reinforced_iron_boots': 0.08,
    'gold_helmet': 0.10, 'gold_chestplate': 0.15, 'gold_leggings': 0.15, 'gold_boots': 0.05,
    'diamond_helmet': 0.10, 'diamond_chestplate': 0.20, 'diamond_leggings': 0.16, 'diamond_boots': 0.10,
    'titanium_helmet': 0.15, 'titanium_chestplate': 0.30, 'titanium_leggings': 0.25, 'titanium_boots': 0.15,
    'uranium_helmet': 0.20, 'uranium_chestplate': 0.35, 'uranium_leggings': 0.30, 'uranium_boots': 0.20,
};

// --- DYNAMIC RECIPE GENERATION FOR WEAPONS ---
const MATERIALS = [
    { id: 'wood', tier: BlockType.PLANKS, name_en: 'Wood', name_pt: 'Madeira' },
    { id: 'stone', tier: BlockType.STONE, name_en: 'Stone', name_pt: 'Pedra' },
    { id: 'copper', tier: 'copper_ingot', name_en: 'Copper', name_pt: 'Cobre' },
    { id: 'iron', tier: 'iron_ingot', name_en: 'Iron', name_pt: 'Ferro' },
    { id: 'gold', tier: 'gold_ingot', name_en: 'Gold', name_pt: 'Ouro' },
    { id: 'diamond', tier: 'diamond', name_en: 'Diamond', name_pt: 'Diamante' },
    { id: 'titanium', tier: 'titanium_ingot', name_en: 'Titanium', name_pt: 'Titânio' },
    { id: 'uranium', tier: 'uranium', name_en: 'Uranium', name_pt: 'Urânio' }
];

// --- DYNAMIC DAMAGE & COLORS ---
const BASE_DAMAGE = {
    'wood': 3, 'stone': 4, 'copper': 4.5, 'iron': 5, 'gold': 4, 'diamond': 7, 'titanium': 8, 'uranium': 10
};
export const ITEM_COLORS: Record<string, string> = {
    'rope': '#8d6e63',
    'fiber': '#dcedc8',
    'arrow': '#cfd8dc',
    'bow': '#8d6e63',
    'crossbow': '#3e2723',
    'uranium_totem': '#76ff03',
    'tray': '#cfd8dc',
    'medkit': '#e53935',
    'antidote': '#00e676',
    'bandage': '#eeeeee',
    'syringe': '#4fc3f7',
    'golden_wood': '#ffd54f',
    'rare_flower': '#e1bee7'
};
export const DAMAGE_VALUES: Record<string, number> = { 'hand': 1, 'bow': 3, 'crossbow': 5 };

MATERIALS.forEach(mat => {
    const base = BASE_DAMAGE[mat.id as keyof typeof BASE_DAMAGE];
    const col = mat.id === 'uranium' ? '#76ff03' : 
                mat.id === 'titanium' ? '#0d47a1' : 
                mat.id === 'diamond' ? '#00bcd4' : 
                mat.id === 'gold' ? '#fbc02d' : 
                mat.id === 'iron' ? '#cfd8dc' : 
                mat.id === 'copper' ? '#e65100' : 
                mat.id === 'wood' ? '#5d4037' : 
                mat.id === 'stone' ? '#9e9e9e' : 
                '#bdbdbd';
    
    // Tools
    ITEM_COLORS[`${mat.id}_pickaxe`] = col; DAMAGE_VALUES[`${mat.id}_pickaxe`] = base * 0.5;
    ITEM_COLORS[`${mat.id}_axe`] = col; DAMAGE_VALUES[`${mat.id}_axe`] = base * 0.8;
    ITEM_COLORS[`${mat.id}_shovel`] = col;
    ITEM_COLORS[`${mat.id}_shield`] = col;

    // Standard Weapons
    ITEM_COLORS[`${mat.id}_sword`] = col; DAMAGE_VALUES[`${mat.id}_sword`] = base;
    ITEM_COLORS[`${mat.id}_katana`] = col; DAMAGE_VALUES[`${mat.id}_katana`] = base * 1.5; // High dmg
    ITEM_COLORS[`${mat.id}_spear`] = col; DAMAGE_VALUES[`${mat.id}_spear`] = base * 0.9;
    ITEM_COLORS[`${mat.id}_knife`] = col; DAMAGE_VALUES[`${mat.id}_knife`] = base * 0.4; // Low dmg but instant
    ITEM_COLORS[`${mat.id}_hoe`] = col;
    ITEM_COLORS[`${mat.id}_hammer`] = col; DAMAGE_VALUES[`${mat.id}_hammer`] = base * 0.6;
});

export const RECIPES: CraftingRecipe[] = [
  { result: { id: 'bone', count: 1, type: ItemType.MATERIAL }, ingredients: [{ id: 'raw_beef', count: 1 }], station: 'NONE', category: 'BASIC' },
  // --- COMPONENTS ---
  { result: { id: 'rope', count: 1, type: ItemType.MATERIAL }, ingredients: [{ id: 'stick', count: 3 }, { id: 'leather', count: 2 }], station: 'NONE', category: 'BASIC' },
  { result: { id: 'fiber', count: 1, type: ItemType.MATERIAL }, ingredients: [{ id: 'potato', count: 3 }, { id: 'wheat', count: 1 }], station: 'NONE', category: 'BASIC' },
  { result: { id: 'arrow', count: 4, type: ItemType.TOOL }, ingredients: [{ id: 'stick', count: 1 }, { id: 'iron_ingot', count: 1 }], station: BlockType.CRAFTING_TABLE, category: 'COMBAT' },

  // --- BOWS ---
  { result: { id: 'bow', count: 1, type: ItemType.TOOL }, ingredients: [{ id: BlockType.PLANKS, count: 3 }, { id: 'rope', count: 2 }, { id: 'fiber', count: 1 }], station: BlockType.CRAFTING_TABLE, category: 'COMBAT' },
  { result: { id: 'crossbow', count: 1, type: ItemType.TOOL }, ingredients: [{ id: BlockType.DARK_WOOD, count: 3 }, { id: 'iron_ingot', count: 2 }, { id: 'rope', count: 1 }], station: BlockType.CRAFTING_TABLE, category: 'COMBAT' },

  // --- BASIC ---
  { result: { id: 'basic_axe', count: 1, type: ItemType.TOOL }, ingredients: [{ id: 'stick', count: 3 }], station: 'NONE', category: 'BASIC' },
  { result: { id: BlockType.PLANKS, count: 4, type: ItemType.BLOCK }, ingredients: [{ id: BlockType.WOOD, count: 1 }], station: 'NONE', category: 'BASIC' },
  { result: { id: BlockType.DARK_PLANKS, count: 4, type: ItemType.BLOCK }, ingredients: [{ id: BlockType.DARK_WOOD, count: 1 }], station: 'NONE', category: 'BASIC' },
  { result: { id: BlockType.GOLDEN_PLANKS, count: 4, type: ItemType.BLOCK }, ingredients: [{ id: BlockType.GOLDEN_WOOD, count: 1 }], station: 'NONE', category: 'BASIC' },
  { result: { id: 'stick', count: 4, type: ItemType.MATERIAL }, ingredients: [{ id: BlockType.PLANKS, count: 2 }], station: 'NONE', category: 'BASIC' },
  { result: { id: BlockType.CRAFTING_TABLE, count: 1, type: ItemType.BLOCK }, ingredients: [{ id: BlockType.PLANKS, count: 4 }], station: 'NONE', category: 'BASIC' },

  // --- DECOR ---
  { result: { id: BlockType.TORCH, count: 4, type: ItemType.BLOCK }, ingredients: [{ id: 'stick', count: 1 }, { id: BlockType.COAL_ORE, count: 1 }], station: BlockType.CRAFTING_TABLE, category: 'DECOR' },
  { result: { id: BlockType.BED, count: 1, type: ItemType.BLOCK }, ingredients: [{ id: BlockType.WOOL, count: 3 }, { id: BlockType.PLANKS, count: 3 }], station: BlockType.CRAFTING_TABLE, category: 'DECOR' },
  { result: { id: BlockType.BED_MEDIUM, count: 1, type: ItemType.BLOCK }, ingredients: [{ id: BlockType.BED, count: 1 }, { id: 'iron_ingot', count: 2 }], station: BlockType.CRAFTING_TABLE, category: 'DECOR' },
  { result: { id: BlockType.BED_ADVANCED, count: 1, type: ItemType.BLOCK }, ingredients: [{ id: BlockType.BED_MEDIUM, count: 1 }, { id: 'gold_ingot', count: 2 }, { id: 'diamond', count: 1 }], station: BlockType.CRAFTING_TABLE, category: 'DECOR' },
  { result: { id: BlockType.FURNACE, count: 1, type: ItemType.BLOCK }, ingredients: [{ id: BlockType.STONE, count: 8 }], station: BlockType.CRAFTING_TABLE, category: 'DECOR' },
  { result: { id: BlockType.DOOR_BOTTOM_CLOSED, count: 1, type: ItemType.BLOCK }, ingredients: [{ id: BlockType.PLANKS, count: 6 }], station: BlockType.CRAFTING_TABLE, category: 'DECOR' },
  { result: { id: BlockType.DOOR_IRON_BOTTOM_CLOSED, count: 1, type: ItemType.BLOCK }, ingredients: [{ id: 'iron_ingot', count: 6 }], station: BlockType.CRAFTING_TABLE, category: 'DECOR' },
  { result: { id: BlockType.DOOR_STONE_BOTTOM_CLOSED, count: 1, type: ItemType.BLOCK }, ingredients: [{ id: BlockType.STONE, count: 6 }], station: BlockType.CRAFTING_TABLE, category: 'DECOR' },
  { result: { id: BlockType.ROOF_WOOD, count: 1, type: ItemType.BLOCK }, ingredients: [{ id: BlockType.PLANKS, count: 5 }], station: BlockType.CRAFTING_TABLE, category: 'DECOR' },
  { result: { id: BlockType.ROOF_STONE, count: 1, type: ItemType.BLOCK }, ingredients: [{ id: BlockType.STONE, count: 5 }], station: BlockType.CRAFTING_TABLE, category: 'DECOR' },
  { result: { id: BlockType.CABINET, count: 1, type: ItemType.BLOCK }, ingredients: [{ id: BlockType.PLANKS, count: 10 }], station: BlockType.CRAFTING_TABLE, category: 'DECOR' },
  { result: { id: BlockType.TABLE, count: 1, type: ItemType.BLOCK }, ingredients: [{ id: BlockType.PLANKS, count: 10 }, { id: BlockType.WOOD, count: 3 }], station: BlockType.CRAFTING_TABLE, category: 'DECOR' },
  { result: { id: BlockType.CAMPFIRE, count: 1, type: ItemType.BLOCK }, ingredients: [{ id: 'stick', count: 3 }, { id: BlockType.COAL_ORE, count: 1 }, { id: BlockType.WOOD, count: 3 }], station: BlockType.CRAFTING_TABLE, category: 'DECOR' },
  { result: { id: BlockType.CHEST, count: 1, type: ItemType.BLOCK }, ingredients: [{ id: BlockType.PLANKS, count: 8 }], station: BlockType.CRAFTING_TABLE, category: 'DECOR' },
  { result: { id: BlockType.CHEST_MEDIUM, count: 1, type: ItemType.BLOCK }, ingredients: [{ id: BlockType.CHEST, count: 1 }, { id: 'iron_ingot', count: 1 }], station: BlockType.CRAFTING_TABLE, category: 'DECOR' },
  { result: { id: BlockType.CHEST_LARGE, count: 1, type: ItemType.BLOCK }, ingredients: [{ id: BlockType.CHEST_MEDIUM, count: 1 }, { id: 'diamond', count: 1 }], station: BlockType.CRAFTING_TABLE, category: 'DECOR' },
  { result: { id: BlockType.STONE_CHEST, count: 1, type: ItemType.BLOCK }, ingredients: [{ id: BlockType.CHEST_MEDIUM, count: 1 }, { id: BlockType.STONE, count: 10 }], station: BlockType.CRAFTING_TABLE, category: 'DECOR' },
  { result: { id: BlockType.COPPER_BLOCK, count: 1, type: ItemType.BLOCK }, ingredients: [{ id: 'copper_ingot', count: 9 }], station: BlockType.CRAFTING_TABLE, category: 'DECOR' },
  { result: { id: BlockType.IRON_BLOCK, count: 1, type: ItemType.BLOCK }, ingredients: [{ id: 'iron_ingot', count: 9 }], station: BlockType.CRAFTING_TABLE, category: 'DECOR' },
  { result: { id: BlockType.GOLD_BLOCK, count: 1, type: ItemType.BLOCK }, ingredients: [{ id: 'gold_ingot', count: 9 }], station: BlockType.CRAFTING_TABLE, category: 'DECOR' },
  { result: { id: BlockType.DIAMOND_BLOCK, count: 1, type: ItemType.BLOCK }, ingredients: [{ id: 'diamond', count: 9 }], station: BlockType.CRAFTING_TABLE, category: 'DECOR' },
  { result: { id: BlockType.URANIUM_BLOCK, count: 1, type: ItemType.BLOCK }, ingredients: [{ id: 'uranium', count: 9 }], station: BlockType.CRAFTING_TABLE, category: 'DECOR' },
  { result: { id: BlockType.TITANIUM_BLOCK, count: 1, type: ItemType.BLOCK }, ingredients: [{ id: 'titanium_ingot', count: 9 }], station: BlockType.CRAFTING_TABLE, category: 'DECOR' },
  { result: { id: BlockType.ARMOR_BENCH, count: 1, type: ItemType.BLOCK }, ingredients: [{ id: BlockType.CRAFTING_TABLE, count: 1 }, { id: 'iron_ingot', count: 5 }, { id: 'gold_ingot', count: 1 }], station: BlockType.CRAFTING_TABLE, category: 'DECOR' },
  { result: { id: BlockType.LADDER, count: 3, type: ItemType.BLOCK }, ingredients: [{ id: 'stick', count: 7 }], station: BlockType.CRAFTING_TABLE, category: 'DECOR' },
  { result: { id: BlockType.GLASS_GREEN, count: 1, type: ItemType.BLOCK }, ingredients: [{ id: BlockType.GLASS, count: 1 }, { id: 'green_resin', count: 1 }], station: BlockType.CRAFTING_TABLE, category: 'DECOR' },
  { result: { id: BlockType.GLASS_GREEN, count: 1, type: ItemType.BLOCK }, ingredients: [{ id: BlockType.GLASS, count: 1 }, { id: 'dark_green_resin', count: 1 }], station: BlockType.CRAFTING_TABLE, category: 'DECOR' },
  { result: { id: BlockType.GLASS_BLUE, count: 1, type: ItemType.BLOCK }, ingredients: [{ id: BlockType.GLASS, count: 1 }, { id: 'blue_resin', count: 1 }], station: BlockType.CRAFTING_TABLE, category: 'DECOR' },

  // --- CONCRETE ---
  { result: { id: BlockType.CONCRETE_RED, count: 1, type: ItemType.BLOCK }, ingredients: [{ id: BlockType.WET_SAND, count: 1 }, { id: BlockType.FLOWER_RED, count: 1 }], station: BlockType.CRAFTING_TABLE, category: 'DECOR' },
  { result: { id: BlockType.CONCRETE_YELLOW, count: 1, type: ItemType.BLOCK }, ingredients: [{ id: BlockType.WET_SAND, count: 1 }, { id: BlockType.FLOWER_YELLOW, count: 1 }], station: BlockType.CRAFTING_TABLE, category: 'DECOR' },
  { result: { id: BlockType.CONCRETE_GREEN, count: 1, type: ItemType.BLOCK }, ingredients: [{ id: BlockType.WET_SAND, count: 1 }, { id: BlockType.FLOWER_GREEN, count: 1 }], station: BlockType.CRAFTING_TABLE, category: 'DECOR' },
  { result: { id: BlockType.CONCRETE_BLUE, count: 1, type: ItemType.BLOCK }, ingredients: [{ id: BlockType.WET_SAND, count: 1 }, { id: BlockType.FLOWER_BLUE, count: 1 }], station: BlockType.CRAFTING_TABLE, category: 'DECOR' },
  { result: { id: BlockType.CONCRETE_PURPLE, count: 1, type: ItemType.BLOCK }, ingredients: [{ id: BlockType.WET_SAND, count: 1 }, { id: BlockType.FLOWER_PURPLE, count: 1 }], station: BlockType.CRAFTING_TABLE, category: 'DECOR' },

  // --- ITEMS ---
  { result: { id: 'stick', count: 4, type: ItemType.MATERIAL }, ingredients: [{ id: BlockType.PLANKS, count: 2 }], station: BlockType.CRAFTING_TABLE, category: 'ITEMS' },
  { result: { id: BlockType.PLANKS, count: 4, type: ItemType.BLOCK }, ingredients: [{ id: BlockType.WOOD, count: 1 }], station: BlockType.CRAFTING_TABLE, category: 'ITEMS' },
  { result: { id: 'bread', count: 2, type: ItemType.FOOD }, ingredients: [{ id: 'wheat', count: 3 }], station: BlockType.CRAFTING_TABLE, category: 'ITEMS' },
  { result: { id: 'blue_resin', count: 1, type: ItemType.MATERIAL }, ingredients: [{ id: BlockType.FLOWER_BLUE, count: 1 }], station: 'NONE', category: 'ITEMS' },
  { result: { id: 'green_resin', count: 1, type: ItemType.MATERIAL }, ingredients: [{ id: BlockType.FLOWER_GREEN, count: 1 }], station: 'NONE', category: 'ITEMS' },
  { result: { id: 'red_resin', count: 1, type: ItemType.MATERIAL }, ingredients: [{ id: BlockType.FLOWER_RED, count: 1 }], station: 'NONE', category: 'ITEMS' },
  // TOTEM OF URANIUM RECIPE
  { result: { id: 'uranium_totem', count: 1, type: ItemType.TOOL }, ingredients: [{ id: BlockType.URANIUM_BLOCK, count: 2 }, { id: 'gold_ingot', count: 3 }], station: BlockType.CRAFTING_TABLE, category: 'ITEMS' },
  // SADDLE
  { result: { id: 'saddle', count: 1, type: ItemType.TOOL }, ingredients: [{ id: 'leather', count: 3 }, { id: 'iron_ingot', count: 1 }], station: BlockType.CRAFTING_TABLE, category: 'ITEMS' },
  { result: { id: 'glass_bottle', count: 3, type: ItemType.MATERIAL }, ingredients: [{ id: BlockType.GLASS, count: 3 }], station: BlockType.CRAFTING_TABLE, category: 'ITEMS' },
  { result: { id: 'water_bottle', count: 1, type: ItemType.MATERIAL }, ingredients: [{ id: 'glass_bottle', count: 1 }], station: 'NONE', category: 'ITEMS' },
  { result: { id: 'antidote', count: 1, type: ItemType.FOOD }, ingredients: [{ id: 'green_herb', count: 1 }, { id: 'water_bottle', count: 1 }, { id: 'glass_bottle', count: 1 }], station: BlockType.CRAFTING_TABLE, category: 'ITEMS' },
  { result: { id: 'plague_totem', count: 1, type: ItemType.TOOL }, ingredients: [{ id: 'zombie_meat', count: 5 }, { id: 'diamond', count: 10 }, { id: 'uranium', count: 1 }, { id: 'iron_ingot', count: 3 }, { id: 'dark_crystal', count: 1 }], station: BlockType.CRAFTING_TABLE, category: 'ITEMS' },

  // --- STANDARD TOOLS (Pickaxes, Axes, Shovels, Hoes, Normal Swords/Spears/Hammers) ---
  ...MATERIALS.flatMap(m => {
      const recipes: CraftingRecipe[] = [];
      const mId = m.tier;
      const pId = m.id;
      // Pickaxe
      recipes.push({ result: { id: `${pId}_pickaxe`, count: 1, type: ItemType.TOOL }, ingredients: [{ id: mId, count: 3 }, { id: 'stick', count: 2 }], station: BlockType.CRAFTING_TABLE, category: 'COMBAT' });
      // Axe
      recipes.push({ result: { id: `${pId}_axe`, count: 1, type: ItemType.TOOL }, ingredients: [{ id: mId, count: 3 }, { id: 'stick', count: 2 }], station: BlockType.CRAFTING_TABLE, category: 'COMBAT' });
      // Shovel
      recipes.push({ result: { id: `${pId}_shovel`, count: 1, type: ItemType.TOOL }, ingredients: [{ id: mId, count: 1 }, { id: 'stick', count: 2 }], station: BlockType.CRAFTING_TABLE, category: 'COMBAT' });
      // Hoe
      recipes.push({ result: { id: `${pId}_hoe`, count: 1, type: ItemType.TOOL }, ingredients: [{ id: mId, count: 2 }, { id: 'stick', count: 2 }], station: BlockType.CRAFTING_TABLE, category: 'COMBAT' });
      // Normal Sword
      recipes.push({ result: { id: `${pId}_sword`, count: 1, type: ItemType.TOOL }, ingredients: [{ id: mId, count: 2 }, { id: 'stick', count: 1 }], station: BlockType.CRAFTING_TABLE, category: 'COMBAT' });
      // Katana
      recipes.push({ result: { id: `${pId}_katana`, count: 1, type: ItemType.TOOL }, ingredients: [{ id: mId, count: 2 }, { id: 'stick', count: 1 }], station: BlockType.CRAFTING_TABLE, category: 'COMBAT' });
      // Normal Spear
      recipes.push({ result: { id: `${pId}_spear`, count: 1, type: ItemType.TOOL }, ingredients: [{ id: mId, count: 1 }, { id: 'stick', count: 2 }], station: BlockType.CRAFTING_TABLE, category: 'COMBAT' });
      // Normal Hammer
      recipes.push({ result: { id: `${pId}_hammer`, count: 1, type: ItemType.TOOL }, ingredients: [{ id: mId, count: 4 }, { id: 'stick', count: 2 }], station: BlockType.CRAFTING_TABLE, category: 'COMBAT' });
      // Shield
      recipes.push({ result: { id: `${pId}_shield`, count: 1, type: ItemType.SHIELD }, ingredients: [{ id: mId, count: 5 }, { id: 'stick', count: 1 }], station: BlockType.CRAFTING_TABLE, category: 'COMBAT' });
      // Armor - NOW IN ARMOR BENCH, EXCEPT URANIUM
      if (pId !== 'wood' && pId !== 'stone' && pId !== 'uranium') {
          recipes.push({ result: { id: `${pId}_helmet`, count: 1, type: ItemType.ARMOR }, ingredients: [{ id: mId, count: 5 }], station: BlockType.ARMOR_BENCH, category: 'ARMOR' });
          recipes.push({ result: { id: `${pId}_chestplate`, count: 1, type: ItemType.ARMOR }, ingredients: [{ id: mId, count: 8 }], station: BlockType.ARMOR_BENCH, category: 'ARMOR' });
          recipes.push({ result: { id: `${pId}_leggings`, count: 1, type: ItemType.ARMOR }, ingredients: [{ id: mId, count: 7 }], station: BlockType.ARMOR_BENCH, category: 'ARMOR' });
          recipes.push({ result: { id: `${pId}_boots`, count: 1, type: ItemType.ARMOR }, ingredients: [{ id: mId, count: 4 }], station: BlockType.ARMOR_BENCH, category: 'ARMOR' });
      }
      recipes.push({ result: { id: `${pId}_knife`, count: 1, type: ItemType.TOOL }, ingredients: [{ id: mId, count: 1 }, { id: 'stick', count: 1 }], station: BlockType.CRAFTING_TABLE, category: 'COMBAT' });
      return recipes;
  }),

  // removed WEAPON_RECIPES
  
  // Hazmat - ARMOR BENCH
  { result: { id: 'hazmat_helmet', count: 1, type: ItemType.ARMOR }, ingredients: [{ id: 'leather', count: 5 }], station: BlockType.ARMOR_BENCH, category: 'ARMOR' },
  { result: { id: 'hazmat_chestplate', count: 1, type: ItemType.ARMOR }, ingredients: [{ id: 'leather', count: 8 }], station: BlockType.ARMOR_BENCH, category: 'ARMOR' },
  { result: { id: 'hazmat_leggings', count: 1, type: ItemType.ARMOR }, ingredients: [{ id: 'leather', count: 7 }], station: BlockType.ARMOR_BENCH, category: 'ARMOR' },
  { result: { id: 'hazmat_boots', count: 1, type: ItemType.ARMOR }, ingredients: [{ id: 'leather', count: 4 }], station: BlockType.ARMOR_BENCH, category: 'ARMOR' },
  
  // Reinforced Iron - ARMOR BENCH
  { result: { id: 'reinforced_iron_helmet', count: 1, type: ItemType.ARMOR }, ingredients: [{ id: 'iron_ingot', count: 5 }, { id: 'diamond', count: 1 }], station: BlockType.ARMOR_BENCH, category: 'ARMOR' },
  { result: { id: 'reinforced_iron_chestplate', count: 1, type: ItemType.ARMOR }, ingredients: [{ id: 'iron_ingot', count: 8 }, { id: 'diamond', count: 1 }], station: BlockType.ARMOR_BENCH, category: 'ARMOR' },
  { result: { id: 'reinforced_iron_leggings', count: 1, type: ItemType.ARMOR }, ingredients: [{ id: 'iron_ingot', count: 7 }, { id: 'diamond', count: 1 }], station: BlockType.ARMOR_BENCH, category: 'ARMOR' },
  { result: { id: 'reinforced_iron_boots', count: 1, type: ItemType.ARMOR }, ingredients: [{ id: 'iron_ingot', count: 4 }, { id: 'diamond', count: 1 }], station: BlockType.ARMOR_BENCH, category: 'ARMOR' },
  
  // New recipes
  { result: { id: BlockType.SCIENCE_BENCH, count: 1, type: ItemType.BLOCK }, ingredients: [{ id: BlockType.PLANKS, count: 5 }, { id: BlockType.CRAFTING_TABLE, count: 1 }, { id: 'iron_ingot', count: 2 }, { id: 'gold_ingot', count: 1 }], station: BlockType.CRAFTING_TABLE, category: 'DECOR' },
  { result: { id: BlockType.MEDICAL_BENCH, count: 1, type: ItemType.BLOCK }, ingredients: [{ id: BlockType.PLANKS, count: 10 }, { id: 'iron_ingot', count: 5 }, { id: 'gold_ingot', count: 2 }], station: BlockType.CRAFTING_TABLE, category: 'DECOR' },
  { result: { id: BlockType.CABLE, count: 4, type: ItemType.BLOCK }, ingredients: [{ id: 'copper_ingot', count: 2 }, { id: 'gold_ingot', count: 1 }], station: BlockType.CRAFTING_TABLE, category: 'DECOR' },

  { result: { id: BlockType.SLAB_WOOD, count: 2, type: ItemType.BLOCK }, ingredients: [{ id: BlockType.PLANKS, count: 1 }], station: BlockType.CRAFTING_TABLE, category: 'DECOR' },
  { result: { id: BlockType.SLAB_STONE, count: 2, type: ItemType.BLOCK }, ingredients: [{ id: BlockType.STONE, count: 1 }], station: BlockType.CRAFTING_TABLE, category: 'DECOR' },

  { result: { id: 'tray', count: 1, type: ItemType.MATERIAL }, ingredients: [{ id: 'iron_ingot', count: 2 }], station: BlockType.MEDICAL_BENCH, category: 'TOOLS' as any },
  { result: { id: 'medkit', count: 1, type: ItemType.MATERIAL }, ingredients: [{ id: 'tray', count: 1 }, { id: 'bandage', count: 2 }, { id: 'syringe', count: 1 }], station: BlockType.MEDICAL_BENCH, category: 'TOOLS' as any },
  { result: { id: 'antidote', count: 1, type: ItemType.MATERIAL }, ingredients: [{ id: 'glass_bottle', count: 1 }, { id: 'syringe', count: 1 }, { id: 'apple', count: 1 }], station: BlockType.SCIENCE_BENCH, category: 'TOOLS' as any },

  { result: { id: 'potion_regen', count: 1, type: ItemType.MATERIAL }, ingredients: [{ id: 'glass_bottle', count: 1 }, { id: 'syringe', count: 2 }, { id: 'bandage', count: 1 }], station: BlockType.SCIENCE_BENCH, category: 'TOOLS' as any },
  { result: { id: 'potion_resistance', count: 1, type: ItemType.MATERIAL }, ingredients: [{ id: 'glass_bottle', count: 1 }, { id: 'medicine', count: 1 }, { id: 'syringe', count: 2 }], station: BlockType.SCIENCE_BENCH, category: 'TOOLS' as any },
  { result: { id: 'potion_fire', count: 1, type: ItemType.MATERIAL }, ingredients: [{ id: 'lava_bucket', count: 1 }, { id: 'glass_bottle', count: 1 }], station: BlockType.SCIENCE_BENCH, category: 'TOOLS' as any },
  { result: { id: 'potion_cold', count: 1, type: ItemType.MATERIAL }, ingredients: [{ id: BlockType.ICE, count: 5 }, { id: 'water_bucket', count: 1 }, { id: 'glass_bottle', count: 1 }], station: BlockType.SCIENCE_BENCH, category: 'TOOLS' as any },
  { result: { id: 'potion_antizombie', count: 1, type: ItemType.MATERIAL }, ingredients: [{ id: 'uranium', count: 1 }, { id: 'glass_bottle', count: 1 }], station: BlockType.SCIENCE_BENCH, category: 'TOOLS' as any },
  { result: { id: 'bucket', count: 1, type: ItemType.TOOL }, ingredients: [{ id: 'iron_ingot', count: 5 }], station: BlockType.CRAFTING_TABLE, category: 'TOOLS' as any },
  { result: { id: 'fishing_rod', count: 1, type: ItemType.TOOL }, ingredients: [{ id: BlockType.COBWEB, count: 2 }, { id: 'stick', count: 2 }], station: BlockType.CRAFTING_TABLE, category: 'TOOLS' as any },
  
  { result: { id: 'syringe', count: 1, type: ItemType.MATERIAL }, ingredients: [{ id: 'iron_ingot', count: 2 }, { id: BlockType.GLASS, count: 2 }], station: BlockType.MEDICAL_BENCH, category: 'TOOLS' as any },
  { result: { id: 'bandage', count: 1, type: ItemType.MATERIAL }, ingredients: [{ id: BlockType.GLASS, count: 5 }, { id: BlockType.WOOL, count: 3 }, { id: 'iron_ingot', count: 5 }], station: BlockType.MEDICAL_BENCH, category: 'TOOLS' as any },
  { result: { id: 'medicine', count: 1, type: ItemType.MATERIAL }, ingredients: [{ id: 'syringe', count: 2 }, { id: 'antidote', count: 1 }], station: BlockType.MEDICAL_BENCH, category: 'TOOLS' as any },
  { result: { id: 'antidote', count: 1, type: ItemType.MATERIAL }, ingredients: [{ id: 'medicine', count: 2 }, { id: 'syringe', count: 3 }], station: BlockType.MEDICAL_BENCH, category: 'TOOLS' as any },
  
  { result: { id: BlockType.BUTTON, count: 1, type: ItemType.BLOCK }, ingredients: [{ id: 'iron_ingot', count: 5 }, { id: 'copper_ingot', count: 1 }], station: BlockType.CRAFTING_TABLE, category: 'DECOR' },
  { result: { id: BlockType.LEVER, count: 1, type: ItemType.BLOCK }, ingredients: [{ id: 'stick', count: 1 }, { id: BlockType.STONE, count: 1 }], station: BlockType.CRAFTING_TABLE, category: 'DECOR' },
  { result: { id: BlockType.LAMP, count: 1, type: ItemType.BLOCK }, ingredients: [{ id: BlockType.GLASS, count: 1 }, { id: 'copper_ingot', count: 1 }, { id: 'iron_ingot', count: 1 }], station: BlockType.CRAFTING_TABLE, category: 'DECOR' },
];

export const COOKING_RECIPES: Record<string, string> = {
  'raw_beef': 'steak',
  'raw_porkchop': 'cooked_porkchop', 'raw_chicken': 'cooked_chicken',
  'raw_mutton': 'cooked_mutton',
  'potato': 'baked_potato',
  'raw_iron': 'iron_ingot',
  'raw_gold': 'gold_ingot',
  'raw_copper': 'copper_ingot',
  'raw_titanium': 'titanium_ingot',
  'raw_diamond': 'diamond',
  'raw_uranium': 'uranium',
  [BlockType.SAND.toString()]: BlockType.GLASS.toString(),
};

export const FUEL_VALUES: Record<string, number> = {
  [BlockType.COAL_ORE]: 1600, 
  [BlockType.WOOD]: 300,
  [BlockType.DARK_WOOD]: 400,
  [BlockType.PLANKS]: 300,
  'stick': 100, 
};

// removed duplicate MATERIALS.forEach

// Add other base item colors
Object.assign(ITEM_COLORS, {
  'basic_axe': '#a1887f', 'stick': '#6d4c41', 'raw_beef': '#ef5350', 'steak': '#8d6e63',
  'raw_porkchop': '#f48fb1', 'cooked_porkchop': '#e1bee7', 'raw_chicken': '#ef5350', 'cooked_chicken': '#8d6e63', 'raw_mutton': '#ef9a9a', 'cooked_mutton': '#bcaaa4',
  'iron_ingot': '#cfd8dc', 'gold_ingot': '#ffecb3', 'copper_ingot': '#e67e22', 'titanium_ingot': '#0d47a1',
  'diamond': '#4dd0e1', 'uranium': '#76ff03', 'leather': '#5d4037',
  'raw_iron': '#a1887f', 'raw_gold': '#fbc02d', 'raw_copper': '#d35400', 'raw_titanium': '#1565c0', 'raw_diamond': '#b2ebf2', 'raw_uranium': '#b2ff59',
  'wheat_seeds': '#cddc39', 'carrot': '#ff9800', 'potato': '#ffe0b2', 'wheat': '#f0f4c3',
  'cherry': '#e91e63', 'baked_potato': '#ffcc80', 'bread': '#d7ccc8',
  'blue_resin': '#1e88e5', 'green_resin': '#43a047', 'red_resin': '#e53935', 'dark_green_resin': '#1b5e20',
  'saddle': '#795548',
  'spawn_zombie': '#2e7d32', 'spawn_pig': '#f48fb1', 'spawn_cow': '#795548', 'spawn_sheep': '#e0e0e0', 'spawn_chicken': '#ffb300',
  'spawn_scorpion': '#ffb300', 'spawn_camel': '#d7ccc8', 'spawn_snake': '#4caf50', 'spawn_rabbit': '#a1887f', 'spawn_mutant_zombie': '#1b5e20', 'spawn_smiler': '#000000',
  'spawn_golden_deer': '#ffca28', 'spawn_lunar_fox': '#b39ddb',
  'spawn_polar_bear': '#ffffff', 'spawn_dog': '#d7ccc8', 'spawn_npc': '#ffcc80', 'spawn_zombie_runner': '#4caf50', 'spawn_zombie_tank': '#1b5e20', 'spawn_zombie_explosive': '#8bc34a', 'spawn_zombie_toxic': '#00e676', 'spawn_zombie_skeleton': '#f5f5f5', 'spawn_zombie_infector': '#6a1b9a', 'spawn_zombie_dark': '#222', 'spawn_zombie_frozen': '#81d4fa', 'spawn_zombie_king': '#1b5e20', 'spawn_plague_king': '#2e7d32', 'spawn_bush_mob': '#1b5e20', 'spawn_spider': '#212121', 'spawn_blood_zombie': '#b71c1c', 'spawn_bird': '#000000', 'spawn_shark': '#1e88e5', 'bone': '#e0e0e0',
  'syringe': '#eeeeee', 'bandage': '#ffebeb', 'medicine': '#ff1744',
  'potion_regen': '#ff4081', 'potion_resistance': '#fb8c00', 'potion_fire': '#ff9800', 
  'potion_cold': '#00bcd4', 'potion_antizombie': '#69f0ae',
  'bucket': '#b0bec5', 'water_bucket': '#42a5f5', 'lava_bucket': '#ff5722',
  'fishing_rod': '#8d6e63', 'raw_fish': '#81d4fa', 'cooked_fish': '#ffcc80', 'trash': '#757575'
});

// Add Armor colors manually for standard mats
['iron','gold','diamond','copper','titanium','uranium'].forEach(m => {
    ITEM_COLORS[`${m}_helmet`] = ITEM_COLORS[`${m}_pickaxe`];
    ITEM_COLORS[`${m}_chestplate`] = ITEM_COLORS[`${m}_pickaxe`];
    ITEM_COLORS[`${m}_leggings`] = ITEM_COLORS[`${m}_pickaxe`];
    ITEM_COLORS[`${m}_boots`] = ITEM_COLORS[`${m}_pickaxe`];
});
ITEM_COLORS['hazmat_helmet'] = '#ffeb3b'; ITEM_COLORS['hazmat_chestplate'] = '#ffeb3b';
ITEM_COLORS['hazmat_leggings'] = '#ffeb3b'; ITEM_COLORS['hazmat_boots'] = '#ffeb3b';
ITEM_COLORS['reinforced_iron_helmet'] = '#9e9e9e'; ITEM_COLORS['reinforced_iron_chestplate'] = '#9e9e9e';
ITEM_COLORS['reinforced_iron_leggings'] = '#9e9e9e'; ITEM_COLORS['reinforced_iron_boots'] = '#9e9e9e';
ITEM_COLORS['leather_helmet'] = '#3e2723'; ITEM_COLORS['leather_chestplate'] = '#3e2723';
ITEM_COLORS['leather_leggings'] = '#3e2723'; ITEM_COLORS['leather_boots'] = '#3e2723';


export const ITEM_ICONS: Record<string, string> = {
  'br_key': '🔑',
  'pickaxe': '⛏️', 'sword': '⚔️', 'axe': '🪓', 'shovel': '🥄', 'katana': '🗡️', 'spear': '🔱', 'hammer': '🔨', 'hoe': '👩‍🌾',
  'helmet': '🪖', 'chestplate': '👕', 'leggings': '👖', 'boots': '👢', 'shield': '🛡️',
  'battle_axe': '🪓', 'hunting_spear': '🍢', 'dagger': '🔪', 'war_hammer': '⚒️', 'club': '🏏', 'scythe': '🌾', 'short_sword': '🗡️', 'knife': '🔪',
  'bow': '🏹', 'crossbow': '🏹', 'arrow': '➹', 'rope': '➰', 'fiber': '🧵',
  'steak': '🥩', 'porkchop': '🥓', 'mutton': '🍖', 'ingot': '🧊', 'diamond': '💎', 'stick': '🥢',
  'wheat_seeds': '🌱', 'carrot': '🥕', 'potato': '🥔', 'wheat': '🌾', 'cherry': '🍒', 'baked_potato': '🥔', 'bread': '🍞',
  'uranium_totem': '🧿', 'uranium': '☢️', 'leather': '🧥', 'hazmat': '☣️', 'resin': '💧',
  'bone': '🦴',
  [BlockType.FLOWER_RED]: '🌹', [BlockType.FLOWER_GREEN]: '🍀', [BlockType.FLOWER_BLUE]: '💠',
  'spawn_': '🥚'
};

export const FOOD_VALUES: Record<string, number> = {
  'raw_beef': 2, 'steak': 8,
  'raw_chicken': 2, 'cooked_chicken': 6, 'raw_porkchop': 2, 'cooked_porkchop': 8,
  'raw_mutton': 2, 'cooked_mutton': 8,
  'carrot': 3, 'potato': 1, 'baked_potato': 5,
  'cherry': 1, 'bread': 5
};

// Generate Names dynamically for translations
const EN_MAT_NAMES = { wood: 'Wooden', stone: 'Stone', copper: 'Copper', iron: 'Iron', gold: 'Gold', diamond: 'Diamond', titanium: 'Titanium', uranium: 'Uranium' };
const PT_MAT_NAMES = { wood: 'de Madeira', stone: 'de Pedra', copper: 'de Cobre', iron: 'de Ferro', gold: 'de Ouro', diamond: 'de Diamante', titanium: 'de Titânio', uranium: 'de Urânio' };

const EN_WEAP_NAMES = { battle_axe: 'Battle Axe', hunting_spear: 'Hunting Spear', dagger: 'Dagger', war_hammer: 'War Hammer', club: 'Club', scythe: 'Combat Scythe', short_sword: 'Short Sword', knife: 'Knife' };
const PT_WEAP_NAMES = { battle_axe: 'Machado de Batalha', hunting_spear: 'Lança de Caça', dagger: 'Adaga', war_hammer: 'Martelo de Guerra', club: 'Clava', scythe: 'Foice de Combate', short_sword: 'Espada Curta', knife: 'Faca' };

export const ITEM_NAMES: Record<'EN' | 'PT' | 'ES' | 'JA', Record<string, string>> = {
    EN: {
        [BlockType.DIRT]: 'Dirt', [BlockType.GRASS]: 'Grass', [BlockType.DARK_GRASS]: 'Dark Grass', [BlockType.STONE]: 'Stone', [BlockType.DEEP_STONE]: 'Deep Slate',
        [BlockType.WOOD]: 'Wood Log', [BlockType.DARK_WOOD]: 'Dark Wood', [BlockType.PLANKS]: 'Wood Planks', [BlockType.DARK_PLANKS]: 'Dark Wood Planks', [BlockType.GOLDEN_PLANKS]: 'Golden Wood Planks', [BlockType.CRAFTING_TABLE]: 'Crafting Table',
        [BlockType.APPLE_LEAVES]: 'Apple Leaves', [BlockType.LEAVES]: 'Leaves', [BlockType.DARK_LEAVES]: 'Dark Leaves', [BlockType.BUSH]: 'Bush', [BlockType.BEDROCK]: 'Bedrock',
        [BlockType.FURNACE]: 'Furnace', [BlockType.TORCH]: 'Torch', [BlockType.CHEST]: 'Small Chest', [BlockType.CHEST_MEDIUM]: 'Medium Chest', [BlockType.CHEST_LARGE]: 'Large Chest', [BlockType.STONE_CHEST]: 'Stone Chest',
        [BlockType.BED]: 'Basic Bed', [BlockType.BED_MEDIUM]: 'Medium Bed', [BlockType.BED_ADVANCED]: 'Advanced Bed',
        [BlockType.COAL_ORE]: 'Coal Ore', [BlockType.IRON_ORE]: 'Iron Ore', [BlockType.GOLD_ORE]: 'Gold Ore', [BlockType.DIAMOND_ORE]: 'Diamond Ore', [BlockType.COPPER_ORE]: 'Copper Ore', [BlockType.TITANIUM_ORE]: 'Titanium Ore', [BlockType.URANIUM_ORE]: 'Uranium Ore',
        [BlockType.WOOL]: 'Wool', [BlockType.WATER]: 'Water', [BlockType.SAND]: 'Sand', [BlockType.GLASS]: 'Glass',
        [BlockType.ROOF_WOOD]: 'Wood Roof', [BlockType.ROOF_STONE]: 'Stone Roof', [BlockType.ROOF_WOOD_LEFT]: 'Wood Roof (L)', [BlockType.ROOF_STONE_LEFT]: 'Stone Roof (L)',
                [BlockType.CABINET]: 'Cabinet', [BlockType.TABLE]: 'Table', [BlockType.CAMPFIRE]: 'Campfire',
        [BlockType.COPPER_BLOCK]: 'Copper Block', [BlockType.IRON_BLOCK]: 'Iron Block', [BlockType.GOLD_BLOCK]: 'Gold Block', [BlockType.DIAMOND_BLOCK]: 'Diamond Block',
        [BlockType.DOOR_IRON_BOTTOM_CLOSED]: 'Iron Door', [BlockType.DOOR_STONE_BOTTOM_CLOSED]: 'Stone Door',
        [BlockType.LAVA]: 'Lava',
        [BlockType.WALL_WOOD]: 'Wood Wall', [BlockType.DOOR_BOTTOM_CLOSED]: 'Door', [BlockType.FARMLAND]: 'Farmland',
        [BlockType.BERRY_BUSH]: 'Cherry Bush', [BlockType.SEED_BUSH]: 'Seed Bush',
        [BlockType.FLOWER_RED]: 'Red Flower', [BlockType.FLOWER_GREEN]: 'Green Flower', [BlockType.FLOWER_BLUE]: 'Blue Flower', [BlockType.ARMOR_BENCH]: 'Armor Bench', [BlockType.LADDER]: 'Ladder',
        [BlockType.SLAB_WOOD]: 'Wood Slab', [BlockType.SLAB_STONE]: 'Stone Slab',
        [BlockType.PINE_WOOD]: 'Pine Wood', [BlockType.PINE_LEAVES]: 'Pine Leaves',
        [BlockType.GOLDEN_WOOD]: 'Golden Wood', [BlockType.GOLDEN_LEAVES]: 'Golden Leaves', [BlockType.GOLDEN_GRASS]: 'Golden Grass',
        [BlockType.FROZEN_WOOD]: 'Frozen Wood', [BlockType.GOLDEN_FLOWER]: 'Golden Flower', [BlockType.GOLDEN_BUSH]: 'Golden Bush',
        [BlockType.FENCE]: 'Oak Fence', [BlockType.CONCRETE]: 'White Concrete', [BlockType.WET_SAND]: 'Wet Sand', [BlockType.CONCRETE_PURPLE]: 'Purple Concrete', [BlockType.CONCRETE_RED]: 'Red Concrete',
        [BlockType.CONCRETE_BLUE]: 'Blue Concrete', [BlockType.CONCRETE_GREEN]: 'Green Concrete',
        [BlockType.CONCRETE_YELLOW]: 'Yellow Concrete', [BlockType.FLOWER_YELLOW]: 'Yellow Flower',
        [BlockType.FLOWER_PURPLE]: 'Purple Flower', [BlockType.GLASS_RED]: 'Red Glass',
        [BlockType.GLASS_YELLOW]: 'Yellow Glass',
        [BlockType.TALL_GRASS]: 'Tall Grass', [BlockType.FALLEN_LOG]: 'Fallen Log',
        [BlockType.CACTUS]: 'Cactus', [BlockType.DRY_LEAVES]: 'Dry Leaves', [BlockType.GLASS_GREEN]: 'Green Glass', [BlockType.GLASS_BLUE]: 'Blue Glass',
        [BlockType.SNOWY_GRASS]: 'Snowy Grass', [BlockType.SNOW_BLOCK]: 'Snow Block', [BlockType.ICE]: 'Ice', [BlockType.SNOWY_LEAVES]: 'Snowy Leaves',
        [BlockType.SPIKE]: 'Spikes', [BlockType.MOSS]: 'Moss', [BlockType.VINES]: 'Vines', [BlockType.COBWEB]: 'Cobweb',
        [BlockType.MEDICAL_BENCH]: 'Medical Bench', [BlockType.SCIENCE_BENCH]: 'Chemistry Bench',
        [BlockType.CABLE]: 'Cable', [BlockType.BUTTON]: 'Button', [BlockType.LEVER]: 'Lever', [BlockType.LAMP]: 'Lamp',
        [BlockType.URANIUM_BLOCK]: 'Uranium Block', [BlockType.TITANIUM_BLOCK]: 'Titanium Block',

        'tray': 'Tray', 'medkit': 'Medkit', 'antidote': 'Antidote',
        'syringe': 'Syringe', 'bandage': 'Bandage', 'medicine': 'Medicine',
        'potion_regen': 'Regen Potion', 'potion_resistance': 'Resistance Potion', 'potion_fire': 'Fire Resist',
        'potion_cold': 'Cold Resist Potion', 'potion_antizombie': 'Anti-Zombie',
        'bucket': 'Bucket', 'water_bucket': 'Water Bucket', 'lava_bucket': 'Lava Bucket',
        'fishing_rod': 'Fishing Rod', 'raw_fish': 'Raw Fish', 'cooked_fish': 'Cooked Fish', 'trash': 'Trash',
        'stick': 'Stick', 'basic_axe': 'Basic Axe', 'rope': 'Rope', 'fiber': 'Fiber', 'arrow': 'Arrow', 'bow': 'Simple Bow', 'crossbow': 'Besta',
        'iron_ingot': 'Iron Ingot', 'gold_ingot': 'Gold Ingot', 'copper_ingot': 'Copper Ingot', 'titanium_ingot': 'Titanium Ingot', 'diamond': 'Diamond', 'uranium': 'Uranium', 'leather': 'Leather',
        'raw_iron': 'Raw Iron', 'raw_gold': 'Raw Gold', 'raw_copper': 'Raw Copper', 'raw_titanium': 'Raw Titanium', 'raw_diamond': 'Raw Diamond', 'raw_uranium': 'Raw Uranium',
        'raw_beef': 'Raw Beef', 'steak': 'Steak', 'raw_porkchop': 'Raw Porkchop', 'cooked_porkchop': 'Cooked Porkchop', 'raw_chicken': 'Raw Chicken', 'cooked_chicken': 'Cooked Chicken', 'raw_mutton': 'Raw Mutton', 'cooked_mutton': 'Cooked Mutton',
        'offhand': 'Off Hand', 'wheat_seeds': 'Wheat Seeds', 'carrot': 'Carrot', 'potato': 'Potato', 'wheat': 'Wheat', 'cherry': 'Cherry', 'baked_potato': 'Baked Potato', 'bread': 'Bread',
        'blue_resin': 'Blue Resin', 'green_resin': 'Green Resin', 'red_resin': 'Red Resin', 'dark_green_resin': 'Dark Green Resin', 'uranium_totem': 'Uranium Totem',
        'saddle': 'Saddle', 'bone': 'Bone', 'apple': 'Apple', 'tree_seed': 'Tree Seed',
        'golden_wood': 'Golden Wood', 'rare_flower': 'Rare Flower',
        // Manual entries for base tools
        'wood_pickaxe': 'Wooden Pickaxe', 'wood_axe': 'Wooden Axe', 'wood_shovel': 'Wooden Shovel', 'wood_sword': 'Wooden Sword', 'wood_katana': 'Wooden Katana', 'wood_spear': 'Wooden Spear', 'wood_hammer': 'Wooden Hammer', 'wood_hoe': 'Wooden Hoe',
        'stone_pickaxe': 'Stone Pickaxe', 'stone_axe': 'Stone Axe', 'stone_shovel': 'Stone Shovel', 'stone_sword': 'Stone Sword', 'stone_katana': 'Stone Katana', 'stone_spear': 'Stone Spear', 'stone_hammer': 'Stone Hammer', 'stone_hoe': 'Stone Hoe', 'stone_shield': 'Stone Shield',
        'iron_pickaxe': 'Iron Pickaxe', 'iron_axe': 'Iron Axe', 'iron_shovel': 'Iron Shovel', 'iron_sword': 'Iron Sword', 'iron_katana': 'Iron Katana', 'iron_spear': 'Iron Spear', 'iron_hammer': 'Iron Hammer', 'iron_hoe': 'Iron Hoe', 'iron_shield': 'Iron Shield',
        'gold_pickaxe': 'Gold Pickaxe', 'gold_axe': 'Gold Axe', 'gold_shovel': 'Gold Shovel', 'gold_sword': 'Gold Sword', 'gold_katana': 'Gold Katana', 'gold_spear': 'Gold Spear', 'gold_hammer': 'Gold Hammer', 'gold_hoe': 'Gold Hoe', 'gold_shield': 'Gold Shield',
        'diamond_pickaxe': 'Diamond Pickaxe', 'diamond_axe': 'Diamond Axe', 'diamond_shovel': 'Diamond Shovel', 'diamond_sword': 'Diamond Sword', 'diamond_katana': 'Diamond Katana', 'diamond_spear': 'Diamond Spear', 'diamond_hammer': 'Diamond Hammer', 'diamond_hoe': 'Diamond Hoe', 'diamond_shield': 'Diamond Shield',
        'titanium_pickaxe': 'Titanium Pickaxe', 'titanium_axe': 'Titanium Axe', 'titanium_shovel': 'Titanium Shovel', 'titanium_sword': 'Titanium Sword', 'titanium_katana': 'Titanium Katana', 'titanium_spear': 'Titanium Spear', 'titanium_hammer': 'Titanium Hammer', 'titanium_shield': 'Titanium Shield',
        'uranium_pickaxe': 'Uranium Pickaxe', 'uranium_axe': 'Uranium Axe', 'uranium_shovel': 'Uranium Shovel', 'uranium_sword': 'Uranium Sword', 'uranium_katana': 'Uranium Katana', 'uranium_spear': 'Uranium Spear', 'uranium_hammer': 'Uranium Hammer', 'uranium_shield': 'Uranium Shield',
        'copper_pickaxe': 'Copper Pickaxe', 'copper_axe': 'Copper Axe', 'copper_shovel': 'Copper Shovel', 'copper_sword': 'Copper Sword', 'copper_katana': 'Copper Katana', 'copper_spear': 'Copper Spear', 'copper_shield': 'Copper Shield',
        // Armors
        'iron_helmet': 'Iron Helmet', 'iron_chestplate': 'Iron Chestplate', 'iron_leggings': 'Iron Leggings', 'iron_boots': 'Iron Boots',
        'reinforced_iron_helmet': 'Reinforced Iron Helmet', 'reinforced_iron_chestplate': 'Reinforced Iron Chestplate', 'reinforced_iron_leggings': 'Reinforced Iron Leggings', 'reinforced_iron_boots': 'Reinforced Iron Boots',
        'gold_helmet': 'Gold Helmet', 'gold_chestplate': 'Gold Chestplate', 'gold_leggings': 'Gold Leggings', 'gold_boots': 'Gold Boots',
        'diamond_helmet': 'Diamond Helmet', 'diamond_chestplate': 'Diamond Chestplate', 'diamond_leggings': 'Diamond Leggings', 'diamond_boots': 'Diamond Boots',
        'titanium_helmet': 'Titanium Helmet', 'titanium_chestplate': 'Titanium Chestplate', 'titanium_leggings': 'Titanium Leggings', 'titanium_boots': 'Titanium Boots',
        'uranium_helmet': 'Uranium Helmet', 'uranium_chestplate': 'Uranium Chestplate', 'uranium_leggings': 'Uranium Leggings', 'uranium_boots': 'Uranium Boots',
        'copper_helmet': 'Copper Helmet', 'copper_chestplate': 'Copper Chestplate', 'copper_leggings': 'Copper Leggings', 'copper_boots': 'Copper Boots',
        'hazmat_helmet': 'Radiation Helmet', 'hazmat_chestplate': 'Radiation Chestplate', 'hazmat_leggings': 'Radiation Leggings', 'hazmat_boots': 'Radiation Boots',
        'leather_helmet': 'Leather Helmet', 'leather_chestplate': 'Leather Chestplate', 'leather_leggings': 'Leather Leggings', 'leather_boots': 'Leather Boots',
        'spawn_zombie': 'Zombie Spawn Egg', 'spawn_zombie_runner': 'Runner Zombie Egg', 'spawn_zombie_tank': 'Tank Zombie Egg', 'spawn_zombie_explosive': 'Explosive Zombie Egg', 'spawn_zombie_toxic': 'Toxic Zombie Egg', 'spawn_zombie_skeleton': 'Skeleton Zombie Egg', 'spawn_zombie_infector': 'Infector Zombie Egg', 'spawn_zombie_dark': 'Dark Zombie Egg', 'spawn_zombie_frozen': 'Frozen Zombie Egg', 'spawn_zombie_king': 'Zombie King Egg', 'spawn_plague_king': 'Plague King Egg', 'spawn_blood_zombie': 'Blood Zombie Egg', 'spawn_pig': 'Pig Spawn Egg', 'spawn_cow': 'Cow Spawn Egg', 'spawn_sheep': 'Sheep Spawn Egg', 'spawn_scorpion': 'Scorpion Spawn Egg', 'spawn_camel': 'Camel Spawn Egg', 'spawn_snake': 'Snake Spawn Egg', 'spawn_rabbit': 'Rabbit Spawn Egg', 'spawn_mutant_zombie': 'Mutant Zombie Spawn Egg', 'spawn_polar_bear': 'Polar Bear Spawn Egg', 'spawn_dog': 'Dog Spawn Egg', 'spawn_chicken': 'Chicken Spawn Egg', 'spawn_npc': 'NPC Spawn Egg', 'spawn_bush_mob': 'Bush Mob Spawn Egg', 'spawn_spider': 'Spider Spawn Egg', 'spawn_bird': 'Bird Spawn Egg', 'spawn_golden_deer': 'Golden Deer Egg', 'spawn_lunar_fox': 'Lunar Fox Egg', 'spawn_shark': 'Shark Egg', 'spawn_smiler': 'Smiler Egg',
        SLEEP_MENU: "Sleep Menu",
        WAKE_TIME: "Wake up at:",
        SLEEP: "Sleep",
        CANT_SLEEP: "You can only sleep at night in this bed.",
        ONLINE_MODE: "Online Mode",
        CREATE_ROOM: "Create Room",
        JOIN_ROOM: "Join Room",
        ROOM_NAME: "Room Name",
        ROOM_CODE: "Room Code",
        ENTER_CODE: "Enter Room Code",
        START_HOST: "Start Host",
    },
    PT: {
        [BlockType.DIRT]: 'Terra', [BlockType.GRASS]: 'Grama', [BlockType.DARK_GRASS]: 'Grama Escura', [BlockType.STONE]: 'Pedra', [BlockType.DEEP_STONE]: 'Pedra Profunda',
        [BlockType.WOOD]: 'Madeira Bruta', [BlockType.DARK_WOOD]: 'Madeira Escura', [BlockType.PLANKS]: 'Tábuas de Madeira', [BlockType.DARK_PLANKS]: 'Madeira Refinada Escura', [BlockType.GOLDEN_PLANKS]: 'Madeira Refinada Dourada', [BlockType.CRAFTING_TABLE]: 'Bancada de Trabalho',
        [BlockType.FURNACE]: 'Fornalha', [BlockType.TORCH]: 'Tocha', [BlockType.CHEST]: 'Baú Pequeno', [BlockType.CHEST_MEDIUM]: 'Baú Médio', [BlockType.CHEST_LARGE]: 'Baú Grande', [BlockType.STONE_CHEST]: 'Baú de Pedra',
        [BlockType.BED]: 'Cama Básica', [BlockType.BED_MEDIUM]: 'Cama Média', [BlockType.BED_ADVANCED]: 'Cama Avançada',
        [BlockType.COAL_ORE]: 'Minério de Carvão', [BlockType.IRON_ORE]: 'Minério de Ferro', [BlockType.GOLD_ORE]: 'Minério de Ouro', [BlockType.DIAMOND_ORE]: 'Minério de Diamante', [BlockType.COPPER_ORE]: 'Minério de Cobre', [BlockType.TITANIUM_ORE]: 'Minério de Titânio', [BlockType.URANIUM_ORE]: 'Minério de Urânio',
        [BlockType.WOOL]: 'Lã', [BlockType.WATER]: 'Água', [BlockType.SAND]: 'Areia', [BlockType.GLASS]: 'Vidro',
                [BlockType.CABINET]: 'Armário', [BlockType.TABLE]: 'Mesa', [BlockType.CAMPFIRE]: 'Fogueira',
        [BlockType.COPPER_BLOCK]: 'Bloco de Cobre', [BlockType.IRON_BLOCK]: 'Bloco de Ferro', [BlockType.GOLD_BLOCK]: 'Bloco de Ouro', [BlockType.DIAMOND_BLOCK]: 'Bloco de Diamante',
        [BlockType.DOOR_IRON_BOTTOM_CLOSED]: 'Porta de Ferro', [BlockType.DOOR_STONE_BOTTOM_CLOSED]: 'Porta de Pedra',
        [BlockType.LAVA]: 'Lava',
        [BlockType.WALL_WOOD]: 'Parede de Madeira', [BlockType.DOOR_BOTTOM_CLOSED]: 'Porta', [BlockType.FARMLAND]: 'Terra Arada',
        [BlockType.BERRY_BUSH]: 'Arbusto de Cereja', [BlockType.SEED_BUSH]: 'Arbusto de Sementes',
        [BlockType.FLOWER_RED]: 'Flor Vermelha', [BlockType.FLOWER_GREEN]: 'Flor Verde', [BlockType.FLOWER_BLUE]: 'Flor Azul', [BlockType.ARMOR_BENCH]: 'Bancada de Armaduras', [BlockType.LADDER]: 'Escada',
        [BlockType.SLAB_WOOD]: 'Laje de Madeira', [BlockType.SLAB_STONE]: 'Laje de Pedra',
        [BlockType.PINE_WOOD]: 'Madeira de Pinheiro', [BlockType.PINE_LEAVES]: 'Folhas de Pinheiro',
        [BlockType.GOLDEN_WOOD]: 'Madeira Dourada', [BlockType.GOLDEN_LEAVES]: 'Folhas Douradas', [BlockType.GOLDEN_GRASS]: 'Grama Dourada',
        [BlockType.FROZEN_WOOD]: 'Madeira Congelada', [BlockType.GOLDEN_FLOWER]: 'Flor Dourada', [BlockType.GOLDEN_BUSH]: 'Moita Dourada',
        [BlockType.FENCE]: 'Cerca', [BlockType.CONCRETE]: 'Concreto Branco', [BlockType.WET_SAND]: 'Areia Molhada', [BlockType.CONCRETE_PURPLE]: 'Concreto Roxo', [BlockType.CONCRETE_RED]: 'Concreto Vermelho',
        [BlockType.CONCRETE_BLUE]: 'Concreto Azul', [BlockType.CONCRETE_GREEN]: 'Concreto Verde',
        [BlockType.CONCRETE_YELLOW]: 'Concreto Amarelo', [BlockType.FLOWER_YELLOW]: 'Flor Amarela',
        [BlockType.FLOWER_PURPLE]: 'Flor Roxa', [BlockType.GLASS_RED]: 'Vidro Vermelho',
        [BlockType.GLASS_YELLOW]: 'Vidro Amarelo',
        [BlockType.TALL_GRASS]: 'Grama Alta', [BlockType.FALLEN_LOG]: 'Tronco Caído',
        [BlockType.CACTUS]: 'Cacto', [BlockType.DRY_LEAVES]: 'Folhas Secas', [BlockType.GLASS_GREEN]: 'Vidro Verde', [BlockType.GLASS_BLUE]: 'Vidro Azul',
        [BlockType.SNOWY_GRASS]: 'Grama com Neve', [BlockType.SNOW_BLOCK]: 'Bloco de Neve', [BlockType.ICE]: 'Gelo', [BlockType.SNOWY_LEAVES]: 'Folhas com Neve',
        [BlockType.SPIKE]: 'Espinhos', [BlockType.MOSS]: 'Musgo', [BlockType.VINES]: 'Vinhas', [BlockType.COBWEB]: 'Teia de Aranha',
        [BlockType.MEDICAL_BENCH]: 'Mesa Médica', [BlockType.SCIENCE_BENCH]: 'Mesa Científica',
        [BlockType.CABLE]: 'Cabo', [BlockType.BUTTON]: 'Botão', [BlockType.LEVER]: 'Alavanca', [BlockType.LAMP]: 'Lâmpada',
        [BlockType.URANIUM_BLOCK]: 'Bloco de Urânio', [BlockType.TITANIUM_BLOCK]: 'Bloco de Titânio',
        [BlockType.ROOF_WOOD]: 'Telhado de Madeira', [BlockType.ROOF_STONE]: 'Telhado de Pedra', [BlockType.ROOF_WOOD_LEFT]: 'Telhado de Madeira (Esq)', [BlockType.ROOF_STONE_LEFT]: 'Telhado de Pedra (Esq)',

        'tray': 'Bandeja', 'medkit': 'Medkit', 'antidote': 'Antídoto',
        'syringe': 'Seringa', 'bandage': 'Bandagem', 'medicine': 'Remédio',
        'potion_regen': 'Poção de Regeneração', 'potion_resistance': 'Poção de Resistência', 'potion_fire': 'Poção contra Fogo',
        'potion_cold': 'Poção contra Frio', 'potion_antizombie': 'Poção contra Zumbis',
        'bucket': 'Balde', 'water_bucket': 'Balde de Água', 'lava_bucket': 'Balde de Lava',
        'fishing_rod': 'Vara de Pescar', 'raw_fish': 'Peixe Cru', 'cooked_fish': 'Peixe Assado', 'trash': 'Lixo',
        'stick': 'Graveto', 'basic_axe': 'Machado Básico', 'rope': 'Corda', 'fiber': 'Fibra', 'arrow': 'Flecha', 'bow': 'Arco Simples', 'crossbow': 'Besta',
        'iron_ingot': 'Barra de Ferro', 'gold_ingot': 'Barra de Ouro', 'copper_ingot': 'Barra de Cobre', 'titanium_ingot': 'Barra de Titânio', 'diamond': 'Diamante', 'uranium': 'Urânio', 'leather': 'Couro',
        'raw_iron': 'Ferro Bruto', 'raw_gold': 'Ouro Bruto', 'raw_copper': 'Cobre Bruto', 'raw_titanium': 'Titânio Bruto', 'raw_diamond': 'Diamante Bruto', 'raw_uranium': 'Urânio Bruto',
        'raw_beef': 'Bife Cru', 'steak': 'Bife Assado', 'raw_porkchop': 'Carne de Porco Crua', 'cooked_porkchop': 'Carne de Porco Assada', 'raw_chicken': 'Frango Cru', 'cooked_chicken': 'Frango Assado', 'raw_mutton': 'Carne de Carneiro Crua', 'cooked_mutton': 'Carne de Carneiro Assada',
        'offhand': 'Mão Esquerda', 'wheat_seeds': 'Sementes de Trigo', 'carrot': 'Cenoura', 'potato': 'Batata', 'wheat': 'Trigo', 'cherry': 'Cereja', 'baked_potato': 'Batata Cozida', 'bread': 'Pão',
        'blue_resin': 'Resina Azul', 'green_resin': 'Resina Verde', 'red_resin': 'Resina Vermelha', 'dark_green_resin': 'Resina Verde Escura', 'uranium_totem': 'Totem de Urânio',
        'saddle': 'Sela', 'bone': 'Osso', 'apple': 'Maçã', 'tree_seed': 'Semente de Árvore',
        'golden_wood': 'Madeira Dourada', 'rare_flower': 'Flor Rara',
        // Manual entries
        'wood_pickaxe': 'Picareta de Madeira', 'wood_axe': 'Machado de Madeira', 'wood_shovel': 'Pá de Madeira', 'wood_sword': 'Espada de Madeira', 'wood_katana': 'Katana de Madeira', 'wood_spear': 'Lança de Madeira', 'wood_hammer': 'Martelo de Madeira', 'wood_hoe': 'Enxada de Madeira',
        'stone_pickaxe': 'Picareta de Pedra', 'stone_axe': 'Machado de Pedra', 'stone_shovel': 'Pá de Pedra', 'stone_sword': 'Espada de Pedra', 'stone_katana': 'Katana de Pedra', 'stone_spear': 'Lança de Pedra', 'stone_hammer': 'Martelo de Pedra', 'stone_hoe': 'Enxada de Pedra', 'stone_shield': 'Escudo de Pedra',
        'iron_pickaxe': 'Picareta de Ferro', 'iron_axe': 'Machado de Ferro', 'iron_shovel': 'Pá de Ferro', 'iron_sword': 'Espada de Ferro', 'iron_katana': 'Katana de Ferro', 'iron_spear': 'Lança de Ferro', 'iron_hammer': 'Martelo de Ferro', 'iron_hoe': 'Enxada de Ferro', 'iron_shield': 'Escudo de Ferro',
        'gold_pickaxe': 'Picareta de Ouro', 'gold_axe': 'Machado de Ouro', 'gold_shovel': 'Pá de Ouro', 'gold_sword': 'Espada de Ouro', 'gold_katana': 'Katana de Ouro', 'gold_spear': 'Lança de Ouro', 'gold_hammer': 'Martelo de Ouro', 'gold_hoe': 'Enxada de Ouro', 'gold_shield': 'Escudo de Ouro',
        'diamond_pickaxe': 'Picareta de Diamante', 'diamond_axe': 'Machado de Diamante', 'diamond_shovel': 'Pá de Diamante', 'diamond_sword': 'Espada de Diamante', 'diamond_katana': 'Katana de Diamante', 'diamond_spear': 'Lança de Diamante', 'diamond_hammer': 'Martelo de Diamante', 'diamond_hoe': 'Enxada de Diamante', 'diamond_shield': 'Escudo de Diamante',
        'titanium_pickaxe': 'Picareta de Titânio', 'titanium_axe': 'Machado de Titânio', 'titanium_shovel': 'Pá de Titânio', 'titanium_sword': 'Espada de Titânio', 'titanium_katana': 'Katana de Titânio', 'titanium_spear': 'Lança de Titânio', 'titanium_hammer': 'Martelo de Titânio', 'titanium_shield': 'Escudo de Titânio',
        'uranium_pickaxe': 'Picareta de Urânio', 'uranium_axe': 'Machado de Urânio', 'uranium_shovel': 'Pá de Urânio', 'uranium_sword': 'Espada de Urânio', 'uranium_katana': 'Katana de Urânio', 'uranium_spear': 'Lança de Urânio', 'uranium_hammer': 'Martelo de Urânio', 'uranium_shield': 'Escudo de Urânio',
        'copper_pickaxe': 'Picareta de Cobre', 'copper_axe': 'Machado de Cobre', 'copper_shovel': 'Pá de Cobre', 'copper_sword': 'Espada de Cobre', 'copper_katana': 'Katana de Cobre', 'copper_spear': 'Lança de Cobre', 'copper_shield': 'Escudo de Cobre',
        // Armors
        'iron_helmet': 'Capacete de Ferro', 'iron_chestplate': 'Peitoral de Ferro', 'iron_leggings': 'Calça de Ferro', 'iron_boots': 'Botas de Ferro',
        'reinforced_iron_helmet': 'Capacete de Ferro Reforçado', 'reinforced_iron_chestplate': 'Peitoral de Ferro Reforçado', 'reinforced_iron_leggings': 'Calça de Ferro Reforçado', 'reinforced_iron_boots': 'Botas de Ferro Reforçado',
        'gold_helmet': 'Capacete de Ouro', 'gold_chestplate': 'Peitoral de Ouro', 'gold_leggings': 'Calça de Ouro', 'gold_boots': 'Botas de Ouro',
        'diamond_helmet': 'Capacete de Diamante', 'diamond_chestplate': 'Peitoral de Diamante', 'diamond_leggings': 'Calça de Diamante', 'diamond_boots': 'Botas de Diamante',
        'titanium_helmet': 'Capacete de Titânio', 'titanium_chestplate': 'Peitoral de Titânio', 'titanium_leggings': 'Calça de Titânio', 'titanium_boots': 'Botas de Titânio',
        'uranium_helmet': 'Capacete de Urânio', 'uranium_chestplate': 'Peitoral de Urânio', 'uranium_leggings': 'Calça de Urânio', 'uranium_boots': 'Botas de Urânio',
        'copper_helmet': 'Capacete de Cobre', 'copper_chestplate': 'Peitoral de Cobre', 'copper_leggings': 'Calça de Cobre', 'copper_boots': 'Botas de Cobre',
        'hazmat_helmet': 'Capacete de Radiação', 'hazmat_chestplate': 'Peitoral de Radiação', 'hazmat_leggings': 'Calça de Radiação', 'hazmat_boots': 'Botas de Radiação',
        'leather_helmet': 'Capacete de Couro', 'leather_chestplate': 'Peitoral de Couro', 'leather_leggings': 'Calça de Couro', 'leather_boots': 'Botas de Couro',
        'spawn_zombie': 'Ovo de Zumbi', 'spawn_zombie_runner': 'Ovo de Zumbi Corredor', 'spawn_zombie_tank': 'Ovo de Zumbi Tanque', 'spawn_zombie_explosive': 'Ovo de Zumbi Explosivo', 'spawn_zombie_toxic': 'Ovo de Zumbi Tóxico', 'spawn_zombie_skeleton': 'Ovo de Zumbi Esqueleto', 'spawn_zombie_infector': 'Ovo de Zumbi Infectador', 'spawn_zombie_dark': 'Ovo de Zumbi Sombrio', 'spawn_zombie_frozen': 'Ovo de Zumbi de Gelo', 'spawn_zombie_king': 'Ovo do Rei Zumbi', 'spawn_plague_king': 'Ovo do Rei da Praga', 'spawn_blood_zombie': 'Ovo de Zumbi de Sangue', 'spawn_pig': 'Ovo de Porco', 'spawn_cow': 'Ovo de Vaca', 'spawn_sheep': 'Ovo de Ovelha', 'spawn_scorpion': 'Ovo de Escorpião', 'spawn_camel': 'Ovo de Camelo', 'spawn_snake': 'Ovo de Cobra', 'spawn_rabbit': 'Ovo de Coelho', 'spawn_mutant_zombie': 'Ovo de Zumbi Mutante', 'spawn_polar_bear': 'Ovo de Urso Polar', 'spawn_dog': 'Ovo de Cachorro', 'spawn_chicken': 'Ovo de Galinha', 'spawn_npc': 'Ovo de NPC', 'spawn_bush_mob': 'Ovo de Monstro do Arbusto', 'spawn_spider': 'Ovo de Aranha', 'spawn_bird': 'Ovo de Pássaro', 'spawn_golden_deer': 'Ovo de Cervo Dourado', 'spawn_lunar_fox': 'Ovo de Raposa Lunar', 'spawn_shark': 'Ovo de Tubarão', 'spawn_smiler': 'Ovo de Smiler',
        dark_crystal: "Cristal Sombrio",
        plague_totem: "Totem da Praga",
        wood_knife: "Faca de Madeira",
        stone_knife: "Faca de Pedra",
        iron_knife: "Faca de Ferro",
        gold_knife: "Faca de Ouro",
        diamond_knife: "Faca de Diamante",
        titanium_knife: "Faca de Titânio",
        uranium_knife: "Faca de Urânio",
        copper_knife: "Faca de Cobre",
        knife: "Faca"
    },
    ES: {
        [BlockType.DIRT]: 'Tierra', [BlockType.GRASS]: 'Césped', [BlockType.DARK_GRASS]: 'Césped Oscuro', [BlockType.STONE]: 'Piedra', [BlockType.DEEP_STONE]: 'Pizarra Profunda',
        [BlockType.WOOD]: 'Tronco', [BlockType.DARK_WOOD]: 'Madera Oscura', [BlockType.PLANKS]: 'Tablones', [BlockType.CRAFTING_TABLE]: 'Mesa de Trabajo',
        [BlockType.FURNACE]: 'Horno', [BlockType.TORCH]: 'Antorcha', [BlockType.CHEST]: 'Cofre',
        'stick': 'Palo', 'basic_axe': 'Hacha Básica', 'rope': 'Cuerda', 'fiber': 'Fibra',
        'iron_ingot': 'Lingote de Hierro', 'gold_ingot': 'Lingote de Oro', 'diamond': 'Diamante',
        SLEEP_MENU: "Menú de Sueño", WAKE_TIME: "Despertar a las:", SLEEP: "Dormir", CANT_SLEEP: "Solo puedes dormir de noche.",
        ONLINE_MODE: "Modo Online", CREATE_ROOM: "Crear Sala", JOIN_ROOM: "Unirse a Sala", ROOM_NAME: "Nombre de la Sala", ROOM_CODE: "Código", ENTER_CODE: "Ingresar Código", START_HOST: "Iniciar Host", JOIN: "Unirse", SELECT_WORLD: "Seleccionar Mundo", NEW_WORLD: "Nuevo Mundo", MULTIPLAYER_NOTE: "Inventarios separados.", ARMOR_BENCH: "Mesa de Armaduras", ARMOR_CRAFTING: "Crear Armadura", ARMOR_UPGRADE: "Mejorar Armadura", ONE_HIT_BREAK: "Romper de 1 Golpe"
    },
    JA: {
        [BlockType.DIRT]: '土', [BlockType.GRASS]: '草', [BlockType.DARK_GRASS]: '暗い草', [BlockType.STONE]: '石', [BlockType.DEEP_STONE]: '深層岩',
        [BlockType.WOOD]: '原木', [BlockType.DARK_WOOD]: '暗い木', [BlockType.PLANKS]: '木材', [BlockType.CRAFTING_TABLE]: '作業台',
        [BlockType.FURNACE]: 'かまど', [BlockType.TORCH]: '松明', [BlockType.CHEST]: 'チェスト',
        'stick': '棒', 'basic_axe': '木の斧', 'rope': '糸', 'fiber': '繊維',
        'iron_ingot': '鉄インゴット', 'gold_ingot': '金インゴット', 'diamond': 'ダイヤモンド',
        SLEEP_MENU: "睡眠メニュー", WAKE_TIME: "起床時間:", SLEEP: "寝る", CANT_SLEEP: "夜しか眠れません。",
        ONLINE_MODE: "オンライン", CREATE_ROOM: "ルーム作成", JOIN_ROOM: "ルーム参加", ROOM_NAME: "ルーム名", ROOM_CODE: "コード", ENTER_CODE: "コード入力", START_HOST: "ホスト開始", JOIN: "参加", SELECT_WORLD: "ワールド選択", NEW_WORLD: "新規ワールド", MULTIPLAYER_NOTE: "インベントリは別々です。", ARMOR_BENCH: "防具作業台", ARMOR_CRAFTING: "防具作成", ARMOR_UPGRADE: "防具強化", ONE_HIT_BREAK: "一撃破壊"
    }
};

export const TRANSLATIONS: Record<'EN' | 'PT' | 'ES' | 'JA', Record<string, string>> = {
  // ... (keep existing translations, I will just append to the end of the file)

  EN: {
    MENU: "Menu",
    INVENTORY: "Inventory",
    CHARACTER: "Character",
    CRAFTING: "Crafting",
    DECOR: "Decor",
    ITEMS: "Items",
    COMBAT: "Combat",
    SEARCH: "Search",
    LEVEL: "Level",
    POINTS: "Skill Points",
    STATS_STRENGTH: "Strength",
    STATS_REACH: "Reach",
    STATS_VITALITY: "Vitality",
    STATS_METABOLISM: "Metabolism",
    STATS_ENDURANCE: "Endurance",
    STATS_AGILITY: "Agility",
    NO_RECIPES: "No recipes found.",
    HINT_INV: "Right Click to split/equip. Drag to move.",
    PLAY: "Play",
    ONLINE_MODE: "Online Mode",
    OPTIONS: "Options",
    ACHIEVEMENTS: "Achievements",
    CREATE_ROOM: "Create Room",
    JOIN_ROOM: "Join Room",
    MULTIPLAYER_NOTE: "Note: Inventories and XP are separate. You can explore independently.",
    BACK: "Back",
    ROOM_NAME: "Room Name",
    ROOM_CODE: "Room Code",
    SELECT_WORLD: "Select World",
    NEW_WORLD: "New World",
    START_HOST: "Start Host",
    ENTER_CODE: "Enter Room Code",
    JOIN: "Join",
    LANGUAGE: "Language",
    COORDS: "Coordinates",
    ADMIN_TEST: "Admin Mode",
    ADMIN_CONFIRM_TITLE: "Enable Admin Mode?",
    ADMIN_CONFIRM_MSG: "Enabling Admin Mode allows flying and spawning items. Achievements are disabled.",
    YES: "Yes",
    NO: "No",
    BUILD_MENU: "Build Menu",
    REQ: "Req",
    LOYALTY_DESC: "Combine identical items to repair durability.",
    UPGRADE: "Repair",
    ADMIN_PANEL: "Admin Panel",
    NO_CLIP: "No Clip",
    NIGHT_VISION: "Night Vision",
    ONE_HIT_BREAK: "One Hit Break",
    RESET_DAY: "Reset Day",
    SKIP_DAY: "Skip to Night",
    TOTAL_INV: "Total Inventory",
    SLEEP_MENU: "Sleep Menu",
    WAKE_TIME: "Wake up at:",
    SLEEP: "Sleep",
    ADMIN_HINT: "Press P for Admin Panel",
    CANT_SLEEP: "You can only sleep at night.",
    ARMOR_BENCH: "Armor Bench",
    PROMPT_CLIMB: "F to Climb",
    PROMPT_EXIT_LADDER: "F to Exit Ladder",
    PROMPT_OPEN_WORKBENCH: "F to Open Workbench",
    PROMPT_OPEN_FURNACE: "F to Open Furnace",
    PROMPT_OPEN_CHEST: "F to Open Chest",
    PROMPT_SLEEP: "F to Sleep",
    PROMPT_OPEN_ARMOR: "F to Open Armor Bench",
    PROMPT_OPEN: "F to Open",
    PROMPT_CLOSE: "F to Close",
    FALL_DAMAGE: "You took fall damage!",
    LADDER_REQ: "Ladders must be placed on walls!",
    SLEEP_SUCCESS: "You slept and rested.",
    HAMMER_MODE: "Hammer Mode",
    NEW_WORLD_NAME: "World Name",
    SEED_OPTIONAL: "Seed (Optional)",
    LEAVE_BLANK: "Leave blank for random",
    GAME_MODE: "Game Mode",
    SURVIVAL: "Survival",
    GOD_MODE: "God Mode",
    DIFFICULTY: "Difficulty",
    EASY: "Easy",
    NORMAL: "Normal",
    HARD: "Hard",
    DIFF_EASY_DESC: "Less damage, slower hunger.",
    DIFF_NORMAL_DESC: "Standard experience.",
    DIFF_HARD_DESC: "Permadeath. World deleted on death.",
    MOBILE_MODE: "Mobile Mode",
    ON: "ON",
    OFF: "OFF",
    DELETE: "Delete",
    CANCEL: "Cancel",
    PLAY_SELECTED: "Play Selected",
    NO_SAVES: "No saved worlds",
    SEED: "Seed",
    LAST_PLAYED: "Last Played",
    SELECT_WORLD_TITLE: "Select World",
    CREATE_NEW_WORLD_TITLE: "Create New World",
    OPTIONS_TITLE: "Options",
    ONLINE_MODE_TITLE: "Online Mode",
    CREATE_ROOM_TITLE: "Create Room",
    JOIN_ROOM_TITLE: "Join Room",
    ENTER_CODE_LABEL: "Enter Code",
    ROOM_NAME_LABEL: "Room Name",
    ROOM_CODE_LABEL: "Room Code",
    SELECT_WORLD_LABEL: "Select World",
    START_HOST_BTN: "Start Host",
    JOIN_BTN: "Join",
    BACK_BTN: "Back",
  },
  PT: {
    MENU: "Menu",
    INVENTORY: "Inventário",
    CHARACTER: "Personagem",
    CRAFTING: "Criação",
    DECOR: "Decoração",
    ITEMS: "Itens",
    COMBAT: "Combate",
    SEARCH: "Buscar",
    LEVEL: "Nível",
    POINTS: "Pontos",
    STATS_STRENGTH: "Força",
    STATS_REACH: "Alcance",
    STATS_VITALITY: "Vitalidade",
    STATS_METABOLISM: "Metabolismo",
    STATS_ENDURANCE: "Resistência",
    STATS_AGILITY: "Agilidade",
    NO_RECIPES: "Nenhuma receita encontrada.",
    HINT_INV: "Clique Direito para dividir/equipar. Arraste para mover.",
    PLAY: "Jogar",
    ONLINE_MODE: "Modo Online",
    OPTIONS: "Opções",
    ACHIEVEMENTS: "Conquistas",
    CREATE_ROOM: "Criar Sala",
    JOIN_ROOM: "Entrar na Sala",
    MULTIPLAYER_NOTE: "Nota: Inventários e XP são separados.",
    BACK: "Voltar",
    ROOM_NAME: "Nome da Sala",
    ROOM_CODE: "Código",
    SELECT_WORLD: "Selecionar Mundo",
    NEW_WORLD: "Novo Mundo",
    START_HOST: "Iniciar Host",
    ENTER_CODE: "Código da Sala",
    JOIN: "Entrar",
    LANGUAGE: "Idioma",
    COORDS: "Coordenadas",
    ADMIN_TEST: "Modo Admin",
    ADMIN_CONFIRM_TITLE: "Ativar Modo Admin?",
    ADMIN_CONFIRM_MSG: "Isso permite voar e criar itens. Conquistas desativadas.",
    YES: "Sim",
    NO: "Não",
    BUILD_MENU: "Menu de Construção",
    REQ: "Req",
    LOYALTY_DESC: "Combine itens iguais para reparar.",
    UPGRADE: "Reparar",
    ADMIN_PANEL: "Painel Admin",
    NO_CLIP: "Atravessar Paredes",
    NIGHT_VISION: "Visão Noturna",
    ONE_HIT_BREAK: "Quebrar Instantâneo",
    RESET_DAY: "Dia",
    SKIP_DAY: "Noite",
    TOTAL_INV: "Todos os Itens",
    SLEEP_MENU: "Menu de Sono",
    WAKE_TIME: "Acordar às:",
    SLEEP: "Dormir",
    ADMIN_HINT: "Pressione P para Painel Admin",
    CANT_SLEEP: "Você só pode dormir a noite.",
    ARMOR_BENCH: "Bancada de Armaduras",
    PROMPT_CLIMB: "F para Subir",
    PROMPT_EXIT_LADDER: "F para Sair",
    PROMPT_OPEN_WORKBENCH: "F para Abrir Bancada",
    PROMPT_OPEN_FURNACE: "F para Abrir Fornalha",
    PROMPT_OPEN_CHEST: "F para Abrir Baú",
    PROMPT_SLEEP: "F para Dormir",
    PROMPT_OPEN_ARMOR: "F para Abrir Armaria",
    PROMPT_OPEN: "F para Abrir",
    PROMPT_CLOSE: "F para Fechar",
    FALL_DAMAGE: "Você se machucou na queda!",
    LADDER_REQ: "Escadas devem ser colocadas em paredes!",
    SLEEP_SUCCESS: "Você dormiu e descansou.",
    HAMMER_MODE: "Modo Martelo",
    NEW_WORLD_NAME: "Nome do Mundo",
    SEED_OPTIONAL: "Semente (Opcional)",
    LEAVE_BLANK: "Deixe em branco para aleatório",
    GAME_MODE: "Modo de Jogo",
    SURVIVAL: "Sobrevivência",
    GOD_MODE: "Modo Deus",
    DIFFICULTY: "Dificuldade",
    EASY: "Fácil",
    NORMAL: "Normal",
    HARD: "Difícil",
    DIFF_EASY_DESC: "Menos dano, fome mais lenta.",
    DIFF_NORMAL_DESC: "Experiência padrão.",
    DIFF_HARD_DESC: "Morte permanente. Mundo deletado ao morrer.",
    MOBILE_MODE: "Modo Mobile",
    ON: "LIGADO",
    OFF: "DESLIGADO",
    DELETE: "Deletar",
    CANCEL: "Cancelar",
    PLAY_SELECTED: "Jogar Selecionado",
    NO_SAVES: "Nenhum mundo salvo",
    SEED: "Semente",
    LAST_PLAYED: "Última vez jogado",
    SELECT_WORLD_TITLE: "Selecionar Mundo",
    CREATE_NEW_WORLD_TITLE: "Criar Novo Mundo",
    OPTIONS_TITLE: "Opções",
    ONLINE_MODE_TITLE: "Modo Online",
    CREATE_ROOM_TITLE: "Criar Sala",
    JOIN_ROOM_TITLE: "Entrar na Sala",
    ENTER_CODE_LABEL: "Digite o Código",
    ROOM_NAME_LABEL: "Nome da Sala",
    ROOM_CODE_LABEL: "Código da Sala",
    SELECT_WORLD_LABEL: "Selecionar Mundo",
    START_HOST_BTN: "Iniciar Host",
    JOIN_BTN: "Entrar",
    BACK_BTN: "Voltar",
    MODS: "Mods",
    FULLSCREEN: "Tela Cheia",
    QUIT: "Sair",
  },
  ES: {
    MENU: "Menú",
    INVENTORY: "Inventario",
    CHARACTER: "Personaje",
    CRAFTING: "Elaboración",
    DECOR: "Decoración",
    ITEMS: "Objetos",
    COMBAT: "Combate",
    SEARCH: "Buscar",
    LEVEL: "Nivel",
    POINTS: "Puntos de Habilidad",
    STATS_STRENGTH: "Fuerza",
    STATS_REACH: "Alcance",
    STATS_VITALITY: "Vitalidad",
    STATS_METABOLISM: "Metabolismo",
    STATS_ENDURANCE: "Resistencia",
    STATS_AGILITY: "Agilidad",
    NO_RECIPES: "No se encontraron recetas.",
    HINT_INV: "Clic derecho para dividir/equipar. Arrastrar para mover.",
    PLAY: "Jugar",
    ONLINE_MODE: "Modo Online",
    OPTIONS: "Opciones",
    ACHIEVEMENTS: "Logros",
    CREATE_ROOM: "Crear Sala",
    JOIN_ROOM: "Unirse a Sala",
    MULTIPLAYER_NOTE: "Nota: Los inventarios y XP están separados. Pueden explorar independientemente.",
    BACK: "Volver",
    ROOM_NAME: "Nombre de la Sala",
    ROOM_CODE: "Código de la Sala",
    SELECT_WORLD: "Seleccionar Mundo",
    NEW_WORLD: "Nuevo Mundo",
    START_HOST: "Iniciar Host",
    ENTER_CODE: "Ingresar Código",
    JOIN: "Unirse",
    LANGUAGE: "Idioma",
    COORDS: "Coordenadas",
    ADMIN_TEST: "Modo Admin",
    ADMIN_CONFIRM_TITLE: "¿Activar Modo Admin?",
    ADMIN_CONFIRM_MSG: "Activar el Modo Admin permite volar y generar objetos. Los logros se desactivan.",
    YES: "Sí",
    NO: "No",
    BUILD_MENU: "Menú de Construcción",
    REQ: "Req",
    LOYALTY_DESC: "Combina objetos idénticos para reparar durabilidad.",
    UPGRADE: "Reparar",
    ADMIN_PANEL: "Panel Admin",
    NO_CLIP: "Atravesar Paredes",
    NIGHT_VISION: "Visión Nocturna",
    ONE_HIT_BREAK: "Romper de 1 Golpe",
    RESET_DAY: "Reiniciar Día",
    SKIP_DAY: "Saltar a la Noche",
    TOTAL_INV: "Inventario Total",
    SLEEP_MENU: "Menú de Sueño",
    WAKE_TIME: "Despertar a las:",
    SLEEP: "Dormir",
    ADMIN_HINT: "Presiona P para Panel Admin",
    CANT_SLEEP: "Solo puedes dormir de noche.",
    ARMOR_BENCH: "Mesa de Armaduras",
    PROMPT_CLIMB: "F para Subir",
    PROMPT_EXIT_LADDER: "F para Salir",
    PROMPT_OPEN_WORKBENCH: "F para Abrir Mesa",
    PROMPT_OPEN_FURNACE: "F para Abrir Horno",
    PROMPT_OPEN_CHEST: "F para Abrir Cofre",
    PROMPT_SLEEP: "F para Dormir",
    PROMPT_OPEN_ARMOR: "F para Abrir Armería",
    PROMPT_OPEN: "F para Abrir",
    PROMPT_CLOSE: "F para Cerrar",
    FALL_DAMAGE: "¡Te lastimaste al caer!",
    LADDER_REQ: "¡Las escaleras deben colocarse en paredes!",
    SLEEP_SUCCESS: "Dormiste y descansaste.",
    HAMMER_MODE: "Modo Martillo",
    NEW_WORLD_NAME: "Nombre del Mundo",
    SEED_OPTIONAL: "Semilla (Opcional)",
    LEAVE_BLANK: "Dejar en blanco para aleatorio",
    GAME_MODE: "Modo de Juego",
    SURVIVAL: "Supervivencia",
    GOD_MODE: "Modo Dios",
    DIFFICULTY: "Dificultad",
    EASY: "Fácil",
    NORMAL: "Normal",
    HARD: "Difícil",
    DIFF_EASY_DESC: "Menos daño, hambre más lenta.",
    DIFF_NORMAL_DESC: "Experiencia estándar.",
    DIFF_HARD_DESC: "Muerte permanente. Mundo eliminado al morir.",
    MOBILE_MODE: "Modo Móvil",
    ON: "ENCENDIDO",
    OFF: "APAGADO",
    DELETE: "Eliminar",
    CANCEL: "Cancelar",
    PLAY_SELECTED: "Jugar Seleccionado",
    NO_SAVES: "No hay mundos guardados",
    SEED: "Semilla",
    LAST_PLAYED: "Última vez jugado",
    SELECT_WORLD_TITLE: "Seleccionar Mundo",
    CREATE_NEW_WORLD_TITLE: "Crear Nuevo Mundo",
    OPTIONS_TITLE: "Opciones",
    ONLINE_MODE_TITLE: "Modo Online",
    CREATE_ROOM_TITLE: "Crear Sala",
    JOIN_ROOM_TITLE: "Unirse a Sala",
    ENTER_CODE_LABEL: "Ingresa el Código",
    ROOM_NAME_LABEL: "Nombre de la Sala",
    ROOM_CODE_LABEL: "Código de la Sala",
    SELECT_WORLD_LABEL: "Seleccionar Mundo",
    START_HOST_BTN: "Iniciar Host",
    JOIN_BTN: "Unirse",
    BACK_BTN: "Volver",
    MODS: "Mods",
    FULLSCREEN: "Pantalla Completa",
    QUIT: "Salir",
  },
  JA: {
    MENU: "メニュー",
    INVENTORY: "インベントリ",
    CHARACTER: "キャラクター",
    CRAFTING: "クラフト",
    DECOR: "装飾",
    ITEMS: "アイテム",
    COMBAT: "戦闘",
    SEARCH: "検索",
    LEVEL: "レベル",
    POINTS: "スキルポイント",
    STATS_STRENGTH: "筋力",
    STATS_REACH: "リーチ",
    STATS_VITALITY: "体力",
    STATS_METABOLISM: "代謝",
    STATS_ENDURANCE: "持久力",
    STATS_AGILITY: "敏捷性",
    NO_RECIPES: "レシピが見つかりません。",
    HINT_INV: "右クリックで分割/装備。ドラッグで移動。",
    PLAY: "プレイ",
    ONLINE_MODE: "オンラインモード",
    OPTIONS: "オプション",
    ACHIEVEMENTS: "実績",
    CREATE_ROOM: "ルーム作成",
    JOIN_ROOM: "ルーム参加",
    MULTIPLAYER_NOTE: "注意：インベントリとXPは別々です。独立して探索できます。",
    BACK: "戻る",
    ROOM_NAME: "ルーム名",
    ROOM_CODE: "ルームコード",
    SELECT_WORLD: "ワールド選択",
    NEW_WORLD: "新規ワールド",
    START_HOST: "ホスト開始",
    ENTER_CODE: "コード入力",
    JOIN: "参加",
    LANGUAGE: "言語",
    COORDS: "座標",
    ADMIN_TEST: "管理者モード",
    ADMIN_CONFIRM_TITLE: "管理者モードを有効にしますか？",
    ADMIN_CONFIRM_MSG: "管理者モードを有効にすると、飛行やアイテムの生成が可能になります。実績は無効になります。",
    YES: "はい",
    NO: "いいえ",
    BUILD_MENU: "建築メニュー",
    REQ: "必要",
    LOYALTY_DESC: "同じアイテムを組み合わせて耐久度を回復します。",
    UPGRADE: "修理",
    ADMIN_PANEL: "管理者パネル",
    NO_CLIP: "壁抜け",
    NIGHT_VISION: "暗視",
    ONE_HIT_BREAK: "一撃破壊",
    RESET_DAY: "昼にする",
    SKIP_DAY: "夜にする",
    TOTAL_INV: "全インベントリ",
    SLEEP_MENU: "睡眠メニュー",
    WAKE_TIME: "起床時間：",
    SLEEP: "寝る",
    ADMIN_HINT: "Pキーで管理者パネル",
    CANT_SLEEP: "夜しか眠れません。",
    ARMOR_BENCH: "防具作業台",
    PROMPT_CLIMB: "Fで登る",
    PROMPT_EXIT_LADDER: "Fで降りる",
    PROMPT_OPEN_WORKBENCH: "Fで作業台を開く",
    PROMPT_OPEN_FURNACE: "Fでかまどを開く",
    PROMPT_OPEN_CHEST: "Fでチェストを開く",
    PROMPT_SLEEP: "Fで寝る",
    PROMPT_OPEN_ARMOR: "Fで防具台を開く",
    PROMPT_OPEN: "Fで開く",
    PROMPT_CLOSE: "Fで閉じる",
    FALL_DAMAGE: "落下ダメージを受けました！",
    LADDER_REQ: "はしごは壁に設置する必要があります！",
    SLEEP_SUCCESS: "眠って休息しました。",
    HAMMER_MODE: "ハンマーモード",
    NEW_WORLD_NAME: "ワールド名",
    SEED_OPTIONAL: "シード値（任意）",
    LEAVE_BLANK: "空白でランダム",
    GAME_MODE: "ゲームモード",
    SURVIVAL: "サバイバル",
    GOD_MODE: "ゴッドモード",
    DIFFICULTY: "難易度",
    EASY: "イージー",
    NORMAL: "ノーマル",
    HARD: "ハード",
    DIFF_EASY_DESC: "ダメージ減少、空腹が遅い。",
    DIFF_NORMAL_DESC: "標準的な体験。",
    DIFF_HARD_DESC: "パーマデス。死ぬとワールドが削除されます。",
    MOBILE_MODE: "モバイルモード",
    ON: "オン",
    OFF: "オフ",
    DELETE: "削除",
    CANCEL: "キャンセル",
    PLAY_SELECTED: "選択してプレイ",
    NO_SAVES: "セーブデータがありません",
    SEED: "シード値",
    LAST_PLAYED: "最終プレイ",
    SELECT_WORLD_TITLE: "ワールド選択",
    CREATE_NEW_WORLD_TITLE: "新規ワールド作成",
    OPTIONS_TITLE: "オプション",
    ONLINE_MODE_TITLE: "オンラインモード",
    CREATE_ROOM_TITLE: "ルーム作成",
    JOIN_ROOM_TITLE: "ルーム参加",
    ENTER_CODE_LABEL: "コードを入力",
    ROOM_NAME_LABEL: "ルーム名",
    ROOM_CODE_LABEL: "ルームコード",
    SELECT_WORLD_LABEL: "ワールド選択",
    START_HOST_BTN: "ホスト開始",
    JOIN_BTN: "参加",
    BACK_BTN: "戻る",
    MODS: "Mods",
    FULLSCREEN: "フルスクリーン",
    QUIT: "終了",
  },
};

export interface Quest {
  id: number;
  reqItem: string | number;
  reqCount: number;
  rewardItem: string | number;
  rewardCount: number;
  descEN: string;
  descPT: string;
}

export const NPC_NAMES = [
  "Arthur", "Bob", "Charlie", "David", "Eve", "Frank", "Grace", "Heidi", "Ivan", "Judy",
  "Kevin", "Liam", "Mia", "Noah", "Olivia", "Peter", "Quinn", "Rachel", "Sam", "Tina"
];

export const QUESTS: Quest[] = [
  { id: 1, reqItem: 'iron_ingot', reqCount: 5, rewardItem: 'gold_ingot', rewardCount: 5, descEN: "Bring me 5 Iron Ingots.", descPT: "Traga-me 5 Barras de Ferro." },
  { id: 2, reqItem: 'diamond', reqCount: 1, rewardItem: 'emerald', rewardCount: 2, descEN: "Find 1 Diamond.", descPT: "Encontre 1 Diamante para mim." },
  { id: 3, reqItem: 'cooked_meat', reqCount: 5, rewardItem: 'health_potion', rewardCount: 2, descEN: "Bring 5 Cooked Meat.", descPT: "Estou com fome. Pegue 5 Carnes Assadas." },
  { id: 4, reqItem: 'zombie_meat', reqCount: 10, rewardItem: 'iron_sword', rewardCount: 1, descEN: "Bring 10 Zombie Meat.", descPT: "Resgate a vila! Mate zumbis e traga 10 Carnes de Zumbi." },
  { id: 5, reqItem: 'uranium', reqCount: 2, rewardItem: 'uranium_totem', rewardCount: 1, descEN: "Bring 2 Uranium.", descPT: "A missão final: traga 2 minérios de Urânio." }
];
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
  { result: { id: 'metal_structure', count: 1, type: ItemType.MATERIAL }, ingredients: [{ id: 'iron_ingot', count: 2 }, { id: 'copper_ingot', count: 1 }], station: BlockType.WEAPON_BENCH, category: 'COMPONENTS' },
  { result: { id: 'reinforced_structure', count: 1, type: ItemType.MATERIAL }, ingredients: [{ id: 'iron_ingot', count: 3 }, { id: 'diamond', count: 1 }], station: BlockType.WEAPON_BENCH, category: 'COMPONENTS' },
  { result: { id: 'grip', count: 1, type: ItemType.MATERIAL }, ingredients: [{ id: 'coal', count: 2 }, { id: 'iron_ingot', count: 1 }], station: BlockType.WEAPON_BENCH, category: 'COMPONENTS' },
  { result: { id: 'mechanical_mechanism', count: 1, type: ItemType.MATERIAL }, ingredients: [{ id: 'iron_ingot', count: 2 }, { id: 'gold_ingot', count: 1 }, { id: 'copper_ingot', count: 1 }], station: BlockType.WEAPON_BENCH, category: 'COMPONENTS' },
  { result: { id: 'ammo_chamber', count: 1, type: ItemType.MATERIAL }, ingredients: [{ id: 'iron_ingot', count: 2 }, { id: 'copper_ingot', count: 2 }], station: BlockType.WEAPON_BENCH, category: 'COMPONENTS' },
  { result: { id: 'simple_sight', count: 1, type: ItemType.MATERIAL }, ingredients: [{ id: 'iron_ingot', count: 1 }, { id: 'coal', count: 1 }], station: BlockType.WEAPON_BENCH, category: 'COMPONENTS' },
  { result: { id: 'advanced_sight', count: 1, type: ItemType.MATERIAL }, ingredients: [{ id: 'gold_ingot', count: 2 }, { id: 'diamond', count: 1 }], station: BlockType.WEAPON_BENCH, category: 'COMPONENTS' },
  { result: { id: 'energy_core', count: 1, type: ItemType.MATERIAL }, ingredients: [{ id: 'gold_ingot', count: 3 }, { id: 'diamond', count: 2 }, { id: 'coal', count: 5 }], station: BlockType.WEAPON_BENCH, category: 'COMPONENTS' },
  { result: { id: 'reinforced_tube', count: 1, type: ItemType.MATERIAL }, ingredients: [{ id: 'iron_ingot', count: 3 }, { id: 'copper_ingot', count: 2 }], station: BlockType.WEAPON_BENCH, category: 'COMPONENTS' },
  
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
  { result: { id: 'common_ammo', count: 30, type: ItemType.AMMO }, ingredients: [{ id: 'iron_ingot', count: 2 }, { id: 'coal', count: 1 }], station: BlockType.AMMO_BENCH, category: 'AMMO' },
  { result: { id: 'heavy_ammo', count: 20, type: ItemType.AMMO }, ingredients: [{ id: 'iron_ingot', count: 3 }, { id: 'copper_ingot', count: 1 }, { id: 'gold_ingot', count: 1 }], station: BlockType.AMMO_BENCH, category: 'AMMO' },
  { result: { id: 'piercing_ammo', count: 15, type: ItemType.AMMO }, ingredients: [{ id: 'gold_ingot', count: 2 }, { id: 'diamond', count: 3 }], station: BlockType.AMMO_BENCH, category: 'AMMO' },
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
ITEM_NAMES['EN'][BlockType.WALLPAPER] = 'Wallpaper';
ITEM_NAMES['EN'][BlockType.BR_KEY_BLOCK] = 'Key Block';
ITEM_NAMES['PT'][BlockType.BR_KEY_BLOCK] = 'Bloco Chave';
ITEM_NAMES['ES'][BlockType.BR_KEY_BLOCK] = 'Bloque Llave';
ITEM_NAMES['JA'][BlockType.BR_KEY_BLOCK] = '鍵ブロック';
ITEM_NAMES['EN']['br_key'] = 'Exit Key';
ITEM_NAMES['PT']['br_key'] = 'Chave da Saída';
ITEM_NAMES['ES']['br_key'] = 'Llave de Salida';
ITEM_NAMES['JA']['br_key'] = '出口の鍵';
ITEM_NAMES['PT'][BlockType.WALLPAPER] = 'Papel de Parede';
ITEM_NAMES['ES'][BlockType.WALLPAPER] = 'Papel pintado';
ITEM_NAMES['JA'][BlockType.WALLPAPER] = '壁紙';

ITEM_NAMES['EN'][BlockType.CUSHION] = 'Cushion Block';
ITEM_NAMES['PT'][BlockType.CUSHION] = 'Bloco Almofada';
ITEM_NAMES['ES'][BlockType.CUSHION] = 'Bloque Cojín';
ITEM_NAMES['JA'][BlockType.CUSHION] = 'クッションブロック';

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
    { result: { id: 'cz75', count: 1, type: ItemType.WEAPON }, ingredients: [{ id: 'metal_structure', count: 1 }, { id: 'grip', count: 1 }, { id: 'mechanical_mechanism', count: 1 }, { id: 'ammo_chamber', count: 1 }], station: BlockType.WEAPON_BENCH, category: 'SMALL_ARMS' },
    { result: { id: 'm1911', count: 1, type: ItemType.WEAPON }, ingredients: [{ id: 'reinforced_structure', count: 1 }, { id: 'grip', count: 1 }, { id: 'ammo_chamber', count: 1 }], station: BlockType.WEAPON_BENCH, category: 'SMALL_ARMS' },
    { result: { id: 'revolver_357', count: 1, type: ItemType.WEAPON }, ingredients: [{ id: 'reinforced_structure', count: 1 }, { id: 'grip', count: 1 }, { id: 'ammo_chamber', count: 2 }], station: BlockType.WEAPON_BENCH, category: 'SMALL_ARMS' },
    { result: { id: 'tec_9', count: 1, type: ItemType.WEAPON }, ingredients: [{ id: 'metal_structure', count: 1 }, { id: 'grip', count: 1 }, { id: 'mechanical_mechanism', count: 1 }, { id: 'ammo_chamber', count: 2 }], station: BlockType.WEAPON_BENCH, category: 'SMALL_ARMS' },
    
    { result: { id: 'm4a1', count: 1, type: ItemType.WEAPON }, ingredients: [{ id: 'reinforced_structure', count: 1 }, { id: 'reinforced_tube', count: 1 }, { id: 'ammo_chamber', count: 2 }, { id: 'advanced_sight', count: 1 }], station: BlockType.WEAPON_BENCH, category: 'LARGE_ARMS' },
    { result: { id: 'scar_h', count: 1, type: ItemType.WEAPON }, ingredients: [{ id: 'reinforced_structure', count: 2 }, { id: 'reinforced_tube', count: 1 }, { id: 'ammo_chamber', count: 2 }, { id: 'advanced_sight', count: 1 }], station: BlockType.WEAPON_BENCH, category: 'LARGE_ARMS' },
    { result: { id: 'famas', count: 1, type: ItemType.WEAPON }, ingredients: [{ id: 'reinforced_structure', count: 1 }, { id: 'reinforced_tube', count: 1 }, { id: 'ammo_chamber', count: 1 }, { id: 'advanced_sight', count: 1 }], station: BlockType.WEAPON_BENCH, category: 'LARGE_ARMS' },
    { result: { id: 'g36', count: 1, type: ItemType.WEAPON }, ingredients: [{ id: 'reinforced_structure', count: 1 }, { id: 'reinforced_tube', count: 1 }, { id: 'mechanical_mechanism', count: 1 }, { id: 'advanced_sight', count: 1 }], station: BlockType.WEAPON_BENCH, category: 'LARGE_ARMS' },
    { result: { id: 'aug', count: 1, type: ItemType.WEAPON }, ingredients: [{ id: 'reinforced_structure', count: 1 }, { id: 'reinforced_tube', count: 1 }, { id: 'ammo_chamber', count: 1 }, { id: 'advanced_sight', count: 1 }], station: BlockType.WEAPON_BENCH, category: 'LARGE_ARMS' },
    { result: { id: 'awp', count: 1, type: ItemType.WEAPON }, ingredients: [{ id: 'reinforced_structure', count: 2 }, { id: 'reinforced_tube', count: 2 }, { id: 'ammo_chamber', count: 2 }, { id: 'advanced_sight', count: 2 }], station: BlockType.WEAPON_BENCH, category: 'LARGE_ARMS' },
    { result: { id: 'barrett_m82', count: 1, type: ItemType.WEAPON }, ingredients: [{ id: 'reinforced_structure', count: 3 }, { id: 'reinforced_tube', count: 2 }, { id: 'ammo_chamber', count: 3 }, { id: 'advanced_sight', count: 2 }], station: BlockType.WEAPON_BENCH, category: 'LARGE_ARMS' },
    { result: { id: 'mp5', count: 1, type: ItemType.WEAPON }, ingredients: [{ id: 'metal_structure', count: 1 }, { id: 'reinforced_tube', count: 1 }, { id: 'mechanical_mechanism', count: 1 } ], station: BlockType.WEAPON_BENCH, category: 'LARGE_ARMS' },
    { result: { id: 'p90', count: 1, type: ItemType.WEAPON }, ingredients: [{ id: 'reinforced_structure', count: 1 }, { id: 'reinforced_tube', count: 1 }, { id: 'ammo_chamber', count: 2 }, { id: 'advanced_sight', count: 1 }], station: BlockType.WEAPON_BENCH, category: 'LARGE_ARMS' }
];

RECIPES.push(...weaponRecipes);

