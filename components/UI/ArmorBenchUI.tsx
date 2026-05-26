
import React, { useState, useMemo } from 'react';
import { BlockType, ItemStack, ItemType, CraftingRecipe } from '../../types';
import { TRANSLATIONS, ITEM_NAMES, RECIPES, BLOCK_COLORS } from '../../constants';
import { ItemIcon } from './Inventory';

interface ArmorBenchUIProps {
  onClose: () => void;
  playerInv: (ItemStack | null)[];
  onPlayerSlotClick: (index: number) => void;
  selectedSlot: number;
  lang: 'EN' | 'PT';
  onReturnItem: (item: ItemStack) => void;
  onCraft: (recipe: CraftingRecipe) => void;
}

export const ArmorBenchUI: React.FC<ArmorBenchUIProps> = ({ 
    onClose, playerInv, onPlayerSlotClick, selectedSlot, lang, onReturnItem, onCraft
}) => {
  const [activeTab, setActiveTab] = useState<'CRAFT' | 'UPGRADE'>('CRAFT');
  const [searchQuery, setSearchQuery] = useState('');
  const [slot1, setSlot1] = useState<ItemStack | null>(null);
  const [slot2, setSlot2] = useState<ItemStack | null>(null);
  const t = TRANSLATIONS[lang];

  // Return upgrade slots items on close
  const handleClose = () => {
      if (slot1) { onReturnItem(slot1); setSlot1(null); }
      if (slot2) { onReturnItem(slot2); setSlot2(null); }
      onClose();
  };

  const getItemName = (id: string | number) => {
      return ITEM_NAMES[lang][id] || id.toString().replace(/_/g, ' ');
  };

  // --- CRAFTING TAB LOGIC ---
  const armorRecipes = useMemo(() => {
      let recipes = RECIPES.filter(r => r.station === BlockType.ARMOR_BENCH);
      if (searchQuery) {
          recipes = recipes.filter(r => getItemName(r.result.id).toLowerCase().includes(searchQuery.toLowerCase()));
      }
      return recipes;
  }, [searchQuery, lang]);

  const canCraft = (recipe: CraftingRecipe): boolean => {
    for (const ing of recipe.ingredients) {
      const totalCount = playerInv.reduce((acc, item) => {
        if (item && item.id == ing.id) return acc + item.count;
        return acc;
      }, 0);
      if (totalCount < ing.count) return false;
    }
    return true;
  };

  // --- UPGRADE TAB LOGIC ---
  
  // Calculate the Result (Titanium Armor + Uranium Ore -> Uranium Armor)
  const resultItem = useMemo(() => {
      if (!slot1 || !slot2) return null;

      const s1 = slot1; // Base (Titanium Armor)
      const s2 = slot2; // Material (Uranium Ore)

      if (s1.type !== ItemType.ARMOR) return null;
      
      const id = s1.id.toString();
      // Logic: Titanium Armor + Uranium Ore
      if (id.includes('titanium') && s2.id === 'uranium') { // 'uranium' is the item drop from ore
          const newItemId = id.replace('titanium', 'uranium');
          return {
              ...s1,
              id: newItemId,
              count: 1, 
              meta: { ...s1.meta, damage: 0 } // Repair on upgrade
          };
      } 

      return null;
  }, [slot1, slot2]);

  const handleTakeResult = () => {
      if (!resultItem || !slot1 || !slot2) return;

      onReturnItem(resultItem);

      // Consume Inputs
      setSlot1(null); // Consume Base Armor
      
      if (slot2.count > 1) {
          setSlot2(prev => prev ? { ...prev, count: prev.count - 1 } : null);
      } else {
          setSlot2(null);
      }
  };

  // Handle player inventory click
  const handlePlayerClick = (index: number) => {
      if (activeTab === 'CRAFT') return; // Do nothing in craft mode, selection happens in inventory logic generally but here we just show recipes

      const item = playerInv[index];
      if (!item) return;

      if (!slot1) {
          if (item.type === ItemType.ARMOR) {
              setSlot1({ ...item }); 
              onPlayerSlotClick(index); 
          }
      } else if (!slot2) {
          if (item.id === 'uranium') {
              setSlot2({ ...item });
              onPlayerSlotClick(index); 
          }
      }
  };

  const returnSlot1 = () => { if(slot1) { onReturnItem(slot1); setSlot1(null); } };
  const returnSlot2 = () => { if(slot2) { onReturnItem(slot2); setSlot2(null); } };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={(e) => {
        if(e.target === e.currentTarget) handleClose();
    }}>
      <div className="bg-slate-800 border-4 border-slate-600 rounded-lg p-6 w-[700px] shadow-2xl flex flex-col gap-4 text-white font-mono select-none relative h-[80vh]">
        <button onClick={handleClose} className="absolute top-2 right-2 text-red-400 font-bold hover:text-red-300 text-xl">X</button>
        <h2 className="text-xl font-bold text-center border-b border-slate-600 pb-2 text-blue-300">{ITEM_NAMES[lang][BlockType.ARMOR_BENCH]}</h2>
        
        <div className="flex gap-2 justify-center mb-2">
            <button 
                onClick={() => setActiveTab('CRAFT')} 
                className={`px-4 py-2 rounded font-bold ${activeTab === 'CRAFT' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-gray-400'}`}
            >
                {ITEM_NAMES[lang].ARMOR_CRAFTING || "Craft Armor"}
            </button>
            <button 
                onClick={() => setActiveTab('UPGRADE')} 
                className={`px-4 py-2 rounded font-bold ${activeTab === 'UPGRADE' ? 'bg-green-600 text-white' : 'bg-slate-700 text-gray-400'}`}
            >
                {ITEM_NAMES[lang].ARMOR_UPGRADE || "Upgrade Armor"}
            </button>
        </div>

        {/* --- CRAFT TAB --- */}
        {activeTab === 'CRAFT' && (
            <div className="flex flex-col flex-1 overflow-hidden">
                <input 
                    type="text" 
                    placeholder={t.SEARCH || "Search..."}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-slate-900 border border-slate-600 text-white px-3 py-2 rounded mb-3 w-full"
                />
                <div className="flex-1 overflow-y-auto pr-2">
                    <div className="grid grid-cols-2 gap-2">
                        {armorRecipes.map((recipe, idx) => {
                            const craftable = canCraft(recipe);
                            return (
                                <div 
                                    key={idx} 
                                    className={`p-2 border rounded flex items-center justify-between relative ${craftable ? 'bg-slate-700 border-slate-500' : 'bg-slate-900 border-slate-800 opacity-50'}`}
                                >
                                    <div className="flex items-center gap-2">
                                        <div className="w-10 h-10 bg-black/30 rounded border border-gray-600">
                                            <ItemIcon item={{ id: recipe.result.id, count: recipe.result.count, type: recipe.result.type }} />
                                        </div>
                                        <div className="flex flex-col">
                                            <div className="text-sm font-bold">{getItemName(recipe.result.id)}</div>
                                            <div className="text-[10px] text-gray-400 flex flex-wrap gap-1">
                                                {recipe.ingredients.map((ing, i) => (
                                                    <span key={i}>{ing.count}x {getItemName(ing.id)}</span>
                                                ))}
                                            </div>
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
                            );
                        })}
                    </div>
                </div>
            </div>
        )}

        {/* --- UPGRADE TAB --- */}
        {activeTab === 'UPGRADE' && (
            <div className="flex-1 flex flex-col items-center justify-center bg-slate-900 rounded border border-slate-700 p-4">
                 <div className="text-sm text-gray-400 mb-6 text-center">
                    {lang === 'PT' 
                        ? "Combine uma peça de Titânio com Urânio para melhorar." 
                        : "Combine a Titanium piece with Uranium to upgrade."}
                </div>

                <div className="flex items-center gap-4 relative mb-8">
                    {/* Slot 1 */}
                    <div 
                        className={`w-24 h-24 bg-slate-800 border-2 ${slot1 ? 'border-white' : 'border-slate-600 border-dashed'} flex items-center justify-center cursor-pointer hover:bg-slate-700 transition-colors relative`} 
                        onClick={returnSlot1}
                        title="Titanium Armor"
                    >
                        <ItemIcon item={slot1} />
                        {!slot1 && <span className="absolute text-4xl text-slate-700 opacity-50">🛡️</span>}
                    </div>

                    <div className="text-2xl font-bold text-gray-500">+</div>

                    {/* Slot 2 */}
                    <div 
                        className={`w-24 h-24 bg-slate-800 border-2 ${slot2 ? 'border-white' : 'border-slate-600 border-dashed'} flex items-center justify-center cursor-pointer hover:bg-slate-700 transition-colors relative`} 
                        onClick={returnSlot2}
                        title="Uranium Ore"
                    >
                        <ItemIcon item={slot2} />
                        {!slot2 && <span className="absolute text-4xl text-slate-700 opacity-50">☢️</span>}
                    </div>

                    <div className={`text-4xl ${resultItem ? 'text-green-500 animate-pulse' : 'text-gray-700'}`}>
                        →
                    </div>

                    {/* Output */}
                    <div 
                        className={`w-24 h-24 border-4 flex items-center justify-center relative transition-all duration-200 
                            ${resultItem 
                                ? 'bg-slate-800 border-green-500 cursor-pointer hover:bg-slate-700 hover:scale-105 shadow-[0_0_15px_rgba(34,197,94,0.5)]' 
                                : 'bg-slate-900 border-slate-700 cursor-not-allowed opacity-50'
                            }`}
                        onClick={handleTakeResult}
                    >
                        {resultItem && (
                            <>
                                <ItemIcon item={resultItem} />
                                <div className="absolute -bottom-8 text-xs font-bold text-green-400 whitespace-nowrap">
                                    {lang === 'PT' ? 'Pegar' : 'Take'}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        )}

        {/* Player Inventory (Visible for both, interactive for upgrade) */}
        <div className="mt-auto bg-black/30 p-3 rounded border border-slate-700">
            <div className="text-xs text-gray-400 mb-2 font-bold uppercase tracking-wider">{t.INVENTORY}</div>
            <div className="grid grid-cols-10 gap-1 max-h-40 overflow-y-auto pr-1">
                {playerInv.map((item, i) => (
                    <div 
                        key={i} 
                        className={`w-10 h-10 bg-slate-900 border ${selectedSlot === i ? 'border-yellow-500' : 'border-slate-700'} ${activeTab === 'UPGRADE' ? 'cursor-pointer hover:border-white' : ''} transition-colors`}
                        onClick={() => activeTab === 'UPGRADE' ? handlePlayerClick(i) : null}
                    >
                         <ItemIcon item={item} />
                    </div>
                ))}
            </div>
        </div>
      </div>
    </div>
  );
};
