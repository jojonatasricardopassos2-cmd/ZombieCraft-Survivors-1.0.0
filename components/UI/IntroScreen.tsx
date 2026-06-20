import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface IntroScreenProps {
    onComplete: () => void;
}

export const IntroScreen: React.FC<IntroScreenProps> = ({ onComplete }) => {
    const [step, setStep] = useState<'WARNING' | 'BAL_GAMES' | 'DARK1' | 'ZUBICRAFT' | 'DARK2'>('WARNING');
    const [letters, setLetters] = useState<boolean[]>(Array(9).fill(false)); // B A L _ G A M E S

    useEffect(() => {
        if (step === 'BAL_GAMES') {
            const timeouts: ReturnType<typeof setTimeout>[] = [];
            
            // BAL GAMES letters drop
            const letterT = [0, 300, 600, 800, 1000, 1200, 1400, 1600, 1800];
            letterT.forEach((t, i) => {
                timeouts.push(setTimeout(() => {
                    setLetters(prev => {
                        const next = [...prev];
                        next[i] = true;
                        return next;
                    });
                }, t + 500));
            });

            // Transition to dark screen
            timeouts.push(setTimeout(() => setStep('DARK1'), 4000));
            // Then to Zubicraft
            timeouts.push(setTimeout(() => setStep('ZUBICRAFT'), 5000));

            return () => timeouts.forEach(clearTimeout);
        } else if (step === 'ZUBICRAFT') {
            playTensionSound();
            const timeouts: ReturnType<typeof setTimeout>[] = [];
            // Show Zubicraft for 3 seconds then fade to dark
            timeouts.push(setTimeout(() => setStep('DARK2'), 3000));
            
            // Then complete
            timeouts.push(setTimeout(() => onComplete(), 4500));
            
            return () => timeouts.forEach(clearTimeout);
        }
    }, [step, onComplete]);

    const playTensionSound = () => {
        try {
            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(50, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(10, ctx.currentTime + 2);
            gain.gain.setValueAtTime(0, ctx.currentTime);
            gain.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 0.1);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 2);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 2);
        } catch (e) {}
    };

    const titleStr = "BAL GAMES";

    return (
        <div className="absolute inset-0 bg-black z-[100] flex flex-col items-center justify-center p-8 select-none">
            <button 
                onClick={onComplete}
                className="absolute top-4 right-4 text-white/50 hover:text-white font-mono text-sm uppercase tracking-wider px-4 py-2 border border-white/20 rounded hover:bg-white/10 transition-colors z-[110]"
            >
                Pular / Skip
            </button>

            <AnimatePresence mode="wait">
                {step === 'WARNING' && (
                    <motion.div 
                        key="warning"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, transition: { duration: 0.5 } }}
                        className="max-w-3xl text-center space-y-6 z-[105]"
                    >
                        <h1 className="text-red-500 font-bold text-2xl tracking-widest uppercase">
                            Aviso: Fotossensibilidade / Ataques Epiléticos
                        </h1>
                        <p className="text-gray-300 font-mono text-lg leading-relaxed">
                            Uma porcentagem muito pequena de pessoas pode sofrer ataques epiléticos ou desmaios quando expostas a determinados padrões ou luzes piscantes. A exposição a certos padrões ou fundos de tela durante a reprodução de jogos pode provocar ataques epiléticos ou desmaios nesses indivíduos. Se você, ou qualquer pessoa da sua família, tiver epilepsia ou já tiver sofrido convulsões de qualquer tipo, consulte um médico antes de jogar ou nem jogue.
                        </p>
                        <button 
                            onClick={() => setStep('BAL_GAMES')}
                            className="mt-8 px-8 py-3 bg-red-900/50 hover:bg-red-800 text-white font-bold rounded border border-red-500 transition-colors uppercase tracking-widest"
                        >
                            Eu compreendo (Continuar)
                        </button>
                    </motion.div>
                )}

                {step === 'BAL_GAMES' && (
                    <motion.div 
                        key="bal_games"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, transition: { duration: 1 } }}
                        className="flex flex-col items-center justify-center space-y-8 z-[105]"
                    >
                        <div className="flex space-x-2 text-6xl md:text-8xl font-black text-white px-4">
                            {titleStr.split('').map((char, i) => (
                                <motion.span
                                    key={i}
                                    initial={{ y: -500, opacity: 0, rotate: i % 2 === 0 ? -15 : 15 }}
                                    animate={letters[i] ? { y: 0, opacity: 1, rotate: 0 } : {}}
                                    transition={{ type: "spring", damping: 12, stiffness: 100 }}
                                    className={char === ' ' ? 'w-8' : 'mx-1 drop-shadow-xl'}
                                >
                                    {char}
                                </motion.span>
                            ))}
                        </div>
                        <motion.p 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: letters[8] ? 1 : 0 }}
                            transition={{ duration: 1 }}
                            className="text-gray-400 tracking-[0.5em] uppercase text-sm font-mono mt-8 text-center"
                        >
                            Apresenta / Presents
                        </motion.p>
                    </motion.div>
                )}

                {step === 'ZUBICRAFT' && (
                     <motion.div 
                         key="zubicraft"
                         initial={{ opacity: 0, scale: 0.9, filter: 'blur(10px)' }}
                         animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                         exit={{ opacity: 0, scale: 1.1, filter: 'blur(10px)', transition: { duration: 1 } }}
                         transition={{ duration: 1.5, ease: "easeOut" }}
                         className="flex items-center justify-center pointer-events-none z-[105]"
                     >
                         <h2 
                             className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-b from-green-400 to-green-800 uppercase tracking-tighter drop-shadow-2xl text-center" 
                             style={{ WebkitTextStroke: '1px rgba(255,255,255,0.1)' }}
                         >
                             ZUBICRAFT SURVIVAL
                         </h2>
                     </motion.div>
                )}

                {(step === 'DARK1' || step === 'DARK2') && (
                    <motion.div 
                        key="dark"
                        initial={{ opacity: 1 }}
                        className="fixed inset-0 bg-black z-[104]"
                    />
                )}
            </AnimatePresence>
        </div>
    );
};
