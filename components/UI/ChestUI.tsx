
import React from 'react';
import { ItemStack, ItemType } from '../../types';
import { BLOCK_COLORS, ITEM_COLORS, ITEM_ICONS } from '../../constants';

interface ChestUIProps {
  slots: number;
  contents: (ItemStack | null)[];
  onClose: () => void;
  onSlotClick: (index: number) => void;
  playerInv: (ItemStack | null)[];
  onPlayerSlotClick: (index: number) => void;
  selectedSlot: number;
}

const ItemIcon: React.FC<{ item: ItemStack | null }> = ({ item }) => {
  if (!item) return <div className="w-full h-full" />;
  
  let bg = 'transparent';
  let char = '';
  if (item.type === ItemType.BLOCK) {
     bg = BLOCK_COLORS[item.id as number] || '#ccc';
  } else {
     bg = ITEM_COLORS[item.id as string] || '#aaa';
     const idStr = item.id.toString();
     for (const key in ITEM_ICONS) {
         if (idStr.includes(key)) {
             char = ITEM_ICONS[key];
             break;
         }
     }
  }

  return (
    <div className="w-full h-full flex items-center justify-center relative border border-black/20 select-none" style={{ backgroundColor: item.type === ItemType.BLOCK ? bg : 'transparent' }}>
       {item.type !== ItemType.BLOCK && (
           <span className="text-xl drop-shadow-md" style={{ color: bg }}>{char}</span>
       )}
      {item.count > 1 && (
        <span className="absolute bottom-0 right-0 text-xs font-bold text-white drop-shadow-md px-1">
          {item.count}
        </span>
      )}
    </div>
  );
};

export const ChestUI: React.FC<ChestUIProps> = ({ 
  slots, contents, onClose, onSlotClick, playerInv, onPlayerSlotClick, selectedSlot
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={(e) => {
        if(e.target === e.currentTarget) onClose();
    }}>
      <div className="bg-amber-900/90 border-4 border-amber-700 rounded-lg p-4 shadow-2xl flex flex-col gap-4 text-white font-mono select-none" 
           style={{ width: slots > 50 ? '800px' : (slots > 20 ? '600px' : '400px') }}>
        <div className="flex justify-between items-center border-b border-amber-700 pb-2">
            <h2 className="text-xl font-bold text-amber-100">Chest ({slots})</h2>
            <button onClick={onClose} className="text-red-400 hover:text-red-300 font-bold">X</button>
        </div>

        <div className="bg-amber-950/50 p-2 rounded-lg max-h-[50vh] overflow-y-auto">
            <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${slots > 50 ? 10 : (slots > 20 ? 10 : 5)}, 1fr)` }}>
                {contents.map((item, i) => (
                    <div 
                        key={i} 
                        className="w-10 h-10 bg-amber-950 border border-amber-800 hover:border-amber-500 cursor-pointer"
                        onClick={() => onSlotClick(i)}
                    >
                         <ItemIcon item={item} />
                    </div>
                ))}
            </div>
        </div>

        {/* Player Inventory */}
        <div className="mt-2 bg-gray-800/80 p-2 rounded">
            <div className="text-xs text-gray-400 mb-1">Inventory</div>
            <div className="grid grid-cols-9 gap-1">
                {playerInv.slice(0, 36).map((item, i) => (
                    <div 
                        key={i} 
                        className={`w-8 h-8 bg-gray-900 border ${selectedSlot === i ? 'border-yellow-500' : 'border-gray-700'} cursor-pointer hover:border-white`}
                        onClick={() => onPlayerSlotClick(i)}
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
