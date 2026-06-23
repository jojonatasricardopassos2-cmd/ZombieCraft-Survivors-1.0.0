const fs = require('fs');
let c = fs.readFileSync('components/GameCanvas.tsx', 'utf8');
const startIndex = c.indexOf('const brWidth = 200;');
const endIndex = c.indexOf('structures: []', startIndex);
if (startIndex !== -1 && endIndex !== -1) {
    const endMatch = c.indexOf('};', endIndex) + 2;
    const oldGen = c.substring(startIndex, endMatch);
    const newGen = `const brWidth = 1000;
                const brHeight = 3000;
                const brBlocks = new Array(brWidth * brHeight).fill(BlockType.WALLPAPER);
                const brLight = new Array(brWidth * brHeight).fill(0);
                
                const ROOM_SIZE = 20;
                const rooms = [];
                for(let floor = 0; floor < 3; floor++) {
                    for(let ry = 0; ry < 1000 / ROOM_SIZE; ry++) {
                        for(let rx = 0; rx < 1000 / ROOM_SIZE; rx++) {
                            const startX = rx * ROOM_SIZE;
                            const startY = floor * 1000 + ry * ROOM_SIZE;
                            if (Math.random() < 0.8 || (floor === 0 && rx === 0 && ry === 0)) {
                                rooms.push({x: rx, y: ry, floor, startX, startY});
                                for(let y = startY + 2; y < startY + ROOM_SIZE - 2; y++) {
                                    for(let x = startX + 2; x < startX + ROOM_SIZE - 2; x++) {
                                        brBlocks[y * brWidth + x] = BlockType.AIR;
                                    }
                                }
                                if (Math.random() < 0.5) {
                                    brBlocks[(startY + 2) * brWidth + startX + 2] = BlockType.GENERATOR_OFF;
                                }
                            }
                        }
                    }
                }

                for(let i=0; i<rooms.length; i++) {
                    const r = rooms[i];
                    if (rooms.find(o => o.floor === r.floor && o.x === r.x+1 && o.y === r.y)) {
                        if (Math.random() < 0.6) {
                            const cx = r.startX + ROOM_SIZE - 2;
                            const cy = r.startY + Math.floor(ROOM_SIZE/2);
                            for(let dx = 0; dx < 4; dx++) {
                                brBlocks[cy * brWidth + cx + dx] = BlockType.AIR;
                                brBlocks[(cy+1) * brWidth + cx + dx] = BlockType.AIR;
                            }
                        }
                    }
                    if (rooms.find(o => o.floor === r.floor && o.x === r.x && o.y === r.y+1)) {
                        if (Math.random() < 0.6) {
                            const cx = r.startX + Math.floor(ROOM_SIZE/2);
                            const cy = r.startY + ROOM_SIZE - 2;
                            for(let dy = 0; dy < 4; dy++) {
                                brBlocks[(cy + dy) * brWidth + cx] = BlockType.AIR;
                                brBlocks[(cy + dy) * brWidth + cx + 1] = BlockType.AIR;
                            }
                        }
                    }
                }

                for(let floor = 0; floor < 2; floor++) {
                    const floorRooms = rooms.filter(r => r.floor === floor);
                    for(let i=0; i<15; i++) {
                        const r = floorRooms[Math.floor(Math.random() * floorRooms.length)];
                        if (r) {
                            const lx = r.startX + Math.floor(ROOM_SIZE/2);
                            const ly = r.startY + Math.floor(ROOM_SIZE/2);
                            brBlocks[ly * brWidth + lx] = BlockType.LADDER;
                            brBlocks[ly * brWidth + lx + 1] = BlockType.LADDER;
                            for(let y = ly + 1000 - 2; y < ly + 1000 + 2; y++) {
                                for(let x = lx - 2; x < lx + 3; x++) {
                                    brBlocks[y * brWidth + x] = BlockType.AIR;
                                }
                            }
                        }
                    }
                }

                for(let y=2; y<ROOM_SIZE-2; y++) for(let x=2; x<ROOM_SIZE-2; x++) brBlocks[y*brWidth+x] = BlockType.AIR;
                brBlocks[Math.floor(ROOM_SIZE/2) * brWidth + ROOM_SIZE-2] = BlockType.WHITE_DOOR_CLOSED;
                brBlocks[(Math.floor(ROOM_SIZE/2)+1) * brWidth + ROOM_SIZE-2] = BlockType.WHITE_DOOR_CLOSED;

                const f2Rooms = rooms.filter(r => r.floor === 2);
                const keyRoom = f2Rooms.length > 0 ? f2Rooms[Math.floor(Math.random() * f2Rooms.length)] : rooms[rooms.length-1];
                if (keyRoom) {
                    brBlocks[(keyRoom.startY + Math.floor(ROOM_SIZE/2)) * brWidth + keyRoom.startX + Math.floor(ROOM_SIZE/2)] = BlockType.BR_KEY_BLOCK;
                }

                for(let i=0; i<brBlocks.length; i++) {
                    if (brBlocks[i] === BlockType.AIR && Math.random() < 0.1) brBlocks[i] = BlockType.CUSHION;
                }

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
                };`;
    c = c.substring(0, startIndex) + newGen + c.substring(endMatch);
    fs.writeFileSync('components/GameCanvas.tsx', c);
    console.log('Replaced successfully!');
} else {
    console.log('Could not find start or end index.');
}