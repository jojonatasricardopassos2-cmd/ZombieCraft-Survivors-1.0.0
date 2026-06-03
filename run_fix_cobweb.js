import fs from 'fs';

let content = fs.readFileSync('components/GameCanvas.tsx', 'utf8');

// Fix PINE_WOOD non-collidable
content = content.replace("BlockType.WALL_WOOD, BlockType.PINE_WOOD, BlockType.DOOR_BOTTOM", "BlockType.WALL_WOOD, BlockType.DOOR_BOTTOM");

// Add new non-collidables
content = content.replace("BlockType.SEED_BUSH,", "BlockType.SEED_BUSH, BlockType.COBWEB, BlockType.PINE_LEAVES, BlockType.FLOWER_YELLOW, BlockType.FLOWER_PURPLE,");

// Slow down logic when intersecting cobweb
const updateSpeedRegex = /if \(\(player as any\)\.freezeEndTime && \(\(player as any\)\.freezeEndTime > Date\.now\)\) speed \*= 0\.5;/;
const newSpeed = `if ((player as any).freezeEndTime && ((player as any).freezeEndTime > Date.now())) speed *= 0.5;
            
            // Check cobweb intersection
            const ptcx = Math.floor((player.x + player.width/2)/BLOCK_SIZE);
            const ptcy = Math.floor((player.y + player.height/2)/BLOCK_SIZE);
            if (world.blocks[ptcy * WORLD_WIDTH + ptcx] === BlockType.COBWEB) {
                speed *= 0.2;
                player.vy *= 0.5; // Also dampen vertical speed
            }`;
content = content.replace(updateSpeedRegex, newSpeed);

fs.writeFileSync('components/GameCanvas.tsx', content);
