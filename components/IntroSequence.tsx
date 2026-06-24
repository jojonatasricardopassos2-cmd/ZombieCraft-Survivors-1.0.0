import React, { useState, useEffect } from 'react';

interface IntroProps {
  onComplete: () => void;
}

export const IntroSequence: React.FC<IntroProps> = ({ onComplete }) => {
  const [phase, setPhase] = useState<'BAL_STUDIOS' | 'GAME_LOGO' | 'WARNING'>('BAL_STUDIOS');
  
  useEffect(() => {
    if (phase === 'BAL_STUDIOS') {
      const t1 = setTimeout(() => setPhase('GAME_LOGO'), 3000);
      return () => clearTimeout(t1);
    } else if (phase === 'GAME_LOGO') {
      const t2 = setTimeout(() => setPhase('WARNING'), 3000);
      return () => clearTimeout(t2);
    }
  }, [phase]);

  return (
    <div className="absolute inset-0 z-[100] bg-black flex items-center justify-center overflow-hidden">
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
           <div className="flex flex-col items-center justify-center relative w-full max-w-[800px] h-[500px] scale-75 md:scale-100">
              <div className="absolute top-[120px] right-[100px] flex items-center gap-6">
                 <span className="text-[#00A2FF] text-[100px] font-black font-sans tracking-tight leading-none">BAL</span>
                 <div className="flex flex-col items-center mt-2">
                    <div className="w-[60px] h-[35px] bg-[#00A2FF] relative">
                       <div className="absolute top-[10px] left-[12px] w-[10px] h-[4px] bg-black"></div>
                       <div className="absolute top-[10px] right-[12px] w-[10px] h-[4px] bg-black"></div>
                    </div>
                    <div className="w-[85px] h-[50px] bg-[#00A2FF] mt-1 relative -left-[12px]"></div>
                    <div className="flex gap-3 mt-1 relative -left-[12px]">
                       <div className="w-[18px] h-[40px] bg-[#00A2FF]"></div>
                       <div className="w-[18px] h-[40px] bg-[#00A2FF]"></div>
                    </div>
                 </div>
              </div>

              <div className="absolute bottom-[120px] left-[100px] flex items-center gap-6">
                 <div className="flex flex-col items-center mb-2">
                    <div className="w-[60px] h-[35px] bg-[#E31818] relative">
                       <div className="absolute top-[10px] left-[12px] w-[10px] h-[4px] bg-black"></div>
                       <div className="absolute top-[10px] right-[12px] w-[10px] h-[4px] bg-black"></div>
                    </div>
                    <div className="w-[85px] h-[50px] bg-[#E31818] mt-1 relative -right-[12px]"></div>
                    <div className="flex gap-3 mt-1 relative -right-[12px]">
                       <div className="w-[18px] h-[40px] bg-[#E31818]"></div>
                       <div className="w-[18px] h-[40px] bg-[#E31818]"></div>
                    </div>
                 </div>
                 <span className="text-[#E31818] text-[100px] font-black font-sans tracking-tight leading-none">GAMES</span>
              </div>
           </div>
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
        <div className="animate-fade-in flex flex-col items-center justify-center max-w-2xl text-center px-6">
          <div className="mb-10">
             <h1 className="text-red-600 text-6xl font-black mb-6 uppercase tracking-widest drop-shadow-[0_0_15px_rgba(220,38,38,0.8)]">Aviso</h1>
             <p className="text-gray-300 text-2xl leading-relaxed font-medium">
               Este jogo contém elementos de sobrevivência, zumbis e ficção.<br/> A experiência pode conter eventos gerados aleatoriamente.
             </p>
          </div>
          <button 
            onClick={onComplete}
            className="px-10 py-5 bg-red-600 hover:bg-red-700 text-white font-black text-3xl rounded-md uppercase tracking-widest shadow-[0_6px_0_#991b1b] active:shadow-none active:translate-y-[6px] transition-all"
          >
            Eu entendo
          </button>
        </div>
      )}
    </div>
  );
};
