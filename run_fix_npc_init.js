import fs from 'fs';

let content = fs.readFileSync('components/GameCanvas.tsx', 'utf8');

const npcInitRegex = /if \(w\.npcSpawns\) {[\s\S]*?w\.npcSpawns\.forEach\(spawn => {[\s\S]*?const questId = Math\.floor\(Math\.random\(\) \* 10\) \+ 1;[\s\S]*?const name = NPC_NAMES\[Math\.floor\(Math\.random\(\) \* NPC_NAMES\.length\)\];[\s\S]*?entitiesRef\.current\.push\({[\s\S]*?id: Date\.now\(\) \+ Math\.random\(\),[\s\S]*?type: 'NPC',/;

const newNpcInit = `if (w.npcSpawns) {
                    w.npcSpawns.forEach(spawn => {
                        const isQuestGiver = spawn.type === 'QUEST_GIVER';
                        const isFarm = spawn.type === 'FARM_ANIMAL';
                        
                        if (isFarm) {
                            for(let a=0; a<4; a++) {
                                entitiesRef.current.push({
                                    id: Date.now() + Math.random(),
                                    type: Math.random() > 0.5 ? 'COW' : (Math.random() > 0.5 ? 'PIG' : 'SHEEP'),
                                    x: spawn.x * BLOCK_SIZE + (Math.random()*40-20),
                                    y: spawn.y * BLOCK_SIZE,
                                    width: 32, height: 32, vx: 0, vy: 0, maxHealth: 20, health: 20, grounded: false, facingRight: true
                                });
                            }
                            return;
                        }

                        const questId = isQuestGiver ? 1 : Math.floor(Math.random() * 5) + 1;
                        const name = isQuestGiver ? "Prefeito" : NPC_NAMES[Math.floor(Math.random() * NPC_NAMES.length)];
                        entitiesRef.current.push({
                            id: Date.now() + Math.random(),
                            type: 'NPC',`;

content = content.replace(npcInitRegex, newNpcInit);
fs.writeFileSync('components/GameCanvas.tsx', content);
