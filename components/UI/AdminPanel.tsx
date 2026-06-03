
import React, { useState, useMemo } from 'react';
import { TRANSLATIONS, ITEM_NAMES, BLOCK_COLORS, ITEM_COLORS, ITEM_ICONS, RECIPES, HIDDEN_CREATIVE_BLOCKS, FOOD_VALUES } from '../../constants';
import { BlockType, ItemStack, ItemType } from '../../types';

interface AdminPanelProps {
    onClose: () => void;
    adminState: { noClip: boolean, nightVision: boolean, showCreative: boolean, oneHitBreak: boolean, rainChance: number };
    setAdminState: React.Dispatch<React.SetStateAction<{ noClip: boolean, nightVision: boolean, showCreative: boolean, oneHitBreak: boolean, rainChance: number }>>;
    onGiveItem: (item: ItemStack) => void;
    onSetTime: (time: 'DAY' | 'NIGHT') => void;
    onChangeWeather: (type: 'CLEAR' | 'RAIN' | 'HEAVY_RAIN' | 'SNOW') => void;
    onChangeMoon: (phase: 'NORMAL' | 'FULL' | 'BLOOD') => void;
    lang: 'EN' | 'PT';
}

const AdminItemIcon: React.FC<{ id: string | BlockType, type: ItemType }> = ({ id, type }) => {
    let bg = 'transparent';
    let char = '';
    if (type === ItemType.BLOCK) {
       bg = BLOCK_COLORS[id as number] || '#ccc';
    } else {
       bg = ITEM_COLORS[id as string] || '#aaa';
       const idStr = (id?.toString() || '');
       for (const key in ITEM_ICONS) {
           if (idStr.includes(key)) {
               char = ITEM_ICONS[key];
               break;
           }
       }
    }
    return (
        <div className="w-8 h-8 flex items-center justify-center border border-gray-600 hover:border-white cursor-pointer bg-gray-900" style={{backgroundColor: type === ItemType.BLOCK ? bg : 'rgba(0,0,0,0.5)'}}>
            {type !== ItemType.BLOCK && <span className="text-lg drop-shadow-md" style={{ color: bg }}>{char}</span>}
        </div>
    );
};

export const AdminPanel: React.FC<AdminPanelProps> = ({ onClose, adminState, setAdminState, onGiveItem, onSetTime, onChangeWeather, onChangeMoon, lang }) => {
    const t = TRANSLATIONS[lang];
    const [searchTerm, setSearchTerm] = useState('');

    // Generate Creative Item List - Memoized to prevent lag
    const allItems: ItemStack[] = useMemo(() => {
        const items: ItemStack[] = [];
        const seenItems = new Set<string>();
        
        // Technical blocks to exclude
        const TECHNICAL_BLOCKS = [
            BlockType.DOOR_TOP_CLOSED, 
            BlockType.DOOR_TOP_OPEN, 
            BlockType.DOOR_BOTTOM_OPEN,
            BlockType.CROP_WHEAT,
            BlockType.CROP_CARROT,
            BlockType.CROP_POTATO,
            BlockType.BED_MEDIUM, // Assuming BED is the item
            BlockType.BED_ADVANCED // Assuming BED is the item
        ];

        // Add all blocks
        Object.values(BlockType).forEach(val => {
            if (typeof val === 'number' && val !== 0 && !HIDDEN_CREATIVE_BLOCKS.includes(val) && !TECHNICAL_BLOCKS.includes(val)) {
                const id = (val?.toString() || '');
                if (!seenItems.has(id)) {
                    items.push({ id: val, count: 64, type: ItemType.BLOCK });
                    seenItems.add(id);
                }
            }
        });

        // Add items from recipes (Tools, Food, Materials)
        RECIPES.forEach(r => {
            const id = (r.result.id?.toString() || '');
            if (!seenItems.has(id)) {
                // LOGIC FIX: Tools, Armor, Shields should account 1. Others 64.
                const isUnstackable = r.result.type === ItemType.TOOL || r.result.type === ItemType.ARMOR || r.result.type === ItemType.SHIELD;
                items.push({ ...r.result, count: isUnstackable ? 1 : 64 }); 
                seenItems.add(id);
            }
        });
        
        // Extra items that might not have recipes or just to ensure
        const extraItems = [
            'carrot', 'potato', 'wheat_seeds', 'cherry', 'raw_beef', 'raw_porkchop', 'raw_mutton', 'stick', 
            'diamond', 'iron_ingot', 'gold_ingot', 'copper_ingot', 'titanium_ingot', 'uranium',
            'dark_green_resin', 'green_resin', 'blue_resin', 'red_resin', 'uranium_totem',
            'leather_helmet', 'leather_chestplate', 'leather_leggings', 'leather_boots',
            'uranium_helmet', 'uranium_chestplate', 'uranium_leggings', 'uranium_boots',
            'spawn_zombie', 'spawn_pig', 'spawn_cow', 'spawn_sheep', 'spawn_scorpion', 'spawn_camel', 'spawn_snake', 'spawn_rabbit', 'spawn_mutant_zombie'
        ];
        extraItems.forEach(id => {
            if(!seenItems.has(id)) {
                let type = ItemType.MATERIAL;
                let count = 64;
                if (id.includes('helmet') || id.includes('chestplate') || id.includes('leggings') || id.includes('boots')) {
                    type = ItemType.ARMOR;
                    count = 1;
                } else if (id.includes('spawn_')) {
                    type = ItemType.TOOL;
                    count = 64;
                } else if (FOOD_VALUES[id]) {
                    type = ItemType.FOOD;
                }
                items.push({ id, count, type });
                seenItems.add(id);
            }
        });
        return items;
    }, []);

    const filteredItems = useMemo(() => {
        return allItems.filter(item => {
            const name = ITEM_NAMES[lang][(item.id?.toString() || '')] || (item.id?.toString() || '');
            return name.toLowerCase().includes(searchTerm.toLowerCase());
        });
    }, [allItems, searchTerm, lang]);

    return (
        <div className="fixed right-0 top-0 bottom-0 w-80 bg-gray-900/95 border-l-4 border-red-900 shadow-2xl z-50 flex flex-col p-4 text-white font-mono overflow-y-auto">
            <div className="flex justify-between items-center mb-6 border-b border-gray-700 pb-2">
                <h2 className="text-xl font-bold text-red-400">{t.ADMIN_PANEL}</h2>
                <button onClick={onClose} className="text-gray-400 hover:text-white">X</button>
            </div>

            {/* Toggles */}
            <div className="flex flex-col gap-3 mb-6">
                <label className="flex items-center justify-between bg-gray-800 p-2 rounded border border-gray-700 cursor-pointer">
                    <span>{t.NO_CLIP}</span>
                    <input 
                        type="checkbox" 
                        checked={!!adminState.noClip}
                        onChange={(e) => setAdminState(prev => ({ ...prev, noClip: e.target.checked }))}
                        className="w-5 h-5 accent-red-500"
                    />
                </label>
                <label className="flex items-center justify-between bg-gray-800 p-2 rounded border border-gray-700 cursor-pointer">
                    <span>{t.NIGHT_VISION}</span>
                    <input 
                        type="checkbox" 
                        checked={!!adminState.nightVision}
                        onChange={(e) => setAdminState(prev => ({ ...prev, nightVision: e.target.checked }))}
                        className="w-5 h-5 accent-red-500"
                    />
                </label>
                <label className="flex items-center justify-between bg-gray-800 p-2 rounded border border-gray-700 cursor-pointer">
                    <span>{t.ONE_HIT_BREAK}</span>
                    <input 
                        type="checkbox" 
                        checked={!!adminState.oneHitBreak}
                        onChange={(e) => setAdminState(prev => ({ ...prev, oneHitBreak: e.target.checked }))}
                        className="w-5 h-5 accent-red-500"
                    />
                </label>
            </div>

            {/* Time Control */}
            <div className="mb-4">
                <h3 className="text-gray-400 text-sm mb-2 uppercase tracking-wider">Time</h3>
                <div className="flex gap-2">
                    <button onClick={() => onSetTime('DAY')} className="flex-1 bg-yellow-700 hover:bg-yellow-600 p-2 text-sm rounded">{t.RESET_DAY}</button>
                    <button onClick={() => onSetTime('NIGHT')} className="flex-1 bg-blue-900 hover:bg-blue-800 p-2 text-sm rounded">{t.SKIP_DAY}</button>
                </div>
            </div>

            {/* Weather & Moon Phase */}
            <div className="mb-6 flex flex-col gap-2">
                <h3 className="text-gray-400 text-sm mb-1 uppercase tracking-wider">Environment</h3>
                <div className="flex gap-2 text-sm">
                    <button onClick={() => onChangeMoon('NORMAL')} className="flex-1 bg-gray-700 hover:bg-gray-600 py-1 rounded">Moon</button>
                    <button onClick={() => onChangeMoon('FULL')} className="flex-1 bg-gray-700 hover:bg-gray-600 py-1 rounded">Full Moon</button>
                    <button onClick={() => onChangeMoon('BLOOD')} className="flex-1 bg-gray-700 hover:bg-gray-600 py-1 rounded">Blood Moon</button>
                </div>
                <div className="flex gap-2 text-sm">
                    <button onClick={() => onChangeWeather('CLEAR')} className="flex-1 bg-indigo-900 hover:bg-indigo-800 py-1 rounded">Clear</button>
                    <button onClick={() => onChangeWeather('RAIN')} className="flex-1 bg-indigo-900 hover:bg-indigo-800 py-1 rounded">Rain</button>
                    <button onClick={() => onChangeWeather('HEAVY_RAIN')} className="flex-1 bg-indigo-900 hover:bg-indigo-800 py-1 rounded">Heavy Rain</button>
                    <button onClick={() => onChangeWeather('SNOW')} className="flex-1 bg-indigo-900 hover:bg-indigo-800 py-1 rounded">Snow</button>
                </div>
                <div className="flex flex-col mt-2">
                    <label className="text-xs text-gray-400">Rain Chance: {(adminState.rainChance * 10000).toFixed(0)}x (Default 1x)</label>
                    <input 
                        type="range" 
                        min="0" max="0.005" step="0.0001" 
                        value={adminState.rainChance}
                        onChange={(e) => setAdminState(prev => ({ ...prev, rainChance: parseFloat(e.target.value) }))}
                        className="w-full"
                    />
                </div>
            </div>

            {/* Total Inventory */}
            <div className="flex-1 flex flex-col min-h-0">
                <h3 className="text-gray-400 text-sm mb-2 uppercase tracking-wider">{t.TOTAL_INV}</h3>
                <input 
                    type="text" 
                    placeholder="Search..." 
                    className="w-full bg-black border border-gray-600 p-1 mb-2 text-sm"
                    value={searchTerm || ''}
                    onChange={e => setSearchTerm(e.target.value)}
                />
                <div className="flex-1 overflow-y-auto bg-black/30 p-2 border border-gray-800 grid grid-cols-6 gap-1 content-start">
                    {filteredItems.map((item, idx) => (
                        <div key={idx} onClick={() => onGiveItem(item)} title={ITEM_NAMES[lang][(item.id?.toString() || '')]}>
                            <AdminItemIcon id={item.id} type={item.type} />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
