import React, { useState, useEffect, useRef } from 'react';

interface ElementPos {
    id: string;
    x: number;
    y: number;
    label: string;
}

const DEFAULT_POSITIONS: ElementPos[] = [
    { id: 'joystick', x: 40, y: window.innerHeight - 150, label: 'Joystick' },
    { id: 'attack', x: window.innerWidth - 180, y: window.innerHeight - 100, label: 'Attack' },
    { id: 'jump', x: window.innerWidth - 100, y: window.innerHeight - 180, label: 'Jump' },
    { id: 'place', x: window.innerWidth - 100, y: window.innerHeight - 100, label: 'Place' },
    { id: 'tools', x: window.innerWidth - 250, y: 30, label: 'Utils (Inv, Drop..)' },
];

export const TouchConfigUI = ({ onClose }: { onClose: () => void }) => {
    const [positions, setPositions] = useState<ElementPos[]>(DEFAULT_POSITIONS);
    const [dragging, setDragging] = useState<string | null>(null);
    const offsetRef = useRef({ x: 0, y: 0 });

    useEffect(() => {
        const saved = localStorage.getItem('mr2d_touch_config');
        if (saved) {
            try {
                setPositions(JSON.parse(saved));
            } catch(e) {}
        }
    }, []);

    const handlePointerDown = (e: React.PointerEvent, id: string) => {
        e.preventDefault();
        setDragging(id);
        const el = positions.find(p => p.id === id);
        if (el) {
            offsetRef.current = {
                x: e.clientX - el.x,
                y: e.clientY - el.y
            };
        }
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (!dragging) return;
        setPositions(prev => prev.map(p => {
            if (p.id === dragging) {
                return {
                    ...p,
                    x: e.clientX - offsetRef.current.x,
                    y: e.clientY - offsetRef.current.y
                };
            }
            return p;
        }));
    };

    const handlePointerUp = () => {
        setDragging(null);
    };

    const saveAndClose = () => {
        localStorage.setItem('mr2d_touch_config', JSON.stringify(positions));
        alert("Configuração salva!");
        onClose();
    };

    return (
        <div 
            className="absolute inset-0 bg-black/80 z-[200] overflow-hidden select-none"
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
        >
            <div className="absolute top-4 left-4 bg-gray-900 border-2 border-white p-4 text-white z-50 shadow-2xl">
                <h3 className="text-xl font-bold mb-2">Editar Controles</h3>
                <p className="text-sm text-gray-300 mb-4">Arraste os elementos <br/>para onde desejar.</p>
                <div className="flex gap-2">
                    <button onClick={saveAndClose} className="bg-green-600 hover:bg-green-500 p-2 font-bold flex-1">Salvar</button>
                    <button onClick={onClose} className="bg-red-600 hover:bg-red-500 p-2 font-bold flex-1">Cancelar</button>
                </div>
                <button onClick={() => setPositions(DEFAULT_POSITIONS)} className="mt-2 w-full bg-blue-600 hover:bg-blue-500 p-2 font-bold text-sm">Resetar</button>
            </div>

            {positions.map(p => (
                <div
                    key={p.id}
                    onPointerDown={(e) => handlePointerDown(e, p.id)}
                    className="absolute cursor-move border-2 border-dashed border-yellow-400 bg-white/10 flex items-center justify-center p-4 rounded text-yellow-200 font-bold "
                    style={{ 
                        left: p.x, 
                        top: p.y,
                        width: p.id === 'joystick' ? 128 : (p.id === 'tools' ? 200 : 70),
                        height: p.id === 'joystick' ? 128 : (p.id === 'tools' ? 60 : 70)
                    }}
                >
                    {p.label}
                </div>
            ))}
        </div>
    );
};
