/**
 * Map Canvas Engine
 * 本物・高画質のマップ画像 (The Skeld / MIRA HQ / Polus / Airship / Fungle) リアルタイムレンダリングエンジン
 */

const MAP_IMAGE_URLS = {
  skeld: 'https://raw.githubusercontent.com/oskarkraak/Among-Us-Maps/main/maps/skeld.png',
  mira: 'https://raw.githubusercontent.com/oskarkraak/Among-Us-Maps/main/maps/mira.png',
  polus: 'https://raw.githubusercontent.com/oskarkraak/Among-Us-Maps/main/maps/polus.png',
  airship: 'https://raw.githubusercontent.com/oskarkraak/Among-Us-Maps/main/maps/airship.png',
  fungle: 'https://raw.githubusercontent.com/oskarkraak/Among-Us-Maps/main/maps/fungle.png',
};

// サボタージュ配電盤の正確な座標 (%相対位置: xPercent, yPercent)
const SABOTAGE_COORDINATES = {
  skeld: { lights: { xPct: 30, yPct: 67, name: '電気室 (Electrical)' } },
  mira: { lights: { xPct: 54, yPct: 52, name: 'オフィス (Office)' } },
  polus: { lights: { xPct: 21, yPct: 72, name: '電気室 (Electrical)' } },
  airship: { lights: { xPct: 48, yPct: 62, name: '電気室 (Electrical)' } },
  fungle: { lights: { xPct: 50, yPct: 15, name: '展望台 (Lookout)' } },
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

    // 画像キャッシュ管理
    this.loadedImages = {};
    this.isLoadingImage = false;

    this.initCanvasSize();
    this.preloadMapImages();
    this.bindEvents();
  }

  initCanvasSize() {
    this.canvas.width = 960;
    this.canvas.height = 640;
    this.render();
  }

  preloadMapImages() {
    Object.keys(MAP_IMAGE_URLS).forEach(mapId => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = MAP_IMAGE_URLS[mapId];
      img.onload = () => {
        this.loadedImages[mapId] = img;
        if (mapId === this.currentMapId) {
          this.render();
        }
      };
      img.onerror = () => {
        console.warn(`Failed to load high-res image for ${mapId}, falling back to vector layout.`);
      };
    });
  }

  setMap(mapId) {
    this.currentMapId = mapId;
    this.render();
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

    // 1. 本物の高品質背景画像を描画
    this.drawMapBackgroundImage();

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

    // 4. ピン描画
    this.pins.forEach(pin => this.drawPin(pin));

    // 5. サボタージュ視界・配電盤マーク (停電時)
    if (window.sabotageManager && window.sabotageManager.isLightsOutActive()) {
      this.drawLightsOutVisionOverlay();
    }
  }

  drawMapBackgroundImage() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    // 暗い宇宙背景
    ctx.fillStyle = '#0b0f19';
    ctx.fillRect(0, 0, w, h);

    const img = this.loadedImages[this.currentMapId];

    if (img && img.complete && img.naturalWidth !== 0) {
      // アスペクト比を維持して中央配置
      const imgRatio = img.naturalWidth / img.naturalHeight;
      const canvasRatio = w / h;
      let renderW = w;
      let renderH = h;
      let renderX = 0;
      let renderY = 0;

      if (imgRatio > canvasRatio) {
        renderH = w / imgRatio;
        renderY = (h - renderH) / 2;
      } else {
        renderW = h * imgRatio;
        renderX = (w - renderW) / 2;
      }

      ctx.drawImage(img, renderX, renderY, renderW, renderH);
    } else {
      // ロード中プレースホルダー
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(50, 50, w - 100, h - 100);
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.strokeRect(50, 50, w - 100, h - 100);

      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 20px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText(`Loading High-Res Official Map [${this.currentMapId.toUpperCase()}]...`, w / 2, h / 2);
    }

    // 右上マップ名ラベル
    ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
    ctx.fillRect(w - 180, 10, 170, 30);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1;
    ctx.strokeRect(w - 180, 10, 170, 30);

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 14px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText(`MAP: ${this.currentMapId.toUpperCase()}`, w - 95, 30);
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
