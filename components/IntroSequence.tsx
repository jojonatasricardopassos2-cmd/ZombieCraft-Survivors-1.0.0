import React, { useState, useEffect } from 'react';

interface IntroProps {
  onComplete: () => void;
}

export const IntroSequence: React.FC<IntroProps> = ({ onComplete }) => {
  const [phase, setPhase] = useState<'BAL_STUDIOS' | 'GAME_LOGO' | 'DONE'>('BAL_STUDIOS');
  
  useEffect(() => {
    // 1st phase: Bal Studios
    const t1 = setTimeout(() => {
      setPhase('GAME_LOGO');
    }, 3000); // 3 seconds
    
    // 2nd phase: Game logo
    const t2 = setTimeout(() => {
      setPhase('DONE');
      onComplete();
    }, 6000); // 3 seconds more
    
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [onComplete]);

  if (phase === 'DONE') return null;

  return (
    <div className="absolute inset-0 z-[100] bg-black flex items-center justify-center">
      <style>{`
        @keyframes fadeInOut {
            0% { opacity: 0; transform: scale(0.95); }
            20% { opacity: 1; transform: scale(1); }
            80% { opacity: 1; transform: scale(1); }
            100% { opacity: 0; transform: scale(1.05); }
        }
        .animate-fade-in-out {
            animation: fadeInOut 3s ease-in-out forwards;
        }
      `}</style>
      
      {phase === 'BAL_STUDIOS' && (
        <div className="animate-fade-in-out text-center">
          <h1 className="text-white text-3xl font-mono tracking-widest uppercase mb-4 opacity-80">
            Bal Studios
          </h1>
          <p className="text-gray-400 text-sm tracking-widest uppercase">
            Apresenta
          </p>
        </div>
      )}
      
      {phase === 'GAME_LOGO' && (
        <div className="animate-fade-in-out text-center">
          <h1 className="text-7xl font-bold text-red-600 drop-shadow-[0_0_15px_rgba(220,38,38,0.8)] tracking-tight">
            ZombieCraft
          </h1>
          <h2 className="text-4xl font-bold text-gray-300 ml-20" style={{ textShadow: '1px 1px 0px #000' }}>
            Survivors
          </h2>
        </div>
      )}
    </div>
  );
};
