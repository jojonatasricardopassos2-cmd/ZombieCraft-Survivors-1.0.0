
import React, { useState } from 'react';
import { GameCanvas } from './components/GameCanvas.tsx';
import { IntroSequence } from './components/IntroSequence.tsx';

const App: React.FC = () => {
  const [showIntro, setShowIntro] = useState(true);

  return (
    <div className="fixed inset-0 w-full h-full overflow-hidden bg-zinc-900 text-white select-none">
      {showIntro ? (
        <IntroSequence onComplete={() => setShowIntro(false)} />
      ) : (
        <GameCanvas />
      )}
    </div>
  );
};

export default App;
