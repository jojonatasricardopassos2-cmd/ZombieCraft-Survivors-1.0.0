import fs from 'fs';

let content = fs.readFileSync('utils/world.ts', 'utf8');

const houseGenRegex = /const npcSpawns: \{x: number, y: number\}\[\] = \[\];[\s\S]*?housesGenerated\+\+;\s*}\s*}\s*return \{ width: WORLD_WIDTH, height: WORLD_HEIGHT, blocks, light, npcSpawns, initialChests \};/;

const generateCitiesAndFarms = `const npcSpawns: {x: number, y: number, type?: string}[] = [];
  const initialChests: {x: number, y: number, items: {id: number | string, count: number, type: 'BLOCK' | 'ITEM'}[]}[] = [];
  
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
      
      if (startY > OCEAN_LEVEL - 5 && startY < OCEAN_LEVEL + 50) {
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
      
      if (getBiome(startX, rng.next()) === 'plains' && startY > OCEAN_LEVEL - 5 && startY < OCEAN_LEVEL + 50) {
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
          farmsGenerated++;
      }
  }

  return { width: WORLD_WIDTH, height: WORLD_HEIGHT, blocks, light, npcSpawns, initialChests };`;

content = content.replace(houseGenRegex, generateCitiesAndFarms);

fs.writeFileSync('utils/world.ts', content);
