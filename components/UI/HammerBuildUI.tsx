
import React from 'react';
import { BlockType, ItemStack, ItemType } from '../../types';
import { BLOCK_COLORS, TRANSLATIONS, ITEM_NAMES } from '../../constants';

interface HammerBuildUIProps {
  onClose: () => void;
  onSelectBuild: (blockType: BlockType) => void;
  lang: 'EN' | 'PT';
  playerInv: (ItemStack | null)[];
}

interface BuildOption {
    type: BlockType;
    req: { id: BlockType, count: number };
}

export const HammerBuildUI: React.FC<HammerBuildUIProps> = ({ onClose, onSelectBuild, lang, playerInv }) => {
  const t = TRANSLATIONS[lang];
  
  const options: BuildOption[] = [
      { type: BlockType.ROOF_WOOD, req: { id: BlockType.PLANKS, count: 1 } },
      { type: BlockType.ROOF_WOOD_LEFT, req: { id: BlockType.PLANKS, count: 1 } },
      { type: BlockType.ROOF_STONE, req: { id: BlockType.STONE, count: 1 } },
      { type: BlockType.ROOF_STONE_LEFT, req: { id: BlockType.STONE, count: 1 } },
      { type: BlockType.WALL_WOOD, req: { id: BlockType.PLANKS, count: 1 } },
  ];

  const hasMaterials = (req: { id: BlockType, count: number }) => {
      let count = 0;
      for(const item of playerInv) {
          if (item && item.id === req.id) count += item.count;
      }
      return count >= req.count;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={(e) => {
        if(e.target === e.currentTarget) onClose();
    }}>
      <div className="bg-slate-800 border-4 border-slate-600 rounded-lg p-6 w-96 shadow-2xl flex flex-col gap-4 text-white font-mono select-none relative">
        <button onClick={onClose} className="absolute top-2 right-2 text-red-400 font-bold hover:text-red-300 text-xl">X</button>
        <h2 className="text-xl font-bold text-center border-b border-slate-600 pb-2">{t.BUILD_MENU}</h2>
        
        <div className="flex flex-col gap-2 max-h-[60vh] overflow-y-auto pr-2">
            {options.map((opt) => {
                const canBuild = hasMaterials(opt.req);
                const name = ITEM_NAMES[lang][opt.type] || "Structure";
                const reqName = ITEM_NAMES[lang][opt.req.id];
                
                return (
                    <button 
                        key={opt.type}
                        disabled={!canBuild}
                        onClick={() => onSelectBuild(opt.type)}
                        className={`flex items-center justify-between p-3 rounded border-2 transition-colors ${canBuild ? 'bg-slate-700 border-slate-500 hover:bg-slate-600 hover:border-white' : 'bg-slate-900 border-red-900 opacity-50 cursor-not-allowed'}`}
                    >
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 border border-black/30" style={{ backgroundColor: BLOCK_COLORS[opt.type] }}>
                                {(opt.type === BlockType.ROOF_WOOD || opt.type === BlockType.ROOF_STONE) && (
                                    <div className="w-full h-full" style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)', backgroundColor: 'rgba(255,255,255,0.3)' }}></div>
                                )}
                                {(opt.type === BlockType.ROOF_WOOD_LEFT || opt.type === BlockType.ROOF_STONE_LEFT) && (
                                    <div className="w-full h-full" style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)', backgroundColor: 'rgba(255,255,255,0.3)' }}></div>
                                )}
                            </div>
                            <span className="font-bold text-sm text-left">{name}</span>
                        </div>
                        <div className="text-xs text-gray-400 flex flex-col items-end min-w-[60px]">
                            <span>{t.REQ}</span>
                            <span className={canBuild ? 'text-green-400' : 'text-red-400'}>{opt.req.count}x {reqName}</span>
                        </div>
                    </button>
                )
            })}
        </div>
      </div>
    </div>
  );
};
