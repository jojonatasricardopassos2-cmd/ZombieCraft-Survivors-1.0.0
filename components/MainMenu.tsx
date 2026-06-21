import { ModCreator } from './ModCreator.tsx';

import React, { useState, useEffect } from 'react';
import { TRANSLATIONS } from '../constants.ts';
import { SavedWorld, GameOptions, SavedAccount, DEFAULT_BINDINGS, KeyBindings } from '../types.ts';
import { loadAllSavesMetadata, loadWorldFromDB, saveWorldToDB, deleteWorldFromDB } from '../utils/storage.ts';
import { audio } from '../utils/audio.ts';
import { TouchConfigUI } from './UI/TouchConfigUI.tsx';
import { ACHIEVEMENTS_LIST } from '../utils/achievementsList.ts';

interface MainMenuProps {
  onStartGame: (world: SavedWorld | null, newWorldConfig?: { name: string, seed: number, options: GameOptions }) => void;
  lang: 'EN' | 'PT' | 'ES' | 'JA';
  setLang: (l: 'EN' | 'PT' | 'ES' | 'JA') => void;
}

type MenuState = 'MAIN' | 'SELECT_WORLD' | 'CREATE_WORLD' | 'EDIT_WORLD' | 'OPTIONS' | 'ACHIEVEMENTS' | 'ONLINE_LOBBY' | 'CREATE_ROOM' | 'JOIN_ROOM' | 'LOGIN' | 'FRIENDS' | 'EDIT_SKIN' | 'MODS';

export const MainMenu: React.FC<MainMenuProps> = ({ onStartGame, lang, setLang }) => {
  const [menuState, setMenuState] = useState<MenuState>('LOGIN');
  const [showTouchConfig, setShowTouchConfig] = useState(false);
  const [saves, setSaves] = useState<SavedWorld[]>([]);
  const [selectedWorldId, setSelectedWorldId] = useState<string | null>(null);

  // Accounts
  const [accounts, setAccounts] = useState<SavedAccount[]>([]);
  const [currentUser, setCurrentUser] = useState<SavedAccount | null>(null);
  
  // Login fields
  const [loginName, setLoginName] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Options
  const [optionsTab, setOptionsTab] = useState<'GAME' | 'VIDEO' | 'AUDIO' | 'LANGUAGE' | 'TOUCH' | 'ACCOUNTS' | 'CONTROLS'>('GAME');
  const [showCoordinates, setShowCoordinates] = useState(false);
  const [tutorialEnabled, setTutorialEnabled] = useState(true);
  const [showMinimap, setShowMinimap] = useState(true);
  const [adminMode, setAdminMode] = useState(false);
  const [seasonsEnabled, setSeasonsEnabled] = useState(false);
  const [isMobile, setIsMobile] = useState(false); // Mobile Toggle
  const [graphicsQuality, setGraphicsQuality] = useState<'UGLY' | 'NORMAL' | 'ULTRA'>('ULTRA');
  const [renderDistance, setRenderDistance] = useState(15);
  const [volume, setVolume] = useState(0.3);
  const [showAdminConfirm, setShowAdminConfirm] = useState(false);
  const [autoUpdateMaps, setAutoUpdateMaps] = useState(true);
  const [customCursor, setCustomCursor] = useState(true);
  const [shaderLevel, setShaderLevel] = useState(1);
  const [textureQuality, setTextureQuality] = useState<'ultra' | 'medium'>('ultra');
  const [bindings, setBindings] = useState(DEFAULT_BINDINGS);
  const [mouseSensitivity, setMouseSensitivity] = useState(1.0);
  const [gamepadSensitivity, setGamepadSensitivity] = useState(1.0);
  const [editingBinding, setEditingBinding] = useState<keyof KeyBindings | null>(null);

  useEffect(() => {
      const handleGlobalKey = (e: KeyboardEvent) => {
          if (editingBinding) {
              e.preventDefault();
              setBindings(prev => ({ ...prev, [editingBinding]: e.code }));
              setEditingBinding(null);
          }
      };
      const handleGlobalMouse = (e: MouseEvent) => {
          if (editingBinding) {
              e.preventDefault();
              const map: Record<number, string> = { 0: 'MouseLeft', 1: 'MouseMiddle', 2: 'MouseRight', 3: 'Mouse4', 4: 'Mouse5' };
              setBindings(prev => ({ ...prev, [editingBinding]: map[e.button] || `Mouse${e.button}` }));
              setEditingBinding(null);
          }
      };
      if (editingBinding) {
          window.addEventListener('keydown', handleGlobalKey);
          window.addEventListener('mousedown', handleGlobalMouse);
          return () => {
              window.removeEventListener('keydown', handleGlobalKey);
              window.removeEventListener('mousedown', handleGlobalMouse);
          };
      }
  }, [editingBinding]);


  // Edit/Export
  const [editWorldData, setEditWorldData] = useState<SavedWorld | null>(null);

  // Create World Inputs
  const [newWorldName, setNewWorldName] = useState('New World');
  const [newWorldSeed, setNewWorldSeed] = useState('');
  const [newWorldGameMode, setNewWorldGameMode] = useState<'SURVIVAL' | 'GOD' | 'CREATIVE'>('SURVIVAL');
  const [newWorldDifficulty, setNewWorldDifficulty] = useState<'EASY' | 'NORMAL' | 'HARD'>('NORMAL');

  // Multiplayer Inputs
  const [roomName, setRoomName] = useState('My Server');
  const [roomCode, setRoomCode] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [hostWorldId, setHostWorldId] = useState<string | null>(null); // For hosting existing world

  const t = TRANSLATIONS[lang];

  useEffect(() => {
      // Load Accounts
      const savedAccs = localStorage.getItem('zombiecraft_accounts');
      if (savedAccs) {
          try {
              const accs: SavedAccount[] = JSON.parse(savedAccs);
              setAccounts(accs);
              const currUser = localStorage.getItem('zombiecraft_current_user');
              if (currUser) {
                  const acc = accs.find(a => a.name === currUser);
                  if (acc) {
                      setCurrentUser(acc);
                      setMenuState('MAIN');
                  }
              }
          } catch (e) { console.error(e); }
      }
      
      const skipped = sessionStorage.getItem('zombiecraft_skipped_login');
      if (skipped) setMenuState('MAIN');

      // Check for mobile device initially
      if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
          setIsMobile(true);
      }
      
      const savedOpts = localStorage.getItem('zombiecraft_global_options');
      if (savedOpts) {
          try {
              const parsed = JSON.parse(savedOpts);
              if (parsed.showCoordinates !== undefined) setShowCoordinates(parsed.showCoordinates);
              if (parsed.tutorialEnabled !== undefined) setTutorialEnabled(parsed.tutorialEnabled);
              if (parsed.showMinimap !== undefined) setShowMinimap(parsed.showMinimap);
              if (parsed.adminMode !== undefined) setAdminMode(parsed.adminMode);
              if (parsed.seasonsEnabled !== undefined) setSeasonsEnabled(parsed.seasonsEnabled);
              if (parsed.isMobile !== undefined) setIsMobile(parsed.isMobile);
              if (parsed.graphicsQuality !== undefined) setGraphicsQuality(parsed.graphicsQuality);
              if (parsed.renderDistance !== undefined) setRenderDistance(parsed.renderDistance);
              if (parsed.volume !== undefined) setVolume(parsed.volume);
              if (parsed.customCursor !== undefined) setCustomCursor(parsed.customCursor);
              if (parsed.shaderLevel !== undefined) setShaderLevel(parsed.shaderLevel);
              if (parsed.textureQuality !== undefined) setTextureQuality(parsed.textureQuality);
              if (parsed.bindings !== undefined) setBindings(parsed.bindings);
              if (parsed.mouseSensitivity !== undefined) setMouseSensitivity(parsed.mouseSensitivity);
              if (parsed.gamepadSensitivity !== undefined) setGamepadSensitivity(parsed.gamepadSensitivity);
              // don't setlang here since it might be done by app
          } catch(e) {}
      }

      const migrate = async () => {
          const lsSaves = localStorage.getItem('mr2d_saves');
          if (lsSaves) {
              try {
                  const parsed: SavedWorld[] = JSON.parse(lsSaves);
                  for (const s of parsed) {
                      await saveWorldToDB(s);
                  }
                  localStorage.removeItem('mr2d_saves');
                  console.log("Migrated saves to IndexedDB");
              } catch (e) {
                  console.error("Migration failed", e);
              }
          }
          loadList();
      };
      
      const loadList = async () => {
          try {
              const list = await loadAllSavesMetadata();
              // Sort by last played
              list.sort((a, b) => b.lastPlayed - a.lastPlayed);
              setSaves(list);
          } catch (e) {
              console.error("Failed to load save list", e);
          }
      }

      migrate();
  }, []);

  useEffect(() => {
      localStorage.setItem('zombiecraft_global_options', JSON.stringify({
          showCoordinates,
          tutorialEnabled,
          showMinimap,
          adminMode,
          seasonsEnabled,
          isMobile,
          graphicsQuality,
          renderDistance,
          volume,
          customCursor,
          shaderLevel,
          textureQuality,
          bindings,
          mouseSensitivity,
          gamepadSensitivity
      }));
  }, [showCoordinates, tutorialEnabled, showMinimap, adminMode, seasonsEnabled, isMobile, graphicsQuality, renderDistance, volume, customCursor, shaderLevel, textureQuality, bindings, mouseSensitivity, gamepadSensitivity]);

  const handleCreateWorld = () => {
      const seed = newWorldSeed.trim() === '' ? Math.floor(Math.random() * 999999) : parseInt(newWorldSeed) || 0;
      onStartGame(null, { 
          name: newWorldName, 
          seed, 
          options: { 
              showCoordinates,
              tutorialEnabled,
              showMinimap,
              adminMode: adminMode || newWorldGameMode === 'GOD', // God mode implies admin
              isMobile,
              customCursor,
              shaderLevel,
              textureQuality,
              gameMode: newWorldGameMode,
              difficulty: newWorldDifficulty,
              graphicsQuality,
              renderDistance,
              volume
          } 
      });
  };

  const handlePlaySelected = async () => {
      if (!selectedWorldId) return;
      try {
          // Fetch full world data because the list only has lightweight metadata
          const world = await loadWorldFromDB(selectedWorldId);
          if (world) {
              if (!world.options) world.options = { showCoordinates, showMinimap, adminMode, isMobile, graphicsQuality, volume };
              else {
                  world.options.showCoordinates = showCoordinates;
                  world.options.tutorialEnabled = tutorialEnabled;
                  world.options.showMinimap = showMinimap;
                  world.options.adminMode = adminMode; // Inject current global preference
                  world.options.isMobile = isMobile;
                  world.options.customCursor = customCursor;
                  world.options.shaderLevel = shaderLevel;
                  world.options.textureQuality = textureQuality;
                  world.options.graphicsQuality = graphicsQuality;
                  world.options.renderDistance = renderDistance;
                  world.options.volume = volume;
              }
              onStartGame(world);
          } else {
              alert("Error: World data not found!");
          }
      } catch (e) {
          console.error(e);
          alert("Failed to load world.");
      }
  };
  
  const handleDeleteWorld = async () => {
      if(!selectedWorldId) return;
      try {
          await deleteWorldFromDB(selectedWorldId);
          const newSaves = saves.filter(s => s.id !== selectedWorldId);
          setSaves(newSaves);
          setSelectedWorldId(null);
      } catch (e) {
          console.error("Delete failed", e);
      }
  }

  // --- MULTIPLAYER HANDLERS ---

  const generateRoomCode = () => {
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();
      setRoomCode(code);
  };

  useEffect(() => {
      if (menuState === 'CREATE_ROOM') {
          generateRoomCode();
      }
  }, [menuState]);

  const handleHostGame = async () => {
      const multiplayerConfig = {
          mode: 'HOST' as const,
          roomId: roomCode,
          playerName: 'Host'
      };

      if (hostWorldId) {
          // Load existing world and add MP config
          const world = await loadWorldFromDB(hostWorldId);
          if (world) {
              if (!world.options) world.options = { showCoordinates, adminMode, isMobile, customCursor, shaderLevel, textureQuality };
              world.options.multiplayer = multiplayerConfig;
              world.options.isMobile = isMobile; // Ensure mobile setting persists
              onStartGame(world);
          }
      } else {
          // New World
          const seed = Math.floor(Math.random() * 999999);
          onStartGame(null, { 
              name: roomName, 
              seed, 
              options: { 
                  showCoordinates,
              tutorialEnabled, 
                  adminMode,
                  isMobile,
                  customCursor,
                  shaderLevel,
                  textureQuality,
                  multiplayer: multiplayerConfig
              } 
          });
      }
  };

  const handleJoinGame = () => {
      if (!joinCode) return;
      // In a real app, this would fetch the world from a server.
      // Here we simulate joining by generating a new world but flagging it as Client
      // Note: Client connects to an empty world in this simulation because we can't share state without backend.
      const seed = 12345; // Fixed seed for join simulation
      onStartGame(null, { 
          name: `Joined Room ${joinCode}`, 
          seed, 
          options: { 
              showCoordinates,
              tutorialEnabled, 
                  adminMode,
                  isMobile,
                  customCursor,
                  shaderLevel,
                  textureQuality,
                  multiplayer: {
                  mode: 'CLIENT',
                  roomId: joinCode,
                  playerName: 'Guest'
              }
          } 
      });
  };

  const handleLoginSubmit = () => {
      if (!loginName) return setLoginError('Nome obrigatório!');
      let updatedAccs = [...accounts];
      let acc = updatedAccs.find(a => a.name === loginName);
      if (acc) {
          if (acc.password !== loginPassword) {
              return setLoginError('Senha incorreta!');
          }
      } else {
          // Create new account
          acc = { name: loginName, password: loginPassword, friends: [], skin: { hairColor: '#ffcc00', eyeColor: '#000000', clothes: '1', pants: '1', shoes: '1', bodySize: 'normal', hasMustache: false, eyeType: 'normal', hairVariant: 'normal' } };
          updatedAccs.push(acc);
          setAccounts(updatedAccs);
          localStorage.setItem('zombiecraft_accounts', JSON.stringify(updatedAccs));
      }
      setCurrentUser(acc);
      localStorage.setItem('zombiecraft_current_user', acc.name);
      sessionStorage.removeItem('zombiecraft_skipped_login');
      setMenuState('MAIN');
      setLoginError('');
  };

  const renderLogin = () => (
      <div className="absolute inset-0 bg-[#2b3a32] flex items-center justify-center z-50">
          <div className="bg-gray-900 border-4 border-gray-600 p-8 flex flex-col gap-4 w-96 shadow-2xl rounded text-white text-center">
              <h1 className="text-4xl font-bold text-red-500 mb-2">Criar Conta</h1>
              <input type="text" placeholder="Nome" value={loginName} onChange={e => setLoginName(e.target.value)} className="bg-black/50 border border-gray-500 p-3 text-xl" />
              <input type="password" placeholder="Senha" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} className="bg-black/50 border border-gray-500 p-3 text-xl" />
              {loginError && <div className="text-red-400 font-bold">{loginError}</div>}
              
              <button onClick={handleLoginSubmit} className="bg-green-700 hover:bg-green-600 p-4 font-bold text-xl rounded mt-2 border-2 border-green-500 shadow-md">
                  Entrar / Criar
              </button>
              
              <button onClick={() => { sessionStorage.setItem('zombiecraft_skipped_login', 'true'); setCurrentUser(null); setMenuState('MAIN'); }} className="bg-gray-700 hover:bg-gray-600 p-2 text-sm rounded mt-4 border border-gray-500">
                  Pular (Sem Online/Mods/Skins)
              </button>
          </div>
      </div>
  );

  const renderMain = () => (
    <div className="flex flex-col items-start gap-4 w-full pl-10">
        <style>{`
            @keyframes hoverBounce {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-5px); }
            }
            .hover-bounce {
                transition: color 0.2s;
            }
            .hover-bounce:hover {
                animation: hoverBounce 0.5s infinite;
                color: yellow;
            }
        `}</style>
        <button 
          onClick={() => setMenuState('SELECT_WORLD')}
          className="text-black font-bold text-4xl hover-bounce text-left"
        >
          {t.PLAY}
        </button>
        <button 
          onClick={() => { if (currentUser) setMenuState('ONLINE_LOBBY'); else alert('Faça login (Criar Conta) para acessar o Modo Online!'); }}
          className={`text-black font-bold text-4xl hover-bounce text-left ${!currentUser ? 'opacity-50 line-through' : ''}`}
        >
          {t.ONLINE_MODE}
        </button>
        <button 
          onClick={() => setMenuState('MODS')}
          className="text-black font-bold text-4xl hover-bounce text-left"
        >
          {t.MODS || 'MODS'}
        </button>
        <button 
          onClick={() => setMenuState('OPTIONS')}
          className="text-black font-bold text-4xl hover-bounce text-left"
        >
          {t.OPTIONS}
        </button>
        <button 
          onClick={() => setMenuState('ACHIEVEMENTS')}
          className="text-black font-bold text-4xl hover-bounce text-left"
        >
          {t.ACHIEVEMENTS || 'Achievements'}
        </button>
        <button 
          onClick={() => window.close()}
          className="text-black font-bold text-4xl hover-bounce text-left"
        >
          {t.QUIT}
        </button>
    </div>
  );

  const handleImportWorld = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = async (ev) => {
          try {
              const data = JSON.parse(ev.target?.result as string);
              if (data && data.worldData) {
                  // Migration Logic
                  data.id = `world_${Date.now()}_${Math.random().toString(16).slice(2, 6)}`;
                  
                  if (autoUpdateMaps && data.version !== 2) {
                      data.version = 2; // Simulate map update
                      console.log("Auto-updated map to latest version");
                  }

                  await saveWorldToDB(data);
                  alert("World imported successfully!");
                  const list = await loadAllSavesMetadata();
                  list.sort((a, b) => b.lastPlayed - a.lastPlayed);
                  setSaves(list);
              } else {
                  alert("Invalid world file!");
              }
          } catch(err) {
              console.error(err);
              alert("Failed to parse world file");
          }
      };
      reader.readAsText(file);
  };

  useEffect(() => {
      if (menuState === 'EDIT_WORLD' && selectedWorldId) {
          loadWorldFromDB(selectedWorldId).then(data => {
              if (data) setEditWorldData(data);
          });
      }
  }, [menuState, selectedWorldId]);

  const handleExportWorld = () => {
      if (!editWorldData) return;
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(editWorldData));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href",     dataStr);
      downloadAnchorNode.setAttribute("download", `world_backup_${editWorldData.name}.json`);
      document.body.appendChild(downloadAnchorNode); // required for firefox
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
  };

  const saveEditedWorld = async () => {
      if (editWorldData) {
          await saveWorldToDB(editWorldData);
          setMenuState('SELECT_WORLD');
          // Reload
          const list = await loadAllSavesMetadata();
          list.sort((a, b) => b.lastPlayed - a.lastPlayed);
          setSaves(list);
      }
  };

  const renderEditWorld = () => {
      if (!editWorldData) return <div className="text-white">Loading...</div>;
      
      return (
          <div className="flex flex-col gap-4 w-[500px] bg-gray-800/90 border-4 border-gray-500 p-6 shadow-2xl text-white">
              <h2 className="text-2xl font-bold text-center border-b border-gray-600 pb-4">Edit World</h2>
              
              <div className="flex flex-col gap-2">
                  <label className="text-sm text-gray-400">World Name</label>
                  <input type="text" value={editWorldData.name} onChange={e => setEditWorldData({...editWorldData, name: e.target.value})} className="bg-black border p-2" />
              </div>
              
              <div className="flex flex-col gap-2">
                  <label className="text-sm text-gray-400">Game Mode</label>
                  <select 
                      value={editWorldData.options?.gameMode || 'SURVIVAL'} 
                      onChange={e => setEditWorldData({...editWorldData, options: {...(editWorldData.options||{}), gameMode: e.target.value as any}})}
                      className="bg-black border p-2"
                  >
                      <option value="SURVIVAL">Survival</option>
                      <option value="GOD">Creative / God</option>
                  </select>
              </div>

              <div className="flex items-center gap-2 mt-4">
                  <input type="checkbox" checked={editWorldData.options?.adminMode || false} onChange={e => setEditWorldData({...editWorldData, options: {...(editWorldData.options||{}), adminMode: e.target.checked}})} />
                  <label className="text-sm text-white">Enable Admin Mode</label>
              </div>

              <div className="flex flex-col gap-2 mt-4 border-t border-gray-600 pt-4">
                  <button onClick={handleExportWorld} className="bg-blue-800 hover:bg-blue-600 p-3 font-bold">
                      Download Backup (Export)
                  </button>
              </div>

              <div className="flex gap-4 mt-6">
                  <button onClick={saveEditedWorld} className="flex-1 bg-green-700 hover:bg-green-600 p-3 font-bold">Save Changes</button>
                  <button onClick={() => setMenuState('SELECT_WORLD')} className="bg-gray-700 hover:bg-gray-600 p-3 font-bold">Cancel</button>
              </div>
          </div>
      );
  };

  const renderOnlineLobby = () => (
      <div className="flex flex-col gap-4 w-[500px] bg-gray-900/90 border-4 border-purple-500 p-6 shadow-2xl">
          <h2 className="text-2xl text-purple-300 font-bold text-center border-b border-purple-800 pb-4">{t.ONLINE_MODE_TITLE}</h2>
          
          <div className="flex gap-4 h-40 items-center justify-center">
              <button 
                  onClick={() => setMenuState('CREATE_ROOM')}
                  className="w-1/2 h-full bg-purple-800 hover:bg-purple-600 border-2 border-purple-400 rounded flex flex-col items-center justify-center gap-2"
              >
                  <span className="text-4xl">🏠</span>
                  <span className="text-xl font-bold">{t.CREATE_ROOM_TITLE}</span>
              </button>
              <button 
                  onClick={() => setMenuState('JOIN_ROOM')}
                  className="w-1/2 h-full bg-blue-900 hover:bg-blue-700 border-2 border-blue-400 rounded flex flex-col items-center justify-center gap-2"
              >
                  <span className="text-4xl">🔗</span>
                  <span className="text-xl font-bold">{t.JOIN_ROOM_TITLE}</span>
              </button>
          </div>
          
          <div className="text-xs text-gray-400 text-center mt-2">
              {t.MULTIPLAYER_NOTE}
          </div>

          <button onClick={() => setMenuState('MAIN')} className="mt-4 text-gray-400 hover:text-white">{t.BACK_BTN}</button>
      </div>
  );

  const renderCreateRoom = () => (
      <div className="flex flex-col gap-4 w-[500px] bg-gray-900/90 border-4 border-purple-500 p-6 shadow-2xl text-white">
          <h2 className="text-2xl font-bold text-center mb-4 text-purple-300">{t.CREATE_ROOM_TITLE}</h2>
          
          <div className="flex flex-col gap-1">
              <label className="text-gray-300 text-sm">{t.ROOM_NAME_LABEL}</label>
              <input 
                type="text" 
                value={roomName || ''}
                onChange={(e) => setRoomName(e.target.value)}
                className="bg-black/50 border border-purple-500 p-2 text-white"
                maxLength={20}
              />
          </div>

          <div className="flex flex-col gap-1">
              <label className="text-gray-300 text-sm">{t.ROOM_CODE_LABEL}</label>
              <div className="bg-black border border-purple-500 p-4 text-center text-3xl font-mono tracking-widest text-yellow-400 select-all">
                  {roomCode}
              </div>
          </div>

          <div className="flex flex-col gap-1 mt-2">
              <label className="text-gray-300 text-sm">{t.SELECT_WORLD_LABEL}</label>
              <div className="max-h-32 overflow-y-auto border border-gray-700 bg-black/30">
                  <div 
                      onClick={() => setHostWorldId(null)}
                      className={`p-2 cursor-pointer ${hostWorldId === null ? 'bg-purple-700' : 'hover:bg-gray-800'}`}
                  >
                      {t.NEW_WORLD}
                  </div>
                  {saves.map(save => (
                      <div 
                          key={save.id}
                          onClick={() => setHostWorldId(save.id)}
                          className={`p-2 cursor-pointer border-t border-gray-800 ${hostWorldId === save.id ? 'bg-purple-700' : 'hover:bg-gray-800'}`}
                      >
                          {save.name}
                      </div>
                  ))}
              </div>
          </div>

          <div className="flex flex-col gap-2 mt-4">
              <button 
                  onClick={handleHostGame}
                  className="bg-green-700 hover:bg-green-600 text-white p-3 border-2 border-green-500 font-bold shadow-md"
              >
                  {t.START_HOST_BTN}
              </button>
              <button 
                  onClick={() => setMenuState('ONLINE_LOBBY')}
                  className="bg-gray-700 hover:bg-gray-600 text-white p-3 border-2 border-gray-400 font-bold"
              >
                  {t.BACK_BTN}
              </button>
          </div>
      </div>
  );

  const [activeRooms, setActiveRooms] = useState<string[]>([]);

  useEffect(() => {
      if (menuState === 'JOIN_ROOM') {
          // No more server fetching for rooms since we use P2P
      }
  }, [menuState]);

  const renderJoinRoom = () => (
      <div className="flex flex-col gap-4 w-[400px] bg-gray-900/90 border-4 border-blue-500 p-6 shadow-2xl text-white">
          <h2 className="text-2xl font-bold text-center mb-4 text-blue-300">{t.JOIN_ROOM_TITLE}</h2>
          
          <div className="flex flex-col gap-1">
              <label className="text-gray-300 text-sm">{t.ENTER_CODE_LABEL} (P2P)</label>
              <input 
                type="text" 
                value={joinCode || ''}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="XXXXXX"
                className="bg-black/50 border border-blue-500 p-4 text-center text-2xl font-mono text-white tracking-widest uppercase"
                maxLength={6}
              />
          </div>

          {activeRooms.length > 0 && (
              <div className="flex flex-col gap-1 mt-2">
                  <label className="text-gray-300 text-sm">Active Servers:</label>
                  <div className="max-h-32 overflow-y-auto border border-gray-700 bg-black/30">
                      {activeRooms.map(room => (
                          <div 
                              key={room}
                              onClick={() => setJoinCode(room)}
                              className={`p-2 cursor-pointer border-t border-gray-800 ${joinCode === room ? 'bg-blue-700' : 'hover:bg-gray-800'}`}
                          >
                              Room: {room}
                          </div>
                      ))}
                  </div>
              </div>
          )}

          <div className="flex flex-col gap-2 mt-4">
              <button 
                  onClick={handleJoinGame}
                  disabled={joinCode.length < 6}
                  className={`p-3 border-2 font-bold shadow-md ${joinCode.length < 6 ? 'bg-gray-700 text-gray-500 border-gray-600' : 'bg-green-700 hover:bg-green-600 text-white border-green-500'}`}
              >
                  {t.JOIN_BTN}
              </button>
              <button 
                  onClick={() => setMenuState('ONLINE_LOBBY')}
                  className="bg-gray-700 hover:bg-gray-600 text-white p-3 border-2 border-gray-400 font-bold"
              >
                  {t.BACK_BTN}
              </button>
          </div>
      </div>
  );

  const renderSelectWorld = () => (
      <div className="flex flex-col gap-4 w-[600px] h-[500px] bg-gray-800/90 border-4 border-gray-500 p-6 shadow-2xl">
          <h2 className="text-2xl text-white font-bold text-center border-b border-gray-600 pb-4">{t.SELECT_WORLD_TITLE}</h2>
          
          <div className="flex-1 overflow-y-auto bg-black/40 border border-gray-700 p-2 flex flex-col gap-2">
              {saves.map(save => (
                  <div 
                    key={save.id}
                    onClick={() => setSelectedWorldId(save.id)}
                    className={`p-3 border cursor-pointer flex justify-between items-center ${selectedWorldId === save.id ? 'border-white bg-gray-700' : 'border-gray-600 hover:bg-gray-700/50'}`}
                  >
                      <div>
                          <div className="font-bold text-lg text-white">{save.name}</div>
                          <div className="text-xs text-gray-400">{t.SEED}: {save.seed} • {new Date(save.lastPlayed).toLocaleString()}</div>
                      </div>
                      <div className="text-gray-500">
                           ▶
                      </div>
                  </div>
              ))}
              {saves.length === 0 && <div className="text-gray-500 text-center mt-10">{t.NO_SAVES}</div>}
          </div>

          <div className="flex gap-2 justify-center mt-2 flex-wrap">
              <button 
                onClick={handlePlaySelected}
                disabled={!selectedWorldId}
                className={`flex-1 p-2 font-bold border-2 ${selectedWorldId ? 'bg-green-700 hover:bg-green-600 border-green-400 text-white' : 'bg-gray-700 border-gray-600 text-gray-500'}`}
              >
                  {t.PLAY_SELECTED || "Play"}
              </button>
              <button 
                onClick={() => { setEditWorldData(null); setMenuState('EDIT_WORLD'); }}
                disabled={!selectedWorldId}
                className={`flex-1 p-2 font-bold border-2 ${selectedWorldId ? 'bg-blue-700 hover:bg-blue-600 border-blue-400 text-white' : 'bg-gray-700 border-gray-600 text-gray-500'}`}
              >
                  Edit
              </button>
              <button 
                onClick={() => setMenuState('CREATE_WORLD')}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white p-2 border-2 border-gray-400 font-bold"
              >
                  New
              </button>
              <button 
                onClick={handleDeleteWorld}
                disabled={!selectedWorldId}
                className={`flex-1 p-2 font-bold border-2 ${selectedWorldId ? 'bg-red-900 hover:bg-red-700 border-red-500 text-white' : 'bg-gray-700 border-gray-600 text-gray-500'}`}
              >
                  {t.DELETE || "Del"}
              </button>
          </div>
          <div className="mt-2 text-center text-sm">
              <label className="cursor-pointer text-blue-400 hover:text-white underline block mb-2">
                  Import World Backup (JSON)
                  <input type="file" className="hidden" accept=".json" onChange={handleImportWorld} />
              </label>
              <button onClick={() => setMenuState('MAIN')} className="text-gray-400 hover:text-white">{t.CANCEL}</button>
          </div>
      </div>
  );

  const renderCreateWorld = () => (
      <div className="flex flex-col gap-6 w-[600px] bg-gray-900/95 border-4 border-green-600 p-8 shadow-2xl text-white rounded-lg transform transition-all duration-500 hover:scale-105 animate-fade-in-up">
          <style>{`
              @keyframes fadeInUp {
                  from { opacity: 0; transform: translateY(20px); }
                  to { opacity: 1; transform: translateY(0); }
              }
              .animate-fade-in-up {
                  animation: fadeInUp 0.4s ease-out forwards;
              }
          `}</style>
          <h2 className="text-4xl font-extrabold text-center mb-2 text-green-400 drop-shadow-md">{t.CREATE_NEW_WORLD_TITLE}</h2>
          <div className="w-full h-1 bg-gradient-to-r from-transparent via-green-500 to-transparent mb-4"></div>
          
          <div className="flex flex-col gap-2">
              <label className="text-green-300 font-bold uppercase tracking-wider text-sm">{t.NEW_WORLD_NAME}</label>
              <input 
                type="text" 
                value={newWorldName || ''}
                onChange={(e) => setNewWorldName(e.target.value)}
                className="bg-black/60 border-2 border-green-700/50 focus:border-green-400 p-3 text-white text-lg rounded outline-none transition-colors"
                maxLength={20}
              />
          </div>

          <div className="flex flex-col gap-2">
              <label className="text-green-300 font-bold uppercase tracking-wider text-sm">{t.SEED_OPTIONAL}</label>
              <input 
                type="text" 
                value={newWorldSeed || ''}
                onChange={(e) => setNewWorldSeed(e.target.value)}
                placeholder={t.LEAVE_BLANK}
                className="bg-black/60 border-2 border-green-700/50 focus:border-green-400 p-3 text-white text-lg rounded outline-none transition-colors"
                maxLength={15}
              />
          </div>

          <div className="flex flex-col gap-2">
              <label className="text-green-300 font-bold uppercase tracking-wider text-sm">{t.GAME_MODE}</label>
              <div className="flex gap-4">
                  <button 
                      onClick={() => setNewWorldGameMode('SURVIVAL')}
                      className={`flex-1 p-3 rounded font-bold transition-all duration-300 ${newWorldGameMode === 'SURVIVAL' ? 'bg-green-600 border-2 border-green-400 shadow-[0_0_15px_rgba(74,222,128,0.5)] scale-105' : 'bg-gray-800 border-2 border-gray-600 hover:bg-gray-700'}`}
                  >
                      {t.SURVIVAL}
                  </button>
                  <button 
                      onClick={() => setNewWorldGameMode('GOD')}
                      className={`flex-1 p-3 rounded font-bold transition-all duration-300 ${newWorldGameMode === 'GOD' ? 'bg-yellow-600 border-2 border-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.5)] scale-105' : 'bg-gray-800 border-2 border-gray-600 hover:bg-gray-700'}`}
                  >
                      {t.GOD_MODE}
                  </button>
                  <button 
                      onClick={() => setNewWorldGameMode('CREATIVE')}
                      className={`flex-1 p-3 rounded font-bold transition-all duration-300 ${newWorldGameMode === 'CREATIVE' ? 'bg-blue-600 border-2 border-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.5)] scale-105' : 'bg-gray-800 border-2 border-gray-600 hover:bg-gray-700'}`}
                  >
                      Criativo
                  </button>
              </div>
          </div>

          {newWorldGameMode === 'SURVIVAL' && (
              <div className="flex flex-col gap-2 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                  <label className="text-green-300 font-bold uppercase tracking-wider text-sm">{t.DIFFICULTY}</label>
                  <div className="flex gap-4">
                      <button 
                          onClick={() => setNewWorldDifficulty('EASY')}
                          className={`flex-1 p-3 rounded font-bold transition-all duration-300 ${newWorldDifficulty === 'EASY' ? 'bg-green-600 border-2 border-green-400 shadow-[0_0_10px_rgba(74,222,128,0.5)]' : 'bg-gray-800 border-2 border-gray-600 hover:bg-gray-700'}`}
                      >
                          {t.EASY}
                      </button>
                      <button 
                          onClick={() => setNewWorldDifficulty('NORMAL')}
                          className={`flex-1 p-3 rounded font-bold transition-all duration-300 ${newWorldDifficulty === 'NORMAL' ? 'bg-blue-600 border-2 border-blue-400 shadow-[0_0_10px_rgba(96,165,250,0.5)]' : 'bg-gray-800 border-2 border-gray-600 hover:bg-gray-700'}`}
                      >
                          {t.NORMAL}
                      </button>
                      <button 
                          onClick={() => setNewWorldDifficulty('HARD')}
                          className={`flex-1 p-3 rounded font-bold transition-all duration-300 ${newWorldDifficulty === 'HARD' ? 'bg-red-600 border-2 border-red-400 shadow-[0_0_10px_rgba(248,113,113,0.5)]' : 'bg-gray-800 border-2 border-gray-600 hover:bg-gray-700'}`}
                      >
                          {t.HARD}
                      </button>
                  </div>
                  <div className="text-sm text-gray-400 mt-2 italic text-center">
                      {newWorldDifficulty === 'EASY' && t.DIFF_EASY_DESC}
                      {newWorldDifficulty === 'NORMAL' && t.DIFF_NORMAL_DESC}
                      {newWorldDifficulty === 'HARD' && t.DIFF_HARD_DESC}
                  </div>
              </div>
          )}

          <div className="flex flex-col gap-3 mt-6">
              <button 
                  onClick={handleCreateWorld}
                  className="bg-green-600 hover:bg-green-500 text-white p-4 rounded border-2 border-green-400 font-bold text-xl shadow-[0_0_20px_rgba(74,222,128,0.4)] transition-all hover:scale-105"
              >
                  {t.CREATE_NEW_WORLD_TITLE}
              </button>
              <button 
                  onClick={() => setMenuState('SELECT_WORLD')}
                  className="bg-transparent hover:bg-gray-800 text-gray-400 hover:text-white p-3 rounded border-2 border-transparent hover:border-gray-600 font-bold transition-all"
              >
                  {t.CANCEL}
              </button>
          </div>
      </div>
  );

  const renderOptions = () => (
      <div className="flex flex-col w-[500px] h-[500px] bg-gray-800/90 border-4 border-gray-500 shadow-2xl overflow-hidden">
         <h1 className="text-3xl font-bold text-white my-4 text-center">{t.OPTIONS_TITLE}</h1>
         
         {/* Tabs */}
         <div className="flex flex-wrap bg-gray-900 border-b-4 border-gray-500 font-mono text-sm">
             <button onClick={() => setOptionsTab('GAME')} className={`flex-1 p-2 border-r border-gray-600 ${optionsTab === 'GAME' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:bg-gray-800'}`}>Game</button>
             <button onClick={() => setOptionsTab('VIDEO')} className={`flex-1 p-2 border-r border-gray-600 ${optionsTab === 'VIDEO' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:bg-gray-800'}`}>Video</button>
             <button onClick={() => setOptionsTab('AUDIO')} className={`flex-1 p-2 border-r border-gray-600 ${optionsTab === 'AUDIO' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:bg-gray-800'}`}>Audio</button>
             <button onClick={() => setOptionsTab('LANGUAGE')} className={`flex-1 p-2 border-b border-r border-gray-600 ${optionsTab === 'LANGUAGE' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:bg-gray-800'}`}>Language</button>
             <button onClick={() => setOptionsTab('TOUCH')} className={`flex-1 p-2 border-b border-r border-gray-600 ${optionsTab === 'TOUCH' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:bg-gray-800'}`}>Touch</button>
             <button onClick={() => setOptionsTab('CONTROLS')} className={`flex-1 p-2 border-b border-r border-gray-600 ${optionsTab === 'CONTROLS' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:bg-gray-800'}`}>Controles</button>
             <button onClick={() => setOptionsTab('ACCOUNTS')} className={`flex-1 p-2 border-b border-gray-600 ${optionsTab === 'ACCOUNTS' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:bg-gray-800'}`}>Contas</button>
         </div>

         {/* Content */}
         <div className="flex-1 p-6 overflow-y-auto flex flex-col gap-4">
             {optionsTab === 'ACCOUNTS' && (
                 <>
                     <h2 className="text-xl font-bold text-white mb-2">Sua Conta</h2>
                     {currentUser ? (
                         <div className="bg-gray-700 p-4 border border-gray-500 rounded flex justify-between items-center text-white">
                             <span className="font-bold text-lg">{currentUser.name}</span>
                             <button onClick={() => { setCurrentUser(null); localStorage.removeItem('zombiecraft_current_user'); sessionStorage.removeItem('zombiecraft_skipped_login'); setMenuState('LOGIN'); }} className="bg-red-700 p-2 font-bold hover:bg-red-600">Sair da Conta</button>
                         </div>
                     ) : (
                         <div className="text-gray-400">Você não está logado.</div>
                     )}

                     <h2 className="text-xl font-bold text-white mb-2 mt-4">Outras Contas ({accounts.length})</h2>
                     <div className="flex flex-col gap-2">
                         {accounts.map(acc => (
                             <div key={acc.name} className="bg-gray-800 p-4 border border-gray-600 flex justify-between items-center text-white">
                                 <span>{acc.name}</span>
                                 {currentUser?.name !== acc.name && (
                                     <button onClick={() => { setCurrentUser(acc); localStorage.setItem('zombiecraft_current_user', acc.name); setMenuState('MAIN'); }} className="bg-green-700 p-2 font-bold hover:bg-green-600">Entrar</button>
                                 )}
                             </div>
                         ))}
                     </div>
                     <button onClick={() => { setCurrentUser(null); localStorage.removeItem('zombiecraft_current_user'); sessionStorage.removeItem('zombiecraft_skipped_login'); setMenuState('LOGIN'); }} className="bg-blue-600 hover:bg-blue-500 text-white p-3 font-bold mt-4">Criar uma Nova Conta / Login</button>
                 </>
             )}
             {optionsTab === 'GAME' && (
                 <>
                     <button onClick={() => setTutorialEnabled(!tutorialEnabled)} className="bg-gray-700 hover:bg-gray-600 text-white p-3 border-2 border-gray-400 font-mono text-lg flex justify-between px-6">
                         <span>{lang === 'PT' ? 'Tutorial' : 'Tutorial'}</span>
                         <span className={tutorialEnabled ? "text-green-400" : "text-red-400"}>{tutorialEnabled ? t.ON : t.OFF}</span>
                     </button>
                     <button onClick={() => setShowCoordinates(!showCoordinates)} className="bg-gray-700 hover:bg-gray-600 text-white p-3 border-2 border-gray-400 font-mono text-lg flex justify-between px-6">
                         <span>{t.COORDS}</span>
                         <span className={showCoordinates ? "text-green-400" : "text-red-400"}>{showCoordinates ? t.ON : t.OFF}</span>
                     </button>
                     <button onClick={() => setShowMinimap(!showMinimap)} className="bg-gray-700 hover:bg-gray-600 text-white p-3 border-2 border-gray-400 font-mono text-lg flex justify-between px-6">
                         <span>Minimap</span>
                         <span className={showMinimap ? "text-green-400" : "text-red-400"}>{showMinimap ? t.ON : t.OFF}</span>
                     </button>
                     <button onClick={() => setIsMobile(!isMobile)} className="bg-gray-700 hover:bg-gray-600 text-white p-3 border-2 border-gray-400 font-mono text-lg flex justify-between px-6">
                         <span>{t.MOBILE_MODE}</span>
                         <span className={isMobile ? "text-green-400" : "text-red-400"}>{isMobile ? t.ON : t.OFF}</span>
                     </button>
                <button onClick={() => setCustomCursor(!customCursor)} className="bg-gray-700 hover:bg-gray-600 text-white p-3 border-2 border-gray-400 font-mono text-lg flex justify-between px-6">
                    <span>Cursor Customizado (Bolinha)</span>
                    <span className={customCursor ? "text-green-400" : "text-red-400"}>{customCursor ? 'ON' : 'OFF'}</span>
                </button>
                <button onClick={() => setSeasonsEnabled(!seasonsEnabled)} className="bg-gray-700 hover:bg-gray-600 text-white p-3 border-2 border-gray-400 font-mono text-lg flex justify-between px-6">
                    <span>Estações do Ano (Seasons)</span>
                    <span className={seasonsEnabled ? "text-green-400" : "text-red-400"}>{seasonsEnabled ? 'ON' : 'OFF'}</span>
                </button>
                     <button onClick={() => { if (adminMode) setAdminMode(false); else setShowAdminConfirm(true); }} className="bg-gray-700 hover:bg-gray-600 text-white p-3 border-2 border-gray-400 font-mono text-lg flex justify-between px-6">
                         <span>{t.ADMIN_TEST}</span>
                         <span className={adminMode ? "text-green-400" : "text-red-400"}>{adminMode ? t.ON : t.OFF}</span>
                     </button>
                     <button onClick={() => setAutoUpdateMaps(!autoUpdateMaps)} className="bg-gray-700 hover:bg-gray-600 text-white p-3 border-2 border-gray-400 font-mono text-lg flex justify-between px-6">
                         <span>Auto-Update Maps (Version)</span>
                         <span className={autoUpdateMaps ? "text-green-400" : "text-red-400"}>{autoUpdateMaps ? t.ON : t.OFF}</span>
                     </button>
                 </>
             )}

             {optionsTab === 'VIDEO' && (
                 <>
                     <button onClick={() => {
                         const q = graphicsQuality === 'ULTRA' ? 'UGLY' : (graphicsQuality === 'UGLY' ? 'NORMAL' : 'ULTRA');
                         setGraphicsQuality(q);
                     }} className="bg-gray-700 hover:bg-gray-600 text-white p-3 border-2 border-gray-400 font-mono text-lg flex justify-between px-6">
                         <span>Graphics</span>
                         <span className="text-blue-400">{graphicsQuality}</span>
                     </button>
                     <button onClick={() => {
                         if (!document.fullscreenElement) { document.documentElement.requestFullscreen().catch(e => console.log(e)); }
                         else { if (document.exitFullscreen) document.exitFullscreen(); }
                     }} className="bg-gray-700 hover:bg-gray-600 text-white p-3 border-2 border-gray-400 font-mono text-lg flex justify-between px-6">
                         <span>{t.FULLSCREEN}</span>
                         <span className="text-blue-400">Toggle</span>
                     </button>
                     <button onClick={() => {
                         setShaderLevel(shaderLevel === 1 ? 2 : (shaderLevel === 2 ? 3 : 1));
                     }} className="bg-gray-700 hover:bg-gray-600 text-white p-3 border-2 border-gray-400 font-mono text-lg flex justify-between px-6">
                         <span>Shaders</span>
                         <span className="text-blue-400">{shaderLevel === 3 ? 'Ultra Realista (Litxuma)' : `Nível ${shaderLevel}`}</span>
                     </button>
                     <button onClick={() => {
                         setTextureQuality(textureQuality === 'ultra' ? 'medium' : 'ultra');
                     }} className="bg-gray-700 hover:bg-gray-600 text-white p-3 border-2 border-gray-400 font-mono text-lg flex justify-between px-6">
                         <span>Mudar a textura dos blocos</span>
                         <span className="text-blue-400">{textureQuality === 'ultra' ? 'Ultra' : 'Médio'}</span>
                     </button>
                     <div className="bg-gray-700 text-white p-3 border-2 border-gray-400 font-mono text-lg flex flex-col px-6 gap-2">
                         <div className="flex justify-between">
                             <span>Render Distance (Chunks)</span>
                             <span className="text-yellow-400">{renderDistance}</span>
                         </div>
                         <input type="range" min="8" max="64" value={renderDistance} onChange={(e) => setRenderDistance(Number(e.target.value))} className="w-full" />
                     </div>
                 </>
             )}

             {optionsTab === 'AUDIO' && (
                 <>
                     <div className="bg-gray-700 text-white p-3 border-2 border-gray-400 font-mono text-lg flex flex-col px-6 gap-2">
                         <div className="flex justify-between">
                             <span>Volume</span>
                             <span className="text-yellow-400">{Math.round(volume * 100)}%</span>
                         </div>
                         <input type="range" min="0" max="1" step="0.05" value={volume} onChange={(e) => {
                             const v = parseFloat(e.target.value);
                             setVolume(v);
                             audio.setVolume(v);
                         }} className="w-full" />
                     </div>
                 </>
             )}

             {optionsTab === 'LANGUAGE' && (
                 <>
                     <button onClick={() => {
                         const langs: ('EN'|'PT'|'ES'|'JA')[] = ['EN', 'PT', 'ES', 'JA'];
                         const nextLang = langs[(langs.indexOf(lang) + 1) % langs.length];
                         setLang(nextLang);
                     }} className="bg-gray-700 hover:bg-gray-600 text-white p-3 border-2 border-gray-400 font-mono text-lg flex justify-between px-6">
                         <span>{t.LANGUAGE}</span>
                         <span className="text-yellow-400">{lang}</span>
                     </button>
                 </>
             )}

             {optionsTab === 'TOUCH' && (
                 <>
                     <p className="text-gray-400 text-sm mb-2 text-center">
                         Arraste os botões de toque para onde desejar.
                     </p>
                     <button onClick={() => setShowTouchConfig(true)} className="bg-blue-700 hover:bg-blue-600 text-white p-4 border-2 border-blue-400 font-mono text-xl font-bold rounded">
                         Configurar Posições
                     </button>
                 </>
             )}

             {optionsTab === 'CONTROLS' && (
                 <>
                     <h2 className="text-xl font-bold text-white mb-2">Controles e Gamepad</h2>
                     <div className="flex flex-col gap-4 text-white">
                         <div className="bg-gray-700 p-4 border border-gray-500 flex flex-col gap-4">
                             <div className="flex justify-between items-center">
                                 <h3 className="font-bold text-lg">Sensibilidade do Mouse</h3>
                                 <span className="bg-gray-800 px-2 py-1">{mouseSensitivity.toFixed(2)}x</span>
                             </div>
                             <input type="range" min="0.1" max="3.0" step="0.1" value={mouseSensitivity} onChange={e => setMouseSensitivity(parseFloat(e.target.value))} className="w-full" />
                             
                             <div className="flex justify-between items-center mt-2">
                                 <h3 className="font-bold text-lg">Sensibilidade do Gamepad</h3>
                                 <span className="bg-gray-800 px-2 py-1">{gamepadSensitivity.toFixed(2)}x</span>
                             </div>
                             <input type="range" min="0.1" max="3.0" step="0.1" value={gamepadSensitivity} onChange={e => setGamepadSensitivity(parseFloat(e.target.value))} className="w-full" />
                         </div>

                         <div className="bg-gray-700 p-4 border border-gray-500">
                             <div className="flex justify-between items-center mb-4">
                                <h3 className="font-bold text-lg">Mapeamento de Teclado</h3>
                                <button onClick={() => setBindings(DEFAULT_BINDINGS)} className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded text-sm font-bold">Menu Padrão</button>
                             </div>
                             
                             <div className="grid grid-cols-2 gap-2 text-sm">
                                 {Object.entries({
                                     up: 'Cima', down: 'Baixo', left: 'Esquerda', right: 'Direita',
                                     jump: 'Pular', crouch: 'Agachar', sprint: 'Correr',
                                     inventory: 'Inventário', interact: 'Usar/Mão Secundaria', drop: 'Dropar Item',
                                     chat: 'Chat', attack: 'Atacar/Quebrar', place: 'Colocar/Mirar'
                                 }).map(([k, label]) => {
                                     const key = k as keyof KeyBindings;
                                     return (
                                         <div key={key} className="flex justify-between bg-gray-800 p-2 items-center border border-gray-600">
                                             <span className="text-gray-300">{label}</span>
                                             <button 
                                                onClick={() => setEditingBinding(key)} 
                                                className={`px-3 py-1 font-mono font-bold ${editingBinding === key ? 'bg-yellow-600 animate-pulse' : 'bg-gray-600 hover:bg-gray-500'}`}
                                             >
                                                 {editingBinding === key ? 'Pressione uma tecla...' : bindings[key]}
                                             </button>
                                         </div>
                                     );
                                 })}
                             </div>
                         </div>

                         <div className="bg-gray-700 p-4 border border-gray-500">
                             <h3 className="font-bold border-b border-gray-500 pb-2 mb-2">Gamepad (Ativado automaticamente)</h3>
                             <ul className="text-sm space-y-1 list-disc pl-4 text-gray-300">
                                 <li><strong>Mover:</strong> Analógico Esquerdo / D-pad</li>
                                 <li><strong>Mirar:</strong> Analógico Direito</li>
                                 <li><strong>Correr:</strong> Pressionar Analógico Esquerdo</li>
                                 <li><strong>Pular:</strong> Botão A / Cruz</li>
                                 <li><strong>Menu / Inventário:</strong> Botão X / Quadrado ou Start</li>
                                 <li><strong>Quebrar / Atacar:</strong> RT (Gatilho Direito)</li>
                                 <li><strong>Colocar Item:</strong> LT (Gatilho Esquerdo)</li>
                             </ul>
                         </div>
                     </div>
                 </>
             )}
         </div>

         <div className="p-4 border-t-4 border-gray-500 bg-gray-800">
             <button onClick={() => setMenuState('MAIN')} className="w-full bg-red-700 hover:bg-red-600 text-white p-3 border-2 border-gray-400 font-mono text-lg">
                 {t.BACK_BTN}
             </button>
         </div>
      </div>
  );

  const renderAchievements = () => (
      <div className="flex flex-col w-[600px] h-[500px] bg-gray-800/90 border-4 border-gray-500 shadow-2xl p-6">
         <h1 className="text-3xl font-bold text-white mb-6 text-center">{t.ACHIEVEMENTS || 'Achievements'}</h1>
         <div className="flex-1 overflow-y-auto space-y-4 pr-2">
            {ACHIEVEMENTS_LIST.map((ach) => (
                <div key={ach.id} className="bg-gray-700 border-2 border-gray-500 p-4 rounded flex items-center gap-4 opacity-50 hover:opacity-100 transition-opacity">
                    <div className="w-12 h-12 bg-gray-600 rounded-full flex items-center justify-center text-xl shrink-0">{ach.icon}</div>
                    <div>
                        <h3 className="text-xl text-gray-300 font-bold">{ach.title}</h3>
                        <p className="text-gray-400 text-sm">{ach.desc}</p>
                    </div>
                </div>
            ))}
         </div>
         <button onClick={() => setMenuState('MAIN')} className="mt-6 bg-red-700 hover:bg-red-600 border-2 border-red-500 text-white font-bold p-3 uppercase self-center w-48 text-xl">
             {t.BACK || 'Back'}
         </button>
      </div>
  );

  const [friendSearch, setFriendSearch] = useState('');
  
  const handleAddFriend = () => {
      if (!friendSearch) return;
      // Add fake/mock logic if they don't exist
      const accs = JSON.parse(localStorage.getItem('zombiecraft_accounts') || '[]');
      const found = accs.find((a: any) => a.name === friendSearch);
      if (found) {
          alert('Adicionado com sucesso!');
          const newFriends = [...(currentUser?.friends || []), friendSearch];
          const newUser = { ...currentUser, friends: newFriends } as SavedAccount;
          setCurrentUser(newUser);
          
          let updatedAccs = [...accounts];
          const accI = updatedAccs.findIndex(a => a.name === currentUser?.name);
          if (accI > -1) {
              updatedAccs[accI] = newUser;
              setAccounts(updatedAccs);
              localStorage.setItem('zombiecraft_accounts', JSON.stringify(updatedAccs));
          }
      } else {
          alert('Amigo não existe!');
      }
  };

  const saveSkin = () => {
      if (!currentUser) return;
      let updatedAccs = [...accounts];
      const accI = updatedAccs.findIndex(a => a.name === currentUser.name);
      if (accI > -1) {
          updatedAccs[accI] = currentUser;
          setAccounts(updatedAccs);
          localStorage.setItem('zombiecraft_accounts', JSON.stringify(updatedAccs));
      }
      setMenuState('MAIN');
  };

  const renderEditSkin = () => {
      if (!currentUser || !currentUser.skin) return null;
      return (
          <div className="flex flex-col w-[800px] h-fit max-h-[90vh] bg-gray-900 border-4 border-gray-600 p-6 shadow-2xl overflow-hidden">
              <h1 className="text-3xl font-bold text-white mb-4 text-center">Editar Personagem</h1>
              <div className="flex flex-col md:flex-row gap-4 h-[65vh] overflow-y-auto">
                  <div className="w-full md:w-1/2 flex flex-col gap-2">
                       <label className="text-white text-sm mt-2">Cor da Pele</label>
                       <input type="color" value={currentUser.skin.skinColor || '#ffcc80'} onChange={e => setCurrentUser({...currentUser, skin: {...currentUser.skin!, skinColor: e.target.value}})} className="w-full" />

                       <label className="text-white text-sm mt-2">Cabelo (1-10)</label>
                       <select value={currentUser.skin.hairVariant || '1'} onChange={e => setCurrentUser({...currentUser, skin: {...currentUser.skin!, hairVariant: e.target.value}})} className="bg-gray-800 text-white p-2">
                           <option value="1">Cabelo Normal</option>
                           <option value="2">Calvo (Sem Cabelo)</option>
                           <option value="3">Moicano</option>
                           <option value="4">Franja Longa</option>
                           <option value="5">Cabelo Curto</option>
                           <option value="6">Tranças</option>
                           <option value="7">Cabelo Arrepiado</option>
                           <option value="8">Undercut</option>
                           <option value="9">Cachos</option>
                           <option value="10">Black Power</option>
                       </select>
                       
                       {currentUser.skin.hairVariant !== '2' && (
                           <>
                               <label className="text-white text-sm mt-0">Cor do Cabelo</label>
                               <input type="color" value={currentUser.skin.hairColor || '#ff9800'} onChange={e => setCurrentUser({...currentUser, skin: {...currentUser.skin!, hairColor: e.target.value}})} className="w-full" />
                           </>
                       )}
                       
                       <label className="text-white text-sm mt-2">Cor do Olho</label>
                       <input type="color" value={currentUser.skin.eyeColor || '#000000'} onChange={e => setCurrentUser({...currentUser, skin: {...currentUser.skin!, eyeColor: e.target.value}})} className="w-full" />
                       
                       <label className="text-white text-sm mt-2">Estilo da Boca</label>
                       <select value={currentUser.skin.mouthType || 'neutral'} onChange={e => setCurrentUser({...currentUser, skin: {...currentUser.skin!, mouthType: e.target.value}})} className="bg-gray-800 text-white p-2">
                           <option value="none">Sem Boca</option>
                           <option value="neutral">Neutra</option>
                           <option value="happy">Feliz</option>
                           <option value="sad">Triste</option>
                       </select>

                       <label className="text-white text-sm mt-2">Roupa (1-10)</label>
                       <select value={currentUser.skin.clothes || '1'} onChange={e => setCurrentUser({...currentUser, skin: {...currentUser.skin!, clothes: e.target.value}})} className="bg-gray-800 text-white p-2">
                           <option value="1">Sem Roupa</option>
                           <option value="2">Terno Preto</option>
                           <option value="3">Camisa Azul</option>
                           <option value="4">Camisa Vermelha</option>
                           <option value="5">Moletom Cinza</option>
                           <option value="6">Moletom Verde</option>
                           <option value="7">Regata Branca</option>
                           <option value="8">Jaqueta de Couro</option>
                           <option value="9">Camisa Xadrez</option>
                           <option value="10">Camiseta Amarela</option>
                       </select>

                       <label className="text-white text-sm mt-2">Calça / Shorts (1-10)</label>
                       <select value={currentUser.skin.pants || '1'} onChange={e => setCurrentUser({...currentUser, skin: {...currentUser.skin!, pants: e.target.value}})} className="bg-gray-800 text-white p-2">
                           <option value="1">Cueca</option>
                           <option value="2">Calça de Terno</option>
                           <option value="3">Jeans Azul</option>
                           <option value="4">Jeans Preto</option>
                           <option value="5">Shorts Praia</option>
                           <option value="6">Calça Moletom</option>
                           <option value="7">Shorts Cargo</option>
                           <option value="8">Calça de Couro</option>
                           <option value="9">Calça Camuflada</option>
                           <option value="10">Shorts Vermelho</option>
                       </select>

                       <label className="text-white text-sm mt-2">Sapatos (1-10)</label>
                       <select value={currentUser.skin.shoes || '1'} onChange={e => setCurrentUser({...currentUser, skin: {...currentUser.skin!, shoes: e.target.value}})} className="bg-gray-800 text-white p-2">
                           <option value="1">Descalço</option>
                           <option value="2">Sapato Social Preto</option>
                           <option value="3">Tênis Branco</option>
                           <option value="4">Coturno Militar</option>
                           <option value="5">Tênis Vermelho</option>
                           <option value="6">Sapatilha</option>
                           <option value="7">Bota de Couro</option>
                           <option value="8">Tênis Cano Alto</option>
                           <option value="9">Pantufa de Urso</option>
                           <option value="10">Sandália</option>
                       </select>

                       <div className="flex items-center gap-2 mt-4 text-white">
                            <input type="checkbox" checked={currentUser.skin.hasMustache || false} onChange={e => setCurrentUser({...currentUser, skin: {...currentUser.skin!, hasMustache: e.target.checked}})} />
                            <span>Ter Bigode</span>
                       </div>
                       
                       {currentUser.skin.hasMustache && (
                           <>
                               <label className="text-white text-sm mt-2">Cor do Bigode</label>
                               <input type="color" value={currentUser.skin.mustacheColor || '#111111'} onChange={e => setCurrentUser({...currentUser, skin: {...currentUser.skin!, mustacheColor: e.target.value}})} className="w-full" />
                           </>
                       )}
                  </div>
                  
                  {/* PREVIEW */}
                  <div className="w-full md:w-1/2 flex items-center justify-center relative bg-gray-800 border-2 border-gray-600 rounded p-4 h-[350px]">
                        <div className="text-white text-center flex flex-col items-center">
                            <span className="text-6xl mb-4">👀</span>
                            <h2 className="font-bold text-xl mb-2">Preview in-game</h2>
                            <p className="text-gray-400 text-sm px-4">As alterações que você fizer aqui serão refletidas detalhadamente em jogo com físicas e animações.</p>
                        </div>
                  </div>
              </div>
              <button onClick={saveSkin} className="w-full bg-green-700 hover:bg-green-600 text-white font-bold p-3 mt-6 border-2 border-green-500">Salvar e Sair</button>
          </div>
      );
  };

  const renderFriends = () => (
      <div className="flex flex-col w-[500px] h-[500px] bg-gray-900 border-4 border-gray-600 p-6 shadow-2xl text-white">
           <h1 className="text-3xl font-bold mb-4 text-center">Amigos</h1>
           <div className="flex gap-2 mb-4">
               <input type="text" value={friendSearch} onChange={e => setFriendSearch(e.target.value)} placeholder="Pesquisar nome do amigo..." className="flex-1 bg-black/50 border border-gray-500 p-2" />
               <button onClick={handleAddFriend} className="bg-blue-700 font-bold px-4 hover:bg-blue-600 border border-blue-500">Adicionar</button>
           </div>
           
           <div className="flex-1 overflow-y-auto border border-gray-700 p-2">
                {!currentUser?.friends || currentUser.friends.length === 0 ? (
                    <div className="text-gray-500 text-center mt-10">Você não tem nenhum amigo.</div>
                ) : (
                    currentUser.friends.map(f => (
                        <div key={f} className="p-3 bg-gray-800 border-b border-gray-600 hover:bg-gray-700 cursor-pointer flex justify-between items-center" onClick={() => alert(`${f} está offline/jogando...`)}>
                            <span className="font-bold text-lg">{f}</span>
                            <span className="text-xs text-green-400">● Online</span>
                        </div>
                    ))
                )}
           </div>

           <button onClick={() => setMenuState('MAIN')} className="w-full mt-4 bg-red-700 hover:bg-red-600 font-bold p-3 border border-red-500">Voltar</button>
      </div>
  );

  if (menuState === 'MODS') {
      const startTestMod = () => {
          const defaultOptions: GameOptions = {
              graphicsQuality: 'NORMAL',
              renderDistance: 15,
              volume: 0.3,
              showCoordinates: true,
              showMinimap: true,
              tutorialEnabled: false,
              adminMode: true,
              isMobile: false,
              showTouchConfig: false,
              autoUpdateMaps: true,
              customCursor: true,
              shaderLevel: 1,
              textureQuality: 'medium'
          };
          onStartGame(null, { name: 'Teste de Mod', seed: Date.now(), options: defaultOptions });
      };
      return <ModCreator onClose={() => setMenuState('MAIN')} onTestMod={startTestMod} currentUser={currentUser?.name} />;
  }

  return (
    <div className="absolute inset-0 flex flex-col z-50 overflow-hidden" style={{ backgroundColor: '#2b3a32' }}>
        {menuState === 'MAIN' && (
             <div className="flex w-full h-full">
                 <div className="flex flex-col justify-center w-1/2 pl-10">
                     <div className="mb-10">
                         <h1 className="text-7xl font-bold text-red-500 drop-shadow-lg tracking-tight" style={{ textShadow: '2px 2px 0px #000' }}>ZombieCraft</h1>
                         <h2 className="text-4xl font-bold text-gray-300 ml-20" style={{ textShadow: '1px 1px 0px #000' }}>Survivors <span className="text-sm text-yellow-400 align-top">DEMO</span></h2>
                     </div>
                     {renderMain()}
                 </div>
                 <div className="w-1/2 flex items-center justify-center relative">
                     {currentUser && (
                         <div className="absolute top-4 right-10 flex flex-col items-center cursor-pointer hover:scale-105 transition-transform" onClick={() => setMenuState('FRIENDS')}>
                             <div className="w-16 h-16 bg-[#e3d1a3] border-4 border-black rounded shadow-md flex items-center justify-center mb-1">
                                 <span className="text-2xl font-bold">-_-</span>
                             </div>
                             <span className="text-black font-bold text-xl uppercase">amigos</span>
                         </div>
                     )}

                     {currentUser ? (
                         <div className="flex flex-col items-center gap-4">
                             <div className="flex gap-4 mb-2">
                                 <button onClick={() => setMenuState('EDIT_SKIN')} className="bg-transparent text-black font-mono border-4 border-black rounded-full px-6 py-2 hover:bg-black/10 uppercase font-bold tracking-widest text-lg">editar</button>
                                 <button onClick={() => { setCurrentUser(null); localStorage.removeItem('zombiecraft_current_user'); sessionStorage.removeItem('zombiecraft_skipped_login'); setMenuState('LOGIN'); }} className="bg-transparent text-red-700 font-mono border-4 border-red-700 rounded-full px-4 py-2 hover:bg-red-700/10 uppercase font-bold tracking-widest text-lg flex items-center justify-center gap-2" title="Sair da Conta">
                                     <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                                 </button>
                             </div>
                             <div className="relative w-48 h-64 border-2 border-transparent pointer-events-none">
                                 {/* Head */}
                                 <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-16 border-4 border-black rounded bg-[#ffd8a8]">
                                     {currentUser.skin?.hasMustache && <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-8 h-2 bg-black rounded" />}
                                     <div className="absolute top-4 left-3 w-2 h-2 rounded-full" style={{ backgroundColor: currentUser.skin?.eyeColor || '#000' }} />
                                     <div className="absolute top-4 right-3 w-2 h-2 rounded-full" style={{ backgroundColor: currentUser.skin?.eyeColor || '#000' }} />
                                     {currentUser.skin?.hairVariant === 'normal' && <div className="absolute -top-2 left-0 w-full h-4 rounded-t-lg" style={{ backgroundColor: currentUser.skin.hairColor }} />}
                                 </div>
                                 {/* Body */}
                                 <div className="absolute top-16 left-1/2 -translate-x-1/2 w-20 h-28 border-4 border-black bg-[#ffd8a8]" style={{ backgroundColor: currentUser.skin?.clothes === 'terno' ? '#222' : (currentUser.skin?.clothes === '2' ? 'blue' : (currentUser.skin?.clothes === '3' ? 'red' : '#ffd8a8')) }}>
                                     {(!currentUser.skin?.clothes || currentUser.skin?.clothes === '1') && <div className="absolute bottom-0 w-full h-8 bg-gray-300 border-t-2 border-gray-400" />}
                                     {currentUser.skin?.clothes === 'terno' && <div className="absolute top-0 left-1/2 -translate-x-1/2 w-4 h-full bg-white border-x-2 border-black" />} 
                                 </div>
                                 {/* Arms */}
                                 <div className="absolute top-16 left-2 w-6 h-28 border-4 border-black origin-top rotate-[20deg] bg-[#ffd8a8]" style={{ backgroundColor: currentUser.skin?.clothes === 'terno' ? '#222' : '#ffd8a8' }} />
                                 <div className="absolute top-16 right-2 w-6 h-28 border-4 border-black origin-top -rotate-[20deg] bg-[#ffd8a8]" style={{ backgroundColor: currentUser.skin?.clothes === 'terno' ? '#222' : '#ffd8a8' }} />
                                 {/* Legs */}
                                 <div className="absolute top-44 left-10 w-8 h-20 border-4 border-black bg-[#ffd8a8]" style={{ backgroundColor: currentUser.skin?.pants === 'terno' ? '#222' : (currentUser.skin?.pants === '2' ? 'blue' : '#ffd8a8') }} />
                                 <div className="absolute top-44 right-10 w-8 h-20 border-4 border-black bg-[#ffd8a8]" style={{ backgroundColor: currentUser.skin?.pants === 'terno' ? '#222' : (currentUser.skin?.pants === '2' ? 'blue' : '#ffd8a8') }} />
                                 {/* Shoes */}
                                 {currentUser.skin?.shoes === 'sapato preto' && (
                                     <>
                                         <div className="absolute -bottom-2 left-8 w-12 h-6 bg-black border-4 border-black rounded" />
                                         <div className="absolute -bottom-2 right-8 w-12 h-6 bg-black border-4 border-black rounded" />
                                     </>
                                 )}
                             </div>
                             <div className="bg-transparent text-black font-mono border-4 border-black rounded-full px-6 py-2 uppercase font-bold tracking-widest text-lg">{currentUser.name}</div>
                         </div>
                     ) : (
                         <div className="text-gray-600 font-bold border-4 border-gray-600 rounded-lg p-6 text-center shadow-inner pointer-events-none">
                            Faça Login para<br/>editar seu personagem
                         </div>
                     )}
                 </div>
             </div>
        )}
        {menuState !== 'MAIN' && (
            <div className="absolute inset-0 flex items-center justify-center">
                {menuState === 'LOGIN' && renderLogin()}
                {menuState === 'SELECT_WORLD' && renderSelectWorld()}
                {menuState === 'CREATE_WORLD' && renderCreateWorld()}
                {menuState === 'EDIT_WORLD' && renderEditWorld()}
                {menuState === 'OPTIONS' && renderOptions()}
                {menuState === 'ACHIEVEMENTS' && renderAchievements()}
                {menuState === 'EDIT_SKIN' && renderEditSkin()}
                {menuState === 'FRIENDS' && renderFriends()}
                
                {/* MULTIPLAYER MENUS */}
                {menuState === 'ONLINE_LOBBY' && renderOnlineLobby()}
                {menuState === 'CREATE_ROOM' && renderCreateRoom()}
                {menuState === 'JOIN_ROOM' && renderJoinRoom()}
            </div>
        )}

        {showAdminConfirm && (
            <div className="absolute inset-0 bg-black/90 flex items-center justify-center z-50">
                <div className="bg-red-900 border-4 border-red-500 p-6 w-[400px] text-white shadow-2xl">
                    <h2 className="text-2xl font-bold text-center mb-4">{t.ADMIN_CONFIRM_TITLE}</h2>
                    <p className="text-center mb-6">{t.ADMIN_CONFIRM_MSG}</p>
                    <div className="flex justify-around">
                        <button 
                            onClick={() => { setAdminMode(true); setShowAdminConfirm(false); }}
                            className="bg-green-700 px-6 py-2 border hover:bg-green-600"
                        >
                            {t.YES}
                        </button>
                        <button 
                            onClick={() => setShowAdminConfirm(false)}
                            className="bg-gray-700 px-6 py-2 border hover:bg-gray-600"
                        >
                            {t.NO}
                        </button>
                    </div>
                </div>
            </div>
        )}
        
        {showTouchConfig && <TouchConfigUI onClose={() => setShowTouchConfig(false)} />}
    </div>
  );
};
