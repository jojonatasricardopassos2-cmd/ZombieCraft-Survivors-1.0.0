
import React, { useState } from 'react';
import { TRANSLATIONS } from '../../constants';

interface SleepUIProps {
    onClose: () => void;
    onSleep: (hour: number) => void;
    lang: 'EN' | 'PT';
}

export const SleepUI: React.FC<SleepUIProps> = ({ onClose, onSleep, lang }) => {
    const t = TRANSLATIONS[lang];
    const [selectedHour, setSelectedHour] = useState(6); // Default 6 AM

    const hours = Array.from({ length: 24 }, (_, i) => i);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={(e) => {
            if(e.target === e.currentTarget) onClose();
        }}>
            <div className="bg-slate-800 border-4 border-slate-600 rounded-lg p-6 w-80 shadow-2xl flex flex-col gap-4 text-white font-mono relative">
                <button onClick={onClose} className="absolute top-2 right-2 text-red-400 hover:text-red-300 font-bold text-xl">X</button>
                <h2 className="text-xl font-bold text-center border-b border-slate-600 pb-2 text-purple-300">{t.SLEEP_MENU}</h2>
                
                <div className="flex flex-col gap-2">
                    <label className="text-gray-300 text-sm">{t.WAKE_TIME}</label>
                    <select 
                        value={selectedHour} 
                        onChange={(e) => setSelectedHour(parseInt(e.target.value))}
                        className="bg-black border border-gray-500 p-2 text-white text-lg rounded"
                    >
                        {hours.map(h => (
                            <option key={h} value={h}>
                                {h}:00
                            </option>
                        ))}
                    </select>
                </div>

                <button 
                    onClick={() => onSleep(selectedHour)}
                    className="mt-4 bg-purple-700 hover:bg-purple-600 text-white p-3 rounded font-bold border border-purple-500 shadow-lg"
                >
                    {t.SLEEP}
                </button>
            </div>
        </div>
    );
};
