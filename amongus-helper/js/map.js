/**
 * Map Canvas Engine
 * ゲーム内管理画面 (Admin Map / ゲーム内全全対マップ) 同等・完全忠実グラフィック描画エンジン
 */

const INGAME_ADMIN_MAPS = {
  // 1. The Skeld (インゲーム・Adminマップ再現)
  skeld: {
    name: 'The Skeld (ゲーム内Adminマップ)',
    bgStyle: '#080c16',
    rooms: [
      { id: 'cafeteria', name: 'Cafeteria', shape: 'octagon', x: 350, y: 30, w: 220, h: 150, isSpawn: true },
      { id: 'weapons', name: 'Weapons', shape: 'rect', x: 630, y: 50, w: 150, h: 120 },
      { id: 'o2', name: 'O2', shape: 'rect', x: 570, y: 200, w: 100, h: 90 },
      { id: 'navigation', name: 'Navigation', shape: 'pointer', x: 720, y: 230, w: 140, h: 150 },
      { id: 'shields', name: 'Shields', shape: 'rect', x: 610, y: 420, w: 150, h: 120 },
      { id: 'communications', name: 'Comms', shape: 'rect', x: 480, y: 470, w: 110, h: 90 },
      { id: 'storage', name: 'Storage', shape: 'rect', x: 350, y: 340, w: 190, h: 190 },
      { id: 'admin', name: 'Admin', shape: 'rect', x: 570, y: 310, w: 120, h: 120, hasAdminTable: true },
      { id: 'electrical', name: 'Electrical', shape: 't_room', x: 200, y: 340, w: 130, h: 140 },
      { id: 'lower_engine', name: 'Lower Engine', shape: 'rect', x: 50, y: 420, w: 130, h: 130 },
      { id: 'security', name: 'Security', shape: 'rect', x: 130, y: 240, w: 90, h: 90, hasCams: true },
      { id: 'upper_engine', name: 'Upper Engine', shape: 'rect', x: 50, y: 70, w: 130, h: 130 },
      { id: 'reactor', name: 'Reactor', shape: 'octagon', x: 10, y: 200, w: 100, h: 180 },
      { id: 'medbay', name: 'MedBay', shape: 'rect', x: 210, y: 160, w: 110, h: 110, hasScan: true },
    ],
    corridors: [
      { from: {x: 460, y: 180}, to: {x: 460, y: 340} }, // Cafe - Storage
      { from: {x: 270, y: 110}, to: {x: 350, y: 110} }, // Upper Engine - Cafe
      { from: {x: 570, y: 110}, to: {x: 630, y: 110} }, // Cafe - Weapons
      { from: {x: 115, y: 200}, to: {x: 115, y: 420} }, // Reactor Main Hallway
      { from: {x: 110, y: 285}, to: {x: 130, y: 285} }, // Reactor - Security
      { from: {x: 220, y: 285}, to: {x: 260, y: 285} }, // Security - Elec Hallway
      { from: {x: 330, y: 410}, to: {x: 350, y: 410} }, // Elec - Storage
      { from: {x: 540, y: 410}, to: {x: 570, y: 370} }, // Storage - Admin
      { from: {x: 690, y: 310}, to: {x: 720, y: 310} }, // Admin - Nav
      { from: {x: 680, y: 170}, to: {x: 720, y: 240} }, // Weapons - Nav
      { from: {x: 685, y: 380}, to: {x: 685, y: 420} }, // Nav - Shields
    ],
    vents: [
      { x: 370, y: 160, label: '🌀 Cafe' },
      { x: 580, y: 330, label: '🌀 Admin' },
      { x: 220, y: 460, label: '🌀 Elec' },
      { x: 140, y: 310, label: '🌀 Sec' },
      { x: 220, y: 250, label: '🌀 Med' },
      { x: 70, y: 210, label: '🌀 React-U' },
      { x: 70, y: 360, label: '🌀 React-L' },
      { x: 730, y: 250, label: '🌀 Nav-N' },
      { x: 730, y: 370, label: '🌀 Nav-S' },
      { x: 700, y: 80, label: '🌀 Weapons' },
      { x: 680, y: 500, label: '🌀 Shields' },
    ],
    lightsElectX: 260, lightsElectY: 410
  },

  // 2. MIRA HQ (インゲーム・Adminマップ再現)
  mira: {
    name: 'MIRA HQ (ゲーム内Adminマップ)',
    bgStyle: '#0d1322',
    rooms: [
      { id: 'launchpad', name: 'Launchpad', shape: 'rect', x: 40, y: 440, w: 160, h: 130 },
      { id: 'medbay', name: 'MedBay', shape: 'rect', x: 240, y: 460, w: 120, h: 100 },
      { id: 'comms', name: 'Comms', shape: 'rect', x: 260, y: 330, w: 120, h: 90 },
      { id: 'storage', name: 'Storage', shape: 'rect', x: 420, y: 420, w: 150, h: 130 },
      { id: 'cafeteria', name: 'Cafeteria', shape: 'octagon', x: 630, y: 390, w: 180, h: 150 },
      { id: 'balcony', name: 'Balcony', shape: 'rect', x: 750, y: 260, w: 120, h: 90 },
      { id: 'admin', name: 'Admin', shape: 'rect', x: 610, y: 240, w: 110, h: 100 },
      { id: 'office', name: 'Office', shape: 'rect', x: 430, y: 250, w: 130, h: 110 },
      { id: 'greenhouse', name: 'Greenhouse (温室)', shape: 'leaf', x: 410, y: 30, w: 200, h: 150 },
      { id: 'laboratory', name: 'Laboratory', shape: 'rect', x: 180, y: 150, w: 140, h: 130 },
      { id: 'reactor', name: 'Reactor', shape: 'octagon', x: 40, y: 150, w: 110, h: 130 },
    ],
    corridors: [
      { from: {x: 200, y: 505}, to: {x: 240, y: 505} },
      { from: {x: 360, y: 505}, to: {x: 420, y: 505} },
      { from: {x: 570, y: 475}, to: {x: 630, y: 475} },
      { from: {x: 495, y: 420}, to: {x: 495, y: 360} },
      { from: {x: 495, y: 250}, to: {x: 495, y: 180} },
      { from: {x: 430, y: 305}, to: {x: 320, y: 215} },
      { from: {x: 180, y: 215}, to: {x: 150, y: 215} },
    ],
    vents: [
      { x: 180, y: 460, label: '🌀 Launchpad' },
      { x: 340, y: 350, label: '🌀 Comms' },
      { x: 540, y: 440, label: '🌀 Storage' },
      { x: 770, y: 410, label: '🌀 Cafe' },
      { x: 810, y: 280, label: '🌀 Balcony' },
      { x: 680, y: 260, label: '🌀 Admin' },
      { x: 510, y: 270, label: '🌀 Office' },
      { x: 510, y: 60, label: '🌀 Greenhouse' },
      { x: 260, y: 170, label: '🌀 Lab' },
      { x: 90, y: 170, label: '🌀 Reactor' },
    ],
    lightsElectX: 495, lightsElectY: 305
  },

  // 3. Polus (インゲーム・Adminマップ再現)
  polus: {
    name: 'Polus (ゲーム内Adminマップ)',
    bgStyle: '#0f141d',
    rooms: [
      { id: 'dropship', name: 'Dropship', shape: 'rect', x: 380, y: 30, w: 150, h: 110 },
      { id: 'electrical', name: 'Electrical', shape: 'rect', x: 110, y: 350, w: 140, h: 150 },
      { id: 'security', name: 'Security', shape: 'rect', x: 110, y: 210, w: 110, h: 100 },
      { id: 'o2', name: 'O2', shape: 'rect', x: 250, y: 190, w: 120, h: 120 },
      { id: 'communications', name: 'Comms', shape: 'rect', x: 250, y: 350, w: 110, h: 100 },
      { id: 'storage', name: 'Storage', shape: 'rect', x: 420, y: 230, w: 170, h: 170 },
      { id: 'office', name: 'Office & Admin', shape: 'rect', x: 630, y: 210, w: 190, h: 150, hasVitals: true },
      { id: 'weapons', name: 'Weapons', shape: 'rect', x: 650, y: 70, w: 140, h: 100 },
      { id: 'laboratory', name: 'Laboratory', shape: 'rect', x: 630, y: 390, w: 190, h: 160 },
      { id: 'specimen', name: 'Specimen Room', shape: 'rect', x: 380, y: 460, w: 170, h: 110 },
    ],
    corridors: [
      { from: {x: 455, y: 140}, to: {x: 455, y: 230} },
      { from: {x: 370, y: 250}, to: {x: 420, y: 250} },
      { from: {x: 590, y: 290}, to: {x: 630, y: 290} },
      { from: {x: 720, y: 170}, to: {x: 720, y: 210} },
      { from: {x: 720, y: 360}, to: {x: 720, y: 390} },
      { from: {x: 465, y: 400}, to: {x: 465, y: 460} },
      { from: {x: 220, y: 310}, to: {x: 220, y: 350} },
    ],
    vents: [
      { x: 220, y: 370, label: '🌀 Elec' },
      { x: 200, y: 230, label: '🌀 Sec' },
      { x: 340, y: 210, label: '🌀 O2' },
      { x: 560, y: 250, label: '🌀 Storage' },
      { x: 790, y: 230, label: '🌀 Office-N' },
      { x: 650, y: 320, label: '🌀 Office-S' },
      { x: 760, y: 90, label: '🌀 Weapons' },
      { x: 790, y: 410, label: '🌀 Lab' },
      { x: 400, y: 480, label: '🌀 Specimen' },
    ],
    lightsElectX: 180, lightsElectY: 420
  },

  // 4. The Airship (インゲーム・Adminマップ完全再現)
  airship: {
    name: 'The Airship (ゲーム内Adminマップ)',
    bgStyle: '#170c17',
    rooms: [
      { id: 'cockpit', name: 'Cockpit', shape: 'pointer', x: 20, y: 140, w: 140, h: 130 },
      { id: 'vault', name: 'Vault', shape: 'rect', x: 180, y: 30, w: 150, h: 130 },
      { id: 'brig', name: 'Brig', shape: 'rect', x: 180, y: 180, w: 130, h: 130 },
      { id: 'gap_room', name: 'Gap Room (昇降機)', shape: 'rect', x: 340, y: 120, w: 170, h: 150, hasPlatform: true },
      { id: 'meeting', name: 'Meeting Room', shape: 'octagon', x: 700, y: 20, w: 180, h: 140 },
      { id: 'engine', name: 'Engine Room', shape: 'rect', x: 160, y: 340, w: 160, h: 150 },
      { id: 'records', name: 'Records', shape: 'rect', x: 540, y: 60, w: 140, h: 160 },
      { id: 'lounge', name: 'Lounge', shape: 'rect', x: 740, y: 180, w: 130, h: 110 },
      { id: 'showers', name: 'Showers', shape: 'rect', x: 740, y: 310, w: 130, h: 110 },
      { id: 'electrical', name: 'Electrical (スイッチ迷路)', shape: 'rect', x: 350, y: 300, w: 160, h: 150, isMaze: true },
      { id: 'main_hall', name: 'Main Hall', shape: 'rect', x: 350, y: 480, w: 190, h: 110 },
      { id: 'medical', name: 'Medical', shape: 'rect', x: 530, y: 240, w: 120, h: 110 },
      { id: 'kitchen', name: 'Kitchen', shape: 'rect', x: 570, y: 370, w: 140, h: 110 },
      { id: 'cargo', name: 'Cargo Bay', shape: 'rect', x: 730, y: 440, w: 140, h: 130 },
    ],
    corridors: [
      { from: {x: 160, y: 205}, to: {x: 180, y: 205} },
      { from: {x: 255, y: 160}, to: {x: 255, y: 180} },
      { from: {x: 310, y: 235}, to: {x: 340, y: 235} },
      { from: {x: 510, y: 185}, to: {x: 540, y: 140} },
      { from: {x: 680, y: 100}, to: {x: 700, y: 85} },
      { from: {x: 240, y: 310}, to: {x: 240, y: 340} },
      { from: {x: 320, y: 415}, to: {x: 350, y: 375} },
      { from: {x: 430, y: 450}, to: {x: 430, y: 480} },
      { from: {x: 540, y: 520}, to: {x: 570, y: 440} },
      { from: {x: 680, y: 160}, to: {x: 740, y: 220} },
      { from: {x: 805, y: 290}, to: {x: 805, y: 310} },
      { from: {x: 805, y: 420}, to: {x: 805, y: 440} },
    ],
    vents: [
      { x: 300, y: 50, label: '🌀 Vault' },
      { x: 270, y: 200, label: '🌀 Brig' },
      { x: 480, y: 140, label: '🌀 Gap' },
      { x: 480, y: 330, label: '🌀 Elec' },
      { x: 500, y: 520, label: '🌀 Hall' },
      { x: 650, y: 80, label: '🌀 Records' },
      { x: 840, y: 330, label: '🌀 Showers' },
      { x: 840, y: 460, label: '🌀 Cargo' },
    ],
    lightsElectX: 430, lightsElectY: 375
  },

  // 5. The Fungle (インゲーム・Adminマップ再現)
  fungle: {
    name: 'The Fungle (ゲーム内Adminマップ)',
    bgStyle: '#0d1a14',
    rooms: [
      { id: 'lookout', name: 'Lookout', shape: 'rect', x: 380, y: 30, w: 140, h: 100 },
      { id: 'kitchen', name: 'Kitchen', shape: 'rect', x: 580, y: 90, w: 140, h: 120 },
      { id: 'beach', name: 'Beach', shape: 'rect', x: 740, y: 230, w: 140, h: 170 },
      { id: 'comms', name: 'Comms', shape: 'rect', x: 560, y: 250, w: 130, h: 120 },
      { id: 'greenhouse', name: 'Greenhouse', shape: 'leaf', x: 370, y: 210, w: 150, h: 140 },
      { id: 'reactor', name: 'Generator', shape: 'rect', x: 180, y: 170, w: 130, h: 130 },
      { id: 'mining', name: 'Mining Pit', shape: 'rect', x: 50, y: 230, w: 110, h: 190 },
      { id: 'laboratory', name: 'Lab', shape: 'rect', x: 220, y: 370, w: 150, h: 140 },
      { id: 'camp', name: 'Campfire', shape: 'octagon', x: 420, y: 390, w: 180, h: 160 },
    ],
    corridors: [
      { from: {x: 450, y: 130}, to: {x: 450, y: 210} },
      { from: {x: 520, y: 150}, to: {x: 580, y: 150} },
      { from: {x: 310, y: 250}, to: {x: 370, y: 250} },
      { from: {x: 520, y: 280}, to: {x: 560, y: 280} },
      { from: {x: 690, y: 310}, to: {x: 740, y: 310} },
      { from: {x: 510, y: 350}, to: {x: 510, y: 390} },
      { from: {x: 370, y: 440}, to: {x: 420, y: 440} },
    ],
    vents: [
      { x: 490, y: 60, label: '🌀 Lookout' },
      { x: 690, y: 110, label: '🌀 Kitchen' },
      { x: 840, y: 260, label: '🌀 Beach' },
      { x: 660, y: 270, label: '🌀 Comms' },
      { x: 280, y: 190, label: '🌀 Generator' },
      { x: 340, y: 400, label: '🌀 Lab' },
    ],
    lightsElectX: 450, lightsElectY: 80
  }
};

class MapEngine {
  constructor(canvasEl, wrapperEl) {
    this.canvas = canvasEl;
    this.ctx = canvasEl.getContext('2d');
    this.wrapper = wrapperEl;

    this.currentMapId = 'skeld';
    this.currentTool = 'pin-player';
    this.activePlayerObj = { id: 'red', name: '赤 (Red)', colorHex: '#c61111' };

    this.drawings = [];
    this.pins = [];

    this.isDrawing = false;
    this.currentPath = [];
    this.startPoint = null;

    this.showRadiusOverlay = false;
    this.radiusCenter = null;
    this.radiusPx = 0;

    this.initCanvasSize();
    this.bindEvents();
  }

  initCanvasSize() {
    this.canvas.width = 960;
    this.canvas.height = 640;
    this.render();
  }

  setMap(mapId) {
    if (INGAME_ADMIN_MAPS[mapId]) {
      this.currentMapId = mapId;
      this.render();
    }
  }

  setTool(toolId) {
    this.currentTool = toolId;
  }

  setActivePlayer(playerObj) {
    if (playerObj) {
      this.activePlayerObj = playerObj;
    }
  }

  setActivePlayerColor(colorHex) {
    if (this.activePlayerObj) {
      this.activePlayerObj.colorHex = colorHex;
    }
  }

  clearDrawings() {
    this.drawings = [];
    this.pins = [];
    this.showRadiusOverlay = false;
    this.render();
  }

  setRadiusCircle(centerPoint, speedMultiplier, elapsedSeconds) {
    const baseSpeedPxPerSec = 22;
    this.radiusCenter = centerPoint;
    this.radiusPx = baseSpeedPxPerSec * speedMultiplier * elapsedSeconds;
    this.showRadiusOverlay = true;
    this.render();
  }

  bindEvents() {
    this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
    this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
    this.canvas.addEventListener('mouseleave', () => this.handleMouseUp());
  }

  getCanvasPoint(e) {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  }

  handleMouseDown(e) {
    const pt = this.getCanvasPoint(e);
    this.isDrawing = true;
    this.startPoint = pt;

    if (this.currentTool === 'pen') {
      this.currentPath = [pt];
    } else if (this.currentTool === 'pin-player') {
      this.addPlayerPin(pt, this.activePlayerObj);
      this.isDrawing = false;
    } else if (this.currentTool.startsWith('pin-')) {
      const pinType = this.currentTool.replace('pin-', '');
      this.addPin(pt, pinType, this.activePlayerObj ? this.activePlayerObj.colorHex : '#38bdf8');
      this.isDrawing = false;
    } else if (this.currentTool === 'radius') {
      this.radiusCenter = pt;
      this.showRadiusOverlay = true;
      this.isDrawing = false;
      this.render();
    }
  }

  handleMouseMove(e) {
    if (!this.isDrawing) return;
    const pt = this.getCanvasPoint(e);

    if (this.currentTool === 'pen') {
      this.currentPath.push(pt);
      this.render();
      this.drawPath(this.currentPath, this.activePlayerObj ? this.activePlayerObj.colorHex : '#c61111', 4);
    } else if (this.currentTool === 'line' || this.currentTool === 'arrow') {
      this.render();
      const color = this.activePlayerObj ? this.activePlayerObj.colorHex : '#c61111';
      if (this.currentTool === 'line') {
        this.drawLine(this.startPoint, pt, color, 3);
      } else {
        this.drawArrow(this.startPoint, pt, color, 3);
      }
    }
  }

  handleMouseUp(e) {
    if (!this.isDrawing) return;
    this.isDrawing = false;
    if (!e) return;

    const pt = this.getCanvasPoint(e);
    const color = this.activePlayerObj ? this.activePlayerObj.colorHex : '#c61111';

    if (this.currentTool === 'pen' && this.currentPath.length > 1) {
      this.drawings.push({
        type: 'path',
        points: [...this.currentPath],
        colorHex: color,
        width: 4
      });
    } else if (this.currentTool === 'line') {
      this.drawings.push({
        type: 'line',
        start: this.startPoint,
        end: pt,
        colorHex: color,
        width: 3
      });
    } else if (this.currentTool === 'arrow') {
      this.drawings.push({
        type: 'arrow',
        start: this.startPoint,
        end: pt,
        colorHex: color,
        width: 3
      });
    }

    this.currentPath = [];
    this.startPoint = null;
    this.render();
  }

  addPlayerPin(point, playerObj) {
    if (!playerObj) return;
    this.pins.push({
      x: point.x,
      y: point.y,
      type: 'player',
      symbol: '👤',
      colorHex: playerObj.colorHex,
      playerName: playerObj.name
    });
    this.render();
  }

  addPin(point, pinType, colorHex) {
    const icons = { corpse: '💀', task: '📋', vent: '🌀', sight: '👀' };
    this.pins.push({
      x: point.x,
      y: point.y,
      type: pinType,
      symbol: icons[pinType] || '📍',
      colorHex: colorHex
    });
    this.render();
  }

  render() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // 1. ゲーム内Adminマップと同等のインゲームグラフィック描画
    this.drawInGameAdminMap();

    // 2. ユーザー描画線
    this.drawings.forEach(d => {
      if (d.type === 'path') this.drawPath(d.points, d.colorHex, d.width);
      else if (d.type === 'line') this.drawLine(d.start, d.end, d.colorHex, d.width);
      else if (d.type === 'arrow') this.drawArrow(d.start, d.end, d.colorHex, d.width);
    });

    // 3. 移動半径サークル
    if (this.showRadiusOverlay && this.radiusCenter && this.radiusPx > 0) {
      this.drawRadiusCircle(this.radiusCenter, this.radiusPx);
    }

    // 4. ピン＆プレイヤーコマ描画
    this.pins.forEach(pin => {
      if (pin.type === 'player') {
        this.drawPlayerPin(pin);
      } else {
        this.drawPin(pin);
      }
    });

    // 5. 停電サボタージュ視界・配電盤マーク
    if (window.sabotageManager && window.sabotageManager.isLightsOutActive()) {
      this.drawLightsOutVisionOverlay();
    }
  }

  drawInGameAdminMap() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const mapDef = INGAME_ADMIN_MAPS[this.currentMapId] || INGAME_ADMIN_MAPS['skeld'];

    // インゲーム背景色
    ctx.fillStyle = mapDef.bgStyle || '#080c16';
    ctx.fillRect(0, 0, w, h);

    // ネオンホログラムグリッド (ゲーム内Adminマップテイスト)
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.08)';
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 30) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
    }
    for (let y = 0; y < h; y += 30) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }

    // 1. 廊下（Corridor）ネオンダクト描画
    if (mapDef.corridors) {
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 26;
      ctx.lineCap = 'round';
      mapDef.corridors.forEach(c => {
        ctx.beginPath();
        ctx.moveTo(c.from.x, c.from.y);
        ctx.lineTo(c.to.x, c.to.y);
        ctx.stroke();
      });

      // 廊下青ネオン枠
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 2.5;
      mapDef.corridors.forEach(c => {
        ctx.beginPath();
        ctx.moveTo(c.from.x, c.from.y);
        ctx.lineTo(c.to.x, c.to.y);
        ctx.stroke();
      });
    }

    // 2. 各部屋のインゲーム専用形状グラフィック描画
    mapDef.rooms.forEach(room => {
      ctx.save();

      // 部屋背景
      ctx.fillStyle = '#0f172a';

      if (room.shape === 'octagon') {
        this.drawOctagonPath(ctx, room.x, room.y, room.w, room.h);
        ctx.fill();
        ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 2.5; ctx.stroke();
      } else if (room.shape === 'pointer') {
        this.drawPointerPath(ctx, room.x, room.y, room.w, room.h);
        ctx.fill();
        ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 2.5; ctx.stroke();
      } else if (room.shape === 'leaf') {
        this.drawLeafPath(ctx, room.x, room.y, room.w, room.h);
        ctx.fill();
        ctx.strokeStyle = '#22c55e'; ctx.lineWidth = 2.5; ctx.stroke();
      } else {
        // 標準長方形部屋
        ctx.fillRect(room.x, room.y, room.w, room.h);
        ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 2.5;
        ctx.strokeRect(room.x, room.y, room.w, room.h);
      }

      // 特殊アイコン・オブジェクト描画
      if (room.isSpawn) {
        // Cafe 中央ボタン
        const cx = room.x + room.w / 2;
        const cy = room.y + room.h / 2 + 10;
        ctx.beginPath(); ctx.arc(cx, cy, 18, 0, Math.PI * 2);
        ctx.fillStyle = '#334155'; ctx.fill(); ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 2; ctx.stroke();
        ctx.beginPath(); ctx.arc(cx, cy, 7, 0, Math.PI * 2);
        ctx.fillStyle = '#ef4444'; ctx.fill();
      }

      if (room.hasAdminTable) {
        // Admin テーブル
        ctx.fillStyle = '#0284c7';
        ctx.fillRect(room.x + 20, room.y + room.h - 30, room.w - 40, 15);
      }

      // 部屋名ラベル
      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 12px system-ui';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(room.name, room.x + room.w / 2, room.y + room.h / 2);

      ctx.restore();
    });

    // 3. インゲーム ベント (Vent 🌀)
    if (mapDef.vents) {
      mapDef.vents.forEach(v => {
        ctx.beginPath();
        ctx.arc(v.x, v.y, 8, 0, Math.PI * 2);
        ctx.fillStyle = '#f59e0b';
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = '#fbbf24';
        ctx.font = 'bold 10px system-ui';
        ctx.textAlign = 'center';
        ctx.fillText(v.label, v.x, v.y - 12);
      });
    }

    // 4. ゲーム内 Admin モード表示ヘッダー
    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    ctx.fillRect(w - 240, 10, 230, 34);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(w - 240, 10, 230, 34);

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 13px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText(`💻 ADMIN MAP: ${mapDef.name.toUpperCase()}`, w - 125, 32);
  }

  // 形状パスユーティリティ
  drawOctagonPath(ctx, x, y, w, h) {
    const cut = 20;
    ctx.beginPath();
    ctx.moveTo(x + cut, y);
    ctx.lineTo(x + w - cut, y);
    ctx.lineTo(x + w, y + cut);
    ctx.lineTo(x + w, y + h - cut);
    ctx.lineTo(x + w - cut, y + h);
    ctx.lineTo(x + cut, y + h);
    ctx.lineTo(x, y + h - cut);
    ctx.lineTo(x, y + cut);
    ctx.closePath();
  }

  drawPointerPath(ctx, x, y, w, h) {
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + w * 0.7, y);
    ctx.lineTo(x + w, y + h / 2);
    ctx.lineTo(x + w * 0.7, y + h);
    ctx.lineTo(x, y + h);
    ctx.closePath();
  }

  drawLeafPath(ctx, x, y, w, h) {
    ctx.beginPath();
    ctx.arc(x + w / 2, y + h / 2, Math.min(w, h) / 2, 0, Math.PI * 2);
  }

  drawPlayerPin(pin) {
    const ctx = this.ctx;
    ctx.save();

    ctx.beginPath();
    ctx.arc(pin.x, pin.y, 18, 0, Math.PI * 2);
    ctx.fillStyle = pin.colorHex;
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.font = '14px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('👤', pin.x, pin.y);

    if (pin.playerName) {
      ctx.font = 'bold 11px system-ui';
      const textWidth = ctx.measureText(pin.playerName).width;

      ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
      ctx.fillRect(pin.x - textWidth / 2 - 4, pin.y + 20, textWidth + 8, 16);
      ctx.strokeStyle = pin.colorHex;
      ctx.lineWidth = 1;
      ctx.strokeRect(pin.x - textWidth / 2 - 4, pin.y + 20, textWidth + 8, 16);

      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.fillText(pin.playerName, pin.x, pin.y + 32);
    }

    ctx.restore();
  }

  drawPin(pin) {
    const ctx = this.ctx;
    ctx.save();
    ctx.beginPath();
    ctx.arc(pin.x, pin.y, 16, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.fill();
    ctx.strokeStyle = pin.colorHex;
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.font = '16px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(pin.symbol, pin.x, pin.y);
    ctx.restore();
  }

  drawPath(points, colorHex, width) {
    if (points.length < 2) return;
    const ctx = this.ctx;
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.strokeStyle = colorHex;
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
  }

  drawLine(start, end, colorHex, width) {
    const ctx = this.ctx;
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.strokeStyle = colorHex;
    ctx.lineWidth = width;
    ctx.stroke();
  }

  drawArrow(start, end, colorHex, width) {
    this.drawLine(start, end, colorHex, width);
    const headlen = 12;
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const angle = Math.atan2(dy, dx);
    const ctx = this.ctx;
    ctx.beginPath();
    ctx.moveTo(end.x, end.y);
    ctx.lineTo(end.x - headlen * Math.cos(angle - Math.PI / 6), end.y - headlen * Math.sin(angle - Math.PI / 6));
    ctx.moveTo(end.x, end.y);
    ctx.lineTo(end.x - headlen * Math.cos(angle + Math.PI / 6), end.y - headlen * Math.sin(angle + Math.PI / 6));
    ctx.strokeStyle = colorHex;
    ctx.lineWidth = width;
    ctx.stroke();
  }

  drawRadiusCircle(center, radius) {
    const ctx = this.ctx;
    ctx.save();
    ctx.beginPath();
    ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(56, 189, 248, 0.12)';
    ctx.fill();
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.stroke();

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 12px system-ui';
    ctx.fillText(`最高到達可能範囲 (${Math.round(radius)}px)`, center.x - 50, center.y - radius - 8);
    ctx.restore();
  }

  drawLightsOutVisionOverlay() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
    ctx.fillRect(0, 0, w, h);

    const mapDef = INGAME_ADMIN_MAPS[this.currentMapId] || INGAME_ADMIN_MAPS['skeld'];
    const electX = mapDef.lightsElectX || 260;
    const electY = mapDef.lightsElectY || 410;

    ctx.beginPath();
    ctx.arc(electX, electY, 30, 0, Math.PI * 2);
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 3;
    ctx.setLineDash([4, 4]);
    ctx.stroke();

    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 13px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText('💡 配電盤 (停電解除箇所)', electX, electY - 35);
    ctx.restore();
  }
}

window.MapEngine = MapEngine;
