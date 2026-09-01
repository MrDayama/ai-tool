/**
 * Map Canvas Engine
 * 公式日本語・英語併記の精密見取り図マップ (The Skeld / MIRA HQ / Polus / Airship / Fungle) レンダリングエンジン
 */

// ローカルに完全に配置された公式日本語表記入り実物高画質マップ画像
const MAP_IMAGE_PATHS = {
  skeld: 'assets/maps/skeld.png',
  mira: 'assets/maps/mira.png',
  polus: 'assets/maps/polus.png',
  airship: 'assets/maps/airship.png',
  fungle: 'assets/maps/fungle.png',
};

// マップの公式表示名（英語名＋日本語名）
const MAP_DISPLAY_NAMES = {
  skeld: 'The Skeld (スケルド)',
  mira: 'MIRA HQ (ミラHQ)',
  polus: 'Polus (ポーラス)',
  airship: 'The Airship (エアシップ / 飛行船)',
  fungle: 'The Fungle (ファングル)',
};

// 各マップにおける停電サボタージュ配電盤の正確な相対座標 (%: xPct, yPct)
const SABOTAGE_COORDINATES = {
  skeld: { lights: { xPct: 35, yPct: 58, name: '電気室 (Electrical)' } },
  mira: { lights: { xPct: 62, yPct: 50, name: 'オフィス (Office)' } },
  polus: { lights: { xPct: 40, yPct: 20, name: '電気室 (Electrical)' } },
  airship: { lights: { xPct: 50, yPct: 78, name: '電気室 (Electrical)' } },
  fungle: { lights: { xPct: 62, yPct: 78, name: '発電機 (Generator)' } },
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

    // ローカル高画質マップ画像キャッシュ
    this.loadedImages = {};
    this.initCanvasSize();
    this.loadLocalMapImages();
    this.bindEvents();
  }

  initCanvasSize() {
    this.canvas.width = 960;
    this.canvas.height = 540; // 16:9 アスペクト比に適合
    this.render();
  }

  loadLocalMapImages() {
    Object.keys(MAP_IMAGE_PATHS).forEach(mapId => {
      const img = new Image();
      img.src = MAP_IMAGE_PATHS[mapId];
      img.onload = () => {
        this.loadedImages[mapId] = img;
        if (mapId === this.currentMapId) {
          this.render();
        }
      };
    });
  }

  setMap(mapId) {
    if (MAP_IMAGE_PATHS[mapId]) {
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

    // 1. 公式日本語表記入り実物見取り図マップの背景描画
    this.drawRealBlueprintMapImage();

    // 2. ユーザー描画線
    this.drawings.forEach(d => {
      if (d.type === 'path') this.drawPath(d.points, d.colorHex, d.width);
      else if (d.type === 'line') this.drawLine(d.start, d.end, d.colorHex, d.width);
      else if (d.type === 'arrow') this.drawArrow(d.start, d.end, d.colorHex, d.width);
    });

    // 3. 移動可能半径サークル
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

  drawRealBlueprintMapImage() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    // 暗い宇宙背景
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, w, h);

    const img = this.loadedImages[this.currentMapId];

    if (img && img.complete && img.naturalWidth !== 0) {
      ctx.drawImage(img, 0, 0, w, h);
    } else {
      // 読み込み待ち状態の表示
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(20, 20, w - 40, h - 40);
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 18px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText(`MAP: [${this.currentMapId.toUpperCase()}] 高解像度見取り図マップ読み込み中...`, w / 2, h / 2);
    }

    // マップ名ラベルヘッダー（公式日本語表示）
    const mapNameText = MAP_DISPLAY_NAMES[this.currentMapId] || this.currentMapId.toUpperCase();
    ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
    ctx.fillRect(w - 290, 10, 280, 34);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(w - 290, 10, 280, 34);

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 13px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText(`MAP: ${mapNameText}`, w - 150, 32);
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

    const coord = SABOTAGE_COORDINATES[this.currentMapId] || SABOTAGE_COORDINATES['skeld'];
    const lights = coord.lights;
    const electX = (w * lights.xPct) / 100;
    const electY = (h * lights.yPct) / 100;

    ctx.beginPath();
    ctx.arc(electX, electY, 32, 0, Math.PI * 2);
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 3;
    ctx.setLineDash([4, 4]);
    ctx.stroke();

    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 14px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText(`💡 配電盤 (${lights.name})`, electX, electY - 40);
    ctx.restore();
  }
}

window.MapEngine = MapEngine;
