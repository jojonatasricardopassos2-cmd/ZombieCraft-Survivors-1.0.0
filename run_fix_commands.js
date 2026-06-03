import fs from 'fs';

let content = fs.readFileSync('components/GameCanvas.tsx', 'utf8');

const regex = /isCommand = true;\s*}\s*if \(!isCommand\)/s;

const newLogic = `isCommand = true;
                                } else if(text.startsWith('/chet tp biome')) {
                                    const biomeName = text.split(' ')[3];
                                    if (biomeName) {
                                         let found = false;
                                         const pX = Math.floor(playerRef.current.x / BLOCK_SIZE);
                                         let chunkStart = Math.floor(pX / 500);
                                         
                                         // Search for biome in both directions
                                         for(let i=1; i<20; i++) {
                                             if (getBiome((chunkStart + i)*500, currentSeed) === biomeName) {
                                                playerRef.current.x = (chunkStart + i)*500 * BLOCK_SIZE;
                                                playerRef.current.y = 0; // fallback safe
                                                found = true; break;
                                             }
                                             if (chunkStart - i > 0 && getBiome((chunkStart - i)*500, currentSeed) === biomeName) {
                                                playerRef.current.x = (chunkStart - i)*500 * BLOCK_SIZE;
                                                playerRef.current.y = 0; // fallback safe
                                                found = true; break;
                                             }
                                         }
                                         if(found) setChatMessages(p => [...p, {msg: \`Teleportado para \${biomeName}.\`, color: '#00ff00'}]);
                                         else setChatMessages(p => [...p, {msg: \`Bioma \${biomeName} não encontrado.\`, color: '#ff0000'}]);
                                    }
                                    isCommand = true;
                                }
                                
                                if (!isCommand)`;

content = content.replace(regex, newLogic);

fs.writeFileSync('components/GameCanvas.tsx', content);
