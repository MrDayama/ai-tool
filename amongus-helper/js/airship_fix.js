/**
 * Map Canvas Engine
 * The Airship (飛行船) 完全精密構造へのアップデート
 */

// The Airship の公式正確なレイアウト構造データ
const AIRSHIP_EXACT_SPEC = {
  name: 'The Airship',
  rooms: [
    // 上層
    { id: 'cockpit', name: 'Cockpit (コックピット)', x: 40, y: 160, w: 130, h: 120 },
    { id: 'vault', name: 'Vault (金庫室)', x: 200, y: 50, w: 140, h: 120 },
    { id: 'brig', name: 'Brig (牢屋)', x: 200, y: 200, w: 120, h: 110 },
    { id: 'gap_room', name: 'Gap Room (昇降機/展望台)', x: 350, y: 140, w: 160, h: 130 },
    { id: 'meeting', name: 'Meeting Room (会議室)', x: 700, y: 40, w: 170, h: 130 },
    
    // 中層
    { id: 'engine', name: 'Engine Room (エンジン室)', x: 190, y: 340, w: 150, h: 140 },
    { id: 'records', name: 'Records (アーカイブ)', x: 540, y: 80, w: 140, h: 150 },
    { id: 'lounge', name: 'Lounge (ラウンジ)', x: 740, y: 190, w: 130, h: 110 },
    { id: 'showers', name: 'Showers (シャワー室)', x: 740, y: 320, w: 130, h: 110 },

    // 下層
    { id: 'electrical', name: 'Electrical (電気室/迷路)', x: 370, y: 300, w: 140, h: 140 },
    { id: 'main_hall', name: 'Main Hall (メインホール)', x: 370, y: 460, w: 180, h: 110 },
    { id: 'medical', name: 'Medical (医務室)', x: 530, y: 250, w: 120, h: 110 },
    { id: 'kitchen', name: 'Kitchen (厨房)', x: 570, y: 380, w: 140, h: 110 },
    { id: 'cargo', name: 'Cargo Bay (貨物室)', x: 730, y: 450, w: 140, h: 120 },
  ],
  corridors: [
    { from: {x: 170, y: 220}, to: {x: 200, y: 220} }, // Cockpit - Brig
    { from: {x: 270, y: 170}, to: {x: 270, y: 200} }, // Vault - Brig
    { from: {x: 320, y: 250}, to: {x: 350, y: 250} }, // Brig - Gap Room
    { from: {x: 510, y: 200}, to: {x: 540, y: 160} }, // Gap Room - Records
    { from: {x: 680, y: 120}, to: {x: 700, y: 100} }, // Records - Meeting
    { from: {x: 260, y: 310}, to: {x: 260, y: 340} }, // Brig - Engine
    { from: {x: 340, y: 410}, to: {x: 370, y: 370} }, // Engine - Electrical
    { from: {x: 440, y: 440}, to: {x: 440, y: 460} }, // Electrical - Main Hall
    { from: {x: 550, y: 500}, to: {x: 570, y: 440} }, // Main Hall - Kitchen
    { from: {x: 680, y: 180}, to: {x: 740, y: 240} }, // Records - Lounge
    { from: {x: 805, y: 300}, to: {x: 805, y: 320} }, // Lounge - Showers
    { from: {x: 805, y: 430}, to: {x: 805, y: 450} }, // Showers - Cargo Bay
  ],
  vents: [
    { x: 320, y: 70, label: '🌀 Vault' },
    { x: 290, y: 220, label: '🌀 Brig' },
    { x: 480, y: 160, label: '🌀 Gap Room' },
    { x: 490, y: 330, label: '🌀 Elec' },
    { x: 500, y: 500, label: '🌀 Main Hall' },
    { x: 650, y: 100, label: '🌀 Records' },
    { x: 840, y: 340, label: '🌀 Showers' },
    { x: 840, y: 470, label: '🌀 Cargo' },
  ],
  lightsElectX: 440, lightsElectY: 370
};

// 既存マップエンジンの Airship 定義部分を置換更新
window.AIRSHIP_EXACT_SPEC = AIRSHIP_EXACT_SPEC;
