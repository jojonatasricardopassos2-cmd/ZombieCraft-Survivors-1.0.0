
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


export const getBiome = (x: number, noiseSeed: number): string => {
    if (x < 150 || x > WORLD_WIDTH - 150) return 'beach';
    const biomeNoise = smoothNoise(Math.floor(x / 500) * 500, noiseSeed + 1000, 2000);
    const val = Math.abs(biomeNoise * 100) % 6;
    if (val < 1.2) return 'plains';
    if (val < 2.0) return 'desert';
    if (val < 3.2) return 'forest';
    if (val < 3.7) return 'river'; // Reduced river from 1.0 size to 0.5 size
    if (val < 4.8) return 'golden_forest';
    return 'snow';
};

export function generateWorld(seedInput: number): WorldData {
  const blocks = new Array(WORLD_WIDTH * WORLD_HEIGHT).fill(BlockType.AIR);
  const light = new Array(WORLD_WIDTH * WORLD_HEIGHT).fill(0);
  
  const rng = new SeededRNG(seedInput);
  const noiseSeed = seedInput; 

  // Surface generation
  const surfaceHeight = new Array(WORLD_WIDTH);
  const biomeMap = new Array(WORLD_WIDTH);
  for (let x = 0; x < WORLD_WIDTH; x++) {
    biomeMap[x] = getBiome(x, noiseSeed);
    let baseHeight = INTERNAL_SURFACE_Y; 
    let variation = Math.floor(
      smoothNoise(x, noiseSeed, 30) * 15 + 
      smoothNoise(x, noiseSeed + 100, 10) * 5
    );
    
    // Mountains in snow? Make it subtract from height so the terrain goes UP (lower Y)
    if (biomeMap[x] === 'snow') {
        variation -= Math.floor(smoothNoise(x, noiseSeed + 200, 50) * 20);
    } else if (biomeMap[x] === 'river') {
        // Drop the terrain to make a river bed
        variation += 10;
        // make it more flat
        variation = Math.floor(variation * 0.2) + 15;
    }
    
    // Ocean bounds (last 300 blocks)
    const oceanBorder = 300;
    if (x < oceanBorder) {
        baseHeight += Math.floor(((oceanBorder - x) / oceanBorder) * 40); // slope down
    } else if (x > WORLD_WIDTH - oceanBorder) {
        baseHeight += Math.floor(((x - (WORLD_WIDTH - oceanBorder)) / oceanBorder) * 40); // slope down
    }

    surfaceHeight[x] = baseHeight + variation;
  }

  // 1. Basic Solid Terrain
  for (let x = 0; x < WORLD_WIDTH; x++) {
    const h = surfaceHeight[x];
    const biome = biomeMap[x];
    
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
          if (biome === 'forest') blockType = BlockType.DARK_GRASS;
          else if (biome === 'snow') blockType = BlockType.SNOWY_GRASS;
          else if (biome === 'desert' || biome === 'beach') blockType = BlockType.SAND;
          else if (biome === 'river') blockType = BlockType.WET_SAND;
          else if (biome === 'golden_forest') blockType = BlockType.GOLDEN_GRASS;
          else blockType = BlockType.GRASS;
      } else if (y > h && y < h + 4) {
          if (biome === 'desert' || biome === 'beach') blockType = BlockType.SAND;
          else if (biome === 'river') blockType = BlockType.STONE;
          else blockType = BlockType.DIRT;
      } else if (y >= h + 4) {
          if (y > deepThreshold) {
              blockType = BlockType.DEEP_STONE;
          } else {
              blockType = BlockType.STONE;
          }
      }
      
      // Oceans on the edges and Rivers
      if (blockType === BlockType.AIR) {
          const isOcean = y > h && y > INTERNAL_SURFACE_Y + 10;
          const isRiverWater = biome === 'river' && y > INTERNAL_SURFACE_Y && y <= h; 
          // Wait, 'h' is the river bed, it's pushed down. The water level should be flat.
          
          let waterLevel = INTERNAL_SURFACE_Y + 10;
          if (biome === 'river') waterLevel = INTERNAL_SURFACE_Y + 5;
          
          if (y > waterLevel && y <= h + (biome==='river' ? 15 : 0) ) {
              // wait, if y > waterLevel AND blockType==AIR, AIR means it's above ground... 
          }
      }
      
      // Simple water logic
      if (blockType === BlockType.AIR) {
         let waterLevel = INTERNAL_SURFACE_Y + 10; // Global water level
         if (biome === 'river') waterLevel = INTERNAL_SURFACE_Y + 2; 
         if (y > waterLevel) {
              if (y === waterLevel + 1 && biome === 'snow') blockType = BlockType.ICE;
              else blockType = BlockType.WATER;
         }
      }

      blocks[idx] = blockType;
    }
  }

  // Surface Lava Pools
  for (let pool = 0; pool < 5; pool++) {
      const lx = Math.floor(rng.next() * (WORLD_WIDTH - 100)) + 50;
      const ly = surfaceHeight[lx];
      if (ly < INTERNAL_SURFACE_Y - 5 || ly > INTERNAL_SURFACE_Y + 15) continue; // Only flat-ish ground
      if (lx > 830) continue; // No lava in snow
      
      const width = 4 + Math.floor(rng.next() * 5);
      const depth = 2 + Math.floor(rng.next() * 2);
      
      for (let px = lx - width; px <= lx + width; px++) {
          for (let py = ly - 1; py <= ly + depth + 1; py++) {
              // bounds check
              if (px < 0 || px >= WORLD_WIDTH || py < 0 || py >= WORLD_HEIGHT) continue;

              const dist = Math.sqrt(Math.pow(px - lx, 2) + Math.pow(py - ly, 2));
              const idx = py * WORLD_WIDTH + px;
              if (dist < width - 1 && py > ly) {
                  blocks[idx] = BlockType.LAVA;
              } else if (dist <= width && py >= ly - 1) {
                  blocks[idx] = BlockType.STONE; // Stone border
              }
          }
      }
  }

  // Golden Forest Crystal Lakes
  for (let pool = 0; pool < 15; pool++) {
      const lx = Math.floor(rng.next() * (WORLD_WIDTH - 100)) + 50;
      const biome = getBiome(lx, noiseSeed);
      if (biome !== 'golden_forest') continue;
      
      const ly = surfaceHeight[lx];
      
      const width = 3 + Math.floor(rng.next() * 3);
      const depth = 1 + Math.floor(rng.next() * 2);
      
      for (let px = lx - width; px <= lx + width; px++) {
          for (let py = ly - 1; py <= ly + depth + 1; py++) {
              if (px < 0 || px >= WORLD_WIDTH || py < 0 || py >= WORLD_HEIGHT) continue;
              const dist = Math.sqrt(Math.pow((px - lx) * 1.5, 2) + Math.pow(py - ly, 2));
              const idx = py * WORLD_WIDTH + px;
              if (dist < width - 1 && py > ly) {
                  blocks[idx] = BlockType.WATER;
              } else if (dist <= width && py >= ly - 1) {
                  if (py > ly) {
                      blocks[idx] = BlockType.SAND; // Sandy border
                  } else {
                      blocks[idx] = BlockType.AIR; // Clear above water
                  }
              }
          }
      }
  }

  // Abandoned Houses and Ancient Ruins
  for (let c = 0; c < 25; c++) {
      const lx = Math.floor(rng.next() * (WORLD_WIDTH - 200)) + 100;
      const ly = surfaceHeight[lx];
      if (ly < INTERNAL_SURFACE_Y - 20 || ly > INTERNAL_SURFACE_Y + 15) continue; 
      if (biomeMap[lx] === 'river') continue;
      
      const isRuin = rng.next() > 0.6;
      const width = isRuin ? 4 : 5;
      const height = isRuin ? 3 : 4;
      
      // Clear area and build walls
      for (let px = lx - width; px <= lx + width; px++) {
          // Floor
          blocks[ly * WORLD_WIDTH + px] = isRuin ? BlockType.STONE : BlockType.PLANKS;
          
          for (let py = ly - height; py < ly; py++) {
              if (px === lx - width || px === lx + width) {
                  // Walls
                  if (isRuin && rng.next() < 0.3) {
                       blocks[py * WORLD_WIDTH + px] = BlockType.AIR; // Broken wall
                  } else {
                       blocks[py * WORLD_WIDTH + px] = isRuin ? BlockType.COBBLESTONE || BlockType.STONE : BlockType.WOOD;
                       if (isRuin && rng.next() < 0.2) blocks[py * WORLD_WIDTH + px] = BlockType.MOSS;
                  }
              } else {
                  blocks[py * WORLD_WIDTH + px] = BlockType.AIR; // Inside
              }
          }
      }
      // Roof
      if (!isRuin) {
          for (let px = lx - width - 1; px <= lx + width + 1; px++) {
              blocks[(ly - height - 1) * WORLD_WIDTH + px] = BlockType.PLANKS;
          }
          // Door
          blocks[(ly - 1) * WORLD_WIDTH + lx - width] = BlockType.AIR;
          blocks[(ly - 2) * WORLD_WIDTH + lx - width] = BlockType.AIR;
      }
      
      // Chest
      blocks[(ly - 1) * WORLD_WIDTH + lx] = BlockType.CHEST;
      if (!isRuin) {
          blocks[(ly - 1) * WORLD_WIDTH + lx + 1] = BlockType.TABLE;
          blocks[(ly - 1) * WORLD_WIDTH + lx + 2] = BlockType.CABINET;
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

      // GOLD
      generateOreCluster(blocks, BlockType.GOLD_ORE, cx, 0.8, DEEP_SLATE_LEVEL, DEEP_SLATE_LEVEL + 60, 4, 8, rng);
      generateOreCluster(blocks, BlockType.GOLD_ORE, cx, 0.6, DEEP_SLATE_LEVEL + 20, DEEP_SLATE_LEVEL + 60, 4, 8, rng);

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
          for (let cx = Math.floor(caveStartX - roomRadius - 5); cx <= Math.floor(caveStartX + roomRadius + 5); cx++) {
              for (let cy = Math.floor(caveY - roomRadius - 5); cy <= Math.floor(caveY + roomRadius + 5); cy++) {
                  let safeX = cx;
                  if (safeX < 0) safeX += WORLD_WIDTH;
                  if (safeX >= WORLD_WIDTH) safeX -= WORLD_WIDTH;
                  if (cy > surfaceHeight[safeX] + 15 && cy < WORLD_HEIGHT - 2) {
                      const dx = cx - caveStartX;
                      const dy = cy - caveY;
                      const r = roomRadius + (smoothNoise(cx, noiseSeed, 10) * 4);
                      const distSq = dx*dx + dy*dy;
                      if (distSq < r*r) {
                           blocks[cy * WORLD_WIDTH + safeX] = BlockType.AIR;
                      } else if (distSq < (r+2)*(r+2)) {
                           // Encircle with contrasting stone
                           blocks[cy * WORLD_WIDTH + safeX] = cy > DEEP_SLATE_LEVEL ? BlockType.STONE : BlockType.DEEP_STONE;
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

  // 4. Vegetation
  for (let x = 0; x < WORLD_WIDTH; x++) {
      let groundY = -1;
      for(let y=0; y<WORLD_HEIGHT; y++) {
          const b = blocks[y * WORLD_WIDTH + x];
          if (b === BlockType.GRASS || b === BlockType.DARK_GRASS || b === BlockType.DIRT || b === BlockType.STONE || b === BlockType.SAND || b === BlockType.GOLDEN_GRASS || b === BlockType.SNOWY_GRASS) {
              groundY = y;
              break;
          }
          if (b === BlockType.WATER || b === BlockType.AIR || b === BlockType.URANIUM_BLOCK) continue;
      }

      if (groundY !== -1) {
        const groundBlock = blocks[groundY * WORLD_WIDTH + x];
        
        // Scope variables for biome check
        let biome = getBiome(x, noiseSeed);

        // DESERT VEGETATION
        if (biome === 'desert' && groundBlock === BlockType.SAND && blocks[(groundY-1)*WORLD_WIDTH + x] === BlockType.AIR) {
            const r = rng.next();
            // Cactus
            if (r < 0.05) {
                const height = 2 + Math.floor(rng.next() * 3);
                for(let i=1; i<=height; i++) {
                    blocks[(groundY - i) * WORLD_WIDTH + x] = BlockType.CACTUS;
                }
            } 
            }
        // NORMAL VEGETATION
        else if ((groundBlock === BlockType.GRASS || groundBlock === BlockType.DARK_GRASS || groundBlock === BlockType.GOLDEN_GRASS || groundBlock === BlockType.SNOWY_GRASS) && blocks[(groundY-1)*WORLD_WIDTH + x] === BlockType.AIR) {
            const r = rng.next();
            const isForest = biome === 'forest';
            const isGolden = biome === 'golden_forest';
            const isSnow = biome === 'snow';

            // Trees
            if (r < (isForest ? 0.08 : 0.05) && x > 2 && x < WORLD_WIDTH - 3) {
                const isLargeTree = !isForest && rng.next() < 0.3; // 30% chance in plains
                const heightAdd = isForest ? Math.floor(rng.next() * 4) + 4 : Math.floor(rng.next() * 2);
                const treeHeight = 4 + heightAdd + (isLargeTree ? 2 : 0);
                const logType = isForest ? BlockType.DARK_WOOD : (isGolden ? BlockType.GOLDEN_WOOD : (isSnow ? BlockType.FROZEN_WOOD : BlockType.WOOD));
                const leafType = isForest ? BlockType.DARK_LEAVES : (isGolden ? BlockType.GOLDEN_LEAVES : (isSnow ? BlockType.DARK_LEAVES : BlockType.LEAVES));
                const appleLeafType = BlockType.APPLE_LEAVES; // Apple spawn in leaves

                const treeWidth = isLargeTree ? 2 : 1;
                
                for (let dx = 0; dx < treeWidth; dx++) {
                    for (let i = 1; i <= treeHeight; i++) {
                        blocks[(groundY - i) * WORLD_WIDTH + x + dx] = logType;
                    }
                }
                
                const leafRadius = isForest ? 3 : (isLargeTree ? 3 : 2);
                const centerLogX = isLargeTree ? x + 0.5 : x;
                
                for (let lx = x - leafRadius; lx <= x + treeWidth - 1 + leafRadius; lx++) {
                    for (let ly = groundY - treeHeight - leafRadius; ly <= groundY - treeHeight + (isLargeTree ? 1 : 0); ly++) {
                        const lIdx = ly * WORLD_WIDTH + lx;
                        if (lIdx >= 0 && blocks[lIdx] === BlockType.AIR) {
                            if (Math.abs(lx - centerLogX) > leafRadius - 0.5 && ly < groundY - treeHeight - leafRadius + 1) continue; // round corners
                            if (!isForest && !isGolden && !isSnow && rng.next() < 0.05) {
                                blocks[lIdx] = appleLeafType;
                            } else {
                                blocks[lIdx] = leafType;
                            }
                        }
                    }
                }
                
                // If we generated a large tree, skip the next column
                // but we can't easily skip x in this map mapping since x is standard loop,
                // so we just rely on tree overlapping being handled by blocks[lIdx] === AIR checks above.
            } 
            // Bushes
            else if (r < 0.08) {
                blocks[(groundY - 1) * WORLD_WIDTH + x] = BlockType.BERRY_BUSH; // Cherry
            }
            else if (r < 0.11) {
                blocks[(groundY - 1) * WORLD_WIDTH + x] = BlockType.SEED_BUSH; // Seeds
            }
            else if (r < 0.15) {
                blocks[(groundY - 1) * WORLD_WIDTH + x] = isGolden ? BlockType.GOLDEN_BUSH : BlockType.BUSH; // Generic
            }
            // Flowers and Tall Grass
            else if (r < 0.28) {
                const flowerR = rng.next();
                if (isGolden) {
                    if (flowerR < 0.60) blocks[(groundY - 1) * WORLD_WIDTH + x] = BlockType.GOLDEN_FLOWER;
                    else if (flowerR < 0.80) blocks[(groundY - 1) * WORLD_WIDTH + x] = BlockType.FLOWER_YELLOW; // More yellow
                    else blocks[(groundY - 1) * WORLD_WIDTH + x] = BlockType.TALL_GRASS;
                } else if (isSnow) {
                    if (flowerR < 0.2) blocks[(groundY - 1) * WORLD_WIDTH + x] = BlockType.FLOWER_BLUE;
                    else if (flowerR < 0.4) blocks[(groundY - 1) * WORLD_WIDTH + x] = BlockType.FLOWER_RED; // Maybe some contrast
                    else blocks[(groundY - 1) * WORLD_WIDTH + x] = BlockType.TALL_GRASS;
                } else {
                    if (flowerR < 0.1) blocks[(groundY - 1) * WORLD_WIDTH + x] = BlockType.FLOWER_RED;
                    else if (flowerR < 0.2) blocks[(groundY - 1) * WORLD_WIDTH + x] = BlockType.FLOWER_GREEN;
                    else if (flowerR < 0.3) blocks[(groundY - 1) * WORLD_WIDTH + x] = BlockType.FLOWER_BLUE;
                    else if (flowerR < 0.4) blocks[(groundY - 1) * WORLD_WIDTH + x] = BlockType.FLOWER_YELLOW;
                    else blocks[(groundY - 1) * WORLD_WIDTH + x] = BlockType.TALL_GRASS;
                }
            }
            // Fallen logs
            else if (r < 0.29 && isForest && x > 2 && x < WORLD_WIDTH - 2) {
                blocks[(groundY - 1) * WORLD_WIDTH + x] = BlockType.FALLEN_LOG;
                if (rng.next() < 0.5) blocks[(groundY - 1) * WORLD_WIDTH + x + 1] = BlockType.FALLEN_LOG;
            }
        }
      }
  }

  // Generate Abandoned Houses
  const npcSpawns: {x: number, y: number, type?: string}[] = [];
  const initialChests: {x: number, y: number, items: {id: number | string, count: number, type: 'BLOCK' | 'ITEM'}[]}[] = [];
  const structures: {name: string, x: number}[] = [];
  
  // Generate 1 Big City
  let cityGenerated = false;

  let attempts = 0;
  while (!cityGenerated && attempts < 100) {
      attempts++;
      const startX = Math.floor(rng.next() * (WORLD_WIDTH - 200)) + 100;
      let startY = 0;
      for (let y = 0; y < WORLD_HEIGHT; y++) {
          if (blocks[y * WORLD_WIDTH + startX] !== BlockType.AIR) {
              startY = y;
              break;
          }
      }
      
      if (startY > SEA_LEVEL - 5 && startY < SEA_LEVEL + 50) {
          structures.push({ name: 'cidade grande', x: startX });
          // Flatten land for 30 blocks
          for (let ix = 0; ix < 30; ix++) {
              let ground = startY;
              for(let iy=startY-10; iy<=startY; iy++) blocks[iy * WORLD_WIDTH + startX + ix] = BlockType.AIR;
              blocks[startY * WORLD_WIDTH + startX + ix] = BlockType.STONE;
          }
          
          // Build a 4-story building
          const bStartX = startX + 5;
          const bWidth = 15;
          
          for(let floor=0; floor<4; floor++) {
              const floorY = startY - 1 - (floor * 5);
              for(let ix = 0; ix < bWidth; ix++) {
                  blocks[floorY * WORLD_WIDTH + bStartX + ix] = BlockType.WOOD; // Floor
                  if (ix === 0 || ix === bWidth - 1) { // Walls
                      blocks[(floorY - 1) * WORLD_WIDTH + bStartX + ix] = BlockType.WALL_WOOD;
                      blocks[(floorY - 2) * WORLD_WIDTH + bStartX + ix] = BlockType.GLASS_BLUE;
                      blocks[(floorY - 3) * WORLD_WIDTH + bStartX + ix] = BlockType.GLASS_BLUE;
                      blocks[(floorY - 4) * WORLD_WIDTH + bStartX + ix] = BlockType.WALL_WOOD;
                  }
              }
              // Stairs
              if (floor < 3) {
                  blocks[(floorY - 1) * WORLD_WIDTH + bStartX + 2] = BlockType.LADDER;
                  blocks[(floorY - 2) * WORLD_WIDTH + bStartX + 2] = BlockType.LADDER;
                  blocks[(floorY - 3) * WORLD_WIDTH + bStartX + 2] = BlockType.LADDER;
                  blocks[(floorY - 4) * WORLD_WIDTH + bStartX + 2] = BlockType.LADDER;
                  blocks[(floorY - 5) * WORLD_WIDTH + bStartX + 2] = BlockType.AIR; // Hole in ceiling
              }
              // Door
              if (floor === 0) {
                  blocks[(floorY - 1) * WORLD_WIDTH + bStartX] = BlockType.DOOR_BOTTOM_CLOSED;
                  blocks[(floorY - 2) * WORLD_WIDTH + bStartX] = BlockType.DOOR_TOP_CLOSED;
                  blocks[(floorY - 1) * WORLD_WIDTH + bStartX + bWidth - 1] = BlockType.DOOR_BOTTOM_CLOSED;
                  blocks[(floorY - 2) * WORLD_WIDTH + bStartX + bWidth - 1] = BlockType.DOOR_TOP_CLOSED;
              }
              // Furniture
              blocks[(floorY - 1) * WORLD_WIDTH + bStartX + 4] = BlockType.BED;
              blocks[(floorY - 1) * WORLD_WIDTH + bStartX + 6] = BlockType.CHEST;
              initialChests.push({ x: bStartX + 6, y: floorY - 1, items: [{ id: 'diamond', count: 2, type: 'ITEM' }] });
              blocks[(floorY - 1) * WORLD_WIDTH + bStartX + 8] = BlockType.CABINET;
              blocks[(floorY - 1) * WORLD_WIDTH + bStartX + 10] = BlockType.TABLE;
          }
          // Roof
          const roofY = startY - 1 - (4 * 5);
          for(let ix = 0; ix < bWidth; ix++) {
              blocks[roofY * WORLD_WIDTH + bStartX + ix] = BlockType.ROOF_STONE;
          }

          npcSpawns.push({ x: startX + 15, y: startY - 2, type: 'QUEST_GIVER' });
          cityGenerated = true;
      }
  }

  // Generate 2 Farms
  let farmsGenerated = 0;
  attempts = 0;
  while (farmsGenerated < 2 && attempts < 200) {
      attempts++;
      const startX = Math.floor(rng.next() * (WORLD_WIDTH - 200)) + 100;
      let startY = 0;
      for (let y = 0; y < WORLD_HEIGHT; y++) {
          if (blocks[y * WORLD_WIDTH + startX] !== BlockType.AIR) {
              startY = y;
              break;
          }
      }
      
      if (getBiome(startX, rng.next()) === 'plains' && startY > SEA_LEVEL - 5 && startY < SEA_LEVEL + 50) {
          // Flatten land for 20 blocks
          for (let ix = 0; ix < 20; ix++) {
              let ground = startY;
              for(let iy=startY-5; iy<=startY; iy++) blocks[iy * WORLD_WIDTH + startX + ix] = BlockType.AIR;
              blocks[startY * WORLD_WIDTH + startX + ix] = BlockType.GRASS;
          }
          // Fence around
          for (let ix = 0; ix < 20; ix++) {
              if (ix === 0 || ix === 19) {
                  blocks[(startY - 1) * WORLD_WIDTH + startX + ix] = BlockType.FENCE;
              } else if (rng.next() > 0.5) {
                  // Crops inside
                  blocks[startY * WORLD_WIDTH + startX + ix] = BlockType.DIRT; // tilled
                  blocks[(startY - 1) * WORLD_WIDTH + startX + ix] = BlockType.CROP_WHEAT;
              }
          }
          // Animals spawn naturally, but we specify a farm center
          npcSpawns.push({ x: startX + 10, y: startY - 2, type: 'FARM_ANIMAL' });
          structures.push({ name: 'fazenda', x: startX });
          farmsGenerated++;
      }
  }

  return { width: WORLD_WIDTH, height: WORLD_HEIGHT, blocks, light, npcSpawns, initialChests, structures };
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
