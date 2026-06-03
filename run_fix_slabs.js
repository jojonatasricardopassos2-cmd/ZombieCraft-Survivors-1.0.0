import fs from 'fs';

let content = fs.readFileSync('components/GameCanvas.tsx', 'utf8');

const regex = /if \(b === BlockType\.SLAB_WOOD \|\| b === BlockType\.SLAB_STONE\) {[\s\S]*?return true;\s*}/;

const replacement = `if (b === BlockType.SLAB_WOOD || b === BlockType.SLAB_STONE) {
                        const blockTopHalfEnd = y * BLOCK_SIZE + 16;
                        if (ent.y + ent.height > blockTopHalfEnd && ent.y < y * BLOCK_SIZE + 32) {
                            return true;
                        }
                    }`;
content = content.replace(regex, replacement);

fs.writeFileSync('components/GameCanvas.tsx', content);
