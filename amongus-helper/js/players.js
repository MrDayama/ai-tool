/**
 * Players Manager Module
 * Among Us 15色のプレイヤー管理・カラーコード・ステータス
 */

const PLAYER_COLORS = [
  { id: 'red', name: '赤 (Red)', hex: '#c61111' },
  { id: 'blue', name: '青 (Blue)', hex: '#132ed2' },
  { id: 'green', name: '緑 (Green)', hex: '#117f2d' },
  { id: 'pink', name: 'ピンク (Pink)', hex: '#ed54ba' },
  { id: 'orange', name: 'オレンジ (Orange)', hex: '#f07d0d' },
  { id: 'yellow', name: '黄 (Yellow)', hex: '#f5f557' },
  { id: 'black', name: '黒 (Black)', hex: '#3f474e' },
  { id: 'white', name: '白 (White)', hex: '#d6e0f0' },
  { id: 'purple', name: '紫 (Purple)', hex: '#6b2fbb' },
  { id: 'brown', name: '茶 (Brown)', hex: '#71491e' },
  { id: 'cyan', name: 'シアン (Cyan)', hex: '#38e6dd' },
  { id: 'lime', name: 'ライム (Lime)', hex: '#50ef39' },
  { id: 'maroon', name: 'マルーン (Maroon)', hex: '#6b101c' },
  { id: 'rose', name: 'ローズ (Rose)', hex: '#ecc0d3' },
  { id: 'banana', name: 'バナナ (Banana)', hex: '#fffea0' },
];

const PLAYER_STATUSES = [
  { id: 'alive', label: '生存', class: 'status-alive' },
  { id: 'dead', label: '💀 死亡', class: 'status-dead' },
  { id: 'ejected', label: '🚪 追放', class: 'status-ejected' },
  { id: 'cleared', label: '⚪ 白確', class: 'status-cleared' },
  { id: 'suspect', label: '⚠️ 容疑', class: 'status-suspect' },
];

class PlayerManager {
  constructor() {
    this.players = [];
    this.activePlayerId = null;
    this.initDefaultPlayers();
  }

  initDefaultPlayers() {
    // デフォルトで主要10色を登録
    const defaultColorIds = ['red', 'blue', 'green', 'pink', 'orange', 'yellow', 'black', 'white', 'purple', 'cyan'];
    this.players = defaultColorIds.map(colorId => {
      const colorObj = PLAYER_COLORS.find(c => c.id === colorId);
      return {
        id: colorObj.id,
        name: colorObj.name,
        colorHex: colorObj.hex,
        status: 'alive',
        lastLocation: null, // { x, y, timestamp }
      };
    });
    this.activePlayerId = this.players[0].id;
  }

  getPlayers() {
    return this.players;
  }

  getActivePlayer() {
    return this.players.find(p => p.id === this.activePlayerId) || this.players[0];
  }

  setActivePlayer(colorId) {
    if (this.players.some(p => p.id === colorId)) {
      this.activePlayerId = colorId;
    }
  }

  updatePlayerStatus(colorId, newStatus) {
    const player = this.players.find(p => p.id === colorId);
    if (player) {
      player.status = newStatus;
    }
  }

  updatePlayerName(colorId, newName) {
    const player = this.players.find(p => p.id === colorId);
    if (player) {
      player.name = newName;
    }
  }

  addPlayer(colorId) {
    if (this.players.some(p => p.id === colorId)) return false;
    const colorObj = PLAYER_COLORS.find(c => c.id === colorId);
    if (!colorObj) return false;

    this.players.push({
      id: colorObj.id,
      name: colorObj.name,
      colorHex: colorObj.hex,
      status: 'alive',
      lastLocation: null,
    });
    return true;
  }

  renderPlayerList(containerEl, onSelectCallback, onStatusChangeCallback) {
    containerEl.innerHTML = '';
    this.players.forEach(player => {
      const card = document.createElement('div');
      card.className = `player-card ${player.id === this.activePlayerId ? 'active' : ''}`;
      card.dataset.id = player.id;

      const statusObj = PLAYER_STATUSES.find(s => s.id === player.status) || PLAYER_STATUSES[0];

      card.innerHTML = `
        <div class="player-color-badge" style="background-color: ${player.colorHex};"></div>
        <div class="player-info">
          <div class="player-name-row">
            <span class="player-name">${player.name}</span>
            <span class="player-status-tag ${statusObj.class}">${statusObj.label}</span>
          </div>
        </div>
      `;

      // クリックでアクティブ切り替え
      card.addEventListener('click', (e) => {
        // 右クリックやステータス選択メニュー対応
        this.setActivePlayer(player.id);
        this.renderPlayerList(containerEl, onSelectCallback, onStatusChangeCallback);
        if (onSelectCallback) onSelectCallback(player);
      });

      // コンテキストメニュー (右クリックでステータス変更)
      card.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        const nextStatusIndex = (PLAYER_STATUSES.findIndex(s => s.id === player.status) + 1) % PLAYER_STATUSES.length;
        const nextStatus = PLAYER_STATUSES[nextStatusIndex].id;
        this.updatePlayerStatus(player.id, nextStatus);
        this.renderPlayerList(containerEl, onSelectCallback, onStatusChangeCallback);
        if (onStatusChangeCallback) onStatusChangeCallback(player, nextStatus);
      });

      containerEl.appendChild(card);
    });
  }
}

window.PlayerManager = PlayerManager;
window.PLAYER_COLORS = PLAYER_COLORS;
