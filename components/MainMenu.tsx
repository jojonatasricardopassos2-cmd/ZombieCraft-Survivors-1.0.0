
import React, { useState, useEffect } from 'react';
import { TRANSLATIONS } from '../constants.ts';
import { SavedWorld, GameOptions } from '../types.ts';
import { loadAllSavesMetadata, loadWorldFromDB, saveWorldToDB, deleteWorldFromDB } from '../utils/storage.ts';
import { audio } from '../utils/audio.ts';
import { TouchConfigUI } from './UI/TouchConfigUI.tsx';
import { ACHIEVEMENTS_LIST } from '../utils/achievementsList.ts';

interface MainMenuProps {
  onStartGame: (world: SavedWorld | null, newWorldConfig?: { name: string, seed: number, options: GameOptions }) => void;
  lang: 'EN' | 'PT' | 'ES' | 'JA';
  setLang: (l: 'EN' | 'PT' | 'ES' | 'JA') => void;
}

type MenuState = 'MAIN' | 'SELECT_WORLD' | 'CREATE_WORLD' | 'EDIT_WORLD' | 'OPTIONS' | 'ACHIEVEMENTS' | 'ONLINE_LOBBY' | 'CREATE_ROOM' | 'JOIN_ROOM';

export const MainMenu: React.FC<MainMenuProps> = ({ onStartGame, lang, setLang }) => {
  const [menuState, setMenuState] = useState<MenuState>('MAIN');
  const [showTouchConfig, setShowTouchConfig] = useState(false);
  const [saves, setSaves] = useState<SavedWorld[]>([]);
  const [selectedWorldId, setSelectedWorldId] = useState<string | null>(null);
  
  // Options
  const [optionsTab, setOptionsTab] = useState<'GAME' | 'VIDEO' | 'AUDIO' | 'LANGUAGE' | 'TOUCH'>('GAME');
  const [showCoordinates, setShowCoordinates] = useState(false);
  const [showMinimap, setShowMinimap] = useState(true);
  const [adminMode, setAdminMode] = useState(false);
  const [isMobile, setIsMobile] = useState(false); // Mobile Toggle
  const [graphicsQuality, setGraphicsQuality] = useState<'UGLY' | 'NORMAL' | 'ULTRA'>('ULTRA');
  const [volume, setVolume] = useState(0.3);
  const [showAdminConfirm, setShowAdminConfirm] = useState(false);
  const [autoUpdateMaps, setAutoUpdateMaps] = useState(true);

  // Edit/Export
  const [editWorldData, setEditWorldData] = useState<SavedWorld | null>(null);

  // Create World Inputs
  const [newWorldName, setNewWorldName] = useState('New World');
  const [newWorldSeed, setNewWorldSeed] = useState('');
  const [newWorldGameMode, setNewWorldGameMode] = useState<'SURVIVAL' | 'GOD'>('SURVIVAL');
  const [newWorldDifficulty, setNewWorldDifficulty] = useState<'EASY' | 'NORMAL' | 'HARD'>('NORMAL');

  // Multiplayer Inputs
  const [roomName, setRoomName] = useState('My Server');
  const [roomCode, setRoomCode] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [hostWorldId, setHostWorldId] = useState<string | null>(null); // For hosting existing world

  const t = TRANSLATIONS[lang];

  useEffect(() => {
      // Check for mobile device initially
      if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
          setIsMobile(true);
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
  }, [menuState]);

  const handleCreateWorld = () => {
      const seed = newWorldSeed.trim() === '' ? Math.floor(Math.random() * 999999) : parseInt(newWorldSeed) || 0;
      onStartGame(null, { 
          name: newWorldName, 
          seed, 
          options: { 
              showCoordinates,
              showMinimap,
              adminMode: adminMode || newWorldGameMode === 'GOD', // God mode implies admin
              isMobile,
              gameMode: newWorldGameMode,
              difficulty: newWorldDifficulty,
              graphicsQuality,
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
                  world.options.showMinimap = showMinimap;
                  world.options.adminMode = adminMode; // Inject current global preference
                  world.options.isMobile = isMobile;
                  world.options.graphicsQuality = graphicsQuality;
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
              if (!world.options) world.options = { showCoordinates, adminMode, isMobile };
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
                  adminMode,
                  isMobile,
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
              adminMode,
              isMobile,
              multiplayer: {
                  mode: 'CLIENT',
                  roomId: joinCode,
                  playerName: 'Guest'
              }
          } 
      });
  };

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
          onClick={() => setMenuState('ONLINE_LOBBY')}
          className="text-black font-bold text-4xl hover-bounce text-left"
        >
          {t.ONLINE_MODE}
        </button>
        <button 
          className="text-black font-bold text-4xl hover-bounce text-left cursor-not-allowed opacity-50"
          title="Inaccessible"
        >
          {t.MODS}
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
          fetch('/api/rooms')
              .then(res => res.json())
              .then(data => setActiveRooms(data.rooms || []))
              .catch(err => console.error("Failed to fetch rooms:", err));
      }
  }, [menuState]);

  const renderJoinRoom = () => (
      <div className="flex flex-col gap-4 w-[400px] bg-gray-900/90 border-4 border-blue-500 p-6 shadow-2xl text-white">
          <h2 className="text-2xl font-bold text-center mb-4 text-blue-300">{t.JOIN_ROOM_TITLE}</h2>
          
          <div className="flex flex-col gap-1">
              <label className="text-gray-300 text-sm">{t.ENTER_CODE_LABEL}</label>
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
         <div className="flex bg-gray-900 border-b-4 border-gray-500 font-mono text-sm">
             <button onClick={() => setOptionsTab('GAME')} className={`flex-1 p-2 border-r border-gray-600 ${optionsTab === 'GAME' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:bg-gray-800'}`}>Game</button>
             <button onClick={() => setOptionsTab('VIDEO')} className={`flex-1 p-2 border-r border-gray-600 ${optionsTab === 'VIDEO' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:bg-gray-800'}`}>Video</button>
             <button onClick={() => setOptionsTab('AUDIO')} className={`flex-1 p-2 border-r border-gray-600 ${optionsTab === 'AUDIO' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:bg-gray-800'}`}>Audio</button>
             <button onClick={() => setOptionsTab('LANGUAGE')} className={`flex-1 p-2 border-r border-gray-600 ${optionsTab === 'LANGUAGE' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:bg-gray-800'}`}>Language</button>
             <button onClick={() => setOptionsTab('TOUCH')} className={`flex-1 p-2 ${optionsTab === 'TOUCH' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:bg-gray-800'}`}>Touch</button>
         </div>

         {/* Content */}
         <div className="flex-1 p-6 overflow-y-auto flex flex-col gap-4">
             {optionsTab === 'GAME' && (
                 <>
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
                 <div className="w-1/2 flex items-center justify-center">
                     {/* Pixel Art Hammer */}
                     <div className="relative w-64 h-64" style={{ transform: 'rotate(45deg)' }}>
                         {/* Handle */}
                         <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-32 bg-yellow-700 border-2 border-black" style={{ boxShadow: 'inset -2px 0 0 rgba(0,0,0,0.3)' }}></div>
                         {/* Head */}
                         <div className="absolute top-10 left-1/2 -translate-x-1/2 w-32 h-20 bg-cyan-400 border-4 border-black grid grid-cols-4 grid-rows-3 gap-0" style={{ boxShadow: 'inset -4px -4px 0 rgba(0,0,0,0.3), inset 4px 4px 0 rgba(255,255,255,0.3)' }}>
                             {/* Pixel details on hammer head */}
                             {Array(12).fill(0).map((_, i) => (
                                 <div key={i} className="border border-cyan-500/30"></div>
                             ))}
                         </div>
                     </div>
                 </div>
             </div>
        )}
        {menuState !== 'MAIN' && (
            <div className="absolute inset-0 flex items-center justify-center">
                {menuState === 'SELECT_WORLD' && renderSelectWorld()}
                {menuState === 'CREATE_WORLD' && renderCreateWorld()}
                {menuState === 'EDIT_WORLD' && renderEditWorld()}
                {menuState === 'OPTIONS' && renderOptions()}
                {menuState === 'ACHIEVEMENTS' && renderAchievements()}
                
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
