
import React, { useMemo, useState, useEffect } from 'react';
import { BlockType, ItemStack, ItemType, CraftingRecipe, Equipment, RecipeCategory, PlayerStats } from '../../types';
import { BLOCK_COLORS, RECIPES, ITEM_COLORS, TRANSLATIONS, ITEM_ICONS, ITEM_NAMES, MAX_DURABILITY, HIDDEN_CREATIVE_BLOCKS, FOOD_VALUES } from '../../constants';

interface InventoryProps {
  items: (ItemStack | null)[];
  isOpen: boolean;
  onClose: () => void;
  onSelectSlot: (index: number) => void;
  selectedSlot: number;
  onCraft: (recipe: CraftingRecipe) => void;
  nearbyStation: BlockType | 'NONE';
  // Drag & Drop
  cursorItem: ItemStack | null;
  onSlotClick: (index: number, button: number) => void; // button: 0 left, 2 right
  mousePos: { x: number, y: number };
  lang: 'EN' | 'PT';
  equipment: Equipment;
  onEquip: (item: ItemStack, slot: keyof Equipment) => void;
  onUnequip: (slot: keyof Equipment) => void;
  // Stats
  stats: PlayerStats;
  skillPoints: number;
  level: number;
  onUpgradeStat: (stat: keyof PlayerStats) => void;
  isMobile?: boolean;
  gameMode?: 'SURVIVAL' | 'GOD' | 'CREATIVE' | 'SPECTATOR';
  onCreativeGive?: (item: ItemStack) => void;
  onDropItem?: (index: number, amount: number) => void;
  onClearInventory?: () => void;
}

export const ItemIcon: React.FC<{ item: ItemStack | null }> = ({ item }) => {
  if (!item) return <div className="w-full h-full pointer-events-none" />;

  if (item.type === ItemType.SHIELD) return <div className="w-full h-full pointer-events-none bg-transparent" />; // Invisible shield in inventory

  let bg = 'transparent';
  let char = '';

  if (item.type === ItemType.BLOCK) {
    bg = BLOCK_COLORS[item.id as number] || '#ccc';
  } else if (item.type === ItemType.TOOL || item.type === ItemType.ARMOR || item.type === ItemType.MATERIAL || item.type === ItemType.FOOD) {
     bg = ITEM_COLORS[item.id as string] || '#888';
     
     const idStr = (item.id?.toString() || '');
     // Match icons
     for (const key in ITEM_ICONS) {
         if (idStr.includes(key)) {
             char = ITEM_ICONS[key];
             break;
         }
     }
     if (!char) {
         char = idStr.substring(0, 1).toUpperCase();
     }
  }
  
  // Calculate Durability
  let durabilityPct = 1;
  let showDurability = false;
  if ((item.type === ItemType.TOOL || item.type === ItemType.ARMOR)) {
       let mat = '';
       if ((item.id?.toString() || '').includes('wood') || (item.id?.toString() || '').includes('basic')) mat = 'wood';
       else if ((item.id?.toString() || '').includes('copper')) mat = 'copper';
       else if ((item.id?.toString() || '').includes('stone')) mat = 'stone';
       else if ((item.id?.toString() || '').includes('iron')) mat = 'iron';
       else if ((item.id?.toString() || '').includes('gold')) mat = 'gold';
       else if ((item.id?.toString() || '').includes('diamond')) mat = 'diamond';
       else if ((item.id?.toString() || '').includes('titanium')) mat = 'titanium';
       else if ((item.id?.toString() || '').includes('uranium')) mat = 'uranium';
       
       const max = MAX_DURABILITY[mat];
       if (max) {
           const damage = item.meta?.damage || 0;
           durabilityPct = Math.max(0, (max - damage) / max);
           showDurability = true;
       }
  }

  // Removed Level Stars logic

  return (
    <div className="w-full h-full flex items-center justify-center relative border border-black/20 pointer-events-none select-none" style={{ backgroundColor: item.type === ItemType.BLOCK ? bg : 'transparent' }}>
       {item.type !== ItemType.BLOCK && (
           <span className="text-xl drop-shadow-md filter drop-shadow-lg" style={{ color: bg, textShadow: '1px 1px 0 #000' }}>{char}</span>
       )}
       {item.id === BlockType.CRAFTING_TABLE && <span className="absolute text-xs opacity-50">🛠️</span>}
       {item.id === BlockType.SCIENCE_BENCH && <span className="absolute text-xs opacity-80">🧪</span>}
       {item.id === BlockType.MEDICAL_BENCH && <span className="absolute text-xs opacity-80">⚕️</span>}
       {item.id === BlockType.BED && <span className="absolute text-xs opacity-50">🛏️</span>}
       {item.id === BlockType.MOSS && <span className="absolute text-xs opacity-50">🌿</span>}
       {item.id === BlockType.VINES && <span className="absolute text-xs opacity-50" style={{ transform: 'rotate(90deg)' }}>🪜</span>}
       {item.id === BlockType.CABLE && <span className="absolute text-xs opacity-50">🔌</span>}
       
      {item.count > 1 && (
        <span className="absolute bottom-0 right-0 text-xs font-bold text-white drop-shadow-md px-1">
          {item.count}
        </span>
      )}
      
      {showDurability && (
          <div className="absolute bottom-1 left-1 right-1 h-1 bg-gray-800">
              <div 
                  className="h-full transition-all duration-300" 
                  style={{ 
                      width: `${durabilityPct * 100}%`,
                      backgroundColor: durabilityPct > 0.5 ? '#2ecc71' : (durabilityPct > 0.2 ? '#f1c40f' : '#e74c3c')
                  }}
              />
          </div>
      )}
    </div>
  );
};

export const Inventory: React.FC<InventoryProps> = ({ 
  items, isOpen, onClose, onSelectSlot, selectedSlot, onCraft, nearbyStation,
  cursorItem, onSlotClick, mousePos, lang, equipment, onEquip, onUnequip, stats, skillPoints, level, onUpgradeStat, isMobile, gameMode, onCreativeGive, onDropItem, onClearInventory
}) => {
  const [activeTab, setActiveTab] = useState<'INVENTORY' | 'CHARACTER' | 'CRAFTING' | 'DECOR' | 'ITEMS' | 'COMBAT' | 'CREATIVE' | 'MEDICAL' | 'SCIENCE'>('INVENTORY');
  const [searchQuery, setSearchQuery] = useState('');
  const [hoveredRecipe, setHoveredRecipe] = useState<CraftingRecipe | null>(null);
  const [hoveredItem, setHoveredItem] = useState<ItemStack | null>(null);
  const [hoveredSlotIndex, setHoveredSlotIndex] = useState<number | null>(null);
  const t = TRANSLATIONS[lang];

  useEffect(() => {
    if (!isOpen) return;

    const getAvailableTabs = () => {
        const tabs = ['INVENTORY', 'CHARACTER', 'CRAFTING'] as ('INVENTORY'|'CHARACTER'|'CRAFTING'|'CREATIVE'|'DECOR'|'ITEMS'|'COMBAT'|'MEDICAL'|'SCIENCE')[];
        
        if (gameMode === 'GOD' || gameMode === 'CREATIVE') tabs.push('CREATIVE');

        if (nearbyStation === BlockType.CRAFTING_TABLE) tabs.push('DECOR', 'ITEMS', 'COMBAT');
        if (nearbyStation === BlockType.MEDICAL_BENCH) tabs.push('MEDICAL');
        if (nearbyStation === BlockType.SCIENCE_BENCH) tabs.push('SCIENCE', 'MEDICAL', 'CRAFTING');
        
        // Remove duplicates if any
        return Array.from(new Set(tabs));
    };

    const handleTabPrev = () => {
        const tabs = getAvailableTabs();
        const currentIndex = tabs.indexOf(activeTab as any);
        if (currentIndex > 0) setActiveTab(tabs[currentIndex - 1]);
        else setActiveTab(tabs[tabs.length - 1]);
    };

    const handleTabNext = () => {
        const tabs = getAvailableTabs();
        const currentIndex = tabs.indexOf(activeTab as any);
        if (currentIndex < tabs.length - 1) setActiveTab(tabs[currentIndex + 1]);
        else setActiveTab(tabs[0]);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
       if (document.activeElement?.tagName === 'INPUT') return;
       if (e.code === 'KeyQ') {
          if (hoveredSlotIndex !== null && items[hoveredSlotIndex] && onDropItem) {
              onDropItem(hoveredSlotIndex, e.ctrlKey ? 64 : 1);
          }
       }
       if (e.code === 'KeyX' && gameMode === 'CREATIVE' && onClearInventory) {
           onClearInventory();
       }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('ui_tab_prev', handleTabPrev);
    window.addEventListener('ui_tab_next', handleTabNext);
    return () => {
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('ui_tab_prev', handleTabPrev);
        window.removeEventListener('ui_tab_next', handleTabNext);
    };
  }, [isOpen, hoveredSlotIndex, items, onDropItem, gameMode, onClearInventory, activeTab, nearbyStation]);

  useEffect(() => {
    if (nearbyStation === BlockType.CRAFTING_TABLE) setActiveTab('DECOR');
    else if (nearbyStation === BlockType.MEDICAL_BENCH) setActiveTab('MEDICAL');
    else if (nearbyStation === BlockType.SCIENCE_BENCH) setActiveTab('SCIENCE');
    else setActiveTab('INVENTORY');
  }, [nearbyStation, isOpen]);

  const getItemName = (id: string | number) => {
      const name = ITEM_NAMES[lang][id] || (id?.toString() || '').replace(/_/g, ' ');
      return name;
  };

  // Creative Mode Items
  const creativeItems = useMemo(() => {
      if (activeTab !== 'CREATIVE') return [];
      
      const allItems: ItemStack[] = [];
      const seen = new Set<string>();

      // Add all Blocks
      Object.values(BlockType).forEach(val => {
          if (typeof val === 'number' && val !== BlockType.AIR && !HIDDEN_CREATIVE_BLOCKS.includes(val)) {
              if (!seen.has((val?.toString() || ''))) {
                  allItems.push({ id: val, count: 1, type: ItemType.BLOCK });
                  seen.add((val?.toString() || ''));
              }
          }
      });

      // Add all Craftable Items
      RECIPES.forEach(r => {
          const id = (r.result.id?.toString() || "");
          if (!seen.has(id)) {
              allItems.push({ ...r.result, count: 1 });
              seen.add(id);
          }
      });

      const extraItems = [
          'carrot', 'potato', 'wheat_seeds', 'cherry', 'raw_beef', 'raw_porkchop', 'raw_mutton', 'stick', 
          'diamond', 'iron_ingot', 'gold_ingot', 'copper_ingot', 'titanium_ingot', 'uranium',
          'dark_green_resin', 'green_resin', 'blue_resin', 'red_resin', 'uranium_totem',
          'leather_helmet', 'leather_chestplate', 'leather_leggings', 'leather_boots',
          'uranium_helmet', 'uranium_chestplate', 'uranium_leggings', 'uranium_boots',
          'spawn_zombie', 'spawn_pig', 'spawn_cow', 'spawn_sheep', 'spawn_chicken', 'spawn_scorpion', 'spawn_camel', 'spawn_snake', 'spawn_rabbit', 'spawn_mutant_zombie', 'spawn_polar_bear', 'spawn_dog', 'spawn_npc', 'spawn_zombie_runner', 'spawn_zombie_tank', 'spawn_zombie_explosive', 'spawn_zombie_toxic', 'spawn_zombie_skeleton', 'spawn_zombie_infector', 'spawn_zombie_dark', 'spawn_zombie_frozen', 'spawn_zombie_king', 'spawn_plague_king', 'spawn_bush_mob', 'spawn_spider', 'spawn_blood_zombie', 'spawn_bird', 'spawn_golden_deer', 'spawn_lunar_fox', 'spawn_shark'
      ];
      extraItems.forEach(id => {
          if(!seen.has(id)) {
              let type = ItemType.MATERIAL;
              if (id.includes('helmet') || id.includes('chestplate') || id.includes('leggings') || id.includes('boots')) {
                  type = ItemType.ARMOR;
              } else if (id.includes('spawn_')) {
                  type = ItemType.TOOL;
              } else if (FOOD_VALUES[id]) {
                  type = ItemType.FOOD;
              }
              allItems.push({ id, count: 1, type });
              seen.add(id);
          }
      });

      if (searchQuery) {
          return allItems.filter(item => getItemName(item.id).toLowerCase().includes(searchQuery.toLowerCase()));
      }
      return allItems;
  }, [activeTab, searchQuery, lang]);

  // Filter recipes based on station and tab
  const availableRecipes = useMemo(() => {
    if (activeTab === 'CREATIVE') return []; // Handled separately
    let recipes: CraftingRecipe[] = [];
    if (nearbyStation === BlockType.CRAFTING_TABLE) {
        if (activeTab === 'DECOR') recipes = RECIPES.filter(r => r.category === 'DECOR');
        else if (activeTab === 'ITEMS') recipes = RECIPES.filter(r => r.category === 'ITEMS');
        else if (activeTab === 'COMBAT') recipes = RECIPES.filter(r => r.category === 'COMBAT');
    } else if (nearbyStation === BlockType.MEDICAL_BENCH) {
        if (activeTab === 'MEDICAL') recipes = RECIPES.filter(r => r.station === BlockType.MEDICAL_BENCH);
    } else if (nearbyStation === BlockType.SCIENCE_BENCH) {
        if (activeTab === 'SCIENCE') recipes = RECIPES.filter(r => r.station === BlockType.SCIENCE_BENCH);
        if (activeTab === 'MEDICAL') recipes = RECIPES.filter(r => r.station === BlockType.MEDICAL_BENCH);
        if (activeTab === 'CRAFTING') recipes = RECIPES.filter(r => r.station === 'NONE'); // Allowed to hand-craft
    } else {
        // Hand Crafting
        if (activeTab === 'CRAFTING') recipes = RECIPES.filter(r => r.station === 'NONE');
    }

    if (searchQuery) {
        recipes = recipes.filter(r => {
            const name = getItemName(r.result.id).toLowerCase();
            return name.includes(searchQuery.toLowerCase());
        });
    }

    return recipes;
  }, [nearbyStation, activeTab, searchQuery, lang]);

  const canCraft = (recipe: CraftingRecipe): boolean => {
    for (const ing of recipe.ingredients) {
      const totalCount = items.reduce((acc, item) => {
        if (item && item.id == ing.id) return acc + item.count;
        return acc;
      }, 0);
      if (totalCount < ing.count) return false;
    }
    return true;
  };

  const renderTooltip = () => {
      if (!hoveredItem) return null;
      return (
          <div 
             className="fixed z-50 bg-black/90 border border-white p-3 rounded shadow-xl pointer-events-none text-white w-64"
             style={{ 
                left: isMobile ? '50%' : mousePos.x + 15, 
                top: isMobile ? '20%' : mousePos.y - 100, // Show above for hotbar
                transform: isMobile ? 'translate(-50%, 0)' : 'none'
             }}
          >
             <div className="font-bold text-lg mb-2 text-yellow-400 border-b border-gray-700 pb-1">
                 {getItemName(hoveredItem.id)}
             </div>
             {(hoveredItem.type === ItemType.TOOL || hoveredItem.type === ItemType.ARMOR || hoveredItem.type === ItemType.SHIELD) && (
                 <div className="text-sm text-gray-300">
                     {(() => {
                         let mat = '';
                         const id = (hoveredItem.id?.toString() || '');
                         if (id.includes('wood') || id.includes('basic')) mat = 'wood';
                         else if (id.includes('stone')) mat = 'stone';
                         else if (id.includes('iron')) mat = 'iron';
                         else if (id.includes('gold')) mat = 'gold';
                         else if (id.includes('diamond')) mat = 'diamond';
                         else if (id.includes('titanium')) mat = 'titanium';
                         else if (id.includes('uranium')) mat = 'uranium';
                         else if (id.includes('copper')) mat = 'copper';
                         
                         const max = MAX_DURABILITY[mat] || 100;
                         const current = max - (hoveredItem.meta?.damage || 0);
                         return `${lang === 'PT' ? 'Durabilidade' : 'Durability'}: ${current} / ${max}`;
                     })()}
                 </div>
             )}
          </div>
      );
  };

  if (!isOpen) {
    // Render only Hotbar
    return (
      <>
          <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 flex gap-1 bg-black/50 p-2 rounded-lg pointer-events-auto z-50">
            {items.slice(0, 9).map((item, i) => (
              <div 
                key={i}
                className={`w-10 h-10 sm:w-12 sm:h-12 border-2 cursor-pointer transition-colors bg-gray-800/80 ${selectedSlot === i ? 'border-yellow-400' : 'border-gray-600 hover:border-gray-400'}`}
                onMouseDown={() => onSelectSlot(i)}
                onMouseEnter={() => setHoveredItem(item)}
                onMouseLeave={() => setHoveredItem(null)}
                onTouchStart={() => onSelectSlot(i)}
                onContextMenu={(e) => e.preventDefault()}
              >
                <ItemIcon item={item} />
                <span className="absolute top-0 left-0 text-[10px] text-gray-400 pl-1">{i + 1}</span>
              </div>
            ))}
          </div>
          {renderTooltip()}
      </>
    );
  }

  const isTable = nearbyStation === BlockType.CRAFTING_TABLE || nearbyStation === BlockType.MEDICAL_BENCH || nearbyStation === BlockType.SCIENCE_BENCH;

  return (
    <>
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={(e) => {
          if(e.target === e.currentTarget) onClose();
      }}>
        <div className="bg-gray-800 border-4 border-gray-600 rounded-lg p-4 w-11/12 max-w-2xl shadow-2xl flex flex-col gap-4 text-white font-mono h-[80vh] relative">
          <div className="flex flex-col gap-2 border-b border-gray-600 pb-2">
              <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold">{isTable ? (lang === 'PT' ? 'Bancada' : 'Workbench') : t.MENU}</h2>
                  <div className="flex items-center gap-4">
                      {gameMode === 'CREATIVE' && (
                          <button onClick={onClearInventory} className="text-sm bg-red-600 hover:bg-red-500 text-white px-2 py-1 rounded" title={lang === 'PT' ? 'Limpar Inventário (X)' : 'Clear Inventory (X)'}>
                              {lang === 'PT' ? 'Limpar Inv.' : 'Clear Inv.'} [X]
                          </button>
                      )}
                      <button onClick={onClose} className="text-red-400 hover:text-red-300 font-bold text-xl">X</button>
                  </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-2 justify-between">
                  <div className="flex gap-2 flex-wrap">
                          <>
                            <button onClick={() => setActiveTab('INVENTORY')} className={`px-3 py-1 rounded ${activeTab === 'INVENTORY' ? 'bg-blue-600' : 'bg-gray-700'}`}>{t.INVENTORY}</button>
                            <button onClick={() => setActiveTab('CHARACTER')} className={`px-3 py-1 rounded ${activeTab === 'CHARACTER' ? 'bg-purple-600' : 'bg-gray-700'}`}>{t.CHARACTER}</button>
                            <button onClick={() => setActiveTab('CRAFTING')} className={`px-3 py-1 rounded ${activeTab === 'CRAFTING' ? 'bg-green-600' : 'bg-gray-700'}`}>{t.CRAFTING}</button>
                            {gameMode === 'GOD' || gameMode === 'CREATIVE' ? (
                                <button onClick={() => setActiveTab('CREATIVE')} className={`px-3 py-1 rounded ${activeTab === 'CREATIVE' ? 'bg-yellow-600' : 'bg-gray-700'}`}>CREATIVE</button>
                            ) : null}
                          </>
                      {nearbyStation === BlockType.CRAFTING_TABLE && (
                          <>
                            <button onClick={() => setActiveTab('DECOR')} className={`px-3 py-1 rounded ${activeTab === 'DECOR' ? 'bg-orange-600' : 'bg-gray-700'}`}>{t.DECOR}</button>
                            <button onClick={() => setActiveTab('ITEMS')} className={`px-3 py-1 rounded ${activeTab === 'ITEMS' ? 'bg-teal-600' : 'bg-gray-700'}`}>{t.ITEMS}</button>
                            <button onClick={() => setActiveTab('COMBAT')} className={`px-3 py-1 rounded ${activeTab === 'COMBAT' ? 'bg-red-600' : 'bg-gray-700'}`}>{t.COMBAT}</button>
                          </>
                      )}
                      {nearbyStation === BlockType.MEDICAL_BENCH && (
                          <button onClick={() => setActiveTab('MEDICAL')} className={`px-3 py-1 rounded ${activeTab === 'MEDICAL' ? 'bg-red-500' : 'bg-gray-700'}`}>{lang === 'PT' ? 'Médico' : 'Medical'}</button>
                      )}
                      {nearbyStation === BlockType.SCIENCE_BENCH && (
                          <>
                              <button onClick={() => setActiveTab('SCIENCE')} className={`px-3 py-1 rounded ${activeTab === 'SCIENCE' ? 'bg-teal-500' : 'bg-gray-700'}`}>{lang === 'PT' ? 'Ciência' : 'Science'}</button>
                              <button onClick={() => setActiveTab('MEDICAL')} className={`px-3 py-1 rounded ${activeTab === 'MEDICAL' ? 'bg-red-500' : 'bg-gray-700'}`}>{lang === 'PT' ? 'Médico' : 'Medical'}</button>
                          </>
                      )}
                  </div>
                  
                  {/* Search Bar */}
                  {(activeTab === 'CRAFTING' || activeTab === 'CREATIVE' || isTable || nearbyStation === BlockType.SCIENCE_BENCH || nearbyStation === BlockType.MEDICAL_BENCH) && (
                      <input 
                        type="text" 
                        placeholder={t.SEARCH}
                        value={searchQuery || ''}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-gray-900 border border-gray-600 text-white px-2 py-1 rounded text-sm w-full sm:w-40"
                      />
                  )}
              </div>
          </div>

          <div className="flex-1 overflow-y-auto">
              {activeTab === 'INVENTORY' && (
                  <div className="flex flex-col gap-2">
                      <div className="grid grid-cols-9 gap-2">
                          {items.slice(0, 36).map((item, i) => (
                              <div 
                                  key={i} 
                                  className={`aspect-square bg-gray-900 border-2 ${selectedSlot === i ? 'border-yellow-500' : 'border-gray-700'} relative cursor-pointer hover:bg-gray-800`}
                                  onMouseDown={(e) => onSlotClick(i, e.button)}
                                  onMouseEnter={() => { setHoveredItem(item); setHoveredSlotIndex(i); }}
                                  onMouseLeave={() => { setHoveredItem(null); setHoveredSlotIndex(null); }}
                                  onTouchStart={() => {
                                      // Mobile tap logic: if cursor is empty, pick up. If cursor has item, place.
                                      // If already selected/highlighted, maybe show split option?
                                      // For now, simpler: Just treat as left click.
                                      // To support split on mobile, we can add a dedicated UI button.
                                      onSlotClick(i, 0);
                                  }}
                                  onContextMenu={(e) => e.preventDefault()}
                              >
                                  <ItemIcon item={item} />
                                  {i < 9 && <div className="absolute top-0 left-1 text-[10px] text-gray-500">#{i+1}</div>}
                              </div>
                          ))}
                      </div>
                      
                      {/* Mobile Split Helper */}
                      {isMobile && cursorItem && (
                          <div className="flex gap-2 justify-center mt-4">
                              <button 
                                  className="bg-yellow-600 text-white p-2 rounded font-bold"
                                  onClick={() => {
                                      // Simulate right click on same slot to drop 1 back? 
                                      // Or just a specific split action?
                                      // Implementation detail: For now, maybe just "Place 1" logic helper
                                  }}
                              >
                                  Tap slot to Place All
                              </button>
                              <div className="text-xs text-gray-400">Use "Split" button below to take half</div>
                          </div>
                      )}
                  </div>
              )}

              {activeTab === 'CHARACTER' && (
                  <div className="flex flex-col gap-6 p-4">
                      {/* Top Section: Equip & Preview */}
                      <div className="flex gap-8 justify-center items-start">
                          {/* Character Preview */}
                          <div className="w-32 h-64 bg-black/40 border border-gray-600 relative flex flex-col items-center justify-center">
                              <div className="w-20 h-20 bg-blue-500 mb-1 rounded-sm relative">
                                  {equipment.helmet && <div className="absolute inset-0 bg-gray-400 opacity-50 border-4 border-yellow-400" />}
                              </div> 
                              <div className="w-20 h-24 bg-blue-600 mb-1 relative">
                                  {equipment.chestplate && <div className="absolute inset-0 bg-gray-400 opacity-50 border-4 border-yellow-400" />}
                              </div>
                              <div className="w-20 h-20 bg-blue-700 relative flex gap-1">
                                   <div className="w-1/2 h-full bg-blue-800 relative">
                                      {equipment.leggings && <div className="absolute inset-0 bg-gray-400 opacity-50 border-4 border-yellow-400" />}
                                   </div>
                                   <div className="w-1/2 h-full bg-blue-800 relative">
                                      {equipment.leggings && <div className="absolute inset-0 bg-gray-400 opacity-50 border-4 border-yellow-400" />}
                                   </div>
                              </div>
                          </div>

                          {/* Equipment Slots */}
                          <div className="flex flex-col gap-4">
                              <div className="flex items-center gap-4">
                                  <div className="w-12 h-12 bg-gray-900 border border-gray-600 flex items-center justify-center cursor-pointer hover:border-yellow-400" onClick={() => equipment.helmet && onEquip(equipment.helmet, 'helmet')} title={equipment.helmet ? getItemName(equipment.helmet.id) : ''}>
                                      <ItemIcon item={equipment.helmet} />
                                  </div>
                                  <span>{lang === 'PT' ? 'Capacete' : 'Helmet'}</span>
                                  {equipment.helmet && <button onClick={() => onUnequip('helmet')} className="text-red-500 font-bold ml-2">X</button>}
                              </div>
                              <div className="flex items-center gap-4">
                                  <div className="w-12 h-12 bg-gray-900 border border-gray-600 flex items-center justify-center cursor-pointer hover:border-yellow-400" onClick={() => equipment.chestplate && onEquip(equipment.chestplate, 'chestplate')} title={equipment.chestplate ? getItemName(equipment.chestplate.id) : ''}>
                                      <ItemIcon item={equipment.chestplate} />
                                  </div>
                                  <span>{lang === 'PT' ? 'Peitoral' : 'Chestplate'}</span>
                                  {equipment.chestplate && <button onClick={() => onUnequip('chestplate')} className="text-red-500 font-bold ml-2">X</button>}
                              </div>
                              <div className="flex items-center gap-4">
                                  <div className="w-12 h-12 bg-gray-900 border border-gray-600 flex items-center justify-center cursor-pointer hover:border-yellow-400" onClick={() => equipment.leggings && onEquip(equipment.leggings, 'leggings')} title={equipment.leggings ? getItemName(equipment.leggings.id) : ''}>
                                      <ItemIcon item={equipment.leggings} />
                                  </div>
                                  <span>{lang === 'PT' ? 'Calça' : 'Leggings'}</span>
                                  {equipment.leggings && <button onClick={() => onUnequip('leggings')} className="text-red-500 font-bold ml-2">X</button>}
                              </div>
                              <div className="flex items-center gap-4">
                                  <div className="w-12 h-12 bg-gray-900 border border-gray-600 flex items-center justify-center cursor-pointer hover:border-yellow-400" onClick={() => equipment.boots && onEquip(equipment.boots, 'boots')} title={equipment.boots ? getItemName(equipment.boots.id) : ''}>
                                      <ItemIcon item={equipment.boots} />
                                  </div>
                                  <span>{lang === 'PT' ? 'Botas' : 'Boots'}</span>
                                  {equipment.boots && <button onClick={() => onUnequip('boots')} className="text-red-500 font-bold ml-2">X</button>}
                              </div>
                               {/* Off-Hand Slot */}
                              <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-600">
                                  <div className="w-12 h-12 bg-gray-800 border-2 border-dashed border-gray-500 flex items-center justify-center cursor-pointer hover:border-yellow-400" onClick={() => equipment.offHand && onEquip(equipment.offHand, 'offHand')} title={equipment.offHand ? getItemName(equipment.offHand.id) : ''}>
                                      <ItemIcon item={equipment.offHand} />
                                  </div>
                                  <span className="text-yellow-400 font-bold">{ITEM_NAMES[lang]['offhand']}</span>
                                  {equipment.offHand && <button onClick={() => onUnequip('offHand')} className="text-red-500 font-bold ml-2">X</button>}
                              </div>
                          </div>
                      </div>

                      {/* STATS SECTION */}
                      <div className="bg-gray-700/50 p-4 rounded-lg border border-gray-600">
                          <div className="flex justify-between items-center mb-4 border-b border-gray-500 pb-2">
                              <h3 className="text-lg font-bold text-blue-300">{t.LEVEL} {level}</h3>
                              <div className="text-yellow-400 font-bold">{t.POINTS}: {skillPoints}</div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {[
                                { key: 'strength', label: t.STATS_STRENGTH, icon: '⚔️' },
                                { key: 'reach', label: t.STATS_REACH, icon: '📐' },
                                { key: 'vitality', label: t.STATS_VITALITY, icon: '❤️' },
                                { key: 'metabolism', label: t.STATS_METABOLISM, icon: '🍗' },
                                { key: 'endurance', label: t.STATS_ENDURANCE, icon: '⚡' },
                                { key: 'agility', label: t.STATS_AGILITY, icon: '👟' },
                              ].map((stat) => (
                                  <div key={stat.key} className="flex items-center justify-between bg-gray-800 p-2 rounded">
                                      <div className="flex items-center gap-2">
                                          <span className="text-xl">{stat.icon}</span>
                                          <span>{stat.label}</span>
                                      </div>
                                      <div className="flex items-center gap-3">
                                          <span className="text-blue-300 font-bold">{stats[stat.key as keyof PlayerStats]}</span>
                                          <button 
                                            onClick={() => onUpgradeStat(stat.key as keyof PlayerStats)}
                                            disabled={skillPoints <= 0}
                                            className={`w-6 h-6 flex items-center justify-center rounded font-bold ${skillPoints > 0 ? 'bg-yellow-600 hover:bg-yellow-500 text-white' : 'bg-gray-600 text-gray-400 cursor-not-allowed'}`}
                                          >
                                              +
                                          </button>
                                      </div>
                                  </div>
                              ))}
                          </div>
                      </div>
                  </div>
              )}

              {activeTab === 'CREATIVE' && (
                  <div className="grid grid-cols-9 gap-2 p-2">
                      {creativeItems.map((item, i) => (
                          <div 
                              key={i} 
                              className="aspect-square bg-gray-900 border border-gray-700 relative cursor-pointer hover:bg-gray-800"
                              onClick={() => {
                                  if (onCreativeGive) {
                                      // Give stack of 64
                                      onCreativeGive({ ...item, count: 64 });
                                  }
                              }}
                              onMouseEnter={() => setHoveredItem(item)}
                              onMouseLeave={() => setHoveredItem(null)}
                          >
                              <ItemIcon item={item} />
                          </div>
                      ))}
                  </div>
              )}

              {(activeTab === 'CRAFTING' || activeTab === 'DECOR' || activeTab === 'ITEMS' || activeTab === 'COMBAT' || activeTab === 'MEDICAL' || activeTab === 'SCIENCE') && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {availableRecipes.map((recipe, idx) => {
                          const craftable = canCraft(recipe);
                          return (
                              <div 
                                key={idx} 
                                className={`p-2 border rounded flex items-center justify-between relative group ${craftable ? 'bg-gray-700 border-gray-500' : 'bg-gray-900 border-gray-800 opacity-50'}`}
                                onMouseEnter={() => setHoveredRecipe(recipe)}
                                onMouseLeave={() => setHoveredRecipe(null)}
                                onClick={() => { if(isMobile) setHoveredRecipe(recipe); }} // Mobile tap to see recipe
                              >
                                <div className="flex items-center gap-2">
                                    <div className="w-10 h-10 bg-black/30 rounded border border-gray-600">
                                        <ItemIcon item={{ id: recipe.result.id, count: recipe.result.count, type: recipe.result.type }} />
                                    </div>
                                    <div>
                                        <div className="text-sm font-bold">{getItemName(recipe.result.id)} x{recipe.result.count}</div>
                                    </div>
                                </div>
                                <button 
                                      disabled={!craftable}
                                      onClick={() => onCraft(recipe)}
                                      className={`px-3 py-1 rounded text-sm font-bold ${craftable ? 'bg-green-600 hover:bg-green-500 text-white' : 'bg-gray-600 text-gray-400 cursor-not-allowed'}`}
                                >
                                    {lang === 'PT' ? 'Criar' : 'Craft'}
                                </button>
                              </div>
                          )
                      })}
                      {availableRecipes.length === 0 && <p className="text-gray-500 p-4">{t.NO_RECIPES}</p>}
                  </div>
              )}
          </div>
          
          {/* Mobile Split Button */}
          {isMobile && !cursorItem && selectedSlot !== null && items[selectedSlot] && (
              <div className="border-t border-gray-600 pt-2 flex justify-center">
                  <button 
                      onClick={() => onSlotClick(selectedSlot, 2)} // 2 = Right Click (Split)
                      className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded font-bold"
                  >
                      Split / Take Half
                  </button>
              </div>
          )}
          
          <div className="text-xs text-center text-gray-500 pt-2 border-t border-gray-600">
              {t.HINT_INV}
          </div>

          {/* ITEM TOOLTIP */}
          {hoveredItem && (
              <div 
                 className="fixed z-50 bg-black/90 border border-white p-3 rounded shadow-xl pointer-events-none text-white w-64"
                 style={{ 
                    left: isMobile ? '50%' : mousePos.x + 15, 
                    top: isMobile ? '20%' : mousePos.y + 15,
                    transform: isMobile ? 'translate(-50%, 0)' : 'none'
                 }}
              >
                 <div className="font-bold text-lg mb-2 text-yellow-400 border-b border-gray-700 pb-1">
                     {getItemName(hoveredItem.id)}
                 </div>
                 {(hoveredItem.type === ItemType.TOOL || hoveredItem.type === ItemType.ARMOR || hoveredItem.type === ItemType.SHIELD) && (
                     <div className="text-sm text-gray-300">
                         {(() => {
                             let mat = '';
                             const id = (hoveredItem.id?.toString() || '');
                             if (id.includes('wood') || id.includes('basic')) mat = 'wood';
                             else if (id.includes('stone')) mat = 'stone';
                             else if (id.includes('iron')) mat = 'iron';
                             else if (id.includes('gold')) mat = 'gold';
                             else if (id.includes('diamond')) mat = 'diamond';
                             else if (id.includes('titanium')) mat = 'titanium';
                             else if (id.includes('uranium')) mat = 'uranium';
                             else if (id.includes('copper')) mat = 'copper';
                             
                             const max = MAX_DURABILITY[mat] || 100;
                             const current = max - (hoveredItem.meta?.damage || 0);
                             return `${lang === 'PT' ? 'Durabilidade' : 'Durability'}: ${current} / ${max}`;
                         })()}
                     </div>
                 )}
              </div>
          )}

          {/* RECIPE TOOLTIP */}
          {hoveredRecipe && (
              <div 
                 className="fixed z-50 bg-black/90 border border-white p-3 rounded shadow-xl pointer-events-none text-white w-64"
                 style={{ 
                    left: isMobile ? '50%' : mousePos.x + 15, 
                    top: isMobile ? '20%' : mousePos.y + 15,
                    transform: isMobile ? 'translate(-50%, 0)' : 'none'
                 }}
              >
                 <div className="font-bold text-lg mb-2 text-yellow-400 border-b border-gray-700 pb-1">
                     {getItemName(hoveredRecipe.result.id)}
                 </div>
                 <div className="text-sm text-gray-300 mb-1">{lang === 'PT' ? 'Requer:' : 'Requires:'}</div>
                 <ul className="text-sm">
                     {hoveredRecipe.ingredients.map((ing, i) => (
                         <li key={i} className="flex justify-between">
                             <span>{getItemName(ing.id)}</span>
                             <span className="font-mono font-bold text-gray-400">x{ing.count}</span>
                         </li>
                     ))}
                 </ul>
              </div>
          )}
        </div>
      </div>
      
      {/* Floating Cursor Item */}
      {cursorItem && (
        <div 
          className="fixed w-10 h-10 pointer-events-none z-50"
          style={{ 
            left: mousePos.x, 
            top: mousePos.y, 
            transform: 'translate(-50%, -50%)',
            opacity: 0.9 
          }}
        >
           <ItemIcon item={cursorItem} />
        </div>
      )}
    </>
  );
};
