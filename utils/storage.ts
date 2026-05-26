
import { SavedWorld, BlockType } from '../types.ts';
import { generateWorld } from './world.ts';

const DB_NAME = 'MinereactDB';
const STORE_NAME = 'saves';
const DB_VERSION = 1;

let dbInstance: IDBDatabase | null = null;

const initDB = (): Promise<IDBDatabase> => {
  if (dbInstance) return Promise.resolve(dbInstance);

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(request.result);
    };
    request.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
};

export const saveWorldToDB = async (data: SavedWorld): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.put(data);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const loadAllSavesMetadata = async (): Promise<SavedWorld[]> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.openCursor();
    const saves: SavedWorld[] = [];
    
    request.onsuccess = (e) => {
      const cursor = (e.target as IDBRequest).result as IDBCursorWithValue;
      if (cursor) {
        const val = cursor.value;
        // Create a lightweight version for the list to save memory
        // We strip heavy arrays like blocks and light
        const lightSave = { 
            ...val, 
            worldData: { width: 0, height: 0, blocks: [], light: [] }, 
            inventory: [], 
            chests: [],
            furnaces: [],
            crops: []
        } as SavedWorld;
        saves.push(lightSave);
        cursor.continue();
      } else {
        resolve(saves);
      }
    };
    request.onerror = () => reject(request.error);
  });
};

export const loadWorldFromDB = async (id: string): Promise<SavedWorld | undefined> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(id);
    request.onsuccess = async () => {
      const world = request.result as SavedWorld | undefined;
      if (world && (!world.version || world.version < 2)) {
        console.log(`Updating world ${world.name} to version 2...`);
        const newWorldData = generateWorld(world.seed);
        const changedOres = [BlockType.GOLD_ORE, BlockType.DIAMOND_ORE, BlockType.TITANIUM_ORE, BlockType.URANIUM_ORE];
        
        for (let i = 0; i < world.worldData.blocks.length; i++) {
          const oldBlock = world.worldData.blocks[i];
          const newBlock = newWorldData.blocks[i];
          
          if (changedOres.includes(oldBlock) && !changedOres.includes(newBlock)) {
            world.worldData.blocks[i] = newBlock;
          }
          
          if (changedOres.includes(newBlock)) {
            if (oldBlock === BlockType.STONE || oldBlock === BlockType.DEEP_STONE) {
              world.worldData.blocks[i] = newBlock;
            }
          }
        }
        
        world.version = 2;
        await saveWorldToDB(world);
      }
      resolve(world);
    };
    request.onerror = () => reject(request.error);
  });
};

export const deleteWorldFromDB = async (id: string): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};
