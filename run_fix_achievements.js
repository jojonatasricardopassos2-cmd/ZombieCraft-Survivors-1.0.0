import fs from 'fs';

let content = fs.readFileSync('constants.ts', 'utf8');

const questsRegex = /export const QUESTS: Quest\[\] = \[[\s\S]*?\];/;
const newQuests = `export const QUESTS: Quest[] = [
  { id: 1, reqItem: 'iron_ingot', reqCount: 5, rewardItem: 'gold_ingot', rewardCount: 5, descEN: "Bring me 5 Iron Ingots.", descPT: "Traga-me 5 Barras de Ferro." },
  { id: 2, reqItem: 'diamond', reqCount: 1, rewardItem: 'emerald', rewardCount: 2, descEN: "Find 1 Diamond.", descPT: "Encontre 1 Diamante para mim." },
  { id: 3, reqItem: 'cooked_meat', reqCount: 5, rewardItem: 'health_potion', rewardCount: 2, descEN: "Bring 5 Cooked Meat.", descPT: "Estou com fome. Pegue 5 Carnes Assadas." },
  { id: 4, reqItem: 'zombie_meat', reqCount: 10, rewardItem: 'iron_sword', rewardCount: 1, descEN: "Bring 10 Zombie Meat.", descPT: "Resgate a vila! Mate zumbis e traga 10 Carnes de Zumbi." },
  { id: 5, reqItem: 'uranium', reqCount: 2, rewardItem: 'uranium_totem', rewardCount: 1, descEN: "Bring 2 Uranium.", descPT: "A missão final: traga 2 minérios de Urânio." }
];`;

content = content.replace(questsRegex, newQuests);

const achievementsRegex = /export const ACHIEVEMENTS: Achievement\[\] = \[/;
const newAchievements = `export const ACHIEVEMENTS: Achievement[] = [
    { id: 'CAMPAIGN_COMPLETE', nameEN: "Hero of the City", namePT: "Herói da Cidade", descEN: "Completed all 5 NPC Quests.", descPT: "Completou todas as 5 missões do NPC.", icon: "👑" },`;
content = content.replace(achievementsRegex, newAchievements);

fs.writeFileSync('constants.ts', content);
