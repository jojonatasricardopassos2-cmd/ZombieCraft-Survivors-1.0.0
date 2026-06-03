import fs from 'fs';

let content = fs.readFileSync('components/GameCanvas.tsx', 'utf8');

const regex = /if \(x > 830 && snowCoverRef\.current > 0\)/g;
content = content.replace(regex, "if (getBiome(x, currentSeed) === 'snow' && snowCoverRef.current > 0)");

fs.writeFileSync('components/GameCanvas.tsx', content);
