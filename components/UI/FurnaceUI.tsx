import React from 'react';
import { ItemStack, ItemType } from '../../types';
import { BLOCK_COLORS, ITEM_COLORS } from '../../constants';

interface FurnaceUIProps {
  input: ItemStack | null;
  fuel: ItemStack | null;
  output: ItemStack | null;
  progress: number; // 0 to 1
  burnProgress: number; // 0 to 1 (1 is full flame)
  onClose: () => void;
  onSlotClick: (slot: 'input' | 'fuel' | 'output') => void;
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
     // Simple chars
     const idStr = (item.id?.toString() || '');
     if(idStr.includes('beef') || idStr.includes('steak')) char = '🥩';
     else if(idStr.includes('pork')) char = '🥓';
     else if(idStr.includes('mutton')) char = '🍖';
     else if(idStr.includes('pick')) char = '⛏️';
     else if(idStr.includes('sword')) char = '⚔️';
     
     if (!char) char = idStr.substring(0, 1).toUpperCase();
  }

  return (
    <div className="w-full h-full flex items-center justify-center relative border border-black/20" style={{ backgroundColor: item.type === ItemType.BLOCK ? bg : 'transparent' }}>
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

export const FurnaceUI: React.FC<FurnaceUIProps> = ({ 
  input, fuel, output, progress, burnProgress, onClose, onSlotClick, playerInv, onPlayerSlotClick, selectedSlot
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={(e) => {
        if(e.target === e.currentTarget) onClose();
    }}>
      <div className="bg-gray-800 border-4 border-gray-600 rounded-lg p-4 w-96 shadow-2xl flex flex-col gap-4 text-white font-mono select-none">
        <div className="flex justify-between items-center border-b border-gray-600 pb-2">
            <h2 className="text-xl font-bold">Furnace</h2>
            <button onClick={onClose} className="text-red-400 hover:text-red-300 font-bold">X</button>
        </div>

        <div className="flex justify-center items-center gap-4 py-4 bg-gray-700 rounded-lg">
            <div className="flex flex-col gap-2">
                <div 
                    className="w-12 h-12 bg-gray-900 border-2 border-gray-500 hover:border-white cursor-pointer"
                    onClick={() => onSlotClick('input')}
                >
                    <ItemIcon item={input} />
                </div>
                
                {/* Flame Icon / Fuel Status */}
                <div className="w-12 h-12 flex items-center justify-center">
                    <div className="w-6 h-6 relative bg-gray-900/50 rounded-full overflow-hidden">
                        {burnProgress > 0 && (
                             <div className="absolute bottom-0 left-0 w-full bg-orange-500 transition-all duration-200" style={{ height: `${burnProgress * 100}%` }}></div>
                        )}
                        <span className="absolute inset-0 flex items-center justify-center text-xs">🔥</span>
                    </div>
                </div>

                <div 
                    className="w-12 h-12 bg-gray-900 border-2 border-gray-500 hover:border-white cursor-pointer"
                    onClick={() => onSlotClick('fuel')}
                >
                    <ItemIcon item={fuel} />
                </div>
            </div>

            {/* Progress Arrow */}
            <div className="w-16 h-8 bg-gray-900 relative rounded">
                 <div className="h-full bg-white transition-all duration-200" style={{ width: `${progress * 100}%`, opacity: 0.5 }}></div>
                 <div className="absolute inset-0 flex items-center justify-center">→</div>
            </div>

            <div 
                className="w-16 h-16 bg-gray-900 border-2 border-gray-500 hover:border-white cursor-pointer"
                onClick={() => onSlotClick('output')}
            >
                <ItemIcon item={output} />
            </div>
        </div>

        {/* Mini Player Inventory */}
        <div className="mt-2">
            <div className="text-xs text-gray-400 mb-1">Inventory</div>
            <div className="grid grid-cols-9 gap-1">
                {playerInv.slice(0, 9).map((item, i) => (
                    <div 
                        key={i} 
                        className={`w-8 h-8 bg-gray-900 border ${selectedSlot === i ? 'border-yellow-500' : 'border-gray-700'} cursor-pointer`}
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