import fs from 'fs';

let content = fs.readFileSync('components/GameCanvas.tsx', 'utf8');

const regex = /const isSnowBiome = player\.x > 830 \* BLOCK_SIZE;/;

const replacement = `const isSnowBiome = getBiome(Math.floor(playerRef.current.x / BLOCK_SIZE), currentSeed) === 'snow';`;

content = content.replace(regex, replacement);

fs.writeFileSync('components/GameCanvas.tsx', content);
