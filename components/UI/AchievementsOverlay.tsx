import React from 'react';
import { ACHIEVEMENTS_LIST } from '../../utils/achievementsList';

interface Props {
    unlocked: number[];
    onClose: () => void;
}

export function AchievementsOverlay({ unlocked, onClose }: Props) {
    return (
        <div className="fixed inset-0 z-50 bg-black/80 flex justify-center items-center backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-gray-900 border-4 border-yellow-600 rounded-xl p-6 w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl">
                <div className="flex justify-between items-center bg-gray-800 p-4 -mt-6 -mx-6 mb-6 rounded-t-lg border-b-2 border-yellow-600 shadow-sm">
                    <h2 className="text-3xl font-bold font-mono text-yellow-400 drop-shadow-md">🏆 CONQUISTAS</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors text-3xl font-bold leading-none">&times;</button>
                </div>
                
                <div className="text-center mb-4 text-gray-300 font-medium">
                    Progresso: <span className="text-yellow-400 font-bold">{unlocked.length}</span> / {ACHIEVEMENTS_LIST.length}
                </div>

                <div className="flex-1 overflow-y-auto no-scrollbar pr-2 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {ACHIEVEMENTS_LIST.map(ach => {
                        const isUnlocked = unlocked.includes(ach.id);
                        return (
                            <div key={ach.id} className={`flex items-start gap-4 p-4 rounded-lg border-2 transition-all ${isUnlocked ? 'bg-gray-800 border-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.2)]' : 'bg-gray-900 border-gray-700 opacity-50 grayscale'}`}>
                                <div className="text-4xl drop-shadow-md">{ach.icon}</div>
                                <div className="flex flex-col">
                                    <h3 className={`font-bold font-mono ${isUnlocked ? 'text-yellow-400' : 'text-gray-400'}`}>{ach.title}</h3>
                                    <p className="text-xs text-gray-300 mt-1 leading-snug">{ach.desc}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
            <style>{`
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </div>
    );
}
