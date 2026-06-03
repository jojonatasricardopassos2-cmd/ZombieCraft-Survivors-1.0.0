
import React, { useRef, useEffect, useState } from 'react';

interface MobileControlsProps {
    onInput: (keys: { x: number, y: number, jump: boolean, attack: boolean, place: boolean, inventory: boolean, drop: boolean, equip: boolean }) => void;
    onToggleInventory: () => void;
    onDrop: () => void;
    onEquip: () => void; // Swap offhand
    onToggleTreePass: () => void;
}

export const MobileControls: React.FC<MobileControlsProps> = ({ onInput, onToggleInventory, onDrop, onEquip, onToggleTreePass }) => {
    const joystickRef = useRef<HTMLDivElement>(null);
    const [stickPos, setStickPos] = useState({ x: 0, y: 0 });
    const [activeButtons, setActiveButtons] = useState<Record<string, boolean>>({});
    const [positions, setPositions] = useState<Record<string, { x: number, y: number }>>({});

    useEffect(() => {
        const saved = localStorage.getItem('mr2d_touch_config');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                const posMap: Record<string, {x:number, y:number}> = {};
                parsed.forEach((p: any) => {
                    posMap[p.id] = { x: p.x, y: p.y };
                });
                setPositions(posMap);
            } catch(e) {}
        }
    }, []);
    
    // Track joystick touch
    const handleJoystickMove = (touch: React.Touch) => {
        if (!joystickRef.current) return;
        const rect = joystickRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        let dx = touch.clientX - centerX;
        let dy = touch.clientY - centerY;
        
        const distance = Math.sqrt(dx * dx + dy * dy);
        const maxDist = rect.width / 2;
        
        if (distance > maxDist) {
            dx = (dx / distance) * maxDist;
            dy = (dy / distance) * maxDist;
        }
        
        setStickPos({ x: dx, y: dy });
        
        // Normalize for input
        const normX = dx / maxDist;
        const normY = dy / maxDist;
        
        onInput({ 
            x: normX, 
            y: normY, 
            jump: activeButtons['jump'], 
            attack: activeButtons['attack'], 
            place: activeButtons['place'],
            inventory: false,
            drop: false,
            equip: false
        });
    };

    const handleTouchStart = (e: React.TouchEvent, btn: string) => {
        // Stop propagation to prevent canvas click logic if touching a button
        // e.stopPropagation(); 
        setActiveButtons(prev => {
            const next = { ...prev, [btn]: true };
            // Update input state immediately
            onInput({
                x: stickPos.x / 40, // rough normalization
                y: stickPos.y / 40,
                jump: next['jump'] || false,
                attack: next['attack'] || false,
                place: next['place'] || false,
                inventory: false,
                drop: false,
                equip: false
            });
            return next;
        });
    };

    const handleTouchEnd = (e: React.TouchEvent, btn: string) => {
        setActiveButtons(prev => {
            const next = { ...prev, [btn]: false };
            onInput({
                x: stickPos.x / 40,
                y: stickPos.y / 40,
                jump: next['jump'] || false,
                attack: next['attack'] || false,
                place: next['place'] || false,
                inventory: false,
                drop: false,
                equip: false
            });
            return next;
        });
    };

    return (
        <div className="absolute inset-0 pointer-events-none select-none z-20">
            {/* Joystick Area */}
            <div 
                className="absolute w-32 h-32 bg-black/30 rounded-full border-2 border-white/50 pointer-events-auto"
                style={positions['joystick'] ? { left: positions['joystick'].x, top: positions['joystick'].y } : { bottom: 80, left: 80 }}
                ref={joystickRef}
                onTouchStart={(e) => handleJoystickMove(e.touches[0])}
                onTouchMove={(e) => handleJoystickMove(e.touches[0])}
                onTouchEnd={() => { setStickPos({ x: 0, y: 0 }); onInput({ x: 0, y: 0, jump: activeButtons['jump'], attack: activeButtons['attack'], place: activeButtons['place'], inventory: false, drop: false, equip: false }); }}
            >
                <div 
                    className="absolute w-12 h-12 bg-white/50 rounded-full shadow-lg"
                    style={{ 
                        left: `calc(50% + ${stickPos.x}px - 24px)`, 
                        top: `calc(50% + ${stickPos.y}px - 24px)` 
                    }}
                />
            </div>

            {/* Attack Button */}
            <div 
                className={`absolute w-16 h-16 rounded-full border-2 border-red-400 flex items-center justify-center text-2xl font-bold pointer-events-auto ${activeButtons['attack'] ? 'bg-red-500 text-white' : 'bg-black/40 text-red-200'}`}
                style={positions['attack'] ? { left: positions['attack'].x, top: positions['attack'].y } : { bottom: 80, right: 180 }}
                onTouchStart={(e) => handleTouchStart(e, 'attack')}
                onTouchEnd={(e) => handleTouchEnd(e, 'attack')}
            >
                ⚔️
            </div>

            {/* Jump Button */}
            <div 
                className={`absolute w-16 h-16 rounded-full border-2 border-blue-400 flex items-center justify-center text-xl font-bold pointer-events-auto ${activeButtons['jump'] ? 'bg-blue-500 text-white' : 'bg-black/40 text-blue-200'}`}
                style={positions['jump'] ? { left: positions['jump'].x, top: positions['jump'].y } : { bottom: 180, right: 80 }}
                onTouchStart={(e) => handleTouchStart(e, 'jump')}
                onTouchEnd={(e) => handleTouchEnd(e, 'jump')}
            >
                ⬆️
            </div>

            {/* Place Button */}
            <div 
                className={`absolute w-16 h-16 rounded-full border-2 border-green-400 flex items-center justify-center text-2xl font-bold pointer-events-auto ${activeButtons['place'] ? 'bg-green-500 text-white' : 'bg-black/40 text-green-200'}`}
                style={positions['place'] ? { left: positions['place'].x, top: positions['place'].y } : { bottom: 80, right: 80 }}
                onTouchStart={(e) => handleTouchStart(e, 'place')}
                onTouchEnd={(e) => handleTouchEnd(e, 'place')}
            >
                🧱
            </div>

            {/* Utility Buttons */}
            <div className="absolute flex gap-2 pointer-events-auto" style={positions['tools'] ? { left: positions['tools'].x, top: positions['tools'].y } : { top: 24, left: 24 }}>
                <button onClick={onToggleTreePass} className="w-12 h-12 bg-green-900/80 border border-green-500 rounded flex items-center justify-center text-xl" title="Toggle Tree Pass">🌲</button>
                <button onClick={onEquip} className="w-12 h-12 bg-gray-800/80 border border-gray-500 rounded flex items-center justify-center text-xl">🛡️</button>
                <button onClick={onDrop} className="w-12 h-12 bg-gray-800/80 border border-gray-500 rounded flex items-center justify-center text-xl">🚮</button>
                <button onClick={onToggleInventory} className="w-12 h-12 bg-gray-800/80 border border-gray-500 rounded flex items-center justify-center text-xl">🎒</button>
            </div>
        </div>
    );
};
