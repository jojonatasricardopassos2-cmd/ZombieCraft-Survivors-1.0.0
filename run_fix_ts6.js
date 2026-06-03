import fs from 'fs';

let constants = fs.readFileSync('constants.ts', 'utf8');

// I am going to carefully remove the specific lines causing duplicate property errors the easiest way: 
// by removing the rogue object keys from the ITEM_NAMES PT and EN sections.
constants = constants.replace(/\s*JOIN: "Join",[\s\S]*?apple: "Apple"/, "");
constants = constants.replace(/\s*SLEEP_MENU: "Menu de Sono",[\s\S]*?antidote: "Antídoto",/, "");

fs.writeFileSync('constants.ts', constants);
