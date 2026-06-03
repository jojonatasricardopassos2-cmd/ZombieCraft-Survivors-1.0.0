import fs from 'fs';

let content = fs.readFileSync('components/GameCanvas.tsx', 'utf8');

const completeQuestRegex = /npc\.npcData\.completed = true;\s*setActiveNpc\(null\);\s*}\s*};\s*const spawnDrop = /;

const newCompleteQuest = `npc.npcData.completed = true;
        setActiveNpc(null);
        
        // If it's a campaign NPC, increment quest
        if (npc.npcData?.type === 'QUEST_GIVER' && npc.npcData.questId < 5) {
            npc.npcData.questId++;
            npc.npcData.completed = false; // Reset for next quest
        } else if (npc.npcData?.type === 'QUEST_GIVER' && npc.npcData.questId >= 5) {
            handleUnlockAchievement('CAMPAIGN_COMPLETE');
        }
    };

    const spawnDrop = `;

content = content.replace(completeQuestRegex, newCompleteQuest);

fs.writeFileSync('components/GameCanvas.tsx', content);
