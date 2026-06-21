const fs = require('fs');

let content = fs.readFileSync('components/GameCanvas.tsx', 'utf-8');

// The player render block we want to replace starts at "// --- NEW PLAYER RENDERING ---"
// and ends with the end of that if statement block, followed by the otherPlayers tracking.

const startIndex = content.indexOf('// --- NEW PLAYER RENDERING ---');

// End of local player rendering block is before "otherPlayersRef.current.forEach"
const endIndexMatch = content.indexOf('otherPlayersRef.current.forEach(p => {');

if (startIndex === -1 || endIndexMatch === -1) {
    console.log("Could not find start or end block.");
    process.exit(1);
}

// Find the end of the otherPlayers block
let remaining = content.slice(endIndexMatch);
const endOtherPlayers = remaining.indexOf('if(p.playerName) {');
const veryEndMatch = remaining.indexOf('}', endOtherPlayers + 300); // approximate end of forEach

const fullCutEnd = endIndexMatch + remaining.indexOf('});', endOtherPlayers) + 3;

// Extract what was inside the local player if block
const localPlayerBlockStr = content.slice(startIndex, fullCutEnd);

let newCode = `
        // --- NEW PLAYER RENDERING ---
        const drawCharacter = (charData: any, isLocal: boolean) => {
            const playerContext = charData;
            ctx.save();
            ctx.translate(playerContext.x + playerContext.width/2, playerContext.y + playerContext.height/2);
            if (!playerContext.facingRight) ctx.scale(-1, 1);
            
            // Scale visually based on posture
            if (playerContext.posture === 'CROUCH') {
                ctx.scale(1, 40/56);
            } else if (playerContext.posture === 'PRONE') {
                if (!playerContext.facingRight) {
                    ctx.rotate(-Math.PI / 2);
                } else {
                    ctx.rotate(Math.PI / 2);
                }
                ctx.translate(10, 0); 
            }

            const isMoving = Math.abs(playerContext.vx) > 0.1;
            const walkCycle = isMoving ? Math.sin(Date.now() / 100) * 5 : 0;

            const cSkin = playerContext.skin || null;
            const skinColor = cSkin?.skinColor || '#ffcc80';
            
            // Clothes (1-10)
            let shirtColor = skinColor;
            switch(cSkin?.clothes) {
                case '2': shirtColor = '#222'; break; // terno
                case '3': shirtColor = '#1e3a8a'; break; // azul
                case '4': shirtColor = '#b91c1c'; break; // vermelho
                case '5': shirtColor = '#9ca3af'; break; // cinza
                case '6': shirtColor = '#15803d'; break; // verde
                case '7': shirtColor = '#ffffff'; break; // regata branca
                case '8': shirtColor = '#451a03'; break; // jaqueta 
                case '9': shirtColor = '#f59e0b'; break; // amarela/xadrez
                case '10': shirtColor = '#facc15'; break; // amarela
            }
            
            // Pants (1-10)
            let pantsColor = skinColor;
            switch(cSkin?.pants) {
                case '2': pantsColor = '#222'; break; // terno
                case '3': pantsColor = '#1d4ed8'; break; // jeans azul
                case '4': pantsColor = '#1f2937'; break; // jeans preto
                case '5': pantsColor = '#ffed4a'; break; // shorts
                case '6': pantsColor = '#6b7280'; break; // moletom
                case '7': pantsColor = '#a16207'; break; // cargo
                case '8': pantsColor = '#78350f'; break; // couro
                case '9': pantsColor = '#4d7c0f'; break; // camuflado
                case '10': pantsColor = '#ef4444'; break; // shorts vermelho
            }

            const isBareChest = !cSkin?.clothes || cSkin?.clothes === '1';
            const isBarePants = !cSkin?.pants || cSkin?.pants === '1';

            // Legs
            ctx.fillStyle = isBarePants ? skinColor : pantsColor;
            ctx.fillRect(-6 + walkCycle, 12, 6, 16); // Back Leg
            ctx.fillRect(-6 - walkCycle, 12, 6, 16); // Front Leg
            
            // Shoes (1-10)
            if (cSkin?.shoes && cSkin?.shoes !== '1') {
                let shoeCol = '#111';
                switch(cSkin.shoes) {
                    case '2': shoeCol = '#000'; break;
                    case '3': shoeCol = '#fff'; break;
                    case '4': shoeCol = '#3f3f46'; break;
                    case '5': shoeCol = '#dc2626'; break;
                    case '6': shoeCol = '#78350f'; break; // sandálias/sapatilha
                    case '7': shoeCol = '#8b5cf6'; break;
                    case '8': shoeCol = '#92400e'; break;
                    case '9': shoeCol = '#fcd34d'; break;
                    case '10': shoeCol = '#c2410c'; break;
                }
                ctx.fillStyle = shoeCol;
                ctx.fillRect(-8 + walkCycle, 24, 10, 4);
                ctx.fillRect(-8 - walkCycle, 24, 10, 4);
            }

            // Body
            ctx.fillStyle = shirtColor; 
            ctx.fillRect(-10, -16, 20, 28);
            if (isBareChest) {
                ctx.fillStyle = '#ccc';
                ctx.fillRect(-10, 8, 20, 4); // Underwear band
            } else if (cSkin?.clothes === '2') { // terno
                ctx.fillStyle = '#fff';
                ctx.fillRect(-2, -16, 4, 28); // white shirt middle
            }

            const charEquipment = playerContext.equipment || {};

            // Armor: Leggings
            if (charEquipment.leggings) {
                let col = '#cfd8dc'; const id = (charEquipment.leggings?.id?.toString() || ''); 
                if(id.includes('copper')) col='#e65100'; else if(id.includes('gold')) col='#fbc02d'; else if(id.includes('diamond')) col='#00bcd4'; else if(id.includes('titanium')) col='#0d47a1'; else if(id.includes('uranium')) col='#76ff03'; else if(id.includes('reinforced')) col='#9e9e9e'; else if(id.includes('hazmat')) col='#ffeb3b'; else if(id.includes('leather')) col='#3e2723';
                ctx.fillStyle = col;
                ctx.fillRect(-7 + walkCycle, 12, 8, 12); // Back Leg
                ctx.fillRect(-7 - walkCycle, 12, 8, 12); // Front Leg
                ctx.fillRect(-11, 6, 22, 8); // Pelvis
                if (id.includes('reinforced')) {
                    ctx.fillStyle = '#00bcd4';
                    ctx.fillRect(-7 + walkCycle, 20, 8, 2);
                    ctx.fillRect(-7 - walkCycle, 20, 8, 2);
                    ctx.fillRect(-11, 10, 22, 2);
                }
                ctx.fillStyle = 'rgba(0,0,0,0.2)';
                ctx.fillRect(-11, 12, 22, 2); // Belt shadow
            }

            // Armor: Boots
            if (charEquipment.boots) {
                let col = '#cfd8dc'; const id = (charEquipment.boots?.id?.toString() || ''); 
                if(id.includes('copper')) col='#e65100'; else if(id.includes('gold')) col='#fbc02d'; else if(id.includes('diamond')) col='#00bcd4'; else if(id.includes('titanium')) col='#0d47a1'; else if(id.includes('uranium')) col='#76ff03'; else if(id.includes('reinforced')) col='#9e9e9e'; else if(id.includes('hazmat')) col='#ffeb3b'; else if(id.includes('leather')) col='#3e2723';
                ctx.fillStyle = col;
                ctx.fillRect(-8 + walkCycle, 20, 10, 8); // Back Leg Boot
                ctx.fillRect(-8 - walkCycle, 20, 10, 8); // Front Leg Boot
                if (id.includes('reinforced')) {
                    ctx.fillStyle = '#00bcd4';
                    ctx.fillRect(-8 + walkCycle, 22, 10, 2);
                    ctx.fillRect(-8 - walkCycle, 22, 10, 2);
                }
                ctx.fillStyle = 'rgba(255,255,255,0.2)';
                ctx.fillRect(-8 + walkCycle, 20, 4, 8);
                ctx.fillRect(-8 - walkCycle, 20, 4, 8);
            }

            // Head
            ctx.fillStyle = '#ffcc80'; // Skin
            ctx.fillRect(-8, -28, 16, 16);
            
            // Hair
            if (cSkin?.hairVariant === 'normal' || !cSkin?.hairVariant) {
                ctx.fillStyle = cSkin?.hairColor || '#ff9800';
                ctx.fillRect(-8, -30, 16, 4); // Hair top
                ctx.fillRect(-8, -26, 4, 4); // Hair side
            } else if (cSkin?.hairVariant === 'calvo') {
                // Bald is no hair
            }

            // Mustache
            if (cSkin?.hasMustache) {
                ctx.fillStyle = cSkin?.mustacheColor || '#111';
                ctx.fillRect(-5, -16, 10, 2);
            }

            // Mouth (none, neutral, happy, sad, surprised)
            const mouthType = cSkin?.mouthType || 'neutral';
            if (mouthType !== 'none') {
                ctx.fillStyle = '#6a1b9a'; // Inside mouth color
                if (mouthType === 'neutral') ctx.fillRect(-3, -13, 6, 1);
                else if (mouthType === 'happy') {
                    ctx.fillRect(-3, -13, 6, 1);
                    ctx.fillRect(-4, -14, 1, 2);
                    ctx.fillRect(3, -14, 1, 2);
                }
                else if (mouthType === 'sad') {
                    ctx.fillRect(-3, -14, 6, 1);
                    ctx.fillRect(-4, -13, 1, 2);
                    ctx.fillRect(3, -13, 1, 2);
                }
                else if (mouthType === 'surprised') {
                    ctx.fillRect(-2, -14, 4, 3);
                }
            }

            // Eyes (Look at mouse/cursor)
            const eyeXOffset = playerContext.facingRight ? 4 : -4;
            let targetMouseX = playerContext.mouseXY?.x || playerContext.x;
            let targetMouseY = playerContext.mouseXY?.y || playerContext.y;

            const lookUp = targetMouseY < playerContext.y - 16;
            const lookDown = targetMouseY > playerContext.y + 16;
            const eyeY = -24 + (lookDown ? 2 : lookUp ? -2 : 0);
            
            ctx.fillStyle = 'white';
            ctx.fillRect(-2 + eyeXOffset, eyeY, 4, 4);
            
            // Pupil
            ctx.fillStyle = cSkin?.eyeColor || 'black';
            
            let pupilXDiff = 0;
            if (playerContext.facingRight) {
                pupilXDiff = targetMouseX > playerContext.x + 16 ? 1 : (targetMouseX < playerContext.x - 16 ? -1 : 0);
            } else {
                pupilXDiff = targetMouseX < playerContext.x - 16 ? -1 : (targetMouseX > playerContext.x + 16 ? 1 : 0);
            }

            ctx.fillRect(-1 + eyeXOffset + pupilXDiff, eyeY + 1, 2, 2);

            // Armor: Chestplate
            if (charEquipment.chestplate) { 
                let col = '#cfd8dc'; const id = (charEquipment.chestplate?.id?.toString() || ''); 
                if(id.includes('copper')) col='#e65100'; else if(id.includes('gold')) col='#fbc02d'; else if(id.includes('diamond')) col='#00bcd4'; else if(id.includes('titanium')) col='#0d47a1'; else if(id.includes('uranium')) col='#76ff03'; else if(id.includes('reinforced')) col='#9e9e9e'; else if(id.includes('hazmat')) col='#ffeb3b'; else if(id.includes('leather')) col='#3e2723';
                ctx.fillStyle = col; 
                ctx.fillRect(-12, -18, 24, 26); // Main body
                if (id.includes('reinforced')) {
                    ctx.fillStyle = '#00bcd4';
                    ctx.fillRect(-6, -12, 12, 12); // Blue core
                    ctx.fillRect(-12, 4, 24, 2); // Blue belt line
                }
                ctx.fillStyle = 'rgba(255,255,255,0.2)'; // Highlight
                ctx.fillRect(-10, -16, 6, 22);
                ctx.fillStyle = 'rgba(0,0,0,0.2)'; // Shadow
                ctx.fillRect(4, -16, 6, 22);
                ctx.fillRect(-12, 4, 24, 4); // Belt area
            }

            // Armor: Helmet
            if (charEquipment.helmet) { 
                let col = '#cfd8dc'; const id = (charEquipment.helmet?.id?.toString() || ''); 
                if(id.includes('copper')) col='#e65100'; else if(id.includes('gold')) col='#fbc02d'; else if(id.includes('diamond')) col='#00bcd4'; else if(id.includes('titanium')) col='#0d47a1'; else if(id.includes('uranium')) col='#76ff03'; else if(id.includes('reinforced')) col='#9e9e9e'; else if(id.includes('hazmat')) col='#ffeb3b'; else if(id.includes('leather')) col='#3e2723';
                ctx.fillStyle = col; 
                ctx.fillRect(-10, -32, 20, 14); // Hat top
                ctx.fillRect(-10, -32, 6, 20); // Side back
                ctx.fillRect(6, -32, 4, 20); // Side front
                ctx.fillRect(-12, -22, 24, 4); // Brim/visor
                if (id.includes('reinforced')) {
                    ctx.fillStyle = '#00bcd4';
                    ctx.fillRect(-12, -22, 24, 2); // Blue visor line
                    ctx.fillRect(-4, -30, 8, 4); // Blue crest
                }
                ctx.fillStyle = 'rgba(255,255,255,0.3)'; // Highlight
                ctx.fillRect(-6, -30, 8, 4);
                ctx.fillStyle = 'rgba(0,0,0,0.2)'; // Shadow
                ctx.fillRect(-10, -20, 20, 2);
            }

            // Held Item (Main Hand)
            const heldItem = playerContext.heldItem || null;
            const heldItemId = heldItem ? (heldItem.id?.toString() || '') : '';
            
            ctx.save();
            ctx.translate(6, 0); // Shoulder/Hand pivot
            
            let angle = 0;
            let stabOffset = 0;
            let swingProgress = 0;
            
            const dx = targetMouseX - (playerContext.x + playerContext.width/2);
            const dy = targetMouseY - (playerContext.y + playerContext.height/2);
            let rawAngle = Math.atan2(dy, dx);
            if (!playerContext.facingRight) rawAngle = Math.atan2(dy, -dx); 
            
            if ((playerContext.attackCooldown || 0) > 0) {
                let cooldownMax = 20;
                if (heldItemId.includes('war_hammer')) cooldownMax = 300;
                else if (heldItemId.includes('scythe')) cooldownMax = 240;
                else if (heldItemId.includes('battle_axe')) cooldownMax = 100;
                else if (heldItemId.includes('katana')) cooldownMax = 120;
                else if (heldItemId.includes('knife')) cooldownMax = 10;
                else if (heldItemId.includes('short_sword')) cooldownMax = 15;
                else if (heldItemId.includes('crossbow')) cooldownMax = 187.5;
                else if (heldItemId.includes('bow')) cooldownMax = 62.5;
                
                swingProgress = Math.min(1, (playerContext.attackCooldown || 0) / cooldownMax); 
                
                if (heldItemId.includes('spear')) {
                    stabOffset = Math.sin(swingProgress * Math.PI) * 15;
                    angle = rawAngle;
                } else if (heldItemId.includes('sword') || heldItemId.includes('katana') || heldItemId.includes('knife') || heldItemId.includes('scythe')) {
                    angle = rawAngle - (Math.PI/2 * swingProgress) + (Math.sin(swingProgress * Math.PI) * Math.PI/1.5);
                } else if (heldItemId.includes('pickaxe') || heldItemId.includes('axe') || heldItemId.includes('hammer') || heldItemId.includes('shovel') || heldItemId.includes('hoe')) {
                    angle = rawAngle - (Math.PI/1.5 * swingProgress) + (Math.sin(swingProgress * Math.PI) * Math.PI);
                } else if (heldItemId.includes('bow') || heldItemId.includes('crossbow')) {
                    angle = rawAngle;
                } else {
                    angle = rawAngle - (Math.PI/2 * swingProgress) + (Math.sin(swingProgress * Math.PI) * Math.PI/2);
                }
            } else {
                angle = rawAngle;
            }
            ctx.rotate(angle);
            
            // Arm
            if (isBareChest) {
                ctx.fillStyle = skinColor;
                ctx.fillRect(0 + stabOffset, -2, 12, 4);
            } else {
                ctx.fillStyle = shirtColor; 
                ctx.fillRect(0 + stabOffset, -2, 8, 4); // Sleeve
                ctx.fillStyle = skinColor; 
                ctx.fillRect(8 + stabOffset, -2, 4, 4); // Hand
                if (cSkin?.clothes === '2') {
                    ctx.fillStyle = '#fff';
                    ctx.fillRect(7 + stabOffset, -2, 1, 4); 
                }
            }
            
            if (charEquipment.chestplate) {
                let col = '#cfd8dc'; const id = (charEquipment.chestplate?.id?.toString() || ''); 
                if(id.includes('copper')) col='#e65100'; else if(id.includes('gold')) col='#fbc02d'; else if(id.includes('diamond')) col='#00bcd4'; else if(id.includes('titanium')) col='#0d47a1'; else if(id.includes('uranium')) col='#76ff03'; else if(id.includes('reinforced')) col='#9e9e9e'; else if(id.includes('hazmat')) col='#ffeb3b'; else if(id.includes('leather')) col='#3e2723';
                ctx.fillStyle = col; 
                ctx.fillRect(-2 + stabOffset, -3, 10, 6); // Shoulder pad / sleeve
                if (id.includes('reinforced')) {
                    ctx.fillStyle = '#00bcd4';
                    ctx.fillRect(4 + stabOffset, -3, 2, 6); // Blue arm band
                }
            }
            ctx.fillStyle = '#ffcc80'; 
            ctx.fillRect(12 + stabOffset, -2, 4, 4);
            
            if (heldItem) {
                ctx.translate(14 + stabOffset, 0);
                
                if (heldItemId.includes('spear')) {
                    ctx.rotate(Math.PI/2); 
                } else if (heldItemId.includes('bow') || heldItemId.includes('crossbow')) {
                    ctx.rotate(0); 
                } else {
                    ctx.rotate(Math.PI/4); 
                }
                
                // Note: Need ITEM_COLORS and BLOCK_COLORS accessible
                // In context they are constants
                if (heldItem.type === 'BLOCK' || heldItemId === 'GLASS') { // simplified check
                    const col = typeof BLOCK_COLORS !== 'undefined' && BLOCK_COLORS[heldItem.id] ? BLOCK_COLORS[heldItem.id] : '#fff';
                    ctx.fillStyle = col;
                    ctx.fillRect(-6, -6, 12, 12);
                    ctx.fillStyle = 'rgba(0,0,0,0.2)';
                    ctx.fillRect(-6, 4, 12, 2);
                    ctx.fillRect(4, -6, 2, 12);
                } else {
                    const col = typeof ITEM_COLORS !== 'undefined' && ITEM_COLORS[heldItemId] ? ITEM_COLORS[heldItemId] : '#888';
                    
                    if (heldItemId.includes('sword') || heldItemId.includes('katana') || heldItemId.includes('knife')) {
                        const isKnife = heldItemId.includes('knife');
                        const bladeLen = isKnife ? 12 : 32;
                        const bladeY = isKnife ? -4 : -20;
                        ctx.fillStyle = col;
                        ctx.fillRect(-2, bladeY, 4, bladeLen); 
                        ctx.beginPath();
                        ctx.moveTo(-2, bladeY);
                        ctx.lineTo(0, bladeY - 4);
                        ctx.lineTo(2, bladeY);
                        ctx.fill();
                        ctx.fillStyle = '#8d6e63';
                        ctx.fillRect(isKnife ? -4 : -6, 12, isKnife ? 8 : 12, 2); 
                        ctx.fillRect(-2, 14, 4, 6); 
                    } else if (heldItemId.includes('scythe')) {
                        ctx.fillStyle = '#8d6e63';
                        ctx.fillRect(-2, -10, 4, 30);
                        ctx.fillStyle = col;
                        ctx.fillRect(-14, -14, 16, 4);
                        ctx.fillRect(-14, -10, 4, 8);
                    } else if (heldItemId.includes('pickaxe')) {
                        ctx.fillStyle = '#8d6e63';
                        ctx.fillRect(-2, -4, 4, 20); 
                        ctx.fillStyle = col; 
                        ctx.fillRect(-12, -8, 24, 4); 
                        ctx.fillRect(-14, -6, 4, 4);
                        ctx.fillRect(10, -6, 4, 4);
                    } else if (heldItemId.includes('axe')) {
                        const isBattleAxe = heldItemId.includes('battle_axe');
                        ctx.fillStyle = '#8d6e63';
                        ctx.fillRect(-2, -4, 4, isBattleAxe ? 30 : 20); 
                        ctx.fillStyle = col;
                        ctx.fillRect(2, -8, 8, 10); 
                        if (isBattleAxe) {
                            ctx.fillRect(-10, -8, 8, 10);
                        }
                    } else if (heldItemId.includes('shovel')) {
                        ctx.fillStyle = '#8d6e63';
                        ctx.fillRect(-2, -4, 4, 20); 
                        ctx.fillStyle = col;
                        ctx.fillRect(-4, -12, 8, 8); 
                    } else if (heldItemId.includes('hoe')) {
                        ctx.fillStyle = '#8d6e63';
                        ctx.fillRect(-2, -4, 4, 20); 
                        ctx.fillStyle = col;
                        ctx.fillRect(-8, -8, 12, 4); 
                    } else if (heldItemId.includes('hammer')) {
                        const isWarHammer = heldItemId.includes('war_hammer');
                        ctx.fillStyle = '#8d6e63';
                        ctx.fillRect(-2, -4, 4, isWarHammer ? 30 : 20); 
                        ctx.fillStyle = col;
                        ctx.fillRect(isWarHammer ? -12 : -8, -10, isWarHammer ? 24 : 16, isWarHammer ? 12 : 8); 
                    } else if (heldItemId.includes('spear')) {
                        ctx.fillStyle = '#8d6e63';
                        ctx.fillRect(-2, -10, 4, 30); 
                        ctx.fillStyle = col;
                        ctx.fillRect(-3, -18, 6, 8); 
                        ctx.fillRect(-1, -22, 2, 4); 
                    } else if (heldItemId.includes('bow')) {
                        ctx.strokeStyle = '#8d6e63';
                        ctx.lineWidth = 3;
                        ctx.beginPath();
                        ctx.arc(-4, 0, 12, -Math.PI/2, Math.PI/2);
                        ctx.stroke();
                        ctx.strokeStyle = '#fff';
                        ctx.lineWidth = 1;
                        ctx.beginPath();
                        ctx.moveTo(-4, -12);
                        if (swingProgress > 0) {
                            ctx.lineTo(-12, 0);
                            ctx.fillStyle = '#ccc';
                            ctx.fillRect(-12, -1, 16, 2);
                        }
                        ctx.lineTo(-4, 12);
                        ctx.stroke();
                    } else if (heldItemId.includes('crossbow')) {
                        ctx.fillStyle = '#8d6e63';
                        ctx.fillRect(-4, -2, 16, 4); 
                        ctx.fillStyle = '#5d4037';
                        ctx.fillRect(4, -12, 4, 24); 
                        
                        ctx.strokeStyle = '#fff';
                        ctx.lineWidth = 1;
                        ctx.beginPath();
                        ctx.moveTo(4, -12);
                        if (swingProgress > 0) {
                            ctx.lineTo(-4, 0);
                            ctx.fillStyle = '#ccc';
                            ctx.fillRect(-4, -1, 16, 2); 
                        } else {
                            ctx.lineTo(8, 0);
                        }
                        ctx.lineTo(4, 12);
                        ctx.stroke();
                    } else {
                        ctx.fillStyle = col;
                        ctx.fillRect(-4, -4, 8, 8);
                    }
                }
            }
            ctx.restore();

            // Offhand (Shield/Torch)
            if (charEquipment.offHand) {
                if (charEquipment.offHand.type === 'SHIELD') { // Simplified check based on enum replacement
                    ctx.save();
                    ctx.translate(-4, 4);
                    if (playerContext.isBlocking) ctx.translate(4, -2);
                    const col = typeof ITEM_COLORS !== 'undefined' && ITEM_COLORS[(charEquipment.offHand?.id?.toString() || '')] ? ITEM_COLORS[(charEquipment.offHand?.id?.toString() || '')] : '#888';
                    ctx.fillStyle = col;
                    ctx.fillRect(-6, -6, 12, 12);
                    ctx.restore();
                } else if (charEquipment.offHand.id === 'TORCH' || charEquipment.offHand.id === 4) { // 4 is Torch ID usually
                    ctx.fillStyle = '#ffeb3b';
                    ctx.fillRect(-8, 4, 4, 10);
                }
            }

            ctx.restore();
        };

        if (options.gameMode !== 'SPECTATOR') {
             const accsStr = localStorage.getItem('zombiecraft_accounts');
             const usrName = localStorage.getItem('zombiecraft_current_user');
             let localSkin = null;
             if (accsStr && usrName) {
                 const accs = JSON.parse(accsStr);
                 const usr = accs.find((a: any) => a.name === usrName);
                 if (usr && usr.skin) localSkin = usr.skin;
             }

             drawCharacter({
                 ...player,
                 skin: localSkin,
                 equipment: equipment,
                 heldItem: inventory[selectedSlot],
                 mouseXY: { x: worldMouseX, y: worldMouseY },
                 isBlocking: blockingRef.current
             }, true);
        }

        otherPlayersRef.current.forEach(p => {
             drawCharacter({...p, isBlocking: (p as any).isBlocking || false, mouseXY: (p as any).mouseXY || {x: p.x, y: p.y}, heldItem: (p as any).heldItem, equipment: (p as any).equipment}, false);
             if(p.playerName) { 
                 ctx.save();
                 ctx.font = 'bold 12px monospace'; 
                 ctx.textAlign = 'center'; 
                 ctx.fillStyle = 'white'; 
                 ctx.strokeStyle = 'black'; 
                 ctx.lineWidth = 3; 
                 ctx.strokeText(p.playerName, p.x + p.width/2, p.y - 12); 
                 ctx.fillText(p.playerName, p.x + p.width/2, p.y - 12); 
                 ctx.restore();
             }
        });
`;

let mergedCode = content.slice(0, startIndex) + newCode + content.slice(fullCutEnd);

fs.writeFileSync('components/GameCanvas.tsx', mergedCode);
console.log('REPLACEMENT DONE successfully!');
