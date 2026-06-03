import fs from 'fs';

let content = fs.readFileSync('components/GameCanvas.tsx', 'utf8');

const regex1 = /world: worldRef\.current/g;
content = content.replace(regex1, 'world: null // Temporarily disabled full world sync due to size');

const regex2 = /if \(options\.multiplayer\?\.mode === 'CLIENT' && payload\.world\)/g;
content = content.replace(regex2, 'if (false && options.multiplayer?.mode === "CLIENT" && payload.world)');

const regex3 = /} else if \(options\.multiplayer\?\.mode === 'CLIENT' && payload\.seed && !payload\.world\)/g;
content = content.replace(regex3, '} else if (options.multiplayer?.mode === "CLIENT" && payload.seed)');

fs.writeFileSync('components/GameCanvas.tsx', content);
