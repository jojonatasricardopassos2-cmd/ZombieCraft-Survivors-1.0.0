import fs from 'fs';

let content = fs.readFileSync('components/GameCanvas.tsx', 'utf8');

content = content.replace(
    /BlockType\.WALL_WOOD,/g, 
    "BlockType.WALL_WOOD, BlockType.PINE_WOOD,"
);

const collisionRegex = /if \(b === BlockType\.SLAB_WOOD \|\| b === BlockType\.SLAB_STONE\) {/g;
const newCollision = `if (b === BlockType.FENCE) {
                        const fenceTop = y * BLOCK_SIZE - (BLOCK_SIZE * 0.5); // 1.5 blocks tall
                        if (ent.y + ent.height > y * BLOCK_SIZE && ent.y < y * BLOCK_SIZE + BLOCK_SIZE && ent.y + ent.height > fenceTop) {
                            return true;
                        }
                    } else if (b === BlockType.SLAB_WOOD || b === BlockType.SLAB_STONE) {`;

content = content.replace(collisionRegex, newCollision);

fs.writeFileSync('components/GameCanvas.tsx', content);
