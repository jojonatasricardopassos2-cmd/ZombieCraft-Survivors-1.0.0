
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { audio } from '../utils/audio.ts';
import { 
    BLOCK_SIZE, WORLD_HEIGHT, WORLD_WIDTH, GRAVITY, 
    PLAYER_SPEED, PLAYER_RUN_SPEED, JUMP_FORCE, BLOCK_COLORS, 
    REACH_DISTANCE, FULL_DAY_TICKS, DUSK_START, NIGHT_START, DAWN_START,
    COOKING_RECIPES, FUEL_VALUES, FOOD_VALUES, ITEM_COLORS, TERMINAL_VELOCITY, TRANSLATIONS, DAMAGE_VALUES, MAX_LIGHT, BLOCK_HARDNESS,
    ARMOR_PROTECTION, ITEM_NAMES, MAX_DURABILITY, XP_PER_MOB, DEFAULT_STATS, MAX_STAMINA, BASE_STAMINA_DRAIN, BASE_STAMINA_REGEN, HUNGER_DECAY_TICK, SPRINT_HUNGER_DRAIN, DEEP_SLATE_LEVEL, TICKS_PER_HOUR, SEA_LEVEL, INTERNAL_SURFACE_Y, NPC_NAMES, QUESTS
} from '../constants.ts';
import { BlockType, Entity, ItemStack, ItemType, WorldData, CraftingRecipe, FurnaceData, Equipment, SavedWorld, PlayerStats, CropData, GameOptions } from '../types.ts';
import { generateWorld, getBiome } from '../utils/world.ts';
import { saveWorldToDB, deleteWorldFromDB } from '../utils/storage.ts';
import { Inventory } from './UI/Inventory.tsx';
import { FurnaceUI } from './UI/FurnaceUI.tsx';
import { ChestUI } from './UI/ChestUI.tsx';
import { HammerBuildUI } from './UI/HammerBuildUI.tsx';
import { ArmorBenchUI } from './UI/ArmorBenchUI.tsx';
import { MainMenu } from './MainMenu.tsx';
import { AdminPanel } from './UI/AdminPanel.tsx';
import { SleepUI } from './UI/SleepUI.tsx';
import { NpcUI } from './UI/NpcUI.tsx';
import { MobileControls } from './UI/MobileControls.tsx';
import { ACHIEVEMENTS_LIST } from '../utils/achievementsList.ts';
import { AchievementsOverlay } from './UI/AchievementsOverlay.tsx';
import { FishingMinigame } from './UI/FishingMinigame.tsx';

function getMousePos(canvas: HTMLCanvasElement, evt: MouseEvent) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: evt.clientX - rect.left,
      y: evt.clientY - rect.top
    };
}

// Generate random IDs to avoid collision in MP
const generateEntityId = () => Math.floor(Math.random() * 1000000000);

// 1. Blocks that light passes through (Visual Transparency)
const LIGHT_TRANSPARENT_BLOCKS = new Set([
    BlockType.AIR, BlockType.GLASS, BlockType.WATER, BlockType.TORCH, BlockType.LAVA,
    BlockType.LEAVES, BlockType.DARK_LEAVES, BlockType.APPLE_LEAVES, BlockType.BUSH, BlockType.BERRY_BUSH, BlockType.SEED_BUSH, BlockType.COBWEB, BlockType.PINE_LEAVES, BlockType.FLOWER_YELLOW, BlockType.FLOWER_PURPLE,
    BlockType.ROOF_WOOD, BlockType.ROOF_STONE, BlockType.ROOF_WOOD_LEFT, BlockType.ROOF_STONE_LEFT,
    BlockType.WALL_WOOD, BlockType.DOOR_BOTTOM_OPEN, BlockType.DOOR_TOP_OPEN,
    BlockType.DOOR_IRON_BOTTOM_OPEN, BlockType.DOOR_IRON_TOP_OPEN, BlockType.DOOR_STONE_BOTTOM_OPEN, BlockType.DOOR_STONE_TOP_OPEN,
    BlockType.CROP_WHEAT, BlockType.CROP_CARROT, BlockType.CROP_POTATO,
    BlockType.BED, BlockType.BED_MEDIUM, BlockType.BED_ADVANCED,
    BlockType.FLOWER_RED, BlockType.FLOWER_GREEN, BlockType.FLOWER_BLUE,
    BlockType.CRAFTING_TABLE, BlockType.FURNACE, BlockType.ARMOR_BENCH,
    BlockType.TABLE, BlockType.CABINET, BlockType.CAMPFIRE,
    // Chests also let light pass usually in 2D to avoid dark spots behind them
    BlockType.CHEST, BlockType.CHEST_MEDIUM, BlockType.CHEST_LARGE, BlockType.STONE_CHEST 
]);

// 2. Blocks that entities can walk through (No Collision)
// NOTE: Glass is NOT here, so it has physics (solid). Chests ARE here, so they have no physics (intangible).
const NON_COLLIDABLE_BLOCKS = new Set([BlockType.FLOWER_RED, BlockType.FLOWER_BLUE, BlockType.FLOWER_GREEN, BlockType.FLOWER_YELLOW, BlockType.FLOWER_PURPLE, 
    BlockType.AIR, BlockType.WATER, BlockType.TORCH, BlockType.LAVA,
    BlockType.LEAVES, BlockType.DARK_LEAVES, BlockType.APPLE_LEAVES, BlockType.BUSH, BlockType.BERRY_BUSH, BlockType.SEED_BUSH,
    BlockType.ROOF_WOOD, BlockType.ROOF_STONE, BlockType.ROOF_WOOD_LEFT, BlockType.ROOF_STONE_LEFT,
    BlockType.WALL_WOOD, BlockType.PINE_WOOD, BlockType.DOOR_BOTTOM_OPEN, BlockType.DOOR_TOP_OPEN,
    BlockType.DOOR_IRON_BOTTOM_OPEN, BlockType.DOOR_IRON_TOP_OPEN, BlockType.DOOR_STONE_BOTTOM_OPEN, BlockType.DOOR_STONE_TOP_OPEN,
    BlockType.CROP_WHEAT, BlockType.CROP_CARROT, BlockType.CROP_POTATO,
    BlockType.BED, BlockType.BED_MEDIUM, BlockType.BED_ADVANCED,
    BlockType.FLOWER_RED, BlockType.FLOWER_GREEN, BlockType.FLOWER_BLUE,
    BlockType.CRAFTING_TABLE, BlockType.FURNACE, BlockType.ARMOR_BENCH,
    BlockType.TABLE, BlockType.CABINET, BlockType.CAMPFIRE,
    BlockType.CHEST, BlockType.CHEST_MEDIUM, BlockType.CHEST_LARGE, BlockType.STONE_CHEST,
    BlockType.LADDER, BlockType.MOSS, BlockType.VINES,
    BlockType.SCIENCE_BENCH, BlockType.MEDICAL_BENCH,
    BlockType.CABLE, BlockType.CABLE_ON, BlockType.LAMP, BlockType.LAMP_ON, BlockType.BUTTON, BlockType.BUTTON_ON, BlockType.LEVER, BlockType.LEVER_ON
]);

// Add LADDER to LIGHT_TRANSPARENT_BLOCKS as well (it's not defined in the snippet but usually is nearby or I should find it)
// Actually, LIGHT_TRANSPARENT_BLOCKS is not in the snippet I viewed (lines 50-650). 
// It was in the previous view (lines 800+? No, it was used in updateLighting).
// Let's just update NON_COLLIDABLE_BLOCKS for now.


interface Notification {
    id: number;
    message: string;
    timestamp: number;
}

export const GameCanvas: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const requestRef = useRef<number | null>(null);
    
    const [gameState, setGameState] = useState<'MENU' | 'PLAYING' | 'PAUSED'>('MENU');
    const [lang, setLang] = useState<'EN' | 'PT' | 'ES' | 'JA'>('EN');
    const t = TRANSLATIONS[lang];

    const worldRef = useRef<WorldData | null>(null);
    const playerRef = useRef<Entity>({
        id: generateEntityId(), type: 'PLAYER', x: 0, y: 0, width: 20, height: 56,
        vx: 0, vy: 0, grounded: false, health: 10, maxHealth: 10, facingRight: true,
        attackCooldown: 0, highestY: 0, invincibilityEndTime: 0, posture: 'STAND'
    });
    
    // Mechanics Refs
    const treePassRef = useRef<boolean>(false); // Allows walking through trees
    const eatingStartRef = useRef<number | null>(null); // Timestamp when eating started

    // Multiplayer Support
    // We add a 'lastSeen' property to track active players
    const otherPlayersRef = useRef<(Entity & { lastSeen?: number })[]>([]);
    const socketRef = useRef<Socket | null>(null);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    
    const [unlockedAchievements, setUnlockedAchievements] = useState<number[]>([]);
    const [recentAchievement, setRecentAchievement] = useState<{id: number, text: string, icon: string} | null>(null);
    const [showAchievementsUI, setShowAchievementsUI] = useState(false);
    const [isFishing, setIsFishing] = useState(false);

    const checkAchievement = useCallback((id: number) => {
        setUnlockedAchievements(prev => {
            if (prev.includes(id)) return prev;
            const ach = ACHIEVEMENTS_LIST.find(a => a.id === id);
            if (ach) {
                setRecentAchievement({id: ach.id, text: ach.title, icon: ach.icon});
                setTimeout(() => setRecentAchievement(null), 5000); // show toast for 5 seconds
            }
            return [...prev, id];
        });
    }, []);

    const handleFishingSuccess = useCallback(() => {
        setIsFishing(false);
        checkAchievement(19); // Pescador achievement
        const rewards = ['raw_fish', 'raw_fish', 'trash', 'trash', 'glass_bottle', 'bone', 'leather'];
        const r = rewards[Math.floor(Math.random() * rewards.length)];
        setInventory(prev => {
            const newInv = [...prev];
            for (let i = 0; i < 36; i++) {
                if (newInv[i] && newInv[i]!.id === r && newInv[i]!.count < 64) {
                    newInv[i]!.count++;
                    return newInv;
                }
            }
            for (let i = 0; i < 36; i++) {
                if (!newInv[i]) {
                    newInv[i] = { id: r, count: 1, type: r === 'raw_fish' ? ItemType.FOOD : ItemType.MATERIAL };
                    return newInv;
                }
            }
            return newInv;
        });
        setChatMessages(p => [...p, { msg: `Pescado: ${r}`, color: '#4CAF50' }]);
    }, [checkAchievement]);

    const handleFishingFail = useCallback(() => {
        setIsFishing(false);
        setChatMessages(p => [...p, { msg: 'O peixe escapou...', color: '#F44336' }]);
    }, []);
    const sprintRef = useRef<boolean>(false);
    const blockingRef = useRef<boolean>(false);
    const activePotionsRef = useRef<Record<string, number>>({});
    const oxygenRef = useRef<number>(100);
    const staminaRef = useRef<number>(MAX_STAMINA);
    const hungerRef = useRef<number>(10);

    const [playerLevel, setPlayerLevel] = useState(1);
    const [playerXP, setPlayerXP] = useState(0);
    const [skillPoints, setSkillPoints] = useState(0);
    const [playerStats, setPlayerStats] = useState<PlayerStats>(DEFAULT_STATS);
    const [options, setOptions] = useState<GameOptions>({ showCoordinates: false, adminMode: false, isMobile: false });
    const [temperatureState, setTemperatureState] = useState<'NORMAL' | 'HOT' | 'COLD'>('NORMAL');
    const temperatureRef = useRef<number>(50);

    const [isAdminMenuOpen, setIsAdminMenuOpen] = useState(false);
    const [adminFlags, setAdminFlags] = useState({ noClip: false, nightVision: false, showCreative: false, oneHitBreak: false, rainChance: 0.0001 });

    const keysRef = useRef<Record<string, boolean>>({});
    const mouseRef = useRef<{x: number, y: number, left: boolean, right: boolean}>({ x: 0, y: 0, left: false, right: false });
    const cameraRef = useRef({ x: 0, y: 0 });
    const entitiesRef = useRef<Entity[]>([]);
    const timeRef = useRef<number>(0); 
    const stepTimerRef = useRef<number>(0);
    const moonPhaseRef = useRef<'NORMAL' | 'FULL' | 'BLOOD'>('NORMAL');
    const cloudsRef = useRef<{x: number, y: number, speed: number, size: number, layer: number}[]>([]);
    const furnacesRef = useRef<Map<string, FurnaceData>>(new Map());
    const chestsRef = useRef<Map<string, ItemStack[]>>(new Map());
    const cropsRef = useRef<Map<string, CropData>>(new Map());
    const weatherParticlesRef = useRef<{x:number, y:number, vx:number, vy:number, type: 'RAIN' | 'SNOW'}[]>([]);
    const snowCoverRef = useRef<number>(0);

    const breakingRef = useRef<{ x: number, y: number, progress: number }>({ x: -1, y: -1, progress: 0 });
    const lastHungerDamageRef = useRef<number>(0);
    const lastRadiationDamageRef = useRef<number>(0);
    const lastPlacementTime = useRef<number>(0);
    
    const spearChargeStartRef = useRef<number | null>(null);
    const [activeBuildBlock, setActiveBuildBlock] = useState<BlockType | null>(null);
    const [isSleepUIOpen, setIsSleepUIOpen] = useState(false);
    const [activeBedType, setActiveBedType] = useState<BlockType | null>(null);
    const [activeNpc, setActiveNpc] = useState<Entity | null>(null);
    const [showDeathScreen, setShowDeathScreen] = useState(false);
    const [tutorialStep, setTutorialStep] = useState(0);
    
    const [interactionPrompt, setInteractionPrompt] = useState<{ msg: string, x: number, y: number } | null>(null);
    const isClimbingRef = useRef(false);

    const [currentWorldId, setCurrentWorldId] = useState<string>('');
    const [currentWorldName, setCurrentWorldName] = useState<string>('');
    const [currentSeed, setCurrentSeed] = useState<number>(0);

    const [inventory, setInventory] = useState<(ItemStack | null)[]>(() => Array(36).fill(null));
    const [cursorItem, setCursorItem] = useState<ItemStack | null>(null);
    const [selectedSlot, setSelectedSlot] = useState(0);
    const [isInventoryOpen, setIsInventoryOpen] = useState(false);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [chatInput, setChatInput] = useState("");
    const [chatMessages, setChatMessages] = useState<{msg: string, color?: string}[]>([]);

    useEffect(() => {
        if (chatMessages.length > 0) {
            const timer = setTimeout(() => {
                setChatMessages(prev => prev.slice(1));
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [chatMessages]);
    
    // Cheat states
    const [cheatTimeMultiplier, setCheatTimeMultiplier] = useState(1); // 0, 1, -1, 2
    const [isNoclip, setIsNoclip] = useState(false);

    const [isFurnaceOpen, setIsFurnaceOpen] = useState(false);
    const [isChestOpen, setIsChestOpen] = useState(false);
    const [isHammerMenuOpen, setIsHammerMenuOpen] = useState(false);
    const [isArmorBenchOpen, setIsArmorBenchOpen] = useState(false);
    
    const [activeFurnacePos, setActiveFurnacePos] = useState<string | null>(null);
    const [activeChestPos, setActiveChestPos] = useState<string | null>(null);
    const [activeChestSize, setActiveChestSize] = useState<number>(20);

    const [uiMousePos, setUiMousePos] = useState({ x: 0, y: 0 });
    const [equipment, setEquipment] = useState<Equipment>({ helmet: null, chestplate: null, leggings: null, boots: null, offHand: null });
    
    const [hearts, setHearts] = useState(10);
    const [hunger, setHunger] = useState(10);
    const [stamina, setStamina] = useState(MAX_STAMINA);
    const [nearbyStation, setNearbyStation] = useState<BlockType | 'NONE'>('NONE');
    const [uiTick, setUiTick] = useState(0);

    const addNotification = (msg: string) => {
        const id = Date.now() + Math.random();
        setNotifications(prev => [...prev, { id, message: msg, timestamp: Date.now() }]);
        setTimeout(() => {
            setNotifications(prev => prev.filter(n => n.id !== id));
        }, 5000);
    };

    // --- BROADCAST HELPER ---
    const broadcast = (type: string, payload: any) => {
        if (socketRef.current && options.multiplayer) {
            socketRef.current.emit('game-event', { type, roomId: options.multiplayer.roomId, payload });
        }
    };

    // --- HELPER FUNCTIONS ---

    const canDamageBlock = (block: BlockType, tool: ItemStack | null): boolean => {
        const handBreakable = new Set([
            BlockType.AIR, BlockType.WATER,
            BlockType.DIRT, BlockType.GRASS, BlockType.DARK_GRASS, BlockType.SAND,
            BlockType.LEAVES, BlockType.DARK_LEAVES, BlockType.APPLE_LEAVES,
            BlockType.BUSH, BlockType.BERRY_BUSH, BlockType.SEED_BUSH,
            BlockType.FLOWER_RED, BlockType.FLOWER_GREEN, BlockType.FLOWER_BLUE,
            BlockType.CROP_WHEAT, BlockType.CROP_CARROT, BlockType.CROP_POTATO,
            BlockType.TORCH
        ]);

        if (handBreakable.has(block)) return true;
        if (!tool) return false;

        const id = (tool.id?.toString() || '');
        const woodTypes = new Set([
            BlockType.WOOD, BlockType.DARK_WOOD, BlockType.PLANKS,
            BlockType.DOOR_BOTTOM_CLOSED, BlockType.DOOR_TOP_CLOSED,
            BlockType.DOOR_BOTTOM_OPEN, BlockType.DOOR_TOP_OPEN,
            BlockType.CRAFTING_TABLE, BlockType.CHEST, BlockType.CHEST_MEDIUM, 
            BlockType.CHEST_LARGE, BlockType.BED, BlockType.BED_MEDIUM, BlockType.BED_ADVANCED,
            BlockType.ROOF_WOOD, BlockType.ROOF_WOOD_LEFT, BlockType.WALL_WOOD, BlockType.PINE_WOOD,
            BlockType.ARMOR_BENCH
        ]);

        if (woodTypes.has(block)) return id.includes('axe');
        return id.includes('pickaxe');
    };

    const updateLighting = (world: WorldData, time: number) => {
        // Optimizing to only update visible area + 100 blocks buffer
        const pbx = Math.floor(playerRef.current.x / BLOCK_SIZE);
        const pby = Math.floor(playerRef.current.y / BLOCK_SIZE);
        const startX = Math.max(0, pbx - 150);
        const endX = Math.min(WORLD_WIDTH - 1, pbx + 150);
        
        // Use existing light array if we have it, else create new
        if (!world.light || world.light.length !== WORLD_WIDTH * WORLD_HEIGHT) {
             world.light = new Array(WORLD_WIDTH * WORLD_HEIGHT).fill(MAX_LIGHT);
        }
        
        const queue = new Int32Array((endX - startX + 1) * WORLD_HEIGHT * 2);
        let head = 0;
        let tail = 0;
        let skyLight = MAX_LIGHT; 
        
        if (time >= DUSK_START && time < NIGHT_START) {
            skyLight = 8;
        } else if (time >= NIGHT_START) {
            skyLight = 5;
        }
        
        for (let x = startX; x <= endX; x++) {
            let currentLight = skyLight;
            for (let y = 0; y < WORLD_HEIGHT; y++) {
                const idx = y * WORLD_WIDTH + x;
                const block = world.blocks[idx];
                const isTransparent = LIGHT_TRANSPARENT_BLOCKS.has(block);
                
                if (isTransparent) {
                    world.light[idx] = currentLight;
                    if (block === BlockType.LEAVES || block === BlockType.APPLE_LEAVES || block === BlockType.DARK_LEAVES || block === BlockType.WATER || block === BlockType.ROOF_WOOD || block === BlockType.ROOF_STONE || block === BlockType.ROOF_WOOD_LEFT || block === BlockType.ROOF_STONE_LEFT) currentLight = Math.max(0, currentLight - 3); 
                    if (currentLight > 1) { queue[tail++] = idx; }
                } else {
                    world.light[idx] = currentLight;
                    currentLight = 0; 
                }
            }
        }
        
        for (let x = startX; x <= endX; x++) {
            for (let y = 0; y < WORLD_HEIGHT; y++) {
                const i = y * WORLD_WIDTH + x;
                const b = world.blocks[i];
                if (b === BlockType.TORCH || b === BlockType.LAMP_ON) { world.light[i] = 15; queue[tail++] = i; }
                else if (b === BlockType.URANIUM_ORE) { world.light[i] = 12; queue[tail++] = i; }
                else if (b === BlockType.URANIUM_BLOCK) { world.light[i] = 14; queue[tail++] = i; }
                else if (b === BlockType.LAVA || b === BlockType.CAMPFIRE) { world.light[i] = 13; queue[tail++] = i; }
            }
        }
        
        while (head < tail) {
            const idx = queue[head++];
            const level = world.light[idx];
            if (level <= 1) continue;
            const x = idx % WORLD_WIDTH;
            const neighbors = [idx + 1, idx - 1, idx + WORLD_WIDTH, idx - WORLD_WIDTH];
            if (x === WORLD_WIDTH - 1) neighbors[0] = -1; 
            if (x === 0) neighbors[1] = -1;
            for (const nIdx of neighbors) {
                if (nIdx >= 0 && nIdx < world.light.length) {
                    const nx = nIdx % WORLD_WIDTH;
                    if (nx < startX || nx > endX) continue; // clamp to computed area
                    if (world.light[nIdx] < level - 1) {
                         world.light[nIdx] = level - 1;
                         if (LIGHT_TRANSPARENT_BLOCKS.has(world.blocks[nIdx])) { queue[tail++] = nIdx; }
                    }
                }
            }
        }
    };

    const updateFluids = (world: WorldData) => {
        const pbx = Math.floor(playerRef.current.x / BLOCK_SIZE);
        const pby = Math.floor(playerRef.current.y / BLOCK_SIZE);
        const marginX = 40;
        const marginY = 40;
        
        const startX = Math.max(0, pbx - marginX);
        const endX = Math.min(WORLD_WIDTH - 1, pbx + marginX);
        const startY = Math.max(0, pby - marginY);
        const endY = Math.min(WORLD_HEIGHT - 1, pby + marginY);

        let dirty = false;
        
        for (let y = endY; y >= startY; y--) {
            const dir = Math.random() < 0.5 ? 1 : -1;
            const xs = dir === 1 ? startX : endX;
            const xe = dir === 1 ? endX : startX;
            const xStep = dir;

            for (let x = xs; x !== xe + xStep; x += xStep) {
                const idx = y * WORLD_WIDTH + x;
                const b = world.blocks[idx];
                
                if (b === BlockType.WATER || b === BlockType.LAVA) {
                    if (y < WORLD_HEIGHT - 1) {
                        const downIdx = (y + 1) * WORLD_WIDTH + x;
                        const blockDown = world.blocks[downIdx];
                        
                        if (blockDown === BlockType.AIR || blockDown === BlockType.TORCH || blockDown === BlockType.CROP_WHEAT || blockDown === BlockType.CROP_CARROT || blockDown === BlockType.CROP_POTATO || blockDown === BlockType.MOSS || blockDown === BlockType.SPIKE || blockDown === BlockType.COBWEB) {
                            world.blocks[downIdx] = b;
                            world.blocks[idx] = BlockType.AIR;
                            dirty = true;
                            continue;
                        }
                    }
                    
                    const spreadRate = b === BlockType.LAVA ? 0.3 : 0.8;
                    if (Math.random() < spreadRate) {
                        let flowLeft = false;
                        if (x > 0) {
                            const lIdx = y * WORLD_WIDTH + (x - 1);
                            if (world.blocks[lIdx] === BlockType.AIR) {
                                world.blocks[lIdx] = b;
                                world.blocks[idx] = BlockType.AIR;
                                dirty = true;
                                flowLeft = true;
                            }
                        }
                        if (!flowLeft && x < WORLD_WIDTH - 1) {
                            const rIdx = y * WORLD_WIDTH + (x + 1);
                            if (world.blocks[rIdx] === BlockType.AIR) {
                                world.blocks[rIdx] = b;
                                world.blocks[idx] = BlockType.AIR;
                                dirty = true;
                            }
                        }
                    }
                    
                    if (b === BlockType.LAVA && Math.random() < 0.05) {
                        const neighbors = [
                            y > 0 ? idx - WORLD_WIDTH : -1,
                            y < WORLD_HEIGHT - 1 ? idx + WORLD_WIDTH : -1,
                            x > 0 ? idx - 1 : -1,
                            x < WORLD_WIDTH - 1 ? idx + 1 : -1
                        ];
                        for (let n of neighbors) {
                            if (n >= 0) {
                                const nb = world.blocks[n];
                                if (nb === BlockType.PLANKS || nb === BlockType.WOOD || nb === BlockType.DARK_WOOD || nb === BlockType.LEAVES || nb === BlockType.APPLE_LEAVES || nb === BlockType.CABINET || nb === BlockType.TABLE || nb === BlockType.WALL_WOOD || nb === BlockType.ROOF_WOOD) {
                                    world.blocks[n] = BlockType.AIR;
                                    dirty = true;
                                }
                            }
                        }
                    }
                }
            }
        }
        if (dirty) updateLighting(world, timeRef.current);
    };

    const updateRedstone = (world: WorldData) => {
        let changed = false;
        
        const pbx = Math.floor(playerRef.current.x / BLOCK_SIZE);
        const pby = Math.floor(playerRef.current.y / BLOCK_SIZE);
        const startX = Math.max(0, pbx - 150);
        const endX = Math.min(WORLD_WIDTH - 1, pbx + 150);

        for (let x = startX; x <= endX; x++) {
            for (let y = 0; y < WORLD_HEIGHT; y++) {
                const i = y * WORLD_WIDTH + x;
                const b = world.blocks[i];
                if (b === BlockType.CABLE_ON) { world.blocks[i] = BlockType.CABLE; changed = true; }
                else if (b === BlockType.LAMP_ON) { world.blocks[i] = BlockType.LAMP; changed = true; }
                else if (b === BlockType.DOOR_IRON_BOTTOM_OPEN) {
                    world.blocks[i] = BlockType.DOOR_IRON_BOTTOM_CLOSED;
                    if (y > 0 && world.blocks[i - WORLD_WIDTH] === BlockType.DOOR_IRON_TOP_OPEN) {
                        world.blocks[i - WORLD_WIDTH] = BlockType.DOOR_IRON_TOP_CLOSED;
                    }
                    changed = true;
                }
            }
        }
        
        const queue: {idx: number, dist: number}[] = [];
        for (let x = startX; x <= endX; x++) {
            for (let y = 0; y < WORLD_HEIGHT; y++) {
                const i = y * WORLD_WIDTH + x;
                if (world.blocks[i] === BlockType.LEVER_ON || world.blocks[i] === BlockType.BUTTON_ON) queue.push({idx: i, dist: 0});
            }
        }
        let qIdx = 0;
        while(qIdx < queue.length) {
            const curr = queue[qIdx++];
            if (curr.dist > 15) continue;
            const adj = [ curr.idx - 1, curr.idx + 1, curr.idx - WORLD_WIDTH, curr.idx + WORLD_WIDTH ];
            for (const next of adj) {
                if (next < 0 || next >= world.blocks.length) continue;
                if (Math.abs((curr.idx % WORLD_WIDTH) - (next % WORLD_WIDTH)) > 1) continue;
                const b = world.blocks[next];
                if (b === BlockType.CABLE) {
                    world.blocks[next] = BlockType.CABLE_ON;
                    changed = true;
                    queue.push({idx: next, dist: curr.dist + 1});
                } else if (b === BlockType.LAMP) {
                    world.blocks[next] = BlockType.LAMP_ON;
                    changed = true;
                    queue.push({idx: next, dist: curr.dist + 1});
                } else if (b === BlockType.DOOR_IRON_BOTTOM_CLOSED) {
                    world.blocks[next] = BlockType.DOOR_IRON_BOTTOM_OPEN;
                    if (next >= WORLD_WIDTH && world.blocks[next - WORLD_WIDTH] === BlockType.DOOR_IRON_TOP_CLOSED) {
                        world.blocks[next - WORLD_WIDTH] = BlockType.DOOR_IRON_TOP_OPEN;
                    }
                    changed = true;
                } else if (b === BlockType.DOOR_IRON_TOP_CLOSED) {
                    world.blocks[next] = BlockType.DOOR_IRON_TOP_OPEN;
                    if (next + WORLD_WIDTH < world.blocks.length && world.blocks[next + WORLD_WIDTH] === BlockType.DOOR_IRON_BOTTOM_CLOSED) {
                        world.blocks[next + WORLD_WIDTH] = BlockType.DOOR_IRON_BOTTOM_OPEN;
                    }
                    changed = true;
                }
            }
        }
        return changed;
    };

    const setBlockAt = (x: number, y: number, type: BlockType, shouldBroadcast: boolean = true) => {
        if (!worldRef.current) return;
        if (x < 0 || x >= WORLD_WIDTH || y < 0 || y >= WORLD_HEIGHT) return;
        
        // Don't update if block is same
        if (worldRef.current.blocks[y * WORLD_WIDTH + x] === type) return;

        worldRef.current.blocks[y * WORLD_WIDTH + x] = type;
        
        updateRedstone(worldRef.current);
        updateLighting(worldRef.current, timeRef.current);
        
        if (shouldBroadcast) {
            broadcast('BLOCK_UPDATE', { x, y, type });
        }
    };

    const checkCollision = (ent: Entity, world: WorldData): boolean => {
        const startX = Math.floor(ent.x / BLOCK_SIZE);
        const endX = Math.floor((ent.x + ent.width) / BLOCK_SIZE);
        const startY = Math.floor(ent.y / BLOCK_SIZE);
        const endY = Math.floor((ent.y + ent.height) / BLOCK_SIZE);

        for(let y=startY; y<=endY; y++) {
            for(let x=startX; x<=endX; x++) {
                if (x < 0 || x >= WORLD_WIDTH || y < 0 || y >= WORLD_HEIGHT) continue;
                const b = world.blocks[y*WORLD_WIDTH+x];
                
                // --- TREE/CACTUS PASS-THROUGH LOGIC ---
                if (ent.type === 'PLAYER') {
                    if (treePassRef.current && (b === BlockType.WOOD || b === BlockType.DARK_WOOD)) {
                        continue; // Treat as non-collidable (Air)
                    }
                    if (keysRef.current['KeyS'] && b === BlockType.CACTUS) {
                        continue; // Pass through cactus with 'S'
                    }
                }

                // CACTUS DAMAGE LOGIC
                if (b === BlockType.CACTUS) {
                    // Damage all mobs and player
                    if (ent.type !== 'DROP' && ent.type !== 'PROJECTILE') {
                        if (ent.type === 'PLAYER') {
                            if (!['GOD', 'CREATIVE', 'SPECTATOR'].includes(options.gameMode || 'SURVIVAL') && (ent.invincibilityEndTime || 0) < Date.now()) {
                                ent.health -= 1.5;
                                ent.invincibilityEndTime = Date.now() + 500; 
                                setHearts(ent.health);
                                addNotification(lang === 'PT' ? "Ai! Cacto machuca!" : "Ouch! Cactus hurts!");
                                if (ent.health <= 0) { ent.health = 0; setHearts(0); }
                            }
                        } else {
                            // Mobs
                            if ((ent.lastDamageTime || 0) < Date.now() - 500) {
                                ent.health -= 1.5;
                                ent.lastDamageTime = Date.now();
                            }
                        }
                    }
                }

                if (!NON_COLLIDABLE_BLOCKS.has(b)) {
                    if (b === BlockType.FENCE) {
                        const fenceTop = y * BLOCK_SIZE - (BLOCK_SIZE * 0.5); // 1.5 blocks tall
                        if (ent.y + ent.height > y * BLOCK_SIZE && ent.y < y * BLOCK_SIZE + BLOCK_SIZE && ent.y + ent.height > fenceTop) {
                            return true;
                        }
                    } else if (b === BlockType.SLAB_WOOD || b === BlockType.SLAB_STONE) {
                        const blockTopHalfEnd = y * BLOCK_SIZE + 16;
                        if (ent.y + ent.height > blockTopHalfEnd && ent.y < y * BLOCK_SIZE + 32) {
                            return true;
                        }
                    } else {
                        return true;
                    }
                }
            }
        }
        return false;
    };

    const spawnMob = (type: Entity['type'], x?: number, y?: number) => {
        if (!worldRef.current) return;
        
        // MULTIPLAYER: Only Host spawns mobs
        if (options.multiplayer?.mode === 'CLIENT') return;

        let spawnX = 0;
        let spawnY = 0;
        
        if (x !== undefined && y !== undefined) {
            spawnX = Math.floor(x / BLOCK_SIZE);
            spawnY = y;
        } else {
            let attempts = 0;
            const pX = Math.floor(playerRef.current.x / BLOCK_SIZE);
            
            while(attempts < 10) {
                 const dist = 20 + Math.floor(Math.random() * 20);
                 const dir = Math.random() < 0.5 ? 1 : -1;
                 spawnX = Math.max(0, Math.min(WORLD_WIDTH - 1, pX + (dist * dir)));
                 
                 // BIOME RESTRICTIONS
                 const biome = getBiome(spawnX, currentSeed);
                 const isDesert = biome === 'desert';
                 const isSnow = biome === 'snow';
                 const isForest = biome === 'forest';

                 if (isDesert) {
                     // Desert: Only Camel, Scorpion, Snake, Rabbit
                     if (type === 'COW' || type === 'PIG' || type === 'SHEEP' || type.toString().includes('ZOMBIE') || type === 'POLAR_BEAR' || type === 'DOG') {
                         attempts++; continue;
                     }
                 } else if (isSnow) {
                     // Snow: Polar Bear, Rabbit, Zombie, Zombie Frozen
                     if (type === 'CAMEL' || type === 'SCORPION' || type === 'SNAKE' || type === 'COW' || type === 'PIG' || type === 'SHEEP' || type === 'DOG') {
                         attempts++; continue;
                     }
                 } else {
                     // Non-Desert, Non-Snow (Plains/Forest)
                     if (type === 'CAMEL' || type === 'SCORPION' || type === 'SNAKE' || type === 'POLAR_BEAR' || type === 'ZOMBIE_FROZEN') {
                         attempts++; continue;
                     }
                     // Dog mostly in forest
                     if (type === 'DOG' && !isForest && Math.random() > 0.2) {
                         attempts++; continue;
                     }
                 }
                 
                 let foundValidY = false;
                 for(let y=0; y<WORLD_HEIGHT; y++) {
                     const b = worldRef.current.blocks[y * WORLD_WIDTH + spawnX];
                     if (b !== BlockType.AIR) {
                         // found the surface block
                         const blockAbove = y > 0 ? worldRef.current.blocks[(y - 1) * WORLD_WIDTH + spawnX] : BlockType.AIR;
                         
                         if (blockAbove !== BlockType.AIR) {
                             break; // blocked above, try another column
                         }
                         
                         let validBlock = false;
                         if (type === 'DOG') {
                             if (b === BlockType.DARK_GRASS) validBlock = true;
                         } else if (type === 'COW' || type === 'PIG' || type === 'SHEEP') {
                             if (b === BlockType.GRASS || b === BlockType.DARK_GRASS) validBlock = true;
                         } else if (type === 'RABBIT' || type === 'CAMEL' || type === 'SCORPION' || type === 'SNAKE') {
                             if (b === BlockType.SAND) validBlock = true;
                         } else {
                             validBlock = true; // Zombies etc
                         }
                         
                         if (validBlock) {
                             spawnY = (y - 3) * BLOCK_SIZE;
                             foundValidY = true;
                         }
                         break;
                     }
                 }
                 if (foundValidY) break;
                 attempts++;
            }
        }
        
        if (spawnY > 0 || (x !== undefined && y !== undefined)) {
             const getWidth = (t: string) => t === 'PIG' ? 28 : t === 'COW' ? 32 : t === 'SHEEP' ? 30 : t === 'SCORPION' ? 24 : t === 'CAMEL' ? 50 : t === 'SNAKE' ? 20 : t === 'RABBIT' ? 16 : t === 'POLAR_BEAR' ? 40 : t === 'DOG' ? 20 : t === 'ZOMBIE_TANK' ? 30 : t === 'ZOMBIE_KING' ? 28 : 20;
             const getHeight = (t: string) => t.includes('ZOMBIE') ? (t === 'ZOMBIE_TANK' ? 64 : t === 'ZOMBIE_KING' ? 64 : 56) : t === 'COW' ? 24 : t === 'SCORPION' ? 16 : t === 'CAMEL' ? 45 : t === 'SNAKE' ? 10 : t === 'RABBIT' ? 16 : t === 'POLAR_BEAR' ? 30 : t === 'DOG' ? 16 : 20;
             const getHealth = (t: string) => t === 'ZOMBIE' ? 20 : t === 'ZOMBIE_RUNNER' ? 10 : t === 'ZOMBIE_TANK' ? 100 : t === 'ZOMBIE_EXPLOSIVE' ? 10 : t === 'ZOMBIE_TOXIC' ? 20 : t === 'ZOMBIE_SKELETON' ? 10 : t === 'ZOMBIE_INFECTOR' ? 20 : t === 'ZOMBIE_DARK' ? 25 : t === 'ZOMBIE_FROZEN' ? 20 : t === 'ZOMBIE_KING' ? 150 : t === 'SCORPION' ? 15 : t === 'CAMEL' ? 40 : t === 'SNAKE' ? 10 : t === 'RABBIT' ? 6 : t === 'POLAR_BEAR' ? 30 : t === 'DOG' ? 15 : 10;

             const mob: Entity = {
                 id: generateEntityId(),
                 type,
                 x: spawnX * BLOCK_SIZE,
                 y: spawnY,
                 width: getWidth(type),
                 height: getHeight(type),
                 vx: 0, vy: 0, grounded: false,
                 health: getHealth(type),
                 maxHealth: getHealth(type),
                 facingRight: true,
                 attackCooldown: 0,
                 isTamed: false,
                 tameProgress: 0,
                 temper: 0,
                 isSleeping: type === 'POLAR_BEAR' // Polar bear starts sleeping if spawned during day? We'll handle in AI.
             };
             entitiesRef.current.push(mob);
             // Note: In Host mode, the periodic SYNC_ENTITIES broadcast will send this to clients
        }
    };
    
    const spawnBoss = (x: number, y: number) => {
        // MULTIPLAYER: Only Host spawns boss
        if (options.multiplayer?.mode === 'CLIENT') return;

        entitiesRef.current.push({
            id: generateEntityId(),
            type: 'PLAGUE_KING',
            x: x,
            y: y,
            width: 40,
            height: 80,
            vx: 0, vy: 0, grounded: false,
            health: 1000,
            maxHealth: 1000,
            facingRight: true,
            attackCooldown: 0
        });
    }

    const spawnDrop = (x: number, y: number, itemId: BlockType | string, count: number, meta?: any, shouldBroadcast: boolean = true) => {
        const id = generateEntityId();
        const drop: Entity = {
            id,
            type: 'DROP',
            x, y, width: 12, height: 12, vx: (Math.random() - 0.5) * 4, vy: -3,
            grounded: false, health: 1, maxHealth: 1, facingRight: true,
            itemId, itemCount: count, itemMeta: meta, creationTime: Date.now()
        };
        
        // Add to local list immediately for visual feedback
        if(!entitiesRef.current.find(e => e.id === id)) {
            entitiesRef.current.push(drop);
        }
        
        if (shouldBroadcast) {
            broadcast('SPAWN_DROP', { ...drop });
        }
    };

    const getBreakSpeed = (block: BlockType, tool: ItemStack | null): number => {
        let speed = 1;
        if (!tool) return 1;
        const id = (tool.id?.toString() || '');
        let multiplier = 1;
        if (id.includes('wood')) multiplier = 2;
        if (id.includes('stone')) multiplier = 4;
        if (id.includes('iron')) multiplier = 12; // Much faster than stone, slower than diamond
        if (id.includes('gold')) multiplier = 20; // Gold is fast but fragile
        if (id.includes('diamond')) multiplier = 25; // Faster than iron
        if (id.includes('titanium')) multiplier = 40; // Very fast
        if (id.includes('uranium')) multiplier = 60; // Extremely fast

        const isPickaxe = id.includes('pickaxe');
        const isAxe = id.includes('axe');
        const isShovel = id.includes('shovel');
        
        const isStone = block === BlockType.STONE || block === BlockType.DEEP_STONE || block === BlockType.COAL_ORE || block === BlockType.IRON_ORE || block === BlockType.COPPER_ORE || block === BlockType.GOLD_ORE || block === BlockType.DIAMOND_ORE || block === BlockType.TITANIUM_ORE || block === BlockType.URANIUM_ORE || block === BlockType.FURNACE || block === BlockType.STONE_CHEST || block === BlockType.ROOF_STONE || block === BlockType.ROOF_STONE_LEFT; 
        const isWood = block === BlockType.WOOD || block === BlockType.DARK_WOOD || block === BlockType.PLANKS || block === BlockType.DOOR_BOTTOM_CLOSED || block === BlockType.DOOR_TOP_CLOSED || block === BlockType.DOOR_BOTTOM_OPEN || block === BlockType.DOOR_TOP_OPEN || block === BlockType.CRAFTING_TABLE || block === BlockType.CHEST || block === BlockType.CHEST_MEDIUM || block === BlockType.CHEST_LARGE || block === BlockType.ROOF_WOOD || block === BlockType.ROOF_WOOD_LEFT || block === BlockType.WALL_WOOD;
        const isDirt = block === BlockType.DIRT || block === BlockType.GRASS || block === BlockType.DARK_GRASS || block === BlockType.FARMLAND || block === BlockType.SAND;
        
        if (isPickaxe && isStone) speed *= multiplier;
        if (isAxe && isWood) speed *= multiplier;
        if (isShovel && isDirt) speed *= multiplier;
        
        speed += playerStats.strength * 0.5;
        return speed;
    };
    
    const canHarvest = (block: BlockType, tool: ItemStack | null): boolean => {
        if (block === BlockType.BEDROCK) return false;
        if (block === BlockType.DIAMOND_ORE || block === BlockType.GOLD_ORE || block === BlockType.TITANIUM_ORE) {
             if (!tool) return false;
             const id = (tool.id?.toString() || '');
             if (id.includes('wood') || id.includes('stone')) return false; 
        }
        if (block === BlockType.URANIUM_BLOCK || block === BlockType.TITANIUM_BLOCK) {
            if (!tool) return false;
            const id = (tool.id?.toString() || '');
            if (!id.includes('pickaxe') || id.includes('wood') || id.includes('stone') || id.includes('iron')) return false;
        }
        return true;
    };

    const damageTool = (slotIndex: number) => {
        setInventory(prev => {
            const item = prev[slotIndex];
            if (!item || item.type !== ItemType.TOOL) return prev;
            
            let mat = '';
            const id = (item.id?.toString() || '');
            if (id.includes('wood') || id.includes('basic')) mat = 'wood';
            else if (id.includes('stone')) mat = 'stone';
            else if (id.includes('iron')) mat = 'iron';
            else if (id.includes('gold')) mat = 'gold';
            else if (id.includes('diamond')) mat = 'diamond';
            else if (id.includes('titanium')) mat = 'titanium';
            else if (id.includes('copper')) mat = 'copper';
            else if (id.includes('uranium')) mat = 'uranium';
            
            const max = MAX_DURABILITY[mat];
            if (!max) return prev;
            
            const newMeta = { ...item.meta, damage: (item.meta?.damage || 0) + 1 };
            if (newMeta.damage >= max) {
                const n = [...prev];
                n[slotIndex] = null;
                return n;
            } else {
                const n = [...prev];
                n[slotIndex] = { ...item, meta: newMeta };
                return n;
            }
        });
    };
    
    const damageOffhand = () => {
         if (equipment.offHand && equipment.offHand.type === ItemType.SHIELD) {
             const item = equipment.offHand;
             let mat = 'wood'; 
             if ((item.id?.toString() || '').includes('iron')) mat = 'iron';
             const max = MAX_DURABILITY[mat] || 100;
             const newMeta = { ...item.meta, damage: (item.meta?.damage || 0) + 1 };
             if (newMeta.damage >= max) {
                 setEquipment(prev => ({ ...prev, offHand: null }));
             } else {
                 setEquipment(prev => ({ ...prev, offHand: { ...item, meta: newMeta } }));
             }
         }
    };

    const handleSleep = () => {
        // Advance time based on current time and bed type
        // Basic Bed: Night -> Day
        // Medium Bed: Day -> Night, Night -> Day
        // Advanced Bed: Any -> Any (Toggle)
        
        let targetTime = DAWN_START;
        const isNight = timeRef.current >= NIGHT_START || timeRef.current < DAWN_START;

        if (activeBedType === BlockType.BED) {
             // Only works at night (already checked before opening UI)
             targetTime = DAWN_START;
        } else if (activeBedType === BlockType.BED_MEDIUM) {
             if (isNight) targetTime = DAWN_START;
             else targetTime = NIGHT_START;
        } else if (activeBedType === BlockType.BED_ADVANCED) {
             // Toggle to opposite
             if (isNight) targetTime = DAWN_START;
             else targetTime = NIGHT_START;
        } else {
             // Fallback
             if (timeRef.current < DUSK_START) targetTime = NIGHT_START;
        }

        timeRef.current = targetTime;
        setIsSleepUIOpen(false);
        setActiveBedType(null);
        
        // Heal player on sleep
        playerRef.current.health = playerRef.current.maxHealth;
        setHearts(playerRef.current.health);
        
        // Save game
        saveGame();
        addNotification(t.SLEEP_SUCCESS);
    };

    const handleInteraction = () => {
        if (worldRef.current) {
            const pStartX = Math.floor(playerRef.current.x / BLOCK_SIZE);
            const pEndX = Math.floor((playerRef.current.x + playerRef.current.width) / BLOCK_SIZE);
            const pStartY = Math.floor(playerRef.current.y / BLOCK_SIZE);
            const pEndY = Math.floor((playerRef.current.y + playerRef.current.height) / BLOCK_SIZE);
            
            // Check Ladder/Vines Interaction first (Toggle Climbing)
            const cx = Math.floor((playerRef.current.x + playerRef.current.width / 2) / BLOCK_SIZE);
            const cy = Math.floor((playerRef.current.y + playerRef.current.height / 2) / BLOCK_SIZE);
            const blockAtFeet = worldRef.current.blocks[cy * WORLD_WIDTH + cx];
            if (blockAtFeet === BlockType.LADDER || blockAtFeet === BlockType.VINES || blockAtFeet === BlockType.MOSS) {
                isClimbingRef.current = !isClimbingRef.current;
                playerRef.current.vx = 0; playerRef.current.vy = 0;
                return;
            }
            
            // Check NPC Interaction
            for (const ent of entitiesRef.current) {
                if (ent.type === 'NPC') {
                    const dist = Math.hypot(ent.x - playerRef.current.x, ent.y - playerRef.current.y);
                    if (dist < 100) {
                        setActiveNpc(ent);
                        return;
                    }
                }
            }

            for (let y = pStartY; y <= pEndY; y++) {
                for (let x = pStartX; x <= pEndX; x++) {
                    const idx = y * WORLD_WIDTH + x;
                    const b = worldRef.current.blocks[idx];
                    const key = `${x},${y}`;

                    if (b === BlockType.CRAFTING_TABLE || b === BlockType.SCIENCE_BENCH || b === BlockType.MEDICAL_BENCH) {
                        setNearbyStation(b);
                        setIsInventoryOpen(true);
                        return;
                    } else if (b === BlockType.LEVER || b === BlockType.LEVER_ON) {
                        audio.playHit();
                        setBlockAt(x, y, b === BlockType.LEVER ? BlockType.LEVER_ON : BlockType.LEVER);
                        return;
                    } else if (b === BlockType.BUTTON) {
                        audio.playHit();
                        setBlockAt(x, y, BlockType.BUTTON_ON);
                        setTimeout(() => {
                            if (worldRef.current && worldRef.current.blocks[y * WORLD_WIDTH + x] === BlockType.BUTTON_ON) {
                                setBlockAt(x, y, BlockType.BUTTON);
                            }
                        }, 1000);
                        return;
                    } else if (b === BlockType.ARMOR_BENCH) {
                        setIsArmorBenchOpen(true);
                        return;
                    } else if (b === BlockType.FURNACE) {
                        if (!furnacesRef.current.has(key)) {
                            furnacesRef.current.set(key, { input: null, fuel: null, output: null, burnTime: 0, maxBurnTime: 0, cookTime: 0 });
                        }
                        setActiveFurnacePos(key);
                        setIsFurnaceOpen(true);
                        return;
                    } else if (b === BlockType.CHEST || b === BlockType.CHEST_MEDIUM || b === BlockType.CHEST_LARGE || b === BlockType.STONE_CHEST) {
                        if (!chestsRef.current.has(key)) {
                            chestsRef.current.set(key, Array(20).fill(null));
                        }
                        const size = b === BlockType.CHEST_LARGE ? 100 : (b === BlockType.CHEST_MEDIUM || b === BlockType.STONE_CHEST ? 50 : 20);
                        setActiveChestSize(size);
                        
                        const currentContent = chestsRef.current.get(key)!;
                        if (currentContent.length !== size) {
                             const newContent = Array(size).fill(null);
                             for(let i=0; i<Math.min(currentContent.length, size); i++) newContent[i] = currentContent[i];
                             chestsRef.current.set(key, newContent);
                        }
                        
                        setActiveChestPos(key);
                        setIsChestOpen(true);
                        return;
                    } else if (b === BlockType.BED || b === BlockType.BED_MEDIUM || b === BlockType.BED_ADVANCED) {
                        const isNight = timeRef.current >= NIGHT_START || timeRef.current < DAWN_START;
                        
                        if (b === BlockType.BED) {
                            if (isNight) {
                                setActiveBedType(b);
                                setIsSleepUIOpen(true);
                            } else {
                                 addNotification(t.CANT_SLEEP);
                            }
                        } else {
                            // Medium and Advanced beds allow sleeping anytime (Day -> Night, Night -> Day)
                            setActiveBedType(b);
                            setIsSleepUIOpen(true);
                        }
                        return;
                    } else if (b === BlockType.DOOR_BOTTOM_CLOSED || b === BlockType.DOOR_TOP_CLOSED || b === BlockType.DOOR_STONE_BOTTOM_CLOSED || b === BlockType.DOOR_STONE_TOP_CLOSED) {
                        const isStone = b === BlockType.DOOR_STONE_BOTTOM_CLOSED || b === BlockType.DOOR_STONE_TOP_CLOSED;
                        if (b === BlockType.DOOR_BOTTOM_CLOSED || b === BlockType.DOOR_STONE_BOTTOM_CLOSED) {
                            setBlockAt(x, y, isStone ? BlockType.DOOR_STONE_BOTTOM_OPEN : BlockType.DOOR_BOTTOM_OPEN);
                            setBlockAt(x, y - 1, isStone ? BlockType.DOOR_STONE_TOP_OPEN : BlockType.DOOR_TOP_OPEN);
                        } else {
                            setBlockAt(x, y, isStone ? BlockType.DOOR_STONE_TOP_OPEN : BlockType.DOOR_TOP_OPEN);
                            setBlockAt(x, y + 1, isStone ? BlockType.DOOR_STONE_BOTTOM_OPEN : BlockType.DOOR_BOTTOM_OPEN);
                        }
                        return;
                    } else if (b === BlockType.DOOR_BOTTOM_OPEN || b === BlockType.DOOR_TOP_OPEN || b === BlockType.DOOR_STONE_BOTTOM_OPEN || b === BlockType.DOOR_STONE_TOP_OPEN) {
                        const isStone = b === BlockType.DOOR_STONE_BOTTOM_OPEN || b === BlockType.DOOR_STONE_TOP_OPEN;
                        if (b === BlockType.DOOR_BOTTOM_OPEN || b === BlockType.DOOR_STONE_BOTTOM_OPEN) {
                            setBlockAt(x, y, isStone ? BlockType.DOOR_STONE_BOTTOM_CLOSED : BlockType.DOOR_BOTTOM_CLOSED);
                            setBlockAt(x, y - 1, isStone ? BlockType.DOOR_STONE_TOP_CLOSED : BlockType.DOOR_TOP_CLOSED);
                        } else {
                            setBlockAt(x, y, isStone ? BlockType.DOOR_STONE_TOP_CLOSED : BlockType.DOOR_TOP_CLOSED);
                            setBlockAt(x, y + 1, isStone ? BlockType.DOOR_STONE_BOTTOM_CLOSED : BlockType.DOOR_BOTTOM_CLOSED);
                        }
                        return;
                    }
                }
            }
        }

        const mx = mouseRef.current.x + cameraRef.current.x;
        const my = mouseRef.current.y + cameraRef.current.y;
        const bx = Math.floor(mx / BLOCK_SIZE);
        const by = Math.floor(my / BLOCK_SIZE);
        
        const dist = Math.sqrt(Math.pow(bx*BLOCK_SIZE + BLOCK_SIZE/2 - (playerRef.current.x+playerRef.current.width/2), 2) + Math.pow(by*BLOCK_SIZE + BLOCK_SIZE/2 - (playerRef.current.y+playerRef.current.height/2), 2));
        if (dist > REACH_DISTANCE * 1.5) return;

        if (worldRef.current) {
            const idx = by * WORLD_WIDTH + bx;
            const b = worldRef.current.blocks[idx];
            const key = `${bx},${by}`;
            
            if (b === BlockType.CHEST || b === BlockType.CHEST_MEDIUM || b === BlockType.CHEST_LARGE || b === BlockType.STONE_CHEST) {
                if (!chestsRef.current.has(key)) {
                    chestsRef.current.set(key, Array(20).fill(null));
                }
                const size = b === BlockType.CHEST_LARGE ? 100 : (b === BlockType.CHEST_MEDIUM || b === BlockType.STONE_CHEST ? 50 : 20);
                setActiveChestSize(size);
                
                const currentContent = chestsRef.current.get(key)!;
                if (currentContent.length !== size) {
                     const newContent = Array(size).fill(null);
                     for(let i=0; i<Math.min(currentContent.length, size); i++) newContent[i] = currentContent[i];
                     chestsRef.current.set(key, newContent);
                }
                
                setActiveChestPos(key);
                setIsChestOpen(true);
            } else if (b === BlockType.BED || b === BlockType.BED_MEDIUM || b === BlockType.BED_ADVANCED) {
                const isNight = timeRef.current >= NIGHT_START || timeRef.current < DAWN_START;
                if (b === BlockType.BED) {
                    if (isNight) {
                        setActiveBedType(b);
                        setIsSleepUIOpen(true);
                    } else {
                         addNotification(t.CANT_SLEEP);
                    }
                } else {
                    setActiveBedType(b);
                    setIsSleepUIOpen(true);
                }
            }
        }
    };
    
    const dropItem = (slotIndex: number = selectedSlot, amount: number = 1) => {
        setInventory(prev => {
            const n = [...prev];
            const item = n[slotIndex];
            if (item) {
                 const dropCount = Math.min(amount, item.count);
                 spawnDrop(playerRef.current.x, playerRef.current.y, item.id, dropCount, item.meta);
                 n[slotIndex]!.count -= dropCount;
                 if (n[slotIndex]!.count <= 0) n[slotIndex] = null;
            }
            return n;
        });
    };

    const drawMob = (ctx: CanvasRenderingContext2D, ent: Entity) => {
        ctx.save();
        ctx.translate(ent.x + ent.width/2, ent.y + ent.height/2);
        if (!ent.facingRight) ctx.scale(-1, 1);
        
        const legOffset = Math.sin(ent.x / 10) * 4;

        if ((ent.type?.toString() || '').includes('ZOMBIE') || ent.type === 'PLAGUE_KING') {
            const isMutant = ent.type === 'MUTANT_ZOMBIE' || ent.type === 'ZOMBIE_TANK' || ent.type === 'ZOMBIE_KING' || ent.type === 'PLAGUE_KING';
            const scale = isMutant ? 1.5 : 1;
            
            // Colors based on type
            let legColor = '#1a237e';
            let bodyColor = '#0d47a1';
            let headColor = '#2e7d32'; // sickly green
            let eyeColor = '#ff0000'; // Scary red eyes by default
            let detailColor = '#8b0000'; // Blood red for details
            
            if (ent.type === 'ZOMBIE_RUNNER') { bodyColor = '#b71c1c'; headColor = '#4caf50'; }
            else if (ent.type === 'ZOMBIE_TANK') { bodyColor = '#37474f'; headColor = '#1b5e20'; detailColor = '#424242'; }
            else if (ent.type === 'ZOMBIE_EXPLOSIVE') { bodyColor = '#ff8f00'; headColor = '#8bc34a'; eyeColor = '#d50000'; detailColor = '#ffeb3b'; }
            else if (ent.type === 'ZOMBIE_TOXIC') { bodyColor = '#004d40'; headColor = '#00e676'; eyeColor = '#76ff03'; detailColor = '#1de9b6'; }
            else if (ent.type === 'ZOMBIE_SKELETON') { bodyColor = '#e0e0e0'; headColor = '#f5f5f5'; legColor = '#bdbdbd'; detailColor = '#424242'; }
            else if (ent.type === 'ZOMBIE_INFECTOR') { bodyColor = '#4a148c'; headColor = '#6a1b9a'; eyeColor = '#e040fb'; detailColor = '#b388ff'; }
            else if (ent.type === 'ZOMBIE_DARK') { bodyColor = '#111'; headColor = '#222'; eyeColor = '#ff1744'; detailColor = '#b71c1c'; }
            else if (ent.type === 'ZOMBIE_FROZEN') { bodyColor = '#0277bd'; headColor = '#81d4fa'; eyeColor = '#e1f5fe'; detailColor = '#4fc3f7'; }
            else if (ent.type === 'ZOMBIE_KING' || ent.type === 'PLAGUE_KING') { bodyColor = '#b71c1c'; headColor = '#1b5e20'; eyeColor = '#ffeb3b'; legColor = '#4a148c'; detailColor = '#ffd600'; }
            
            // Ragged legs
            ctx.fillStyle = legColor; 
            ctx.fillRect(-6 * scale, 12 * scale, 4 * scale, (16 + legOffset) * scale);
            ctx.fillRect(2 * scale, 12 * scale, 4 * scale, (16 - legOffset) * scale);
            // Leg damage
            ctx.fillStyle = detailColor;
            ctx.fillRect(-4 * scale, 20 * scale, 2 * scale, 4 * scale);

            // Body
            ctx.fillStyle = bodyColor; 
            ctx.fillRect(-10 * scale, -16 * scale, 20 * scale, 28 * scale);
            // Ragged shirt bottom
            ctx.fillStyle = legColor;
            ctx.fillRect(-10 * scale, 8 * scale, 4 * scale, 4 * scale);
            ctx.fillRect(-2 * scale, 10 * scale, 4 * scale, 2 * scale);
            ctx.fillRect(4 * scale, 6 * scale, 6 * scale, 6 * scale);

            // Chest wound / exposed ribs
            ctx.fillStyle = '#111';
            ctx.fillRect(-4 * scale, -8 * scale, 6 * scale, 6 * scale);
            ctx.fillStyle = detailColor; // Blood or glow inside wound
            ctx.fillRect(-2 * scale, -6 * scale, 2 * scale, 4 * scale);

            if (isMutant) {
                ctx.fillStyle = '#1565c0'; 
                ctx.fillRect(-4 * scale, -8 * scale, 8 * scale, 4 * scale);
                ctx.fillRect(-4 * scale, 0 * scale, 8 * scale, 4 * scale);
            }
            
            if (ent.type === 'ZOMBIE_KING' || ent.type === 'PLAGUE_KING') {
                // Crown
                ctx.fillStyle = '#ffeb3b';
                ctx.fillRect(-10 * scale, -36 * scale, 20 * scale, 6 * scale);
                ctx.fillRect(-10 * scale, -40 * scale, 4 * scale, 4 * scale);
                ctx.fillRect(-2 * scale, -40 * scale, 4 * scale, 4 * scale);
                ctx.fillRect(6 * scale, -40 * scale, 4 * scale, 4 * scale);
            }
            
            // Arm (outstretched)
            ctx.fillStyle = headColor; 
            ctx.fillRect(0, -14 * scale, 22 * scale, 6 * scale); 
            // Blood on hands
            ctx.fillStyle = '#8b0000';
            ctx.fillRect(18 * scale, -14 * scale, 4 * scale, 6 * scale); 

            // Shoulder
            ctx.fillStyle = '#1b5e20';
            ctx.fillRect(-10 * scale, -14 * scale, 10 * scale, 6 * scale); 
            
            // Head
            ctx.fillStyle = headColor; 
            ctx.fillRect(-10 * scale, -28 * scale, 20 * scale, 20 * scale); 
            // Brain exposed / head wound
            ctx.fillStyle = detailColor;
            ctx.fillRect(4 * scale, -28 * scale, 6 * scale, 4 * scale);

            // Eyes (Glowing)
            ctx.fillStyle = eyeColor;
            ctx.shadowColor = eyeColor;
            ctx.shadowBlur = 10 * scale;
            ctx.fillRect(2 * scale, -22 * scale, 4 * scale, 4 * scale); 
            ctx.fillRect(6 * scale, -22 * scale, 4 * scale, 4 * scale); 
            ctx.shadowBlur = 0; // reset shadow
        } 
        else if (ent.type === 'COW') {
            ctx.fillStyle = '#3e2723';
            ctx.fillRect(-12, 6, 6, 10 + legOffset); 
            ctx.fillRect(6, 6, 6, 10 - legOffset); 
            ctx.fillStyle = '#5d4037';
            ctx.fillRect(-16, -8, 32, 18);
            ctx.fillStyle = '#fff';
            ctx.fillRect(-4, -6, 10, 8);
            ctx.fillStyle = '#5d4037';
            ctx.fillRect(14, -12, 12, 12);
            ctx.fillStyle = '#bdbdbd';
            ctx.fillRect(16, -16, 2, 4);
            ctx.fillRect(22, -16, 2, 4);
            ctx.fillStyle = '#f48fb1';
            ctx.fillRect(-2, 10, 6, 2);
        } 
        else if (ent.type === 'PIG') {
            ctx.fillStyle = '#f06292';
            ctx.fillRect(-10, 6, 4, 8 + legOffset);
            ctx.fillRect(6, 6, 4, 8 - legOffset);
            ctx.fillStyle = '#f48fb1';
            ctx.fillRect(-14, -6, 28, 14);
            ctx.fillStyle = '#f48fb1';
            ctx.fillRect(12, -8, 10, 10);
            ctx.fillStyle = '#e91e63';
            ctx.fillRect(20, -4, 4, 4);
        } 
        else if (ent.type === 'SHEEP') {
            ctx.fillStyle = '#d7ccc8'; 
            ctx.fillRect(-10, 6, 4, 8 + legOffset);
            ctx.fillRect(8, 6, 4, 8 - legOffset);
            ctx.fillStyle = '#fff'; 
            ctx.fillRect(-14, -10, 30, 20); 
            ctx.fillStyle = '#eee'; 
            ctx.fillRect(-12, -8, 26, 16);
            ctx.fillStyle = '#d7ccc8'; 
            ctx.fillRect(14, -8, 8, 8);
        }
        else if (ent.type === 'POLAR_BEAR') {
            const breathe = ent.isSleeping ? Math.sin(timeRef.current / 15) * 2 : 0;
            ctx.fillStyle = '#e0e0e0';
            if (ent.isSleeping) {
                // Sleeping polar bear
                ctx.fillRect(-20, 2 - breathe, 40, 13 + breathe); // Body
                ctx.fillRect(10, 6 - breathe/2, 12, 9 + breathe/2); // Head resting
                
                ctx.fillStyle = '#d6d6d6';
                ctx.fillRect(-15, 10, 8, 5); // Back paw
                ctx.fillRect(5, 10, 8, 5); // Front paw
                
                ctx.fillStyle = '#000';
                ctx.fillRect(18, 10 - breathe/2, 4, 2); // Closed Eye
                
                if (timeRef.current % 60 < 30) {
                    ctx.fillStyle = '#fff';
                    ctx.font = '10px monospace';
                    ctx.fillText('Z', 25, -5 - breathe);
                    ctx.font = '8px monospace';
                    ctx.fillText('z', 32, -10 - breathe);
                }
            } else {
                // Standing/walking polar bear
                ctx.fillRect(-14, 6, 6, 10 + legOffset);
                ctx.fillRect(8, 6, 6, 10 - legOffset);
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(-20, -10, 40, 20); // Body
                ctx.fillRect(14, -14, 14, 14); // Head
                ctx.fillStyle = '#000';
                ctx.fillRect(24, -10, 2, 2); // Eye
                ctx.fillRect(26, -4, 4, 4); // Nose
            }
        }
        else if (ent.type === 'DOG') {
            ctx.fillStyle = '#d7ccc8';
            if (ent.isSitting) {
                ctx.fillRect(-10, -2, 16, 18); // Body sitting
                ctx.fillRect(2, -10, 10, 10); // Head
                ctx.fillRect(-12, 12, 4, 4); // Back legs
                ctx.fillRect(6, 12, 4, 4); // Front legs
            } else {
                ctx.fillRect(-8, 6, 4, 10 + legOffset);
                ctx.fillRect(4, 6, 4, 10 - legOffset);
                ctx.fillRect(-10, -6, 20, 12); // Body
                ctx.fillRect(6, -12, 10, 10); // Head
                ctx.fillRect(-14, -4, 4, 4); // Tail
            }
            ctx.fillStyle = '#000';
            ctx.fillRect(ent.isSitting ? 8 : 12, ent.isSitting ? -8 : -10, 2, 2); // Eye
            ctx.fillRect(ent.isSitting ? 10 : 14, ent.isSitting ? -4 : -6, 2, 2); // Nose
            if (ent.isTamed) {
                ctx.fillStyle = '#f44336'; // Red collar
                ctx.fillRect(ent.isSitting ? 2 : 6, ent.isSitting ? 0 : -2, 10, 2);
            }
        }
        else if (ent.type === 'CAMEL') {
             ctx.fillStyle = '#C19A6B'; // Camel color
             // Body
             ctx.fillRect(-20, -5, 40, 20);
             // Hump
             ctx.fillRect(-5, -13, 10, 8);
             // Neck
             ctx.fillRect(20, -15, 8, 15);
             // Head
             ctx.fillRect(22, -20, 12, 8);
             // Legs
             ctx.fillRect(-18, 15, 5, 15 + legOffset);
             ctx.fillRect(-8, 15, 5, 15 - legOffset);
             ctx.fillRect(8, 15, 5, 15 + legOffset);
             ctx.fillRect(18, 15, 5, 15 - legOffset);
             
             // Saddle
             if (ent.saddle) {
                 ctx.fillStyle = '#795548'; // Saddle brown
                 ctx.fillRect(-8, -8, 16, 6);
                 ctx.fillStyle = '#DAA520'; // Gold trim
                 ctx.fillRect(-3, -8, 6, 6);
             }
        }
        else if (ent.type === 'SNAKE') {
             ctx.fillStyle = '#4CAF50'; // Green snake
             // Body segments (sinusoidal)
             for(let i=0; i<5; i++) {
                 ctx.fillRect(-10 + (i*4), 4 + Math.sin((ent.x + i*10)/10)*2, 4, 4);
             }
             // Head
             ctx.fillStyle = '#388E3C';
             ctx.fillRect(10, 2 + Math.sin((ent.x + 50)/10)*2, 6, 4);
             // Tongue
             ctx.fillStyle = 'red';
             ctx.fillRect(16, 3 + Math.sin((ent.x + 50)/10)*2, 4, 1);
        }
        else if (ent.type === 'RABBIT') {
             ctx.fillStyle = '#EFEBE9'; // White/Grey
             // Body
             ctx.fillRect(-6, 4, 12, 8);
             // Head
             ctx.fillRect(4, 0, 6, 6);
             // Ears
             ctx.fillRect(6, -6, 2, 6);
             ctx.fillRect(9, -6, 2, 6);
             // Legs
             ctx.fillRect(-6, 12, 4, 4 + legOffset);
             ctx.fillRect(4, 12, 4, 4 - legOffset);
        }
        else if (ent.type === 'SCORPION') {
            ctx.fillStyle = '#3e2723'; // Dark Brown
            // Smaller Body
            ctx.fillRect(-8, 0, 16, 8);
            // Tail (Curved)
            ctx.fillStyle = '#5d4037';
            ctx.beginPath();
            ctx.moveTo(-8, 2);
            ctx.quadraticCurveTo(-16, -8, -6, -12);
            ctx.lineTo(-4, -10);
            ctx.quadraticCurveTo(-12, -6, -6, 2);
            ctx.fill();
            // Stinger
            ctx.fillStyle = '#d32f2f';
            ctx.fillRect(-7, -13, 3, 3);
            // Legs
            ctx.fillStyle = '#3e2723';
            ctx.fillRect(-6, 8, 2, 3 + legOffset);
            ctx.fillRect(-2, 8, 2, 3 - legOffset);
            ctx.fillRect(2, 8, 2, 3 + legOffset);
            ctx.fillRect(6, 8, 2, 3 - legOffset);
            // Claws
            ctx.fillRect(8, 2, 4, 3);
        }
        else if (ent.type === 'NPC') {
            // Render NPC
            ctx.fillStyle = '#2980b9'; // Blue shirt
            ctx.fillRect(-12, -10, 24, 20); // Body
            ctx.fillStyle = '#f1c40f'; // Skin
            ctx.fillRect(-10, -26, 20, 16); // Head
            ctx.fillStyle = '#34495e'; // Pants
            ctx.fillRect(-12, 10, 24, 14); // Legs
            
            // Eyes
            ctx.fillStyle = 'black';
            ctx.fillRect((ent.facingRight ? 2 : -6), -20, 4, 4);
            
            // Name tag
            if (ent.npcData) {
                ctx.font = 'bold 12px monospace';
                ctx.textAlign = 'center';
                ctx.fillStyle = 'white';
                ctx.strokeStyle = 'black';
                ctx.lineWidth = 3;
                ctx.strokeText(ent.npcData.name, 0, -35);
                ctx.fillText(ent.npcData.name, 0, -35);
                
                // Quest indicator
                if (ent.npcData.completed) {
                    ctx.fillStyle = 'gray';
                    ctx.fillText("✓", 0, -50);
                } else {
                    ctx.fillStyle = 'yellow';
                    ctx.fillText("!", 0, -50);
                }
            }
        }
        else if (ent.type === 'PLAYER') {
            // Render other players
            ctx.fillStyle = '#7e57c2'; // Purple tint
            ctx.fillRect(-10, -28, 20, 56);
            ctx.fillStyle = 'white';
            ctx.fillRect((ent.facingRight?4:-8), -20, 4, 4); // Eye
            
            // Name tag
            if(ent.playerName) {
                ctx.font = 'bold 12px monospace';
                ctx.textAlign = 'center';
                ctx.fillStyle = 'white';
                ctx.strokeStyle = 'black';
                ctx.lineWidth = 3;
                ctx.strokeText(ent.playerName, 0, -35);
                ctx.fillText(ent.playerName, 0, -35);
            }
        }
        else if (ent.type === 'BUSH_MOB') {
            ctx.fillStyle = '#1b5e20'; // Dark green leaves
            ctx.beginPath();
            ctx.arc(0, 0, ent.width/2, Math.PI, 0); // Top dome
            ctx.lineTo(ent.width/2, ent.height/2);
            ctx.lineTo(-ent.width/2, ent.height/2);
            ctx.fill();
            // If awake (moving), show eyes
            if (Math.abs(ent.vx) > 0.1 || ent.vy !== 0) {
                ctx.fillStyle = '#ff1744'; // Red angry eyes
                ctx.fillRect(ent.facingRight ? 4 : -8, -4, 4, 4);
                ctx.fillRect(ent.facingRight ? 10 : -2, -4, 4, 4);
            }
        }
        else if (ent.type === 'SPIDER') {
            ctx.fillStyle = '#212121'; // Dark body
            ctx.fillRect(-10, -4, 20, 8); // Body
            ctx.fillRect(ent.facingRight ? 6 : -14, -8, 8, 8); // Head
            
            // Eyes
            ctx.fillStyle = '#ff1744';
            ctx.fillRect(ent.facingRight ? 10 : -12, -6, 2, 2);
            ctx.fillRect(ent.facingRight ? 10 : -12, -2, 2, 2);
            
            // Legs (8 legs)
            ctx.strokeStyle = '#424242';
            ctx.lineWidth = 2;
            for (let i = 0; i < 4; i++) {
                ctx.beginPath();
                ctx.moveTo(-6 + i*4, 4);
                ctx.lineTo(-12 + i*4 + legOffset, 12);
                ctx.stroke();
                
                ctx.beginPath();
                ctx.moveTo(-6 + i*4, 4);
                ctx.lineTo(0 + i*4 - legOffset, 12);
                ctx.stroke();
            }
        }
        else {
            ctx.fillStyle = 'red';
            ctx.fillRect(-ent.width/2, -ent.height/2, ent.width, ent.height);
        }
        ctx.restore();
    };

    // --- UI HANDLERS & EVENT LISTENERS ---
    
    const handleInventorySlotClick = (index: number, button: number) => {
        if (index < 0 || index >= inventory.length) return;
        const clickedItem = inventory[index];
        if (button === 2) {
            if (cursorItem && !clickedItem) {
                setInventory(prev => { const n = [...prev]; n[index] = { ...cursorItem, count: 1 }; return n; });
                setCursorItem(prev => { if (!prev) return null; const n = { ...prev, count: prev.count - 1 }; return n.count > 0 ? n : null; });
            } else if (!cursorItem && clickedItem) {
                const half = Math.ceil(clickedItem.count / 2);
                setCursorItem({ ...clickedItem, count: half });
                setInventory(prev => { const n = [...prev]; n[index] = { ...clickedItem, count: clickedItem.count - half }; if (n[index]!.count <= 0) n[index] = null; return n; });
            }
            return;
        }
        if (cursorItem) {
            if (clickedItem) {
                if (clickedItem.id === cursorItem.id) {
                    setInventory(prev => { const n = [...prev]; const space = 64 - clickedItem.count; const toAdd = Math.min(space, cursorItem.count); n[index] = { ...clickedItem, count: clickedItem.count + toAdd }; return n; });
                    setCursorItem(prev => { if (!prev) return null; const n = { ...prev, count: prev.count - Math.min(64 - clickedItem.count, prev.count) }; return n.count > 0 ? n : null; });
                } else {
                    setInventory(prev => { const n = [...prev]; n[index] = cursorItem; return n; }); setCursorItem(clickedItem);
                }
            } else { setInventory(prev => { const n = [...prev]; n[index] = cursorItem; return n; }); setCursorItem(null); }
        } else { if (clickedItem) { setCursorItem(clickedItem); setInventory(prev => { const n = [...prev]; n[index] = null; return n; }); } }
    };

    const handleCompleteQuest = (npcId: number, questId: number) => {
        const npc = entitiesRef.current.find(e => e.id === npcId);
        if (!npc || !npc.npcData || npc.npcData.completed) return;
        
        const quest = QUESTS.find(q => q.id === questId);
        if (!quest) return;

        // Check and remove items
        let remaining = quest.reqCount;
        const newInv = [...inventory];
        for (let i = 0; i < newInv.length; i++) {
            const item = newInv[i];
            if (item && item.id === quest.reqItem) {
                if (item.count >= remaining) {
                    item.count -= remaining;
                    if (item.count === 0) newInv[i] = null;
                    remaining = 0;
                    break;
                } else {
                    remaining -= item.count;
                    newInv[i] = null;
                }
            }
        }

        if (remaining === 0) {
            setInventory(newInv);
            npc.npcData.completed = true;
            
            // Give reward
            const rewardItem: ItemStack = { id: quest.rewardItem, count: quest.rewardCount, type: typeof quest.rewardItem === 'number' ? ItemType.BLOCK : ItemType.MATERIAL };
            const finalInv = [...newInv];
            let added = false;
            for (let i = 0; i < finalInv.length; i++) {
                if (!finalInv[i]) {
                    finalInv[i] = rewardItem;
                    added = true;
                    break;
                } else if (finalInv[i]!.id === rewardItem.id && finalInv[i]!.count < 64) {
                    const space = 64 - finalInv[i]!.count;
                    if (rewardItem.count <= space) {
                        finalInv[i]!.count += rewardItem.count;
                        added = true;
                        break;
                    } else {
                        finalInv[i]!.count = 64;
                        rewardItem.count -= space;
                    }
                }
            }
            if (!added) {
                spawnDrop(playerRef.current.x, playerRef.current.y, rewardItem.id, rewardItem.count);
            } else {
                setInventory(finalInv);
            }
            
            addNotification(lang === 'PT' ? "Missão Concluída!" : "Quest Completed!");
        }
    };

    const handleCraft = (recipe: CraftingRecipe) => {
        let can = true; const tempInv = [...inventory];
        for (const ing of recipe.ingredients) {
            let needed = ing.count;
            for (let i = 0; i < tempInv.length; i++) {
                if (tempInv[i] && tempInv[i]!.id === ing.id) { const take = Math.min(needed, tempInv[i]!.count); tempInv[i] = { ...tempInv[i]!, count: tempInv[i]!.count - take }; if (tempInv[i]!.count <= 0) tempInv[i] = null; needed -= take; if (needed <= 0) break; }
            }
            if (needed > 0) { can = false; break; }
        }
        if (can) {
            setInventory(tempInv); const res = recipe.result; let added = false;
            for (let i = 0; i < tempInv.length; i++) { if (tempInv[i] && tempInv[i]!.id === res.id && tempInv[i]!.count < 64) { const space = 64 - tempInv[i]!.count; const add = Math.min(space, res.count); tempInv[i]!.count += add; added = true; break; } }
            if (!added) { for(let i=0; i<tempInv.length; i++) { if (!tempInv[i]) { tempInv[i] = { ...res }; added = true; break; } } }
            if (!added) { spawnDrop(playerRef.current.x, playerRef.current.y, res.id, res.count); }
            setInventory(tempInv);
        }
    };

    // Special handler specifically for Armor Bench which might pass a custom onReturnItem logic
    const handleArmorBenchReturn = (item: ItemStack) => {
        setInventory(prev => {
            const newInv = [...prev];
            let placed = false;
            // Try stack
            for(let i=0; i<newInv.length; i++) {
                if (newInv[i] && newInv[i]!.id === item.id && newInv[i]!.count < 64) {
                    newInv[i]!.count += item.count;
                    placed = true;
                    break;
                }
            }
            // Try empty
            if (!placed) {
                for(let i=0; i<newInv.length; i++) {
                    if (!newInv[i]) {
                        newInv[i] = item;
                        placed = true;
                        break;
                    }
                }
            }
            if (!placed) {
                spawnDrop(playerRef.current.x, playerRef.current.y, item.id, item.count, item.meta);
            }
            return newInv;
        });
    };

    const handleEquip = (item: ItemStack, slot: keyof Equipment) => {
        if (cursorItem) {
            const valid = (slot === 'helmet' && (cursorItem.id?.toString() || '').includes('helmet')) || (slot === 'chestplate' && (cursorItem.id?.toString() || '').includes('chestplate')) || (slot === 'leggings' && (cursorItem.id?.toString() || '').includes('leggings')) || (slot === 'boots' && (cursorItem.id?.toString() || '').includes('boots')) || (slot === 'offHand');
            if (valid) { const old = equipment[slot]; setEquipment(prev => ({ ...prev, [slot]: cursorItem })); setCursorItem(old); }
        } else { if (item) { setCursorItem(item); setEquipment(prev => ({ ...prev, [slot]: null })); } }
    };

    const handleUnequip = (slot: keyof Equipment) => {
        const item = equipment[slot]; if (!item) return;
        const newInv = [...inventory]; let placed = false;
        for(let i=0; i<newInv.length; i++) { if (!newInv[i]) { newInv[i] = item; placed = true; break; } }
        if (placed) setInventory(newInv); else spawnDrop(playerRef.current.x, playerRef.current.y, item.id, item.count, item.meta);
        setEquipment(prev => ({ ...prev, [slot]: null }));
    };

    const handleFurnaceClick = (pos: string, slotType: 'input' | 'fuel' | 'output') => {
        const furnace = furnacesRef.current.get(pos); if (!furnace) return;
        
        // UI Logic
        if (cursorItem) {
            if (slotType === 'output') return; 
            const target = slotType === 'input' ? furnace.input : furnace.fuel;
            if (!target) { if (slotType === 'input') furnace.input = cursorItem; else furnace.fuel = cursorItem; setCursorItem(null); } 
            else { if (target.id === cursorItem.id) { target.count += cursorItem.count; setCursorItem(null); } else { if (slotType === 'input') furnace.input = cursorItem; else furnace.fuel = cursorItem; setCursorItem(target); } }
        } else {
            const target = slotType === 'input' ? furnace.input : (slotType === 'fuel' ? furnace.fuel : furnace.output);
            if (target) { setCursorItem(target); if (slotType === 'input') furnace.input = null; else if (slotType === 'fuel') furnace.fuel = null; else furnace.output = null; }
        }

        // Broadcast Update
        broadcast('FURNACE_UPDATE', { key: pos, data: furnace });
    };

    const handleChestSlotClick = (index: number) => {
        if (!activeChestPos || !chestsRef.current.has(activeChestPos)) return;
        const content = chestsRef.current.get(activeChestPos)!; const clicked = content[index];
        if (cursorItem) { if (clicked) { if (clicked.id === cursorItem.id) { clicked.count += cursorItem.count; setCursorItem(null); } else { content[index] = cursorItem; setCursorItem(clicked); } } else { content[index] = cursorItem; setCursorItem(null); } } else { if (clicked) { setCursorItem(clicked); content[index] = null; } }
        
        // Broadcast Update
        broadcast('CHEST_UPDATE', { key: activeChestPos, content });
    };

    const handleHammerBuild = (blockType: BlockType) => { setActiveBuildBlock(blockType); setIsHammerMenuOpen(false); };
    const handleAdminGiveItem = (item: ItemStack) => { setInventory(prev => { const n = [...prev]; for(let i=0; i<n.length; i++) { if (!n[i]) { n[i] = { ...item }; return n; } } return n; }); };
    const handleCreativeGive = (item: ItemStack) => { handleAdminGiveItem(item); };
    const handleAdminSetTime = (time: 'DAY' | 'NIGHT') => { if (time === 'DAY') timeRef.current = DAWN_START; else timeRef.current = NIGHT_START; if(worldRef.current) updateLighting(worldRef.current, timeRef.current); };
    
    // --- AUDIO STATE HANDLE ---
    useEffect(() => {
        const handleFirstClick = () => {
            audio.init();
            if (gameState === 'MENU') {
                audio.playMenuMusic();
            }
            window.removeEventListener('click', handleFirstClick);
        };
        window.addEventListener('click', handleFirstClick);

        if (gameState === 'MENU') {
            audio.stopAllAmbients();
            if (audio['initialized']) audio.playMenuMusic();
        } else {
            audio.stopMenuMusic();
        }
        
        return () => window.removeEventListener('click', handleFirstClick);
    }, [gameState]);

    // --- GAME LIFECYCLE ---

    const startNewGame = (save: SavedWorld | null, newConfig?: { name: string, seed: number, options: GameOptions }) => {
        audio.init();
        audio.stopMenuMusic();
        if (save) {
            worldRef.current = save.worldData; playerRef.current = save.player; setInventory(save.inventory); setEquipment(save.equipment); setCurrentWorldId(save.id); setCurrentWorldName(save.name); setCurrentSeed(save.seed); timeRef.current = save.time;
            setPlayerLevel(save.level || 1); setPlayerXP(save.xp || 0); setSkillPoints(save.skillPoints || 0); setPlayerStats(save.stats || DEFAULT_STATS); staminaRef.current = save.stamina !== undefined ? save.stamina : MAX_STAMINA; hungerRef.current = save.hunger !== undefined ? save.hunger : 10;
            if (save.options) setOptions(save.options);
            furnacesRef.current = new Map(save.furnaces); chestsRef.current = new Map(save.chests); if (save.crops) cropsRef.current = new Map(save.crops); else cropsRef.current = new Map();
            entitiesRef.current = []; setHearts(save.player.health); setHunger(hungerRef.current); setStamina(staminaRef.current); updateRedstone(worldRef.current); updateLighting(worldRef.current, timeRef.current);
        } else if (newConfig) {
            // NOTE: If multiplayer client, we wait for seed from host. If host/singleplayer, generate now.
            if (!newConfig.options?.multiplayer || newConfig.options.multiplayer.mode === 'HOST') {
                const w = generateWorld(newConfig.seed); worldRef.current = w; 
                respawnPlayer(w); updateRedstone(w); updateLighting(w, 0);
                
                // Initialize NPCs and Chests
                if (w.npcSpawns) {
                    w.npcSpawns.forEach(spawn => {
                        const isQuestGiver = (spawn as any).type === 'QUEST_GIVER';
                        const isFarm = (spawn as any).type === 'FARM_ANIMAL';
                        
                        if (isFarm) {
                            for(let a=0; a<4; a++) {
                                entitiesRef.current.push({
                                    id: Date.now() + Math.random(),
                                    type: Math.random() > 0.5 ? 'COW' : (Math.random() > 0.5 ? 'PIG' : 'SHEEP'),
                                    x: spawn.x * BLOCK_SIZE + (Math.random()*40-20),
                                    y: spawn.y * BLOCK_SIZE,
                                    width: 32, height: 32, vx: 0, vy: 0, maxHealth: 20, health: 20, grounded: false, facingRight: true
                                });
                            }
                            return;
                        }

                        const questId = isQuestGiver ? 1 : Math.floor(Math.random() * 5) + 1;
                        const name = isQuestGiver ? "Prefeito" : NPC_NAMES[Math.floor(Math.random() * NPC_NAMES.length)];
                        entitiesRef.current.push({
                            id: Date.now() + Math.random(),
                            type: 'NPC',
                            x: spawn.x * BLOCK_SIZE,
                            y: spawn.y * BLOCK_SIZE,
                            width: 24,
                            height: 48,
                            vx: 0,
                            vy: 0,
                            health: 20,
                            maxHealth: 20,
                            grounded: false,
                            facingRight: true,
                            npcData: { name, questId, completed: false }
                        });
                    });
                }
                if (w.initialChests) {
                    w.initialChests.forEach(chest => {
                        const chestKey = `${chest.x},${chest.y}`;
                        const items = Array(27).fill(null);
                        chest.items.forEach((item, i) => {
                            if (i < 27) items[i] = { id: item.id, count: item.count, type: item.type };
                        });
                        chestsRef.current.set(chestKey, items);
                    });
                }
            } else {
                // Client mode: World will be generated when seed is received.
                // For now initialize empty to prevent crash
                worldRef.current = { width: WORLD_WIDTH, height: WORLD_HEIGHT, blocks: new Array(WORLD_WIDTH*WORLD_HEIGHT).fill(0), light: [] };
            }
            
            setCurrentWorldId(Date.now().toString()); setCurrentWorldName(newConfig.name); setCurrentSeed(newConfig.seed); 
            if (newConfig.options) setOptions(newConfig.options); 
            timeRef.current = 0; 
            setPlayerLevel(1); setPlayerXP(0); setSkillPoints(0); setPlayerStats(DEFAULT_STATS); staminaRef.current = MAX_STAMINA; hungerRef.current = 10;
            playerRef.current.invincibilityEndTime = Date.now() + 3000;
            const inv = Array(36).fill(null); inv[0] = { id: BlockType.TORCH, count: 16, type: ItemType.BLOCK }; setInventory(inv); setEquipment({ helmet: null, chestplate: null, leggings: null, boots: null, offHand: null });
            furnacesRef.current = new Map(); chestsRef.current = new Map(); cropsRef.current = new Map(); entitiesRef.current = []; 
        }
        
        setGameState('PLAYING');
    };

    // --- MULTIPLAYER LOGIC ---
    useEffect(() => {
        if (gameState === 'PLAYING' && options.multiplayer) {
            const roomId = options.multiplayer.roomId;
            const socket = io(); // Connects to the same host/port
            socketRef.current = socket;
            
            const myPlayerId = Date.now() + Math.random(); 

            const onConnect = () => {
                if (options.multiplayer?.mode === 'HOST') {
                    socket.emit('create-room', { roomId, maxPlayers: 4, worldState: null }); // Host creates the room
                    // Note: We don't wait for 'room-created' here, we just assume it works and join visually. 
                    // Actually, let's just make it handle joining via the unique ID we generated locally.
                    // To keep it simple, since we already have roomId locally, let's just listen to 'room-created'.
                } else {
                    socket.emit('join-room', roomId);
                }
                
                // Send Join Signal to game clients
                socket.emit('game-event', { type: 'JOIN', roomId, payload: { id: myPlayerId, name: options.multiplayer?.playerName } });
            };

            if (socket.connected) {
                onConnect();
            } else {
                socket.on('connect', onConnect);
            }

            socket.on('room-error', (data) => {
                addNotification(`Connection Error: ${data.message}`);
            });
            
            socket.on('player-joined', (data) => {
                if (options.multiplayer?.mode === 'HOST' && worldRef.current) {
                    // Send full world state back through game-event SYNC_WORLD
                    socket.emit('game-event', { 
                        type: 'SYNC_WORLD', 
                        roomId,
                        payload: { 
                            seed: currentSeed,
                            world: null // Temporarily disabled full world sync due to size 
                        } 
                    });
                }
            });

            socket.on('game-event', (data) => {
                const { type, payload } = data;
                
                if (type === 'JOIN') {
                    if (payload.id !== myPlayerId) {
                        addNotification(`${payload.name || 'Player'} joined the world!`);
                        if (options.multiplayer?.mode === 'HOST' && worldRef.current) {
                            // SEND FULL WORLD DATA ON JOIN TO SYNC BROKEN BLOCKS
                            socket.emit('game-event', { 
                                type: 'SYNC_WORLD', 
                                roomId,
                                payload: { 
                                    seed: currentSeed,
                                    world: null // Temporarily disabled full world sync due to size // Send the actual modified world object
                                } 
                            });
                        }
                    }
                } else if (type === 'REQUEST_SYNC') {
                    if (options.multiplayer?.mode === 'HOST' && worldRef.current) {
                        socket.emit('game-event', { 
                            type: 'SYNC_WORLD', 
                            roomId,
                            payload: { 
                                seed: currentSeed,
                                world: null // Temporarily disabled full world sync due to size
                            } 
                        });
                    }
                } else if (type === 'PLAYER_LEAVE') {
                    // Handled by cleanup loop usually, but can be immediate
                } else if (type === 'UPDATE') {
                    if (payload.id !== myPlayerId) {
                        const existingIdx = otherPlayersRef.current.findIndex(p => p.id === payload.id);
                        if (existingIdx !== -1) {
                            otherPlayersRef.current[existingIdx] = { 
                                ...otherPlayersRef.current[existingIdx], 
                                ...payload,
                                lastSeen: Date.now() // Update heartbeat
                            };
                        } else {
                            otherPlayersRef.current.push({
                                ...payload,
                                type: 'PLAYER',
                                width: 20, height: 56, grounded: true, health: 100, maxHealth: 100,
                                lastSeen: Date.now()
                            });
                        }
                    }
                } else if (type === 'SYNC_WORLD') {
                    if (false && options.multiplayer?.mode === "CLIENT" && payload.world) {
                        // Receiving full world data from host
                        console.log("Received Full World Sync from Host");
                        worldRef.current = payload.world;
                        respawnPlayer(payload.world);
                        updateLighting(payload.world, 0);
                        setCurrentSeed(payload.seed);
                        addNotification("Synced with Host World!");
                    } else if (options.multiplayer?.mode === "CLIENT" && payload.seed) {
                        // Fallback for seed-only (legacy check)
                        console.log("Received Seed from Host:", payload.seed);
                        if (currentSeed !== payload.seed) {
                            const w = generateWorld(payload.seed);
                            worldRef.current = w;
                            respawnPlayer(w);
                            updateRedstone(w);
                            updateLighting(w, 0);
                            setCurrentSeed(payload.seed);
                            addNotification("Synced with Host World!");
                        }
                    }
                } else if (type === 'BLOCK_UPDATE') {
                    // Another player placed/broke a block
                    setBlockAt(payload.x, payload.y, payload.type, false); // False = Don't broadcast back
                } else if (type === 'CHEST_UPDATE') {
                    chestsRef.current.set(payload.key, payload.content);
                    if (activeChestPos === payload.key && isChestOpen) setUiTick(t => t+1);
                } else if (type === 'FURNACE_UPDATE') {
                    furnacesRef.current.set(payload.key, payload.data);
                    if (activeFurnacePos === payload.key && isFurnaceOpen) setUiTick(t => t+1);
                } else if (type === 'SPAWN_DROP') {
                    // Both Host and Client receive this.
                    // Check if we already have it to avoid duplicates
                    if (!entitiesRef.current.find(e => e.id === payload.id)) {
                        entitiesRef.current.push({
                            ...payload,
                            id: payload.id, 
                            type: 'DROP',
                            creationTime: Date.now()
                        });
                    }
                } else if (type === 'REMOVE_DROP') {
                    entitiesRef.current = entitiesRef.current.filter(e => e.id !== payload.id);
                } else if (type === 'SYNC_ENTITIES') {
                    // Client syncs ALL entities (Mobs + Drops) from Host
                    if (options.multiplayer?.mode === 'CLIENT') {
                        const hostEntities = payload as Entity[];
                        
                        // Merge Strategy: Keep local players, replace everything else (Mobs/Drops) with Host state
                        // This prevents Client physics fighting Host physics
                        const localPlayers = entitiesRef.current.filter(e => e.type === 'PLAYER' || e.type === 'PROJECTILE');
                        
                        const syncedEntities = [...localPlayers, ...hostEntities];
                        entitiesRef.current = syncedEntities;
                    }
                } else if (type === 'DAMAGE_MOB') {
                    // Host receives damage request from Client
                    if (options.multiplayer?.mode === 'HOST') {
                        const targetMob = entitiesRef.current.find(e => e.id === payload.id);
                        if (targetMob) {
                            targetMob.health -= payload.damage;
                            targetMob.lastDamageTime = Date.now();
                            targetMob.vx = payload.knockbackX || 0;
                            targetMob.vy = payload.knockbackY || -3;
                            
                            if (targetMob.health <= 0) {
                                // Loot logic is handled in game loop by Host
                            }
                        }
                    }
                }
            });

            // Periodic Update Loop (Movement & Host Sync & Cleanup)
            const interval = setInterval(() => {
                const p = playerRef.current;
                
                // 1. Send Player Position
                socket.emit('game-event', {
                    type: 'UPDATE',
                    roomId,
                    payload: {
                        id: myPlayerId,
                        x: p.x,
                        y: p.y,
                        vx: p.vx,
                        vy: p.vy,
                        facingRight: p.facingRight,
                        playerName: options.multiplayer?.playerName
                    }
                });

                // 2. Cleanup "Ghost" Players (No heartbeat for > 3 seconds)
                const now = Date.now();
                otherPlayersRef.current = otherPlayersRef.current.filter(op => {
                    return (now - (op.lastSeen || 0)) < 3000;
                });

                // 3. Host Syncs Everything (Mobs + Drops)
                if (options.multiplayer?.mode === 'HOST') {
                    const syncableEntities = entitiesRef.current.filter(e => e.type !== 'PLAYER' && e.type !== 'PROJECTILE');
                    if (syncableEntities.length > 0) {
                        socket.emit('game-event', {
                            type: 'SYNC_ENTITIES',
                            roomId,
                            payload: syncableEntities
                        });
                    }
                } else if (options.multiplayer?.mode === 'CLIENT' && currentSeed === 12345) {
                    // If we are a client and still on the default seed, keep requesting sync
                    socket.emit('game-event', { type: 'REQUEST_SYNC', roomId, payload: {} });
                }

            }, 50); 

            return () => {
                clearInterval(interval);
                socket.disconnect();
            };
        }
    }, [gameState, options.multiplayer, currentSeed, activeChestPos, activeFurnacePos, isChestOpen, isFurnaceOpen]);


    const saveGame = async () => {
        if (!worldRef.current) return;
        const save: SavedWorld = { id: currentWorldId, name: currentWorldName, seed: currentSeed, version: 2, worldData: worldRef.current, player: playerRef.current, inventory: inventory, equipment: equipment, furnaces: Array.from(furnacesRef.current.entries()), chests: Array.from(chestsRef.current.entries()), crops: Array.from(cropsRef.current.entries()), time: timeRef.current, lastPlayed: Date.now(), xp: playerXP, level: playerLevel, skillPoints: skillPoints, stats: playerStats, stamina: staminaRef.current, hunger: hungerRef.current, options: options };
        try { await saveWorldToDB(save); console.log("Game Saved to IndexedDB!"); } catch (e) { console.error("Save failed", e); alert("Failed to save game! Database error."); }
    };

    const handleSaveAndQuit = () => { 
        saveGame().then(() => { 
            setGameState('MENU'); 
            setShowDeathScreen(false);
            audio.stopAllAmbients();
            audio.playMenuMusic();
            worldRef.current = null; 
            setAdminFlags({ noClip: false, nightVision: false, showCreative: false }); 
            setIsAdminMenuOpen(false); 
            setNotifications([]); 
            otherPlayersRef.current = []; 
            if(socketRef.current) socketRef.current.disconnect(); 
        }); 
    };

    const checkTotemRevive = () => {
        // Check Offhand first (standard MC behavior)
        if (equipment.offHand && equipment.offHand.id === 'uranium_totem') {
             // Consume Offhand
             setEquipment(prev => ({...prev, offHand: null}));
             // Revive effects
             playerRef.current.health = 4; // 2 hearts
             setHearts(4);
             // Particle effect
             for(let i=0; i<15; i++) { 
                 entitiesRef.current.push({ 
                     id: generateEntityId(), type: 'PROJECTILE', x: playerRef.current.x + 10, y: playerRef.current.y + 20, width: 4, height: 4, vx: (Math.random() - 0.5) * 8, vy: (Math.random() - 0.5) * 8, grounded: false, health: 1, maxHealth: 1, facingRight: true, itemId: 'uranium', projectileState: 'FLYING', creationTime: Date.now(), itemMeta: { damage: 0 } 
                 }); 
             }
             return true;
        }

        // Then check Inventory
        const totemIndex = inventory.findIndex(item => item && item.id === 'uranium_totem');
        if (totemIndex !== -1) {
            playerRef.current.health = 4; setHearts(4);
            setInventory(prev => { const n = [...prev]; n[totemIndex] = null; return n; });
            for(let i=0; i<15; i++) { entitiesRef.current.push({ id: generateEntityId(), type: 'PROJECTILE', x: playerRef.current.x + 10, y: playerRef.current.y + 20, width: 4, height: 4, vx: (Math.random() - 0.5) * 8, vy: (Math.random() - 0.5) * 8, grounded: false, health: 1, maxHealth: 1, facingRight: true, itemId: 'uranium', projectileState: 'FLYING', creationTime: Date.now(), itemMeta: { damage: 0 } }); }
            return true;
        }
        return false;
    }

    const respawnPlayer = (w: WorldData) => {
        if (checkTotemRevive()) return;
        const midX = Math.floor(WORLD_WIDTH / 2); let spawnY = 0;
        for(let y=0; y<WORLD_HEIGHT; y++) { if (w.blocks[y * WORLD_WIDTH + midX] !== BlockType.AIR) { spawnY = (y - 2) * BLOCK_SIZE; break; } }
        if (spawnY === 0) spawnY = 10 * BLOCK_SIZE;
        playerRef.current.y = spawnY; playerRef.current.x = midX * BLOCK_SIZE; playerRef.current.vx = 0; playerRef.current.vy = 0;
        playerRef.current.highestY = spawnY;
        const maxHP = 10 + playerStats.vitality * 2; playerRef.current.maxHealth = maxHP; playerRef.current.health = maxHP; hungerRef.current = 10; staminaRef.current = MAX_STAMINA + (playerStats.endurance * 20); setHearts(maxHP); setHunger(10);
        playerRef.current.invincibilityEndTime = Date.now() + 3000;
    };

    const gainXP = (amount: number) => {
        setPlayerXP(prev => { let newXP = prev + amount; let currentLevel = playerLevel; let threshold = currentLevel * 100; while (newXP >= threshold) { newXP -= threshold; currentLevel++; setSkillPoints(sp => sp + 1); threshold = currentLevel * 100; } setPlayerLevel(currentLevel); return newXP; });
    };

    const upgradeStat = (statName: keyof PlayerStats) => {
        if (skillPoints > 0) { setPlayerStats(prev => { const updated = { ...prev, [statName]: prev[statName] + 1 }; if (statName === 'vitality') { const newMax = 10 + updated.vitality * 2; playerRef.current.maxHealth = newMax; } return updated; }); setSkillPoints(prev => prev - 1); }
    };

    const getRenderLight = (x: number, y: number, baseLight: number, player: Entity, hasTorch: boolean) => {
        if (adminFlags.nightVision) return 15; let l = baseLight;
        if (hasTorch) { const px = Math.floor((player.x + player.width/2) / BLOCK_SIZE); const py = Math.floor((player.y + player.height/2) / BLOCK_SIZE); const dist = Math.abs(x - px) + Math.abs(y - py); if (dist < 12) l = Math.max(l, 15 - Math.floor(dist * 1.2)); }
        return l;
    };

    const isProtectedFromRadiation = (eq: Equipment): boolean => {
        const isHazmat = eq.helmet?.id === 'hazmat_helmet' && eq.chestplate?.id === 'hazmat_chestplate' && eq.leggings?.id === 'hazmat_leggings' && eq.boots?.id === 'hazmat_boots';
        const isReinforcedIron = eq.helmet?.id === 'reinforced_iron_helmet' && eq.chestplate?.id === 'reinforced_iron_chestplate' && eq.leggings?.id === 'reinforced_iron_leggings' && eq.boots?.id === 'reinforced_iron_boots';
        const isTitanium = eq.helmet?.id === 'titanium_helmet' && eq.chestplate?.id === 'titanium_chestplate' && eq.leggings?.id === 'titanium_leggings' && eq.boots?.id === 'titanium_boots';
        const isUranium = eq.helmet?.id === 'uranium_helmet' && eq.chestplate?.id === 'uranium_chestplate' && eq.leggings?.id === 'uranium_leggings' && eq.boots?.id === 'uranium_boots';
        return isHazmat || isReinforcedIron || isTitanium || isUranium;
    }

    useEffect(() => {
        const handleResize = () => { if (canvasRef.current) { canvasRef.current.width = window.innerWidth; canvasRef.current.height = window.innerHeight; } };
        window.addEventListener('resize', handleResize);
        // Force resize once on mount
        handleResize();
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (isChatOpen || document.activeElement?.tagName === 'INPUT') return;
            if (gameState === 'MENU') return;
            if (e.code === 'Enter' || e.code === 'KeyT') {
                if (gameState === 'PLAYING') {
                     e.preventDefault();
                     setIsChatOpen(true);
                     return;
                }
            }
            if (e.code === 'Escape') { if (isInventoryOpen || isFurnaceOpen || isChestOpen || isHammerMenuOpen || isAdminMenuOpen || isSleepUIOpen || isArmorBenchOpen) { setIsInventoryOpen(false); setIsFurnaceOpen(false); setIsChestOpen(false); setIsHammerMenuOpen(false); setIsAdminMenuOpen(false); setIsSleepUIOpen(false); setIsArmorBenchOpen(false); setActiveBuildBlock(null); setCursorItem(null); } else { setGameState(prev => prev === 'PLAYING' ? 'PAUSED' : 'PLAYING'); } return; }
            if (gameState !== 'PLAYING') return;
            keysRef.current[e.code] = true;
            if (e.code === 'KeyE') { const heldItem = inventory[selectedSlot]; if (heldItem && (heldItem.id?.toString() || '').includes('hammer')) { setIsHammerMenuOpen(true); return; } if (isFurnaceOpen || isChestOpen || isSleepUIOpen || isArmorBenchOpen) { setIsFurnaceOpen(false); setIsChestOpen(false); setIsSleepUIOpen(false); setIsArmorBenchOpen(false); if (cursorItem) setCursorItem(null); } else { if (isInventoryOpen) { setIsInventoryOpen(false); setNearbyStation('NONE'); } else { setIsInventoryOpen(true); setNearbyStation('NONE'); } } }
            if (e.code === 'KeyF') handleInteraction();
            if (e.code === 'KeyL') setShowAchievementsUI(p => !p);
            if (e.code === 'KeyQ') dropItem(selectedSlot, e.ctrlKey ? 64 : 1);
            if (e.code === 'KeyX' && !isInventoryOpen && !isChestOpen && !isFurnaceOpen) {
                treePassRef.current = !treePassRef.current;
                addNotification(lang === 'PT' ? `Atravessar Árvores: ${treePassRef.current ? 'ON' : 'OFF'}` : `Tree Pass: ${treePassRef.current ? 'ON' : 'OFF'}`);
            }
            if (e.code === 'KeyP' && options.adminMode) setIsAdminMenuOpen(p => !p);
            
            // POSTURE TOGGLE (C)
            if (e.code === 'KeyC') {
                if (!e.repeat) {
                    const p = playerRef.current;
                    if (p.posture === 'STAND' || !p.posture) {
                        p.posture = 'CROUCH';
                        p.height = 40; // 1.25 blocks
                        p.y += 16; // Adjust position to prevent floating
                    } else if (p.posture === 'CROUCH') {
                        p.posture = 'PRONE';
                        p.height = 24; // 0.75 blocks
                        p.y += 16; // Adjust position
                    } else if (p.posture === 'PRONE') {
                        // Check if there is space to stand up
                        const oldHeight = p.height;
                        const oldY = p.y;
                        p.height = 56; // 1.75 blocks
                        p.y -= 32; // Adjust position up
                        if (worldRef.current && checkCollision(p, worldRef.current)) {
                            // Try crouching instead
                            p.height = 40;
                            p.y = oldY - 16;
                            if (checkCollision(p, worldRef.current)) {
                                // Can't even crouch, stay prone
                                p.height = oldHeight;
                                p.y = oldY;
                            } else {
                                p.posture = 'CROUCH';
                            }
                        } else {
                            p.posture = 'STAND';
                        }
                    }
                }
            }

            // TREE PASS-THROUGH TOGGLE (PC)
            if (e.code === 'KeyS') {
                if (!e.repeat) {
                    treePassRef.current = !treePassRef.current;
                    addNotification(treePassRef.current ? (lang==='PT' ? "Atravessar Árvores: LIGADO" : "Tree Pass: ON") : (lang==='PT' ? "Atravessar Árvores: DESLIGADO" : "Tree Pass: OFF"));
                }
            }

            if (e.code === 'KeyP') { 
                if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;
                if (options.adminMode) { setIsAdminMenuOpen(prev => !prev); } 
            }
            if (e.code.startsWith('Digit')) { const num = parseInt(e.code.replace('Digit', '')); if (num > 0 && num <= 9) setSelectedSlot(num - 1); }
            if (e.code === 'ShiftLeft') sprintRef.current = true;
            if (e.code === 'KeyR') { setEquipment(prev => ({ ...prev, offHand: inventory[selectedSlot] })); setInventory(prev => { const newInv = [...prev]; newInv[selectedSlot] = equipment.offHand; return newInv; }); }
        };
        const handleKeyUp = (e: KeyboardEvent) => { keysRef.current[e.code] = false; if (e.code === 'ShiftLeft') sprintRef.current = false; };
        const handleMouseDown = (e: MouseEvent) => { 
            if (gameState !== 'PLAYING') return; 
            if (e.button === 0) mouseRef.current.left = true; 
            if (e.button === 1 || e.button === 2) {
                if (equipment.offHand?.type === ItemType.SHIELD) blockingRef.current = true;
            }
            if (e.button === 2) { 
                mouseRef.current.right = true; 
                const heldItem = inventory[selectedSlot]; 
                
                // FISHING INTERACTION
                if (heldItem && heldItem.id === 'fishing_rod' && worldRef.current) {
                    const pCenterX = Math.floor((playerRef.current.x + playerRef.current.width / 2) / BLOCK_SIZE);
                    const pCenterY = Math.floor((playerRef.current.y + playerRef.current.height / 2) / BLOCK_SIZE);
                    let nearWater = false;
                    for (let y = pCenterY - 2; y <= pCenterY + 2; y++) {
                        for (let x = pCenterX - 2; x <= pCenterX + 2; x++) {
                             if (worldRef.current.blocks[y * WORLD_WIDTH + x] === BlockType.WATER) nearWater = true;
                        }
                    }
                    if (nearWater) {
                        setIsFishing(true);
                        return;
                    } else {
                        addNotification(lang === 'PT' ? "Nenhuma água por perto." : "No water nearby.");
                        return;
                    }
                }

                // BUCKET LOGIC
                if (heldItem && (heldItem.id === 'bucket' || heldItem.id === 'water_bucket' || heldItem.id === 'lava_bucket') && worldRef.current) {
                    const bx = Math.floor((mouseRef.current.x + cameraRef.current.x) / BLOCK_SIZE);
                    const by = Math.floor((mouseRef.current.y + cameraRef.current.y) / BLOCK_SIZE);
                    const idx = by * WORLD_WIDTH + bx;
                    const targetBlock = worldRef.current.blocks[idx];

                    if (heldItem.id === 'bucket') {
                        if (targetBlock === BlockType.WATER) {
                            worldRef.current.blocks[idx] = BlockType.AIR;
                            setInventory(prev => { const n = [...prev]; n[selectedSlot] = { id: 'water_bucket', count: 1, type: ItemType.TOOL }; return n; });
                            audio.playPlace(); return;
                        } else if (targetBlock === BlockType.LAVA) {
                            worldRef.current.blocks[idx] = BlockType.AIR;
                            setInventory(prev => { const n = [...prev]; n[selectedSlot] = { id: 'lava_bucket', count: 1, type: ItemType.TOOL }; return n; });
                            audio.playPlace(); return;
                        }
                    } else {
                        if (targetBlock === BlockType.AIR || !NON_COLLIDABLE_BLOCKS.has(targetBlock)) {
                            worldRef.current.blocks[idx] = heldItem.id === 'water_bucket' ? BlockType.WATER : BlockType.LAVA;
                            setInventory(prev => { const n = [...prev]; n[selectedSlot] = { id: 'bucket', count: 1, type: ItemType.TOOL }; return n; });
                            audio.playPlace(); return;
                        }
                    }
                }

                // PLAGUE TOTEM INTERACTION
                if (heldItem && heldItem.id === 'plague_totem') {
                    const mx = mouseRef.current.x + cameraRef.current.x;
                    const my = mouseRef.current.y + cameraRef.current.y;
                    const bx = Math.floor(mx / BLOCK_SIZE);
                    const by = Math.floor(my / BLOCK_SIZE);
                    
                    spawnBoss(bx * BLOCK_SIZE, (by - 2) * BLOCK_SIZE);
                    
                    if (!adminFlags.showCreative) {
                        setInventory(prev => { const n = [...prev]; if (n[selectedSlot]) { n[selectedSlot]!.count--; if (n[selectedSlot]!.count <= 0) n[selectedSlot] = null; } return n; });
                    }
                    return;
                }
                
                if (heldItem && (heldItem.id?.toString() || '').startsWith('spawn_')) {
                    const mobType = (heldItem.id?.toString() || '').replace('spawn_', '').toUpperCase();
                    if (['ZOMBIE', 'PIG', 'COW', 'SHEEP', 'SCORPION', 'CAMEL', 'SNAKE', 'RABBIT', 'MUTANT_ZOMBIE', 'POLAR_BEAR', 'DOG'].includes(mobType)) {
                        const mx = mouseRef.current.x + cameraRef.current.x;
                        const my = mouseRef.current.y + cameraRef.current.y;
                        const bx = Math.floor(mx / BLOCK_SIZE);
                        const by = Math.floor(my / BLOCK_SIZE);
                        
                        if (mobType === 'MUTANT_ZOMBIE') {
                            spawnBoss(bx * BLOCK_SIZE, (by - 2) * BLOCK_SIZE);
                        } else {
                            spawnMob(mobType as any, mx, (by - 2) * BLOCK_SIZE);
                        }
                        
                        if (!adminFlags.showCreative) {
                            setInventory(prev => { const n = [...prev]; if (n[selectedSlot]) { n[selectedSlot]!.count--; if (n[selectedSlot]!.count <= 0) n[selectedSlot] = null; } return n; });
                        }
                        return;
                    }
                }
                
                // CAMEL INTERACTION
                const mx = mouseRef.current.x + cameraRef.current.x;
                const my = mouseRef.current.y + cameraRef.current.y;
                const clickedEntity = entitiesRef.current.find(ent => 
                    mx >= ent.x && mx <= ent.x + ent.width &&
                    my >= ent.y && my <= ent.y + ent.height
                );
                
                if (clickedEntity && clickedEntity.type === 'DOG') {
                    const dist = Math.sqrt(Math.pow(clickedEntity.x - playerRef.current.x, 2) + Math.pow(clickedEntity.y - playerRef.current.y, 2));
                    if (dist < 100) {
                        if (!clickedEntity.isTamed) {
                            if (heldItem && heldItem.id === 'bone') {
                                clickedEntity.tameProgress = (clickedEntity.tameProgress || 0) + 1;
                                setInventory(prev => { const n = [...prev]; if (n[selectedSlot]) { n[selectedSlot]!.count--; if (n[selectedSlot]!.count <= 0) n[selectedSlot] = null; } return n; });
                                
                                // Visuals
                                for(let i=0; i<5; i++) {
                                     entitiesRef.current.push({ 
                                         id: generateEntityId(), type: 'DROP', x: clickedEntity.x + Math.random()*20, y: clickedEntity.y, width: 4, height: 4, vx: 0, vy: -1, grounded: false, health: 1, maxHealth: 1, facingRight: true, itemId: 'bone', creationTime: Date.now(), isParticle: true 
                                     });
                                }

                                if (clickedEntity.tameProgress >= 3 || Math.random() < 0.3) {
                                    clickedEntity.isTamed = true;
                                    clickedEntity.targetId = playerRef.current.id; // Owner
                                    addNotification(lang === 'PT' ? "Cachorro domesticado!" : "Dog tamed!");
                                }
                            }
                        } else if (clickedEntity.targetId === playerRef.current.id) {
                            // Toggle sit/stand
                            clickedEntity.isSitting = !clickedEntity.isSitting;
                            addNotification(lang === 'PT' ? (clickedEntity.isSitting ? "Cachorro sentou" : "Cachorro levantou") : (clickedEntity.isSitting ? "Dog sitting" : "Dog standing"));
                        }
                        return;
                    }
                }

                if (clickedEntity && clickedEntity.type === 'CAMEL') {
                    const dist = Math.sqrt(Math.pow(clickedEntity.x - playerRef.current.x, 2) + Math.pow(clickedEntity.y - playerRef.current.y, 2));
                    if (dist < 100) {
                        if (!clickedEntity.isTamed) {
                            // Taming
                            if (heldItem && heldItem.id === 'cherry') { 
                                clickedEntity.tameProgress = (clickedEntity.tameProgress || 0) + 1;
                                setInventory(prev => { const n = [...prev]; if (n[selectedSlot]) { n[selectedSlot]!.count--; if (n[selectedSlot]!.count <= 0) n[selectedSlot] = null; } return n; });
                                
                                // Visuals
                                for(let i=0; i<5; i++) {
                                     entitiesRef.current.push({ 
                                         id: generateEntityId(), type: 'DROP', x: clickedEntity.x + Math.random()*40, y: clickedEntity.y, width: 4, height: 4, vx: 0, vy: -1, grounded: false, health: 1, maxHealth: 1, facingRight: true, itemId: 'cherry', creationTime: Date.now(), isParticle: true 
                                     });
                                }

                                if (clickedEntity.tameProgress >= 3) {
                                    clickedEntity.isTamed = true;
                                    addNotification(lang === 'PT' ? "Camelo domesticado!" : "Camel tamed!");
                                }
                            }
                        } else {
                            // Tamed
                            if (!clickedEntity.saddle && heldItem && heldItem.id === 'saddle') {
                                clickedEntity.saddle = true;
                                setInventory(prev => { const n = [...prev]; n[selectedSlot] = null; return n; });
                                addNotification(lang === 'PT' ? "Sela equipada!" : "Saddle equipped!");
                            } else if (clickedEntity.saddle && !clickedEntity.riderId) {
                                clickedEntity.riderId = playerRef.current.id;
                                addNotification(lang === 'PT' ? "Montou no camelo!" : "Riding camel!");
                            }
                        }
                        return; 
                    }
                }

                // Spear Charge
                if (heldItem && (heldItem.id?.toString() || '').includes('spear') && !(heldItem.id?.toString() || '').includes('hunting')) { 
                    spearChargeStartRef.current = Date.now(); 
                }
                
                // Eating Start
                if (heldItem && (heldItem.type === ItemType.FOOD || FOOD_VALUES[(heldItem.id?.toString() || '')] || heldItem.id === 'apple' || (heldItem.id?.toString() || '').startsWith('potion_'))) {
                    let preventEating = false;
                    if (heldItem.id === 'wheat_seeds' || heldItem.id === 'carrot' || heldItem.id === 'potato') {
                        const cvs = canvasRef.current;
                        if (cvs) {
                            const rect = cvs.getBoundingClientRect();
                            const mx = e.clientX - rect.left;
                            const my = e.clientY - rect.top;
                            const bx = Math.floor((mx + cameraRef.current.x) / BLOCK_SIZE);
                            const by = Math.floor((my + cameraRef.current.y) / BLOCK_SIZE);
                            if (worldRef.current && bx >= 0 && bx < WORLD_WIDTH && by >= 0 && by < WORLD_HEIGHT) {
                                const targetBlock = worldRef.current.blocks[by * WORLD_WIDTH + bx];
                                if (targetBlock === BlockType.FARMLAND && by > 0 && worldRef.current.blocks[(by - 1) * WORLD_WIDTH + bx] === BlockType.AIR) {
                                    preventEating = true;
                                }
                            }
                        }
                    }
                    if (!preventEating) {
                        eatingStartRef.current = Date.now();
                    }
                }
            } 
        };
        const handleMouseUp = (e: MouseEvent) => {
            if (e.button === 0) { mouseRef.current.left = false; breakingRef.current = { x: -1, y: -1, progress: 0 }; }
            if (e.button === 1 || e.button === 2) {
                blockingRef.current = false;
            }
            if (e.button === 2) {
                mouseRef.current.right = false;
                eatingStartRef.current = null; // Stop eating on release

                const heldItem = inventory[selectedSlot];
                if (heldItem && heldItem.type === ItemType.ARMOR) { const idStr = (heldItem.id?.toString() || ''); let slot: keyof Equipment | null = null; if (idStr.includes('helmet')) slot = 'helmet'; else if (idStr.includes('chestplate')) slot = 'chestplate'; else if (idStr.includes('leggings')) slot = 'leggings'; else if (idStr.includes('boots')) slot = 'boots'; if (slot) { const currentEquip = equipment[slot]; setEquipment(prev => ({ ...prev, [slot]: heldItem })); setInventory(prev => { const n = [...prev]; n[selectedSlot] = currentEquip; return n; }); return; } }
                const bx = Math.floor((mouseRef.current.x + cameraRef.current.x) / BLOCK_SIZE); const by = Math.floor((mouseRef.current.y + cameraRef.current.y) / BLOCK_SIZE);
                if (worldRef.current) { const idx = by * WORLD_WIDTH + bx; const b = worldRef.current.blocks[idx]; if (b === BlockType.DOOR_BOTTOM_CLOSED) { setBlockAt(bx, by, BlockType.DOOR_BOTTOM_OPEN); setBlockAt(bx, by - 1, BlockType.DOOR_TOP_OPEN); } else if (b === BlockType.DOOR_BOTTOM_OPEN) { setBlockAt(bx, by, BlockType.DOOR_BOTTOM_CLOSED); setBlockAt(bx, by - 1, BlockType.DOOR_TOP_CLOSED); } else if (b === BlockType.DOOR_TOP_CLOSED) { setBlockAt(bx, by, BlockType.DOOR_TOP_OPEN); setBlockAt(bx, by + 1, BlockType.DOOR_BOTTOM_OPEN); } else if (b === BlockType.DOOR_TOP_OPEN) { setBlockAt(bx, by, BlockType.DOOR_TOP_CLOSED); setBlockAt(bx, by + 1, BlockType.DOOR_BOTTOM_CLOSED); } }
                const heldId = heldItem ? (heldItem.id?.toString() || '') : '';
                if (heldId === 'bow' || heldId === 'crossbow') { const arrowIdx = inventory.findIndex(i => i && i.id === 'arrow' && i.count > 0); if (arrowIdx !== -1) { const isCrossbow = heldId === 'crossbow'; const cooldown = isCrossbow ? 3000 : 1000; if ((playerRef.current.attackCooldown || 0) <= 0) { const cvs = canvasRef.current; if (cvs) { const mx = mouseRef.current.x; const my = mouseRef.current.y; const px = playerRef.current.x + playerRef.current.width/2 - cameraRef.current.x; const py = playerRef.current.y + playerRef.current.height/2 - cameraRef.current.y; const angle = Math.atan2(my - py, mx - px); const force = 15; const shotCount = isCrossbow ? 3 : 1; for(let i=0; i<shotCount; i++) { const spread = isCrossbow ? (i - 1) * 0.1 : 0; const vx = Math.cos(angle + spread) * force; const vy = Math.sin(angle + spread) * force; entitiesRef.current.push({ id: generateEntityId(), type: 'PROJECTILE', x: playerRef.current.x + (vx > 0 ? 20 : -10), y: playerRef.current.y + 10, width: 16, height: 4, vx, vy, grounded: false, health: 1, maxHealth: 1, facingRight: vx > 0, rotation: angle + spread, itemId: 'arrow', projectileState: 'FLYING', ownerId: playerRef.current.id, creationTime: Date.now() }); } setInventory(prev => { const newInv = [...prev]; if (newInv[arrowIdx]) { newInv[arrowIdx]!.count--; if (newInv[arrowIdx]!.count <= 0) newInv[arrowIdx] = null; } return newInv; }); playerRef.current.attackCooldown = cooldown / 16; } } } }
                if (spearChargeStartRef.current) { const chargeTime = Date.now() - spearChargeStartRef.current; const osc = (Math.sin(chargeTime / 300) + 1) / 2; spearChargeStartRef.current = null; if (heldItem && (heldItem.id?.toString() || '').includes('spear') && !(heldItem.id?.toString() || '').includes('hunting')) { const force = 10 + (osc * 15); const cvs = canvasRef.current; if(cvs) { const mx = mouseRef.current.x; const my = mouseRef.current.y; const px = playerRef.current.x + playerRef.current.width/2 - cameraRef.current.x; const py = playerRef.current.y + playerRef.current.height/2 - cameraRef.current.y; const angle = Math.atan2(my - py, mx - px); const vx = Math.cos(angle) * force; const vy = Math.sin(angle) * force; 
                
                // REMOVED LEVEL LOGIC FOR SPEAR RETURN TIME
                let returnTime = 0;

                entitiesRef.current.push({ id: generateEntityId(), type: 'PROJECTILE', x: playerRef.current.x + (vx > 0 ? 20 : -10), y: playerRef.current.y + 10, width: 32, height: 8, vx, vy, grounded: false, health: 1, maxHealth: 1, facingRight: vx > 0, rotation: angle, itemId: heldItem.id, projectileState: 'FLYING', ownerId: playerRef.current.id, loyalty: heldItem.meta?.loyalty, creationTime: Date.now(), itemMeta: heldItem.meta, returnTime }); setInventory(prev => { const n = [...prev]; n[selectedSlot] = null; return n; }); } } }
            }
        };
        const handleMouseMove = (e: MouseEvent) => { setUiMousePos({ x: e.clientX, y: e.clientY }); if (canvasRef.current) { const pos = getMousePos(canvasRef.current, e); mouseRef.current.x = pos.x; mouseRef.current.y = pos.y; } };
        
        // Touch handler for aiming on canvas
        const handleTouchStart = (e: TouchEvent) => {
            if (options.isMobile && gameState === 'PLAYING' && canvasRef.current) {
                const rect = canvasRef.current.getBoundingClientRect();
                const touch = e.touches[0];
                const x = touch.clientX - rect.left;
                const y = touch.clientY - rect.top;
                mouseRef.current.x = x;
                mouseRef.current.y = y;
            }
        };

        window.addEventListener('keydown', handleKeyDown); window.addEventListener('keyup', handleKeyUp); window.addEventListener('mousedown', handleMouseDown); window.addEventListener('mouseup', handleMouseUp); window.addEventListener('mousemove', handleMouseMove); window.addEventListener('contextmenu', (e) => e.preventDefault());
        
        if (options.isMobile) {
            window.addEventListener('touchstart', handleTouchStart);
            window.addEventListener('touchmove', handleTouchStart);
        }

        requestRef.current = requestAnimationFrame(gameLoop);
        return () => { 
            window.removeEventListener('keydown', handleKeyDown); window.removeEventListener('keyup', handleKeyUp); window.removeEventListener('mousedown', handleMouseDown); window.removeEventListener('mouseup', handleMouseUp); window.removeEventListener('mousemove', handleMouseMove); if (requestRef.current) cancelAnimationFrame(requestRef.current);
            if (options.isMobile) {
                window.removeEventListener('touchstart', handleTouchStart);
                window.removeEventListener('touchmove', handleTouchStart);
            }
        };
    }, [gameState, cursorItem, isFurnaceOpen, isChestOpen, isInventoryOpen, inventory, selectedSlot, playerStats, equipment, isHammerMenuOpen, activeBuildBlock, options.adminMode, isSleepUIOpen, options.isMobile, isArmorBenchOpen, isChatOpen]); 

    useEffect(() => {
        if (gameState !== 'PLAYING' || options.tutorialEnabled === false || unlockedAchievements.includes(0)) return;
        
        if (tutorialStep === 0) {
            const stickCount = inventory.reduce((acc, item) => acc + (item && item.id === 'stick' ? item.count : 0), 0);
            if (stickCount >= 3) {
                setTutorialStep(1);
            }
        } else if (tutorialStep === 1) {
            const hasAxe = inventory.some(i => i && i.id === 'basic_axe') || equipment.offHand?.id === 'basic_axe';
            if (hasAxe) {
                setTutorialStep(2);
            }
        } else if (tutorialStep === 2) {
            const hasCraftingTable = inventory.some(i => i && i.id === 13);
            if (hasCraftingTable) {
                setTutorialStep(3);
                checkAchievement(0);
                addNotification(lang === 'PT' ? 'Tutorial Concluído!' : 'Tutorial Completed!');
            }
        }
    }, [inventory, equipment, tutorialStep, gameState, options.tutorialEnabled, unlockedAchievements, checkAchievement, lang]);

    // --- GAME LOOP ---
    const gameLoop = () => {
        if (gameState !== 'PLAYING') { requestRef.current = requestAnimationFrame(gameLoop); if (gameState === 'PAUSED' && canvasRef.current) { const ctx = canvasRef.current.getContext('2d'); if(ctx) { ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height); } } return; }
        const player = playerRef.current; const world = worldRef.current; const cvs = canvasRef.current; if (!world || !cvs) return; const ctx = cvs.getContext('2d'); if (!ctx) return;
        const isPaused = isInventoryOpen || isFurnaceOpen || isChestOpen || isHammerMenuOpen || isAdminMenuOpen || isSleepUIOpen || isArmorBenchOpen || isChatOpen;
        
        let curTempState: 'NORMAL' | 'HOT' | 'COLD' = 'NORMAL';
        if (temperatureRef.current > 85) curTempState = 'HOT';
        else if (temperatureRef.current < 15) curTempState = 'COLD';

        if (!isPaused) {
            // Slow motion frame skipping logic
            if (cheatTimeMultiplier === -1) {
                 if (Date.now() % 32 < 16) { 
                      requestRef.current = requestAnimationFrame(gameLoop);
                      return;
                 }
            }

            if (cheatTimeMultiplier !== 0) {
                timeRef.current = (timeRef.current + (cheatTimeMultiplier > 0 ? Math.floor(cheatTimeMultiplier) : 1)) % FULL_DAY_TICKS;
            }
            
            if (timeRef.current % 30 === 0) { // Every 0.5 seconds (at 60fps)
                const isDay = timeRef.current < DUSK_START || timeRef.current >= DAWN_START;
                const wx = world.weather ? world.weather.type : 'CLEAR';
                const isRaining = wx === 'RAIN' || wx === 'HEAVY_RAIN';
                const px = Math.floor(player.x / BLOCK_SIZE);
                const py = Math.floor(player.y / BLOCK_SIZE);
                const inWater = world.blocks[py * WORLD_WIDTH + px] === BlockType.WATER || world.blocks[(py+1) * WORLD_WIDTH + px] === BlockType.WATER;
                audio.updateAmbient(isRaining, false, isDay, inWater);
            }
            
            if (timeRef.current === DUSK_START) {
                const r = Math.random();
                if (r < 0.15) {
                    moonPhaseRef.current = 'BLOOD';
                    addNotification(lang === 'PT' ? "A Lua de Sangue está surgindo..." : "The Blood Moon is rising...");
                } else if (r < 0.45) {
                    moonPhaseRef.current = 'FULL';
                } else {
                    moonPhaseRef.current = 'NORMAL';
                }
            }
            
            // --- WEATHER SYSTEM ---
            if (!world.weather) world.weather = { type: 'CLEAR', intensity: 0, duration: 0 };
            if (world.weather.duration > 0) {
                // SNOW ACCUMULATION
                if ((world.weather.type === 'RAIN' || world.weather.type === 'HEAVY_RAIN') && timeRef.current % 30 === 0) {
                    for(let i=0; i<3; i++) {
                        const rx = Math.floor(Math.random() * WORLD_WIDTH);
                        // Biome check
                        const biomeNoise = Math.abs(rx / 500) % 4; // roughly
                        if (true) {
                            // Find ground
                            for(let y=0; y<WORLD_HEIGHT; y++) {
                                const b = world.blocks[y * WORLD_WIDTH + rx];
                                if (b !== BlockType.AIR && b !== BlockType.WATER && b !== BlockType.ICE && b !== BlockType.SNOW_BLOCK) {
                                    if (b === BlockType.SNOWY_GRASS || b === BlockType.SNOWY_LEAVES || b === BlockType.PINE_LEAVES || b === BlockType.PINE_WOOD) {
                                       world.blocks[(y - 1) * WORLD_WIDTH + rx] = BlockType.SNOW_BLOCK;
                                    }
                                    break;
                                }
                            }
                        }
                    }
                }
                world.weather.duration--;
                if (world.weather.duration === 0) {
                    world.weather.type = 'CLEAR';
                    world.weather.intensity = 0;
                } else if (world.weather.type === 'HEAVY_RAIN' && Math.random() < 0.05 && entitiesRef.current.length < 60) {
                    // Heavy rain spawns zombies
                    spawnMob('ZOMBIE');
                }
            } else if (Math.random() < adminFlags.rainChance) { // Chance to start weather
                const r = Math.random();
                if (r < 0.7) {
                    world.weather.type = 'RAIN';
                    world.weather.intensity = 0.5 + Math.random() * 0.5;
                    world.weather.duration = 10800; // 3 minutes at 60fps
                } else {
                    world.weather.type = 'HEAVY_RAIN';
                    world.weather.intensity = 1.0;
                    world.weather.duration = 10800; // 3 minutes at 60fps
                }
            }

            const animals = entitiesRef.current.filter(e => e.type !== 'DROP' && e.type !== 'PROJECTILE' && e.type !== 'PLAYER'); if (animals.length > 50) { const toRemove = animals.length - 50; let removed = 0; for (let i = 0; i < entitiesRef.current.length; i++) { if (removed >= toRemove) break; const e = entitiesRef.current[i]; if (['COW','PIG','SHEEP','ZOMBIE'].includes(e.type)) { entitiesRef.current.splice(i, 1); i--; removed++; } } }
            // --- POISON EFFECT ---
            if ((player as any).poisonEndTime && (player as any).poisonEndTime > Date.now()) {
                if (Date.now() - (lastRadiationDamageRef.current || 0) > 1000) {
                    if (player.health > 2) { // Reduce to 1 heart (2 health)
                        player.health -= 1;
                        lastRadiationDamageRef.current = Date.now();
                        setHearts(player.health);
                    }
                }
            }

            // --- RADIATION DAMAGE ---
            // Check for uranium in inventory
            let hasUranium = false;
            if (inventory.some(i => i && i.id === 'uranium')) hasUranium = true;
            
            // Check for Hazmat Suit
            const hasHazmat = equipment.helmet?.id === 'hazmat_helmet' && equipment.chestplate?.id === 'hazmat_chestplate' && equipment.leggings?.id === 'hazmat_leggings' && equipment.boots?.id === 'hazmat_boots';

            if (hasUranium && !hasHazmat && !['GOD', 'CREATIVE', 'SPECTATOR'].includes(options.gameMode || 'SURVIVAL')) {
                if (Date.now() - (lastRadiationDamageRef.current || 0) > 2000) {
                    player.health -= 1;
                    lastRadiationDamageRef.current = Date.now();
                    setHearts(player.health);
                    addNotification(lang === 'PT' ? "Radiação detectada!" : "Radiation detected!");
                    if (player.health <= 0) {
                        // Handle death
                        player.health = 0;
                        setHearts(0);
                    }
                }
            }
            const maxStamina = MAX_STAMINA + (playerStats.endurance * 20); const drainEfficiency = Math.max(0.1, 1 - (playerStats.endurance * 0.05)); const regenEfficiency = 1 + (playerStats.endurance * 0.1); if (!sprintRef.current) { if (staminaRef.current < maxStamina && hungerRef.current > 0) staminaRef.current = Math.min(maxStamina, staminaRef.current + (BASE_STAMINA_REGEN * regenEfficiency)); } else { if (Math.abs(player.vx) > PLAYER_SPEED) { if (staminaRef.current > 0) staminaRef.current = Math.max(0, staminaRef.current - (BASE_STAMINA_DRAIN * drainEfficiency)); else hungerRef.current = Math.max(0, hungerRef.current - SPRINT_HUNGER_DRAIN); } }
            const decayInterval = (HUNGER_DECAY_TICK + (playerStats.metabolism * 1000)) * (options.difficulty === 'EASY' ? 1.5 : 1); 
            if (!['GOD', 'CREATIVE', 'SPECTATOR'].includes(options.gameMode || 'SURVIVAL') && timeRef.current % decayInterval < 1 && hungerRef.current > 0) hungerRef.current = Math.max(0, hungerRef.current - 0.5);
            
            // Natural health regeneration if not dead
            if (player.health > 0 && player.health < player.maxHealth) {
                // Natural regeneration
                if (timeRef.current % 120 === 0) {
                    player.health = Math.min(player.maxHealth, player.health + 0.5);
                }
                // Potion regeneration (faster)
                if (activePotionsRef.current['potion_regen'] && activePotionsRef.current['potion_regen'] > Date.now()) {
                    if (timeRef.current % 30 === 0) {
                        player.health = Math.min(player.maxHealth, player.health + 1);
                    }
                }
            }
            
            // --- TEMPERATURE MECHANIC ---
            if (timeRef.current % 10 === 0 && !['GOD', 'CREATIVE', 'SPECTATOR'].includes(options.gameMode || 'SURVIVAL')) {
                const px = Math.floor(player.x / BLOCK_SIZE);
                const py = Math.floor(player.y / BLOCK_SIZE);
                let envTemp = 50;
                const curBiome = getBiome(player.x / BLOCK_SIZE, currentSeed);
                if (curBiome === 'snow') envTemp -= 30;
                if (curBiome === 'desert') envTemp += 20;
                
                // Check nearby heat sources
                let nearHeat = false;
                for (let yy = Math.max(0, py - 3); yy <= Math.min(WORLD_HEIGHT-1, py + 3); yy++) {
                    for (let xx = Math.max(0, px - 3); xx <= Math.min(WORLD_WIDTH-1, px + 3); xx++) {
                        const b = world.blocks[yy * WORLD_WIDTH + xx];
                        if (b === BlockType.LAVA || b === BlockType.CAMPFIRE || b === BlockType.FURNACE) {
                            nearHeat = true;
                            envTemp += 40;
                            break;
                        } else if (b === BlockType.ICE || b === BlockType.SNOW_BLOCK) {
                            envTemp -= 10;
                        }
                    }
                    if (nearHeat) break;
                }

                // Smooth temp transition
                if (temperatureRef.current < envTemp) temperatureRef.current = Math.min(100, temperatureRef.current + 0.5);
                if (temperatureRef.current > envTemp) temperatureRef.current = Math.max(0, temperatureRef.current - 0.5);
                
                if (temperatureRef.current > 85) curTempState = 'HOT';
                else if (temperatureRef.current < 15) curTempState = 'COLD';
                else curTempState = 'NORMAL';
                
                setTemperatureState(curTempState);
                
                if (curTempState === 'HOT') {
                    if (Math.random() < 0.1 && (timeRef.current % 60 === 0)) {
                        player.health -= 1;
                        setHearts(player.health);
                        addNotification("Está muito quente!");
                        setChatMessages(p => [...p, {msg: "Você está pegando fogo!", color: '#ffaa00'}]);
                    }
                } else if (curTempState === 'COLD') {
                    if (Math.random() < 0.1 && (timeRef.current % 60 === 0)) {
                        player.health -= 1;
                        setHearts(player.health);
                        addNotification("Está congelando!");
                        setChatMessages(p => [...p, {msg: "Você está congelando!", color: '#00ffff'}]);
                    }
                }
            }

            if (timeRef.current % 60 === 0) { 
                cropsRef.current.forEach((crop, key) => { 
                    if (crop.stage < 3) { 
                        const elapsed = Date.now() - crop.plantedTime;
                        // 1 minute = 60000ms. 3 stages = 20000ms per stage
                        if (elapsed >= 60000) {
                            crop.stage = 3;
                        } else if (elapsed >= 40000) {
                            crop.stage = 2;
                        } else if (elapsed >= 20000) {
                            crop.stage = 1;
                        }
                    } 
                }); 
            }
            if ((Math.abs(timeRef.current - DUSK_START) < 5) || (Math.abs(timeRef.current - NIGHT_START) < 5) || (Math.abs(timeRef.current - DAWN_START) < 5)) updateLighting(world, timeRef.current);
            if (timeRef.current % 1000 === 0) updateLighting(world, timeRef.current);
            if (timeRef.current < DUSK_START && world.light[0] < 15 && timeRef.current % 60 === 0) updateLighting(world, timeRef.current);
            if (timeRef.current % 10 === 0) updateFluids(world);
            furnacesRef.current.forEach((furnace) => { let dirty = false; if (furnace.burnTime > 0) { furnace.burnTime--; dirty = true; } else if (furnace.burnTime <= 0 && furnace.input && furnace.fuel && furnace.input.count > 0 && furnace.fuel.count > 0) { const outputId = COOKING_RECIPES[(furnace.input.id?.toString() || '')]; if (outputId) { if (!furnace.output || (furnace.output.id === outputId && furnace.output.count < 64)) { const fuelVal = FUEL_VALUES[(furnace.fuel.id?.toString() || '')]; if (fuelVal) { furnace.maxBurnTime = fuelVal; furnace.burnTime = fuelVal; furnace.fuel.count--; if(furnace.fuel.count <= 0) furnace.fuel = null; dirty = true; } } } } if (furnace.burnTime > 0 && furnace.input) { const outputId = COOKING_RECIPES[(furnace.input.id?.toString() || '')]; if (outputId) { if (!furnace.output || (furnace.output.id === outputId && furnace.output.count < 64)) { furnace.cookTime++; if (furnace.cookTime >= 200) { furnace.cookTime = 0; furnace.input.count--; if (furnace.input.count <= 0) furnace.input = null; 
            
            // FIXED: Set Correct Output Type
            const isBlock = !isNaN(Number(outputId)); 
            if (!furnace.output) furnace.output = { id: outputId, count: 1, type: isBlock ? ItemType.BLOCK : (outputId.includes('ingot') || outputId === 'diamond' || outputId.includes('resin') ? ItemType.MATERIAL : ItemType.FOOD) }; 
            else furnace.output.count++; 
            
            } dirty = true; } else furnace.cookTime = 0; } else furnace.cookTime = 0; } else if (furnace.cookTime > 0) { furnace.cookTime = 0; dirty = true; } });
            if ((isFurnaceOpen || isChestOpen) && timeRef.current % 10 === 0) setUiTick(t => t+1);
            
            if (timeRef.current % 60 === 0) {
                const maxDistSquared = Math.pow((options.renderDistance || 15) * 16 * BLOCK_SIZE, 2);
                entitiesRef.current = entitiesRef.current.filter(e => {
                    if (e.type === 'PLAYER' || e.isTamed) return true;
                    // Keep drops around a bit longer? Actually drops can despawn if too far to save memory
                    if (e.type === 'DROP' && e.creationTime && Date.now() - e.creationTime < 1000 * 60 * 5) {
                        return true; // Keep drops up to 5 mins regardless of distance, up to a limit
                    }
                    const distSq = Math.pow(e.x - player.x, 2) + Math.pow(e.y - player.y, 2);
                    return distSq < maxDistSquared;
                });
            }

            const isDay = timeRef.current >= 0 && timeRef.current < DUSK_START;
            if (Math.random() < 0.02 && entitiesRef.current.length < 50) { 
                const r = Math.random(); 
                if (isDay && r < 0.3) {
                    const types: any[] = ['PIG', 'SHEEP', 'COW', 'CAMEL', 'SNAKE', 'RABBIT', 'POLAR_BEAR', 'DOG'];
                    spawnMob(types[Math.floor(Math.random() * types.length)]);
                }
                else if (!isDay && r < 0.5) {
                    const isRaining = world.weather && (world.weather.type === 'RAIN' || world.weather.type === 'HEAVY_RAIN');
                    let zombieTypes = ['ZOMBIE'];
                    
                    if (moonPhaseRef.current === 'BLOOD') {
                        zombieTypes = ['ZOMBIE', 'ZOMBIE_RUNNER', 'ZOMBIE_TANK', 'ZOMBIE_EXPLOSIVE', 'ZOMBIE_TOXIC', 'ZOMBIE_SKELETON', 'ZOMBIE_INFECTOR', 'ZOMBIE_DARK', 'ZOMBIE_KING'];
                        if (Math.random() < 0.5) spawnMob(zombieTypes[Math.floor(Math.random() * zombieTypes.length)] as any); // Extra spawn
                    } else if (moonPhaseRef.current === 'FULL') {
                        zombieTypes = ['ZOMBIE', 'ZOMBIE_TANK', 'ZOMBIE_EXPLOSIVE', 'ZOMBIE_TOXIC', 'ZOMBIE_KING'];
                    } else {
                        if (isRaining) zombieTypes.push('ZOMBIE_RUNNER', 'ZOMBIE_TOXIC');
                        zombieTypes.push('ZOMBIE_SKELETON');
                    }
                    
                    const types: any[] = [...zombieTypes, 'SCORPION', 'SNAKE', 'POLAR_BEAR', 'DOG'];
                    spawnMob(types[Math.floor(Math.random() * types.length)]);
                } 
            }

            if (Math.random() < 0.05 && entitiesRef.current.length < 50) { 
                const playerBlockY = Math.floor(player.y / BLOCK_SIZE);
                if (playerBlockY > 30) {
                     const spawnDistX = 20 + Math.floor(Math.random() * 20);
                     const spawnX = Math.floor(player.x/BLOCK_SIZE) + (Math.random() < 0.5 ? 1 : -1) * spawnDistX;
                     let spawnY = -1;
                     if (spawnX > 0 && spawnX < WORLD_WIDTH) {
                          const startY = Math.max(0, playerBlockY - 10);
                          const endY = Math.min(WORLD_HEIGHT - 1, playerBlockY + 10);
                          for (let y = startY; y < endY; y++) {
                              if (world.blocks[y * WORLD_WIDTH + spawnX] === BlockType.AIR && world.blocks[(y+1) * WORLD_WIDTH + spawnX] !== BlockType.AIR) {
                                  spawnY = y;
                                  break;
                              }
                          }
                          if (spawnY > 0) {
                               let hasWeb = false;
                               let hasMoss = false;
                               for (let dy = -3; dy <= 3; dy++) {
                                   for (let dx = -3; dx <= 3; dx++) {
                                       const bx = spawnX + dx;
                                       const by = spawnY + dy;
                                       if (bx >= 0 && bx < WORLD_WIDTH && by >= 0 && by < WORLD_HEIGHT) {
                                            const b = world.blocks[by * WORLD_WIDTH + bx];
                                            if (b === BlockType.COBWEB) hasWeb = true;
                                            if (b === BlockType.MOSS || b === BlockType.VINES) hasMoss = true;
                                       }
                                   }
                               }
                               
                               if (hasWeb && Math.random() < 0.8) spawnMob('SPIDER', spawnX * BLOCK_SIZE, (spawnY-1) * BLOCK_SIZE);
                               else if (hasMoss && Math.random() < 0.8) {
                                    const mob = { id: generateEntityId(), type: 'BUSH_MOB', x: spawnX * BLOCK_SIZE, y: (spawnY-1) * BLOCK_SIZE, width: 24, height: 24, vx: 0, vy: 0, grounded: false, health: 15, maxHealth: 15, facingRight: true, attackCooldown: 0, isSleeping: true };
                                    entitiesRef.current.push(mob as any);
                               }
                               else if (Math.random() < 0.1) spawnMob('ZOMBIE', spawnX * BLOCK_SIZE, (spawnY-1) * BLOCK_SIZE);
                          }
                     }
                }
            }

            let pCenterX = Math.floor((player.x + player.width/2)/BLOCK_SIZE);
            let pCenterY = Math.floor((player.y + player.height/2)/BLOCK_SIZE);
            let pEndY = Math.floor((player.y + player.height) / BLOCK_SIZE);
            
            // Check environment speed modifiers (moss, cobweb, climbing vines)
            const standingOnIdx = pEndY * WORLD_WIDTH + pCenterX;
            const inBlockIdx = pCenterY * WORLD_WIDTH + pCenterX;
            let envSpeedMultiplier = 1;

            if (world.blocks[standingOnIdx] === BlockType.MOSS || world.blocks[inBlockIdx] === BlockType.MOSS) {
                envSpeedMultiplier = 0.5; // Slower on moss
            }
            if (world.blocks[inBlockIdx] === BlockType.COBWEB) {
                envSpeedMultiplier = 0.2; // Much slower in cobwebs
            }

            const baseSpeed = PLAYER_SPEED + (playerStats.agility * 0.5); const runSpeed = PLAYER_RUN_SPEED + (playerStats.agility * 0.8); let speed = (sprintRef.current && (hungerRef.current > 3 || staminaRef.current > 0)) ? runSpeed : baseSpeed;
            if (temperatureState === 'COLD') speed *= 0.6;
            speed *= envSpeedMultiplier;
            if (player.posture === 'CROUCH') speed *= 0.5;
            if (player.posture === 'PRONE') speed *= 0.25;
            if ((player as any).freezeEndTime && (player as any).freezeEndTime > Date.now()) speed *= 0.5;
            
            // --- LADDER PHYSICS & MOUNT LOGIC ---
            let blockAtFeet = world.blocks[pCenterY * WORLD_WIDTH + pCenterX];
            let isOnLadder = blockAtFeet === BlockType.LADDER || blockAtFeet === BlockType.VINES || blockAtFeet === BlockType.MOSS;

            const mount = entitiesRef.current.find(e => e.riderId === player.id);
            if (mount) {
                // Player is riding
                player.x = mount.x + (mount.facingRight ? 10 : -10);
                player.y = mount.y - 20;
                player.vx = mount.vx;
                player.vy = mount.vy;
                player.facingRight = mount.facingRight;
                player.grounded = mount.grounded;
                
                // Update grid position after mount movement
                pCenterX = Math.floor((player.x + player.width/2)/BLOCK_SIZE);
                pCenterY = Math.floor((player.y + player.height/2)/BLOCK_SIZE);
                blockAtFeet = world.blocks[pCenterY * WORLD_WIDTH + pCenterX];
                isOnLadder = blockAtFeet === BlockType.LADDER || blockAtFeet === BlockType.VINES || blockAtFeet === BlockType.MOSS;
                player.highestY = player.y;

                // Dismount
                if (keysRef.current['ShiftLeft']) {
                    mount.riderId = undefined;
                    player.y -= 20;
                    player.vy = -5;
                }
                
                // Skip standard physics
                isClimbingRef.current = false;
                isOnLadder = false; // Cannot climb while mounted
            } else {

            // --- LADDER PHYSICS ---
            
            if (!isOnLadder) isClimbingRef.current = false;

            if (isClimbingRef.current) {
                player.vx = 0;
                player.vy = 0;
                const climbSpeed = 3;
                if (keysRef.current['KeyW']) player.vy = -climbSpeed;
                if (keysRef.current['KeyS']) player.vy = climbSpeed;
                if (keysRef.current['KeyA']) { player.vx = -climbSpeed; }
                if (keysRef.current['KeyD']) { player.vx = climbSpeed; }
                if (keysRef.current['Space']) {
                    isClimbingRef.current = false;
                    player.vy = -JUMP_FORCE * 0.8;
                }
                
                player.x += player.vx;
                if (checkCollision(player, world)) { player.x -= player.vx; player.vx = 0; }
                player.y += player.vy;
                if (checkCollision(player, world)) { player.y -= player.vy; player.vy = 0; }
                
                player.highestY = player.y;
            } else if (blockingRef.current) { if (keysRef.current['KeyA']) { player.vx = -speed * 0.3; } else if (keysRef.current['KeyD']) { player.vx = speed * 0.3; } else { player.vx *= 0.8; } } else { if (keysRef.current['KeyA']) { player.vx = -speed; } else if (keysRef.current['KeyD']) { player.vx = speed; } else { player.vx *= 0.8; } }
            
            // Face mouse direction
            const worldMouseX = mouseRef.current.x + cameraRef.current.x;
            player.facingRight = worldMouseX > (player.x + player.width/2);
            
            if (!isClimbingRef.current) {
                if (adminFlags.noClip) { const flySpeed = speed * 1.5; player.vx = 0; player.vy = 0; if (keysRef.current['KeyW']) player.vy = -flySpeed; if (keysRef.current['KeyS']) player.vy = flySpeed; if (keysRef.current['KeyA']) { player.vx = -flySpeed; player.facingRight = false; } if (keysRef.current['KeyD']) { player.vx = flySpeed; player.facingRight = true; } player.x += player.vx; player.y += player.vy; player.grounded = false; player.highestY = player.y; } else { 
                    const pCenterYWater = Math.floor((player.y + player.height/2) / BLOCK_SIZE);
                    const feetYWater = Math.floor((player.y + player.height - 4) / BLOCK_SIZE);
                    const headYWater = Math.floor((player.y + 4) / BLOCK_SIZE);
                    const inWaterCenter = world.blocks[pCenterYWater * WORLD_WIDTH + pCenterX] === BlockType.WATER || world.blocks[pCenterYWater * WORLD_WIDTH + pCenterX] === BlockType.LAVA;
                    const inWaterFeet = world.blocks[feetYWater * WORLD_WIDTH + pCenterX] === BlockType.WATER || world.blocks[feetYWater * WORLD_WIDTH + pCenterX] === BlockType.LAVA;
                    const inWaterHead = world.blocks[headYWater * WORLD_WIDTH + pCenterX] === BlockType.WATER || world.blocks[headYWater * WORLD_WIDTH + pCenterX] === BlockType.LAVA;
                    const inWater = inWaterCenter || inWaterFeet || inWaterHead;
                    
                    if (inWater && sprintRef.current && (keysRef.current['KeyA'] || keysRef.current['KeyD'] || keysRef.current['KeyW'] || keysRef.current['KeyS'])) {
                        if (player.posture !== 'PRONE') {
                            player.posture = 'PRONE';
                            player.height = 24;
                            player.y += (56 - 24);
                        }
                        (player as any).wasSwimming = true;
                    } else if (player.posture === 'PRONE' && (player as any).wasSwimming && (!inWater || !sprintRef.current)) {
                        // Attempt to stand up
                        const oldHeight = player.height;
                        const oldY = player.y;
                        player.height = 56;
                        player.y -= (56 - 24);
                        if (checkCollision(player, world)) {
                            player.height = oldHeight;
                            player.y = oldY;
                        } else {
                            player.posture = 'STAND';
                            (player as any).wasSwimming = false;
                        }
                    }

                    if (inWater) { 
                        player.vy += 0.1; 
                        if (player.vy > 2) player.vy = 2; 
                        player.vx *= 0.8; 
                        player.vy *= 0.9; 
                        if (keysRef.current['Space']) {
                            // Give a jump boost when at the surface to pop out of water
                            if (!inWaterHead && !inWaterCenter) {
                                player.vy = -JUMP_FORCE * 0.95;
                                player.y -= 2; // small nudge out
                            } else {
                                player.vy = -3.5;
                            }
                        } 
                        if (sprintRef.current && player.posture === 'PRONE') { 
                            const swimSpeed = 4.5; 
                            if (keysRef.current['KeyA']) player.vx = -swimSpeed; 
                            else if (keysRef.current['KeyD']) player.vx = swimSpeed; 
                        } 
                    } else { 
                        if ((keysRef.current['Space'] || keysRef.current['KeyW']) && player.grounded && player.posture !== 'PRONE') { player.vy = player.posture === 'CROUCH' ? -JUMP_FORCE * 0.6 : -JUMP_FORCE; player.grounded = false; } 
                        player.vy += GRAVITY; if (player.vy > TERMINAL_VELOCITY) player.vy = TERMINAL_VELOCITY; 
                    } 
                
                player.x += player.vx; 
                if (checkCollision(player, world)) {
                    // Try auto step for slab
                    player.y -= 16;
                    if (checkCollision(player, world)) {
                        player.y += 16;
                        player.x -= player.vx; 
                        player.vx = 0;
                    } 
                } 
                
                player.y += player.vy; 
                player.grounded = false; 
                if (inWater) player.highestY = player.y; 
                if (checkCollision(player, world)) { 
                    player.y -= player.vy; 
                    if (player.vy > 0) {
                        player.grounded = true; 
                        
                        // Spike trap detection
                        if (!adminFlags.noClip && Math.random() < 0.15) {
                            for (let h = 1; h < 12; h++) {
                                const sy = Math.floor(player.y/BLOCK_SIZE) - h;
                                const sx = Math.floor(player.x/BLOCK_SIZE);
                                if (sy > 0) {
                                    const b = world.blocks[sy * WORLD_WIDTH + sx];
                                    if (b === BlockType.SPIKE && world.blocks[(sy+1)*WORLD_WIDTH + sx] === BlockType.AIR) {
                                        setBlockAt(sx, sy, BlockType.AIR);
                                        entitiesRef.current.push({ id: generateEntityId(), type: 'PROJECTILE', x: sx * BLOCK_SIZE, y: sy * BLOCK_SIZE, width: 16, height: 16, vx: 0, vy: 5, grounded: false, health: 1, maxHealth: 1, facingRight: true, itemId: 'spike', projectileState: 'FLYING', creationTime: Date.now() });
                                        break;
                                    } else if (b !== BlockType.AIR && b !== BlockType.WATER && b !== BlockType.VINES && b !== BlockType.COBWEB) {
                                        break;
                                    }
                                }
                            }
                        }

                        // Fall Damage Logic
                        if (player.highestY !== undefined) {
                            const fallDist = player.y - player.highestY;
                            const blocksFallen = fallDist / BLOCK_SIZE;
                            const landedOn = world.blocks[Math.floor((player.y+player.height+2)/BLOCK_SIZE) * WORLD_WIDTH + Math.floor((player.x+player.width/2)/BLOCK_SIZE)];
                            const isLandedOnSpikes = landedOn === BlockType.SPIKE;
                            
                            // If landed on spikes and dropped from any height > 1
                            if (isLandedOnSpikes && blocksFallen > 1 && !['GOD', 'CREATIVE', 'SPECTATOR'].includes(options.gameMode || 'SURVIVAL') && (player.invincibilityEndTime || 0) < Date.now()) {
                                const damage = Math.floor(blocksFallen * 3);
                                audio.playHit();
                                player.health -= damage;
                                addNotification("Ouch! Spikes!");
                            } else if (blocksFallen > 6 && !['GOD', 'CREATIVE', 'SPECTATOR'].includes(options.gameMode || 'SURVIVAL') && (player.invincibilityEndTime || 0) < Date.now()) {
                                const multiplier = options.difficulty === 'HARD' ? 2 : (options.difficulty === 'EASY' ? 0.5 : 1);
                                const damage = Math.floor((blocksFallen - 6) * multiplier);
                                if (damage > 0) {
                                    audio.playHit();
                                    player.health -= damage;
                                    addNotification(t.FALL_DAMAGE);
                                }
                            }
                        }
                        player.highestY = player.y;
                    }
                    player.vy = 0; 
                } else {
                    // In air tracking
                    if (player.highestY === undefined) player.highestY = player.y;
                    player.highestY = Math.min(player.highestY, player.y);
                }
            }
            }
            }
            if (player.grounded && Math.abs(player.vx) > 0.5) {
                stepTimerRef.current++;
                if (stepTimerRef.current > (sprintRef.current ? 15 : 25)) {
                    stepTimerRef.current = 0;
                    const ftB = world.blocks[Math.floor((player.y + player.height + 2) / BLOCK_SIZE) * WORLD_WIDTH + Math.floor((player.x + player.width/2)/BLOCK_SIZE)];
                    let mat = 'grass';
                    if (ftB === BlockType.STONE || ftB === BlockType.COAL_ORE || ftB === BlockType.IRON_ORE || ftB === BlockType.GOLD_ORE || ftB === BlockType.DIAMOND_ORE || ftB === BlockType.TITANIUM_ORE || ftB === BlockType.URANIUM_ORE || ftB === BlockType.BEDROCK) mat = 'stone';
                    else if (ftB === BlockType.PLANKS || ftB === BlockType.WOOD || ftB === BlockType.CRAFTING_TABLE || ftB === BlockType.DOOR_BOTTOM_CLOSED || ftB === BlockType.DOOR_BOTTOM_OPEN || ftB === BlockType.CHEST) mat = 'wood';
                    else if (ftB === BlockType.SNOW_BLOCK || ftB === BlockType.ICE) mat = 'snow';
                    audio.playStep(mat);
                }
            } else { stepTimerRef.current = 0; }
            if (player.x < 0) player.x = 0; if (player.x > WORLD_WIDTH * BLOCK_SIZE - player.width) player.x = WORLD_WIDTH * BLOCK_SIZE - player.width; 
            
            // Ocean Shark Boundary
            if (player.x < 200 * BLOCK_SIZE || player.x > (WORLD_WIDTH - 200) * BLOCK_SIZE) {
                const playerBlockY = Math.floor(player.y / BLOCK_SIZE);
                const playerBlockX = Math.floor(player.x / BLOCK_SIZE);
                if (worldRef.current && worldRef.current.blocks[playerBlockY * WORLD_WIDTH + playerBlockX] === BlockType.WATER) {
                    if (['SURVIVAL'].includes(options.gameMode || 'SURVIVAL')) {
                        if (player.health > 0) {
                            addNotification('Um tubarão te devorou!');
                            player.health = 0;
                            audio.playHit();
                        }
                    }
                }
            }

            if (player.y > WORLD_HEIGHT * BLOCK_SIZE || player.health <= 0) {
                if (['GOD', 'CREATIVE', 'SPECTATOR'].includes(options.gameMode || 'SURVIVAL')) {
                    player.health = player.maxHealth;
                    if (player.y > WORLD_HEIGHT * BLOCK_SIZE) { player.y = 0; player.vy = 0; player.highestY = 0; }
                } else {
                     if (!checkTotemRevive()) {
                         setShowDeathScreen(true);
                         setGameState('PAUSED');
                     }
                }
            }
            
            // --- POTION TICK LOGIC ---
            if (timeRef.current % 60 === 0) {
                const now = Date.now();
                if (activePotionsRef.current['potion_regen'] && activePotionsRef.current['potion_regen'] > now) {
                    player.health = Math.min(player.maxHealth, player.health + 1);
                }
            }
            if (timeRef.current % 60 === 0) {
                const now = Date.now();
                Object.keys(activePotionsRef.current).forEach(k => {
                    if (activePotionsRef.current[k] <= now) delete activePotionsRef.current[k];
                });
            }

            // --- WATER DAMAGE (OXYGEN) & LAVA BURN & COLD ---
            const bodyIdx = Math.floor((player.y + player.height/2) / BLOCK_SIZE) * WORLD_WIDTH + Math.floor((player.x + player.width/2) / BLOCK_SIZE);
            const inBlock = world.blocks[bodyIdx];
            const inWater = inBlock === BlockType.WATER;
            const inLava = inBlock === BlockType.LAVA;
            
            const isGod = options.gameMode === 'CREATIVE' || options.gameMode === 'GOD';
            const isFireResist = activePotionsRef.current['potion_fire'] && activePotionsRef.current['potion_fire'] > Date.now();
            const isColdResist = activePotionsRef.current['potion_cold'] && activePotionsRef.current['potion_cold'] > Date.now();

            if (inWater) {
                if (!isGod) {
                    oxygenRef.current = Math.max(0, oxygenRef.current - 0.2);
                    if (oxygenRef.current <= 0 && timeRef.current % 60 === 0) {
                        player.health -= 1;
                        setChatMessages(p => [...p, {msg: "Você está se afogando!", color: '#42a5f5'}]);
                    }
                }
            } else {
                oxygenRef.current = Math.min(100, oxygenRef.current + 2);
            }

            if (inLava && !isGod && !isFireResist) {
                if (timeRef.current % 30 === 0) {
                     player.health -= 2;
                     setChatMessages(p => [...p, {msg: "Você está na lava!", color: '#ff5722'}]);
                }
            }

            if (inWater && curTempState === 'NORMAL') curTempState = 'COLD';
            if (inLava && curTempState === 'NORMAL') curTempState = 'HOT';
            if (isColdResist && curTempState === 'COLD') curTempState = 'NORMAL';
            if (isFireResist && curTempState === 'HOT') curTempState = 'NORMAL';

            if (['GOD', 'CREATIVE', 'SPECTATOR'].includes(options.gameMode || 'SURVIVAL')) {
                 staminaRef.current = MAX_STAMINA + (playerStats.endurance * 20);
                 hungerRef.current = 10;
                 player.health = player.maxHealth;
            }

            // Apply knockback cooldown (if recently damaged)
            if (player.lastDamageTime && Date.now() - player.lastDamageTime < 300) {
                // simple visual flash
            }

            player.attackCooldown = Math.max(0, (player.attackCooldown || 0) - 1); setHearts(player.health); setHunger(hungerRef.current); setStamina(staminaRef.current);
            
            // --- PROXIMITY PROMPT CHECK ---
            if (timeRef.current % 10 === 0) {
                let promptMsg = null;
                let promptX = 0;
                let promptY = 0;
                
                // Check center first
                if (isOnLadder) {
                    promptMsg = isClimbingRef.current ? t.PROMPT_EXIT_LADDER : t.PROMPT_CLIMB;
                    promptX = (pCenterX * BLOCK_SIZE) + (BLOCK_SIZE/2);
                    promptY = (pCenterY * BLOCK_SIZE);
                } else {
                    // Check neighbors
                    for (let y = pCenterY - 1; y <= pCenterY + 1; y++) {
                        for (let x = pCenterX - 1; x <= pCenterX + 1; x++) {
                            const b = world.blocks[y * WORLD_WIDTH + x];
                            let msg = '';
                            if (b === BlockType.CRAFTING_TABLE || b === BlockType.SCIENCE_BENCH || b === BlockType.MEDICAL_BENCH) msg = t.PROMPT_OPEN_WORKBENCH;
                            else if (b === BlockType.FURNACE) msg = t.PROMPT_OPEN_FURNACE;
                            else if (b === BlockType.CHEST || b === BlockType.CHEST_MEDIUM || b === BlockType.CHEST_LARGE || b === BlockType.STONE_CHEST) msg = t.PROMPT_OPEN_CHEST;
                            else if (b === BlockType.BED || b === BlockType.BED_MEDIUM || b === BlockType.BED_ADVANCED) msg = t.PROMPT_SLEEP;
                            else if (b === BlockType.ARMOR_BENCH) msg = t.PROMPT_OPEN_ARMOR;
                            else if (b === BlockType.LEVER || b === BlockType.LEVER_ON || b === BlockType.BUTTON) msg = t.PROMPT_OPEN;
                            else if (b === BlockType.DOOR_BOTTOM_CLOSED || b === BlockType.DOOR_TOP_CLOSED || b === BlockType.DOOR_STONE_BOTTOM_CLOSED || b === BlockType.DOOR_STONE_TOP_CLOSED) msg = t.PROMPT_OPEN;
                            else if (b === BlockType.DOOR_BOTTOM_OPEN || b === BlockType.DOOR_TOP_OPEN || b === BlockType.DOOR_STONE_BOTTOM_OPEN || b === BlockType.DOOR_STONE_TOP_OPEN) msg = t.PROMPT_CLOSE;
                            
                            if (msg) {
                                promptMsg = msg;
                                promptX = (x * BLOCK_SIZE) + (BLOCK_SIZE/2);
                                promptY = (y * BLOCK_SIZE);
                                break;
                            }
                        }
                        if (promptMsg) break;
                    }
                }
                
                if (promptMsg) setInteractionPrompt({ msg: promptMsg, x: promptX, y: promptY });
                else setInteractionPrompt(null);
            }
            
            // --- EATING MECHANIC ---
            if (mouseRef.current.right) {
                const heldItem = inventory[selectedSlot];
                if (heldItem && (heldItem.type === ItemType.FOOD || FOOD_VALUES[(heldItem.id?.toString() || '')] || heldItem.id === 'apple' || (heldItem.id?.toString() || '').startsWith('potion_'))) {
                    // Prevent eating seeds/crops if looking at farmland
                    let preventEating = false;
                    if (heldItem.id === 'wheat_seeds' || heldItem.id === 'carrot' || heldItem.id === 'potato') {
                        const mx = mouseRef.current.x + cameraRef.current.x;
                        const my = mouseRef.current.y + cameraRef.current.y;
                        const bx = Math.floor(mx / BLOCK_SIZE);
                        const by = Math.floor(my / BLOCK_SIZE);
                        if (bx >= 0 && bx < WORLD_WIDTH && by >= 0 && by < WORLD_HEIGHT) {
                            const targetBlock = world.blocks[by * WORLD_WIDTH + bx];
                            if (targetBlock === BlockType.FARMLAND && by > 0 && world.blocks[(by - 1) * WORLD_WIDTH + bx] === BlockType.AIR) {
                                preventEating = true;
                            }
                        }
                    }

                    if (preventEating) {
                        eatingStartRef.current = null;
                        // Don't force release right click here, let other actions happen
                    } else {
                        if (!eatingStartRef.current) {
                            eatingStartRef.current = Date.now();
                        }
                        
                        if (Date.now() - eatingStartRef.current > 1500) { // 1.5 seconds to eat
                            // Consume
                            const idStr = (heldItem.id?.toString() || '');
                            
                            // Apply Potion / Medical Effects
                            if (idStr === 'medicine') {
                                player.health = player.maxHealth;
                                hungerRef.current = 10;
                            } else if (idStr === 'syringe' || idStr === 'bandage') {
                                player.health = Math.min(player.maxHealth, player.health + 4);
                            } else if (idStr.startsWith('potion_')) {
                                const durationMs = 60000;
                                activePotionsRef.current[idStr] = Date.now() + durationMs;
                                hungerRef.current = 10;
                            }

                            const foodVal = FOOD_VALUES[idStr] || (idStr === 'apple' ? 1 : 0);
                            if (foodVal > 0) {
                                if (hungerRef.current < 10) {
                                    hungerRef.current = Math.min(10, hungerRef.current + foodVal);
                                } else {
                                    // Eat for health if full
                                    player.health = Math.min(player.maxHealth, player.health + foodVal / 2);
                                }
                            }
                            
                            setInventory(prev => {
                                const n = [...prev];
                                if (n[selectedSlot]) {
                                    n[selectedSlot]!.count--;
                                    if (n[selectedSlot]!.count <= 0) n[selectedSlot] = null;
                                }
                                return n;
                            });
                            
                            // Particles (Marked as isParticle to avoid pickup)
                            for(let k=0; k<5; k++) {
                                entitiesRef.current.push({
                                    id: generateEntityId(), type: 'DROP', x: player.x + 10, y: player.y + 10, width: 4, height: 4, vx: (Math.random()-0.5)*4, vy: -2, grounded: false, health: 1, maxHealth: 1, facingRight: true, itemId: heldItem.id, creationTime: Date.now(),
                                    isParticle: true
                                });
                            }
                            
                            eatingStartRef.current = null; // Reset
                            mouseRef.current.right = false; // Force release to prevent auto-eating stack
                        } else if ((Date.now() - eatingStartRef.current) % 200 < 20) {
                            // Visual particles while eating
                            entitiesRef.current.push({
                                id: generateEntityId(), type: 'DROP', x: player.x + 10 + (player.facingRight?10:-10), y: player.y + 10, width: 2, height: 2, vx: (Math.random()-0.5)*2, vy: -1, grounded: false, health: 1, maxHealth: 1, facingRight: true, itemId: heldItem.id, creationTime: Date.now(),
                                isParticle: true
                            });
                        }
                    }
                } else {
                    eatingStartRef.current = null;
                }
            } else {
                eatingStartRef.current = null;
            }

            // --- ENTITY LOOP ---
            for (let i = entitiesRef.current.length - 1; i >= 0; i--) {
                const ent = entitiesRef.current[i];
                
                // --- DROP LOGIC ---
                if (ent.type === 'DROP') { 
                    // Visual Particles Logic (Skip Pickup)
                    if (ent.isParticle) {
                        ent.vy += GRAVITY; ent.y += ent.vy; 
                        if (checkCollision(ent, world)) { ent.y -= ent.vy; ent.vy = 0; }
                        if (Date.now() - (ent.creationTime || 0) > 1000) { entitiesRef.current.splice(i, 1); }
                        continue; 
                    }

                    // CLIENT: Do not simulate physics for drops, just render them based on host data
                    if (options.multiplayer?.mode === 'CLIENT') {
                        const dx = (player.x + player.width/2) - (ent.x + ent.width/2); 
                        const dy = (player.y + player.height/2) - (ent.y + ent.height/2); 
                        if (Math.sqrt(dx*dx + dy*dy) < 30) { 
                            setInventory(prev => { 
                                const newInv = [...prev]; let added = false; 
                                // FIX: Updated Stackability Logic
                                const strId = (ent.itemId?.toString() || '');
                                // Determine if unstackable based on ID pattern as we don't have ItemType on Entity easily
                                // Using broad match for Tools/Weapons/Armor
                                const isUnstackable = strId.includes('pickaxe') || strId.includes('sword') || strId.includes('axe') || strId.includes('shovel') || strId.includes('hoe') || strId.includes('hammer') || strId.includes('spear') || strId.includes('dagger') || strId.includes('club') || strId.includes('scythe') || strId.includes('knife') || strId.includes('katana') || strId.includes('bow') || strId.includes('crossbow') || strId.includes('helmet') || strId.includes('chestplate') || strId.includes('leggings') || strId.includes('boots') || strId.includes('shield') || strId.includes('totem');

                                if (!isUnstackable) { 
                                    for(let j=0; j<36; j++) { 
                                        if (newInv[j] && newInv[j]!.id === ent.itemId && newInv[j]!.count < 64) { 
                                            newInv[j]!.count += (ent.itemCount || 1); added = true; break; 
                                        } 
                                    } 
                                } 
                                if (!added) { 
                                    for(let j=0; j<36; j++) { 
                                        if (!newInv[j]) { 
                                            newInv[j] = { 
                                                id: !isNaN(Number(ent.itemId)) ? Number(ent.itemId) : ent.itemId!, 
                                                count: (ent.itemCount || 1), 
                                                type: !isNaN(Number(ent.itemId)) ? ItemType.BLOCK : (FOOD_VALUES[ent.itemId as string] ? ItemType.FOOD : (isUnstackable ? (strId.includes('shield') ? ItemType.SHIELD : (strId.includes('helmet') || strId.includes('chest') || strId.includes('leggings') || strId.includes('boots') ? ItemType.ARMOR : ItemType.TOOL)) : ItemType.MATERIAL)), 
                                                meta: ent.itemMeta 
                                            }; 
                                            added = true; break; 
                                        } 
                                    } 
                                } 
                                return newInv; 
                            }); 
                            broadcast('REMOVE_DROP', { id: ent.id });
                            entitiesRef.current.splice(i, 1); 
                        }
                        continue; 
                    }

                    // HOST/SP: Simulate Physics
                    if (ent.creationTime && Date.now() - ent.creationTime > 60000) { entitiesRef.current.splice(i, 1); continue; } 
                    ent.vy += GRAVITY; ent.y += ent.vy; if (checkCollision(ent, world)) { ent.y -= ent.vy; ent.vy = 0; } 
                    
                    // Host Pickup check (Self)
                    const dx = (player.x + player.width/2) - (ent.x + ent.width/2); 
                    const dy = (player.y + player.height/2) - (ent.y + ent.height/2); 
                    if (Math.sqrt(dx*dx + dy*dy) < 30) { 
                        setInventory(prev => { 
                            const newInv = [...prev]; let added = false; 
                            // FIX: Updated Stackability Logic (HOST/SP)
                            const strId = (ent.itemId?.toString() || '');
                            const isUnstackable = strId.includes('pickaxe') || strId.includes('sword') || strId.includes('axe') || strId.includes('shovel') || strId.includes('hoe') || strId.includes('hammer') || strId.includes('spear') || strId.includes('dagger') || strId.includes('club') || strId.includes('scythe') || strId.includes('knife') || strId.includes('katana') || strId.includes('bow') || strId.includes('crossbow') || strId.includes('helmet') || strId.includes('chestplate') || strId.includes('leggings') || strId.includes('boots') || strId.includes('shield') || strId.includes('totem');

                            if (!isUnstackable) { 
                                for(let j=0; j<36; j++) { 
                                    if (newInv[j] && newInv[j]!.id === ent.itemId && newInv[j]!.count < 64) { 
                                        newInv[j]!.count += (ent.itemCount || 1); added = true; break; 
                                    } 
                                } 
                            } 
                            if (!added) { 
                                for(let j=0; j<36; j++) { 
                                    if (!newInv[j]) { 
                                        newInv[j] = { 
                                            id: !isNaN(Number(ent.itemId)) ? Number(ent.itemId) : ent.itemId!, 
                                            count: (ent.itemCount || 1), 
                                            type: !isNaN(Number(ent.itemId)) ? ItemType.BLOCK : (FOOD_VALUES[ent.itemId as string] ? ItemType.FOOD : (isUnstackable ? (strId.includes('shield') ? ItemType.SHIELD : (strId.includes('helmet') || strId.includes('chest') || strId.includes('leggings') || strId.includes('boots') ? ItemType.ARMOR : ItemType.TOOL)) : ItemType.MATERIAL)), 
                                            meta: ent.itemMeta 
                                        }; 
                                        added = true; break; 
                                    } 
                                } 
                            } 
                            return newInv; 
                        }); 
                        broadcast('REMOVE_DROP', { id: ent.id });
                        entitiesRef.current.splice(i, 1); 
                        continue; 
                    } 
                    continue; 
                }
                
                // --- PROJECTILE LOGIC ---
                else if (ent.type === 'PROJECTILE') { 
                    if (ent.projectileState === 'FLYING') { 
                        ent.vy += 0.2; ent.x += ent.vx; ent.y += ent.vy; ent.rotation = Math.atan2(ent.vy, ent.vx); 
                        if (ent.returnTime && ent.creationTime) { if (Date.now() - ent.creationTime > ent.returnTime) { ent.projectileState = 'RETURNING'; } }
                        let projectileDestroyed = false; for (let j = entitiesRef.current.length - 1; j >= 0; j--) { const mob = entitiesRef.current[j]; if (mob.type === 'PLAYER' || mob.type === 'DROP' || mob.type === 'PROJECTILE') continue; if (ent.x < mob.x + mob.width && ent.x + ent.width > mob.x && ent.y < mob.y + mob.height && ent.y + ent.height > mob.y) { const heldItemId = ent.itemId ? (ent.itemId?.toString() || '') : 'wood_spear'; const isArrow = heldItemId === 'arrow'; const isRadioactive = heldItemId === 'uranium'; const damage = isRadioactive ? 5 : (isArrow ? 4 : (DAMAGE_VALUES[heldItemId] || 1)); mob.health -= damage; mob.lastDamageTime = Date.now(); if (mob.health <= 0) { gainXP(XP_PER_MOB); entitiesRef.current.splice(j, 1); if (mob.type === 'COW') { spawnDrop(mob.x, mob.y, 'raw_beef', 2); spawnDrop(mob.x, mob.y, 'leather', 1); } if (mob.type === 'PIG') spawnDrop(mob.x, mob.y, 'raw_porkchop', 2); if (mob.type === 'SHEEP') spawnDrop(mob.x, mob.y, BlockType.WOOL, 1); if (mob.type === 'ZOMBIE') spawnDrop(mob.x, mob.y, 'raw_beef', 1); if (mob.type === 'MUTANT_ZOMBIE') { spawnDrop(mob.x, mob.y, 'uranium_totem', 1); spawnDrop(mob.x, mob.y, 'uranium', 5); } } if (ent.loyalty || ent.returnTime) ent.projectileState = 'RETURNING'; else { if(!isArrow && !isRadioactive) spawnDrop(ent.x, ent.y, ent.itemId!, 1, ent.itemMeta); entitiesRef.current.splice(i, 1); } projectileDestroyed = true; break; } } 
                        if (!projectileDestroyed && (ent.itemId === 'uranium' || ent.itemId === 'spike' || ent.itemId === 'arrow')) { const p = playerRef.current; if (ent.x < p.x + p.width && ent.x + ent.width > p.x && ent.y < p.y + p.height && ent.y + ent.height > p.y) { p.health -= (ent.itemId === 'spike' ? 8 : ent.itemId === 'arrow' ? 5 : 5); audio.playHit(); entitiesRef.current.splice(i, 1); projectileDestroyed = true; } }
                        if (projectileDestroyed) continue; 
                        if (checkCollision(ent, world)) { if (ent.loyalty || ent.returnTime) ent.projectileState = 'RETURNING'; else { if(ent.itemId !== 'arrow' && ent.itemId !== 'uranium' && ent.itemId !== 'spike') spawnDrop(ent.x, ent.y, ent.itemId!, 1, ent.itemMeta); entitiesRef.current.splice(i, 1); continue; } } 
                    } else if (ent.projectileState === 'RETURNING') { 
                        const dx = player.x - ent.x; const dy = player.y - ent.y; const dist = Math.sqrt(dx*dx + dy*dy); const speed = 15; ent.vx = (dx / dist) * speed; ent.vy = (dy / dist) * speed; ent.x += ent.vx; ent.y += ent.vy; ent.rotation = Math.atan2(ent.vy, ent.vx) + Math.PI; 
                        if (dist < 30) { entitiesRef.current.splice(i, 1); setInventory(prev => { const newInv = [...prev]; let added = false; for(let j=0; j<36; j++) { if(newInv[j] && newInv[j]!.id == ent.itemId && newInv[j]!.count < 64) { newInv[j]!.count++; added = true; break; } } if(!added) { for(let j=0; j<36; j++) { if(!newInv[j]) { newInv[j] = { id: !isNaN(Number(ent.itemId)) ? Number(ent.itemId) : ent.itemId!, count: 1, type: !isNaN(Number(ent.itemId)) ? ItemType.BLOCK : (FOOD_VALUES[ent.itemId as string] ? ItemType.FOOD : ItemType.TOOL), meta: ent.itemMeta }; if (ent.loyalty) { if(!newInv[j]!.meta) newInv[j]!.meta = {}; newInv[j]!.meta!.loyalty = true; } break; } } } return newInv; }); continue; } 
                    } continue; 
                }
                
                // --- MOB LOGIC ---
                if (options.multiplayer?.mode === 'CLIENT' && (ent.type === 'ZOMBIE' || ent.type === 'COW' || ent.type === 'PIG' || ent.type === 'SHEEP' || ent.type === 'MUTANT_ZOMBIE' || ent.type === 'SCORPION')) { continue; }
                ent.vy += GRAVITY; ent.y += ent.vy; if (checkCollision(ent, world)) { ent.y -= ent.vy; ent.vy = 0; } let wallInFront = false; const nextX = ent.x + (ent.facingRight ? 5 : -5); const corners = [{ x: nextX, y: ent.y }, { x: nextX + ent.width, y: ent.y }, { x: nextX, y: ent.y + ent.height - 2 }, { x: nextX + ent.width, y: ent.y + ent.height - 2 }]; for(const p of corners) { const bx = Math.floor(p.x / BLOCK_SIZE); const by = Math.floor(p.y / BLOCK_SIZE); const b = world.blocks[by*WORLD_WIDTH + bx]; if (!NON_COLLIDABLE_BLOCKS.has(b)) wallInFront = true; } if (wallInFront && ent.vy === 0) ent.vy = -JUMP_FORCE; const isPanic = (ent.health < ent.maxHealth && (ent.lastDamageTime && Date.now() - ent.lastDamageTime < 5000));
                
                let targetX = player.x; let targetY = player.y; let minDist = Math.abs(player.x - ent.x); let closestPlayer = player;
                otherPlayersRef.current.forEach(op => { const d = Math.abs(op.x - ent.x); if (d < minDist) { minDist = d; targetX = op.x; targetY = op.y; closestPlayer = op; } });
                const distToPlayer = targetX - ent.x; const distY = Math.abs(targetY - ent.y);

                if ((ent.type?.toString() || '').includes('ZOMBIE') || ent.type === 'PLAGUE_KING' || ent.type === 'MUTANT_ZOMBIE' || (ent.type === 'SCORPION' && isPanic) || ent.type === 'SNAKE' || (ent.type === 'SPIDER' && (player as any).spiderAggro) || (ent.type === 'BUSH_MOB' && !ent.isSleeping)) { 
                    if (ent.type === 'ZOMBIE' && isDay) { entitiesRef.current.splice(i, 1); continue; } 
                    
                    // SNAKE LOGIC
                    if (ent.type === 'SNAKE') {
                         if (Math.abs(distToPlayer) < 300 && distY < 100) {
                             ent.facingRight = distToPlayer > 0;
                             ent.vx = ent.facingRight ? 4 : -4; 
                             if (wallInFront && ent.vy === 0) ent.vy = -JUMP_FORCE;
                         } else {
                             if (Math.random() < 0.05) { ent.vx = (Math.random() - 0.5) * 4; }
                         }
                         if (Math.abs(distToPlayer) < 20 && Math.abs(targetY - ent.y) < 20 && (ent.attackCooldown || 0) <= 0) {
                             if (closestPlayer.id === player.id) {
                                 audio.playHit();
                                 player.health -= 1; 
                                player.vx += (distToPlayer>0?10:-10); player.vy = -2; 
                                 ent.attackCooldown = 150; 
                                 setHearts(player.health);
                                 addNotification(lang === 'PT' ? "Picada de cobra!" : "Snake bite!");
                             }
                         }
                    }
                    
                    if (ent.type === 'MUTANT_ZOMBIE') { 
                        if (Math.abs(distToPlayer) < 600 && distY < 300) { 
                            ent.facingRight = distToPlayer > 0; ent.vx = ent.facingRight ? 3 : -3; if (wallInFront && ent.vy === 0) ent.vy = -JUMP_FORCE; 
                            if (Math.random() < 0.02) { const angle = Math.atan2((targetY + 20) - ent.y, (targetX + 10) - ent.x); entitiesRef.current.push({ id: generateEntityId(), type: 'PROJECTILE', x: ent.x + ent.width/2, y: ent.y + ent.height/2, width: 12, height: 12, vx: Math.cos(angle) * 8, vy: Math.sin(angle) * 8, grounded: false, health: 1, maxHealth: 1, facingRight: ent.facingRight, itemId: 'uranium', projectileState: 'FLYING', creationTime: Date.now() }); } 
                        } 
                    } else if (ent.type === 'PLAGUE_KING') {
                        if (Math.abs(distToPlayer) < 800 && distY < 400) { 
                            ent.facingRight = distToPlayer > 0; ent.vx = ent.facingRight ? 4 : -4; if (wallInFront && ent.vy === 0) ent.vy = -JUMP_FORCE; 
                            if (Math.random() < 0.01) { 
                                // Summon zombies
                                spawnMob('ZOMBIE_TOXIC', ent.x, ent.y - 20);
                                spawnMob('ZOMBIE_RUNNER', ent.x, ent.y - 20);
                            } 
                            if (Math.random() < 0.02) {
                                // Dash
                                ent.vx = ent.facingRight ? 15 : -15;
                            }
                        }
                    } else if (ent.type === 'ZOMBIE_KING') {
                        if (Math.abs(distToPlayer) < 800 && distY < 400) { 
                            ent.facingRight = distToPlayer > 0;
                            
                            if (Math.abs(distToPlayer) > 200) {
                                ent.vx = ent.facingRight ? 2 : -2; 
                                if (wallInFront && ent.vy === 0) ent.vy = -JUMP_FORCE; 
                            } else {
                                ent.vx = ent.facingRight ? -1 : 1; // back away a bit
                            }
                            
                            // Shoot projectiles
                            if (Math.random() < 0.03 && (ent.attackCooldown || 0) <= 0) {
                                const angle = Math.atan2((targetY + 10) - ent.y, (targetX + 10) - ent.x); 
                                entitiesRef.current.push({ id: generateEntityId(), type: 'PROJECTILE', x: ent.x + ent.width/2, y: ent.y + ent.height/3, width: 8, height: 8, vx: Math.cos(angle) * 12, vy: Math.sin(angle) * 12, grounded: false, health: 1, maxHealth: 1, facingRight: ent.facingRight, itemId: 'spike', projectileState: 'FLYING', creationTime: Date.now() });
                                ent.attackCooldown = 80;
                            }
                            
                            // Shockwave attack / Break blocks
                            if (Math.random() < 0.01 && ent.grounded) {
                                ent.vy = -10; // Jump shockwave
                                const eX = Math.floor(ent.x / BLOCK_SIZE);
                                const eY = Math.floor((ent.y + ent.height) / BLOCK_SIZE);
                                for(let by = eY - 2; by <= eY + 2; by++){
                                    for(let bx = eX - 3; bx <= eX + 3; bx++){
                                        if (Math.abs(by - eY) + Math.abs(bx - eX) <= 3) { 
                                            if (by >= 0 && by < WORLD_HEIGHT && bx >= 0 && bx < WORLD_WIDTH) {
                                                const b = worldRef.current!.blocks[by * WORLD_WIDTH + bx];
                                                if (b !== BlockType.AIR && b !== BlockType.BEDROCK) {
                                                    setBlockAt(bx, by, BlockType.AIR, true);
                                                    spawnDrop(bx * BLOCK_SIZE, by * BLOCK_SIZE, b, 1);
                                                }
                                            }
                                        }
                                    }
                                }
                                
                            }

                            if (Math.random() < 0.01) { 
                                spawnMob('ZOMBIE', ent.x, ent.y - 20);
                            } 
                        }
                    } else if (ent.type === 'ZOMBIE_SKELETON') {
                        if (Math.abs(distToPlayer) < 400 && distY < 200) { 
                            ent.facingRight = distToPlayer > 0; 
                            if (Math.abs(distToPlayer) > 250) {
                                ent.vx = ent.facingRight ? 2 : -2; 
                            } else if (Math.abs(distToPlayer) < 150) {
                                ent.vx = ent.facingRight ? -2 : 2; 
                                // Shoot even while backing away
                                if (Math.random() < 0.05 && (ent.attackCooldown || 0) <= 0) {
                                    const angle = Math.atan2((targetY + 20) - ent.y, (targetX + 10) - ent.x); 
                                    entitiesRef.current.push({ id: generateEntityId(), type: 'PROJECTILE', x: ent.x + ent.width/2, y: ent.y + ent.height/2, width: 12, height: 4, vx: Math.cos(angle) * 10, vy: Math.sin(angle) * 10, grounded: false, health: 1, maxHealth: 1, facingRight: ent.facingRight, itemId: 'arrow', projectileState: 'FLYING', creationTime: Date.now() });
                                    ent.attackCooldown = 180;
                                }
                            } else {
                                ent.vx = 0; // Stop to shoot
                                if (Math.random() < 0.05 && (ent.attackCooldown || 0) <= 0) {
                                    const angle = Math.atan2((targetY + 20) - ent.y, (targetX + 10) - ent.x); 
                                    entitiesRef.current.push({ id: generateEntityId(), type: 'PROJECTILE', x: ent.x + ent.width/2, y: ent.y + ent.height/2, width: 12, height: 4, vx: Math.cos(angle) * 10, vy: Math.sin(angle) * 10, grounded: false, health: 1, maxHealth: 1, facingRight: ent.facingRight, itemId: 'arrow', projectileState: 'FLYING', creationTime: Date.now() });
                                    ent.attackCooldown = 180;
                                }
                            }
                            if (wallInFront && ent.vy === 0) ent.vy = -JUMP_FORCE; 
                        } else { if (Math.random() < 0.02) { ent.vx = (Math.random() - 0.5) * 2; if (ent.vx > 0) ent.facingRight = true; if (ent.vx < 0) ent.facingRight = false; } } 
                    } else if (ent.type === 'ZOMBIE_EXPLOSIVE') {
                        if (Math.abs(distToPlayer) < 400 && distY < 200) { 
                            ent.facingRight = distToPlayer > 0; ent.vx = ent.facingRight ? 3 : -3; if (wallInFront && ent.vy === 0) ent.vy = -JUMP_FORCE; 
                            if (Math.abs(distToPlayer) < 40 && Math.abs(targetY - ent.y) < 40) {
                                // Explode
                                const ex = Math.floor(ent.x / BLOCK_SIZE);
                                const ey = Math.floor(ent.y / BLOCK_SIZE);
                                const radius = 3;
                                for (let y = ey - radius; y <= ey + radius; y++) {
                                    for (let x = ex - radius; x <= ex + radius; x++) {
                                        if (x >= 0 && x < WORLD_WIDTH && y >= 0 && y < WORLD_HEIGHT) {
                                            if (Math.sqrt((x - ex) ** 2 + (y - ey) ** 2) <= radius) {
                                                const b = world.blocks[y * WORLD_WIDTH + x];
                                                if (b !== BlockType.AIR && b !== BlockType.BEDROCK) {
                                                    world.blocks[y * WORLD_WIDTH + x] = BlockType.AIR;
                                                    spawnDrop(x * BLOCK_SIZE, y * BLOCK_SIZE, b, 1);
                                                }
                                            }
                                        }
                                    }
                                }
                                updateLighting(world, timeRef.current);
                                
                                // Damage player
                                const distToP = Math.sqrt((player.x - ent.x) ** 2 + (player.y - ent.y) ** 2);
                                if (distToP < radius * BLOCK_SIZE) {
                                    audio.playHit();
                                    player.health -= 10;
                                    setHearts(player.health);
                                }
                                
                                ent.health = 0;
                            }
                        } else { if (Math.random() < 0.02) { ent.vx = (Math.random() - 0.5) * 2; if (ent.vx > 0) ent.facingRight = true; if (ent.vx < 0) ent.facingRight = false; } } 
                    } else if (Math.abs(distToPlayer) < 400 && distY < 200) { 
                        let speed = 1.5;
                        if (ent.type === 'ZOMBIE_RUNNER') speed = 4.5;
                        if (ent.type === 'ZOMBIE_TANK') speed = 0.8;
                        ent.facingRight = distToPlayer > 0; ent.vx = ent.facingRight ? speed : -speed; if (wallInFront && ent.vy === 0) ent.vy = -JUMP_FORCE; if (distY > 32 && targetY < ent.y && ent.vy === 0 && Math.random() < 0.1) ent.vy = -JUMP_FORCE; 
                    } else { if (Math.random() < 0.02) { ent.vx = (Math.random() - 0.5) * 2; if (ent.vx > 0) ent.facingRight = true; if (ent.vx < 0) ent.facingRight = false; } } 
                    
                    if (Math.abs(distToPlayer) < 30 && Math.abs(targetY - ent.y) < 50 && (ent.attackCooldown || 0) <= 0 && ent.type !== 'ZOMBIE_EXPLOSIVE') { 
                        if (closestPlayer.id === player.id) {
                            let blocked = false; if (blockingRef.current) { const mobIsRight = ent.x > player.x; if (player.facingRight && mobIsRight) blocked = true; if (!player.facingRight && !mobIsRight) blocked = true; } 
                            if (blocked) { ent.vx = player.facingRight ? 8 : -8; ent.vy = -5; damageOffhand(); ent.attackCooldown = 30; } 
                            else if (!['GOD', 'CREATIVE', 'SPECTATOR'].includes(options.gameMode || 'SURVIVAL') && (player.invincibilityEndTime || 0) < Date.now()) { 
                                let rawDamage = 2;
                                if (ent.type === 'MUTANT_ZOMBIE') rawDamage = 5;
                                else if (ent.type === 'SCORPION') rawDamage = 3;
                                else if (ent.type === 'SNAKE') rawDamage = 1;
                                else if (ent.type === 'ZOMBIE_TANK') rawDamage = 8;
                                else if (ent.type === 'ZOMBIE_KING') rawDamage = 10;
                                else if (ent.type === 'PLAGUE_KING') rawDamage = 20;
                                else if (ent.type === 'ZOMBIE_RUNNER') rawDamage = 3;
                                
                                let reduction = 0; 
                                if(equipment.helmet) reduction += ARMOR_PROTECTION[(equipment.helmet?.id?.toString() || '')] || 0; 
                                if(equipment.chestplate) reduction += ARMOR_PROTECTION[(equipment.chestplate?.id?.toString() || '')] || 0; 
                                if(equipment.leggings) reduction += ARMOR_PROTECTION[(equipment.leggings?.id?.toString() || '')] || 0; 
                                if(equipment.boots) reduction += ARMOR_PROTECTION[(equipment.boots?.id?.toString() || '')] || 0; 
                                
                                let finalDamage = Math.max(0.5, rawDamage * (1 - reduction));
                                if (options.difficulty === 'EASY') finalDamage *= 0.5;
                                
                                audio.playHit();
                                player.health -= finalDamage; 
                                
                                // Dogs attack the attacker
                                entitiesRef.current.forEach(dog => {
                                    if (dog.type === 'DOG' && dog.isTamed && dog.targetId === player.id && !dog.isSitting) {
                                        dog.targetId = ent.id; // Switch target to attacker
                                    }
                                });

                                // SCORPION POISON
                                if (ent.type === 'SCORPION' || ent.type === 'ZOMBIE_TOXIC' || ent.type === 'PLAGUE_KING') {
                                    (player as any).poisonEndTime = Date.now() + 10000; 
                                    addNotification(lang === 'PT' ? "Você foi envenenado!" : "You have been poisoned!");
                                }
                                
                                if (ent.type === 'ZOMBIE_FROZEN') {
                                    (player as any).freezeEndTime = Date.now() + 5000;
                                    addNotification(lang === 'PT' ? "Você foi congelado!" : "You have been frozen!");
                                }

                                if (ent.type === 'BUSH_MOB') {
                                    ent.isSleeping = true; // Go back to sleep!
                                    // Move backwards a bit to not chain attack
                                    ent.vx += (distToPlayer > 0 ? -10 : 10);
                                }

                                player.vx += (distToPlayer>0?15:-15); player.vy = -3; ent.attackCooldown = 150; hungerRef.current = Math.max(0, hungerRef.current - 1); 
                            } 
                        } else { ent.attackCooldown = 150; }
                    } 
                    ent.attackCooldown = Math.max(0, (ent.attackCooldown || 0) - 1); 
                } else if (ent.type === 'BUSH_MOB') {
                    if (ent.isSleeping) {
                        ent.vx = 0;
                        if (Math.abs(distToPlayer) < 60) {
                            // Wake up when player is near
                            ent.isSleeping = false;
                        }
                    } else {
                        // It is awake, but since it didn't match the hostile check, wait, it WILL match the hostile check if !isSleeping.
                        // So this block only runs if it is sleeping.
                        ent.vx = 0;
                    }
                } else if (ent.type === 'SPIDER') {
                    // Spider is passive if not aggroed
                    // But if it takes damage, it triggers global spider aggro immediately
                    if (isPanic) {
                        (player as any).spiderAggro = true;
                    }
                    if (Math.random() < 0.02) {
                        ent.vx = (Math.random() - 0.5) * 4;
                    }
                } else if (ent.type === 'RABBIT') {
                    // Flee Logic
                    if (Math.abs(distToPlayer) < 150) {
                        ent.facingRight = distToPlayer < 0; 
                        ent.vx = ent.facingRight ? 5 : -5; 
                        if (wallInFront && ent.vy === 0) ent.vy = -JUMP_FORCE;
                    } else {
                        if (Math.random() < 0.05) { 
                            ent.vx = (Math.random() - 0.5) * 3; 
                            if (Math.random() < 0.3 && ent.vy === 0) ent.vy = -JUMP_FORCE;
                        }
                    }
                } else if (ent.type === 'CAMEL') {
                    if (ent.riderId) {
                        // Controlled by Player (Input read from keysRef)
                        // Logic handled in Player Physics section via 'mount' variable?
                        // Actually we need to apply physics to Camel here based on keys
                        if (ent.riderId === player.id) {
                            const speed = 4 + (sprintRef.current ? 3 : 0);
                            if (keysRef.current['KeyA']) { ent.vx = -speed; ent.facingRight = false; }
                            else if (keysRef.current['KeyD']) { ent.vx = speed; ent.facingRight = true; }
                            else { ent.vx *= 0.8; }
                            if (keysRef.current['Space'] && ent.vy === 0) ent.vy = -JUMP_FORCE * 1.2;
                        }
                    } else {
                        if (Math.random() < 0.01) { ent.vx = (Math.random() - 0.5) * 2; }
                    }
                } else if (ent.type === 'POLAR_BEAR') {
                    // Polar Bear Logic
                    if (isDay && !isPanic && !ent.targetId) {
                        const inSnowBiome = getBiome(ent.x / BLOCK_SIZE, currentSeed) === 'snow';
                        if (!inSnowBiome) {
                            // Walk towards snow biome
                            ent.isSleeping = false;
                            ent.facingRight = true;
                            ent.vx = 2;
                            if (wallInFront && ent.vy === 0) ent.vy = -JUMP_FORCE;
                        } else {
                            ent.isSleeping = true;
                            ent.vx = 0;
                        }
                    } else if (ent.type === 'NPC') {
                        // NPC Logic
                        if (Math.abs(distToPlayer) < 100) {
                            // Look at player
                            ent.facingRight = distToPlayer > 0;
                            ent.vx = 0; // Stop moving when player is near
                        } else {
                            // Wander slowly
                            if (Math.random() < 0.01) {
                                ent.vx = (Math.random() - 0.5) * 1.5;
                                if (ent.vx > 0) ent.facingRight = true;
                                if (ent.vx < 0) ent.facingRight = false;
                            } else if (Math.random() < 0.05) {
                                ent.vx = 0; // Stop frequently
                            }
                        }
                    } else {
                        ent.isSleeping = false;
                        if (isPanic && !ent.targetId) {
                            ent.targetId = player.id; // Aggro on player if hit
                        }
                        
                        if (ent.targetId === player.id) {
                            if (Math.abs(distToPlayer) > 400) {
                                ent.targetId = undefined; // Lose aggro
                            } else {
                                ent.facingRight = distToPlayer > 0;
                                ent.vx = ent.facingRight ? 4 : -4;
                                if (wallInFront && ent.vy === 0) ent.vy = -JUMP_FORCE;
                                
                                // Attack
                                if (Math.abs(distToPlayer) < 30 && Math.abs(targetY - ent.y) < 40 && (ent.attackCooldown || 0) <= 0) {
                                    audio.playHit();
                                    player.health -= 4;
                                    player.vx += (distToPlayer>0?15:-15); player.vy = -4;
                                    ent.attackCooldown = 150;
                                    setHearts(player.health);
                                }
                            }
                        } else {
                            // Wander at night
                            if (Math.random() < 0.02) {
                                ent.vx = (Math.random() - 0.5) * 2;
                                if (ent.vx > 0) ent.facingRight = true;
                                if (ent.vx < 0) ent.facingRight = false;
                            }
                        }
                    }
                    ent.attackCooldown = Math.max(0, (ent.attackCooldown || 0) - 1);
                } else if (ent.type === 'DOG') {
                    // Dog Logic
                    if (ent.isSitting) {
                        ent.vx = 0;
                    } else if (ent.isTamed && ent.targetId === player.id) {
                        // Follow owner
                        if (Math.abs(distToPlayer) > 60) {
                            ent.facingRight = distToPlayer > 0;
                            ent.vx = ent.facingRight ? 4 : -4;
                            if (wallInFront && ent.vy === 0) ent.vy = -JUMP_FORCE;
                        } else {
                            ent.vx = 0;
                        }
                        // Teleport if too far
                        if (Math.abs(distToPlayer) > 600) {
                            ent.x = player.x;
                            ent.y = player.y;
                        }
                    } else if (ent.isTamed && ent.targetId !== undefined && ent.targetId !== player.id) {
                        // Attack target
                        const target = entitiesRef.current.find(e => e.id === ent.targetId);
                        if (target && target.health > 0) {
                            const distToTarget = target.x - ent.x;
                            ent.facingRight = distToTarget > 0;
                            ent.vx = ent.facingRight ? 5 : -5;
                            if (wallInFront && ent.vy === 0) ent.vy = -JUMP_FORCE;
                            
                            if (Math.abs(distToTarget) < 30 && Math.abs(target.y - ent.y) < 40 && (ent.attackCooldown || 0) <= 0) {
                                audio.playHit();
                                target.health -= 3;
                                target.vx += (distToTarget>0?4:-4); target.vy = -3;
                                ent.attackCooldown = 30;
                                if (target.health <= 0) {
                                    ent.targetId = player.id; // Go back to owner
                                }
                            }
                        } else {
                            ent.targetId = player.id; // Target dead or gone, go back to owner
                        }
                    } else {
                        // Wander
                        if (Math.random() < 0.02) {
                            ent.vx = (Math.random() - 0.5) * 3;
                            if (ent.vx > 0) ent.facingRight = true;
                            if (ent.vx < 0) ent.facingRight = false;
                        }
                    }
                    ent.attackCooldown = Math.max(0, (ent.attackCooldown || 0) - 1);
                } else { 
                    const heldItem = inventory[selectedSlot]; let attracted = false; 
                    if (heldItem) { if (ent.type === 'PIG' && heldItem.id === 'carrot') attracted = true; if ((ent.type === 'COW' || ent.type === 'SHEEP') && heldItem.id === 'wheat') attracted = true; } 
                    if (attracted) { if (Math.abs(distToPlayer) < 200) { ent.facingRight = distToPlayer > 0; ent.vx = ent.facingRight ? 3 : -3; if (wallInFront && ent.vy === 0) ent.vy = -JUMP_FORCE; } else { ent.vx = 0; } } else if (isPanic) { ent.facingRight = targetX < ent.x; ent.vx = ent.facingRight ? 3 : -3; } else if (Math.random() < 0.02) { ent.vx = (Math.random() - 0.5) * 2; if (ent.vx > 0) ent.facingRight = true; if (ent.vx < 0) ent.facingRight = false; } 
                }
                ent.x += ent.vx; 
                if (checkCollision(ent, world)) { 
                    ent.y -= 16;
                    if (checkCollision(ent, world)) {
                        ent.y += 16;
                        ent.x -= ent.vx; 
                        ent.vx *= -1; 
                        ent.facingRight = !ent.facingRight; 
                    }
                }
            }
        }

        // ... (rest of the file for drawing and cursor) ...
        const cx = player.x + player.width/2;
        const cy = player.y + player.height/2;
        const worldMouseX = mouseRef.current.x + cameraRef.current.x;
        const worldMouseY = mouseRef.current.y + cameraRef.current.y;
        const dist = Math.sqrt(Math.pow(worldMouseX - cx, 2) + Math.pow(worldMouseY - cy, 2));
        const reach = REACH_DISTANCE + (playerStats.reach * BLOCK_SIZE);

        if (dist < reach && !isPaused && !isFurnaceOpen && !isChestOpen && !isAdminMenuOpen && !isSleepUIOpen && !isArmorBenchOpen) {
            const bx = Math.floor(worldMouseX / BLOCK_SIZE); const by = Math.floor(worldMouseY / BLOCK_SIZE);
            if (mouseRef.current.left) {
                // ... (Existing attack/break logic remains identical) ...
                const heldItem = inventory[selectedSlot];
                let hitEntity = false;
                if ((player.attackCooldown || 0) <= 0) {
                     const isKatana = heldItem && (heldItem.id?.toString() || '').includes('katana'); const isScythe = heldItem && (heldItem.id?.toString() || '').includes('scythe');
                     const targets = entitiesRef.current.filter(ent => { if (ent.type === 'DROP' || ent.type === 'PROJECTILE') return false; return (worldMouseX >= ent.x && worldMouseX <= ent.x + ent.width && worldMouseY >= ent.y && worldMouseY <= ent.y + ent.height) || ((isKatana || isScythe) && Math.abs(ent.x - worldMouseX) < 60 && Math.abs(ent.y - worldMouseY) < 60); });
                     let hitTargets = targets.slice(0, 1); if (isKatana) hitTargets = targets.slice(0, 3);
                     if (hitTargets.length > 0) { hitEntity = true; const heldItemId = heldItem ? (heldItem.id?.toString() || '') : 'hand'; let cooldown = 20; if (isKatana) cooldown = 100; else if (heldItemId.includes('sword')) cooldown = 60; else if (heldItemId.includes('knife')) cooldown = 10; else if (heldItemId.includes('spear')) cooldown = 45; else if (heldItemId.includes('axe')) cooldown = 75;
                     
                     // REMOVED LEVEL LOGIC FOR COOLDOWN
                     
                     player.attackCooldown = cooldown; 
                     hitTargets.forEach(ent => { let baseDamage = DAMAGE_VALUES[heldItemId] || 1; if (heldItemId.includes('club')) { if (player.vy > 0 && !player.grounded) baseDamage *= 1.5; } if (heldItemId.includes('dagger')) { const d = Math.sqrt(Math.pow(ent.x - player.x, 2) + Math.pow(ent.y - player.y, 2)); if (d < 40) baseDamage *= 1.5; else baseDamage *= 0.5; } 
                     let damage = baseDamage + (playerStats.strength * 0.5) + (isKatana ? 1 : 0); 
                     
                     audio.playHit();
                     if (ent.type === 'COW') audio.playCowHurt();
                     else if (ent.type.includes('ZOMBIE')) audio.playZombieHurt();
                     else if (['PIG', 'SHEEP', 'DOG', 'WOLF', 'HORSE'].includes(ent.type)) audio.playAnimalHurt();
                     
                     // REMOVED LEVEL LOGIC FOR DAMAGE

                     if (options.multiplayer?.mode === 'CLIENT') { broadcast('DAMAGE_MOB', { id: ent.id, damage: damage, knockbackX: player.x < ent.x ? 15 : -15, knockbackY: -3 }); ent.health -= damage; ent.vx = player.x < ent.x ? 15 : -15; ent.vy = -3; } else { ent.health -= damage; ent.lastDamageTime = Date.now(); ent.vx = player.x < ent.x ? 15 : -15; ent.vy = -3; 
                         
                         // Dogs attack the mob the player attacks
                         if (ent.type !== 'DOG' || !ent.isTamed || ent.targetId !== player.id) {
                             entitiesRef.current.forEach(dog => {
                                 if (dog.type === 'DOG' && dog.isTamed && dog.targetId === player.id && !dog.isSitting) {
                                     dog.targetId = ent.id;
                                 }
                             });
                         }

                         if (ent.health <= 0) { gainXP(XP_PER_MOB); if (ent.type === 'COW') { spawnDrop(ent.x, ent.y, 'raw_beef', 2); spawnDrop(ent.x, ent.y, 'leather', 1); } if (ent.type === 'PIG') spawnDrop(ent.x, ent.y, 'raw_porkchop', 2); if (ent.type === 'SHEEP') { spawnDrop(ent.x, ent.y, 'raw_mutton', 1); spawnDrop(ent.x, ent.y, BlockType.WOOL, 1); } if (ent.type === 'MUTANT_ZOMBIE') { spawnDrop(ent.x, ent.y, 'uranium_totem', 1); spawnDrop(ent.x, ent.y, 'uranium', 5); } if (ent.type === 'ZOMBIE' && Math.random() < 0.5) { spawnDrop(ent.x, ent.y, 'bone', 1); } entitiesRef.current = entitiesRef.current.filter(e => e.id !== ent.id); } } }); damageTool(selectedSlot); }
                }
                if (!hitEntity) { 
                    if (bx >= 0 && bx < WORLD_WIDTH && by >= 0 && by < WORLD_HEIGHT) { 
                        const bType = world.blocks[by * WORLD_WIDTH + bx]; 
                        if (bType !== BlockType.AIR && bType !== BlockType.BEDROCK && bType !== BlockType.WATER) { 
                            if (breakingRef.current.x !== bx || breakingRef.current.y !== by) breakingRef.current = { x: bx, y: by, progress: 0 }; 
                            if (canDamageBlock(bType, heldItem) || adminFlags.oneHitBreak) { 
                                const speed = getBreakSpeed(bType, heldItem); 
                                breakingRef.current.progress += adminFlags.oneHitBreak ? 1000000 : Math.max(1, speed); 
                                if ((player.attackCooldown || 0) <= 0) {
                                    const heldItemId = heldItem ? (heldItem.id?.toString() || '') : '';
                                    let cooldown = 15;
                                    if (heldItemId.includes('pickaxe') || heldItemId.includes('axe') || heldItemId.includes('hammer') || heldItemId.includes('shovel') || heldItemId.includes('hoe')) cooldown = 20;
                                    player.attackCooldown = cooldown;
                                }
                                let hardness = BLOCK_HARDNESS[bType] || 100; 
                                if (bType === BlockType.BUSH || bType === BlockType.BERRY_BUSH || bType === BlockType.SEED_BUSH || bType === BlockType.DRY_LEAVES) hardness = 10; 
                                if (breakingRef.current.progress >= hardness) { 
                                    const key = `${bx},${by}`; 
                                    if (bType === BlockType.FURNACE) furnacesRef.current.delete(key); 
                                    if (bType === BlockType.CHEST || bType === BlockType.CHEST_MEDIUM || bType === BlockType.CHEST_LARGE || bType === BlockType.STONE_CHEST) chestsRef.current.delete(key); 
                                    if (bType === BlockType.CROP_WHEAT || bType === BlockType.CROP_CARROT || bType === BlockType.CROP_POTATO) { const crop = cropsRef.current.get(key); if(crop) { if(crop.type==='WHEAT') { spawnDrop(bx*BLOCK_SIZE, by*BLOCK_SIZE, 'wheat_seeds', 1); if(crop.stage>=3) spawnDrop(bx*BLOCK_SIZE, by*BLOCK_SIZE, 'wheat', 1); } else if (crop.type === 'CARROT') { spawnDrop(bx*BLOCK_SIZE, by*BLOCK_SIZE, 'carrot', crop.stage>=3 ? 3 : 1); } else if (crop.type === 'POTATO') { spawnDrop(bx*BLOCK_SIZE, by*BLOCK_SIZE, 'potato', crop.stage>=3 ? 3 : 1); } cropsRef.current.delete(key); } } 
                                    if (bType === BlockType.DOOR_BOTTOM_CLOSED || bType === BlockType.DOOR_BOTTOM_OPEN) { setBlockAt(bx, by - 1, BlockType.AIR); spawnDrop(bx * BLOCK_SIZE, by * BLOCK_SIZE, BlockType.DOOR_BOTTOM_CLOSED, 1); } else if (bType === BlockType.DOOR_TOP_CLOSED || bType === BlockType.DOOR_TOP_OPEN) { setBlockAt(bx, by + 1, BlockType.AIR); spawnDrop(bx * BLOCK_SIZE, by * BLOCK_SIZE, BlockType.DOOR_BOTTOM_CLOSED, 1); } 
                                    if (bType === BlockType.DOOR_STONE_BOTTOM_CLOSED || bType === BlockType.DOOR_STONE_BOTTOM_OPEN) { setBlockAt(bx, by - 1, BlockType.AIR); spawnDrop(bx * BLOCK_SIZE, by * BLOCK_SIZE, BlockType.DOOR_STONE_BOTTOM_CLOSED, 1); } else if (bType === BlockType.DOOR_STONE_TOP_CLOSED || bType === BlockType.DOOR_STONE_TOP_OPEN) { setBlockAt(bx, by + 1, BlockType.AIR); spawnDrop(bx * BLOCK_SIZE, by * BLOCK_SIZE, BlockType.DOOR_STONE_BOTTOM_CLOSED, 1); } 
                                    if (bType === BlockType.DOOR_IRON_BOTTOM_CLOSED || bType === BlockType.DOOR_IRON_BOTTOM_OPEN) { setBlockAt(bx, by - 1, BlockType.AIR); spawnDrop(bx * BLOCK_SIZE, by * BLOCK_SIZE, BlockType.DOOR_IRON_BOTTOM_CLOSED, 1); } else if (bType === BlockType.DOOR_IRON_TOP_CLOSED || bType === BlockType.DOOR_IRON_TOP_OPEN) { setBlockAt(bx, by + 1, BlockType.AIR); spawnDrop(bx * BLOCK_SIZE, by * BLOCK_SIZE, BlockType.DOOR_IRON_BOTTOM_CLOSED, 1); } 
                                    if ((bType === BlockType.WOOD || bType === BlockType.DARK_WOOD || bType === BlockType.PINE_WOOD) && heldItem && (heldItem.id?.toString() || '').includes('axe')) {
                                        // Recursively break tree
                                        const queue = [{x: bx, y: by}];
                                        const visited = new Set<string>();
                                        visited.add(`${bx},${by}`);
                                        let h = 0;
                                        while(h < queue.length) {
                                            const p = queue[h++];
                                            // SPAWN DROPS
                                            const b = worldRef.current.blocks[p.y * WORLD_WIDTH + p.x];
                                            setBlockAt(p.x, p.y, BlockType.AIR);
                                            if (p.x !== bx || p.y !== by) { // Not the base block which drops normally later
                                                 if (b === BlockType.WOOD || b === BlockType.DARK_WOOD || b === BlockType.PINE_WOOD) {
                                                     spawnDrop(p.x * BLOCK_SIZE, p.y * BLOCK_SIZE, bType, 1);
                                                 } else if (b === BlockType.LEAVES || b === BlockType.DARK_LEAVES || b === BlockType.PINE_LEAVES || b === BlockType.APPLE_LEAVES || b === BlockType.SNOWY_LEAVES) {
                                                     if (Math.random() < 0.3) {
                                                         spawnDrop(p.x * BLOCK_SIZE, p.y * BLOCK_SIZE, 'tree_seed', 1);
                                                     }
                                                 }
                                            }
                                            
                                            // Neighbors
                                            for(let dx=-1; dx<=1; dx++) {
                                                for(let dy=-1; dy<=1; dy++) {
                                                    const nx = p.x + dx; const ny = p.y + dy;
                                                    if (nx >= 0 && nx < WORLD_WIDTH && ny >= 0 && ny < WORLD_HEIGHT) {
                                                        const key = `${nx},${ny}`;
                                                        if (!visited.has(key)) {
                                                            const nb = worldRef.current.blocks[ny * WORLD_WIDTH + nx];
                                                            if (nb === BlockType.WOOD || nb === BlockType.DARK_WOOD || nb === BlockType.PINE_WOOD || nb === BlockType.LEAVES || nb === BlockType.DARK_LEAVES || nb === BlockType.PINE_LEAVES || nb === BlockType.APPLE_LEAVES || nb === BlockType.SNOWY_LEAVES) {
                                                                visited.add(key);
                                                                queue.push({x: nx, y: ny});
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                        audio.playBreak();
                                    } else {
                                        setBlockAt(bx, by, BlockType.AIR); 
                                        audio.playBreak();
                                    }
                                    if (canHarvest(bType, heldItem)) { 
                                        let dropId: number | string = bType;
                                        if (bType === BlockType.CABLE_ON) dropId = BlockType.CABLE;
                                        if (bType === BlockType.LAMP_ON) dropId = BlockType.LAMP;
                                        if (bType === BlockType.LEVER_ON) dropId = BlockType.LEVER;
                                        if (bType === BlockType.BUTTON_ON) dropId = BlockType.BUTTON;
                                        if (bType === BlockType.SNOWY_GRASS && heldItem && (heldItem.id?.toString() || '').includes('shovel')) {
                                            setBlockAt(bx, by, BlockType.DIRT);
                                            spawnDrop(bx * BLOCK_SIZE, by * BLOCK_SIZE, BlockType.SNOW_BLOCK, 1);
                                        }
                                        else if (bType === BlockType.BERRY_BUSH) { spawnDrop(bx * BLOCK_SIZE, by * BLOCK_SIZE, 'cherry', 1 + Math.floor(Math.random() * 2)); } 
                                        else if (bType === BlockType.APPLE_LEAVES) { spawnDrop(bx * BLOCK_SIZE, by * BLOCK_SIZE, 'apple', 1); }
                                        else if (bType === BlockType.SEED_BUSH) { const rand = Math.random(); if (rand < 0.33) spawnDrop(bx * BLOCK_SIZE, by * BLOCK_SIZE, 'wheat_seeds', 1); else if (rand < 0.66) spawnDrop(bx * BLOCK_SIZE, by * BLOCK_SIZE, 'carrot', 1); else spawnDrop(bx * BLOCK_SIZE, by * BLOCK_SIZE, 'potato', 1); } 
                                        else if (bType === BlockType.BUSH) { spawnDrop(bx * BLOCK_SIZE, by * BLOCK_SIZE, 'stick', 1); } 
                                        else if (bType === BlockType.GRASS || bType === BlockType.DARK_GRASS || bType === BlockType.SNOWY_GRASS) { if (Math.random() < 0.1) spawnDrop(bx * BLOCK_SIZE, by * BLOCK_SIZE, 'wheat_seeds', 1); if (Math.random() < 0.05) spawnDrop(bx * BLOCK_SIZE, by * BLOCK_SIZE, 'carrot', 1); if (Math.random() < 0.05) spawnDrop(bx * BLOCK_SIZE, by * BLOCK_SIZE, 'potato', 1); } 
                                        else if (bType === BlockType.COAL_ORE) { spawnDrop(bx * BLOCK_SIZE, by * BLOCK_SIZE, 'coal', 1); }
                                        else if (bType === BlockType.IRON_ORE) { spawnDrop(bx * BLOCK_SIZE, by * BLOCK_SIZE, 'iron_ingot', 1); }
                                        else if (bType === BlockType.GOLD_ORE) { spawnDrop(bx * BLOCK_SIZE, by * BLOCK_SIZE, 'gold_ingot', 1); }
                                        else if (bType === BlockType.DIAMOND_ORE) { spawnDrop(bx * BLOCK_SIZE, by * BLOCK_SIZE, 'diamond', 1); }
                                        else if (bType === BlockType.COPPER_ORE) { spawnDrop(bx * BLOCK_SIZE, by * BLOCK_SIZE, 'copper_ingot', 1); }
                                        else if (bType === BlockType.TITANIUM_ORE) { spawnDrop(bx * BLOCK_SIZE, by * BLOCK_SIZE, 'titanium', 1); }
                                        else if (bType === BlockType.URANIUM_ORE) { spawnDrop(bx * BLOCK_SIZE, by * BLOCK_SIZE, 'uranium', 1); } 
                                        else if (bType === BlockType.FLOWER_RED || bType === BlockType.FLOWER_GREEN || bType === BlockType.FLOWER_BLUE) { spawnDrop(bx * BLOCK_SIZE, by * BLOCK_SIZE, bType, 1); } 
                                        else if (bType === BlockType.CACTUS) { spawnDrop(bx * BLOCK_SIZE, by * BLOCK_SIZE, 'dark_green_resin', 1); }
                                        else if (bType === BlockType.DRY_LEAVES) { spawnDrop(bx * BLOCK_SIZE, by * BLOCK_SIZE, 'stick', 1 + Math.floor(Math.random() * 2)); }
                                        else if (!(bType?.toString() || '').includes('DOOR') && !(bType?.toString() || '').includes('CROP')) { spawnDrop(bx * BLOCK_SIZE, by * BLOCK_SIZE, dropId, 1); } 
            
            // REMOVED LEVEL LOGIC FOR PICKAXE DROP CHANCE

            } breakingRef.current = { x: -1, y: -1, progress: 0 }; damageTool(selectedSlot); } } else { breakingRef.current = { x: -1, y: -1, progress: 0 }; } } else breakingRef.current = { x: -1, y: -1, progress: 0 }; } }
            } else breakingRef.current = { x: -1, y: -1, progress: 0 };
            
            // ... (rest of mouse handlers) ...
            if (mouseRef.current.left && activeBuildBlock && inventory[selectedSlot] && (inventory[selectedSlot]?.id?.toString() || '').includes('hammer')) {
                 if (bx >= 0 && bx < WORLD_WIDTH && by >= 0 && by < WORLD_HEIGHT) {
                     const now = Date.now();
                     if (now - lastPlacementTime.current > 200) {
                         const idx = by * WORLD_WIDTH + bx;
                         if (world.blocks[idx] === BlockType.AIR || world.blocks[idx] === BlockType.WATER) {
                             let reqId = BlockType.PLANKS;
                             if (activeBuildBlock === BlockType.ROOF_STONE || activeBuildBlock === BlockType.ROOF_STONE_LEFT) reqId = BlockType.STONE;
                             const hasMat = inventory.some(i => i && i.id === reqId && i.count >= 1);
                             if (hasMat) {
                                 setBlockAt(bx, by, activeBuildBlock);
                                 audio.playPlace();
                                 setInventory(prev => { const n = [...prev]; const matIdx = n.findIndex(i => i && i.id === reqId && i.count >= 1); if (matIdx !== -1 && n[matIdx]) { n[matIdx]!.count -= 1; if (n[matIdx]!.count <= 0) n[matIdx] = null; } return n; });
                                 lastPlacementTime.current = now;
                             }
                         }
                     }
                 }
            }
            if (mouseRef.current.right && !spearChargeStartRef.current) {
                 const now = Date.now();
                 if (now - lastPlacementTime.current > 200) {
                     const heldItem = inventory[selectedSlot];
                     if (heldItem && (heldItem.id?.toString() || '').includes('hoe')) {
                         if (bx >= 0 && bx < WORLD_WIDTH && by >= 0 && by < WORLD_HEIGHT) {
                             const idx = by * WORLD_WIDTH + bx;
                             const targetBlock = world.blocks[idx];
                             if (targetBlock === BlockType.GRASS || targetBlock === BlockType.DIRT || targetBlock === BlockType.DARK_GRASS) {
                                 setBlockAt(bx, by, BlockType.FARMLAND);
                                 lastPlacementTime.current = now;
                                 damageTool(selectedSlot);
                                 if ((player.attackCooldown || 0) <= 0) player.attackCooldown = 20;
                             }
                         }
                    } else if (heldItem && (heldItem.id === 'wheat_seeds' || heldItem.id === 'carrot' || heldItem.id === 'potato')) {
                        if (bx >= 0 && bx < WORLD_WIDTH && by >= 0 && by < WORLD_HEIGHT) {
                            const idx = by * WORLD_WIDTH + bx;
                            const targetBlock = world.blocks[idx];
                            if (targetBlock === BlockType.FARMLAND && by > 0 && world.blocks[(by - 1) * WORLD_WIDTH + bx] === BlockType.AIR) {
                                const hasMat = inventory.some(i => i && i.id === heldItem.id && i.count >= 1);
                                if (hasMat) {
                                    const cropType = heldItem.id === 'wheat_seeds' ? BlockType.CROP_WHEAT : (heldItem.id === 'carrot' ? BlockType.CROP_CARROT : BlockType.CROP_POTATO);
                                    setBlockAt(bx, by - 1, cropType);
                                    cropsRef.current.set(`${bx},${by - 1}`, { type: heldItem.id === 'wheat_seeds' ? 'WHEAT' : (heldItem.id === 'carrot' ? 'CARROT' : 'POTATO'), stage: 0, plantedTime: Date.now() });
                                    setInventory(prev => { const n = [...prev]; const matIdx = n.findIndex(i => i && i.id === heldItem.id && i.count >= 1); if (matIdx !== -1 && n[matIdx]) { n[matIdx]!.count -= 1; if (n[matIdx]!.count <= 0) n[matIdx] = null; } return n; });
                                    lastPlacementTime.current = now;
                                }
                            }
                        }
                     } else if (heldItem && (heldItem.type === ItemType.BLOCK || heldItem.id == BlockType.GLASS)) {
                         if (bx >= 0 && bx < WORLD_WIDTH && by >= 0 && by < WORLD_HEIGHT) {
                             const idx = by * WORLD_WIDTH + bx;
                             if (world.blocks[idx] === BlockType.AIR || world.blocks[idx] === BlockType.WATER) {
                                 const pLeft = Math.floor(player.x / BLOCK_SIZE); const pRight = Math.floor((player.x + player.width) / BLOCK_SIZE);
                                 const pTop = Math.floor(player.y / BLOCK_SIZE); const pBottom = Math.floor((player.y + player.height) / BLOCK_SIZE);
                                 let intersecting = (bx >= pLeft && bx <= pRight && by >= pTop && by <= pBottom);
                                 if (!intersecting) {
                                     for (const ent of entitiesRef.current) {
                                         if (ent.type === 'DROP' || ent.type === 'PROJECTILE') continue;
                                         const eLeft = Math.floor(ent.x / BLOCK_SIZE); const eRight = Math.floor((ent.x + ent.width) / BLOCK_SIZE);
                                         const eTop = Math.floor(ent.y / BLOCK_SIZE); const eBottom = Math.floor((ent.y + ent.height) / BLOCK_SIZE);
                                         if (bx >= eLeft && bx <= eRight && by >= eTop && by <= eBottom) {
                                             intersecting = true;
                                             break;
                                         }
                                     }
                                 }
                                 if (heldItem.id === BlockType.DOOR_BOTTOM_CLOSED) {
                                     let topIntersecting = false;
                                     for (const ent of entitiesRef.current) {
                                         if (ent.type === 'DROP' || ent.type === 'PROJECTILE') continue;
                                         const eLeft = Math.floor(ent.x / BLOCK_SIZE); const eRight = Math.floor((ent.x + ent.width) / BLOCK_SIZE);
                                         const eTop = Math.floor(ent.y / BLOCK_SIZE); const eBottom = Math.floor((ent.y + ent.height) / BLOCK_SIZE);
                                         if (bx >= eLeft && bx <= eRight && (by - 1) >= eTop && (by - 1) <= eBottom) {
                                             topIntersecting = true;
                                             break;
                                         }
                                     }
                                     const pLeft = Math.floor(player.x / BLOCK_SIZE); const pRight = Math.floor((player.x + player.width) / BLOCK_SIZE);
                                     const pTop = Math.floor(player.y / BLOCK_SIZE); const pBottom = Math.floor((player.y + player.height) / BLOCK_SIZE);
                                     if (bx >= pLeft && bx <= pRight && (by - 1) >= pTop && (by - 1) <= pBottom) topIntersecting = true;

                                     if (by > 0 && world.blocks[(by-1)*WORLD_WIDTH + bx] === BlockType.AIR && !intersecting && !topIntersecting) {
                                         const hasMat = inventory.some(i => i && i.id === BlockType.DOOR_BOTTOM_CLOSED && i.count >= 1);
                                         if (hasMat) {
                                             setBlockAt(bx, by, BlockType.DOOR_BOTTOM_CLOSED); setBlockAt(bx, by-1, BlockType.DOOR_TOP_CLOSED);
                                             audio.playPlace();
                                             setInventory(prev => { const n = [...prev]; const matIdx = n.findIndex(i => i && i.id === BlockType.DOOR_BOTTOM_CLOSED && i.count >= 1); if (matIdx !== -1 && n[matIdx]) { n[matIdx]!.count -= 1; if (n[matIdx]!.count <= 0) n[matIdx] = null; } return n; });
                                             lastPlacementTime.current = now;
                                         }
                                     }
                                 } else if (heldItem.id === BlockType.LADDER) {
                                     // Ladder Restriction: Must be on WALL_WOOD or adjacent to solid block
                                     const left = world.blocks[by * WORLD_WIDTH + (bx - 1)];
                                     const right = world.blocks[by * WORLD_WIDTH + (bx + 1)];
                                     const target = world.blocks[by * WORLD_WIDTH + bx];
                                     const isWall = target === BlockType.WALL_WOOD;
                                     // Helper to check if block provides support (Solid and not Air/Water/Ladder)
                                     const isSupport = (b: BlockType) => b !== BlockType.AIR && b !== BlockType.WATER && b !== BlockType.LADDER && !LIGHT_TRANSPARENT_BLOCKS.has(b);
                                     
                                     // Allow if replacing wall OR adjacent to support
                                     // Note: LIGHT_TRANSPARENT_BLOCKS includes WALL_WOOD, so isSupport(WALL_WOOD) is false.
                                     // This is correct because we check isWall separately.
                                     
                                     if (!intersecting && (isWall || isSupport(left) || isSupport(right))) {
                                         const hasMat = inventory.some(i => i && i.id === BlockType.LADDER && i.count >= 1);
                                         if (hasMat) {
                                             setBlockAt(bx, by, BlockType.LADDER);
                                             audio.playPlace();
                                             setInventory(prev => { const n = [...prev]; const matIdx = n.findIndex(i => i && i.id === BlockType.LADDER && i.count >= 1); if (matIdx !== -1 && n[matIdx]) { n[matIdx]!.count -= 1; if (n[matIdx]!.count <= 0) n[matIdx] = null; } return n; });
                                             lastPlacementTime.current = now;
                                         }
                                     } else if (!intersecting) {
                                         addNotification(t.LADDER_REQ);
                                     }
                                 } else if (!intersecting) {
                                     const hasMat = inventory.some(i => i && i.id === heldItem.id && i.count >= 1);
                                     if (hasMat) {
                                         setBlockAt(bx, by, heldItem.id as BlockType);
                                         audio.playPlace();
                                         setInventory(prev => { const n = [...prev]; const matIdx = n.findIndex(i => i && i.id === heldItem.id && i.count >= 1); if (matIdx !== -1 && n[matIdx]) { n[matIdx]!.count -= 1; if (n[matIdx]!.count <= 0) n[matIdx] = null; } return n; });
                                         lastPlacementTime.current = now;
                                     }
                                 }
                             }
                         }
                     }
                 }
            }
        }

        cameraRef.current.x = player.x - cvs.width / 2; cameraRef.current.y = player.y - cvs.height / 2;
        if (cameraRef.current.x < 0) cameraRef.current.x = 0; if (cameraRef.current.x > WORLD_WIDTH * BLOCK_SIZE - cvs.width) cameraRef.current.x = WORLD_WIDTH * BLOCK_SIZE - cvs.width; if (cameraRef.current.y < 0) cameraRef.current.y = 0; if (cameraRef.current.y > WORLD_HEIGHT * BLOCK_SIZE - cvs.height) cameraRef.current.y = WORLD_HEIGHT * BLOCK_SIZE - cvs.height;

        // --- DYNAMIC SKY ---
        const time = timeRef.current;
        const isRaining = world.weather && (world.weather.type === 'RAIN' || world.weather.type === 'HEAVY_RAIN');
        const isSnowing = world.weather && world.weather.type === 'SNOW';
        const isPrecipitating = isRaining || isSnowing;
        
        let skyColor = '#87CEEB';
        let cloudColor = '#ffffff';
        let sunY = -100;
        let moonY = -100;
        let sunX = -100;
        let moonX = -100;
        
        const dayProgress = time / 18000; 
        const nightProgress = (time - 18000) / 18000; 
        
        if (time < 18000) {
            // Day
            sunX = cvs.width * dayProgress;
            sunY = cvs.height * 0.8 - Math.sin(dayProgress * Math.PI) * (cvs.height * 0.6);
            
            if (time < 3000) { // Dawn
                const p = time / 3000;
                skyColor = `rgb(${Math.floor(255 - 120*p)}, ${Math.floor(140 + 66*p)}, ${Math.floor(0 + 235*p)})`;
            } else if (time > 15000) { // Dusk
                const p = (time - 15000) / 3000;
                skyColor = `rgb(${Math.floor(135 + 120*p)}, ${Math.floor(206 - 66*p)}, ${Math.floor(235 - 235*p)})`;
            } else {
                skyColor = '#87CEEB';
            }
            cloudColor = isPrecipitating ? '#95a5a6' : '#ffffff';
        } else {
            // Night
            moonX = cvs.width * nightProgress;
            moonY = cvs.height * 0.8 - Math.sin(nightProgress * Math.PI) * (cvs.height * 0.6);
            
            if (moonPhaseRef.current === 'BLOOD') {
                skyColor = '#3a0000'; // Deep red sky
                cloudColor = '#1a0000';
            } else {
                if (time < 21000) { // Dusk fading to night
                    const p = (time - 18000) / 3000;
                    skyColor = `rgb(${Math.floor(255 * (1-p))}, ${Math.floor(140 * (1-p))}, ${Math.floor(51 * p)})`;
                } else if (time > 33000) { // Night fading to dawn
                    const p = (time - 33000) / 3000;
                    skyColor = `rgb(${Math.floor(255 * p)}, ${Math.floor(140 * p)}, ${Math.floor(51 * (1-p))})`;
                } else {
                    skyColor = '#000033';
                }
                cloudColor = isPrecipitating ? '#4a5568' : '#2c3e50'; 
            }
        }
        
        if (isPrecipitating && moonPhaseRef.current !== 'BLOOD') {
            skyColor = time < 18000 ? '#7f8c8d' : '#1a252f';
        }

        // Realistic Sky Gradient
        const skyGrad = ctx.createLinearGradient(0, 0, 0, cvs.height);
        skyGrad.addColorStop(0, skyColor);
        // Slightly lighter towards the horizon
        skyGrad.addColorStop(1, moonPhaseRef.current === 'BLOOD' ? '#200000' : (time >= DUSK_START || time < DAWN_START ? '#0a0a1a' : '#b3e5fc'));
        
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, cvs.width, cvs.height);
        
        // Draw Sun
        if (sunY > -50 && sunY < cvs.height && !isPrecipitating) {
            const sunGrad = ctx.createRadialGradient(sunX, sunY, 15, sunX, sunY, 80);
            sunGrad.addColorStop(0, '#FFFFFF');
            sunGrad.addColorStop(0.2, '#FFD700');
            sunGrad.addColorStop(0.5, 'rgba(255, 165, 0, 0.4)');
            sunGrad.addColorStop(1, 'rgba(255, 165, 0, 0)');
            
            ctx.globalCompositeOperation = 'screen';
            ctx.fillStyle = sunGrad;
            ctx.beginPath();
            ctx.arc(sunX, sunY, 80, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalCompositeOperation = 'source-over';
        }
        
        // Draw Moon
        if (moonY > -50 && moonY < cvs.height && !isPrecipitating) {
            ctx.fillStyle = '#F4F6F0';
            ctx.beginPath();
            ctx.arc(moonX, moonY, 25, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#E0E0E0';
            ctx.beginPath(); ctx.arc(moonX - 5, moonY - 5, 4, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(moonX + 8, moonY + 2, 6, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(moonX - 2, moonY + 8, 3, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = 'rgba(244, 246, 240, 0.1)';
            ctx.beginPath();
            ctx.arc(moonX, moonY, 45, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Draw Clouds
        if (cloudsRef.current.length === 0) {
            for (let i = 0; i < 15; i++) {
                cloudsRef.current.push({
                    x: Math.random() * WORLD_WIDTH * BLOCK_SIZE,
                    y: 20 + Math.random() * 150,
                    speed: 0.1 + Math.random() * 0.3,
                    size: 1 + Math.random() * 1.5,
                    layer: Math.floor(Math.random() * 3)
                });
            }
        }
        
        ctx.fillStyle = cloudColor;
        cloudsRef.current.forEach(cloud => {
            cloud.x += cloud.speed;
            if (cloud.x > WORLD_WIDTH * BLOCK_SIZE) cloud.x = -200;
            
            const parallax = 0.2 + (cloud.layer * 0.1);
            let cx = (cloud.x - cameraRef.current.x * parallax) % (cvs.width + 400);
            if (cx < -200) cx += cvs.width + 400;
            
            ctx.beginPath();
            ctx.arc(cx, cloud.y, 20 * cloud.size, 0, Math.PI * 2);
            ctx.arc(cx + 25 * cloud.size, cloud.y - 10 * cloud.size, 25 * cloud.size, 0, Math.PI * 2);
            ctx.arc(cx + 50 * cloud.size, cloud.y, 20 * cloud.size, 0, Math.PI * 2);
            ctx.fill();
        });
        
        // --- SHADERS BACKGROUND BLOOM (God Rays) ---
        // Draw this before the blocks so blocks occlude the rays!
        if (options.graphicsQuality === 'ULTRA') {
            const t2 = timeRef.current;
            const isPrecip2 = isPrecipitating;
            ctx.globalCompositeOperation = 'screen';
            if (t2 < NIGHT_START && !isPrecip2) {
                const grad = ctx.createRadialGradient(sunX, sunY, 10, sunX, sunY, Math.max(cvs.width, cvs.height) * 1.5);
                grad.addColorStop(0, 'rgba(255, 255, 230, 0.8)');
                grad.addColorStop(0.1, 'rgba(255, 240, 180, 0.4)');
                grad.addColorStop(0.3, 'rgba(255, 200, 100, 0.15)');
                grad.addColorStop(0.7, 'rgba(255, 120, 50, 0.05)');
                grad.addColorStop(1, 'rgba(255, 100, 20, 0)');
                ctx.fillStyle = grad;
                ctx.fillRect(0, 0, cvs.width, cvs.height);
            } else if (!isPrecip2) {
                const grad = ctx.createRadialGradient(moonX, moonY, 10, moonX, moonY, Math.max(cvs.width, cvs.height) * 1.2);
                grad.addColorStop(0, 'rgba(220, 240, 255, 0.5)');
                grad.addColorStop(0.2, 'rgba(180, 210, 255, 0.15)');
                grad.addColorStop(0.5, 'rgba(100, 150, 255, 0.05)');
                grad.addColorStop(1, 'rgba(50, 100, 255, 0)');
                ctx.fillStyle = grad;
                ctx.fillRect(0, 0, cvs.width, cvs.height);
            }
            ctx.globalCompositeOperation = 'source-over';
        }

        ctx.save();
        ctx.translate(-Math.floor(cameraRef.current.x), -Math.floor(cameraRef.current.y));

        // ... (rest of drawing logic) ...
        const startCol = Math.floor(cameraRef.current.x / BLOCK_SIZE) - 1; const endCol = startCol + (cvs.width / BLOCK_SIZE) + 3;
        const startRow = Math.floor(cameraRef.current.y / BLOCK_SIZE) - 1; const endRow = startRow + (cvs.height / BLOCK_SIZE) + 3;
        const hasTorch = (inventory[selectedSlot]?.id === BlockType.TORCH) || (equipment.offHand?.id === BlockType.TORCH);

        if (options.shaderLevel === 2) {
            const shadowPath = new Path2D();
            for (let y = startRow; y <= endRow; y++) {
                for (let x = startCol; x <= endCol; x++) {
                    if (y < 0 || y >= WORLD_HEIGHT || x < 0 || x >= WORLD_WIDTH) continue;
                    const block = world.blocks[y * WORLD_WIDTH + x];
                    if (block !== BlockType.AIR && block !== BlockType.WATER && block !== BlockType.LAVA && block !== BlockType.GLASS && block !== BlockType.TORCH && block !== BlockType.COBWEB && block !== BlockType.WALL_WOOD && block !== BlockType.DOOR_BOTTOM_OPEN && block !== BlockType.DOOR_TOP_OPEN && block !== BlockType.DOOR_IRON_BOTTOM_OPEN && block !== BlockType.DOOR_IRON_TOP_OPEN && block !== BlockType.DOOR_STONE_BOTTOM_OPEN && block !== BlockType.DOOR_STONE_TOP_OPEN) {
                        shadowPath.rect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
                    }
                }
            }
            ctx.save();
            const isDayLight = time < 14000 || time > 22000;
            const sunAngle = (time / 24000) * Math.PI * 2;
            const shadowX = -Math.sin(sunAngle) * 30; // wider shadow angle
            const shadowY = Math.max(3, Math.abs(Math.cos(sunAngle) * 15)); 
            
            ctx.translate(shadowX, shadowY);
            ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
            ctx.globalCompositeOperation = 'source-over';
            ctx.fill(shadowPath);
            ctx.restore();
        }

        for (let y = startRow; y <= endRow; y++) {
            for (let x = startCol; x <= endCol; x++) {
                if (y < 0 || y >= WORLD_HEIGHT || x < 0 || x >= WORLD_WIDTH) continue;
                const idx = y * WORLD_WIDTH + x; const block = world.blocks[idx]; const baseLight = world.light[idx] || 0; const light = getRenderLight(x, y, baseLight, player, hasTorch);

                if (block !== BlockType.AIR) {
                    const isOre = (block === BlockType.COAL_ORE || block === BlockType.IRON_ORE || block === BlockType.GOLD_ORE || block === BlockType.DIAMOND_ORE || block === BlockType.COPPER_ORE || block === BlockType.TITANIUM_ORE || block === BlockType.URANIUM_ORE);
                    if (block === BlockType.WATER || block === BlockType.LAVA) { 
                        // Realistic Fluid
                        const isLava = block === BlockType.LAVA;
                        const wave1 = Math.sin(timeRef.current * 0.05 + x * 0.2) * 0.1;
                        const wave2 = Math.cos(timeRef.current * 0.03 + y * 0.1) * 0.1;
                        ctx.globalAlpha = (isLava ? 0.9 : 0.6) + Math.max(0, wave1 + wave2);
                        
                        const grad = ctx.createLinearGradient(x * BLOCK_SIZE, y * BLOCK_SIZE, x * BLOCK_SIZE, (y + 1) * BLOCK_SIZE);
                        if (isLava) {
                            grad.addColorStop(0, 'rgba(255, 152, 0, 0.8)'); 
                            grad.addColorStop(1, 'rgba(216, 67, 21, 1)');
                        } else {
                            grad.addColorStop(0, 'rgba(33, 150, 243, 0.4)'); 
                            grad.addColorStop(1, 'rgba(25, 118, 210, 0.8)');
                        }
                        ctx.fillStyle = grad;
                        ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE); 
                        
                        // Fake reflections above fluid
                        if (y > 0 && world.blocks[(y - 1) * WORLD_WIDTH + x] !== BlockType.AIR) {
                            ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
                            ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE / 2);
                        }
                        
                        // Sparkles / Embers
                        if ((light >= 10 || isLava) && Math.random() < (isLava ? 0.08 : 0.03)) {
                            ctx.fillStyle = isLava ? '#ffeb3b' : 'rgba(255, 255, 255, 0.6)';
                            ctx.fillRect(x * BLOCK_SIZE + Math.random() * (BLOCK_SIZE - 2), y * BLOCK_SIZE + Math.random() * (BLOCK_SIZE - 2), 2, 2);
                        }
                        ctx.globalAlpha = 1.0; 
                    }
                    else if (block === BlockType.ICE) {
                        ctx.fillStyle = 'rgba(173, 216, 230, 0.6)';
                        ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
                        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
                        ctx.fillRect(x * BLOCK_SIZE + 2, y * BLOCK_SIZE + 2, BLOCK_SIZE - 4, 2);
                        ctx.fillRect(x * BLOCK_SIZE + 2, y * BLOCK_SIZE + 4, 2, BLOCK_SIZE - 6);
                        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
                        ctx.lineWidth = 2;
                        ctx.beginPath(); ctx.moveTo(x * BLOCK_SIZE + 8, y * BLOCK_SIZE + 24); ctx.lineTo(x * BLOCK_SIZE + 24, y * BLOCK_SIZE + 8); ctx.stroke();
                    }
                    else if (block === BlockType.GLASS || block === BlockType.GLASS_GREEN || block === BlockType.GLASS_BLUE) { 
                        ctx.fillStyle = block === BlockType.GLASS_GREEN ? 'rgba(76, 175, 80, 0.3)' : (block === BlockType.GLASS_BLUE ? 'rgba(33, 150, 243, 0.3)' : 'rgba(200, 200, 255, 0.2)'); 
                        ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
                        ctx.lineWidth = 2; 
                        ctx.strokeStyle = block === BlockType.GLASS_GREEN ? 'rgba(76, 175, 80, 0.8)' : (block === BlockType.GLASS_BLUE ? 'rgba(33, 150, 243, 0.8)' : 'rgba(255,255,255,0.8)');
                        ctx.strokeRect(x * BLOCK_SIZE + 2, y * BLOCK_SIZE + 2, BLOCK_SIZE - 4, BLOCK_SIZE - 4); 
                        
                        // Circular shine
                        ctx.fillStyle = 'rgba(255,255,255,0.4)'; 
                        ctx.beginPath();
                        ctx.arc(x * BLOCK_SIZE + 10, y * BLOCK_SIZE + 10, 4, 0, Math.PI * 2);
                        ctx.fill();
                        ctx.beginPath();
                        ctx.arc(x * BLOCK_SIZE + 20, y * BLOCK_SIZE + 22, 2, 0, Math.PI * 2);
                        ctx.fill();
                    }
                    else if (block === BlockType.CACTUS) {
                        ctx.fillStyle = '#4CAF50'; // Green
                        ctx.fillRect(x * BLOCK_SIZE + 4, y * BLOCK_SIZE, 24, BLOCK_SIZE);
                        // Thorns
                        ctx.fillStyle = '#1B5E20';
                        for(let i=0; i<5; i++) {
                            ctx.fillRect(x * BLOCK_SIZE + 2, y * BLOCK_SIZE + (i*6) + 2, 2, 1);
                            ctx.fillRect(x * BLOCK_SIZE + 28, y * BLOCK_SIZE + (i*6) + 4, 2, 1);
                        }
                    }
                    else if (block === BlockType.ROOF_WOOD || block === BlockType.ROOF_STONE) { ctx.fillStyle = BLOCK_COLORS[block]; ctx.beginPath(); ctx.moveTo(x * BLOCK_SIZE, y * BLOCK_SIZE + BLOCK_SIZE); ctx.lineTo(x * BLOCK_SIZE, y * BLOCK_SIZE); ctx.lineTo(x * BLOCK_SIZE + BLOCK_SIZE, y * BLOCK_SIZE + BLOCK_SIZE); ctx.fill(); }
                    else if (block === BlockType.ROOF_WOOD_LEFT || block === BlockType.ROOF_STONE_LEFT) { ctx.fillStyle = BLOCK_COLORS[block]; ctx.beginPath(); ctx.moveTo(x * BLOCK_SIZE, y * BLOCK_SIZE + BLOCK_SIZE); ctx.lineTo(x * BLOCK_SIZE + BLOCK_SIZE, y * BLOCK_SIZE); ctx.lineTo(x * BLOCK_SIZE + BLOCK_SIZE, y * BLOCK_SIZE + BLOCK_SIZE); ctx.fill(); }
                    else if (block === BlockType.WALL_WOOD) { ctx.fillStyle = BLOCK_COLORS[block]; ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE); ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE); }
                    else if (block === BlockType.SPIKE) {
                        ctx.fillStyle = BLOCK_COLORS[block];
                        // If there is air below it, draw it upside down (ceiling spike)
                        const blockBelow = world.blocks[(y+1) * WORLD_WIDTH + x];
                        if (blockBelow === BlockType.AIR || blockBelow === BlockType.WATER) {
                            ctx.beginPath(); ctx.moveTo(x*BLOCK_SIZE + BLOCK_SIZE/2, y*BLOCK_SIZE + BLOCK_SIZE); ctx.lineTo(x*BLOCK_SIZE, y*BLOCK_SIZE); ctx.lineTo(x*BLOCK_SIZE + BLOCK_SIZE, y*BLOCK_SIZE); ctx.fill();
                        } else {
                            ctx.beginPath(); ctx.moveTo(x*BLOCK_SIZE + BLOCK_SIZE/2, y*BLOCK_SIZE); ctx.lineTo(x*BLOCK_SIZE, y*BLOCK_SIZE + BLOCK_SIZE); ctx.lineTo(x*BLOCK_SIZE + BLOCK_SIZE, y*BLOCK_SIZE + BLOCK_SIZE); ctx.fill();
                        }
                    }
                    else if (block === BlockType.COBWEB) {
                        ctx.strokeStyle = BLOCK_COLORS[block]; ctx.lineWidth = 1;
                        ctx.beginPath(); ctx.moveTo(x*BLOCK_SIZE, y*BLOCK_SIZE); ctx.lineTo(x*BLOCK_SIZE + BLOCK_SIZE, y*BLOCK_SIZE + BLOCK_SIZE); ctx.stroke();
                        ctx.beginPath(); ctx.moveTo(x*BLOCK_SIZE + BLOCK_SIZE, y*BLOCK_SIZE); ctx.lineTo(x*BLOCK_SIZE, y*BLOCK_SIZE + BLOCK_SIZE); ctx.stroke();
                        ctx.beginPath(); ctx.moveTo(x*BLOCK_SIZE + BLOCK_SIZE/2, y*BLOCK_SIZE); ctx.lineTo(x*BLOCK_SIZE + BLOCK_SIZE/2, y*BLOCK_SIZE + BLOCK_SIZE); ctx.stroke();
                        ctx.beginPath(); ctx.moveTo(x*BLOCK_SIZE, y*BLOCK_SIZE + BLOCK_SIZE/2); ctx.lineTo(x*BLOCK_SIZE + BLOCK_SIZE, y*BLOCK_SIZE + BLOCK_SIZE/2); ctx.stroke();
                    }
                    else if (block === BlockType.VINES) {
                        ctx.fillStyle = BLOCK_COLORS[block];
                        ctx.fillRect(x*BLOCK_SIZE + 14, y*BLOCK_SIZE, 4, BLOCK_SIZE);
                        ctx.fillStyle = '#64dd17';
                        ctx.fillRect(x*BLOCK_SIZE + 10, y*BLOCK_SIZE + 6, 4, 4);
                        ctx.fillRect(x*BLOCK_SIZE + 18, y*BLOCK_SIZE + 14, 4, 4);
                        ctx.fillRect(x*BLOCK_SIZE + 11, y*BLOCK_SIZE + 24, 4, 4);
                    }
                    else if (block === BlockType.MOSS) {
                        ctx.fillStyle = BLOCK_COLORS[block];
                        ctx.fillRect(x*BLOCK_SIZE, y*BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
                        ctx.fillStyle = '#2e7d32'; // darker moss spots
                        ctx.fillRect(x*BLOCK_SIZE + 4, y*BLOCK_SIZE + 4, 8, 4);
                        ctx.fillRect(x*BLOCK_SIZE + 16, y*BLOCK_SIZE + 16, 12, 6);
                        ctx.fillRect(x*BLOCK_SIZE + 24, y*BLOCK_SIZE + 4, 4, 4);
                    }
                    else if (block === BlockType.CABLE || block === BlockType.CABLE_ON) {
                        const isOn = block === BlockType.CABLE_ON;
                        ctx.fillStyle = isOn ? '#ff5252' : '#8c2020';
                        const wDown = y < WORLD_HEIGHT - 1 ? world.blocks[(y + 1) * WORLD_WIDTH + x] : BlockType.AIR;
                        const wLeft = x > 0 ? world.blocks[y * WORLD_WIDTH + x - 1] : BlockType.AIR;
                        const wRight = x < WORLD_WIDTH - 1 ? world.blocks[y * WORLD_WIDTH + x + 1] : BlockType.AIR;
                        const wUp = y > 0 ? world.blocks[(y - 1) * WORLD_WIDTH + x] : BlockType.AIR;

                        const isSolidBg = (b: number) => !NON_COLLIDABLE_BLOCKS.has(b);
                        const isNode = (b: number) => b === BlockType.CABLE || b === BlockType.CABLE_ON || b === BlockType.LAMP || b === BlockType.LAMP_ON || b === BlockType.BUTTON || b === BlockType.BUTTON_ON || b === BlockType.LEVER || b === BlockType.LEVER_ON;

                        let cx = x * BLOCK_SIZE + BLOCK_SIZE / 2 - 2;
                        let cy = y * BLOCK_SIZE + BLOCK_SIZE / 2 - 2;
                        
                        if (isSolidBg(wDown)) cy = y * BLOCK_SIZE + BLOCK_SIZE - 4;
                        else if (isSolidBg(wLeft)) cx = x * BLOCK_SIZE;
                        else if (isSolidBg(wRight)) cx = x * BLOCK_SIZE + BLOCK_SIZE - 4;
                        else if (isSolidBg(wUp)) cy = y * BLOCK_SIZE;

                        ctx.fillRect(cx, cy, 4, 4);

                        // Connect lines
                        if (isNode(wLeft)) ctx.fillRect(x * BLOCK_SIZE, cy, cx - x * BLOCK_SIZE, 4);
                        if (isNode(wRight)) ctx.fillRect(cx + 4, cy, BLOCK_SIZE - (cx + 4 - x * BLOCK_SIZE), 4);
                        if (isNode(wUp)) ctx.fillRect(cx, y * BLOCK_SIZE, 4, cy - y * BLOCK_SIZE);
                        if (isNode(wDown)) ctx.fillRect(cx, cy + 4, 4, BLOCK_SIZE - (cy + 4 - y * BLOCK_SIZE));
                    }
                    else if (block === BlockType.LADDER) {
                        // Draw wall background if needed? No, just draw ladder.
                        ctx.fillStyle = '#8d6e63'; // Wood color
                        // Rails
                        ctx.fillRect(x * BLOCK_SIZE + 6, y * BLOCK_SIZE, 4, BLOCK_SIZE);
                        ctx.fillRect(x * BLOCK_SIZE + 22, y * BLOCK_SIZE, 4, BLOCK_SIZE);
                        // Rungs
                        for(let i=0; i<4; i++) {
                            ctx.fillRect(x * BLOCK_SIZE + 6, y * BLOCK_SIZE + (i * 8) + 2, 20, 4);
                        }
                    }
                    else if (block === BlockType.DOOR_BOTTOM_CLOSED || block === BlockType.DOOR_TOP_CLOSED || block === BlockType.DOOR_STONE_BOTTOM_CLOSED || block === BlockType.DOOR_STONE_TOP_CLOSED || block === BlockType.DOOR_IRON_BOTTOM_CLOSED || block === BlockType.DOOR_IRON_TOP_CLOSED) { 
                        const isStone = block === BlockType.DOOR_STONE_BOTTOM_CLOSED || block === BlockType.DOOR_STONE_TOP_CLOSED;
                        const isIron = block === BlockType.DOOR_IRON_BOTTOM_CLOSED || block === BlockType.DOOR_IRON_TOP_CLOSED;
                        // Draw detailed door
                        ctx.fillStyle = isIron ? '#78909c' : (isStone ? '#424242' : '#5d4037'); // Dark wood frame
                        ctx.fillRect(x * BLOCK_SIZE + 6, y * BLOCK_SIZE, 20, BLOCK_SIZE);
                        
                        // Inner panel
                        ctx.fillStyle = isIron ? '#b0bec5' : (isStone ? '#616161' : '#8d6e63'); // Lighter wood
                        ctx.fillRect(x * BLOCK_SIZE + 8, y * BLOCK_SIZE + 2, 16, BLOCK_SIZE - 4);
                        
                        // Knob (only on bottom part)
                        if (block === BlockType.DOOR_BOTTOM_CLOSED || block === BlockType.DOOR_STONE_BOTTOM_CLOSED || block === BlockType.DOOR_IRON_BOTTOM_CLOSED) {
                            ctx.fillStyle = isIron ? '#37474f' : '#ffd700'; // Gold knob
                            ctx.beginPath();
                            ctx.arc(x * BLOCK_SIZE + 22, y * BLOCK_SIZE + 16, 2, 0, Math.PI * 2);
                            ctx.fill();
                        }
                    }
                    else if (block === BlockType.DOOR_BOTTOM_OPEN || block === BlockType.DOOR_TOP_OPEN || block === BlockType.DOOR_STONE_BOTTOM_OPEN || block === BlockType.DOOR_STONE_TOP_OPEN || block === BlockType.DOOR_IRON_BOTTOM_OPEN || block === BlockType.DOOR_IRON_TOP_OPEN) { 
                        const isStone = block === BlockType.DOOR_STONE_BOTTOM_OPEN || block === BlockType.DOOR_STONE_TOP_OPEN;
                        const isIron = block === BlockType.DOOR_IRON_BOTTOM_OPEN || block === BlockType.DOOR_IRON_TOP_OPEN;
                        // Draw open door (side view)
                        ctx.fillStyle = isIron ? '#78909c' : (isStone ? '#424242' : '#5d4037');
                        ctx.fillRect(x * BLOCK_SIZE + 2, y * BLOCK_SIZE, 6, BLOCK_SIZE);
                        
                        // Detail line
                        ctx.fillStyle = isIron ? '#546e7a' : (isStone ? '#212121' : '#3e2723');
                        ctx.fillRect(x * BLOCK_SIZE + 4, y * BLOCK_SIZE, 2, BLOCK_SIZE);
                    }
                    else if (block === BlockType.CROP_WHEAT || block === BlockType.CROP_CARROT || block === BlockType.CROP_POTATO) {
                        const crop = cropsRef.current.get(`${x},${y}`);
                        if (crop) {
                            const stage = crop.stage;
                            const h = 8 + (stage * 6);
                            
                            // Base dirt mound for crop
                            ctx.fillStyle = '#3e2723';
                            ctx.fillRect(x * BLOCK_SIZE + 4, y * BLOCK_SIZE + 26, 24, 6);
                            ctx.fillStyle = '#4a3018';
                            ctx.fillRect(x * BLOCK_SIZE + 6, y * BLOCK_SIZE + 24, 20, 2);
                            
                            // Stems
                            ctx.fillStyle = '#4caf50';
                            ctx.fillRect(x * BLOCK_SIZE + 8, y * BLOCK_SIZE + (BLOCK_SIZE - h), 2, h - 6);
                            ctx.fillRect(x * BLOCK_SIZE + 16, y * BLOCK_SIZE + (BLOCK_SIZE - h) - 2, 2, h - 4);
                            ctx.fillRect(x * BLOCK_SIZE + 24, y * BLOCK_SIZE + (BLOCK_SIZE - h), 2, h - 6);

                            if (stage > 0) {
                                if (block === BlockType.CROP_WHEAT) {
                                    // Wheat stalks
                                    ctx.fillStyle = stage === 3 ? '#fbc02d' : '#cddc39';
                                    ctx.fillRect(x * BLOCK_SIZE + 6, y * BLOCK_SIZE + (BLOCK_SIZE - h) - 2, 2, h);
                                    ctx.fillRect(x * BLOCK_SIZE + 14, y * BLOCK_SIZE + (BLOCK_SIZE - h) - 4, 2, h + 2);
                                    ctx.fillRect(x * BLOCK_SIZE + 22, y * BLOCK_SIZE + (BLOCK_SIZE - h) - 2, 2, h);
                                    
                                    if (stage === 3) {
                                        // Wheat heads
                                        ctx.fillStyle = '#fff59d';
                                        ctx.fillRect(x * BLOCK_SIZE + 5, y * BLOCK_SIZE + (BLOCK_SIZE - h) - 6, 4, 8);
                                        ctx.fillRect(x * BLOCK_SIZE + 13, y * BLOCK_SIZE + (BLOCK_SIZE - h) - 10, 4, 10);
                                        ctx.fillRect(x * BLOCK_SIZE + 21, y * BLOCK_SIZE + (BLOCK_SIZE - h) - 6, 4, 8);
                                        
                                        // Details
                                        ctx.fillStyle = '#f57f17';
                                        ctx.fillRect(x * BLOCK_SIZE + 6, y * BLOCK_SIZE + (BLOCK_SIZE - h) - 4, 2, 2);
                                        ctx.fillRect(x * BLOCK_SIZE + 14, y * BLOCK_SIZE + (BLOCK_SIZE - h) - 8, 2, 2);
                                        ctx.fillRect(x * BLOCK_SIZE + 22, y * BLOCK_SIZE + (BLOCK_SIZE - h) - 4, 2, 2);
                                    }
                                } else if (block === BlockType.CROP_CARROT) {
                                    if (stage === 3) {
                                        // Carrot root
                                        ctx.fillStyle = '#e65100'; 
                                        ctx.fillRect(x * BLOCK_SIZE + 8, y * BLOCK_SIZE + 20, 6, 6);
                                        ctx.fillRect(x * BLOCK_SIZE + 16, y * BLOCK_SIZE + 18, 6, 8);
                                        ctx.fillRect(x * BLOCK_SIZE + 24, y * BLOCK_SIZE + 20, 6, 6);
                                        
                                        ctx.fillStyle = '#ff9800'; 
                                        ctx.fillRect(x * BLOCK_SIZE + 9, y * BLOCK_SIZE + 20, 4, 6);
                                        ctx.fillRect(x * BLOCK_SIZE + 17, y * BLOCK_SIZE + 18, 4, 8);
                                        ctx.fillRect(x * BLOCK_SIZE + 25, y * BLOCK_SIZE + 20, 4, 6);
                                    }
                                    // Bushy carrot leaves
                                    ctx.fillStyle = '#2e7d32'; 
                                    ctx.fillRect(x * BLOCK_SIZE + 6, y * BLOCK_SIZE + (BLOCK_SIZE - h), 8, 8);
                                    ctx.fillRect(x * BLOCK_SIZE + 14, y * BLOCK_SIZE + (BLOCK_SIZE - h) - 4, 8, 10);
                                    ctx.fillRect(x * BLOCK_SIZE + 22, y * BLOCK_SIZE + (BLOCK_SIZE - h), 8, 8);
                                    
                                    ctx.fillStyle = '#4caf50';
                                    ctx.fillRect(x * BLOCK_SIZE + 8, y * BLOCK_SIZE + (BLOCK_SIZE - h) + 2, 4, 4);
                                    ctx.fillRect(x * BLOCK_SIZE + 16, y * BLOCK_SIZE + (BLOCK_SIZE - h) - 2, 4, 4);
                                    ctx.fillRect(x * BLOCK_SIZE + 24, y * BLOCK_SIZE + (BLOCK_SIZE - h) + 2, 4, 4);
                                } else if (block === BlockType.CROP_POTATO) {
                                    if (stage === 3) {
                                        // Potato root
                                        ctx.fillStyle = '#5d4037'; 
                                        ctx.fillRect(x * BLOCK_SIZE + 6, y * BLOCK_SIZE + 22, 8, 6);
                                        ctx.fillRect(x * BLOCK_SIZE + 16, y * BLOCK_SIZE + 20, 8, 7);
                                        
                                        ctx.fillStyle = '#8d6e63'; 
                                        ctx.fillRect(x * BLOCK_SIZE + 7, y * BLOCK_SIZE + 23, 6, 4);
                                        ctx.fillRect(x * BLOCK_SIZE + 17, y * BLOCK_SIZE + 21, 6, 5);
                                        
                                        ctx.fillStyle = '#4e342e'; // Eyes
                                        ctx.fillRect(x * BLOCK_SIZE + 8, y * BLOCK_SIZE + 24, 2, 2);
                                        ctx.fillRect(x * BLOCK_SIZE + 19, y * BLOCK_SIZE + 22, 2, 2);
                                    }
                                    // Potato leaves
                                    ctx.fillStyle = '#1b5e20'; 
                                    ctx.fillRect(x * BLOCK_SIZE + 6, y * BLOCK_SIZE + (BLOCK_SIZE - h), 10, 8);
                                    ctx.fillRect(x * BLOCK_SIZE + 16, y * BLOCK_SIZE + (BLOCK_SIZE - h) - 2, 10, 8);
                                    
                                    ctx.fillStyle = '#388e3c';
                                    ctx.fillRect(x * BLOCK_SIZE + 8, y * BLOCK_SIZE + (BLOCK_SIZE - h) + 2, 4, 4);
                                    ctx.fillRect(x * BLOCK_SIZE + 18, y * BLOCK_SIZE + (BLOCK_SIZE - h), 4, 4);
                                }
                            }
                        }
                    }
                    else if (block === BlockType.BERRY_BUSH) { 
                        ctx.fillStyle = '#1b5e20'; 
                        ctx.beginPath(); ctx.arc(x*BLOCK_SIZE+16, y*BLOCK_SIZE+18, 14, 0, Math.PI*2); ctx.fill();
                        ctx.fillStyle = '#2e7d32'; 
                        ctx.beginPath(); ctx.arc(x*BLOCK_SIZE+10, y*BLOCK_SIZE+12, 10, 0, Math.PI*2); ctx.fill();
                        ctx.beginPath(); ctx.arc(x*BLOCK_SIZE+22, y*BLOCK_SIZE+14, 11, 0, Math.PI*2); ctx.fill();
                        
                        ctx.fillStyle = '#e91e63'; 
                        ctx.beginPath(); ctx.arc(x*BLOCK_SIZE+8, y*BLOCK_SIZE+10, 3, 0, Math.PI*2); ctx.fill(); 
                        ctx.beginPath(); ctx.arc(x*BLOCK_SIZE+12, y*BLOCK_SIZE+12, 3, 0, Math.PI*2); ctx.fill(); 
                        ctx.beginPath(); ctx.arc(x*BLOCK_SIZE+24, y*BLOCK_SIZE+16, 3, 0, Math.PI*2); ctx.fill(); 
                        ctx.beginPath(); ctx.arc(x*BLOCK_SIZE+20, y*BLOCK_SIZE+18, 3, 0, Math.PI*2); ctx.fill(); 
                        ctx.beginPath(); ctx.arc(x*BLOCK_SIZE+16, y*BLOCK_SIZE+24, 3, 0, Math.PI*2); ctx.fill(); 
                    }
                    else if (block === BlockType.SEED_BUSH) { 
                        ctx.fillStyle = '#33691e'; 
                        ctx.beginPath(); ctx.arc(x*BLOCK_SIZE+16, y*BLOCK_SIZE+18, 13, 0, Math.PI*2); ctx.fill();
                        ctx.fillStyle = '#558b2f'; 
                        ctx.beginPath(); ctx.arc(x*BLOCK_SIZE+12, y*BLOCK_SIZE+12, 9, 0, Math.PI*2); ctx.fill();
                        ctx.beginPath(); ctx.arc(x*BLOCK_SIZE+20, y*BLOCK_SIZE+14, 10, 0, Math.PI*2); ctx.fill();
                        
                        ctx.fillStyle = '#cddc39'; // Seeds
                        ctx.fillRect(x*BLOCK_SIZE+10, y*BLOCK_SIZE+10, 2, 2);
                        ctx.fillRect(x*BLOCK_SIZE+14, y*BLOCK_SIZE+14, 2, 2);
                        ctx.fillRect(x*BLOCK_SIZE+22, y*BLOCK_SIZE+16, 2, 2);
                        ctx.fillRect(x*BLOCK_SIZE+18, y*BLOCK_SIZE+20, 2, 2);
                    }
                    else if (block === BlockType.FLOWER_RED || block === BlockType.FLOWER_GREEN || block === BlockType.FLOWER_BLUE) {
                        ctx.fillStyle = '#2e7d32'; // Stem
                        ctx.fillRect(x * BLOCK_SIZE + 14, y * BLOCK_SIZE + 16, 4, 16);
                        ctx.fillRect(x * BLOCK_SIZE + 10, y * BLOCK_SIZE + 22, 4, 4); // Left leaf
                        ctx.fillRect(x * BLOCK_SIZE + 18, y * BLOCK_SIZE + 26, 4, 4); // Right leaf
                        ctx.fillStyle = BLOCK_COLORS[block]; // Petals
                        ctx.beginPath(); ctx.arc(x * BLOCK_SIZE + 16, y * BLOCK_SIZE + 12, 6, 0, Math.PI * 2); ctx.fill();
                        ctx.beginPath(); ctx.arc(x * BLOCK_SIZE + 11, y * BLOCK_SIZE + 8, 5, 0, Math.PI * 2); ctx.fill();
                        ctx.beginPath(); ctx.arc(x * BLOCK_SIZE + 21, y * BLOCK_SIZE + 8, 5, 0, Math.PI * 2); ctx.fill();
                        ctx.beginPath(); ctx.arc(x * BLOCK_SIZE + 16, y * BLOCK_SIZE + 4, 5, 0, Math.PI * 2); ctx.fill();
                        ctx.fillStyle = '#ffeb3b'; // Center
                        ctx.beginPath(); ctx.arc(x * BLOCK_SIZE + 16, y * BLOCK_SIZE + 9, 3, 0, Math.PI * 2); ctx.fill();
                    }
                    else if (options.textureQuality === 'medium' && [
                        BlockType.URANIUM_BLOCK, BlockType.TITANIUM_BLOCK,
                        BlockType.GRASS, BlockType.DARK_GRASS, BlockType.SNOWY_GRASS,
                        BlockType.DIRT, BlockType.FARMLAND,
                        BlockType.WOOD, BlockType.DARK_WOOD,
                        BlockType.LEAVES, BlockType.APPLE_LEAVES, BlockType.DARK_LEAVES, BlockType.SNOWY_LEAVES,
                        BlockType.PLANKS,
                        BlockType.STONE, BlockType.DEEP_STONE,
                        BlockType.SAND,
                        BlockType.COAL_ORE, BlockType.IRON_ORE, BlockType.GOLD_ORE, BlockType.DIAMOND_ORE, BlockType.URANIUM_ORE, BlockType.TITANIUM_ORE
                    ].includes(block)) {
                        ctx.fillStyle = BLOCK_COLORS[block] || '#ff00ff';
                        ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
                    }
                    else if (block === BlockType.URANIUM_BLOCK) { 
                        ctx.fillStyle = BLOCK_COLORS[block]; 
                        ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE); 
                        
                        // Inner glow
                        const gradient = ctx.createRadialGradient(
                            x * BLOCK_SIZE + BLOCK_SIZE / 2, y * BLOCK_SIZE + BLOCK_SIZE / 2, 2,
                            x * BLOCK_SIZE + BLOCK_SIZE / 2, y * BLOCK_SIZE + BLOCK_SIZE / 2, 16
                        );
                        gradient.addColorStop(0, '#b2ff59');
                        gradient.addColorStop(1, 'transparent');
                        ctx.fillStyle = gradient;
                        ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
                        
                        // Core
                        ctx.fillStyle = '#76ff03'; 
                        ctx.fillRect(x * BLOCK_SIZE + 10, y * BLOCK_SIZE + 10, 12, 12); 
                        
                        // Details
                        ctx.fillStyle = '#64dd17';
                        ctx.fillRect(x * BLOCK_SIZE + 4, y * BLOCK_SIZE + 4, 4, 4);
                        ctx.fillRect(x * BLOCK_SIZE + 24, y * BLOCK_SIZE + 24, 4, 4);
                        ctx.fillRect(x * BLOCK_SIZE + 24, y * BLOCK_SIZE + 4, 4, 4);
                        ctx.fillRect(x * BLOCK_SIZE + 4, y * BLOCK_SIZE + 24, 4, 4);
                    }
                    else if (block === BlockType.TITANIUM_BLOCK) { ctx.fillStyle = BLOCK_COLORS[block]; ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE); ctx.strokeStyle = '#fff'; ctx.strokeRect(x * BLOCK_SIZE + 4, y * BLOCK_SIZE + 4, 24, 24); }
                    else if (block === BlockType.GRASS || block === BlockType.DARK_GRASS) {
                        ctx.fillStyle = BLOCK_COLORS[BlockType.DIRT];
                        ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
                        ctx.fillStyle = BLOCK_COLORS[block];
                        ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, 8);
                        ctx.fillRect(x * BLOCK_SIZE + 4, y * BLOCK_SIZE + 8, 4, 4);
                        ctx.fillRect(x * BLOCK_SIZE + 16, y * BLOCK_SIZE + 8, 4, 6);
                        ctx.fillRect(x * BLOCK_SIZE + 24, y * BLOCK_SIZE + 8, 4, 4);
                        ctx.fillStyle = '#4a3018';
                        ctx.fillRect(x * BLOCK_SIZE + 4, y * BLOCK_SIZE + 16, 4, 4);
                        ctx.fillRect(x * BLOCK_SIZE + 20, y * BLOCK_SIZE + 24, 6, 4);
                    }
                    else if (block === BlockType.SNOWY_GRASS) {
                        ctx.fillStyle = BLOCK_COLORS[BlockType.DIRT];
                        ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
                        ctx.fillStyle = '#4a3018';
                        ctx.fillRect(x * BLOCK_SIZE + 4, y * BLOCK_SIZE + 16, 4, 4);
                        ctx.fillRect(x * BLOCK_SIZE + 20, y * BLOCK_SIZE + 24, 6, 4);
                        
                        ctx.fillStyle = '#ffffff';
                        ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, 10);
                        ctx.fillRect(x * BLOCK_SIZE + 2, y * BLOCK_SIZE + 10, 4, 4);
                        ctx.fillRect(x * BLOCK_SIZE + 12, y * BLOCK_SIZE + 10, 6, 6);
                        ctx.fillRect(x * BLOCK_SIZE + 24, y * BLOCK_SIZE + 10, 4, 3);
                        
                        ctx.fillStyle = '#e0f7fa';
                        ctx.fillRect(x * BLOCK_SIZE + 6, y * BLOCK_SIZE + 2, 2, 2);
                        ctx.fillRect(x * BLOCK_SIZE + 22, y * BLOCK_SIZE + 4, 2, 2);
                    }
                    else if (block === BlockType.DIRT || block === BlockType.FARMLAND) {
                        ctx.fillStyle = BLOCK_COLORS[block];
                        ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
                        if (block === BlockType.DIRT) {
                            ctx.fillStyle = '#4a3018';
                            ctx.fillRect(x * BLOCK_SIZE + 4, y * BLOCK_SIZE + 4, 4, 4);
                            ctx.fillRect(x * BLOCK_SIZE + 20, y * BLOCK_SIZE + 16, 6, 4);
                            ctx.fillRect(x * BLOCK_SIZE + 8, y * BLOCK_SIZE + 24, 4, 4);
                            ctx.fillStyle = '#7a5229';
                            ctx.fillRect(x * BLOCK_SIZE + 16, y * BLOCK_SIZE + 6, 4, 4);
                            ctx.fillRect(x * BLOCK_SIZE + 2, y * BLOCK_SIZE + 18, 4, 4);
                        }
                        if (block === BlockType.FARMLAND) {
                            // Draw tilled ridges
                            ctx.fillStyle = '#3e2723'; // Darker furrow
                            ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE + 2, BLOCK_SIZE, 6);
                            ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE + 12, BLOCK_SIZE, 6);
                            ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE + 22, BLOCK_SIZE, 6);
                            
                            ctx.fillStyle = '#5d4037'; // Lighter ridge
                            ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE + 6, BLOCK_SIZE, 4);
                            ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE + 16, BLOCK_SIZE, 4);
                            ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE + 26, BLOCK_SIZE, 4);
                            
                            // Moisture highlight
                            ctx.fillStyle = 'rgba(33, 150, 243, 0.2)';
                            ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE + 2, BLOCK_SIZE, 2);
                            ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE + 12, BLOCK_SIZE, 2);
                            ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE + 22, BLOCK_SIZE, 2);
                        }
                    }
                    else if (block === BlockType.LAMP || block === BlockType.LAMP_ON) {
                        ctx.fillStyle = '#4e342e'; // dark frame
                        ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
                        ctx.fillStyle = block === BlockType.LAMP_ON ? '#fff59d' : '#9e9e9e';
                        ctx.fillRect(x * BLOCK_SIZE + 4, y * BLOCK_SIZE + 4, 24, 24);
                        if (block === BlockType.LAMP_ON) {
                            ctx.fillStyle = '#fff9c4';
                            ctx.fillRect(x * BLOCK_SIZE + 8, y * BLOCK_SIZE + 8, 16, 16);
                            ctx.fillStyle = '#ffffff';
                            ctx.fillRect(x * BLOCK_SIZE + 12, y * BLOCK_SIZE + 12, 8, 8);
                            // cross lines
                            ctx.fillStyle = '#4e342e';
                            ctx.fillRect(x * BLOCK_SIZE + 14, y * BLOCK_SIZE, 4, BLOCK_SIZE);
                            ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE + 14, BLOCK_SIZE, 4);
                        } else {
                            ctx.fillStyle = '#757575';
                            ctx.fillRect(x * BLOCK_SIZE + 8, y * BLOCK_SIZE + 8, 16, 16);
                            // cross lines
                            ctx.fillStyle = '#4e342e';
                            ctx.fillRect(x * BLOCK_SIZE + 14, y * BLOCK_SIZE, 4, BLOCK_SIZE);
                            ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE + 14, BLOCK_SIZE, 4);
                        }
                    }
                    else if (block === BlockType.WOOD || block === BlockType.DARK_WOOD) {
                        ctx.fillStyle = BLOCK_COLORS[block];
                        ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
                        ctx.fillStyle = block === BlockType.WOOD ? '#422e25' : '#241c1c';
                        ctx.fillRect(x * BLOCK_SIZE + 4, y * BLOCK_SIZE, 2, BLOCK_SIZE);
                        ctx.fillRect(x * BLOCK_SIZE + 12, y * BLOCK_SIZE, 4, BLOCK_SIZE);
                        ctx.fillRect(x * BLOCK_SIZE + 22, y * BLOCK_SIZE, 2, BLOCK_SIZE);
                        ctx.fillRect(x * BLOCK_SIZE + 28, y * BLOCK_SIZE, 2, BLOCK_SIZE);
                    }
                    else if (block === BlockType.LEAVES || block === BlockType.APPLE_LEAVES || block === BlockType.DARK_LEAVES || block === BlockType.SNOWY_LEAVES) {
                        ctx.fillStyle = BLOCK_COLORS[block];
                        ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
                        
                        const drawLeafDetails = (dark: string, light: string) => {
                            ctx.fillStyle = dark;
                            ctx.fillRect(x * BLOCK_SIZE + 2, y * BLOCK_SIZE + 2, 8, 8);
                            ctx.fillRect(x * BLOCK_SIZE + 16, y * BLOCK_SIZE + 4, 10, 8);
                            ctx.fillRect(x * BLOCK_SIZE + 8, y * BLOCK_SIZE + 16, 8, 10);
                            ctx.fillRect(x * BLOCK_SIZE + 22, y * BLOCK_SIZE + 20, 8, 8);
                            ctx.fillStyle = light;
                            ctx.fillRect(x * BLOCK_SIZE + 10, y * BLOCK_SIZE + 8, 4, 4);
                            ctx.fillRect(x * BLOCK_SIZE + 24, y * BLOCK_SIZE + 12, 4, 4);
                            ctx.fillRect(x * BLOCK_SIZE + 4, y * BLOCK_SIZE + 22, 4, 4);
                        };

                        if (block === BlockType.LEAVES || block === BlockType.APPLE_LEAVES) {
                            drawLeafDetails('#2a4508', '#4e800f');
                            if (block === BlockType.APPLE_LEAVES) {
                                ctx.fillStyle = '#d32f2f'; // Red apple
                                ctx.fillRect(x * BLOCK_SIZE + 18, y * BLOCK_SIZE + 14, 6, 6);
                                ctx.fillStyle = '#2e7d32'; // Apple stem
                                ctx.fillRect(x * BLOCK_SIZE + 20, y * BLOCK_SIZE + 12, 2, 2);
                            }
                        } else if (block === BlockType.DARK_LEAVES) {
                            drawLeafDetails('#162604', '#2d5209');
                            if (getBiome(x, currentSeed) === 'snow' && snowCoverRef.current > 0) {
                                ctx.globalAlpha = snowCoverRef.current;
                                ctx.fillStyle = '#ffffff';
                                ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
                                drawLeafDetails('#e0e0e0', '#ffffff');
                                ctx.globalAlpha = 1.0;
                            }
                        } else {
                            drawLeafDetails('#e0e0e0', '#ffffff');
                        }
                    }
                    else if (block === BlockType.PLANKS) {
                        ctx.fillStyle = BLOCK_COLORS[block];
                        ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
                        ctx.fillStyle = '#9e7d56';
                        ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE + 7, BLOCK_SIZE, 2);
                        ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE + 15, BLOCK_SIZE, 2);
                        ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE + 23, BLOCK_SIZE, 2);
                        ctx.fillRect(x * BLOCK_SIZE + 10, y * BLOCK_SIZE, 2, 7);
                        ctx.fillRect(x * BLOCK_SIZE + 22, y * BLOCK_SIZE + 8, 2, 7);
                        ctx.fillRect(x * BLOCK_SIZE + 6, y * BLOCK_SIZE + 16, 2, 7);
                        ctx.fillRect(x * BLOCK_SIZE + 18, y * BLOCK_SIZE + 24, 2, 8);
                    }
                    else if (block === BlockType.STONE || block === BlockType.DEEP_STONE) {
                        ctx.fillStyle = BLOCK_COLORS[block];
                        ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
                        ctx.fillStyle = block === BlockType.STONE ? '#707576' : '#2a3036';
                        ctx.fillRect(x * BLOCK_SIZE + 2, y * BLOCK_SIZE + 2, 8, 6);
                        ctx.fillRect(x * BLOCK_SIZE + 18, y * BLOCK_SIZE + 4, 10, 8);
                        ctx.fillRect(x * BLOCK_SIZE + 6, y * BLOCK_SIZE + 16, 12, 10);
                        ctx.fillStyle = block === BlockType.STONE ? '#9aa0a1' : '#4c555c';
                        ctx.fillRect(x * BLOCK_SIZE + 4, y * BLOCK_SIZE + 4, 4, 2);
                        ctx.fillRect(x * BLOCK_SIZE + 20, y * BLOCK_SIZE + 6, 6, 4);
                        ctx.fillRect(x * BLOCK_SIZE + 8, y * BLOCK_SIZE + 18, 8, 6);
                    }
                    else if (block === BlockType.SAND) {
                        ctx.fillStyle = BLOCK_COLORS[block];
                        ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
                        ctx.fillStyle = '#dcb98a';
                        ctx.fillRect(x * BLOCK_SIZE + 4, y * BLOCK_SIZE + 4, 2, 2);
                        ctx.fillRect(x * BLOCK_SIZE + 12, y * BLOCK_SIZE + 10, 2, 2);
                        ctx.fillRect(x * BLOCK_SIZE + 24, y * BLOCK_SIZE + 6, 2, 2);
                        ctx.fillRect(x * BLOCK_SIZE + 8, y * BLOCK_SIZE + 22, 2, 2);
                        ctx.fillRect(x * BLOCK_SIZE + 20, y * BLOCK_SIZE + 18, 2, 2);
                        ctx.fillRect(x * BLOCK_SIZE + 28, y * BLOCK_SIZE + 26, 2, 2);
                        ctx.fillStyle = '#fce5c5';
                        ctx.fillRect(x * BLOCK_SIZE + 6, y * BLOCK_SIZE + 6, 2, 2);
                        ctx.fillRect(x * BLOCK_SIZE + 18, y * BLOCK_SIZE + 12, 2, 2);
                        ctx.fillRect(x * BLOCK_SIZE + 10, y * BLOCK_SIZE + 26, 2, 2);
                    }
                    else if (isOre) {
                        const isDeep = block === BlockType.TITANIUM_ORE || block === BlockType.URANIUM_ORE || y > DEEP_SLATE_LEVEL;
                        const baseColor = isDeep ? BLOCK_COLORS[BlockType.DEEP_STONE] : BLOCK_COLORS[BlockType.STONE];
                        ctx.fillStyle = baseColor;
                        ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
                        ctx.fillStyle = isDeep ? '#2a3036' : '#707576';
                        ctx.fillRect(x * BLOCK_SIZE + 2, y * BLOCK_SIZE + 2, 8, 6);
                        ctx.fillRect(x * BLOCK_SIZE + 18, y * BLOCK_SIZE + 4, 10, 8);
                        ctx.fillRect(x * BLOCK_SIZE + 6, y * BLOCK_SIZE + 16, 12, 10);
                        ctx.fillStyle = BLOCK_COLORS[block];
                        ctx.fillRect(x * BLOCK_SIZE + 6, y * BLOCK_SIZE + 6, 6, 6);
                        ctx.fillRect(x * BLOCK_SIZE + 18, y * BLOCK_SIZE + 12, 8, 6);
                        ctx.fillRect(x * BLOCK_SIZE + 8, y * BLOCK_SIZE + 20, 6, 8);
                        ctx.fillRect(x * BLOCK_SIZE + 22, y * BLOCK_SIZE + 22, 4, 4);
                        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
                        ctx.fillRect(x * BLOCK_SIZE + 6, y * BLOCK_SIZE + 6, 2, 2);
                        ctx.fillRect(x * BLOCK_SIZE + 18, y * BLOCK_SIZE + 12, 2, 2);
                        ctx.fillRect(x * BLOCK_SIZE + 8, y * BLOCK_SIZE + 20, 2, 2);
                    }
                    else if (block === BlockType.BUSH) {
                        ctx.fillStyle = '#2d6a06';
                        ctx.beginPath(); ctx.arc(x*BLOCK_SIZE+16, y*BLOCK_SIZE+18, 12, 0, Math.PI*2); ctx.fill();
                        ctx.beginPath(); ctx.arc(x*BLOCK_SIZE+8, y*BLOCK_SIZE+22, 10, 0, Math.PI*2); ctx.fill();
                        ctx.beginPath(); ctx.arc(x*BLOCK_SIZE+24, y*BLOCK_SIZE+22, 10, 0, Math.PI*2); ctx.fill();
                        ctx.beginPath(); ctx.arc(x*BLOCK_SIZE+12, y*BLOCK_SIZE+12, 8, 0, Math.PI*2); ctx.fill();
                        ctx.beginPath(); ctx.arc(x*BLOCK_SIZE+20, y*BLOCK_SIZE+12, 8, 0, Math.PI*2); ctx.fill();
                        ctx.fillStyle = '#41980a';
                        ctx.beginPath(); ctx.arc(x*BLOCK_SIZE+12, y*BLOCK_SIZE+16, 3, 0, Math.PI*2); ctx.fill();
                        ctx.beginPath(); ctx.arc(x*BLOCK_SIZE+22, y*BLOCK_SIZE+20, 3, 0, Math.PI*2); ctx.fill();
                        ctx.beginPath(); ctx.arc(x*BLOCK_SIZE+16, y*BLOCK_SIZE+24, 3, 0, Math.PI*2); ctx.fill();
                    }
                    else if (block === BlockType.FENCE) {
                        // A more beautiful, detailed fence
                        ctx.fillStyle = '#5d4037'; // shadow outline
                        ctx.fillRect(x * BLOCK_SIZE + 10, y * BLOCK_SIZE + 2, 12, 30);
                        
                        ctx.fillStyle = '#8d6e63'; // main post
                        ctx.fillRect(x * BLOCK_SIZE + 12, y * BLOCK_SIZE + 4, 8, 28); // Post highlight
                        
                        // Wood grain for post
                        ctx.fillStyle = '#795548';
                        ctx.fillRect(x * BLOCK_SIZE + 13, y * BLOCK_SIZE + 6, 2, 10);
                        ctx.fillRect(x * BLOCK_SIZE + 17, y * BLOCK_SIZE + 18, 2, 10);
                        
                        // Main horizontal bars 
                        // Top bar
                        ctx.fillStyle = '#4e342e'; // Drop shadow of top bar
                        ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE + 13, 32, 2);
                        ctx.fillStyle = '#6d4c41'; 
                        ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE + 8, 32, 5);
                        ctx.fillStyle = '#8d6e63';
                        ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE + 8, 32, 2); // highlight
                        // Wood grain bar 1
                        ctx.fillStyle = '#5d4037';
                        ctx.fillRect(x * BLOCK_SIZE + 4, y * BLOCK_SIZE + 10, 4, 1);
                        ctx.fillRect(x * BLOCK_SIZE + 20, y * BLOCK_SIZE + 11, 6, 1);

                        // Bottom bar
                        ctx.fillStyle = '#4e342e'; // Drop shadow of bottom bar
                        ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE + 25, 32, 2);
                        ctx.fillStyle = '#6d4c41';
                        ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE + 20, 32, 5);
                        ctx.fillStyle = '#8d6e63';
                        ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE + 20, 32, 2); // highlight
                        // Wood grain bar 2
                        ctx.fillStyle = '#5d4037';
                        ctx.fillRect(x * BLOCK_SIZE + 2, y * BLOCK_SIZE + 22, 5, 1);
                        ctx.fillRect(x * BLOCK_SIZE + 22, y * BLOCK_SIZE + 23, 7, 1);
                        
                        // Post Top cap
                        ctx.fillStyle = '#4e342e';
                        ctx.fillRect(x * BLOCK_SIZE + 10, y * BLOCK_SIZE + 2, 12, 2);
                    }
                    else if (block === BlockType.COBWEB) {
                        ctx.strokeStyle = 'rgba(238, 238, 238, 0.6)';
                        ctx.lineWidth = 1;
                        ctx.beginPath();
                        ctx.moveTo(x * BLOCK_SIZE, y * BLOCK_SIZE); ctx.lineTo(x * BLOCK_SIZE + 32, y * BLOCK_SIZE + 32);
                        ctx.moveTo(x * BLOCK_SIZE + 32, y * BLOCK_SIZE); ctx.lineTo(x * BLOCK_SIZE, y * BLOCK_SIZE + 32);
                        ctx.moveTo(x * BLOCK_SIZE + 16, y * BLOCK_SIZE); ctx.lineTo(x * BLOCK_SIZE + 16, y * BLOCK_SIZE + 32);
                        ctx.moveTo(x * BLOCK_SIZE, y * BLOCK_SIZE + 16); ctx.lineTo(x * BLOCK_SIZE + 32, y * BLOCK_SIZE + 16);
                        // web rings
                        ctx.strokeRect(x * BLOCK_SIZE + 8, y * BLOCK_SIZE + 8, 16, 16);
                        ctx.stroke();
                    }
                    else if (block === BlockType.BUTTON || block === BlockType.BUTTON_ON) {
                        ctx.fillStyle = block === BlockType.BUTTON_ON ? '#3e2723' : '#5d4037';
                        ctx.fillRect(x * BLOCK_SIZE + 8, y * BLOCK_SIZE + 28, 16, 4); // base
                        if (block === BlockType.BUTTON_ON) {
                            ctx.fillStyle = '#8d6e63';
                            ctx.fillRect(x * BLOCK_SIZE + 12, y * BLOCK_SIZE + 26, 8, 2);
                        } else {
                            ctx.fillStyle = '#8d6e63';
                            ctx.fillRect(x * BLOCK_SIZE + 12, y * BLOCK_SIZE + 24, 8, 4);
                        }
                    }
                    else if (block === BlockType.LEVER || block === BlockType.LEVER_ON) {
                        ctx.fillStyle = '#424242';
                        ctx.fillRect(x * BLOCK_SIZE + 8, y * BLOCK_SIZE + 28, 16, 4); // base
                        ctx.fillStyle = '#8d6e63';
                        if (block === BlockType.LEVER_ON) {
                            ctx.fillRect(x * BLOCK_SIZE + 20, y * BLOCK_SIZE + 20, 4, 8); // handle right
                        } else {
                            ctx.fillRect(x * BLOCK_SIZE + 8, y * BLOCK_SIZE + 20, 4, 8); // handle left
                        }
                    }
                    else if (block >= BlockType.FLOWER_RED && block <= BlockType.FLOWER_BLUE || block === BlockType.FLOWER_YELLOW || block === BlockType.FLOWER_PURPLE) {
                        // Drawing flowers!
                        ctx.fillStyle = '#4caf50'; // stem
                        ctx.fillRect(x*BLOCK_SIZE + 14, y*BLOCK_SIZE + 16, 4, 16);
                        ctx.fillStyle = BLOCK_COLORS[block] || '#ff00ff'; // petals
                        ctx.fillRect(x*BLOCK_SIZE + 8, y*BLOCK_SIZE + 4, 16, 16);
                        ctx.fillStyle = '#fff9c4'; // center
                        ctx.fillRect(x*BLOCK_SIZE + 12, y*BLOCK_SIZE + 8, 8, 8);
                    }
                    else {
                        ctx.fillStyle = BLOCK_COLORS[block] || '#f0f';
                        if (block === BlockType.BED || block === BlockType.BED_MEDIUM || block === BlockType.BED_ADVANCED) { ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE + 16, BLOCK_SIZE, 16); ctx.fillStyle = '#fff'; ctx.fillRect(x * BLOCK_SIZE + 2, y * BLOCK_SIZE + 18, 8, 6); }
                        else if (block === BlockType.CHEST || block === BlockType.CHEST_MEDIUM || block === BlockType.CHEST_LARGE || block === BlockType.STONE_CHEST) { ctx.fillRect(x * BLOCK_SIZE + 2, y * BLOCK_SIZE + 10, 28, 22); ctx.fillStyle = block === BlockType.STONE_CHEST ? '#bdbdbd' : '#ffecb3'; ctx.fillRect(x * BLOCK_SIZE + 14, y * BLOCK_SIZE + 18, 4, 6); }
                        else if (block === BlockType.BEDROCK) {
                            ctx.fillStyle = '#111'; ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
                            ctx.fillStyle = '#222'; ctx.fillRect(x * BLOCK_SIZE + 2, y * BLOCK_SIZE + 2, 8, 8); ctx.fillRect(x * BLOCK_SIZE + 18, y * BLOCK_SIZE + 16, 10, 10); ctx.fillRect(x * BLOCK_SIZE + 8, y * BLOCK_SIZE + 22, 6, 6);
                            ctx.fillStyle = '#000'; ctx.fillRect(x * BLOCK_SIZE + 12, y * BLOCK_SIZE + 8, 6, 6); ctx.fillRect(x * BLOCK_SIZE + 4, y * BLOCK_SIZE + 18, 4, 4); ctx.fillRect(x * BLOCK_SIZE + 24, y * BLOCK_SIZE + 4, 4, 4);
                        }
                        else if (block === BlockType.CRAFTING_TABLE) {
                            ctx.fillStyle = '#5d4037'; ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
                            ctx.fillStyle = '#8d6e63'; ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, 8);
                            ctx.fillStyle = '#3e2723'; ctx.fillRect(x * BLOCK_SIZE + 2, y * BLOCK_SIZE + 10, 4, 22); ctx.fillRect(x * BLOCK_SIZE + 26, y * BLOCK_SIZE + 10, 4, 22);
                            ctx.fillStyle = '#795548'; ctx.fillRect(x * BLOCK_SIZE + 8, y * BLOCK_SIZE + 12, 16, 12);
                            ctx.fillStyle = '#000'; ctx.fillRect(x * BLOCK_SIZE + 14, y * BLOCK_SIZE + 14, 4, 2);
                            ctx.fillStyle = '#9e9e9e'; ctx.fillRect(x * BLOCK_SIZE + 4, y * BLOCK_SIZE + 2, 6, 4);
                            ctx.fillStyle = '#ff9800'; ctx.fillRect(x * BLOCK_SIZE + 20, y * BLOCK_SIZE + 2, 8, 2);
                            ctx.fillStyle = '#757575'; ctx.fillRect(x * BLOCK_SIZE + 20, y * BLOCK_SIZE + 1, 4, 4);
                        }
                        else if (block === BlockType.SCIENCE_BENCH) {
                            ctx.fillStyle = '#b2dfdb'; ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
                            ctx.fillStyle = '#80cbc4'; ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, 8);
                            ctx.fillStyle = '#004d40'; ctx.fillRect(x * BLOCK_SIZE + 2, y * BLOCK_SIZE + 10, 4, 22); ctx.fillRect(x * BLOCK_SIZE + 26, y * BLOCK_SIZE + 10, 4, 22);
                            ctx.fillStyle = '#00695c'; ctx.fillRect(x * BLOCK_SIZE + 10, y * BLOCK_SIZE + 12, 12, 16);
                            ctx.fillStyle = '#64ffda'; ctx.fillRect(x * BLOCK_SIZE + 12, y * BLOCK_SIZE + 16, 8, 4); 
                        }
                        else if (block === BlockType.MEDICAL_BENCH) {
                            ctx.fillStyle = '#e0f7fa'; ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
                            ctx.fillStyle = '#b2ebf2'; ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, 8);
                            ctx.fillStyle = '#006064'; ctx.fillRect(x * BLOCK_SIZE + 2, y * BLOCK_SIZE + 10, 4, 22); ctx.fillRect(x * BLOCK_SIZE + 26, y * BLOCK_SIZE + 10, 4, 22);
                            ctx.fillStyle = '#ef5350'; ctx.fillRect(x * BLOCK_SIZE + 14, y * BLOCK_SIZE + 12, 4, 12); 
                            ctx.fillRect(x * BLOCK_SIZE + 10, y * BLOCK_SIZE + 16, 12, 4); 
                        }
                        else if (block === BlockType.FURNACE) {
                            ctx.fillStyle = '#424242'; ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
                            ctx.fillStyle = '#616161'; ctx.fillRect(x * BLOCK_SIZE + 2, y * BLOCK_SIZE + 2, 28, 28);
                            ctx.fillStyle = '#212121'; ctx.fillRect(x * BLOCK_SIZE + 6, y * BLOCK_SIZE + 16, 20, 10);
                            ctx.fillStyle = '#000'; ctx.fillRect(x * BLOCK_SIZE + 8, y * BLOCK_SIZE + 6, 16, 6);
                            const furnace = furnacesRef.current.get(`${x},${y}`);
                            if (furnace && furnace.burnTime > 0) {
                                ctx.fillStyle = '#ff9800'; ctx.fillRect(x * BLOCK_SIZE + 8, y * BLOCK_SIZE + 20, 16, 4);
                                ctx.fillStyle = '#ffeb3b'; ctx.fillRect(x * BLOCK_SIZE + 12, y * BLOCK_SIZE + 18, 8, 4);
                            }
                        }
                        else if (block === BlockType.ARMOR_BENCH) {
                            ctx.fillStyle = '#37474f'; ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
                            ctx.fillStyle = '#546e7a'; ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, 10);
                            ctx.fillStyle = '#263238'; ctx.fillRect(x * BLOCK_SIZE + 4, y * BLOCK_SIZE + 12, 6, 20); ctx.fillRect(x * BLOCK_SIZE + 22, y * BLOCK_SIZE + 12, 6, 20);
                            ctx.fillStyle = '#90a4ae'; ctx.fillRect(x * BLOCK_SIZE + 10, y * BLOCK_SIZE + 2, 12, 6);
                            ctx.fillStyle = '#cfd8dc'; ctx.fillRect(x * BLOCK_SIZE + 12, y * BLOCK_SIZE + 4, 8, 4);
                            ctx.fillStyle = '#ffb74d'; ctx.fillRect(x * BLOCK_SIZE + 2, y * BLOCK_SIZE + 4, 6, 2);
                        }
                        else if (block === BlockType.CABINET) {
                            const tx = x * BLOCK_SIZE; const ty = y * BLOCK_SIZE;
                            ctx.fillStyle = '#4e342e'; ctx.fillRect(tx, ty, 32, 32);
                            ctx.fillStyle = '#5d4037'; ctx.fillRect(tx+2, ty+2, 28, 28);
                            ctx.fillStyle = '#3e2723'; ctx.fillRect(tx+14, ty+2, 4, 28);
                            ctx.fillStyle = '#ffcc80'; ctx.fillRect(tx+10, ty+14, 2, 4); ctx.fillRect(tx+20, ty+14, 2, 4);
                        }
                        else if (block === BlockType.TABLE) {
                            const tx = x * BLOCK_SIZE; const ty = y * BLOCK_SIZE;
                            ctx.fillStyle = '#6d4c41'; ctx.fillRect(tx, ty + 8, 32, 6);
                            ctx.fillStyle = '#3e2723'; ctx.fillRect(tx+4, ty+14, 4, 18); ctx.fillRect(tx+24, ty+14, 4, 18);
                        }
                        else if (block === BlockType.CAMPFIRE) {
                            const tx = x * BLOCK_SIZE; const ty = y * BLOCK_SIZE;
                            ctx.fillStyle = '#3e2723'; ctx.fillRect(tx+4, ty+26, 24, 6); ctx.fillRect(tx+8, ty+24, 16, 4);
                            ctx.fillStyle = '#f44336'; ctx.fillRect(tx+14, ty+16, 4, 8);
                            ctx.fillStyle = '#ff9800'; ctx.fillRect(tx+10, ty+20, 12, 4);
                            ctx.fillStyle = '#ffeb3b'; ctx.fillRect(tx+14, ty+22, 4, 2);
                            // Bloom
                            ctx.globalCompositeOperation = 'screen';
                            const grad = ctx.createRadialGradient(tx+16, ty+20, 2, tx+16, ty+20, 20);
                            grad.addColorStop(0, 'rgba(255, 152, 0, 0.5)');
                            grad.addColorStop(1, 'rgba(0,0,0,0)');
                            ctx.fillStyle = grad;
                            ctx.fillRect(tx - 16, ty - 16, 64, 64);
                            ctx.globalCompositeOperation = 'source-over';
                        }
                        else if (block === BlockType.ROOF_STONE || block === BlockType.ROOF_STONE_LEFT) {
                            const isLeft = block === BlockType.ROOF_STONE_LEFT;
                            const tx = x * BLOCK_SIZE; const ty = y * BLOCK_SIZE;
                            ctx.fillStyle = '#616161';
                            ctx.beginPath();
                            if (isLeft) { ctx.moveTo(tx+32, ty); ctx.lineTo(tx+32, ty+32); ctx.lineTo(tx, ty+32); }
                            else { ctx.moveTo(tx, ty); ctx.lineTo(tx+32, ty+32); ctx.lineTo(tx, ty+32); }
                            ctx.fill();
                            ctx.strokeStyle = '#424242'; ctx.lineWidth = 2; ctx.stroke();
                        }
                        else if (block === BlockType.ROOF_WOOD || block === BlockType.ROOF_WOOD_LEFT) {
                            const isLeft = block === BlockType.ROOF_WOOD_LEFT;
                            const tx = x * BLOCK_SIZE; const ty = y * BLOCK_SIZE;
                            ctx.fillStyle = '#8d6e63';
                            ctx.beginPath();
                            if (isLeft) { ctx.moveTo(tx+32, ty); ctx.lineTo(tx+32, ty+32); ctx.lineTo(tx, ty+32); }
                            else { ctx.moveTo(tx, ty); ctx.lineTo(tx+32, ty+32); ctx.lineTo(tx, ty+32); }
                            ctx.fill();
                            ctx.strokeStyle = '#5d4037'; ctx.lineWidth = 2; ctx.stroke();
                        }
                        else if (block === BlockType.COPPER_BLOCK) {
                            ctx.fillStyle = '#b87333'; ctx.fillRect(x*BLOCK_SIZE, y*BLOCK_SIZE, 32, 32);
                            ctx.fillStyle = '#cd7f32'; ctx.fillRect(x*BLOCK_SIZE+2, y*BLOCK_SIZE+2, 28, 28);
                        }
                        else if (block === BlockType.IRON_BLOCK) {
                            ctx.fillStyle = '#b0bec5'; ctx.fillRect(x*BLOCK_SIZE, y*BLOCK_SIZE, 32, 32);
                            ctx.fillStyle = '#cfd8dc'; ctx.fillRect(x*BLOCK_SIZE+2, y*BLOCK_SIZE+2, 28, 28);
                        }
                        else if (block === BlockType.GOLD_BLOCK) {
                            ctx.fillStyle = '#ffd700'; ctx.fillRect(x*BLOCK_SIZE, y*BLOCK_SIZE, 32, 32);
                            ctx.fillStyle = '#ffecb3'; ctx.fillRect(x*BLOCK_SIZE+2, y*BLOCK_SIZE+2, 28, 28);
                        }
                        else if (block === BlockType.DIAMOND_BLOCK) {
                            ctx.fillStyle = '#00bcd4'; ctx.fillRect(x*BLOCK_SIZE, y*BLOCK_SIZE, 32, 32);
                            ctx.fillStyle = '#84ffff'; ctx.fillRect(x*BLOCK_SIZE+2, y*BLOCK_SIZE+2, 28, 28);
                            ctx.fillStyle = '#e0f7fa'; ctx.fillRect(x*BLOCK_SIZE+4, y*BLOCK_SIZE+4, 4, 4);
                        }
                        else if (block === BlockType.TORCH) {
                            // Draw an actual torch instead of a solid colored block
                            const tx = x * BLOCK_SIZE;
                            const ty = y * BLOCK_SIZE;
                            
                            // Detect neighbors to attach to
                            const blockLeft = x > 0 ? world.blocks[idx - 1] : BlockType.AIR;
                            const blockRight = x < WORLD_WIDTH - 1 ? world.blocks[idx + 1] : BlockType.AIR;
                            
                            const attachedLeft = !NON_COLLIDABLE_BLOCKS.has(blockLeft);
                            const attachedRight = !NON_COLLIDABLE_BLOCKS.has(blockRight);
                            
                            ctx.save();
                            ctx.translate(tx + 16, ty + 24); // Bottom center of torch space
                            if (attachedLeft && !attachedRight) {
                                ctx.translate(-14, -8);
                                ctx.rotate(45 * Math.PI / 180);
                            } else if (attachedRight && !attachedLeft) {
                                ctx.translate(14, -8);
                                ctx.rotate(-45 * Math.PI / 180);
                            }

                            // Stick
                            ctx.fillStyle = '#5d4037';
                            ctx.fillRect(-2, -14, 4, 14);
                            // Coal tip
                            ctx.fillStyle = '#212121';
                            ctx.fillRect(-2, -18, 4, 4);
                            // Flame
                            ctx.fillStyle = '#ffeb3b';
                            ctx.fillRect(-2, -22, 4, 4);
                            ctx.fillStyle = '#ff9800';
                            ctx.fillRect(0, -20, 2, 2);
                            
                            // Small local bloom
                            ctx.globalCompositeOperation = 'screen';
                            const grad = ctx.createRadialGradient(0, -20, 2, 0, -20, 10);
                            grad.addColorStop(0, 'rgba(255, 152, 0, 0.8)');
                            grad.addColorStop(1, 'rgba(0,0,0,0)');
                            ctx.fillStyle = grad;
                            ctx.fillRect(-16, -32, 32, 32);
                            
                            ctx.restore();
                        }
                        else if (block === BlockType.SLAB_WOOD || block === BlockType.SLAB_STONE) {
                            if (block === BlockType.SLAB_WOOD) {
                                ctx.fillStyle = '#8d6e63';
                                ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE + 16, BLOCK_SIZE, 16);
                                ctx.strokeStyle = '#5d4037';
                                ctx.lineWidth = 2;
                                ctx.strokeRect(x * BLOCK_SIZE, y * BLOCK_SIZE + 16, BLOCK_SIZE, 16);
                                ctx.fillStyle = '#a1887f'; ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE + 16, BLOCK_SIZE, 2);
                            } else if (block === BlockType.SLAB_STONE) {
                                ctx.fillStyle = '#9e9e9e';
                                ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE + 16, BLOCK_SIZE, 16);
                                ctx.strokeStyle = '#616161';
                                ctx.lineWidth = 1.5;
                                ctx.strokeRect(x * BLOCK_SIZE, y * BLOCK_SIZE + 16, BLOCK_SIZE, 16);
                            } else {
                                ctx.fillStyle = '#bdc3c7'; // Concrete default
                                ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE + 16, BLOCK_SIZE, 16);
                            }
                        }
                        else {
                            ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
                        }
                    }
                }
                
                if (breakingRef.current.x === x && breakingRef.current.y === y && breakingRef.current.progress > 0) { const bType = world.blocks[y*WORLD_WIDTH+x]; const hardness = BLOCK_HARDNESS[bType] || 100; const pct = Math.min(1, breakingRef.current.progress / hardness); ctx.fillStyle = '#000'; ctx.fillRect(x*BLOCK_SIZE + 2, y*BLOCK_SIZE + 2, 28, 4); ctx.fillStyle = '#0f0'; ctx.fillRect(x*BLOCK_SIZE + 2, y*BLOCK_SIZE + 2, 28 * pct, 4); }
                if (options.graphicsQuality !== 'UGLY' && light < 15) { const darkness = 1 - (light / 15); ctx.fillStyle = `rgba(5, 10, 25, ${Math.min(0.92, darkness)})`; ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE); }
            }
        }

        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;

        // --- REALISTIC SHADOWS FOR ENTITIES ---
        if (options.shaderLevel === 2) {
            ctx.shadowColor = 'rgba(0,0,0,0.4)';
            ctx.shadowBlur = 8;
            ctx.shadowOffsetX = 8; // Generic offset
            ctx.shadowOffsetY = 8;
            
            [player, ...otherPlayersRef.current, ...entitiesRef.current].forEach(ent => {
                if (ent.type !== 'PROJECTILE' && ent.type !== 'DROP' && !ent.isParticle) {
                    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
                    ctx.beginPath();
                    ctx.ellipse(ent.x - cameraRef.current.x + ent.width / 2 + 6, ent.y - cameraRef.current.y + ent.height, ent.width / 1.5, ent.width / 4, 0, 0, Math.PI * 2);
                    ctx.fill();
                }
            });
        }

        // --- NEW PLAYER RENDERING ---
        if (options.gameMode !== 'SPECTATOR') {
        ctx.save();
        ctx.translate(player.x + player.width/2, player.y + player.height/2);
        if (!player.facingRight) ctx.scale(-1, 1);
        
        // Scale visually based on posture
        if (player.posture === 'CROUCH') {
            ctx.scale(1, 40/56);
        } else if (player.posture === 'PRONE') {
            if (!player.facingRight) {
                ctx.rotate(-Math.PI / 2);
            } else {
                ctx.rotate(Math.PI / 2);
            }
            ctx.translate(10, 0); // shift drawing so it aligns better inside the 1 block
        }

        const isMoving = Math.abs(player.vx) > 0.1;
        const walkCycle = isMoving ? Math.sin(Date.now() / 100) * 5 : 0;

        // Custom Skin Data (Fallback to default)
        const accsStr = localStorage.getItem('zombiecraft_accounts');
        const usrName = localStorage.getItem('zombiecraft_current_user');
        let cSkin = null;
        if (accsStr && usrName) {
            const accs = JSON.parse(accsStr);
            const usr = accs.find((a: any) => a.name === usrName);
            if (usr && usr.skin) cSkin = usr.skin;
        }

        const skinColor = cSkin?.skinColor || '#ffcc80';
        
        // Clothes (1-10)
        let shirtColor = skinColor;
        switch(cSkin?.clothes) {
            case '2': shirtColor = '#222'; break; // terno
            case '3': shirtColor = '#1e3a8a'; break; // azul
            case '4': shirtColor = '#b91c1c'; break; // vermelho
            case '5': shirtColor = '#9ca3af'; break; // cinza
            case '6': shirtColor = '#15803d'; break; // verde
            case '7': shirtColor = '#ffffff'; break; // regata branca
            case '8': shirtColor = '#451a03'; break; // jaqueta 
            case '9': shirtColor = '#f59e0b'; break; // amarela/xadrez
            case '10': shirtColor = '#facc15'; break; // amarela
        }
        
        // Pants (1-10)
        let pantsColor = skinColor;
        switch(cSkin?.pants) {
            case '2': pantsColor = '#222'; break; // terno
            case '3': pantsColor = '#1d4ed8'; break; // jeans azul
            case '4': pantsColor = '#1f2937'; break; // jeans preto
            case '5': pantsColor = '#ffed4a'; break; // shorts
            case '6': pantsColor = '#6b7280'; break; // moletom
            case '7': pantsColor = '#a16207'; break; // cargo
            case '8': pantsColor = '#78350f'; break; // couro
            case '9': pantsColor = '#4d7c0f'; break; // camuflado
            case '10': pantsColor = '#ef4444'; break; // shorts vermelho
        }

        const isBareChest = !cSkin?.clothes || cSkin?.clothes === '1';
        const isBarePants = !cSkin?.pants || cSkin?.pants === '1';

        // Legs
        ctx.fillStyle = isBarePants ? skinColor : pantsColor;
        ctx.fillRect(-6 + walkCycle, 12, 6, 16); // Back Leg
        ctx.fillRect(-6 - walkCycle, 12, 6, 16); // Front Leg
        
        // Shoes (1-10)
        if (cSkin?.shoes && cSkin?.shoes !== '1') {
            let shoeCol = '#111';
            switch(cSkin.shoes) {
                case '2': shoeCol = '#000'; break;
                case '3': shoeCol = '#fff'; break;
                case '4': shoeCol = '#3f3f46'; break;
                case '5': shoeCol = '#dc2626'; break;
                case '6': shoeCol = '#78350f'; break; // sandálias/sapatilha
                case '7': shoeCol = '#8b5cf6'; break;
                case '8': shoeCol = '#92400e'; break;
                case '9': shoeCol = '#fcd34d'; break;
                case '10': shoeCol = '#c2410c'; break;
            }
            ctx.fillStyle = shoeCol;
            ctx.fillRect(-8 + walkCycle, 24, 10, 4);
            ctx.fillRect(-8 - walkCycle, 24, 10, 4);
        }

        // Body
        ctx.fillStyle = shirtColor; 
        ctx.fillRect(-10, -16, 20, 28);
        if (isBareChest) {
            ctx.fillStyle = '#ccc';
            ctx.fillRect(-10, 8, 20, 4); // Underwear band
        } else if (cSkin?.clothes === '2') { // terno
            ctx.fillStyle = '#fff';
            ctx.fillRect(-2, -16, 4, 28); // white shirt middle
        }


        // Armor: Leggings
        if (equipment.leggings) {
            let col = '#cfd8dc'; const id = (equipment.leggings?.id?.toString() || ''); 
            if(id.includes('copper')) col='#e65100'; else if(id.includes('gold')) col='#fbc02d'; else if(id.includes('diamond')) col='#00bcd4'; else if(id.includes('titanium')) col='#0d47a1'; else if(id.includes('uranium')) col='#76ff03'; else if(id.includes('reinforced')) col='#9e9e9e'; else if(id.includes('hazmat')) col='#ffeb3b'; else if(id.includes('leather')) col='#3e2723';
            ctx.fillStyle = col;
            ctx.fillRect(-7 + walkCycle, 12, 8, 12); // Back Leg
            ctx.fillRect(-7 - walkCycle, 12, 8, 12); // Front Leg
            ctx.fillRect(-11, 6, 22, 8); // Pelvis
            if (id.includes('reinforced')) {
                ctx.fillStyle = '#00bcd4';
                ctx.fillRect(-7 + walkCycle, 20, 8, 2);
                ctx.fillRect(-7 - walkCycle, 20, 8, 2);
                ctx.fillRect(-11, 10, 22, 2);
            }
            ctx.fillStyle = 'rgba(0,0,0,0.2)';
            ctx.fillRect(-11, 12, 22, 2); // Belt shadow
        }

        // Armor: Boots
        if (equipment.boots) {
            let col = '#cfd8dc'; const id = (equipment.boots?.id?.toString() || ''); 
            if(id.includes('copper')) col='#e65100'; else if(id.includes('gold')) col='#fbc02d'; else if(id.includes('diamond')) col='#00bcd4'; else if(id.includes('titanium')) col='#0d47a1'; else if(id.includes('uranium')) col='#76ff03'; else if(id.includes('reinforced')) col='#9e9e9e'; else if(id.includes('hazmat')) col='#ffeb3b'; else if(id.includes('leather')) col='#3e2723';
            ctx.fillStyle = col;
            ctx.fillRect(-8 + walkCycle, 20, 10, 8); // Back Leg Boot
            ctx.fillRect(-8 - walkCycle, 20, 10, 8); // Front Leg Boot
            if (id.includes('reinforced')) {
                ctx.fillStyle = '#00bcd4';
                ctx.fillRect(-8 + walkCycle, 22, 10, 2);
                ctx.fillRect(-8 - walkCycle, 22, 10, 2);
            }
            ctx.fillStyle = 'rgba(255,255,255,0.2)';
            ctx.fillRect(-8 + walkCycle, 20, 4, 8);
            ctx.fillRect(-8 - walkCycle, 20, 4, 8);
        }

        // Head
        ctx.fillStyle = '#ffcc80'; // Skin
        ctx.fillRect(-8, -28, 16, 16);
        
        // Hair
        if (cSkin?.hairVariant === 'normal' || !cSkin?.hairVariant) {
             ctx.fillStyle = cSkin?.hairColor || '#ff9800';
             ctx.fillRect(-8, -30, 16, 4); // Hair top
             ctx.fillRect(-8, -26, 4, 4); // Hair side
        } else if (cSkin?.hairVariant === 'calvo') {
             // Bald is no hair
        }

        // Mustache
        if (cSkin?.hasMustache) {
             ctx.fillStyle = cSkin?.mustacheColor || '#111';
             ctx.fillRect(-5, -16, 10, 2);
        }

        // Mouth (none, neutral, happy, sad, surprised)
        const mouthType = cSkin?.mouthType || 'neutral';
        if (mouthType !== 'none') {
            ctx.fillStyle = '#6a1b9a'; // Inside mouth color
            if (mouthType === 'neutral') ctx.fillRect(-3, -13, 6, 1);
            else if (mouthType === 'happy') {
                ctx.fillRect(-3, -13, 6, 1);
                ctx.fillRect(-4, -14, 1, 2);
                ctx.fillRect(3, -14, 1, 2);
            }
            else if (mouthType === 'sad') {
                ctx.fillRect(-3, -14, 6, 1);
                ctx.fillRect(-4, -13, 1, 2);
                ctx.fillRect(3, -13, 1, 2);
            }
            else if (mouthType === 'surprised') {
                ctx.fillRect(-2, -14, 4, 3);
            }
        }

        // Eyes (Look at mouse/cursor)
        // Ensure eyes correctly track direction relative to facingRight
        const eyeXOffset = player.facingRight ? 4 : -4;
        
        // Calculate vertical and horizontal eye track direction based on mouse
        const lookUp = worldMouseY < player.y - 16;
        const lookDown = worldMouseY > player.y + 16;
        const eyeY = -24 + (lookDown ? 2 : lookUp ? -2 : 0);
        
        ctx.fillStyle = 'white';
        ctx.fillRect(-2 + eyeXOffset, eyeY, 4, 4);
        
        // Pupil
        ctx.fillStyle = cSkin?.eyeColor || 'black';
        
        let pupilXDiff = 0;
        if (player.facingRight) {
             pupilXDiff = worldMouseX > player.x + 16 ? 1 : (worldMouseX < player.x - 16 ? -1 : 0);
        } else {
             pupilXDiff = worldMouseX < player.x - 16 ? -1 : (worldMouseX > player.x + 16 ? 1 : 0);
        }

        ctx.fillRect(-1 + eyeXOffset + pupilXDiff, eyeY + 1, 2, 2);

        // Armor: Chestplate
        if (equipment.chestplate) { 
            let col = '#cfd8dc'; const id = (equipment.chestplate?.id?.toString() || ''); 
            if(id.includes('copper')) col='#e65100'; else if(id.includes('gold')) col='#fbc02d'; else if(id.includes('diamond')) col='#00bcd4'; else if(id.includes('titanium')) col='#0d47a1'; else if(id.includes('uranium')) col='#76ff03'; else if(id.includes('reinforced')) col='#9e9e9e'; else if(id.includes('hazmat')) col='#ffeb3b'; else if(id.includes('leather')) col='#3e2723';
            ctx.fillStyle = col; 
            ctx.fillRect(-12, -18, 24, 26); // Main body
            if (id.includes('reinforced')) {
                ctx.fillStyle = '#00bcd4';
                ctx.fillRect(-6, -12, 12, 12); // Blue core
                ctx.fillRect(-12, 4, 24, 2); // Blue belt line
            }
            ctx.fillStyle = 'rgba(255,255,255,0.2)'; // Highlight
            ctx.fillRect(-10, -16, 6, 22);
            ctx.fillStyle = 'rgba(0,0,0,0.2)'; // Shadow
            ctx.fillRect(4, -16, 6, 22);
            ctx.fillRect(-12, 4, 24, 4); // Belt area
        }

        // Armor: Helmet
        if (equipment.helmet) { 
            let col = '#cfd8dc'; const id = (equipment.helmet?.id?.toString() || ''); 
            if(id.includes('copper')) col='#e65100'; else if(id.includes('gold')) col='#fbc02d'; else if(id.includes('diamond')) col='#00bcd4'; else if(id.includes('titanium')) col='#0d47a1'; else if(id.includes('uranium')) col='#76ff03'; else if(id.includes('reinforced')) col='#9e9e9e'; else if(id.includes('hazmat')) col='#ffeb3b'; else if(id.includes('leather')) col='#3e2723';
            ctx.fillStyle = col; 
            ctx.fillRect(-10, -32, 20, 14); // Hat top
            ctx.fillRect(-10, -32, 6, 20); // Side back
            ctx.fillRect(6, -32, 4, 20); // Side front
            ctx.fillRect(-12, -22, 24, 4); // Brim/visor
            if (id.includes('reinforced')) {
                ctx.fillStyle = '#00bcd4';
                ctx.fillRect(-12, -22, 24, 2); // Blue visor line
                ctx.fillRect(-4, -30, 8, 4); // Blue crest
            }
            ctx.fillStyle = 'rgba(255,255,255,0.3)'; // Highlight
            ctx.fillRect(-6, -30, 8, 4);
            ctx.fillStyle = 'rgba(0,0,0,0.2)'; // Shadow
            ctx.fillRect(-10, -20, 20, 2);
        }

        // Held Item (Main Hand)
        const heldItem = inventory[selectedSlot];
        const heldItemId = heldItem ? (heldItem.id?.toString() || '') : '';
        
        ctx.save();
        ctx.translate(6, 0); // Shoulder/Hand pivot
        
        let angle = 0;
        let stabOffset = 0;
        let swingProgress = 0;
        
        const dx = worldMouseX - (player.x + player.width/2);
        const dy = worldMouseY - (player.y + player.height/2);
        let rawAngle = Math.atan2(dy, dx);
        if (!player.facingRight) rawAngle = Math.atan2(dy, -dx); 
        
        if ((player.attackCooldown || 0) > 0) {
             let cooldownMax = 20;
             if (heldItemId.includes('war_hammer')) cooldownMax = 300;
             else if (heldItemId.includes('scythe')) cooldownMax = 240;
             else if (heldItemId.includes('battle_axe')) cooldownMax = 100;
             else if (heldItemId.includes('katana')) cooldownMax = 120;
             else if (heldItemId.includes('knife')) cooldownMax = 10;
             else if (heldItemId.includes('short_sword')) cooldownMax = 15;
             else if (heldItemId.includes('crossbow')) cooldownMax = 187.5;
             else if (heldItemId.includes('bow')) cooldownMax = 62.5;
             
             swingProgress = Math.min(1, (player.attackCooldown || 0) / cooldownMax); 
             
             if (heldItemId.includes('spear')) {
                 stabOffset = Math.sin(swingProgress * Math.PI) * 15;
                 angle = rawAngle;
             } else if (heldItemId.includes('sword') || heldItemId.includes('katana') || heldItemId.includes('knife') || heldItemId.includes('scythe')) {
                 angle = rawAngle - (Math.PI/2 * swingProgress) + (Math.sin(swingProgress * Math.PI) * Math.PI/1.5);
             } else if (heldItemId.includes('pickaxe') || heldItemId.includes('axe') || heldItemId.includes('hammer') || heldItemId.includes('shovel') || heldItemId.includes('hoe')) {
                 angle = rawAngle - (Math.PI/1.5 * swingProgress) + (Math.sin(swingProgress * Math.PI) * Math.PI);
             } else if (heldItemId.includes('bow') || heldItemId.includes('crossbow')) {
                 angle = rawAngle;
             } else {
                 angle = rawAngle - (Math.PI/2 * swingProgress) + (Math.sin(swingProgress * Math.PI) * Math.PI/2);
             }
        } else {
             angle = rawAngle;
        }
        ctx.rotate(angle);
        
        // Arm
        // Draw sleeve color
        if (isBareChest) {
            ctx.fillStyle = skinColor;
            ctx.fillRect(0 + stabOffset, -2, 12, 4);
        } else {
            ctx.fillStyle = shirtColor; 
            ctx.fillRect(0 + stabOffset, -2, 8, 4); // Sleeve
            ctx.fillStyle = skinColor; 
            ctx.fillRect(8 + stabOffset, -2, 4, 4); // Hand
            if (cSkin?.clothes === '2') {
                // Terno detail
                ctx.fillStyle = '#fff';
                ctx.fillRect(7 + stabOffset, -2, 1, 4); 
            }
        }
        
        if (equipment.chestplate) {
            let col = '#cfd8dc'; const id = (equipment.chestplate?.id?.toString() || ''); 
            if(id.includes('copper')) col='#e65100'; else if(id.includes('gold')) col='#fbc02d'; else if(id.includes('diamond')) col='#00bcd4'; else if(id.includes('titanium')) col='#0d47a1'; else if(id.includes('uranium')) col='#76ff03'; else if(id.includes('reinforced')) col='#9e9e9e'; else if(id.includes('hazmat')) col='#ffeb3b'; else if(id.includes('leather')) col='#3e2723';
            ctx.fillStyle = col; 
            ctx.fillRect(-2 + stabOffset, -3, 10, 6); // Shoulder pad / sleeve
            if (id.includes('reinforced')) {
                ctx.fillStyle = '#00bcd4';
                ctx.fillRect(4 + stabOffset, -3, 2, 6); // Blue arm band
            }
        }
        ctx.fillStyle = '#ffcc80'; 
        ctx.fillRect(12 + stabOffset, -2, 4, 4);
        
        if (heldItem) {
            ctx.translate(14 + stabOffset, 0);
            
            if (heldItemId.includes('spear')) {
                ctx.rotate(Math.PI/2); // Point forward (negative y points right)
            } else if (heldItemId.includes('bow') || heldItemId.includes('crossbow')) {
                ctx.rotate(0); // Point forward (positive x points right)
            } else {
                ctx.rotate(Math.PI/4); 
            }
            
            if (heldItem.type === ItemType.BLOCK || heldItem.id === BlockType.GLASS) {
                 const col = BLOCK_COLORS[heldItem.id] || '#fff';
                 ctx.fillStyle = col;
                 ctx.fillRect(-6, -6, 12, 12);
                 ctx.fillStyle = 'rgba(0,0,0,0.2)';
                 ctx.fillRect(-6, 4, 12, 2);
                 ctx.fillRect(4, -6, 2, 12);
            } else {
                 const col = ITEM_COLORS[heldItemId] || '#888';
                 
                 if (heldItemId.includes('sword') || heldItemId.includes('katana') || heldItemId.includes('knife')) {
                     const isKnife = heldItemId.includes('knife');
                     const bladeLen = isKnife ? 12 : 32;
                     const bladeY = isKnife ? -4 : -20;
                     ctx.fillStyle = col;
                     ctx.fillRect(-2, bladeY, 4, bladeLen); 
                     ctx.beginPath();
                     ctx.moveTo(-2, bladeY);
                     ctx.lineTo(0, bladeY - 4);
                     ctx.lineTo(2, bladeY);
                     ctx.fill();
                     ctx.fillStyle = '#8d6e63';
                     ctx.fillRect(isKnife ? -4 : -6, 12, isKnife ? 8 : 12, 2); 
                     ctx.fillRect(-2, 14, 4, 6); 
                 } else if (heldItemId.includes('scythe')) {
                     ctx.fillStyle = '#8d6e63';
                     ctx.fillRect(-2, -10, 4, 30);
                     ctx.fillStyle = col;
                     ctx.fillRect(-14, -14, 16, 4);
                     ctx.fillRect(-14, -10, 4, 8);
                 } else if (heldItemId.includes('pickaxe')) {
                     ctx.fillStyle = '#8d6e63';
                     ctx.fillRect(-2, -4, 4, 20); 
                     ctx.fillStyle = col; 
                     ctx.fillRect(-12, -8, 24, 4); 
                     ctx.fillRect(-14, -6, 4, 4);
                     ctx.fillRect(10, -6, 4, 4);
                 } else if (heldItemId.includes('axe')) {
                     const isBattleAxe = heldItemId.includes('battle_axe');
                     ctx.fillStyle = '#8d6e63';
                     ctx.fillRect(-2, -4, 4, isBattleAxe ? 30 : 20); 
                     ctx.fillStyle = col;
                     ctx.fillRect(2, -8, 8, 10); 
                     if (isBattleAxe) {
                         ctx.fillRect(-10, -8, 8, 10);
                     }
                 } else if (heldItemId.includes('shovel')) {
                     ctx.fillStyle = '#8d6e63';
                     ctx.fillRect(-2, -4, 4, 20); 
                     ctx.fillStyle = col;
                     ctx.fillRect(-4, -12, 8, 8); 
                 } else if (heldItemId.includes('hoe')) {
                     ctx.fillStyle = '#8d6e63';
                     ctx.fillRect(-2, -4, 4, 20); 
                     ctx.fillStyle = col;
                     ctx.fillRect(-8, -8, 12, 4); 
                 } else if (heldItemId.includes('hammer')) {
                     const isWarHammer = heldItemId.includes('war_hammer');
                     ctx.fillStyle = '#8d6e63';
                     ctx.fillRect(-2, -4, 4, isWarHammer ? 30 : 20); 
                     ctx.fillStyle = col;
                     ctx.fillRect(isWarHammer ? -12 : -8, -10, isWarHammer ? 24 : 16, isWarHammer ? 12 : 8); 
                 } else if (heldItemId.includes('spear')) {
                     ctx.fillStyle = '#8d6e63';
                     ctx.fillRect(-2, -10, 4, 30); 
                     ctx.fillStyle = col;
                     ctx.fillRect(-3, -18, 6, 8); 
                     ctx.fillRect(-1, -22, 2, 4); 
                 } else if (heldItemId.includes('bow')) {
                     ctx.strokeStyle = '#8d6e63';
                     ctx.lineWidth = 3;
                     ctx.beginPath();
                     ctx.arc(-4, 0, 12, -Math.PI/2, Math.PI/2);
                     ctx.stroke();
                     ctx.strokeStyle = '#fff';
                     ctx.lineWidth = 1;
                     ctx.beginPath();
                     ctx.moveTo(-4, -12);
                     if (swingProgress > 0) {
                         ctx.lineTo(-12, 0);
                         // draw arrow
                         ctx.fillStyle = '#ccc';
                         ctx.fillRect(-12, -1, 16, 2);
                     }
                     ctx.lineTo(-4, 12);
                     ctx.stroke();
                 } else if (heldItemId.includes('crossbow')) {
                     ctx.fillStyle = '#8d6e63';
                     ctx.fillRect(-4, -2, 16, 4); // Stock (pointing right)
                     ctx.fillStyle = '#5d4037';
                     ctx.fillRect(4, -12, 4, 24); // Bow part (vertical)
                     
                     ctx.strokeStyle = '#fff';
                     ctx.lineWidth = 1;
                     ctx.beginPath();
                     ctx.moveTo(4, -12);
                     if (swingProgress > 0) {
                         ctx.lineTo(-4, 0);
                         ctx.fillStyle = '#ccc';
                         ctx.fillRect(-4, -1, 16, 2); // Arrow
                     } else {
                         ctx.lineTo(8, 0);
                     }
                     ctx.lineTo(4, 12);
                     ctx.stroke();
                 } else {
                     ctx.fillStyle = col;
                     ctx.fillRect(-4, -4, 8, 8);
                 }
            }
        }
        ctx.restore();

        // Offhand (Shield/Torch)
        if (equipment.offHand) {
             if (equipment.offHand.type === ItemType.SHIELD) {
                 ctx.save();
                 ctx.translate(-4, 4);
                 if (blockingRef.current) ctx.translate(4, -2);
                 const col = ITEM_COLORS[(equipment.offHand?.id?.toString() || '')] || '#888';
                 ctx.fillStyle = col;
                 ctx.fillRect(-6, -6, 12, 12);
                 ctx.restore();
             } else if (equipment.offHand.id === BlockType.TORCH) {
                 ctx.fillStyle = '#ffeb3b';
                 ctx.fillRect(-8, 4, 4, 10);
             }
        }

        ctx.restore();
        }

        otherPlayersRef.current.forEach(p => {
            ctx.fillStyle = '#7e57c2'; ctx.fillRect(p.x, p.y, p.width, p.height);
            ctx.fillStyle = 'white'; ctx.fillRect(p.x + (p.facingRight?4:-8), p.y + 8, 4, 4); 
            if(p.playerName) { ctx.font = 'bold 12px monospace'; ctx.textAlign = 'center'; ctx.fillStyle = 'white'; ctx.strokeStyle = 'black'; ctx.lineWidth = 3; ctx.strokeText(p.playerName, p.x + p.width/2, p.y - 10); ctx.fillText(p.playerName, p.x + p.width/2, p.y - 10); }
        });

        entitiesRef.current.forEach(ent => { 
            if(ent.type === 'DROP') { 
                const col = ent.itemId && isNaN(Number(ent.itemId)) && ITEM_COLORS[ent.itemId as string] ? ITEM_COLORS[ent.itemId as string] : (ent.itemId && !isNaN(Number(ent.itemId)) ? BLOCK_COLORS[Number(ent.itemId)] : '#fff'); 
                ctx.fillStyle = col; ctx.fillRect(ent.x, ent.y, ent.width, ent.height); 
            } else if (ent.type === 'PROJECTILE') {
                if (ent.itemId === 'uranium') { ctx.fillStyle = '#76ff03'; ctx.beginPath(); ctx.arc(ent.x + ent.width/2, ent.y + ent.height/2, 6, 0, Math.PI * 2); ctx.fill(); } 
                else if (ent.itemId === 'uranium_totem') { ctx.fillStyle = Math.random() < 0.5 ? '#76ff03' : '#ffd600'; ctx.beginPath(); ctx.arc(ent.x + ent.width/2, ent.y + ent.height/2, 4, 0, Math.PI * 2); ctx.fill(); } 
                else if (ent.itemId === 'spike') { ctx.fillStyle = '#5c5c5c'; ctx.beginPath(); ctx.moveTo(ent.x + ent.width/2, ent.y + ent.height); ctx.lineTo(ent.x, ent.y); ctx.lineTo(ent.x + ent.width, ent.y); ctx.fill(); } 
                else if (ent.itemId === 'arrow') { 
                    ctx.save();
                    ctx.translate(ent.x + ent.width/2, ent.y + ent.height/2);
                    ctx.rotate(ent.rotation || 0);
                    ctx.fillStyle = '#8d6e63'; // wood shaft
                    ctx.fillRect(-8, -1, 12, 2);
                    ctx.fillStyle = '#cfd8dc'; // iron head
                    ctx.beginPath(); ctx.moveTo(4, -2); ctx.lineTo(8, 0); ctx.lineTo(4, 2); ctx.fill();
                    ctx.fillStyle = '#fff'; // feathers
                    ctx.fillRect(-10, -2, 2, 4);
                    ctx.restore();
                }
                else { drawMob(ctx, ent); }
            } else { drawMob(ctx, ent); } 
        });

        if (options.isMobile && !isPaused) {
            const worldMouseX = mouseRef.current.x + cameraRef.current.x;
            const worldMouseY = mouseRef.current.y + cameraRef.current.y;
            ctx.strokeStyle = 'rgba(255, 255, 0, 0.8)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(worldMouseX, worldMouseY, 15, 0, Math.PI * 2); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(worldMouseX - 20, worldMouseY); ctx.lineTo(worldMouseX + 20, worldMouseY); ctx.moveTo(worldMouseX, worldMouseY - 20); ctx.lineTo(worldMouseX, worldMouseY + 20); ctx.stroke();
        }

        if (dist < reach && !isPaused && !isFurnaceOpen && !isChestOpen && !isAdminMenuOpen && !isSleepUIOpen && !isArmorBenchOpen) {
            const worldMouseX = mouseRef.current.x + cameraRef.current.x;
            const worldMouseY = mouseRef.current.y + cameraRef.current.y;
            const bx = Math.floor(worldMouseX / BLOCK_SIZE); const by = Math.floor(worldMouseY / BLOCK_SIZE); ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 2; ctx.strokeRect(bx*BLOCK_SIZE, by*BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
            if (breakingRef.current.x === bx && breakingRef.current.y === by && breakingRef.current.progress > 0) { const bType = world.blocks[by * WORLD_WIDTH + bx]; const hardness = BLOCK_HARDNESS[bType] || 100; const pct = Math.min(1, breakingRef.current.progress / hardness); ctx.fillStyle = '#000'; ctx.fillRect(bx*BLOCK_SIZE + 2, by*BLOCK_SIZE + 2, 28, 4); ctx.fillStyle = '#0f0'; ctx.fillRect(bx*BLOCK_SIZE + 2, by*BLOCK_SIZE + 2, 28 * pct, 4); }
        }
        
        // --- RENDER WEATHER ---
        if (world.weather && world.weather.duration > 0) {
            const isSnowBiome = getBiome(Math.floor(playerRef.current.x / BLOCK_SIZE), currentSeed) === 'snow';
            const wType = isSnowBiome ? 'SNOW' : world.weather.type;
            const intensity = world.weather.intensity || 1;
            const count = wType === 'HEAVY_RAIN' ? 300 : (wType === 'SNOW' ? 200 : 150) * intensity;
            
            if (wType === 'SNOW') {
                snowCoverRef.current = Math.min(1, snowCoverRef.current + 0.002);
            } else {
                snowCoverRef.current = Math.max(0, snowCoverRef.current - 0.001);
            }

            // Update particles
            while (weatherParticlesRef.current.length < count) {
                weatherParticlesRef.current.push({
                    x: cameraRef.current.x + Math.random() * cvs.width,
                    y: cameraRef.current.y - Math.random() * cvs.height,
                    vx: (Math.random() - 0.5) * 2 + (wType === 'SNOW' ? 1 : 2),
                    vy: wType === 'SNOW' ? 2 + Math.random() * 2 : 10 + Math.random() * 10,
                    type: wType === 'SNOW' ? 'SNOW' : 'RAIN'
                });
            }
            if (weatherParticlesRef.current.length > count) {
                weatherParticlesRef.current.length = Math.floor(count);
            }
            
            ctx.fillStyle = wType === 'SNOW' ? 'rgba(255, 255, 255, 0.8)' : 'rgba(150, 150, 255, 0.6)';
            ctx.strokeStyle = 'rgba(150, 150, 255, 0.6)';
            ctx.lineWidth = 1;
            
            for (let i = 0; i < weatherParticlesRef.current.length; i++) {
                const p = weatherParticlesRef.current[i];
                p.x += p.vx;
                p.y += p.vy;
                
                let hitBlock = false;
                const bx = Math.floor(p.x / BLOCK_SIZE);
                const by = Math.floor(p.y / BLOCK_SIZE);
                if (by >= 0 && by < WORLD_HEIGHT && bx >= 0 && bx < WORLD_WIDTH) {
                    const block = world.blocks[by * WORLD_WIDTH + bx];
                    if (!NON_COLLIDABLE_BLOCKS.has(block)) {
                        hitBlock = true;
                    }
                }

                // Reset if out of bounds or hit block
                if (hitBlock || p.y > cameraRef.current.y + cvs.height || p.x < cameraRef.current.x || p.x > cameraRef.current.x + cvs.width) {
                    p.x = cameraRef.current.x + Math.random() * cvs.width;
                    p.y = cameraRef.current.y - 10;
                    p.type = wType === 'SNOW' ? 'SNOW' : 'RAIN';
                    p.vx = (Math.random() - 0.5) * 2 + (wType === 'SNOW' ? 1 : 2);
                    p.vy = wType === 'SNOW' ? 2 + Math.random() * 2 : 10 + Math.random() * 10;
                }
                
                if (p.type === 'SNOW') {
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
                    ctx.fill();
                } else {
                    ctx.beginPath();
                    ctx.moveTo(p.x, p.y);
                    ctx.lineTo(p.x - p.vx * 2, p.y - p.vy * 2);
                    ctx.stroke();
                }
            }
        } else {
            snowCoverRef.current = Math.max(0, snowCoverRef.current - 0.001);
        }

        // --- REALISTIC BLOOM AND POST PROCESSING ---
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        
        // Emissive Blocks Bloom
        for (let y = startRow; y <= endRow; y++) {
            for (let x = startCol; x <= endCol; x++) {
                if (y < 0 || y >= WORLD_HEIGHT || x < 0 || x >= WORLD_WIDTH) continue;
                const idx = y * WORLD_WIDTH + x; 
                const block = world.blocks[idx];
                
                let isFurnaceActive = false;
                if (block === BlockType.FURNACE) {
                    const furnace = furnacesRef.current.get(`${x},${y}`);
                    if (furnace && furnace.burnTime > 0) isFurnaceActive = true;
                }

                if (block === BlockType.TORCH || block === BlockType.LAMP_ON || block === BlockType.LAVA || block === BlockType.URANIUM_ORE || block === BlockType.URANIUM_BLOCK || isFurnaceActive) {
                   const cx = x * BLOCK_SIZE + BLOCK_SIZE/2;
                   const cy = y * BLOCK_SIZE + BLOCK_SIZE/2;
                   const isUranium = block === BlockType.URANIUM_ORE || block === BlockType.URANIUM_BLOCK;
                   
                   const grad = ctx.createRadialGradient(cx, cy, 2, cx, cy, BLOCK_SIZE * 4);
                   grad.addColorStop(0, isUranium ? 'rgba(118, 255, 3, 0.4)' : 'rgba(255, 152, 0, 0.4)');
                   grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
                   
                   ctx.fillStyle = grad;
                   ctx.fillRect(cx - BLOCK_SIZE*4, cy - BLOCK_SIZE*4, BLOCK_SIZE*8, BLOCK_SIZE*8);
                }
            }
        }

        // Player Torch Bloom
        if (hasTorch) {
            const px = player.x + player.width/2;
            const py = player.y + player.height/2;
            ctx.globalCompositeOperation = 'screen';
            const grad = ctx.createRadialGradient(px, py, BLOCK_SIZE/2, px, py, BLOCK_SIZE * 6);
            grad.addColorStop(0, 'rgba(255, 152, 0, 0.35)');
            grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
            ctx.fillStyle = grad;
            ctx.fillRect(px - BLOCK_SIZE*6, py - BLOCK_SIZE*6, BLOCK_SIZE*12, BLOCK_SIZE*12);
            ctx.globalCompositeOperation = 'source-over';
        }
        
        ctx.restore();

        ctx.restore(); // Restore camera transform
        
        // --- SHADERS OVERLAY ---
        if (options.graphicsQuality === 'ULTRA') {
            ctx.save();
            const t3 = timeRef.current;
            const isPrecip = world.weather && world.weather.duration > 0;
            
            // 1. Time of Day Ambient Tint (Multiply)
            let ambientTint = 'rgba(255,255,255,1)';
            if (t3 < DAWN_START || t3 >= NIGHT_START) {
                ambientTint = 'rgba(120, 140, 255, 1)'; // Deep night blue tint
            } else if (t3 < DAWN_START + 3000) {
                const p = (t3 - DAWN_START) / 3000;
                // Dawn: deep blue -> orange -> transparent
                const r = Math.floor(120 + 135 * p);
                const g = Math.floor(140 + 115 * p);
                const b = 255;
                ambientTint = `rgba(${r}, ${g}, ${b}, 1)`;
            } else if (t3 > DUSK_START) {
                const p = (t3 - DUSK_START) / (NIGHT_START - DUSK_START);
                // Dusk: natural -> red/purple -> deep blue
                const r = Math.floor(255 - 135 * p);
                const g = Math.floor(255 - 115 * p);
                const b = 255;
                ambientTint = `rgba(${r}, ${g}, ${b}, 1)`;
            }
            if (isPrecip) ambientTint = 'rgba(160, 160, 170, 1)'; // moody gray in rain
            
            ctx.globalCompositeOperation = 'multiply';
            ctx.fillStyle = ambientTint;
            ctx.fillRect(0, 0, cvs.width, cvs.height);

            // 3. Vignette
            ctx.globalCompositeOperation = 'multiply';
            const vig = ctx.createRadialGradient(cvs.width/2, cvs.height/2, cvs.width * 0.4, cvs.width/2, cvs.height/2, Math.max(cvs.width, cvs.height));
            vig.addColorStop(0, 'rgba(255,255,255,1)');
            vig.addColorStop(1, 'rgba(80,80,100,1)');
            ctx.fillStyle = vig;
            ctx.fillRect(0, 0, cvs.width, cvs.height);

            ctx.restore();
        }

        // --- RENDER MINIMAP ---
        if (options.showMinimap !== false) {
            const mmScale = 2; // Each block is 2x2 pixels
            const renderSize = 60; // Show 60x60 blocks (120x120 pixels)
            const mmWidth = renderSize * mmScale;
            const mmHeight = renderSize * mmScale;
            // The top UI bar (hammer mode, etc) is absolute top-4 right-4.
            // We'll place the minimap right below that or just at top right.
            const mmPadding = 16;
            const mmX = cvs.width - mmWidth - mmPadding;
            // Shift down slightly to avoid overlapping activeBuildBlock UI
            const isTutorialActive = options.tutorialEnabled !== false && !unlockedAchievements.includes(0) && tutorialStep < 3;
            const mmY = (activeBuildBlock && !isHammerMenuOpen ? mmPadding + 50 : mmPadding) + (isTutorialActive ? 140 : 0);
            
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(mmX - 4, mmY - 4, mmWidth + 8, mmHeight + 8);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.lineWidth = 2;
            ctx.strokeRect(mmX - 4, mmY - 4, mmWidth + 8, mmHeight + 8);

            const px = Math.floor(player.x / BLOCK_SIZE);
            const py = Math.floor(player.y / BLOCK_SIZE);
            const startX = px - Math.floor(renderSize / 2);
            const startY = py - Math.floor(renderSize / 2);

            for (let my = 0; my < renderSize; my++) {
                const wy = startY + my;
                if (wy < 0 || wy >= WORLD_HEIGHT) continue;
                
                let spanColor: string | null = null;
                let spanStart = 0;
                
                for (let mx = 0; mx <= renderSize; mx++) {
                    const wx = startX + mx;
                    let color: string | null = null;
                    
                    if (mx < renderSize && wx >= 0 && wx < WORLD_WIDTH) {
                        const block = world.blocks[wy * WORLD_WIDTH + wx];
                        if (block !== BlockType.AIR) {
                            if (block === BlockType.SNOW_BLOCK) {
                                color = null;
                            } else {
                                color = BLOCK_COLORS[block];
                            }
                        }
                    }
                    
                    if (color !== spanColor) {
                        if (spanColor) {
                            ctx.fillStyle = spanColor;
                            ctx.fillRect(mmX + spanStart * mmScale, mmY + my * mmScale, (mx - spanStart) * mmScale, mmScale);
                        }
                        spanColor = color;
                        spanStart = mx;
                    }
                }
            }
            
            // Draw Mobs
            entitiesRef.current.forEach(ent => {
                if (ent.type === 'DROP' || ent.type === 'PROJECTILE' || ent.type === 'PLAYER') return;
                const epx = Math.floor(ent.x / BLOCK_SIZE);
                const epy = Math.floor(ent.y / BLOCK_SIZE);
                if (epx >= startX && epx < startX + renderSize && epy >= startY && epy < startY + renderSize) {
                    // Determine color based on mob type
                    let color = 'orange'; // Default hostile/unknown
                    if (['COW', 'PIG', 'SHEEP'].includes(ent.type)) {
                        color = '#00FF00'; // Green for passive mobs
                    } else if (['ZOMBIE', 'MUTANT_ZOMBIE', 'PLAGUE_KING', 'SKELETON', 'ZOMBIE_RUNNER', 'ZOMBIE_TOXIC', 'ZOMBIE_SKELETON'].includes(ent.type)) {
                        color = '#FF0000'; // Red for hostile mobs
                    } else if (ent.type === 'NPC') {
                        color = '#00FFFF'; // Cyan for NPCs
                    } else if (ent.type === 'HORSE') {
                        color = '#8B4513'; // Saddle brown
                    } else if (ent.type === 'WOLF' || ent.type === 'DOG') {
                        color = '#CCCCCC'; // Light Gray
                    }
                    
                    ctx.fillStyle = color;
                    ctx.fillRect(mmX + (epx - startX) * mmScale - 1, mmY + (epy - startY) * mmScale - 1, mmScale + 2, mmScale + 2);
                }
            });

            // Draw Other Players
            otherPlayersRef.current.forEach(op => {
                const epx = Math.floor(op.x / BLOCK_SIZE);
                const epy = Math.floor(op.y / BLOCK_SIZE);
                if (epx >= startX && epx < startX + renderSize && epy >= startY && epy < startY + renderSize) {
                    ctx.fillStyle = '#0000FF'; // Blue for other players
                    ctx.fillRect(mmX + (epx - startX) * mmScale - 1, mmY + (epy - startY) * mmScale - 1, mmScale + 2, mmScale + 2);
                }
            });

            // Draw player position as red dot
            ctx.fillStyle = 'red';
            ctx.fillRect(mmX + Math.floor(renderSize/2) * mmScale - 2, mmY + Math.floor(renderSize/2) * mmScale - 2, 4, 4);
            
            // Draw red dot border
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 1;
            ctx.strokeRect(mmX + Math.floor(renderSize/2) * mmScale - 2, mmY + Math.floor(renderSize/2) * mmScale - 2, 4, 4);
        }

        // Draw Custom Cursor & Cooldown
        if (options.customCursor !== false && !options.isMobile) {
            const cx = mouseRef.current.x;
            const cy = mouseRef.current.y;
            
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.beginPath();
            ctx.arc(cx, cy, 2, 0, Math.PI * 2);
            ctx.fill();
            
            if (player.attackCooldown > 0) {
                const maxCd = 60; // rough standard sword cooldown frames
                const pct = Math.max(0, Math.min(1, player.attackCooldown / maxCd));
                ctx.strokeStyle = 'rgba(255,255,255,0.8)';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(cx, cy, 6 + (pct * 4), -Math.PI/2, -Math.PI/2 + ((1-pct) * Math.PI * 2));
                ctx.stroke();
            } else {
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.arc(cx, cy, 6, 0, Math.PI * 2);
                ctx.stroke();
            }
        }

        requestRef.current = requestAnimationFrame(gameLoop);
    };

    const currentItemName = inventory[selectedSlot] ? (ITEM_NAMES[lang][(inventory[selectedSlot]?.id?.toString() || '')] || (inventory[selectedSlot]?.id?.toString() || '')) : '';
    const xpForNextLevel = playerLevel * 100;
    const xpProgress = Math.min(1, playerXP / xpForNextLevel);
    const maxStaminaCalc = MAX_STAMINA + (playerStats.endurance * 20);
    let chargePct = 0; if (spearChargeStartRef.current) { const diff = Date.now() - spearChargeStartRef.current; chargePct = (Math.sin(diff / 300) + 1) / 2; }

    return (
        <div className="relative w-full h-full">
            <canvas ref={canvasRef} width={window.innerWidth} height={window.innerHeight} className={` ${options.customCursor !== false && !options.isMobile ? 'cursor-none' : ''} touch-none`} />
            {(gameState === 'PLAYING' || gameState === 'PAUSED') && (
                <>
                    {/* MOBILE CONTROLS OVERLAY */}
                    {options.isMobile && !isInventoryOpen && !isFurnaceOpen && !isChestOpen && !isArmorBenchOpen && (
                        <MobileControls 
                            onInput={(inputs) => {
                                const p = playerRef.current;
                                let baseSpeed = PLAYER_SPEED + (playerStats.agility * 0.5);
                                if ((p as any).freezeEndTime && (p as any).freezeEndTime > Date.now()) baseSpeed *= 0.5;
                                if (Math.abs(inputs.x) > 0.1) {
                                    if (blockingRef.current) { p.vx = inputs.x * baseSpeed * 0.3; } else { p.vx = inputs.x * baseSpeed; }
                                    if (inputs.x > 0) p.facingRight = true; if (inputs.x < 0) p.facingRight = false;
                                } else if (!blockingRef.current) { p.vx *= 0.8; }
                                keysRef.current['Space'] = inputs.jump; mouseRef.current.left = inputs.attack; mouseRef.current.right = inputs.place;
                            }}
                            onToggleInventory={() => setIsInventoryOpen(true)}
                            onDrop={dropItem}
                            onEquip={() => { setEquipment(prev => ({ ...prev, offHand: inventory[selectedSlot] })); setInventory(prev => { const newInv = [...prev]; newInv[selectedSlot] = equipment.offHand; return newInv; }); }}
                            onToggleTreePass={() => { treePassRef.current = !treePassRef.current; addNotification(treePassRef.current ? (lang==='PT' ? "Atravessar Árvores: LIGADO" : "Tree Pass: ON") : (lang==='PT' ? "Atravessar Árvores: DESLIGADO" : "Tree Pass: OFF")); }}
                        />
                    )}

                    <div className="absolute top-4 left-4 flex flex-col gap-2 pointer-events-none z-10 w-full pr-8">
                        {options.gameMode !== 'CREATIVE' && options.gameMode !== 'SPECTATOR' && (
                            <>
                                <div className="flex gap-1">{Array.from({length: Math.ceil(playerRef.current.maxHealth / 2) * 2 / 2}).map((_, i) => (<span key={i} className="text-2xl drop-shadow-md">{i < Math.floor(hearts) ? (temperatureState === 'COLD' ? '💙' : temperatureState === 'HOT' ? '🧡' : '❤️') : (i < hearts ? '💔' : '🖤')}</span>))}</div>
                                <div className="flex gap-1">{Array.from({length: 10}).map((_, i) => (<span key={i} className="text-2xl drop-shadow-md">{i < Math.floor(hunger) ? '🍗' : '🦴'}</span>))}</div>
                                <div className="w-48 h-3 bg-gray-800 border border-gray-600 rounded mt-1 relative overflow-hidden"><div className="h-full bg-yellow-400 transition-all duration-200" style={{ width: `${(stamina / maxStaminaCalc) * 100}%` }}></div><span className="absolute inset-0 text-[8px] flex items-center justify-center text-black font-bold">⚡</span></div>
                                
                                {oxygenRef.current < 100 && (
                                    <div className="flex gap-1 mt-1">
                                        {Array.from({length: Math.ceil(oxygenRef.current / 10)}).map((_, i) => (<span key={i} className="text-xl drop-shadow-md">🫧</span>))}
                                    </div>
                                )}
                            </>
                        )}
                        
                        {Object.keys(activePotionsRef.current).length > 0 && (
                            <div className="absolute top-0 right-8 flex flex-col gap-2 opacity-80 items-end">
                                {Object.keys(activePotionsRef.current).map(p => {
                                    const emoji = p === 'potion_regen' ? '💖' : p === 'potion_resistance' ? '🛡️' : p === 'potion_fire' ? '🔥' : p === 'potion_cold' ? '❄️' : '🧟';
                                    const timeRem = Math.max(0, Math.ceil((activePotionsRef.current[p] - Date.now())/1000));
                                    return <div key={p} className="bg-black/50 text-white font-mono text-sm px-2 py-1 rounded border border-gray-500 shadow flex items-center gap-2">{emoji} {timeRem}s</div>;
                                })}
                            </div>
                        )}
                        
                        {spearChargeStartRef.current && (<div className="absolute left-16 top-32 w-8 h-32 bg-black border-2 border-black rounded-lg overflow-hidden flex flex-col-reverse relative"><div className="absolute inset-0 w-full h-full" style={{ background: 'linear-gradient(to top, #00ff00 0%, #ffff00 50%, #ff0000 100%)' }}></div><div className="absolute w-full h-2 bg-gray-400 border-y border-black/50" style={{ bottom: `${chargePct * 100}%`, transition: 'bottom 75ms linear' }}></div></div>)}
                        {options.showCoordinates && (<div className="text-white font-mono text-sm bg-black/50 p-2 rounded w-fit absolute top-0 left-0 m-1 border border-gray-600 shadow-md">X: {Math.floor(playerRef.current.x / BLOCK_SIZE)} Y: {SEA_LEVEL - (Math.floor(playerRef.current.y / BLOCK_SIZE) - INTERNAL_SURFACE_Y)}</div>)}
                        {options.adminMode && !isAdminMenuOpen && (<div className="text-red-400 font-mono text-xs bg-black/50 p-1 rounded w-fit absolute top-20 left-0 m-1">{t.ADMIN_HINT}</div>)}
                        {options.multiplayer && (<div className="bg-purple-900/80 border border-purple-500 p-2 rounded text-white font-mono text-sm mt-2 shadow-lg"><div className="font-bold text-yellow-300">ONLINE: {options.multiplayer.mode}</div><div>Room: {options.multiplayer.roomId}</div></div>)}
                        <div className="fixed top-10 left-1/2 transform -translate-x-1/2 flex flex-col gap-2 pointer-events-none w-full items-center z-50">{notifications.map(note => (<div key={note.id} className="bg-black/70 text-yellow-300 px-4 py-2 rounded-full border border-yellow-500 shadow-lg animate-fade-in-out font-bold">{note.message}</div>))}</div>
                        
                        {/* Chat Messages */}
                        <div className="absolute bottom-20 left-4 pointer-events-none z-30 flex flex-col gap-1 w-64">
                             {chatMessages.length > 0 && chatMessages.slice(-5).map((m, idx) => (
                                  <div key={idx} className="bg-black/60 rounded px-2 py-1 text-sm font-mono shadow animate-fade-in-out" style={{ color: m.color || 'white' }}>{m.msg}</div>
                             ))}
                        </div>

                        {/* Recent Achievement Toast */}
                        {recentAchievement && (
                            <div className="fixed top-20 right-0 z-50 pointer-events-none animate-toast">
                                <div className="bg-gray-800 border-2 border-yellow-500 rounded-l-lg p-3 shadow-lg flex items-center gap-3 w-64">
                                    <div className="text-3xl">{recentAchievement.icon}</div>
                                    <div className="flex flex-col">
                                        <span className="text-yellow-400 font-bold text-xs uppercase tracking-wider text-left">Conquista Desbloqueada!</span>
                                        <span className="text-white font-medium text-sm text-left">{recentAchievement.text}</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                    
                    {/* Map / Mobile Chat button */}
                    {options.isMobile && !isChatOpen && (
                        <div className="absolute top-24 right-4 z-40">
                             <button onClick={() => setIsChatOpen(true)} className="bg-gray-800/80 border-2 border-gray-500 rounded p-2 text-white">
                                  💬
                             </button>
                        </div>
                    )}
                    
                    {/* Chat Input UI */}
                    {isChatOpen && (
                        <div className="absolute inset-0 flex flex-col justify-end pb-[10vh] px-[2vw] z-50 pointer-events-auto bg-black/20">
                            {chatInput.startsWith('/chet') && (
                                <div className="max-w-lg mx-auto w-full mb-1 bg-black/80 border border-gray-600 rounded p-2 text-sm text-gray-300 font-mono">
                                    <div className="font-bold text-white mb-1">Comandos Disponíveis:</div>
                                    <div className="cursor-pointer hover:bg-gray-700 px-1" onClick={() => setChatInput('/chet modo s')}>/chet modo s - Sobrevivência</div>
                                    <div className="cursor-pointer hover:bg-gray-700 px-1" onClick={() => setChatInput('/chet modo c')}>/chet modo c - Criativo</div>
                                    <div className="cursor-pointer hover:bg-gray-700 px-1" onClick={() => setChatInput('/chet modo f')}>/chet modo f - Espectador</div>
                                    <div className="cursor-pointer hover:bg-gray-700 px-1" onClick={() => setChatInput('/chet matar jogador')}>/chet matar jogador</div>
                                    <div className="cursor-pointer hover:bg-gray-700 px-1" onClick={() => setChatInput('/chet hora 10')}>/chet hora &lt;1-100&gt;</div>
                                    <div className="cursor-pointer hover:bg-gray-700 px-1" onClick={() => setChatInput('/chet tp bioma ')}>/chet tp bioma &lt;planicie|deserto|neve|floresta&gt;</div>
                                    <div className="cursor-pointer hover:bg-gray-700 px-1" onClick={() => setChatInput('/chet tp estrutura ')}>/chet tp estrutura &lt;cidade grande|fazenda&gt;</div>
                                </div>
                            )}
                            <form onSubmit={(e) => {
                                e.preventDefault();
                                const text = chatInput.trim();
                                if(!text) { setIsChatOpen(false); return; }
                                let isCommand = false;
                                if(text.startsWith('/chet apenas f') || text.startsWith('/chet modo f')) {
                                    setOptions(prev => ({...prev, gameMode: 'SPECTATOR'}));
                                    setAdminFlags(prev => ({...prev, noClip: true}));
                                    setChatMessages(p => [...p, {msg: 'Modo espectador ativado.', color: '#00ff00'}]);
                                    isCommand = true;
                                } else if(text.startsWith('/chet modo s')) {
                                    setOptions(prev => ({...prev, gameMode: 'SURVIVAL'}));
                                    setAdminFlags(prev => ({...prev, noClip: false}));
                                    setChatMessages(p => [...p, {msg: 'Modo sobrevivência ativado.', color: '#00ff00'}]);
                                    isCommand = true;
                                } else if(text.startsWith('/chet modo c')) {
                                    setOptions(prev => ({...prev, gameMode: 'CREATIVE'}));
                                    setAdminFlags(prev => ({...prev, noClip: false}));
                                    setChatMessages(p => [...p, {msg: 'Modo criativo ativado.', color: '#00ff00'}]);
                                    isCommand = true;
                                } else if(text.startsWith('/chet matar jogador') || text.startsWith('/chet matar player')) {
                                    playerRef.current.health = 0;
                                    setHearts(0);
                                    setChatMessages(p => [...p, {msg: 'Jogador morto.', color: '#00ff00'}]);
                                    isCommand = true;
                                } else if(text.startsWith('/chet hora')) {
                                    const val = parseInt(text.split(' ')[2]);
                                    if (!isNaN(val)) {
                                         setCheatTimeMultiplier(val);
                                         setChatMessages(p => [...p, {msg: `Multiplicador de tempo: ${val}`, color: '#00ff00'}]);
                                    }
                                    isCommand = true;
                                } else if(text.startsWith('/chet tp bioma') || text.startsWith('/chet tp biome')) {
                                    const rawName = text.substring(14).trim().toLowerCase();
                                    let biomeName = 'desconhecido';
                                    if (rawName.includes('planicie') || rawName.includes('plains')) biomeName = 'plains';
                                    if (rawName.includes('neve') || rawName.includes('snow')) biomeName = 'snow';
                                    if (rawName.includes('deserto') || rawName.includes('desert')) biomeName = 'desert';
                                    if (rawName.includes('floresta') || rawName.includes('forest')) biomeName = 'forest';
                                    
                                    if (biomeName !== 'desconhecido') {
                                         let found = false;
                                         const pX = Math.floor(playerRef.current.x / BLOCK_SIZE);
                                         let chunkStart = Math.floor(pX / 500);
                                         
                                         // Search for biome in both directions
                                         for(let i=1; i<40; i++) {
                                             if (getBiome((chunkStart + i)*500, currentSeed) === biomeName) {
                                                playerRef.current.x = (chunkStart + i)*500 * BLOCK_SIZE;
                                                playerRef.current.y = 0; // fallback safe
                                                found = true; break;
                                             }
                                             if (chunkStart - i > 0 && getBiome((chunkStart - i)*500, currentSeed) === biomeName) {
                                                playerRef.current.x = (chunkStart - i)*500 * BLOCK_SIZE;
                                                playerRef.current.y = 0; // fallback safe
                                                found = true; break;
                                             }
                                         }
                                         if(found) setChatMessages(p => [...p, {msg: `Teleportado para bioma: ${rawName}.`, color: '#00ff00'}]);
                                         else setChatMessages(p => [...p, {msg: `Bioma ${rawName} não encontrado por perto.`, color: '#ff0000'}]);
                                    } else {
                                        setChatMessages(p => [...p, {msg: `Bioma ${rawName} inválido. Tente: planicie, neve, deserto, floresta`, color: '#ff0000'}]);
                                    }
                                    isCommand = true;
                                } else if(text.startsWith('/chet tp estrutura')) {
                                    const rawName = text.substring(18).trim().toLowerCase();
                                    let found = false;
                                    
                                    if (worldRef.current && worldRef.current.structures) {
                                        const pX = Math.floor(playerRef.current.x / BLOCK_SIZE);
                                        let closest = null;
                                        let minD = Infinity;
                                        worldRef.current.structures.forEach((st: any) => {
                                            if (st.name === rawName || (rawName === 'cidade' && st.name === 'cidade grande')) {
                                                const d = Math.abs(st.x - pX);
                                                if (d < minD) {
                                                    minD = d;
                                                    closest = st;
                                                }
                                            }
                                        });
                                        if (closest) {
                                            playerRef.current.x = (closest as any).x * BLOCK_SIZE;
                                            playerRef.current.y = 0;
                                            found = true;
                                            setChatMessages(p => [...p, {msg: `Teleportado para estrutura: ${(closest as any).name}.`, color: '#00ff00'}]);
                                        }
                                    }
                                    
                                    if(!found) setChatMessages(p => [...p, {msg: `Estrutura ${rawName} não encontrada no mundo!`, color: '#ff0000'}]);
                                    isCommand = true;
                                }
                                
                                if (!isCommand) setChatMessages(p => [...p, {msg: `Você: ${text}`}]);
                                setChatInput("");
                                setIsChatOpen(false);
                            }} className="flex w-full max-w-lg mx-auto bg-gray-800 border-2 border-gray-600 rounded">
                                <input autoFocus type="text" value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={(e)=>{if(e.key === 'Escape') setIsChatOpen(false);}} className="flex-1 bg-transparent text-white px-3 py-2 outline-none font-mono" placeholder="Digite uma mensagem ou /chet..." />
                                <button type="submit" className="bg-green-600 text-white px-4 py-2 font-bold cursor-pointer">Enviar</button>
                            </form>
                        </div>
                    )}

                    {!isInventoryOpen && (<div className="fixed bottom-24 left-1/2 transform -translate-x-1/2 text-2xl drop-shadow-md z-10 pointer-events-none select-none">
                        {temperatureState === 'HOT' ? '🥵' : (temperatureState === 'COLD' ? '🥶' : '😐')}
                    </div>)}
                    {!isInventoryOpen && (<div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 w-[350px] sm:w-[450px] z-10 pointer-events-none"><div className="w-full h-2 bg-gray-900 border border-gray-600 rounded-full relative overflow-hidden"><div className="h-full bg-green-500 transition-all duration-500" style={{ width: `${xpProgress * 100}%` }}></div></div><div className="text-center text-xs text-green-300 font-bold drop-shadow-md mt-1">{playerLevel}</div></div>)}
                    {currentItemName && (<div className="absolute bottom-32 left-1/2 transform -translate-x-1/2 text-white font-bold drop-shadow-md text-lg pointer-events-none z-10">{currentItemName}</div>)}
                    {interactionPrompt && (
                        <div 
                            className="absolute bg-black/80 text-white text-xs px-2 py-1 rounded pointer-events-none z-20 border border-white/50"
                            style={{ 
                                left: interactionPrompt.x - cameraRef.current.x, 
                                top: interactionPrompt.y - cameraRef.current.y - 20,
                                transform: 'translate(-50%, 0)'
                            }}
                        >
                            {interactionPrompt.msg}
                        </div>
                    )}
                    {gameState === 'PLAYING' && options.tutorialEnabled !== false && !unlockedAchievements.includes(0) && tutorialStep < 3 && (
                        <div className="absolute top-4 right-4 bg-black/70 border-2 border-yellow-500 rounded p-4 pointer-events-none z-10 w-64 shadow-[0_0_15px_rgba(250,204,21,0.3)] animate-pulse-slow">
                            <h3 className="text-yellow-400 font-bold mb-2 uppercase text-sm flex items-center gap-2"><span>🎓</span> {lang === 'PT' ? 'Tutorial' : 'Tutorial'}</h3>
                            <div className="text-white text-sm">
                                {tutorialStep === 0 && (
                                    <>
                                        <p className="mb-2">{lang === 'PT' ? 'Quebre 3 moitas para conseguir gravetos.' : 'Break 3 bushes for sticks.'}</p>
                                        <div className="w-full bg-gray-800 h-2 rounded"><div className="bg-yellow-400 h-full rounded transition-all" style={{width: `${Math.min(100, (inventory.reduce((a,i) => a+(i&&i.id==='stick'?i.count:0),0) / 3)*100)}%`}}></div></div>
                                        <p className="text-xs text-gray-400 mt-1 text-right">{Math.min(3, inventory.reduce((a,i) => a+(i&&i.id==='stick'?i.count:0),0))}/3</p>
                                    </>
                                )}
                                {tutorialStep === 1 && (
                                    <p className="text-green-300 font-bold">{lang === 'PT' ? 'Abra o inventário (E) e faça um Machado Básico.' : 'Open inventory (E) and craft a Basic Axe.'}</p>
                                )}
                                {tutorialStep === 2 && (
                                    <p className="text-green-300 font-bold">{lang === 'PT' ? 'Quebre uma árvore, faça Tábua de Madeira e depois crie a Bancada de Trabalho.' : 'Break a tree, craft Planks, then craft a Crafting Table.'}</p>
                                )}
                            </div>
                        </div>
                    )}
                    {activeBuildBlock && !isHammerMenuOpen && (<div className="absolute top-4 right-4 bg-black/60 p-2 text-white rounded pointer-events-none">{t.HAMMER_MODE}: {ITEM_NAMES[lang][activeBuildBlock]}</div>)}
                    <Inventory 
                        items={inventory} 
                        isOpen={isInventoryOpen} 
                        onClose={() => { setIsInventoryOpen(false); setNearbyStation('NONE'); }} 
                        onSelectSlot={setSelectedSlot} 
                        selectedSlot={selectedSlot} 
                        onCraft={handleCraft} 
                        nearbyStation={nearbyStation} 
                        cursorItem={cursorItem} 
                        onSlotClick={handleInventorySlotClick} 
                        mousePos={uiMousePos} 
                        lang={lang} 
                        equipment={equipment} 
                        onEquip={handleEquip} 
                        onUnequip={handleUnequip} 
                        stats={playerStats} 
                        skillPoints={skillPoints} 
                        level={playerLevel} 
                        onUpgradeStat={upgradeStat} 
                        isMobile={options.isMobile}
                        gameMode={options.gameMode}
                        onCreativeGive={handleCreativeGive}
                        onDropItem={dropItem}
                        onClearInventory={() => setInventory(Array(36).fill(null))}
                    />
                    {isFurnaceOpen && activeFurnacePos && furnacesRef.current.get(activeFurnacePos) && (<FurnaceUI input={furnacesRef.current.get(activeFurnacePos)!.input} fuel={furnacesRef.current.get(activeFurnacePos)!.fuel} output={furnacesRef.current.get(activeFurnacePos)!.output} progress={furnacesRef.current.get(activeFurnacePos)!.cookTime / 200} burnProgress={furnacesRef.current.get(activeFurnacePos)!.maxBurnTime ? furnacesRef.current.get(activeFurnacePos)!.burnTime / furnacesRef.current.get(activeFurnacePos)!.maxBurnTime : 0} onClose={() => { setIsFurnaceOpen(false); if(cursorItem) setCursorItem(null); }} onSlotClick={(slotType) => activeFurnacePos && handleFurnaceClick(activeFurnacePos, slotType)} playerInv={inventory} onPlayerSlotClick={(idx) => handleInventorySlotClick(idx, 0)} selectedSlot={selectedSlot} />)}
                    {isChestOpen && activeChestPos && chestsRef.current.has(activeChestPos) && (<ChestUI slots={activeChestSize} contents={chestsRef.current.get(activeChestPos)!} onClose={() => { setIsChestOpen(false); if(cursorItem) setCursorItem(null); }} onSlotClick={handleChestSlotClick} playerInv={inventory} onPlayerSlotClick={(idx) => handleInventorySlotClick(idx, 0)} selectedSlot={selectedSlot} />)}
                    {isHammerMenuOpen && (<HammerBuildUI onClose={() => setIsHammerMenuOpen(false)} onSelectBuild={handleHammerBuild} lang={lang} playerInv={inventory} />)}
                    {isArmorBenchOpen && (<ArmorBenchUI onClose={() => { setIsArmorBenchOpen(false); if(cursorItem) setCursorItem(null); }} playerInv={inventory} onPlayerSlotClick={(idx) => handleInventorySlotClick(idx, 0)} selectedSlot={selectedSlot} lang={lang} onReturnItem={handleArmorBenchReturn} onCraft={handleCraft} />)}
                    {showAchievementsUI && (<AchievementsOverlay unlocked={unlockedAchievements} onClose={() => setShowAchievementsUI(false)} />)}
                    {isFishing && (<FishingMinigame onSuccess={handleFishingSuccess} onFail={handleFishingFail} />)}
                    {isAdminMenuOpen && (<AdminPanel onClose={() => setIsAdminMenuOpen(false)} adminState={adminFlags} setAdminState={setAdminFlags} onGiveItem={handleAdminGiveItem} onSetTime={handleAdminSetTime} onChangeWeather={(w) => { if(worldRef.current) { if(!worldRef.current.weather) worldRef.current.weather = {type:'CLEAR', intensity:0, duration:0}; worldRef.current.weather.type = w; worldRef.current.weather.duration = w === 'CLEAR' ? 0 : 999999; worldRef.current.weather.intensity = w === 'HEAVY_RAIN' ? 1.0 : 0.5; } }} onChangeMoon={(m) => moonPhaseRef.current = m} lang={lang} />)}
                    {isSleepUIOpen && (<SleepUI onClose={() => setIsSleepUIOpen(false)} onSleep={handleSleep} lang={lang} />)}
                    {activeNpc && (<NpcUI npc={activeNpc} onClose={() => setActiveNpc(null)} onCompleteQuest={handleCompleteQuest} inventory={inventory} lang={lang} />)}
                </>
            )}
            {showDeathScreen && (
                <div className="absolute inset-0 bg-red-900/80 backdrop-blur-md z-[60] flex flex-col items-center justify-center text-white">
                    <h1 className="text-6xl font-bold mb-4 drop-shadow-lg">{lang === 'PT' ? 'VOCÊ MORREU!' : 'YOU DIED!'}</h1>
                    <p className="text-xl mb-8">{lang === 'PT' ? 'Sua jornada acabou... por enquanto.' : 'Your journey has ended... for now.'}</p>
                    
                    <div className="flex gap-4">
                        {options.difficulty === 'HARD' ? (
                            <button 
                                onClick={async () => {
                                    if (currentWorldId) {
                                        await deleteWorldFromDB(currentWorldId);
                                    }
                                    setGameState('MENU');
                                    worldRef.current = null;
                                    setAdminFlags({ noClip: false, nightVision: false, showCreative: false });
                                    setIsAdminMenuOpen(false);
                                    setNotifications([]);
                                    otherPlayersRef.current = [];
                                    if(socketRef.current) socketRef.current.disconnect();
                                    setShowDeathScreen(false);
                                }}
                                className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded font-bold text-xl border-2 border-red-400"
                            >
                                {lang === 'PT' ? 'Deletar Mundo & Sair' : 'Delete World & Quit'}
                            </button>
                        ) : (
                            <>
                                <button 
                                    onClick={() => {
                                        if (worldRef.current) respawnPlayer(worldRef.current);
                                        setShowDeathScreen(false);
                                        setGameState('PLAYING');
                                    }}
                                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded font-bold text-xl border-2 border-green-400"
                                >
                                    {lang === 'PT' ? 'Renascer' : 'Respawn'}
                                </button>
                                <button 
                                    onClick={handleSaveAndQuit}
                                    className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded font-bold text-xl border-2 border-gray-400"
                                >
                                    {lang === 'PT' ? 'Menu Principal' : 'Main Menu'}
                                </button>
                            </>
                        )}
                    </div>
                </div>
            )}
            {gameState === 'PAUSED' && !showDeathScreen && (<div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center"><div className="flex flex-col gap-4 w-64"><h1 className="text-4xl text-white font-bold text-center mb-4">PAUSED</h1><button onClick={() => setGameState('PLAYING')} className="bg-gray-700 hover:bg-green-600 text-white p-4 border-2 border-gray-400 font-mono text-xl">Back to Game</button><button onClick={() => setLang(l => l === 'EN' ? 'PT' : 'EN')} className="bg-gray-700 hover:bg-blue-600 text-white p-4 border-2 border-gray-400 font-mono text-xl flex justify-between"><span>Language</span><span className="text-yellow-400">{lang}</span></button><button onClick={handleSaveAndQuit} className="bg-gray-700 hover:bg-red-600 text-white p-4 border-2 border-gray-400 font-mono text-xl">Save & Quit</button></div></div>)}
            {gameState === 'MENU' && (<MainMenu onStartGame={startNewGame} lang={lang} setLang={setLang} />)}
        </div>
    );
};
