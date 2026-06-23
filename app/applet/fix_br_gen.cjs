const fs = require('fs'); 
let c = fs.readFileSync('components/GameCanvas.tsx', 'utf8'); 
const startStr = 'const brWidth = 1000;'; 
const endStr = '}, 3000);'; 
const startIndex = c.indexOf(startStr); 
const endIndex = c.indexOf(endStr, startIndex); 
if(startIndex !== -1 && endIndex !== -1) { 
    c = c.substring(0, startIndex) + `const brWidth = 500;
                const brHeight = 300;
                const brBlocks = new Array(brWidth * brHeight).fill(BlockType.AIR);
                const brLight = new Array(brWidth * brHeight).fill(0);
                
                const ROOM_WIDTH = 25;
                const ROOM_HEIGHT = 12;
                const NUM_FLOORS = 3;
                const NUM_ROOMS_X = 15;
                
                const startX = Math.floor((brWidth - (NUM_ROOMS_X * ROOM_WIDTH)) / 2);
                const startY = Math.floor((brHeight - (NUM_FLOORS * ROOM_HEIGHT)) / 2);
                
                const centerRoomX = Math.floor(NUM_ROOMS_X / 2);
                const centerRoomY = 1;
                
                // Save safe zone bounds globally or in refs
                const safeZoneStartX = startX + centerRoomX * ROOM_WIDTH;
                const safeZoneEndX = safeZoneStartX + ROOM_WIDTH;
                const safeZoneStartY = startY + centerRoomY * ROOM_HEIGHT;
                const safeZoneEndY = safeZoneStartY + ROOM_HEIGHT;
                
                for (let floor = 0; floor < NUM_FLOORS; floor++) {
                    const y = startY + floor * ROOM_HEIGHT;
                    for (let rx = 0; rx < NUM_ROOMS_X; rx++) {
                        const x = startX + rx * ROOM_WIDTH;
                        
                        // Floor
                        for (let ix = 0; ix < ROOM_WIDTH; ix++) {
                            brBlocks[(y + ROOM_HEIGHT - 1) * brWidth + x + ix] = BlockType.MOSS;
                        }
                        
                        // Ceiling
                        for (let ix = 0; ix < ROOM_WIDTH; ix++) {
                             brBlocks[y * brWidth + x + ix] = BlockType.WALLPAPER;
                        }

                        // Walls (Left and Right)
                        for (let iy = 0; iy < ROOM_HEIGHT - 1; iy++) {
                            if (rx > 0 || rx === 0) {
                                brBlocks[(y + iy) * brWidth + x] = BlockType.WALLPAPER;
                            }
                            if (rx === NUM_ROOMS_X - 1) {
                                brBlocks[(y + iy) * brWidth + x + ROOM_WIDTH - 1] = BlockType.WALLPAPER;
                            }
                        }
                        
                        // Doors
                        if (rx > 0) {
                            brBlocks[(y + ROOM_HEIGHT - 2) * brWidth + x] = BlockType.DOOR_WOOD_BOTTOM_CLOSED;
                            brBlocks[(y + ROOM_HEIGHT - 3) * brWidth + x] = BlockType.DOOR_WOOD_TOP_CLOSED;
                        }

                        // Ladder
                        const midX = x + Math.floor(ROOM_WIDTH / 2);
                        if (floor < NUM_FLOORS - 1) {
                            brBlocks[(y + ROOM_HEIGHT - 1) * brWidth + midX] = BlockType.AIR;
                            brBlocks[(y + ROOM_HEIGHT - 1) * brWidth + midX + 1] = BlockType.AIR;
                            for(let ly = 1; ly < ROOM_HEIGHT; ly++) {
                                 brBlocks[(y + ly) * brWidth + midX] = BlockType.LADDER;
                            }
                        }

                        if (Math.random() < 0.5) {
                            brBlocks[(y + 1) * brWidth + x + Math.floor(ROOM_WIDTH/4)] = BlockType.GENERATOR_OFF;
                        }
                    }
                }

                const spawnX = startX + centerRoomX * ROOM_WIDTH + Math.floor(ROOM_WIDTH / 2);
                const spawnY = startY + centerRoomY * ROOM_HEIGHT + ROOM_HEIGHT - 2;
                
                brBlocks[spawnY * brWidth + spawnX - 3] = BlockType.WHITE_DOOR_CLOSED;
                brBlocks[(spawnY - 1) * brWidth + spawnX - 3] = BlockType.WHITE_DOOR_CLOSED;

                let kx = centerRoomX, ky = centerRoomY;
                while(kx === centerRoomX && ky === centerRoomY) {
                    kx = Math.floor(Math.random() * NUM_ROOMS_X);
                    ky = Math.floor(Math.random() * NUM_FLOORS);
                }
                brBlocks[(startY + ky * ROOM_HEIGHT + ROOM_HEIGHT - 2) * brWidth + startX + kx * ROOM_WIDTH + Math.floor(ROOM_WIDTH/2) + 3] = BlockType.BR_KEY_BLOCK;

                playerRef.current.x = spawnX * BLOCK_SIZE;
                playerRef.current.y = spawnY * BLOCK_SIZE;
                playerRef.current.vy = 0;
                
                // Make the safe bounds available
                (window as any).brSafeZone = { sx: safeZoneStartX * BLOCK_SIZE, ex: safeZoneEndX * BLOCK_SIZE, sy: safeZoneStartY * BLOCK_SIZE, ey: safeZoneEndY * BLOCK_SIZE };

                overworldRef.current = worldRef.current;
                overworldEntitiesRef.current = entitiesRef.current;
                
                worldRef.current = {
                    width: brWidth,
                    height: brHeight,
                    blocks: brBlocks,
                    light: brLight,
                    weather: { type: 'CLEAR', intensity: 0, duration: 0 },
                    npcSpawns: [],
                    initialChests: [],
                    structures: []
                };

                setTimeout(() => {
                    setBackroomsPhase('EXPLORING');
                }, 3000);` + c.substring(endIndex + 9); 
    fs.writeFileSync('components/GameCanvas.tsx', c); 
    console.log('Replaced successfully'); 
} else { 
    console.log('Indices not found'); 
}
