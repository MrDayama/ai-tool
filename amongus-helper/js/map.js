/**
 * Map Canvas Engine
 * 全5主要マップ (The Skeld / MIRA HQ / Polus / The Airship / The Fungle) 精密描画エンジン
 */

const MAP_DEFINITIONS = {
  // 1. The Skeld
  skeld: {
    name: 'The Skeld',
    rooms: [
      { id: 'cafeteria', name: 'Cafeteria (カフェテリア)', x: 340, y: 40, w: 220, h: 140 },
      { id: 'weapons', name: 'Weapons (武器庫)', x: 620, y: 60, w: 140, h: 110 },
      { id: 'o2', name: 'O2 (酸素室)', x: 570, y: 200, w: 90, h: 90 },
      { id: 'navigation', name: 'Navigation (ナビゲーション)', x: 700, y: 240, w: 130, h: 140 },
      { id: 'shields', name: 'Shields (シールド)', x: 600, y: 410, w: 140, h: 110 },
      { id: 'communications', name: 'Comms (通信室)', x: 480, y: 460, w: 110, h: 90 },
      { id: 'storage', name: 'Storage (ストレージ)', x: 350, y: 350, w: 180, h: 180 },
      { id: 'admin', name: 'Admin (管理室)', x: 550, y: 310, w: 120, h: 110 },
      { id: 'electrical', name: 'Electrical (電気室)', x: 210, y: 340, w: 120, h: 130 },
      { id: 'lower_engine', name: 'Lower Engine (下部エンジン)', x: 60, y: 410, w: 130, h: 120 },
      { id: 'security', name: 'Security (防犯カメラ室)', x: 140, y: 250, w: 90, h: 90 },
      { id: 'upper_engine', name: 'Upper Engine (上部エンジン)', x: 60, y: 80, w: 130, h: 120 },
      { id: 'reactor', name: 'Reactor (リアクター)', x: 10, y: 210, w: 100, h: 160 },
      { id: 'medbay', name: 'MedBay (医務室)', x: 220, y: 170, w: 110, h: 110 },
    ],
    corridors: [
      { from: {x: 450, y: 180}, to: {x: 450, y: 350} },
      { from: {x: 270, y: 110}, to: {x: 340, y: 110} },
      { from: {x: 560, y: 110}, to: {x: 620, y: 110} },
      { from: {x: 125, y: 200}, to: {x: 125, y: 410} },
      { from: {x: 110, y: 290}, to: {x: 140, y: 290} },
      { from: {x: 230, y: 280}, to: {x: 270, y: 280} },
      { from: {x: 330, y: 400}, to: {x: 350, y: 400} },
      { from: {x: 530, y: 400}, to: {x: 550, y: 370} },
      { from: {x: 670, y: 310}, to: {x: 700, y: 310} },
      { from: {x: 670, y: 170}, to: {x: 700, y: 240} },
      { from: {x: 670, y: 380}, to: {x: 670, y: 410} },
    ],
    vents: [
      { x: 360, y: 160, label: '🌀 Cafe' },
      { x: 560, y: 330, label: '🌀 Admin' },
      { x: 230, y: 450, label: '🌀 Elec' },
      { x: 150, y: 320, label: '🌀 Sec' },
      { x: 230, y: 260, label: '🌀 Med' },
      { x: 70, y: 220, label: '🌀 React-U' },
      { x: 70, y: 350, label: '🌀 React-L' },
      { x: 710, y: 260, label: '🌀 Nav-N' },
      { x: 710, y: 360, label: '🌀 Nav-S' },
      { x: 690, y: 90, label: '🌀 Weapons' },
      { x: 670, y: 490, label: '🌀 Shields' },
    ],
    lightsElectX: 270, lightsElectY: 405
  },

  // 2. MIRA HQ
  mira: {
    name: 'MIRA HQ',
    rooms: [
      { id: 'launchpad', name: 'Launchpad (発射台)', x: 40, y: 440, w: 160, h: 120 },
      { id: 'medbay', name: 'MedBay (医務室)', x: 240, y: 460, w: 120, h: 100 },
      { id: 'comms', name: 'Comms (通信室)', x: 260, y: 330, w: 120, h: 90 },
      { id: 'storage', name: 'Storage (保管庫)', x: 420, y: 420, w: 150, h: 130 },
      { id: 'cafeteria', name: 'Cafeteria (カフェテリア)', x: 620, y: 400, w: 180, h: 140 },
      { id: 'balcony', name: 'Balcony (ベランダ)', x: 740, y: 270, w: 120, h: 90 },
      { id: 'admin', name: 'Admin (管理室)', x: 600, y: 250, w: 110, h: 100 },
      { id: 'office', name: 'Office (オフィス)', x: 420, y: 260, w: 130, h: 110 },
      { id: 'greenhouse', name: 'Greenhouse (温室)', x: 400, y: 40, w: 200, h: 140 },
      { id: 'laboratory', name: 'Laboratory (研究室)', x: 180, y: 160, w: 140, h: 120 },
      { id: 'reactor', name: 'Reactor (リアクター)', x: 40, y: 160, w: 110, h: 120 },
    ],
    corridors: [
      { from: {x: 200, y: 500}, to: {x: 240, y: 500} }, // Launchpad - MedBay
      { from: {x: 360, y: 500}, to: {x: 420, y: 500} }, // MedBay - Storage
      { from: {x: 570, y: 470}, to: {x: 620, y: 470} }, // Storage - Cafeteria
      { from: {x: 485, y: 420}, to: {x: 485, y: 370} }, // Y-Corridor Trunk
      { from: {x: 485, y: 260}, to: {x: 485, y: 180} }, // North Corridor to Greenhouse
      { from: {x: 420, y: 310}, to: {x: 320, y: 220} }, // Corridor West to Lab
      { from: {x: 180, y: 220}, to: {x: 150, y: 220} }, // Lab - Reactor
    ],
    vents: [
      { x: 180, y: 460, label: '🌀 Launchpad' },
      { x: 340, y: 350, label: '🌀 Comms' },
      { x: 540, y: 440, label: '🌀 Storage' },
      { x: 760, y: 420, label: '🌀 Cafe' },
      { x: 800, y: 290, label: '🌀 Balcony' },
      { x: 670, y: 270, label: '🌀 Admin' },
      { x: 500, y: 280, label: '🌀 Office' },
      { x: 500, y: 70, label: '🌀 Greenhouse' },
      { x: 260, y: 180, label: '🌀 Lab' },
      { x: 90, y: 180, label: '🌀 Reactor' },
    ],
    lightsElectX: 485, lightsElectY: 310
  },

  // 3. Polus
  polus: {
    name: 'Polus',
    rooms: [
      { id: 'dropship', name: 'Dropship (ドロップシップ)', x: 380, y: 40, w: 140, h: 100 },
      { id: 'electrical', name: 'Electrical (電気室)', x: 120, y: 360, w: 140, h: 140 },
      { id: 'security', name: 'Security (防犯室)', x: 120, y: 220, w: 110, h: 100 },
      { id: 'o2', name: 'O2 (酸素室)', x: 260, y: 200, w: 120, h: 120 },
      { id: 'communications', name: 'Comms (通信室)', x: 260, y: 360, w: 110, h: 100 },
      { id: 'storage', name: 'Storage (保管庫)', x: 420, y: 240, w: 160, h: 160 },
      { id: 'office', name: 'Office & Admin (オフィス)', x: 620, y: 220, w: 180, h: 140 },
      { id: 'weapons', name: 'Weapons (武器庫)', x: 640, y: 80, w: 140, h: 100 },
      { id: 'laboratory', name: 'Laboratory (研究室/バイタル)', x: 620, y: 400, w: 180, h: 150 },
      { id: 'specimen', name: 'Specimen (標本室)', x: 380, y: 460, w: 160, h: 110 },
    ],
    corridors: [
      { from: {x: 450, y: 140}, to: {x: 450, y: 240} },
      { from: {x: 380, y: 260}, to: {x: 420, y: 260} },
      { from: {x: 580, y: 300}, to: {x: 620, y: 300} },
      { from: {x: 710, y: 180}, to: {x: 710, y: 220} },
      { from: {x: 710, y: 360}, to: {x: 710, y: 400} },
      { from: {x: 460, y: 400}, to: {x: 460, y: 460} },
      { from: {x: 230, y: 320}, to: {x: 230, y: 360} },
      { from: {x: 260, y: 420}, to: {x: 260, y: 420} },
    ],
    vents: [
      { x: 230, y: 380, label: '🌀 Elec' },
      { x: 210, y: 240, label: '🌀 Sec' },
      { x: 350, y: 220, label: '🌀 O2' },
      { x: 550, y: 260, label: '🌀 Storage' },
      { x: 770, y: 240, label: '🌀 Office-N' },
      { x: 640, y: 330, label: '🌀 Office-S' },
      { x: 750, y: 100, label: '🌀 Weapons' },
      { x: 770, y: 420, label: '🌀 Lab' },
      { x: 390, y: 480, label: '🌀 Specimen' },
    ],
    lightsElectX: 190, lightsElectY: 430
  },

  // 4. The Airship
  airship: {
    name: 'The Airship',
    rooms: [
      { id: 'cockpit', name: 'Cockpit (コックピット)', x: 40, y: 220, w: 140, h: 140 },
      { id: 'vault', name: 'Vault (金庫室)', x: 210, y: 60, w: 140, h: 120 },
      { id: 'engine', name: 'Engine Room (エンジン室)', x: 210, y: 400, w: 160, h: 140 },
      { id: 'brig', name: 'Brig (牢屋/監視)', x: 210, y: 220, w: 130, h: 140 },
      { id: 'gap_room', name: 'Gap Room (昇降機/展望)', x: 380, y: 180, w: 140, h: 140 },
      { id: 'main_hall', name: 'Main Hall (メインホール)', x: 390, y: 360, w: 160, h: 170 },
      { id: 'kitchen', name: 'Kitchen (厨房)', x: 580, y: 420, w: 130, h: 110 },
      { id: 'medical', name: 'Medical (医務室)', x: 580, y: 280, w: 120, h: 110 },
      { id: 'records', name: 'Records (アーカイブ)', x: 560, y: 100, w: 150, h: 140 },
      { id: 'meeting', name: 'Meeting Room (会議室)', x: 740, y: 120, w: 140, h: 140 },
      { id: 'cargo', name: 'Cargo Bay (貨物室)', x: 730, y: 360, w: 150, h: 160 },
    ],
    corridors: [
      { from: {x: 180, y: 290}, to: {x: 210, y: 290} },
      { from: {x: 280, y: 180}, to: {x: 280, y: 220} },
      { from: {x: 340, y: 280}, to: {x: 380, y: 280} },
      { from: {x: 520, y: 250}, to: {x: 560, y: 220} },
      { from: {x: 550, y: 440}, to: {x: 580, y: 440} },
      { from: {x: 710, y: 180}, to: {x: 740, y: 180} },
    ],
    vents: [
      { x: 320, y: 80, label: '🌀 Vault' },
      { x: 310, y: 240, label: '🌀 Brig' },
      { x: 490, y: 200, label: '🌀 Gap Room' },
      { x: 520, y: 400, label: '🌀 Main Hall' },
      { x: 680, y: 120, label: '🌀 Records' },
      { x: 850, y: 380, label: '🌀 Cargo' },
    ],
    lightsElectX: 470, lightsElectY: 440
  },

  // 5. The Fungle
  fungle: {
    name: 'The Fungle',
    rooms: [
      { id: 'lookout', name: 'Lookout (展望台)', x: 380, y: 40, w: 140, h: 100 },
      { id: 'kitchen', name: 'Kitchen (キッチン)', x: 580, y: 100, w: 140, h: 120 },
      { id: 'beach', name: 'Beach (ビーチ)', x: 740, y: 240, w: 140, h: 160 },
      { id: 'comms', name: 'Comms (通信施設)', x: 560, y: 260, w: 130, h: 120 },
      { id: 'greenhouse', name: 'Greenhouse (農園)', x: 370, y: 220, w: 150, h: 140 },
      { id: 'reactor', name: 'Generator (発電所)', x: 180, y: 180, w: 130, h: 130 },
      { id: 'mining', name: 'Mining Pit (鉱山)', x: 60, y: 240, w: 100, h: 180 },
      { id: 'laboratory', name: 'Lab (実験室)', x: 220, y: 380, w: 150, h: 140 },
      { id: 'camp', name: 'Campfire (キャンプ広場)', x: 420, y: 400, w: 180, h: 150 },
    ],
    corridors: [
      { from: {x: 450, y: 140}, to: {x: 450, y: 220} },
      { from: {x: 520, y: 160}, to: {x: 580, y: 160} },
      { from: {x: 320, y: 260}, to: {x: 370, y: 260} },
      { from: {x: 520, y: 290}, to: {x: 560, y: 290} },
      { from: {x: 690, y: 320}, to: {x: 740, y: 320} },
      { from: {x: 510, y: 360}, to: {x: 510, y: 400} },
      { from: {x: 370, y: 450}, to: {x: 420, y: 450} },
    ],
    vents: [
      { x: 490, y: 70, label: '🌀 Lookout' },
      { x: 690, y: 120, label: '🌀 Kitchen' },
      { x: 840, y: 270, label: '🌀 Beach' },
      { x: 660, y: 280, label: '🌀 Comms' },
      { x: 280, y: 200, label: '🌀 Generator' },
      { x: 340, y: 410, label: '🌀 Lab' },
    ],
    lightsElectX: 450, lightsElectY: 90
  }
};

class MapEngine {
  constructor(canvasEl, wrapperEl) {
    this.canvas = canvasEl;
    this.ctx = canvasEl.getContext('2d');
    this.wrapper = wrapperEl;

    this.currentMapId = 'skeld';
    this.currentTool = 'pen';
    this.activePlayerHex = '#c61111';

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
    this.canvas.width = 900;
    this.canvas.height = 600;
    this.render();
  }

  setMap(mapId) {
    if (MAP_DEFINITIONS[mapId]) {
      this.currentMapId = mapId;
      this.render();
    }
  }

  setTool(toolId) {
    this.currentTool = toolId;
  }

  setActivePlayerColor(colorHex) {
    this.activePlayerHex = colorHex;
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
    } else if (this.currentTool.startsWith('pin-')) {
      const pinType = this.currentTool.replace('pin-', '');
      this.addPin(pt, pinType, this.activePlayerHex);
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
      this.drawPath(this.currentPath, this.activePlayerHex, 4);
    } else if (this.currentTool === 'line' || this.currentTool === 'arrow') {
      this.render();
      if (this.currentTool === 'line') {
        this.drawLine(this.startPoint, pt, this.activePlayerHex, 3);
      } else {
        this.drawArrow(this.startPoint, pt, this.activePlayerHex, 3);
      }
    }
  }

  handleMouseUp(e) {
    if (!this.isDrawing) return;
    this.isDrawing = false;
    if (!e) return;

    const pt = this.getCanvasPoint(e);

    if (this.currentTool === 'pen' && this.currentPath.length > 1) {
      this.drawings.push({
        type: 'path',
        points: [...this.currentPath],
        colorHex: this.activePlayerHex,
        width: 4
      });
    } else if (this.currentTool === 'line') {
      this.drawings.push({
        type: 'line',
        start: this.startPoint,
        end: pt,
        colorHex: this.activePlayerHex,
        width: 3
      });
    } else if (this.currentTool === 'arrow') {
      this.drawings.push({
        type: 'arrow',
        start: this.startPoint,
        end: pt,
        colorHex: this.activePlayerHex,
        width: 3
      });
    }

    this.currentPath = [];
    this.startPoint = null;
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

    // 1. マップ背景の精密描画
    this.drawMapBackground();

    // 2. ユーザーの描画線
    this.drawings.forEach(d => {
      if (d.type === 'path') this.drawPath(d.points, d.colorHex, d.width);
      else if (d.type === 'line') this.drawLine(d.start, d.end, d.colorHex, d.width);
      else if (d.type === 'arrow') this.drawArrow(d.start, d.end, d.colorHex, d.width);
    });

    // 3. 移動可能半径サークル
    if (this.showRadiusOverlay && this.radiusCenter && this.radiusPx > 0) {
      this.drawRadiusCircle(this.radiusCenter, this.radiusPx);
    }

    // 4. ピン描画
    this.pins.forEach(pin => this.drawPin(pin));

    // 5. サボタージュ視界・配電盤マーク (停電時)
    if (window.sabotageManager && window.sabotageManager.isLightsOutActive()) {
      this.drawLightsOutVisionOverlay();
    }
  }

  drawMapBackground() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    // 背景描画
    ctx.fillStyle = '#0b0f19';
    ctx.fillRect(0, 0, w, h);

    // 星空/背景装飾
    ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
    for (let i = 0; i < 40; i++) {
      const sx = (i * 47) % w;
      const sy = (i * 83) % h;
      ctx.fillRect(sx, sy, 2, 2);
    }

    const mapDef = MAP_DEFINITIONS[this.currentMapId] || MAP_DEFINITIONS['skeld'];

    // 廊下（Corridor）描画
    if (mapDef.corridors) {
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 24;
      ctx.lineCap = 'round';
      mapDef.corridors.forEach(c => {
        ctx.beginPath();
        ctx.moveTo(c.from.x, c.from.y);
        ctx.lineTo(c.to.x, c.to.y);
        ctx.stroke();
      });

      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      mapDef.corridors.forEach(c => {
        ctx.beginPath();
        ctx.moveTo(c.from.x, c.from.y);
        ctx.lineTo(c.to.x, c.to.y);
        ctx.stroke();
      });
    }

    // 各部屋（Room）描画
    mapDef.rooms.forEach(room => {
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(room.x, room.y, room.w, room.h);

      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.strokeRect(room.x, room.y, room.w, room.h);

      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 12px system-ui';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(room.name, room.x + room.w / 2, room.y + room.h / 2);
    });

    // 特定のランドマーク
    if (this.currentMapId === 'skeld') {
      const cafe = mapDef.rooms.find(r => r.id === 'cafeteria');
      if (cafe) {
        const cx = cafe.x + cafe.w / 2;
        const cy = cafe.y + cafe.h / 2 + 10;
        ctx.beginPath(); ctx.arc(cx, cy, 20, 0, Math.PI * 2);
        ctx.fillStyle = '#475569'; ctx.fill(); ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 2; ctx.stroke();
        ctx.beginPath(); ctx.arc(cx, cy, 8, 0, Math.PI * 2);
        ctx.fillStyle = '#ef4444'; ctx.fill();
        ctx.fillStyle = '#fff'; ctx.font = 'bold 9px system-ui';
        ctx.fillText('EMERGENCY', cx, cy - 14);
      }
    }

    // ベント（Vent 🌀）描画
    if (mapDef.vents) {
      mapDef.vents.forEach(v => {
        ctx.beginPath();
        ctx.arc(v.x, v.y, 8, 0, Math.PI * 2);
        ctx.fillStyle = '#f59e0b';
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.fillStyle = '#fbbf24';
        ctx.font = '10px system-ui';
        ctx.textAlign = 'center';
        ctx.fillText(v.label, v.x, v.y - 12);
      });
    }

    // マップタイトル表示
    ctx.fillStyle = 'rgba(56, 189, 248, 0.4)';
    ctx.font = 'bold 16px system-ui';
    ctx.textAlign = 'right';
    ctx.fillText(`MAP: ${mapDef.name.toUpperCase()}`, w - 15, 25);
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
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.fillRect(0, 0, w, h);

    const mapDef = MAP_DEFINITIONS[this.currentMapId] || MAP_DEFINITIONS['skeld'];
    const electX = mapDef.lightsElectX || 270;
    const electY = mapDef.lightsElectY || 405;

    ctx.beginPath();
    ctx.arc(electX, electY, 28, 0, Math.PI * 2);
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
