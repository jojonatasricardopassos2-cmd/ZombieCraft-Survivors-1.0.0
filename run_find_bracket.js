const fs = require('fs');
const content = fs.readFileSync('components/GameCanvas.tsx', 'utf8');

let depth = 0;
let lines = content.split('\n');
for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // basic brace counting
    for (let c of line) {
        if (c === '{') depth++;
        if (c === '}') depth--;
    }
    if (depth < 0) {
        console.log(`Unbalanced } at line ${i+1}: ${line}`);
        depth = 0; // reset
    }
}
console.log("Final depth:", depth);
