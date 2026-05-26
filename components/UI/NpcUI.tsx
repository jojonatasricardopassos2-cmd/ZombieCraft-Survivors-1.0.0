import React from 'react';
import { Entity, ItemStack } from '../../types.ts';
import { QUESTS, ITEM_NAMES } from '../../constants.ts';

interface NpcUIProps {
    npc: Entity;
    onClose: () => void;
    onCompleteQuest: (npcId: number, questId: number) => void;
    inventory: (ItemStack | null)[];
    lang: 'EN' | 'PT';
}

export const NpcUI: React.FC<NpcUIProps> = ({ npc, onClose, onCompleteQuest, inventory, lang }) => {
    if (!npc.npcData) return null;

    const quest = QUESTS.find(q => q.id === npc.npcData!.questId);
    if (!quest) return null;

    let hasItems = false;
    let count = 0;
    for (const item of inventory) {
        if (item && item.id === quest.reqItem) {
            count += item.count;
        }
    }
    if (count >= quest.reqCount) {
        hasItems = true;
    }

    return (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-50">
            <div className="bg-[#c6c6c6] p-4 border-4 border-white rounded shadow-lg w-[400px] max-w-[90vw]">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-black">{npc.npcData.name}</h2>
                    <button onClick={onClose} className="text-red-500 font-bold hover:text-red-700">X</button>
                </div>
                
                <div className="bg-black/10 p-4 rounded mb-4">
                    <p className="text-black mb-2">
                        {lang === 'PT' ? quest.descPT : quest.descEN}
                    </p>
                    <div className="flex justify-between text-sm text-gray-700">
                        <span>{lang === 'PT' ? 'Requer:' : 'Requires:'} {quest.reqCount}x {ITEM_NAMES[lang][quest.reqItem] || quest.reqItem}</span>
                        <span>{lang === 'PT' ? 'Recompensa:' : 'Reward:'} {quest.rewardCount}x {ITEM_NAMES[lang][quest.rewardItem] || quest.rewardItem}</span>
                    </div>
                </div>

                {npc.npcData.completed ? (
                    <div className="text-center text-green-600 font-bold">
                        {lang === 'PT' ? 'Missão Concluída!' : 'Quest Completed!'}
                    </div>
                ) : (
                    <button 
                        onClick={() => onCompleteQuest(npc.id, quest.id)}
                        disabled={!hasItems}
                        className={`w-full py-2 font-bold rounded ${hasItems ? 'bg-green-500 hover:bg-green-600 text-white' : 'bg-gray-400 text-gray-200 cursor-not-allowed'}`}
                    >
                        {lang === 'PT' ? 'Completar Missão' : 'Complete Quest'}
                    </button>
                )}
            </div>
        </div>
    );
};
