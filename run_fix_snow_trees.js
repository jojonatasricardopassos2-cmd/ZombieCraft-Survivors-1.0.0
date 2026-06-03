import fs from 'fs';

let content = fs.readFileSync('utils/world.ts', 'utf8');

content = content.replace("const logType = BlockType.DARK_WOOD;", "const logType = BlockType.PINE_WOOD;");
content = content.replace("const leafType = BlockType.SNOWY_LEAVES;", "const leafType = BlockType.PINE_LEAVES;");

fs.writeFileSync('utils/world.ts', content);
