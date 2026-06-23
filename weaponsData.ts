import { ItemType, BlockType } from './types';

export const GUN_STATS: Record<string, any> = {
  "glock_19": { "damage": 15, "fireRate": 300, "recoilV": 2, "recoilH": 1, "reloadSpeed": 1500, "moveSpeed": 1, "ammoType": "common_ammo", "auto": false, "mag": 15, "sound": "pistol" },
  "desert_eagle": { "damage": 50, "fireRate": 500, "recoilV": 8, "recoilH": 3, "reloadSpeed": 2500, "moveSpeed": 0.9, "ammoType": "heavy_ammo", "auto": false, "mag": 7, "sound": "heavy_pistol" },
  "beretta_m9": { "damage": 18, "fireRate": 300, "recoilV": 1.5, "recoilH": 0.5, "reloadSpeed": 1600, "moveSpeed": 1, "ammoType": "common_ammo", "auto": false, "mag": 15, "sound": "pistol" },
  "usp": { "damage": 20, "fireRate": 320, "recoilV": 1.8, "recoilH": 1, "reloadSpeed": 1400, "moveSpeed": 1, "ammoType": "common_ammo", "auto": false, "mag": 12, "sound": "pistol" },
  "five_seven": { "damage": 18, "fireRate": 250, "recoilV": 1.2, "recoilH": 0.8, "reloadSpeed": 1800, "moveSpeed": 1.05, "ammoType": "piercing_ammo", "auto": false, "mag": 20, "sound": "pistol" },
  "p250": { "damage": 25, "fireRate": 350, "recoilV": 2.5, "recoilH": 1.5, "reloadSpeed": 1500, "moveSpeed": 1, "ammoType": "common_ammo", "auto": false, "mag": 13, "sound": "pistol" },
  "cz75": { "damage": 15, "fireRate": 150, "recoilV": 3, "recoilH": 2, "reloadSpeed": 2000, "moveSpeed": 0.95, "ammoType": "common_ammo", "auto": true, "mag": 12, "sound": "smg" },
  "m1911": { "damage": 35, "fireRate": 400, "recoilV": 5, "recoilH": 2, "reloadSpeed": 1800, "moveSpeed": 0.9, "ammoType": "heavy_ammo", "auto": false, "mag": 7, "sound": "heavy_pistol" },
  "revolver_357": { "damage": 45, "fireRate": 600, "recoilV": 7, "recoilH": 2.5, "reloadSpeed": 3000, "moveSpeed": 0.9, "ammoType": "heavy_ammo", "auto": false, "mag": 6, "sound": "revolver" },
  "tec_9": { "damage": 14, "fireRate": 120, "recoilV": 4, "recoilH": 3, "reloadSpeed": 2200, "moveSpeed": 1.05, "ammoType": "common_ammo", "auto": true, "mag": 18, "sound": "smg" },
  "ak_47": { "damage": 36, "fireRate": 150, "recoilV": 5, "recoilH": 3, "reloadSpeed": 2500, "moveSpeed": 0.8, "ammoType": "heavy_ammo", "auto": true, "mag": 30, "sound": "rifle" },
  "m4a1": { "damage": 30, "fireRate": 120, "recoilV": 3.5, "recoilH": 1.5, "reloadSpeed": 2200, "moveSpeed": 0.85, "ammoType": "common_ammo", "auto": true, "mag": 30, "sound": "rifle" },
  "scar_h": { "damage": 45, "fireRate": 200, "recoilV": 6, "recoilH": 2, "reloadSpeed": 2800, "moveSpeed": 0.75, "ammoType": "heavy_ammo", "auto": true, "mag": 20, "sound": "rifle" },
  "famas": { "damage": 25, "fireRate": 100, "recoilV": 2.5, "recoilH": 1, "reloadSpeed": 2400, "moveSpeed": 0.85, "ammoType": "common_ammo", "auto": true, "mag": 25, "sound": "rifle" },
  "g36": { "damage": 28, "fireRate": 140, "recoilV": 3, "recoilH": 1.2, "reloadSpeed": 2300, "moveSpeed": 0.85, "ammoType": "common_ammo", "auto": true, "mag": 30, "sound": "rifle" },
  "aug": { "damage": 30, "fireRate": 130, "recoilV": 2, "recoilH": 1, "reloadSpeed": 2600, "moveSpeed": 0.8, "ammoType": "common_ammo", "auto": true, "mag": 30, "sound": "rifle" },
  "awp": { "damage": 100, "fireRate": 1500, "recoilV": 15, "recoilH": 5, "reloadSpeed": 3500, "moveSpeed": 0.6, "ammoType": "heavy_ammo", "auto": false, "mag": 5, "sound": "sniper" },
  "barrett_m82": { "damage": 150, "fireRate": 2000, "recoilV": 25, "recoilH": 8, "reloadSpeed": 4500, "moveSpeed": 0.5, "ammoType": "piercing_ammo", "auto": false, "mag": 5, "sound": "sniper" },
  "mp5": { "damage": 20, "fireRate": 100, "recoilV": 1.5, "recoilH": 0.5, "reloadSpeed": 1800, "moveSpeed": 0.95, "ammoType": "common_ammo", "auto": true, "mag": 30, "sound": "smg" },
  "p90": { "damage": 18, "fireRate": 90, "recoilV": 1.2, "recoilH": 1.5, "reloadSpeed": 2500, "moveSpeed": 0.95, "ammoType": "piercing_ammo", "auto": true, "mag": 50, "sound": "smg" }
};

export const WEAPON_COMPONENTS = [
  { id: 'metal_structure', name_en: 'Metal Structure', name_pt: 'Estrutura Metálica' },
  { id: 'reinforced_structure', name_en: 'Reinforced Structure', name_pt: 'Estrutura Reforçada' },
  { id: 'grip', name_en: 'Grip', name_pt: 'Empunhadura' },
  { id: 'mechanical_mechanism', name_en: 'Mechanical Mechanism', name_pt: 'Mecanismo Mecânico' },
  { id: 'ammo_chamber', name_en: 'Ammo Chamber', name_pt: 'Câmara de Munição' },
  { id: 'simple_sight', name_en: 'Simple Sight', name_pt: 'Mira Simples' },
  { id: 'advanced_sight', name_en: 'Advanced Sight', name_pt: 'Mira Avançada' },
  { id: 'energy_core', name_en: 'Energy Core', name_pt: 'Núcleo Energético' },
  { id: 'reinforced_tube', name_en: 'Reinforced Tube', name_pt: 'Tubo Reforçado' },
  { id: 'refined_iron', name_en: 'Refined Iron', name_pt: 'Ferro Refinado' },
  { id: 'energetic_coal', name_en: 'Energetic Coal', name_pt: 'Carvão Energético' },
  { id: 'blue_crystal', name_en: 'Blue Crystal', name_pt: 'Cristal Azul' },
  { id: 'red_crystal', name_en: 'Red Crystal', name_pt: 'Cristal Vermelho' },
  { id: 'packed_ice', name_en: 'Packed Ice', name_pt: 'Gelo Compactado' },
  { id: 'refined_wood', name_en: 'Refined Wood', name_pt: 'Madeira Refinada' }
];

export const AMMO_TYPES = [
  { id: 'common_ammo', name_en: 'Common Ammo', name_pt: 'Munição Comum', color: '#ffcc00' },
  { id: 'heavy_ammo', name_en: 'Heavy Ammo', name_pt: 'Munição Pesada', color: '#ff6600' },
  { id: 'piercing_ammo', name_en: 'Piercing Ammo', name_pt: 'Munição Perfurante', color: '#33ccff' },
  { id: 'energy_ammo', name_en: 'Energy Ammo', name_pt: 'Munição Energética', color: '#cc33ff' },
  { id: 'incendiary_ammo', name_en: 'Incendiary Ammo', name_pt: 'Munição Incendiária', color: '#ff3300' },
  { id: 'freezing_ammo', name_en: 'Freezing Ammo', name_pt: 'Munição Congelante', color: '#99ffff' }
];

export const WEAPON_NAMES: Record<string, {en: string, pt: string}> = {
    glock_19: { en: 'Glock 19', pt: 'Glock 19' },
    desert_eagle: { en: 'Desert Eagle', pt: 'Desert Eagle' },
    beretta_m9: { en: 'Beretta M9', pt: 'Beretta M9' },
    usp: { en: 'USP', pt: 'USP' },
    five_seven: { en: 'Five-SeveN', pt: 'Five-SeveN' },
    p250: { en: 'P250', pt: 'P250' },
    cz75: { en: 'CZ75', pt: 'CZ75' },
    m1911: { en: 'M1911', pt: 'M1911' },
    revolver_357: { en: 'Revolver .357', pt: 'Revolver .357' },
    tec_9: { en: 'Tec-9', pt: 'Tec-9' },
    ak_47: { en: 'AK-47', pt: 'AK-47' },
    m4a1: { en: 'M4A1', pt: 'M4A1' },
    scar_h: { en: 'SCAR-H', pt: 'SCAR-H' },
    famas: { en: 'FAMAS', pt: 'FAMAS' },
    g36: { en: 'G36', pt: 'G36' },
    aug: { en: 'AUG', pt: 'AUG' },
    awp: { en: 'AWP', pt: 'AWP' },
    barrett_m82: { en: 'Barrett M82', pt: 'Barrett M82' },
    mp5: { en: 'MP5', pt: 'MP5' },
    p90: { en: 'P90', pt: 'P90' }
};
