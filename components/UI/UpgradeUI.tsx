
import React, { useState, useEffect, useMemo } from 'react';
import { ItemStack, BlockType, ItemType } from '../../types';
import { TRANSLATIONS, ITEM_NAMES, BLOCK_COLORS } from '../../constants';
import { ItemIcon } from './Inventory';

interface UpgradeUIProps {
  onClose: () => void;
  playerInv: (ItemStack | null)[];
  onPlayerSlotClick: (index: number) => void;
  selectedSlot: number;
  lang: 'EN' | 'PT';
  onUpgrade: (item1: ItemStack, item2: ItemStack) => ItemStack | null; // Deprecated, kept for compat
  onReturnItem: (item: ItemStack) => void;
}

export const UpgradeUI: React.FC<UpgradeUIProps> = ({ 
    onClose, playerInv, onPlayerSlotClick, selectedSlot, lang, onReturnItem
}) => {
  const [slot1, setSlot1] = useState<ItemStack | null>(null);
  const [slot2, setSlot2] = useState<ItemStack | null>(null);
  const t = TRANSLATIONS[lang];

  // Return items if component unmounts without proper closing (safety)
  useEffect(() => {
      return () => {
          // Cleanup handled manually in handleClose, this is just a react safety net
      }
  }, []); 

  const handleClose = () => {
      // Return any items currently in the input slots to the player's inventory
      if (slot1) { onReturnItem(slot1); setSlot1(null); }
      if (slot2) { onReturnItem(slot2); setSlot2(null); }
      onClose();
  };

  // Move item from Player Inventory to Upgrade Bench
  const handlePlayerClick = (index: number) => {
      const item = playerInv[index];
      if (!item) return;

      if (!slot1) {
          // Logic: Only take 1 item if it's a stackable material, or the whole tool if it's unique
          // To prevent duplication bugs, we act strictly:
          // If it's a Tool/Armor, take the item.
          // If it's a material (like Uranium Ore), take the whole stack for convenience (we will only consume 1 later).
          
          setSlot1({ ...item }); 
          onPlayerSlotClick(index); // Removes from inventory
      } else if (!slot2) {
          setSlot2({ ...item });
          onPlayerSlotClick(index); // Removes from inventory
      }
  };

  // Move item from Bench back to Player
  const returnSlot1 = () => {
      if(slot1) { onReturnItem(slot1); setSlot1(null); }
  };

  const returnSlot2 = () => {
      if(slot2) { onReturnItem(slot2); setSlot2(null); }
  };

  // Calculate the Result (Preview) based on inputs
  const resultItem = useMemo(() => {
      if (!slot1 || !slot2) return null;

      const s1 = slot1;
      const s2 = slot2;
      const currentLevel = s1.meta?.level || 0;

      // 1. Block Shovels (if intended by game design)
      if (s1.id.toString().includes('shovel')) return null;

      // 2. Titanium -> Uranium Upgrade
      // Logic: Titanium Item + Uranium Ore
      if (s1.id.toString().includes('titanium') && s2.id === BlockType.URANIUM_ORE) {
          const newItemId = s1.id.toString().replace('titanium', 'uranium');
          return {
              ...s1,
              id: newItemId,
              count: 1, 
              meta: { ...s1.meta } // Preserve level
          };
      } 
      
      // 3. Level Up (Item + Duplicate Item)
      // Logic: Iron Pickaxe + Iron Pickaxe = Iron Pickaxe Lvl +1
      if (s1.id === s2.id) {
          // Limit to Level 3
          if (currentLevel >= 3) return null;

          // Tools/Armor/Weapons only
          const isGear = s1.type === ItemType.TOOL || s1.type === ItemType.ARMOR || s1.type === ItemType.SHIELD;
          if (!isGear) return null;

          return {
              ...s1,
              count: 1,
              meta: {
                  ...s1.meta,
                  level: currentLevel + 1,
                  damage: 0 // Repair fully on upgrade
              }
          };
      }

      return null;
  }, [slot1, slot2]);

  const handleTakeResult = () => {
      if (!resultItem || !slot1 || !slot2) return;

      // 1. Give Result to Player
      onReturnItem(resultItem);

      // 2. Consume Inputs
      
      // Slot 1 (Base Item): Always consume 1 (or the whole thing if it's a tool)
      if (slot1.count > 1) {
          setSlot1(prev => prev ? { ...prev, count: prev.count - 1 } : null);
      } else {
          setSlot1(null);
      }

      // Slot 2 (Material): Consume 1
      if (slot2.count > 1) {
          setSlot2(prev => prev ? { ...prev, count: prev.count - 1 } : null);
      } else {
          setSlot2(null);
      }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={(e) => {
        if(e.target === e.currentTarget) handleClose();
    }}>
      <div className="bg-gray-800 border-4 border-gray-600 rounded-lg p-6 w-[600px] shadow-2xl flex flex-col gap-4 text-white font-mono select-none relative">
        <button onClick={handleClose} className="absolute top-2 right-2 text-red-400 font-bold hover:text-red-300 text-xl">X</button>
        <h2 className="text-xl font-bold text-center border-b border-gray-600 pb-2 text-gray-300">{t.UPGRADE_BENCH}</h2>
        
        <div className="text-xs text-gray-500 text-center mb-4">
            {lang === 'PT' ? 'Combine itens para melhorar Nível ou Tier' : 'Combine items to upgrade Level or Tier'}
        </div>

        {/* WORKBENCH UI LAYOUT */}
        <div className="flex items-center justify-between bg-gray-900 p-8 rounded-lg border border-gray-700 relative">
            
            {/* INPUT SECTION */}
            <div className="flex gap-4 relative">
                {/* Plus Icon between slots */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-gray-600 text-2xl font-bold pointer-events-none">+</div>

                {/* Slot 1 */}
                <div 
                    className={`w-20 h-20 bg-gray-800 border-2 ${slot1 ? 'border-white' : 'border-gray-600 border-dashed'} flex items-center justify-center cursor-pointer hover:bg-gray-700 transition-colors relative`} 
                    onClick={returnSlot1}
                    title={lang === 'PT' ? "Item Base" : "Base Item"}
                >
                    <ItemIcon item={slot1} />
                    {!slot1 && <span className="absolute text-4xl text-gray-700 opacity-50">🛡️</span>}
                </div>

                {/* Slot 2 */}
                <div 
                    className={`w-20 h-20 bg-gray-800 border-2 ${slot2 ? 'border-white' : 'border-gray-600 border-dashed'} flex items-center justify-center cursor-pointer hover:bg-gray-700 transition-colors relative`} 
                    onClick={returnSlot2}
                    title={lang === 'PT' ? "Material de Melhoria" : "Upgrade Material"}
                >
                    <ItemIcon item={slot2} />
                    {!slot2 && <span className="absolute text-4xl text-gray-700 opacity-50">🧪</span>}
                </div>
            </div>

            {/* ARROW */}
            <div className={`text-4xl ${resultItem ? 'text-green-500 animate-pulse' : 'text-gray-700'}`}>
                →
            </div>

            {/* OUTPUT SECTION */}
            <div 
                className={`w-24 h-24 border-4 flex items-center justify-center relative transition-all duration-200 
                    ${resultItem 
                        ? 'bg-gray-800 border-green-500 cursor-pointer hover:bg-gray-700 hover:scale-105 shadow-[0_0_15px_rgba(34,197,94,0.5)]' 
                        : 'bg-gray-900 border-gray-700 cursor-not-allowed opacity-50'
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

        {/* Player Inventory */}
        <div className="mt-4 bg-black/30 p-3 rounded border border-gray-700">
            <div className="text-xs text-gray-400 mb-2 font-bold uppercase tracking-wider">{t.INVENTORY}</div>
            <div className="grid grid-cols-10 gap-1 max-h-40 overflow-y-auto pr-1">
                {playerInv.map((item, i) => (
                    <div 
                        key={i} 
                        className={`w-10 h-10 bg-gray-900 border ${selectedSlot === i ? 'border-yellow-500' : 'border-gray-700'} cursor-pointer hover:border-white transition-colors`}
                        onClick={() => handlePlayerClick(i)}
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
