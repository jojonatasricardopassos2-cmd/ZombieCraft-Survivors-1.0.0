import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Pause, Square, Plus, Trash2, Search, Settings, Save, Upload, Download, Copy, AlertTriangle, CheckCircle, XCircle, ChevronDown, ChevronRight, Layers, FileJson, Zap, Link, Cpu, Wrench, Menu, X, Globe, User, Tag, ShieldAlert } from 'lucide-react';

interface ModCreatorProps {
    onClose: () => void;
    onTestMod?: () => void;
    currentUser?: string;
}

type Theme = 'dark' | 'black' | 'dark-blue' | 'light';

export const ModCreator: React.FC<ModCreatorProps> = ({ onClose, onTestMod, currentUser }) => {
    const [theme, setTheme] = useState<Theme>('dark');
    const [zoom, setZoom] = useState(1);
    const [activeTab, setActiveTab] = useState<'VISUAL' | 'HUB' | 'MANIFEST' | 'TEST'>('HUB');

    const [showLogin, setShowLogin] = useState(false);
    const [showPublish, setShowPublish] = useState(false);
    const [loginName, setLoginName] = useState('');
    const [loginPass, setLoginPass] = useState('');

    // Mocks for UI
    const [blocks, setBlocks] = useState<any[]>([
        { id: '1', x: 100, y: 100, type: 'EVENT', name: 'Ao iniciar mundo', inputs: [], outputs: [{ id: 'o1', type: 'FLOW', name: 'Saída' }] },
        { id: '2', x: 400, y: 150, type: 'LOGIC', name: 'Criar Entidade', props: { type: 'Zumbi', hp: 100 }, inputs: [{ id: 'i1', type: 'FLOW', name: 'Entrada' }, { id: 'i2', type: 'NUMBER', name: 'Vida' }], outputs: [{ id: 'o1', type: 'FLOW', name: 'Saída' }, { id: 'o2', type: 'OBJECT', name: 'Entidade' }] }
    ]);
    const [connections, setConnections] = useState<any[]>([
        { id: 'c1', fromNode: '1', fromPort: 'o1', toNode: '2', toPort: 'i1', type: 'FLOW' }
    ]);
    const [pan, setPan] = useState({ x: 0, y: 0 });

    const themeStyles = {
        'dark': 'bg-[#1e1e2e] text-gray-200 border-[#313244]',
        'black': 'bg-black text-gray-300 border-gray-800',
        'dark-blue': 'bg-[#0f172a] text-slate-300 border-slate-700',
        'light': 'bg-gray-50 text-gray-800 border-gray-200',
    };

    const getThemeClass = (part: 'bg' | 'panel' | 'border' | 'text' | 'accent') => {
        if (theme === 'dark') {
            if (part === 'bg') return 'bg-[#181825]';
            if (part === 'panel') return 'bg-[#1e1e2e]';
            if (part === 'border') return 'border-[#313244]';
            if (part === 'text') return 'text-gray-300';
            if (part === 'accent') return 'bg-[#cba6f7]';
        }
        if (theme === 'black') {
            if (part === 'bg') return 'bg-[#000000]';
            if (part === 'panel') return 'bg-[#111111]';
            if (part === 'border') return 'border-[#333333]';
            if (part === 'text') return 'text-gray-300';
            if (part === 'accent') return 'bg-white';
        }
        if (theme === 'dark-blue') {
            if (part === 'bg') return 'bg-[#0f172a]';
            if (part === 'panel') return 'bg-[#1e293b]';
            if (part === 'border') return 'border-slate-700';
            if (part === 'text') return 'text-slate-300';
            if (part === 'accent') return 'bg-blue-500';
        }
        if (theme === 'light') {
            if (part === 'bg') return 'bg-gray-100';
            if (part === 'panel') return 'bg-white';
            if (part === 'border') return 'border-gray-200';
            if (part === 'text') return 'text-gray-800';
            if (part === 'accent') return 'bg-blue-600';
        }
        return '';
    };

    const canvasRef = useRef<HTMLDivElement>(null);

    const handleLogin = () => {
        if (!loginName || !loginPass) return alert('Preencha nome e senha!');
        let accounts = JSON.parse(localStorage.getItem('zombiecraft_accounts') || '[]');
        let acc = accounts.find((a: any) => a.name === loginName);
        if (acc) {
            if (acc.password !== loginPass) return alert('Senha incorreta!');
        } else {
            acc = { name: loginName, password: loginPass, friends: [], skin: { hairColor: '#ffcc00', eyeColor: '#000000', clothes: '1', pants: '1', shoes: '1', bodySize: 'normal', hasMustache: false, eyeType: 'normal', hairVariant: 'normal' } };
            accounts.push(acc);
            localStorage.setItem('zombiecraft_accounts', JSON.stringify(accounts));
        }
        localStorage.setItem('zombiecraft_current_user', acc.name);
        // We log in locally in the ModCreator session so user can continue
        setShowLogin(false);
        setActiveTab('VISUAL');
    };

    return (
        <div className={`fixed inset-0 z-50 flex flex-col font-sans ${getThemeClass('bg')} ${getThemeClass('text')}`}>
            {showLogin && (
                <div className="absolute inset-0 z-[100] bg-black/80 flex items-center justify-center p-4">
                    <div className="bg-gray-900 border border-gray-700 p-8 rounded-lg shadow-2xl w-96 text-white flex flex-col gap-4">
                        <h2 className="text-2xl font-bold text-center text-red-500">Login p/ Criar Mod</h2>
                        <input type="text" placeholder="Nome" value={loginName} onChange={e => setLoginName(e.target.value)} className="bg-black/50 border border-gray-600 p-3 rounded" />
                        <input type="password" placeholder="Senha" value={loginPass} onChange={e => setLoginPass(e.target.value)} className="bg-black/50 border border-gray-600 p-3 rounded" />
                        <button onClick={handleLogin} className="bg-green-600 hover:bg-green-500 font-bold p-3 rounded shadow mt-2">Entrar / Cadastrar</button>
                        <button onClick={() => setShowLogin(false)} className="bg-gray-700 hover:bg-gray-600 p-2 rounded text-sm mt-1">Cancelar</button>
                    </div>
                </div>
            )}

            {showPublish && (
                <div className="absolute inset-0 z-[100] bg-black/80 flex items-center justify-center p-4 font-sans text-white">
                    <div className="bg-gray-900 border border-blue-500 p-8 rounded-lg shadow-2xl w-[500px] flex flex-col gap-5">
                        <div className="flex flex-col items-center">
                            <Upload size={40} className="text-blue-500 mb-2"/>
                            <h2 className="text-3xl font-bold text-center text-blue-400">Publicar Mod</h2>
                            <p className="text-sm opacity-70 text-center mt-1">Publique seu mod para que outros jogadores possam instalá-lo.</p>
                        </div>
                        
                        <div className="flex flex-col gap-1">
                            <label className="text-sm font-bold opacity-70">Nome do Mod</label>
                            <input type="text" placeholder="My Awesome Mod" className="bg-black/50 border border-gray-600 p-3 rounded outline-none focus:border-blue-500" />
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-bold opacity-70">Tipo de Distribuição</label>
                            <div className="flex gap-6 mt-1">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="radio" name="price_type" defaultChecked className="accent-blue-500 w-5 h-5" />
                                    <span className="text-lg">Gratuito</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="radio" name="price_type" className="accent-blue-500 w-5 h-5" />
                                    <span className="text-lg">Pago (Moedas Z)</span>
                                </label>
                            </div>
                        </div>
                        
                        <div className="flex flex-col gap-1">
                            <label className="text-sm font-bold opacity-70">Valor (Máx 1000 Z)</label>
                            <input type="number" defaultValue={0} min={0} max={1000} className="bg-black/50 border border-gray-600 p-3 rounded w-full outline-none focus:border-blue-500 text-lg font-bold text-yellow-500" />
                        </div>

                        <div className="mt-4 flex gap-4">
                            <button onClick={() => {
                                alert('Mod publicado com sucesso!');
                                setShowPublish(false);
                            }} className="flex-1 bg-blue-600 hover:bg-blue-500 font-bold p-3 rounded shadow">Confirmar Publicação</button>
                            <button onClick={() => setShowPublish(false)} className="bg-gray-700 hover:bg-gray-600 p-3 rounded">Cancelar</button>
                        </div>
                    </div>
                </div>
            )}
            {/* Header */}
            <div className={`h-14 flex items-center justify-between px-4 border-b ${getThemeClass('panel')} ${getThemeClass('border')} shadow-sm z-10`}>
                <div className="flex items-center gap-4">
                    <button onClick={onClose} className="p-2 hover:bg-black/20 rounded flex items-center gap-2 transition-colors">
                        <X size={20} />
                        <span className="font-bold tracking-wider">ZCS MOD CREATOR</span>
                    </button>
                    
                    <div className="h-6 w-px bg-current opacity-20 mx-2"></div>
                    
                    <div className="flex bg-black/10 rounded overflow-hidden">
                        {(['HUB', 'VISUAL', 'MANIFEST', 'TEST'] as const).map(tab => (
                            <button 
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-4 py-1.5 text-sm font-medium transition-colors ${activeTab === tab ? getThemeClass('accent') + ' text-black shadow-inner' : 'hover:bg-black/20'}`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <select 
                        value={theme} 
                        onChange={(e) => setTheme(e.target.value as Theme)}
                        className={`text-sm px-2 py-1 rounded bg-black/20 outline-none focus:ring-2`}
                    >
                        <option value="dark">Catppuccin Dark</option>
                        <option value="black">Amoled Black</option>
                        <option value="dark-blue">Unreal Blue</option>
                        <option value="light">Light Editor</option>
                    </select>

                    <button onClick={onTestMod} className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white px-4 py-1.5 rounded font-bold shadow-md transition-transform hover:scale-105">
                        <Play size={16} fill="currentColor" />
                        TESTAR MOD
                    </button>
                    <button onClick={() => { 
                        if (!currentUser && !localStorage.getItem('zombiecraft_current_user')) setShowLogin(true); 
                        else setShowPublish(true); 
                    }} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-1.5 rounded font-bold shadow-md transition-transform hover:scale-105">
                        <Upload size={16} />
                        PUBLICAR
                    </button>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-hidden relative">
                {activeTab === 'HUB' && <ModHub theme={theme} getThemeClass={getThemeClass} onCriarMod={() => {
                    if (!currentUser && !localStorage.getItem('zombiecraft_current_user')) setShowLogin(true);
                    else setActiveTab('VISUAL');
                }} />}
                {activeTab === 'VISUAL' && <VisualEditor theme={theme} getThemeClass={getThemeClass} zoom={zoom} setZoom={setZoom} blocks={blocks} setBlocks={setBlocks} connections={connections} setConnections={setConnections} pan={pan} setPan={setPan} canvasRef={canvasRef} />}
                {activeTab === 'MANIFEST' && <ManifestEditor theme={theme} getThemeClass={getThemeClass} />}
            </div>
        </div>
    );
};

// --- SUB-COMPONENTS ---

const ModHub = ({ getThemeClass, onCriarMod }: any) => (
    <div className="w-full h-full p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h1 className="text-4xl font-black mb-2 flex items-center gap-3"><Globe className="text-blue-500" size={40} /> HUB DE MODS</h1>
                    <p className="opacity-70 text-lg mb-4">Descubra, instale e publique modificações criadas pela comunidade.</p>
                    <button onClick={onCriarMod} className="bg-green-600 hover:bg-green-500 text-white font-bold py-2.5 px-6 rounded shadow-md flex items-center gap-2 text-lg hover:scale-105 transition-transform"><Plus size={20} /> VAMOS CRIAR UM MOD!</button>
                </div>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 opacity-50" size={20} />
                    <input type="text" placeholder="Procurar mods..." className={`pl-10 pr-4 py-3 rounded-xl w-80 outline-none border focus:ring-2 focus:ring-blue-500 transition-all ${getThemeClass('panel')} ${getThemeClass('border')}`} />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                    {name: 'Litxuma Ultra Realistic', author: 'IA_Litxuma', v: '3.0.0', stars: 9999, tag: 'Shaders', color: 'bg-indigo-600', isFeatured: true},
                    {name: 'Industrial Revolution', author: 'TechMaster', v: '1.2.0', stars: 452, tag: 'Tecnologia', color: 'bg-orange-500'},
                    {name: 'Magic & Spells', author: 'WizardOfOz', v: '2.0.1', stars: 389, tag: 'Magia', color: 'bg-purple-500'},
                    {name: 'More Zombies', author: 'ApocalypseSurv', v: '0.9.5', stars: 210, tag: 'Mobs', color: 'bg-green-500'},
                    {name: 'Modern Vehicles', author: 'DriverX', v: '1.0.0', stars: 156, tag: 'Veículos', color: 'bg-blue-500'},
                    {name: 'Hardcore Mode', author: 'PainEnjoyer', v: '1.1.0', stars: 42, tag: 'Sobrevivência', color: 'bg-red-500'},
                ].map((mod, i) => (
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        key={i} 
                        className={`rounded-xl border ${mod.isFeatured ? 'border-yellow-500 shadow-yellow-500/20' : getThemeClass('border')} ${getThemeClass('panel')} overflow-hidden hover:border-blue-500/50 transition-colors shadow-lg cursor-pointer group`}
                    >
                        <div className={`h-32 ${mod.color} w-full flex items-center justify-center relative overflow-hidden`}>
                            {mod.isFeatured && <div className="absolute top-2 right-2 bg-yellow-500 text-black text-xs font-bold px-2 py-1 rounded flex items-center gap-1 shadow"><Zap size={12}/> DESTAQUE DA IA</div>}
                            <Layers size={60} className="text-black/20" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                            <span className="absolute bottom-3 left-3 bg-black/50 text-white text-xs px-2 py-1 rounded backdrop-blur-sm flex items-center gap-1">
                                <Tag size={12} /> {mod.tag}
                            </span>
                        </div>
                        <div className="p-5">
                            <h3 className="font-bold text-xl mb-1 group-hover:text-blue-400 transition-colors">{mod.name}</h3>
                            <div className="flex items-center text-sm opacity-60 mb-4 gap-4">
                                <span className="flex items-center gap-1"><User size={14} /> {mod.author}</span>
                                <span>v{mod.v}</span>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => alert(`Mod instalado! Ative-o gerenciando os mods no seu mundo.`)} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-2 rounded font-semibold transition-colors">
                                    Instalar
                                </button>
                                <button className={`px-3 rounded border ${getThemeClass('border')} hover:bg-white/5`}>
                                    ⭐ {mod.stars}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    </div>
);



const CATEGORIES = [
    { cat: 'Eventos', color: 'border-red-500', 
      items: [
        'Ao iniciar mundo', 'Ao fechar mundo', 'Ao amanhecer', 'Ao anoitecer', 'Ao chover', 'Ao nevar',
        'Ao jogador nascer', 'Ao jogador morrer', 'Ao jogador conectar', 'Ao jogador desconectar',
        'Ao boss aparecer', 'Ao boss morrer', 'Ao quebrar bloco', 'Ao colocar bloco', 'Ao usar item',
        'Ao abrir baú', 'Ao dormir'
      ] 
    },
    { cat: 'Condições', color: 'border-yellow-500', 
      items: ['Se', 'Senão', 'Senão Se', 'Enquanto', 'Repetir', 'Comparar', 'Igual', 'Diferente', 'Maior', 'Menor', 'Entre Valores'] 
    },
    { cat: 'Matemática', color: 'border-blue-400', 
      items: ['Soma', 'Subtração', 'Multiplicação', 'Divisão', 'Potência', 'Raiz', 'Aleatório', 'Porcentagem', 'Média'] 
    },
    { cat: 'Variáveis', color: 'border-gray-400', 
      items: ['Criar variável', 'Alterar variável', 'Salvar variável', 'Carregar variável', 'Variável Global', 'Variável Local'] 
    },
    { cat: 'Jogador', color: 'border-blue-500', 
      items: ['Vida', 'Fome', 'Sede', 'Temperatura', 'XP', 'Nível', 'Dinheiro', 'Inventário', 'Estamina', 'Defesa', 'Velocidade'] 
    },
    { cat: 'Mundo', color: 'border-purple-500', 
      items: ['Hora', 'Dia', 'Clima', 'Gravidade', 'Lua de Sangue', 'Estação'] 
    },
    { cat: 'Blocos', color: 'border-gray-500', 
      items: ['Criar bloco', 'Remover bloco', 'Alterar bloco', 'Trocar textura', 'Alterar colisão', 'Alterar resistência'] 
    },
    { cat: 'Mobs', color: 'border-green-500', 
      items: ['Criar mob', 'Remover mob', 'Teletransportar mob', 'Alterar vida', 'Alterar IA', 'Alterar dano'] 
    },
    { cat: 'IA dos Mobs', color: 'border-teal-500', 
      items: ['Perseguir', 'Fugir', 'Patrulhar', 'Procurar jogador', 'Procurar comida', 'Defender área', 'Defender aliado'] 
    },
    { cat: 'RPG', color: 'border-indigo-500', 
      items: ['Dar XP', 'Remover XP', 'Subir nível', 'Aprender habilidade', 'Esquecer habilidade', 'Aplicar Buff', 'Aplicar Debuff'] 
    },
    { cat: 'Inventário', color: 'border-orange-500', 
      items: ['Adicionar item', 'Remover item', 'Verificar item', 'Abrir inventário', 'Fechar inventário'] 
    },
    { cat: 'Interface', color: 'border-pink-500', 
      items: ['Criar botão', 'Criar texto', 'Criar imagem', 'Criar barra', 'Criar janela', 'Criar menu'] 
    },
    { cat: 'Efeitos', color: 'border-cyan-500', 
      items: ['Tremor de tela', 'Flash', 'Fumaça', 'Chuva', 'Neve', 'Partículas'] 
    },
    { cat: 'Áudio', color: 'border-emerald-500', 
      items: ['Tocar música', 'Parar música', 'Tocar som', 'Alterar volume'] 
    },
    { cat: 'Multiplayer', color: 'border-sky-500', 
      items: ['Enviar mensagem', 'Criar sala', 'Entrar em sala', 'Expulsar jogador', 'Sincronizar variável'] 
    }
];

const getPortColor = (type: string) => {
    switch (type?.toUpperCase()) {
        case 'FLOW': return 'bg-white border-gray-400';
        case 'NUMBER': return 'bg-blue-400 border-blue-600';
        case 'BOOL': return 'bg-green-400 border-green-600';
        case 'OBJECT': return 'bg-purple-400 border-purple-600';
        case 'TEXT': return 'bg-orange-400 border-orange-600';
        case 'EVENT': return 'bg-red-500 border-red-700';
        default: return 'bg-yellow-500 border-yellow-600';
    }
};

    const getStrokeColor = (type: string) => {
        // Return yellow for draft line logic explicitly, but wait, this is for all lines.
        // Actually, we'll just check if it's draft in the SVG
        switch (type?.toUpperCase()) {
            case 'FLOW': return '#ffffff';
            case 'NUMBER': return '#60a5fa';
            case 'BOOL': return '#4ade80';
            case 'OBJECT': return '#c084fc';
            case 'TEXT': return '#fb923c';
            case 'EVENT': return '#ef4444';
            default: return '#eab308';
        }
    };

const VisualEditor = ({ getThemeClass, zoom, setZoom, blocks, setBlocks, connections, setConnections, pan, setPan, canvasRef }: any) => {
    const [isPanning, setIsPanning] = useState(false);
    const [draftConnection, setDraftConnection] = useState<any>(null);
    const [selectedBlock, setSelectedBlock] = useState<any>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const handleWheel = (e: React.WheelEvent) => {
        if (e.ctrlKey || e.metaKey) {
            const zoomDelta = e.deltaY > 0 ? -0.1 : 0.1;
            setZoom((z: number) => Math.min(Math.max(0.25, z + zoomDelta), 4));
        } else {
            setPan((p: any) => ({ x: p.x - e.deltaX, y: p.y - e.deltaY }));
        }
    };

    const handlePointerDown = (e: React.PointerEvent) => {
        if (e.target === canvasRef.current) {
            setIsPanning(true);
            e.currentTarget.setPointerCapture(e.pointerId);
        }
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (isPanning) {
            setPan((p: any) => ({ x: p.x + e.movementX, y: p.y + e.movementY }));
        }
        if (draftConnection && canvasRef.current) {
            const rect = canvasRef.current.getBoundingClientRect();
            const x = (e.clientX - rect.left - pan.x) / zoom;
            const y = (e.clientY - rect.top - pan.y) / zoom;
            setDraftConnection((d: any) => ({ ...d, endX: x, endY: y }));
        }
    };

    const handlePointerUp = (e: React.PointerEvent) => {
        setIsPanning(false);
        try { if (e.target instanceof Element) e.target.releasePointerCapture(e.pointerId); } catch(err){}
        try { if (e.currentTarget instanceof Element) e.currentTarget.releasePointerCapture(e.pointerId); } catch(err){}

        if (draftConnection) {
            // Tentativa de dropar a conexão lendo o elemento sob o mouse
            const targetEl = document.elementFromPoint(e.clientX, e.clientY);
            const portEl = targetEl?.closest('[data-portid]');
            
            if (portEl) {
                const targetNodeId = portEl.getAttribute('data-nodeid');
                const targetPortId = portEl.getAttribute('data-portid');
                const targetIsInput = portEl.getAttribute('data-isinput') === 'true';
                const targetType = portEl.getAttribute('data-porttype');

                if (targetNodeId && targetPortId) {
                    finishConnection(draftConnection.startNode, draftConnection.startPort, targetNodeId, targetPortId, draftConnection.isInput, targetIsInput, draftConnection.type, targetType || 'ANY');
                } else {
                    setDraftConnection(null);
                }
            } else {
                setDraftConnection(null);
            }
        }
    };

    const startConnection = (e: React.PointerEvent, blockId: string, portId: string, isInput: boolean, type: string) => {
        e.stopPropagation();
        e.preventDefault();
        if (e.nativeEvent) {
            e.nativeEvent.stopPropagation();
            e.nativeEvent.stopImmediatePropagation();
        }
        
        if (canvasRef.current) {
            const rect = canvasRef.current.getBoundingClientRect();
            const x = (e.clientX - rect.left - pan.x) / zoom;
            const y = (e.clientY - rect.top - pan.y) / zoom;
            setDraftConnection({ startNode: blockId, startPort: portId, isInput, type, startX: x, startY: y, endX: x, endY: y });
        }
    };

    const finishConnection = (fromNodeId: string, fromPortId: string, toNodeId: string, toPortId: string, fromIsInput: boolean, toIsInput: boolean, fromType: string, toType: string) => {
        if (fromNodeId === toNodeId) {
            setDraftConnection(null);
            return;
        }
        if (fromIsInput === toIsInput) {
            // Cannot connect input to input or output to output
            setDraftConnection(null);
            return;
        }

        // Type compat verification
        if (fromType !== toType && fromType !== 'ANY' && toType !== 'ANY') {
            alert('🔴 TIPOS INCOMPATÍVEIS:\nNão é possível conectar ' + fromType + ' com ' + toType);
            setDraftConnection(null);
            return;
        }

        const newConn = {
            id: 'c_' + Date.now() + Math.random(),
            fromNode: fromIsInput ? toNodeId : fromNodeId,
            fromPort: fromIsInput ? toPortId : fromPortId,
            toNode: fromIsInput ? fromNodeId : toNodeId,
            toPort: fromIsInput ? fromPortId : toPortId,
            type: fromType
        };
        
        setConnections((prev: any) => [...prev.filter((c:any) => !(c.toNode === newConn.toNode && c.toPort === newConn.toPort)), newConn]);
        setDraftConnection(null);
    };

    const addBlock = (cat: string, item: string) => {
        let newBlock: any = {
            id: 'b_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
            x: -pan.x / zoom + 350 + (Math.random() * 50),
            y: -pan.y / zoom + 200 + (Math.random() * 50),
            type: cat === 'Eventos' ? 'EVENT' : 'LOGIC',
            name: item,
            inputs: [],
            outputs: []
        };
        
        // Input / output mapping heuristic
        if (cat === 'Eventos') {
            newBlock.outputs.push({ id: 'o1', type: 'FLOW', name: 'Executar' });
        } else if (item === 'Se' || item === 'Enquanto') {
            newBlock.inputs.push({ id: 'i1', type: 'FLOW', name: 'Entrada' });
            newBlock.inputs.push({ id: 'i2', type: 'BOOL', name: 'Condição' });
            newBlock.outputs.push({ id: 'o1', type: 'FLOW', name: 'Verdadeiro' });
            newBlock.outputs.push({ id: 'o2', type: 'FLOW', name: 'Falso' });
        } else if (cat === 'Matemática' || item === 'Comparar' || item === 'Igual' || item === 'Maior' || item === 'Menor' || item === 'Diferente') {
            newBlock.inputs.push({ id: 'i1', type: 'NUMBER', name: 'A' });
            newBlock.inputs.push({ id: 'i2', type: 'NUMBER', name: 'B' });
            newBlock.outputs.push({ id: 'o1', type: (cat === 'Matemática') ? 'NUMBER' : 'BOOL', name: 'Resultado' });
        } else if (cat === 'Variáveis') {
            newBlock.inputs.push({ id: 'i1', type: 'FLOW', name: 'Entrada' });
            newBlock.inputs.push({ id: 'i2', type: 'TEXT', name: 'Nome' });
            if (item.includes('Carregar') || item.includes('Global') || item.includes('Local')) {
                newBlock.outputs.push({ id: 'o1', type: 'ANY', name: 'Valor' });
            } else {
                newBlock.inputs.push({ id: 'i3', type: 'ANY', name: 'Valor' });
            }
            newBlock.outputs.push({ id: 'o2', type: 'FLOW', name: 'Saída' });
        } else if (cat === 'Jogador' || cat === 'Mobs' || cat === 'Inventário' || cat === 'IA dos Mobs' || cat === 'RPG' || cat === 'Mundo' || cat === 'Blocos' || cat === 'Interface' || cat === 'Efeitos' || cat === 'Áudio' || cat === 'Multiplayer') {
            // Generalize with generic FLOW + object references
            newBlock.inputs.push({ id: 'i1', type: 'FLOW', name: 'Entrada' });
            
            if (item.includes('Vida') || item.includes('Velocidade') || item.includes('Dano') || item.includes('XP') || item.includes('Fome') || item.includes('Sede')) {
                newBlock.inputs.push({ id: 'i2', type: 'OBJECT', name: 'Alvo' });
                newBlock.inputs.push({ id: 'i3', type: 'NUMBER', name: 'Valor' });
            } else if (item.includes('Item')) {
                newBlock.inputs.push({ id: 'i2', type: 'OBJECT', name: 'Item' });
                newBlock.inputs.push({ id: 'i3', type: 'NUMBER', name: 'Quantidade' });
            } else if (item.includes('Mensagem') || item.includes('Texto')) {
                newBlock.inputs.push({ id: 'i2', type: 'TEXT', name: 'Texto' });
            } else {
               newBlock.inputs.push({ id: 'i2', type: 'OBJECT', name: 'Mundo/Alvo' });
            }
            newBlock.outputs.push({ id: 'o1', type: 'FLOW', name: 'Saída' });
        } else {
            newBlock.inputs.push({ id: 'i1', type: 'FLOW', name: 'Entrada' });
            newBlock.outputs.push({ id: 'o1', type: 'FLOW', name: 'Saída' });
        }

        setBlocks([...blocks, newBlock]);
    };

    const handleNodeDrag = (e: any, info: any, b: any) => {
        const newBlocks = blocks.map((blk: any) => {
            if (blk.id === b.id) {
                return { ...blk, x: blk.x + info.offset.x / zoom, y: blk.y + info.offset.y / zoom };
            }
            return blk;
        });
        setBlocks(newBlocks);
    };

    // Filtra as categorias com base na pesquisa
    const filteredCategories = CATEGORIES.map(c => ({
        ...c,
        items: c.items.filter(i => i.toLowerCase().includes(searchTerm.toLowerCase()))
    })).filter(c => c.items.length > 0);

    return (
        <div className="flex w-full h-full select-none" onPointerUp={handlePointerUp} onPointerMove={handlePointerMove}>
            {/* EXPLORADOR */}
            <div className={`w-72 flex flex-col border-r ${getThemeClass('panel')} ${getThemeClass('border')} z-20 shadow-xl`}>
                <div className="p-3 border-b border-current opacity-20">
                    <div className="relative">
                        <Search className="absolute left-2 top-1/2 -translate-y-1/2" size={16} />
                        <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Pesquisar categoria ou bloco..." className="w-full bg-black/20 rounded pl-8 pr-2 py-1.5 text-[13px] outline-none focus:ring-1 focus:ring-blue-500 transition-shadow" />
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-2 scrollbar-thin">
                    {filteredCategories.map(c => (
                        <div key={c.cat} className="mb-4">
                            <h4 className={`text-[11px] font-bold uppercase mb-2 pl-2 border-l-2 ${c.color} opacity-70 tracking-wider flex items-center justify-between`}>
                                <span>{c.cat}</span>
                                <span className="opacity-50 text-[10px] mr-2">{c.items.length} blocos</span>
                            </h4>
                            <div className="space-y-0.5">
                                {c.items.map(item => (
                                    <button 
                                        key={item} 
                                        onClick={() => addBlock(c.cat, item)} 
                                        className="w-full text-left px-3 py-1.5 text-sm hover:bg-white/10 rounded transition-colors flex items-center justify-between group cursor-pointer border border-transparent hover:border-white/10"
                                    >
                                        <span className="truncate pr-2">{item}</span>
                                        <Plus size={14} className="opacity-0 group-hover:opacity-100 flex-shrink-0" />
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                    {filteredCategories.length === 0 && (
                        <div className="p-4 text-center opacity-50 text-sm">
                            Nenhum bloco encontrado. Tente pesquisar "vida" ou "dano".
                        </div>
                    )}
                </div>
                <div className="p-4 border-t border-current opacity-20">
                    <button className="w-full bg-indigo-600 hover:bg-indigo-500 text-white rounded p-2 text-sm font-bold shadow-lg flex items-center justify-center gap-2 transition-transform hover:scale-105 active:scale-95">
                        <Zap size={16} fill="currentColor" /> Gerar Lógica c/ IA
                    </button>
                </div>
            </div>

            {/* CANVAS */}
            <div 
                className={`flex-1 relative overflow-hidden bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-black/10 to-transparent ${isPanning ? 'cursor-grabbing' : 'cursor-default'}`}
                style={{ backgroundImage: 'radial-gradient(circle at 20px 20px, rgba(255,255,255,0.05) 2px, transparent 0)', backgroundSize: `${40 * zoom}px ${40 * zoom}px`, backgroundPosition: `${pan.x}px ${pan.y}px` }}
                onWheel={handleWheel}
                onPointerDown={handlePointerDown}
                ref={canvasRef}
            >
                <div className="absolute top-4 right-4 flex bg-black/50 backdrop-blur rounded-lg border border-black/20 p-1 z-30 shadow-lg text-white">
                    <button onClick={() => setZoom(Math.max(0.1, zoom - 0.1))} className="p-2 hover:bg-white/10 rounded text-xl leading-none">-</button>
                    <span className="px-3 py-1 text-sm font-mono min-w-[4rem] text-center flex items-center justify-center">{Math.round(zoom * 100)}%</span>
                    <button onClick={() => setZoom(Math.min(4, zoom + 0.1))} className="p-2 hover:bg-white/10 rounded text-xl leading-none">+</button>
                </div>

                <div 
                    className="absolute top-0 left-0 origin-top-left" 
                    style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, width:0, height:0 }}
                >
                    <SvgConnections connections={connections} blocks={blocks} draft={draftConnection} />
                    
                    {blocks.map((b: any) => (
                        <motion.div 
                            key={b.id}
                            drag
                            dragMomentum={false}
                            initial={{ x: b.x, y: b.y }}
                            onDragEnd={(e, info) => handleNodeDrag(e, info, b)}
                            onPointerDown={(e: any) => { e.stopPropagation(); setSelectedBlock(b); }}
                            className={`absolute shadow-2xl rounded-lg border ${selectedBlock?.id === b.id ? 'border-yellow-500 shadow-yellow-500/50' : 'border-gray-700/80'} min-w-[200px] bg-[#1e1e2e]/90 backdrop-blur-md`}
                            style={{ cursor: 'grab', left: b.x, top: b.y }}
                            whileDrag={{ cursor: 'grabbing', scale: 1.02, zIndex: 50 }}
                        >
                            <div className={`px-4 py-2 font-bold flex justify-between items-center rounded-t-lg ${b.type === 'EVENT' ? 'bg-red-800' : 'bg-blue-800'}`}>
                                <span className="text-white text-sm tracking-wide break-words max-w-[200px]">{b.name}</span>
                            </div>
                            <div className="p-3 flex flex-col gap-3 relative min-h-[40px]">
                                
                                {/* INPUTS */}
                                <div className="absolute -left-[14px] top-0 bottom-0 flex flex-col justify-center gap-4" onPointerDownCapture={e => e.stopPropagation()}>
                                    {(b.inputs || []).map((port: any) => (
                                        <motion.div 
                                            key={port.id} 
                                            className="group relative flex items-center"
                                            data-nodeid={b.id}
                                            data-portid={port.id}
                                            data-isinput="true"
                                            data-porttype={port.type}
                                            onPointerDown={(e) => startConnection(e, b.id, port.id, true, port.type)}
                                        >
                                            <div className={`w-[24px] h-[24px] rounded border-2 shadow-lg flex items-center justify-center transition-transform cursor-crosshair z-20 hover:scale-125 hover:shadow-[0_0_10px_#fff] ${getPortColor(port.type)}`}>
                                            </div>
                                            <span className="absolute left-7 bg-black text-white text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">{port.name} ({port.type})</span>
                                        </motion.div>
                                    ))}
                                </div>

                                {/* OUTPUTS */}
                                <div className="absolute -right-[14px] top-0 bottom-0 flex flex-col justify-center gap-4" onPointerDownCapture={e => e.stopPropagation()}>
                                    {(b.outputs || []).map((port: any) => (
                                        <motion.div 
                                            key={port.id} 
                                            className="group relative flex items-center justify-end"
                                            data-nodeid={b.id}
                                            data-portid={port.id}
                                            data-isinput="false"
                                            data-porttype={port.type}
                                            onPointerDown={(e) => startConnection(e, b.id, port.id, false, port.type)}
                                        >
                                            <span className="absolute right-7 bg-black text-white text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">{port.name} ({port.type})</span>
                                            <div className={`w-[24px] h-[24px] rounded border-2 shadow-lg flex items-center justify-center transition-transform cursor-crosshair z-20 hover:scale-125 hover:shadow-[0_0_10px_#fff] ${getPortColor(port.type)}`}>
                                                <ChevronRight size={14} className="text-black opacity-60" />
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                                
                                {b.props && Object.entries(b.props).map(([k, v]) => (
                                    <div key={k} className="flex justify-between items-center text-xs px-2 mt-1">
                                        <span className="opacity-70 font-semibold">{k}</span>
                                        <span className="bg-black/30 px-2 py-0.5 rounded font-mono">{String(v)}</span>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* INSPECTOR */}
            <div className={`w-[300px] flex flex-col border-l ${getThemeClass('panel')} ${getThemeClass('border')} z-30 shadow-xl`}>
                <div className="p-4 border-b border-black/20 bg-black/10">
                    <h3 className="font-bold flex items-center gap-2"><Wrench size={18} /> Inspetor de Bloco</h3>
                </div>
                <div className="p-4 flex-1 overflow-y-auto scrollbar-thin">
                    {selectedBlock ? (
                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] uppercase font-bold opacity-50 block mb-1">ID do Bloco</label>
                                <div className="font-mono text-xs opacity-70 bg-black/20 p-2 rounded truncate">{selectedBlock.id}</div>
                            </div>
                            <div>
                                <label className="text-[10px] uppercase font-bold opacity-50 block mb-1">Nome do Nó</label>
                                <input type="text" value={selectedBlock.name} readOnly className="w-full bg-black/30 rounded px-3 py-2 text-sm outline-none border border-transparent focus:border-blue-500" />
                            </div>
                            
                            {selectedBlock.props && Object.keys(selectedBlock.props).map(k => (
                                <div key={k}>
                                    <label className="text-[10px] uppercase font-bold opacity-50 block mb-1">Propriedade: {k}</label>
                                    <input type="text" defaultValue={selectedBlock.props[k]} className="w-full bg-black/30 rounded px-3 py-2 text-sm outline-none border border-transparent focus:border-blue-500" />
                                </div>
                            ))}

                            <hr className="border-black/20 my-4" />
                            <div>
                                <h4 className="font-bold text-sm mb-2 text-red-400">Zona de Perigo</h4>
                                <button onClick={() => {
                                    setBlocks(blocks.filter((b: any) => b.id !== selectedBlock.id));
                                    setConnections(connections.filter((c: any) => c.fromNode !== selectedBlock.id && c.toNode !== selectedBlock.id));
                                    setSelectedBlock(null);
                                }} className="w-full bg-red-900/40 text-red-400 border border-red-900/50 hover:bg-red-800/80 rounded py-2 text-sm font-bold flex justify-center items-center gap-2 transition-colors">
                                    <Trash2 size={16} /> Excluir Nó
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="opacity-40 text-sm flex flex-col items-center justify-center h-full text-center p-4 gap-4">
                            <Cpu size={40} className="opacity-50" />
                            <span>Selecione um bloco no painel central para editar suas propriedades aqui.</span>
                        </div>
                    )}
                </div>
            </div>
            
            {/* DEBUGGER */}
            <div className={`absolute bottom-0 left-72 right-[300px] h-48 border-t border-l border-r ${getThemeClass('panel')} ${getThemeClass('border')} z-20 flex flex-col shadow-[0_-10px_30px_rgba(0,0,0,0.5)] rounded-t-lg overflow-hidden`}>
                <div className="flex justify-between items-center px-4 py-2 border-b border-black/20 bg-black/30 backdrop-blur-md">
                    <div className="flex gap-4 text-[10px] font-bold uppercase tracking-wider">
                        <button className="flex items-center gap-1.5 hover:text-white transition-colors"><Cpu size={12}/> ZCS Compilador Visual</button>
                        <button className="flex items-center gap-1.5 text-red-400 hover:text-red-300 transition-colors"><ShieldAlert size={12}/> Erros ({connections.length === 0 ? 1 : 0})</button>
                        <button className="flex items-center gap-1.5 text-yellow-400 hover:text-yellow-300 transition-colors"><AlertTriangle size={12}/> Avisos (0)</button>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-4 font-mono text-[11px] leading-relaxed space-y-1.5 bg-[#0f0f15]/90">
                    <div className="text-gray-500">[SYSTEM] Inicializando Sandbox Virtual... OK</div>
                    <div className="text-blue-400">[INFO] Módulos de mais de 500 blocos carregados e prontos.</div>
                    {connections.length === 0 && (
                        <div className="text-red-400 flex flex-col mt-2 p-2 bg-red-900/20 rounded border border-red-900/50">
                            <span className="flex items-center gap-2 font-bold mb-1"><AlertTriangle size={14}/> ERRO DE LÓGICA CRÍTICO:</span>
                            <span className="ml-5">Mod não fará nada. Nenhum evento de inicialização conectado.</span>
                            <span className="ml-5 text-yellow-500 font-semibold mt-1">Sugestão: Conecte o evento "Ao iniciar mundo" ou adicione lógica conectando as saídas à entrada de outro nó.</span>
                        </div>
                    )}
                    {connections.length > 0 && (
                        <div className="text-green-400 flex items-center gap-2 mt-2 p-2 bg-green-900/10 rounded">
                            <CheckCircle size={14} /> [SUCCESS] Análise de fluxo completa. Zero problemas detectados em {blocks.length} blocos e {connections.length} conexões visuais.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const ManifestEditor = ({ getThemeClass }: any) => (
    <div className="w-full h-full p-8 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
             <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-black flex items-center gap-3"><FileJson className="text-yellow-500" size={32} /> Configurações Gerais do Mod (Manifesto)</h2>
                <button className="bg-blue-600 hover:bg-blue-500 px-6 py-2 rounded font-bold shadow-lg flex items-center gap-2 transition-transform hover:scale-105">
                    <Save size={18} /> Salvar Alterações
                </button>
            </div>
            
            <div className={`rounded-xl border shadow-xl ${getThemeClass('panel')} ${getThemeClass('border')} p-6 space-y-6`}>
                <div className="grid grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-bold opacity-70 mb-2">ID Único do Mod</label>
                        <input type="text" defaultValue="com.zcs.meu_mod_epico" className="w-full bg-black/30 rounded-lg px-4 py-3 outline-none border border-transparent focus:border-blue-500 font-mono text-sm" />
                    </div>
                    <div>
                        <label className="block text-sm font-bold opacity-70 mb-2">Nome Visível no Jogo</label>
                        <input type="text" defaultValue="Meu Mod Épico" className="w-full bg-black/30 rounded-lg px-4 py-3 outline-none border border-transparent focus:border-blue-500" />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-bold opacity-70 mb-2">Descrição Longa do Mod</label>
                    <textarea rows={6} className="w-full bg-black/30 rounded-lg px-4 py-3 outline-none border border-transparent focus:border-blue-500 resize-none" defaultValue="Este mod adiciona um sistema de sobrevivência complexo..."></textarea>
                </div>
                
                <div>
                    <label className="block text-sm font-bold opacity-70 mb-3">Permissões de Sandbox (Segurança)</label>
                    <div className="flex gap-4 flex-wrap">
                        {['Modificar Entidades', 'Ler Chat', 'Renderizar UI Customizada', 'Salvar Dados Locais', 'Tocar Áudio'].map(p => (
                            <label key={p} className="flex items-center gap-2 bg-black/20 px-3 py-2 rounded-lg cursor-pointer hover:bg-black/40">
                                <input type="checkbox" defaultChecked className="w-4 h-4 accent-blue-500" />
                                <span>{p}</span>
                            </label>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    </div>
);


const SvgConnections = ({ connections, blocks, draft }: any) => {
    
    // Calcula posição aproximada da porta no canvas
    const getPortCoords = (nodeId: string, portId: string, isInput: boolean) => {
        const b = blocks.find((blk: any) => blk.id === nodeId);
        if (!b) return { x: 0, y: 0 };
        
        let portIndex = 0;
        let totalPorts = 1;
        if (isInput) {
            portIndex = b.inputs?.findIndex((p:any) => p.id === portId) || 0;
            totalPorts = b.inputs?.length || 1;
        } else {
            portIndex = b.outputs?.findIndex((p:any) => p.id === portId) || 0;
            totalPorts = b.outputs?.length || 1;
        }

        const headerH = 40;
        const bodyH = Math.max(80, totalPorts * 40);
        const yOffset = headerH + (bodyH / (totalPorts + 1)) * (portIndex + 1);
        
        const baseY = b.y + yOffset;
        const basex = isInput ? b.x - 2 : b.x + 200 + 2; 
        return { x: basex, y: baseY };
    };

    return (
        <svg className="absolute inset-0 pointer-events-none z-10 w-full h-full overflow-visible">
            {connections.map((c: any) => {
                const start = getPortCoords(c.fromNode, c.fromPort, false);
                const end = getPortCoords(c.toNode, c.toPort, true);
                const dist = Math.abs(end.x - start.x);
                const controlX = Math.max(dist * 0.5, 60);

                const path = `M ${start.x} ${start.y} C ${start.x + controlX} ${start.y}, ${end.x - controlX} ${end.y}, ${end.x} ${end.y}`;
                const color = getStrokeColor(c.type);

                return (
                    <path 
                        key={c.id}
                        d={path} 
                        fill="none" 
                        stroke={color} 
                        strokeWidth="4" 
                        strokeLinecap="round"
                        className="animate-pulse" 
                        style={{ filter: `drop-shadow(0 0 5px ${color})` }}
                    />
                );
            })}

            {draft && (() => {
                let start, end;
                if (!draft.isInput) {
                    start = getPortCoords(draft.startNode, draft.startPort, false);
                    end = { x: draft.endX, y: draft.endY };
                } else {
                    start = { x: draft.endX, y: draft.endY };
                    end = getPortCoords(draft.startNode, draft.startPort, true);
                }

                const dist = Math.abs(end.x - start.x);
                const controlX = Math.max(dist * 0.5, 60);
                const path = `M ${start.x} ${start.y} C ${start.x + controlX} ${start.y}, ${end.x - controlX} ${end.y}, ${end.x} ${end.y}`;
                const color = '#eab308'; // Linha amarela

                return (
                    <path 
                        d={path} 
                        fill="none" 
                        stroke={color} 
                        strokeWidth="4" 
                        strokeLinecap="round"
                        strokeDasharray="8 8"
                        className="animate-pulse"
                        style={{ filter: `drop-shadow(0 0 5px ${color})` }}
                    />
                );
            })()}
        </svg>
    );
};
