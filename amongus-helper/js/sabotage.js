/**
 * Sabotage Manager Module
 * サボタージュ (停電, リアクター, O2, 通信, ドア閉鎖) 管理・視界エリア計算
 */

const SABOTAGE_TYPES = {
  lights: {
    id: 'lights',
    name: '💡 停電 (Lights Out)',
    icon: '💡',
    visionMultiplier: 0.25, // クルー視界が通常の1/4に短縮
    locations: {
      skeld: { x: 380, y: 550, name: '電気室 (Electrical)' },
      mira: { x: 420, y: 320, name: 'オフィス (Office)' },
      polus: { x: 300, y: 480, name: '電気室 (Electrical)' },
      airship: { x: 500, y: 400, name: '電気室 (Electrical)' },
      fungle: { x: 450, y: 450, name: '展望台 (Lookout)' },
    }
  },
  reactor: {
    id: 'reactor',
    name: '⚛️ リアクター (Reactor Meltdown)',
    icon: '⚛️',
    locations: {
      skeld: { x: 120, y: 350, name: 'リアクター (上下ボタン)' },
      mira: { x: 150, y: 200, name: '原子炉 (2人手形)' },
      polus: { x: 180, y: 400, name: '地震計 (2箇所)' },
      airship: { x: 250, y: 300, name: 'エンジン室 (2箇所)' },
      fungle: { x: 200, y: 350, name: '発電所 (2箇所)' },
    }
  },
  o2: {
    id: 'o2',
    name: '💨 O2 (酸素枯渇)',
    icon: '💨',
    locations: {
      skeld: { x: 680, y: 320, name: 'O2部屋 & 管理室 (2箇所)' },
      mira: { x: 600, y: 280, name: '温室 (Greenhouse)' },
      polus: { x: 620, y: 350, name: 'O2部屋 & 生命維持' },
      airship: { x: 650, y: 350, name: 'メインホール' },
      fungle: { x: 600, y: 400, name: 'キッチン' },
    }
  },
  comms: {
    id: 'comms',
    name: '📡 通信障害 (Comms Sabotage)',
    icon: '📡',
    locations: {
      skeld: { x: 550, y: 650, name: '通信室 (Communications)' },
      mira: { x: 500, y: 550, name: '通信室 (Communications)' },
      polus: { x: 500, y: 600, name: '通信室 (Communications)' },
      airship: { x: 700, y: 500, name: '通信室 (Communications)' },
      fungle: { x: 550, y: 500, name: '通信室 (Communications)' },
    }
  },
  doors: {
    id: 'doors',
    name: '🚪 ドア閉鎖 (Door Sabotage)',
    icon: '🚪',
    locations: {}
  }
};

class SabotageManager {
  constructor() {
    this.activeSabotages = [];
    this.history = [];
  }

  triggerSabotage(typeId, mapId, timestampSeconds) {
    const sabotageDef = SABOTAGE_TYPES[typeId];
    if (!sabotageDef) return null;

    const location = sabotageDef.locations[mapId] || { x: 400, y: 300, name: '中央エリア' };

    const eventRecord = {
      id: Date.now(),
      typeId: typeId,
      name: sabotageDef.name,
      icon: sabotageDef.icon,
      timestamp: timestampSeconds,
      mapId: mapId,
      location: location,
      resolved: false,
    };

    this.activeSabotages.push(eventRecord);
    this.history.push(eventRecord);
    return eventRecord;
  }

  resolveSabotage(eventId) {
    const record = this.activeSabotages.find(s => s.id === eventId);
    if (record) {
      record.resolved = true;
      this.activeSabotages = this.activeSabotages.filter(s => s.id !== eventId);
    }
  }

  isLightsOutActive() {
    return this.activeSabotages.some(s => s.typeId === 'lights');
  }

  getActiveSabotages() {
    return this.activeSabotages;
  }

  getHistory() {
    return this.history;
  }

  clearHistory() {
    this.activeSabotages = [];
    this.history = [];
  }
}

window.SabotageManager = SabotageManager;
window.SABOTAGE_TYPES = SABOTAGE_TYPES;
