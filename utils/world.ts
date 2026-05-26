
import { BlockType, WorldData } from '../types.ts';
import { WORLD_HEIGHT, WORLD_WIDTH, ORE_CHUNK_SIZE, SEA_LEVEL, BLOCK_SIZE, DEEP_SLATE_LEVEL, INTERNAL_SURFACE_Y } from '../constants.ts';

// Pseudo-Random Number Generator (Linear Congruential Generator)
class SeededRNG {
    private seed: number;
    constructor(seed: number) {
        this.seed = seed;
    }
    
    next(): number {
        this.seed = (this.seed * 9301 + 49297) % 233280;
        return this.seed / 233280;
    }
}

function noise(x: number, seed: number): number {
  const n = Math.sin(x * 12.9898 + seed) * 43758.5453;
  return n - Math.floor(n);
}

function smoothNoise(x: number, seed: number, scale: number): number {
  const intX = Math.floor(x / scale);
  const fracX = (x / scale) - intX;
  const v1 = noise(intX, seed);
  const v2 = noise(intX + 1, seed);
  return v1 * (1 - fracX) + v2 * fracX;
}

export function generateWorld(seedInput: number): WorldData {
  const blocks = new Array(WORLD_WIDTH * WORLD_HEIGHT).fill(BlockType.AIR);
  const light = new Array(WORLD_WIDTH * WORLD_HEIGHT).fill(0);
  
  const rng = new SeededRNG(seedInput);
  const noiseSeed = seedInput; 

  // Surface generation
  const surfaceHeight = new Array(WORLD_WIDTH);
  for (let x = 0; x < WORLD_WIDTH; x++) {
    const baseHeight = INTERNAL_SURFACE_Y; 
    const variation = Math.floor(
      smoothNoise(x, noiseSeed, 30) * 15 + 
      smoothNoise(x, noiseSeed + 100, 10) * 5
    );
    surfaceHeight[x] = baseHeight + variation;
  }

  // 1. Basic Solid Terrain
  for (let x = 0; x < WORLD_WIDTH; x++) {
    const h = surfaceHeight[x];
    const isForestBiome = x >= 500;
    
    // Jagged Deep Slate Transition Noise
    const deepNoise = smoothNoise(x, noiseSeed + 500, 10); 
    const deepThreshold = DEEP_SLATE_LEVEL + Math.floor(deepNoise * 20 - 10);

    for (let y = 0; y < WORLD_HEIGHT; y++) {
      const idx = y * WORLD_WIDTH + x;

      if (y >= WORLD_HEIGHT - 2) {
        blocks[idx] = BlockType.BEDROCK;
        continue;
      }

      let blockType = BlockType.AIR;

      if (y === h) {
          blockType = isForestBiome ? BlockType.DARK_GRASS : BlockType.GRASS;
      } else if (y > h && y < h + 4) {
          blockType = BlockType.DIRT;
      } else if (y >= h + 4) {
          if (y > deepThreshold) {
              blockType = BlockType.DEEP_STONE;
          } else {
              blockType = BlockType.STONE;
          }
      }
      
      if (blockType === BlockType.AIR && y > h && y > SEA_LEVEL) {
          blockType = BlockType.WATER;
      }

      blocks[idx] = blockType;
    }
  }
  
  // 1.5 Transition Lake (between Plains and Forest ~500)
  // Lake spans from 480 to 520 roughly
  const lakeStartX = 480;
  const lakeEndX = 520;
  
  // Desert Biome (Left of Plains, separated by River)
  // Plains starts at 0? No, Forest starts at 500. So Plains is 0-500.
  // Let's put Desert at 0-150. River at 150-180. Plains 180-480.
  const desertEndX = 150;
  const riverStartX = 150;
  const riverEndX = 180;
  
  // Snow Biome (Right of Forest, separated by Frozen Lake)
  // Forest 520-800. Frozen Lake 800-830. Snow 830-1000.
  const forestEndX = 800;
  const frozenLakeStartX = 800;
  const frozenLakeEndX = 830;
  const snowStartX = 830;

  for (let x = 0; x < WORLD_WIDTH; x++) {
       // Desert River
       if (x >= riverStartX && x <= riverEndX) {
           const riverBottom = surfaceHeight[x] + 6 + Math.floor(rng.next() * 3);
           const riverSurface = INTERNAL_SURFACE_Y + 5; 
           
           for(let y = 0; y < WORLD_HEIGHT; y++) {
                const idx = y * WORLD_WIDTH + x;
                if (y > riverSurface && y <= riverBottom) {
                     blocks[idx] = BlockType.WATER;
                } else if (y > riverBottom) {
                     if (blocks[idx] === BlockType.AIR || blocks[idx] === BlockType.WATER) blocks[idx] = BlockType.SAND; 
                     else if (y <= riverBottom + 2) blocks[idx] = BlockType.SAND; 
                } else if (y <= riverSurface && y > riverSurface - 2) {
                     blocks[idx] = BlockType.AIR; 
                }
           }
           continue;
       }

       // Central Lake
       if (x >= lakeStartX && x <= lakeEndX) {
           const lakeBottom = surfaceHeight[x] + 6 + Math.floor(rng.next() * 3);
           const lakeSurface = INTERNAL_SURFACE_Y + 5; 
           
           for(let y = 0; y < WORLD_HEIGHT; y++) {
                const idx = y * WORLD_WIDTH + x;
                if (y > lakeSurface && y <= lakeBottom) {
                     blocks[idx] = BlockType.WATER;
                } else if (y > lakeBottom) {
                     if (blocks[idx] === BlockType.AIR || blocks[idx] === BlockType.WATER) blocks[idx] = BlockType.SAND; 
                     else if (y <= lakeBottom + 2) blocks[idx] = BlockType.SAND; 
                } else if (y <= lakeSurface && y > lakeSurface - 2) {
                     blocks[idx] = BlockType.AIR; 
                }
           }
           continue;
       }
       
       // Frozen Lake
       if (x >= frozenLakeStartX && x <= frozenLakeEndX) {
           const lakeBottom = surfaceHeight[x] + 6 + Math.floor(rng.next() * 3);
           const lakeSurface = INTERNAL_SURFACE_Y + 5; 
           
           for(let y = 0; y < WORLD_HEIGHT; y++) {
                const idx = y * WORLD_WIDTH + x;
                if (y === lakeSurface) {
                     blocks[idx] = BlockType.ICE;
                } else if (y > lakeSurface && y <= lakeBottom) {
                     blocks[idx] = BlockType.WATER;
                } else if (y > lakeBottom) {
                     if (blocks[idx] === BlockType.AIR || blocks[idx] === BlockType.WATER) blocks[idx] = BlockType.DIRT; 
                     else if (y <= lakeBottom + 2) blocks[idx] = BlockType.DIRT; 
                } else if (y < lakeSurface && y > lakeSurface - 2) {
                     blocks[idx] = BlockType.AIR; 
                }
           }
           continue;
       }
       
       // Desert Terrain Override
       if (x < desertEndX) {
           const h = surfaceHeight[x];
           for (let y = 0; y < WORLD_HEIGHT; y++) {
               const idx = y * WORLD_WIDTH + x;
               if (y >= h && y < h + 5) {
                   blocks[idx] = BlockType.SAND;
               } else if (y >= h + 5 && y < h + 8) {
                   blocks[idx] = BlockType.SAND; // Deep sand
               }
           }
       }
       
       // Snow Terrain Override
       if (x > snowStartX) {
           const h = surfaceHeight[x];
           // Make mountains higher in snow biome
           const mountainBoost = Math.floor(smoothNoise(x, noiseSeed + 200, 20) * 20);
           const newH = Math.max(10, h - mountainBoost); // Higher Y is lower value
           surfaceHeight[x] = newH;
           
           for (let y = 0; y < WORLD_HEIGHT; y++) {
               const idx = y * WORLD_WIDTH + x;
               if (y === newH) {
                   blocks[idx] = BlockType.SNOWY_GRASS;
               } else if (y > newH && y < newH + 4) {
                   blocks[idx] = BlockType.DIRT;
               } else if (y >= newH + 4 && y <= h + 4) { // Fill gap if we raised terrain
                   blocks[idx] = BlockType.STONE;
               } else if (y < newH && y >= h) { // Clear air if we raised terrain
                   blocks[idx] = BlockType.AIR;
               }
           }
       }
  }

  // 2. Ore Generation
  // User Y = 64 - (InternalY - INTERNAL_SURFACE_Y)
  // InternalY = INTERNAL_SURFACE_Y + 64 - UserY
  // INTERNAL_SURFACE_Y = 300
  // DEEP_SLATE_LEVEL = 364 (User Y=0)

  for (let cx = 0; cx < WORLD_WIDTH; cx += ORE_CHUNK_SIZE) {
      // COAL (Layer 50 -> Internal 314. Common everywhere)
      generateOreCluster(blocks, BlockType.COAL_ORE, cx, 0.8, INTERNAL_SURFACE_Y + 10, WORLD_HEIGHT - 10, 5, 10, rng);
      // COAL BOOST (Layer 50)
      generateOreCluster(blocks, BlockType.COAL_ORE, cx, 0.6, INTERNAL_SURFACE_Y + 10, INTERNAL_SURFACE_Y + 20, 4, 8, rng);

      // COPPER (Layer 30 -> Internal 334. Surface to Deep Slate)
      generateOreCluster(blocks, BlockType.COPPER_ORE, cx, 0.9, INTERNAL_SURFACE_Y + 20, DEEP_SLATE_LEVEL + 20, 4, 8, rng);
      // COPPER BOOST (Layer 30)
      generateOreCluster(blocks, BlockType.COPPER_ORE, cx, 0.7, INTERNAL_SURFACE_Y + 30, INTERNAL_SURFACE_Y + 40, 4, 8, rng);

      // IRON (Layer 15 -> Internal 349. More abundant here)
      generateOreCluster(blocks, BlockType.IRON_ORE, cx, 0.75, INTERNAL_SURFACE_Y + 40, DEEP_SLATE_LEVEL + 50, 4, 7, rng);
      // IRON BOOST (Layer 15)
      generateOreCluster(blocks, BlockType.IRON_ORE, cx, 0.6, INTERNAL_SURFACE_Y + 45, INTERNAL_SURFACE_Y + 55, 4, 7, rng);

      // GOLD (Layer 0 and -1 -> Internal 364 to 365)
      generateOreCluster(blocks, BlockType.GOLD_ORE, cx, 0.6, DEEP_SLATE_LEVEL, DEEP_SLATE_LEVEL + 2, 3, 6, rng);
      // GOLD BOOST
      generateOreCluster(blocks, BlockType.GOLD_ORE, cx, 0.4, DEEP_SLATE_LEVEL, DEEP_SLATE_LEVEL + 2, 3, 6, rng);

      // DIAMOND (Layer -30 -> Internal 394)
      generateOreCluster(blocks, BlockType.DIAMOND_ORE, cx, 0.4, DEEP_SLATE_LEVEL + 28, DEEP_SLATE_LEVEL + 32, 2, 5, rng);
      // DIAMOND BOOST
      generateOreCluster(blocks, BlockType.DIAMOND_ORE, cx, 0.3, DEEP_SLATE_LEVEL + 28, DEEP_SLATE_LEVEL + 32, 2, 5, rng);

      // TITANIUM (Layer -100 -> Internal 464)
      generateOreCluster(blocks, BlockType.TITANIUM_ORE, cx, 0.3, DEEP_SLATE_LEVEL + 98, DEEP_SLATE_LEVEL + 102, 2, 4, rng);
      // TITANIUM BOOST
      generateOreCluster(blocks, BlockType.TITANIUM_ORE, cx, 0.25, DEEP_SLATE_LEVEL + 98, DEEP_SLATE_LEVEL + 102, 2, 4, rng);

      // URANIUM (Layer -200 down to Bedrock -> Internal 564 to 614)
      generateOreCluster(blocks, BlockType.URANIUM_ORE, cx, 0.2, DEEP_SLATE_LEVEL + 200, WORLD_HEIGHT - 2, 2, 3, rng);
      // URANIUM BOOST
      generateOreCluster(blocks, BlockType.URANIUM_ORE, cx, 0.15, DEEP_SLATE_LEVEL + 200, WORLD_HEIGHT - 2, 2, 3, rng);
  }

  // 3. Caves (Start deeper, Adjusted Sizes)
  const numCaves = 160; // Increased significantly for 1000x614 map to ensure density
  const avgSurface = INTERNAL_SURFACE_Y;
  const caveStartDepth = avgSurface + 20; 
  
  let spikeCavesRemaining = 2; // Spikes Biome: only 2 per map

  for(let c=0; c<numCaves; c++) {
      const caveStartX = Math.floor(rng.next() * WORLD_WIDTH);
      let caveY = Math.floor(rng.next() * (WORLD_HEIGHT - caveStartDepth - 20)) + caveStartDepth;
      
      // Determine what type of cave this is
      let caveBiome: 'NORMAL' | 'SPIKES' | 'MOSS' | 'WEBS' = 'NORMAL';
      
      // Spike biome: Standard stone region (above deep slate)
      if (caveY <= DEEP_SLATE_LEVEL && spikeCavesRemaining > 0 && rng.next() > 0.8) {
          caveBiome = 'SPIKES';
          spikeCavesRemaining--;
      } 
      // Moss biome: middle transition (around deepslate start)
      else if (caveY > DEEP_SLATE_LEVEL - 20 && caveY < DEEP_SLATE_LEVEL + 40 && rng.next() > 0.8) {
          caveBiome = 'MOSS';
      }
      // Web biome: Deep slate layer or deeper
      else if (caveY > DEEP_SLATE_LEVEL && rng.next() > 0.85) {
          caveBiome = 'WEBS';
      }

      if (caveBiome === 'NORMAL') {
          for (let step = 0; step < 250; step++) {
              caveY += (rng.next() - 0.5) * 4;
              const currentCaveX = (caveStartX + (Math.sin(step * 0.1) * 10) + (step * (rng.next() > 0.5 ? 1 : -1))) % WORLD_WIDTH;
              
              let radius = 2 + rng.next() * 3;
              if (caveY <= DEEP_SLATE_LEVEL) radius = 1 + rng.next() * 2; 
              if (caveY > DEEP_SLATE_LEVEL) radius = 1.5 + rng.next() * 1.5; 

              for (let cx = Math.floor(currentCaveX - radius); cx <= Math.floor(currentCaveX + radius); cx++) {
                  for (let cy = Math.floor(caveY - radius); cy <= Math.floor(caveY + radius); cy++) {
                      let safeX = cx;
                      if (safeX < 0) safeX += WORLD_WIDTH;
                      if (safeX >= WORLD_WIDTH) safeX -= WORLD_WIDTH;
                      if (cy > 0 && cy < WORLD_HEIGHT - 2) {
                          const dx = cx - currentCaveX;
                          const dy = cy - caveY;
                          if (dx*dx + dy*dy < radius*radius) {
                              if (cy > surfaceHeight[safeX] + 5) {
                                  blocks[cy * WORLD_WIDTH + safeX] = BlockType.AIR;
                              }
                          }
                      }
                  }
              }
          }
      } else {
          // Circular biome room
          const roomRadius = 10 + rng.next() * 5; // Large radius
          for (let cx = Math.floor(caveStartX - roomRadius); cx <= Math.floor(caveStartX + roomRadius); cx++) {
              for (let cy = Math.floor(caveY - roomRadius); cy <= Math.floor(caveY + roomRadius); cy++) {
                  let safeX = cx;
                  if (safeX < 0) safeX += WORLD_WIDTH;
                  if (safeX >= WORLD_WIDTH) safeX -= WORLD_WIDTH;
                  if (cy > surfaceHeight[safeX] + 15 && cy < WORLD_HEIGHT - 2) {
                      const dx = cx - caveStartX;
                      const dy = cy - caveY;
                      const r = roomRadius + (smoothNoise(cx, noiseSeed, 10) * 4);
                      if (dx*dx + dy*dy < r*r) {
                           blocks[cy * WORLD_WIDTH + safeX] = BlockType.AIR;
                      }
                  }
              }
          }
          // Pass 2: Decorate
          for (let cx = Math.floor(caveStartX - roomRadius); cx <= Math.floor(caveStartX + roomRadius); cx++) {
              for (let cy = Math.floor(caveY - roomRadius); cy <= Math.floor(caveY + roomRadius); cy++) {
                  let safeX = cx;
                  if (safeX < 0) safeX += WORLD_WIDTH;
                  if (safeX >= WORLD_WIDTH) safeX -= WORLD_WIDTH;
                  const idx = cy * WORLD_WIDTH + safeX;
                  
                  if (blocks[idx] === BlockType.AIR && cy > surfaceHeight[safeX] + 15 && cy < WORLD_HEIGHT - 2) {
                      if (caveBiome === 'SPIKES') {
                          if (rng.next() < 0.1 && blocks[(cy + 1) * WORLD_WIDTH + safeX] !== BlockType.AIR && blocks[(cy + 1) * WORLD_WIDTH + safeX] !== BlockType.SPIKE) {
                              blocks[idx] = BlockType.SPIKE;
                              let spikeHeight = 1 + Math.floor(rng.next() * 4);
                              for (let h = 1; h <= spikeHeight; h++) {
                                  if (cy - h > 0 && blocks[(cy - h) * WORLD_WIDTH + safeX] === BlockType.AIR) blocks[(cy - h) * WORLD_WIDTH + safeX] = BlockType.SPIKE;
                              }
                          } else if (rng.next() < 0.1 && blocks[(cy - 1) * WORLD_WIDTH + safeX] !== BlockType.AIR && blocks[(cy - 1) * WORLD_WIDTH + safeX] !== BlockType.SPIKE) {
                              blocks[idx] = BlockType.SPIKE;
                              let spikeHeight = 1 + Math.floor(rng.next() * 4);
                              for (let h = 1; h <= spikeHeight; h++) {
                                  if (cy + h < WORLD_HEIGHT && blocks[(cy + h) * WORLD_WIDTH + safeX] === BlockType.AIR) blocks[(cy + h) * WORLD_WIDTH + safeX] = BlockType.SPIKE;
                              }
                          }
                      } else if (caveBiome === 'MOSS') {
                           if (blocks[(cy + 1) * WORLD_WIDTH + safeX] !== BlockType.AIR) {
                               if (rng.next() < 0.5) blocks[idx] = BlockType.MOSS;
                           } else if (blocks[(cy - 1) * WORLD_WIDTH + safeX] !== BlockType.AIR && blocks[(cy - 1) * WORLD_WIDTH + safeX] !== BlockType.VINES && rng.next() < 0.2) {
                               let dropLen = 2 + Math.floor(rng.next() * 5);
                               for (let d = 0; d <= dropLen; d++) {
                                   if (cy + d < WORLD_HEIGHT && blocks[(cy + d) * WORLD_WIDTH + safeX] === BlockType.AIR) blocks[(cy + d) * WORLD_WIDTH + safeX] = BlockType.VINES;
                                   else break;
                               }
                           }
                      } else if (caveBiome === 'WEBS') {
                           if (rng.next() < 0.08) blocks[idx] = BlockType.COBWEB;
                      }
                  }
              }
          }
          // Ensure it connects to the rest
          for(let step = 0; step < 100; step++) {
               caveY += (rng.next() - 0.5) * 4;
               const currentCaveX = (caveStartX + (Math.sin(step * 0.1) * 10) + (step * (rng.next() > 0.5 ? 1 : -1))) % WORLD_WIDTH;
               let radius = 2;
               for (let cx = Math.floor(currentCaveX - radius); cx <= Math.floor(currentCaveX + radius); cx++) {
                   for (let cy = Math.floor(caveY - radius); cy <= Math.floor(caveY + radius); cy++) {
                       let safeX = cx;
                       if (safeX < 0) safeX += WORLD_WIDTH;
                       if (safeX >= WORLD_WIDTH) safeX -= WORLD_WIDTH;
                       if (cy > surfaceHeight[safeX] + 5 && cy < WORLD_HEIGHT - 2) {
                           const dx = cx - currentCaveX;
                           const dy = cy - caveY;
                           if (dx*dx + dy*dy < radius*radius) blocks[cy * WORLD_WIDTH + safeX] = BlockType.AIR;
                       }
                   }
               }
           }
      }
  }
  
  // 3.5 Rare Structure: Uranium Altar (Forest Only)
  // Try to place it once
  let altarPlaced = false;
  let attempts = 0;
  while (!altarPlaced && attempts < 100) {
      // Forest starts at 500
      const sx = 550 + Math.floor(rng.next() * (WORLD_WIDTH - 600)); 
      const sy = surfaceHeight[sx];
      
      // Check if flat enough (3 blocks wide)
      if (Math.abs(surfaceHeight[sx] - surfaceHeight[sx+1]) < 2 && Math.abs(surfaceHeight[sx] - surfaceHeight[sx+2]) < 2) {
          // Place 3 Uranium Blocks
          blocks[(sy - 1) * WORLD_WIDTH + sx] = BlockType.URANIUM_BLOCK;
          blocks[(sy - 1) * WORLD_WIDTH + sx + 1] = BlockType.URANIUM_BLOCK;
          blocks[(sy - 1) * WORLD_WIDTH + sx + 2] = BlockType.URANIUM_BLOCK;
          
          // Clear space above
          for(let i=0; i<3; i++) {
             blocks[(sy - 2) * WORLD_WIDTH + sx + i] = BlockType.AIR;
             blocks[(sy - 3) * WORLD_WIDTH + sx + i] = BlockType.AIR;
          }
          altarPlaced = true;
          console.log(`Uranium Altar placed at X: ${sx}, Y: ${sy}`);
      }
      attempts++;
  }

  // 4. Vegetation
  for (let x = 0; x < WORLD_WIDTH; x++) {
      // Skip lake/river area
      if ((x >= lakeStartX - 2 && x <= lakeEndX + 2) || (x >= riverStartX - 2 && x <= riverEndX + 2)) continue;

      let groundY = -1;
      for(let y=0; y<WORLD_HEIGHT; y++) {
          const b = blocks[y * WORLD_WIDTH + x];
          if (b === BlockType.GRASS || b === BlockType.DARK_GRASS || b === BlockType.DIRT || b === BlockType.STONE || b === BlockType.SAND) {
              groundY = y;
              break;
          }
          if (b === BlockType.WATER || b === BlockType.AIR || b === BlockType.URANIUM_BLOCK) continue;
      }

      if (groundY !== -1) {
        const groundBlock = blocks[groundY * WORLD_WIDTH + x];
        
        // DESERT VEGETATION
        if (x < desertEndX && groundBlock === BlockType.SAND && blocks[(groundY-1)*WORLD_WIDTH + x] === BlockType.AIR) {
            const r = rng.next();
            // Cactus
            if (r < 0.05) {
                const height = 2 + Math.floor(rng.next() * 3);
                for(let i=1; i<=height; i++) {
                    blocks[(groundY - i) * WORLD_WIDTH + x] = BlockType.CACTUS;
                }
            } 
            // Dry Leaves (Dead Bushes)
            else if (r < 0.15) {
                blocks[(groundY - 1) * WORLD_WIDTH + x] = BlockType.DRY_LEAVES;
            }
        }
        // NORMAL VEGETATION
        else if ((groundBlock === BlockType.GRASS || groundBlock === BlockType.DARK_GRASS) && blocks[(groundY-1)*WORLD_WIDTH + x] === BlockType.AIR) {
            const r = rng.next();
            const isForest = x >= 500;

            // Trees
            if (r < (isForest ? 0.08 : 0.05) && x > 2 && x < WORLD_WIDTH - 2) {
                const heightAdd = isForest ? Math.floor(rng.next() * 4) + 4 : Math.floor(rng.next() * 2);
                const treeHeight = 4 + heightAdd; // Forest trees 8-12, Normal 4-6
                const logType = isForest ? BlockType.DARK_WOOD : BlockType.WOOD;
                const leafType = isForest ? BlockType.DARK_LEAVES : BlockType.LEAVES;

                for (let i = 1; i <= treeHeight; i++) {
                    blocks[(groundY - i) * WORLD_WIDTH + x] = logType;
                }
                
                const leafRadius = isForest ? 3 : 2;
                
                for (let lx = x - leafRadius; lx <= x + leafRadius; lx++) {
                    for (let ly = groundY - treeHeight - leafRadius; ly <= groundY - treeHeight; ly++) {
                        const lIdx = ly * WORLD_WIDTH + lx;
                        if (lIdx >= 0 && blocks[lIdx] === BlockType.AIR) {
                            if (lx !== x || ly < groundY - treeHeight) {
                                blocks[lIdx] = leafType;
                            }
                        }
                    }
                }
            } 
            // Bushes
            else if (r < 0.08) {
                blocks[(groundY - 1) * WORLD_WIDTH + x] = BlockType.BERRY_BUSH; // Cherry
            }
            else if (r < 0.11) {
                blocks[(groundY - 1) * WORLD_WIDTH + x] = BlockType.SEED_BUSH; // Seeds
            }
            else if (r < 0.15) {
                blocks[(groundY - 1) * WORLD_WIDTH + x] = BlockType.BUSH; // Generic
            }
            // Flowers
            else if (r < 0.18) {
                const flowerR = rng.next();
                if (flowerR < 0.33) blocks[(groundY - 1) * WORLD_WIDTH + x] = BlockType.FLOWER_RED;
                else if (flowerR < 0.66) blocks[(groundY - 1) * WORLD_WIDTH + x] = BlockType.FLOWER_GREEN;
                else blocks[(groundY - 1) * WORLD_WIDTH + x] = BlockType.FLOWER_BLUE;
            }
        }
        // SNOW VEGETATION
        else if (groundBlock === BlockType.SNOWY_GRASS && blocks[(groundY-1)*WORLD_WIDTH + x] === BlockType.AIR) {
            const r = rng.next();
            // Trees
            if (r < 0.08 && x > 2 && x < WORLD_WIDTH - 2) {
                const heightAdd = Math.floor(rng.next() * 4) + 4;
                const treeHeight = 4 + heightAdd;
                const logType = BlockType.DARK_WOOD;
                const leafType = BlockType.DARK_LEAVES;

                for (let i = 1; i <= treeHeight; i++) {
                    blocks[(groundY - i) * WORLD_WIDTH + x] = logType;
                }
                
                const leafRadius = 3;
                
                for (let lx = x - leafRadius; lx <= x + leafRadius; lx++) {
                    for (let ly = groundY - treeHeight - leafRadius; ly <= groundY - treeHeight; ly++) {
                        const lIdx = ly * WORLD_WIDTH + lx;
                        if (lIdx >= 0 && blocks[lIdx] === BlockType.AIR) {
                            if (lx !== x || ly < groundY - treeHeight) {
                                blocks[lIdx] = leafType;
                            }
                        }
                    }
                }
            } 
        }
      }
  }

  // Generate Abandoned Houses
  const npcSpawns: {x: number, y: number}[] = [];
  const initialChests: {x: number, y: number, items: {id: number | string, count: number, type: 'BLOCK' | 'ITEM'}[]}[] = [];
  
  let housesGenerated = 0;
  let houseAttempts = 0;
  while (housesGenerated < 2 && houseAttempts < 100) {
      houseAttempts++;
      const hx = Math.floor(rng.next() * (WORLD_WIDTH - 40)) + 20;
      // Find surface
      let hy = 0;
      for (let y = 0; y < WORLD_HEIGHT; y++) {
          const block = blocks[y * WORLD_WIDTH + hx];
          if (block !== BlockType.AIR && block !== BlockType.WATER && block !== BlockType.LEAVES && block !== BlockType.DARK_LEAVES && block !== BlockType.SNOWY_LEAVES) {
              hy = y;
              break;
          }
      }
      
      // Check if flat enough
      let isFlat = true;
      for (let dx = -4; dx <= 4; dx++) {
          let localY = 0;
          for (let y = 0; y < WORLD_HEIGHT; y++) {
              const block = blocks[y * WORLD_WIDTH + (hx + dx)];
              if (block !== BlockType.AIR && block !== BlockType.WATER && block !== BlockType.LEAVES && block !== BlockType.DARK_LEAVES && block !== BlockType.SNOWY_LEAVES) {
                  localY = y;
                  break;
              }
          }
          if (Math.abs(localY - hy) > 2) {
              isFlat = false;
              break;
          }
      }
      
      if (isFlat && hy > 0) {
          // Build house
          const width = 7;
          const height = 5;
          const startX = hx - 3;
          const startY = hy - height;
          
          for (let y = startY; y <= hy; y++) {
              for (let x = startX; x < startX + width; x++) {
                  const idx = y * WORLD_WIDTH + x;
                  if (y === hy) {
                      blocks[idx] = BlockType.PLANKS; // Floor
                  } else if (x === startX || x === startX + width - 1 || y === startY) {
                      blocks[idx] = BlockType.PLANKS; // Walls and roof
                  } else {
                      blocks[idx] = BlockType.AIR; // Interior
                  }
              }
          }
          
          // Door
          blocks[(hy - 1) * WORLD_WIDTH + startX] = BlockType.AIR;
          blocks[(hy - 2) * WORLD_WIDTH + startX] = BlockType.AIR;
          
          // Furniture
          blocks[(hy - 1) * WORLD_WIDTH + (startX + 1)] = BlockType.BED;
          blocks[(hy - 1) * WORLD_WIDTH + (startX + width - 2)] = BlockType.CHEST;
          blocks[(hy - 1) * WORLD_WIDTH + (startX + width - 3)] = BlockType.FURNACE;
          blocks[(hy - 1) * WORLD_WIDTH + (startX + width - 4)] = BlockType.CRAFTING_TABLE;
          
          // Loot
          const loot = [];
          if (rng.next() > 0.5) loot.push({ id: 'iron_ingot', count: Math.floor(rng.next() * 5) + 1, type: 'ITEM' as const });
          if (rng.next() > 0.7) loot.push({ id: 'gold_ingot', count: Math.floor(rng.next() * 3) + 1, type: 'ITEM' as const });
          if (rng.next() > 0.3) loot.push({ id: 'cooked_meat', count: Math.floor(rng.next() * 5) + 1, type: 'ITEM' as const });
          if (rng.next() > 0.8) loot.push({ id: 'iron_sword', count: 1, type: 'ITEM' as const });
          if (rng.next() > 0.9) loot.push({ id: 'diamond', count: Math.floor(rng.next() * 2) + 1, type: 'ITEM' as const });
          
          initialChests.push({ x: startX + width - 2, y: hy - 1, items: loot });
          
          // NPC Spawn
          npcSpawns.push({ x: startX + Math.floor(width / 2), y: hy - 1 });
          
          housesGenerated++;
      }
  }

  return { width: WORLD_WIDTH, height: WORLD_HEIGHT, blocks, light, npcSpawns, initialChests };
}

function generateOreCluster(blocks: number[], oreType: BlockType, startX: number, probability: number, minDepth: number, maxDepth: number, minSize: number, maxSize: number, rng: SeededRNG) {
    if (rng.next() > probability) return;

    const x = Math.min(Math.max(0, startX + Math.floor(rng.next() * ORE_CHUNK_SIZE)), WORLD_WIDTH - 1);
    const y = Math.min(Math.max(0, minDepth + Math.floor(rng.next() * (maxDepth - minDepth))), WORLD_HEIGHT - 1);
    const idx = y * WORLD_WIDTH + x;

    const target = blocks[idx];
    if (target === BlockType.STONE || target === BlockType.DIRT || target === BlockType.DEEP_STONE) {
        blocks[idx] = oreType;
        const size = Math.floor(rng.next() * (maxSize - minSize + 1)) + minSize;
        
        for(let i=0; i<size; i++) {
            const dx = Math.floor(rng.next() * 3) - 1;
            const dy = Math.floor(rng.next() * 3) - 1;
            const nx = x + dx;
            const ny = y + dy;
            if(nx >= 0 && nx < WORLD_WIDTH && ny >= 0 && ny < WORLD_HEIGHT) {
                const nIdx = ny * WORLD_WIDTH + nx;
                const nTarget = blocks[nIdx];
                if(nTarget === BlockType.STONE || nTarget === BlockType.DIRT || nTarget === BlockType.DEEP_STONE) {
                    blocks[nIdx] = oreType;
                }
            }
        }
    }
}
