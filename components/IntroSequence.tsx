import React, { useState, useEffect } from 'react';

interface IntroProps {
  onComplete: () => void;
}

export const IntroSequence: React.FC<IntroProps> = ({ onComplete }) => {
  const [phase, setPhase] = useState<'BAL_STUDIOS' | 'GAME_LOGO' | 'WARNING' | 'FADING_OUT' | 'DONE'>('BAL_STUDIOS');
  
  useEffect(() => {
    if (phase === 'BAL_STUDIOS') {
      const t1 = setTimeout(() => setPhase('GAME_LOGO'), 3000);
      return () => clearTimeout(t1);
    } else if (phase === 'GAME_LOGO') {
      const t2 = setTimeout(() => setPhase('WARNING'), 3000);
      return () => clearTimeout(t2);
    } else if (phase === 'FADING_OUT') {
      const t3 = setTimeout(() => {
        setPhase('DONE');
        onComplete();
      }, 1000); // 1s fade to black
      return () => clearTimeout(t3);
    }
  }, [phase, onComplete]);

  if (phase === 'DONE') return null;

  const handleComplete = () => {
    setPhase('FADING_OUT');
  };

  return (
    <div className={`absolute inset-0 z-[100] flex items-center justify-center overflow-hidden transition-opacity duration-1000 ${phase === 'FADING_OUT' ? 'opacity-0 bg-black' : 'opacity-100 bg-black'}`}>
      <style>{`
        @keyframes fadeInOut {
            0% { opacity: 0; transform: scale(0.95); }
            20% { opacity: 1; transform: scale(1); }
            80% { opacity: 1; transform: scale(1); }
            100% { opacity: 0; transform: scale(1.05); }
        }
        @keyframes fadeIn {
            0% { opacity: 0; transform: translateY(10px); }
            100% { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-out {
            animation: fadeInOut 3s ease-in-out forwards;
        }
        .animate-fade-in {
            animation: fadeIn 1s ease-out forwards;
        }
      `}</style>
      
      {phase === 'BAL_STUDIOS' && (
        <div className="animate-fade-in-out flex flex-col items-center justify-center w-full h-full relative bg-black">
           <h1 className="text-white font-black text-8xl md:text-[120px] tracking-[0.2em] mb-8">BAL GAMES</h1>
           <span className="text-gray-400 text-xl md:text-2xl tracking-[0.5em]">APRESENTA / PRESENTS</span>
        </div>
      )}
      
      {phase === 'GAME_LOGO' && (
        <div className="animate-fade-in-out flex flex-col items-center justify-center scale-90 md:scale-110">
          <div className="relative flex items-center justify-center w-[450px] h-[450px]">
            <div className="absolute left-[30px] w-[300px] h-[300px] bg-[#E31818] rounded-full flex flex-col justify-center items-start pl-12 z-10">
               <span className="text-black font-black text-[42px] uppercase leading-none tracking-tighter">ZOMBIE</span>
               <span className="text-black font-black text-[32px] uppercase leading-none tracking-tighter ml-8 mt-2">THE</span>
               <span className="text-black font-black text-[38px] uppercase leading-none tracking-tighter ml-6 mt-2">CRAFT</span>
               <span className="text-black font-black text-[26px] uppercase leading-none tracking-tighter mt-2">SURVIVORS</span>
            </div>
            <div className="absolute right-[50px] w-[160px] h-[220px] bg-[#2E7D32] border-[14px] border-black z-20">
               <div className="absolute top-[70px] left-[20px] w-[35px] h-[14px] bg-black"></div>
               <div className="absolute top-[70px] left-[55px] w-[14px] h-[14px] bg-[#b71c1c]"></div>
               <div className="absolute top-[150px] left-[20px] w-[60px] h-[18px] bg-black"></div>
               <div className="absolute top-[140px] left-[70px] w-[10px] h-[28px] bg-[#2E7D32]"></div>
            </div>
          </div>
        </div>
      )}

      {phase === 'WARNING' && (
        <div className="animate-fade-in flex flex-col items-center justify-center w-full h-full bg-black text-center px-6">
          <div className="mb-12 max-w-4xl">
             <h1 className="text-red-600 text-6xl md:text-[80px] font-black mb-10 uppercase tracking-widest drop-shadow-[0_0_20px_rgba(220,38,38,0.6)]">Aviso de<br/>Fotossensibilidade</h1>
             <p className="text-gray-200 text-2xl md:text-3xl leading-relaxed font-medium">
               Este jogo contém luzes piscantes e padrões visuais que podem causar<br/>convulsões em uma pequena porcentagem de pessoas com epilepsia<br/>fotossensível.
             </p>
          </div>
          <button 
            onClick={handleComplete}
            className="px-12 py-6 bg-red-600 hover:bg-red-700 text-white font-black text-3xl md:text-4xl rounded uppercase tracking-widest transition-all"
          >
            Eu entendo
          </button>
        </div>
      )}

      {phase === 'FADING_OUT' && (
        <div className="w-full h-full bg-black"></div>
      )}
    </div>
  );
};
