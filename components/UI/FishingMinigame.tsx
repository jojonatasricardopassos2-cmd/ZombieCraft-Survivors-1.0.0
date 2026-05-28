import React, { useState, useEffect, useRef } from 'react';

interface Props {
    onSuccess: () => void;
    onFail: () => void;
}

export function FishingMinigame({ onSuccess, onFail }: Props) {
    const [progress, setProgress] = useState(0); // number of successful hits (0 to 3)
    const [barPos, setBarPos] = useState(0); // 0 to 100
    const [targetPos, setTargetPos] = useState(50); // center of yellow zone (20% width => ±10%)
    const dirRef = useRef(1);

    useEffect(() => {
        const interval = setInterval(() => {
            setBarPos(prev => {
                let n = prev + dirRef.current * 2;
                if (n > 100) { n = 100; dirRef.current = -1; }
                if (n < 0) { n = 0; dirRef.current = 1; }
                return n;
            });
            
            // Randomly move target sometimes
            if (Math.random() < 0.05) {
                setTargetPos(prev => {
                    const diff = (Math.random() - 0.5) * 40;
                    return Math.max(10, Math.min(90, prev + diff));
                });
            }
        }, 16);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.code === 'Space') {
                e.preventDefault();
                checkHit();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [barPos, targetPos, progress]);

    const checkHit = () => {
        const diff = Math.abs(barPos - targetPos);
        if (diff < 15) {
            // Hit!
            if (progress + 1 >= 3) {
                onSuccess();
            } else {
                setProgress(p => p + 1);
                // jump target to new pos
                setTargetPos(Math.random() * 80 + 10);
            }
        } else {
            // Miss
            onFail();
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm pointer-events-auto">
            <div className="bg-gray-800 border-4 border-blue-900 p-6 rounded-xl flex flex-col items-center gap-6 shadow-2xl relative overflow-hidden" onPointerDown={() => checkHit()}>
                <h1 className="text-2xl font-bold font-mono text-white text-center">PESCARIA</h1>
                <p className="text-sm text-gray-400 -mt-4 text-center">Aperte ESPAÇO ou TOQUE quando a barra passar no amarelo!</p>
                
                <div className="flex gap-2">
                    {[0, 1, 2].map(i => (
                        <div key={i} className={`w-8 h-8 rounded-full border-2 border-gray-600 flex items-center justify-center text-xl shadow-inner shadow-black/50 ${i < progress ? 'bg-green-500' : 'bg-gray-700'}`}>
                            {i < progress && '✔️'}
                        </div>
                    ))}
                </div>

                <div className="relative w-80 h-10 bg-gray-900 border-2 border-gray-700 rounded-full overflow-hidden shadow-inner">
                    {/* Target Zone */}
                    <div 
                        className="absolute h-full bg-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.5)] transition-all duration-200"
                        style={{ left: `${targetPos - 15}%`, width: '30%' }}
                    ></div>
                    
                    {/* Moving Bar */}
                    <div 
                        className="absolute h-[120%] w-2 bg-white -mt-[1%] rounded shadow-[0_0_5px_white]"
                        style={{ left: `${barPos}%`, transform: 'translateX(-50%)' }}
                    ></div>
                </div>
            </div>
        </div>
    );
}
