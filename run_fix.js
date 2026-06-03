import fs from 'fs';
let code = fs.readFileSync('utils/world.ts', 'utf8');

const regex = /\/\/ 1\. Basic Solid Terrain[\s\S]*?(?=\/\/ Surface Lava Pools)/;

const newTerrain = `// 1. Basic Solid Terrain
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
          else if (biome === 'desert') blockType = BlockType.SAND;
          else blockType = BlockType.GRASS;
      } else if (y > h && y < h + 4) {
          if (biome === 'desert') blockType = BlockType.SAND;
          else blockType = BlockType.DIRT;
      } else if (y >= h + 4) {
          if (y > deepThreshold) {
              blockType = BlockType.DEEP_STONE;
          } else {
              blockType = BlockType.STONE;
          }
      }
      
      // Oceans on the edges
      if (blockType === BlockType.AIR && y > h && y > INTERNAL_SURFACE_Y + 10) {
          if (biome === 'snow' && y === h + 1) blockType = BlockType.ICE;
          else blockType = BlockType.WATER;
      }

      blocks[idx] = blockType;
    }
  }

  `;

code = code.replace(regex, newTerrain);
fs.writeFileSync('utils/world.ts', code);
console.log('done');
