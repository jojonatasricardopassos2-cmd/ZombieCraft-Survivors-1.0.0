
export enum BlockType {
  AIR = 0,
  DIRT = 1,
  GRASS = 2,
  STONE = 3,
  WOOD = 4,
  LEAVES = 5,
  PLANKS = 6,
  COAL_ORE = 7,
  IRON_ORE = 8,
  GOLD_ORE = 9,
  DIAMOND_ORE = 10,
  BEDROCK = 11,
  SAND = 12,
  CRAFTING_TABLE = 13,
  FURNACE = 14,
  TORCH = 15,
  CHEST = 16, // Small (20)
  BUSH = 17,
  WOOL = 18,
  BED = 19, // Basic Bed
  WATER = 20,
  COPPER_ORE = 21,
  GLASS = 22,
  CHEST_MEDIUM = 23, // 50 slots
  CHEST_LARGE = 24,   // 100 slots
  ROOF_WOOD = 25, // Right slope
  ROOF_STONE = 26, // Right slope
  WALL_WOOD = 27, // Background wall
  // UPGRADE_BENCH removed (ID 28 skipped)
  ROOF_WOOD_LEFT = 29, // Left slope
  ROOF_STONE_LEFT = 30, // Left slope
  DEEP_STONE = 31,
  TITANIUM_ORE = 32,
  DOOR_BOTTOM_CLOSED = 33,
  DOOR_TOP_CLOSED = 34,
  FARMLAND = 35,
  CROP_WHEAT = 36,
  CROP_CARROT = 37,
  CROP_POTATO = 38,
  DOOR_BOTTOM_OPEN = 39,
  DOOR_TOP_OPEN = 40,
  BERRY_BUSH = 41,
  SEED_BUSH = 42,
  BED_MEDIUM = 43,
  BED_ADVANCED = 44,
  DARK_GRASS = 45,
  DARK_WOOD = 46,
  DARK_LEAVES = 47,
  URANIUM_ORE = 48,
  STONE_CHEST = 49, // 50 Slots, for ores
  FLOWER_RED = 50,
  FLOWER_GREEN = 51,
  FLOWER_BLUE = 52,
  URANIUM_BLOCK = 53,
  TITANIUM_BLOCK = 54,
  ARMOR_BENCH = 55,
  LADDER = 56,
  CACTUS = 57,
  DRY_LEAVES = 58,
  GLASS_GREEN = 59,
  GLASS_BLUE = 60,
  SNOWY_GRASS = 61,
  SNOW_BLOCK = 62,
  ICE = 63,
  SNOWY_LEAVES = 64,
  SPIKE = 65,
  MOSS = 66,
  VINES = 67,
  COBWEB = 68,
  LAVA = 69,
  CABINET = 70,
  TABLE = 71,
  CAMPFIRE = 72,
  COPPER_BLOCK = 73,
  IRON_BLOCK = 74,
  GOLD_BLOCK = 75,
  DIAMOND_BLOCK = 76,
  DOOR_IRON_BOTTOM_CLOSED = 77,
  DOOR_IRON_TOP_CLOSED = 78,
  DOOR_IRON_BOTTOM_OPEN = 79,
  DOOR_IRON_TOP_OPEN = 80,
  DOOR_STONE_BOTTOM_CLOSED = 81,
  DOOR_STONE_TOP_CLOSED = 82,
  DOOR_STONE_BOTTOM_OPEN = 83,
  DOOR_STONE_TOP_OPEN = 84,
  MEDICAL_BENCH = 85,
  SCIENCE_BENCH = 86,
  CABLE = 87,
  BUTTON = 88,
  LEVER = 89,
  LAMP = 90,
  CABLE_ON = 91,
  BUTTON_ON = 92,
  LEVER_ON = 93,
  LAMP_ON = 94,
  APPLE_LEAVES = 95,
  SLAB_WOOD = 96,
  SLAB_STONE = 97,
  PINE_WOOD = 98,
  PINE_LEAVES = 99,
  FENCE = 100,
  CONCRETE = 101,
  CONCRETE_BLUE = 102,
  CONCRETE_GREEN = 103,
  CONCRETE_YELLOW = 104,
  FLOWER_YELLOW = 105,
  FLOWER_PURPLE = 106,
  GLASS_RED = 107,
  GLASS_YELLOW = 108,
  TALL_GRASS = 109,
  CONCRETE_RED = 200,
  CONCRETE_PURPLE = 201,
  WET_SAND = 202,
  COBBLESTONE = 203,
  FALLEN_LOG = 110,
  GOLDEN_WOOD = 111,
  GOLDEN_LEAVES = 112,
  GOLDEN_GRASS = 113,
  DARK_PLANKS = 114,
  GOLDEN_PLANKS = 115,
  FROZEN_WOOD = 116,
  GOLDEN_FLOWER = 117,
  GOLDEN_BUSH = 118
}

export enum ItemType {
  BLOCK = 'BLOCK',
  TOOL = 'TOOL',
  MATERIAL = 'MATERIAL',
  FOOD = 'FOOD',
  ARMOR = 'ARMOR',
  SHIELD = 'SHIELD'
}

export interface ItemStack {
  id: BlockType | string; 
  count: number;
  type: ItemType;
  meta?: { 
      damage?: number; 
      loyalty?: boolean;
      level?: number; // 0 to 3
  }; 
}

export interface Equipment {
    helmet: ItemStack | null;
    chestplate: ItemStack | null;
    leggings: ItemStack | null;
    boots: ItemStack | null;
    offHand: ItemStack | null; 
}

export interface Entity {
  id: number;
  type: 'PLAYER' | 'ZOMBIE' | 'PIG' | 'COW' | 'SHEEP' | 'DROP' | 'PROJECTILE' | 'MUTANT_ZOMBIE' | 'SCORPION' | 'CAMEL' | 'SNAKE' | 'RABBIT' | 'POLAR_BEAR' | 'DOG' | 'NPC' | 'ZOMBIE_RUNNER' | 'ZOMBIE_TANK' | 'ZOMBIE_EXPLOSIVE' | 'ZOMBIE_TOXIC' | 'ZOMBIE_SKELETON' | 'ZOMBIE_INFECTOR' | 'ZOMBIE_DARK' | 'ZOMBIE_FROZEN' | 'ZOMBIE_KING' | 'PLAGUE_KING' | 'BUSH_MOB' | 'SPIDER' | 'BLOOD_ZOMBIE' | 'BIRD' | 'CHICKEN' | 'GOLDEN_DEER' | 'LUNAR_FOX' | 'SHARK';
  x: number;
  y: number;
  width: number;
  height: number;
  vx: number;
  vy: number;
  grounded: boolean;
  health: number;
  maxHealth: number;
  facingRight: boolean;
  // For drops
  itemId?: BlockType | string;
  itemCount?: number;
  itemMeta?: { damage?: number, loyalty?: boolean, level?: number }; 
  creationTime?: number; 
  pickupDelay?: number;
  // For mobs
  attackCooldown?: number;
  lastDamageTime?: number; 
  // For Projectiles
  rotation?: number;
  projectileState?: 'FLYING' | 'STUCK' | 'RETURNING';
  ownerId?: number;
  loyalty?: boolean;
  returnTime?: number; // Time in ms before auto-return (Spear logic)
  // For Crops (stored as pseudo-entity logic or block meta logic)
  growTime?: number;
  // Multiplayer
  playerName?: string;
  // Visuals
  isParticle?: boolean;
  highestY?: number; // For fall damage tracking
  invincibilityEndTime?: number;
  // Taming
  isTamed?: boolean;
  tameProgress?: number;
  saddle?: boolean;
  riderId?: number;
  temper?: number;
  posture?: 'STAND' | 'CROUCH' | 'PRONE';
  isSitting?: boolean;
  isSleeping?: boolean;
  targetId?: number;
  name?: string;
  // For NPCs
  npcData?: {
      name: string;
      questId: number;
      completed: boolean;
  };
}

export type RecipeCategory = 'DECOR' | 'ITEMS' | 'COMBAT' | 'BASIC' | 'ARMOR';

export interface CraftingRecipe {
  result: { id: BlockType | string; count: number; type: ItemType };
  ingredients: { id: BlockType | string; count: number }[];
  station: BlockType | 'NONE'; 
  category: RecipeCategory;
}

export interface WorldData {
  width: number;
  height: number;
  blocks: number[]; 
  light: number[]; 
  weather?: {
    type: 'CLEAR' | 'RAIN' | 'HEAVY_RAIN' | 'SNOW';
    intensity: number;
    duration: number;
  };
  npcSpawns?: {x: number, y: number}[];
  initialChests?: {x: number, y: number, items: {id: number | string, count: number, type: 'BLOCK' | 'ITEM'}[]}[];
  structures?: {name: string, x: number}[];
}

export interface FurnaceData {
  input: ItemStack | null;
  fuel: ItemStack | null;
  output: ItemStack | null;
  burnTime: number; 
  maxBurnTime: number; 
  cookTime: number; 
}

export interface CropData {
    type: 'WHEAT' | 'CARROT' | 'POTATO';
    stage: number; // 0 to 3
    plantedTime: number;
}

export interface PlayerStats {
    strength: number;   
    reach: number;      
    vitality: number;   
    metabolism: number; 
    endurance: number;  
    agility: number;    
}

export interface SavedAccount {
  name: string;
  password?: string;
  skin?: {
    skinColor: string;
    hairColor: string;
    eyeColor: string;
    mustacheColor: string;
    clothes: string; // "1" to "10"
    pants: string; // "1" to "10"
    shoes: string; // "1" to "10"
    mouthType: string; // "none", "happy", "sad", "neutral"
    hasMustache: boolean;
    hairVariant: string; // "1" to "10"
  };
  friends?: string[];
}

export interface KeyBindings {
    up: string;
    down: string;
    left: string;
    right: string;
    jump: string;
    inventory: string;
    interact: string;
    sprint: string;
    crouch: string;
    drop: string;
    chat: string;
    attack: string;
    place: string;
}

export const DEFAULT_BINDINGS: KeyBindings = {
    up: 'KeyW',
    down: 'KeyS',
    left: 'KeyA',
    right: 'KeyD',
    jump: 'Space',
    inventory: 'KeyE',
    interact: 'KeyF',
    sprint: 'ShiftLeft',
    crouch: 'KeyC',
    drop: 'KeyQ',
    chat: 'KeyT',
    attack: 'MouseLeft',
    place: 'MouseRight'
};

export interface GameOptions {
    showCoordinates: boolean;
    showMinimap?: boolean;
    adminMode?: boolean;
    seasonsEnabled?: boolean;
    isMobile?: boolean; // Mobile controls toggle
    customCursor?: boolean;
    showTouchConfig?: boolean;
    autoUpdateMaps?: boolean;
    tutorialEnabled?: boolean;
    gameMode?: 'SURVIVAL' | 'GOD' | 'CREATIVE' | 'SPECTATOR';
    difficulty?: 'EASY' | 'NORMAL' | 'HARD';
    graphicsQuality?: 'UGLY' | 'NORMAL' | 'ULTRA';
    shaderLevel?: 1 | 2 | 3;
    textureQuality?: 'medium' | 'ultra';
    renderDistance?: number;
    volume?: number;
    bindings?: KeyBindings;
    mouseSensitivity?: number;
    gamepadSensitivity?: number;
    multiplayer?: {
        mode: 'HOST' | 'CLIENT';
        roomId: string;
        playerName: string;
    };
}

export interface SavedWorld {
    id: string; 
    name: string;
    seed: number;
    version?: number;
    worldData: WorldData;
    player: Entity;
    inventory: (ItemStack | null)[];
    equipment: Equipment;
    furnaces: [string, FurnaceData][]; 
    chests: [string, ItemStack[]][]; 
    crops?: [string, CropData][]; // New crop storage
    lastPlayed: number;
    time: number;
    totalDays?: number;
    // RPG Data
    xp: number;
    level: number;
    skillPoints: number;
    stats: PlayerStats;
    stamina: number;
    hunger: number;
    options?: GameOptions;
    achievements?: number[];
}
