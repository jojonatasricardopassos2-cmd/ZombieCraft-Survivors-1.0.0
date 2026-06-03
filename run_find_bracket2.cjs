const fs = require('fs');
const content = fs.readFileSync('components/GameCanvas.tsx', 'utf8');

let stack = [];
let lines = content.split('\n');
for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    let inString = false;
    let stringChar = '';
    let inCommentSpan = false;
    
    for (let c = 0; c < line.length; c++) {
        let char = line[c];
        let nextChar = line[c+1];
        
        if (!inString && !inCommentSpan) {
            if (char === '/' && nextChar === '/') {
                break;
            }
            if (char === '/' && nextChar === '*') {
                inCommentSpan = true;
                c++; continue;
            }
            if (char === '"' || char === "'" || char === "\`") {
                inString = true;
                stringChar = char;
                continue;
            }
            if (char === '{') {
                stack.push(i + 1);
            }
            if (char === '}') {
                if (stack.length === 0) {
                    console.log("Extra } at line", i + 1, ":", line);
                } else {
                    stack.pop();
                    if (stack.length === 0) {
                        console.log("-> TOP LEVEL BLOCK CLOSED AT LINE", i + 1);
                    }
                }
            }
        } else if (inString) {
            if (char === '\\') { c++; continue; }
            if (char === stringChar) {
                inString = false;
            }
        } else if (inCommentSpan) {
            if (char === '*' && nextChar === '/') {
                inCommentSpan = false;
                c++;
            }
        }
    }
}
