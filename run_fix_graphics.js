import fs from 'fs';

let content = fs.readFileSync('components/GameCanvas.tsx', 'utf8');

const regexNodes = /else if \(block === BlockType\.CABLE \|\| block === BlockType\.CABLE_ON \|\| block === BlockType\.LAMP \|\| block === BlockType\.LAMP_ON[^}]+}\s+else if \(block === BlockType\.LADDER\)/s;

const betterGraphics = `else if (block === BlockType.CABLE || block === BlockType.CABLE_ON) {
                        ctx.fillStyle = block === BlockType.CABLE_ON ? '#ff3333' : '#550000';
                        const wDown = y < WORLD_HEIGHT - 1 ? world.blocks[(y + 1) * WORLD_WIDTH + x] : BlockType.AIR;
                        const wLeft = x > 0 ? world.blocks[y * WORLD_WIDTH + x - 1] : BlockType.AIR;
                        const wRight = x < WORLD_WIDTH - 1 ? world.blocks[y * WORLD_WIDTH + x + 1] : BlockType.AIR;
                        const wUp = y > 0 ? world.blocks[(y - 1) * WORLD_WIDTH + x] : BlockType.AIR;

                        const isSolidBg = (b: number) => !NON_COLLIDABLE_BLOCKS.has(b) && b !== BlockType.CABLE;
                        const isNode = (b: number) => b === BlockType.CABLE || b === BlockType.CABLE_ON || b === BlockType.LAMP || b === BlockType.LAMP_ON || b === BlockType.BUTTON || b === BlockType.BUTTON_ON || b === BlockType.LEVER || b === BlockType.LEVER_ON;

                        let cx = x * BLOCK_SIZE + BLOCK_SIZE / 2 - 2;
                        let cy = y * BLOCK_SIZE + BLOCK_SIZE / 2 - 2;
                        
                        if (isSolidBg(wDown)) cy = y * BLOCK_SIZE + BLOCK_SIZE - 4;
                        else if (isSolidBg(wLeft)) cx = x * BLOCK_SIZE;
                        else if (isSolidBg(wRight)) cx = x * BLOCK_SIZE + BLOCK_SIZE - 4;
                        else if (isSolidBg(wUp)) cy = y * BLOCK_SIZE;

                        ctx.fillRect(cx, cy, 4, 4);

                        if (isNode(wLeft)) ctx.fillRect(x * BLOCK_SIZE, cy, cx - x * BLOCK_SIZE, 4);
                        if (isNode(wRight)) ctx.fillRect(cx + 4, cy, BLOCK_SIZE - (cx + 4 - x * BLOCK_SIZE), 4);
                        if (isNode(wUp)) ctx.fillRect(cx, y * BLOCK_SIZE, 4, cy - y * BLOCK_SIZE);
                        if (isNode(wDown)) ctx.fillRect(cx, cy + 4, 4, BLOCK_SIZE - (cy + 4 - y * BLOCK_SIZE));
                    }
                    else if (block === BlockType.LAMP || block === BlockType.LAMP_ON) {
                        const isOn = block === BlockType.LAMP_ON;
                        ctx.fillStyle = isOn ? '#fff9c4' : '#424242';
                        ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
                        ctx.strokeStyle = isOn ? '#fbc02d' : '#212121';
                        ctx.lineWidth = 2;
                        ctx.strokeRect(x * BLOCK_SIZE+2, y * BLOCK_SIZE+2, BLOCK_SIZE-4, BLOCK_SIZE-4);
                        if (isOn) {
                            ctx.fillStyle = '#fff59d';
                            ctx.fillRect(x * BLOCK_SIZE+8, y * BLOCK_SIZE+8, BLOCK_SIZE-16, BLOCK_SIZE-16);
                        }
                    }
                    else if (block === BlockType.BUTTON || block === BlockType.BUTTON_ON) {
                        const isOn = block === BlockType.BUTTON_ON;
                        ctx.fillStyle = '#616161';
                        // Draw attached to a wall if possible, else center
                        ctx.fillRect(x * BLOCK_SIZE + 10, y * BLOCK_SIZE + (isOn ? 26 : 24), 12, isOn ? 6 : 8);
                    }
                    else if (block === BlockType.LEVER || block === BlockType.LEVER_ON) {
                        const isOn = block === BlockType.LEVER_ON;
                        // Base
                        ctx.fillStyle = '#757575';
                        ctx.fillRect(x * BLOCK_SIZE + 8, y * BLOCK_SIZE + 24, 16, 8);
                        // Stick
                        ctx.fillStyle = '#8d6e63';
                        ctx.save();
                        ctx.translate(x * BLOCK_SIZE + 16, y * BLOCK_SIZE + 24);
                        ctx.rotate(isOn ? Math.PI/4 : -Math.PI/4);
                        ctx.fillRect(-2, -16, 4, 16);
                        ctx.restore();
                    }
                    else if (block === BlockType.LADDER)`;

content = content.replace(regexNodes, betterGraphics);

fs.writeFileSync('components/GameCanvas.tsx', content);
