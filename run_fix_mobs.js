import fs from 'fs';

let content = fs.readFileSync('components/GameCanvas.tsx', 'utf8');

content = content.replace("import { generateWorld } from '../utils/world.ts';", "import { generateWorld, getBiome } from '../utils/world.ts';");

const target = `                 // BIOME RESTRICTIONS
                 const isDesert = spawnX < 150; 
                 const isSnow = spawnX > 830;
                 const isForest = spawnX > 520 && spawnX < 800;`;

const replacement = `                 // BIOME RESTRICTIONS
                 const biome = getBiome(spawnX, currentSeed);
                 const isDesert = biome === 'desert';
                 const isSnow = biome === 'snow';
                 const isForest = biome === 'forest';`;

content = content.replace(target, replacement);

fs.writeFileSync('components/GameCanvas.tsx', content);
