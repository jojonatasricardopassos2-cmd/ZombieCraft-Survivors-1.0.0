import fs from 'fs';

let content = fs.readFileSync('utils/world.ts', 'utf8');

const regex = /const getBiome = \(x: number\): string => {[^}]+};/;

// Export and move to top
content = content.replace(regex, '');

const newFunc = `
export const getBiome = (x: number, noiseSeed: number): string => {
    const biomeNoise = smoothNoise(Math.floor(x / 500) * 500, noiseSeed + 1000, 2000);
    const val = Math.abs(biomeNoise * 100) % 4;
    if (val < 1) return 'plains';
    if (val < 2) return 'desert';
    if (val < 3) return 'forest';
    return 'snow';
};
`;

content = content.replace('export function generateWorld', newFunc + '\nexport function generateWorld');
content = content.replace(/getBiome\(x\)/g, 'getBiome(x, noiseSeed)');

fs.writeFileSync('utils/world.ts', content);
