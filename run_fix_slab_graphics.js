import fs from 'fs';

let content = fs.readFileSync('components/GameCanvas.tsx', 'utf8');

const regexSlabs = /else if \(block === BlockType\.SLAB_WOOD \|\| block === BlockType\.SLAB_STONE\) {\s*ctx\.fillRect\(x \* BLOCK_SIZE, y \* BLOCK_SIZE \+ 16, BLOCK_SIZE, 16\);\s*if \(block === BlockType\.SLAB_WOOD\) {\s*ctx\.fillStyle = 'rgba\(0,0,0,0\.1\)'; ctx\.fillRect\(x \* BLOCK_SIZE, y \* BLOCK_SIZE \+ 16, BLOCK_SIZE, 2\);\s*}\s*}/;

const betterSlabs = `else if (block === BlockType.SLAB_WOOD || block === BlockType.SLAB_STONE || block === BlockType.SLAB_CONCRETE) {
                            if (block === BlockType.SLAB_WOOD) {
                                ctx.fillStyle = '#8d6e63';
                                ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE + 16, BLOCK_SIZE, 16);
                                ctx.strokeStyle = '#5d4037';
                                ctx.lineWidth = 2;
                                ctx.strokeRect(x * BLOCK_SIZE, y * BLOCK_SIZE + 16, BLOCK_SIZE, 16);
                                ctx.fillStyle = '#a1887f'; ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE + 16, BLOCK_SIZE, 2);
                            } else if (block === BlockType.SLAB_STONE) {
                                ctx.fillStyle = '#9e9e9e';
                                ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE + 16, BLOCK_SIZE, 16);
                                ctx.strokeStyle = '#616161';
                                ctx.lineWidth = 1.5;
                                ctx.strokeRect(x * BLOCK_SIZE, y * BLOCK_SIZE + 16, BLOCK_SIZE, 16);
                            } else {
                                ctx.fillStyle = '#bdc3c7'; // Concrete default
                                ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE + 16, BLOCK_SIZE, 16);
                            }
                        }`;

content = content.replace(regexSlabs, betterSlabs);

fs.writeFileSync('components/GameCanvas.tsx', content);
