/**
 * Main Application Orchestrator
 * タイマー制御, イベントログ, localStorage自動保存・復元, 全体イベント連携
 */

document.addEventListener('DOMContentLoaded', () => {
  // モジュールインスタンスの初期化
  const playerManager = new window.PlayerManager();
  const sabotageManager = new window.SabotageManager();
  
  const canvasEl = document.getElementById('mapCanvas');
  const canvasWrapper = document.getElementById('canvasWrapper');
  const mapEngine = new window.MapEngine(canvasEl, canvasWrapper);

  // グローバル参照
  window.sabotageManager = sabotageManager;

  // ラウンドタイマー状態
  let timerInterval = null;
  let elapsedSeconds = 0;
  let isTimerRunning = false;

  // DOMエレメントの参照
  const timerDisplay = document.getElementById('timerDisplay');
  const btnTimerStart = document.getElementById('btnTimerStart');
  const btnTimerReset = document.getElementById('btnTimerReset');
  const labelTimerStart = document.getElementById('labelTimerStart');
  const iconTimerPlay = document.getElementById('iconTimerPlay');
  const speedSelect = document.getElementById('speedSelect');
  const playerListEl = document.getElementById('playerList');
  const mapSelect = document.getElementById('mapSelect');
  const eventLogList = document.getElementById('eventLogList');
  const deductionText = document.getElementById('deductionText');
  const activePlayerName = document.getElementById('activePlayerName');
  const btnClearCanvas = document.getElementById('btnClearCanvas');
  const btnClearLog = document.getElementById('btnClearLog');
  const btnSaveData = document.getElementById('btnSaveData');
  const btnClearAll = document.getElementById('btnClearAll');
  const btnAddPlayer = document.getElementById('btnAddPlayer');

  // --- 1. プレイヤーUIレンダリング ---
  function updatePlayerUI() {
    playerManager.renderPlayerList(
      playerListEl,
      (player) => {
        // アクティブプレイヤー切り替え時
        mapEngine.setActivePlayer(player);
        mapEngine.setActivePlayerColor(player.colorHex);
        activePlayerName.textContent = player.name;
        activePlayerName.style.color = player.colorHex;
      },
      (player, newStatus) => {
        // ステータス変更ログ追加
        addEventLog(`[${formatTime(elapsedSeconds)}] ${player.name} の状態: ${newStatus.toUpperCase()}`);
      }
    );

    const activePlayer = playerManager.getActivePlayer();
    if (activePlayer) {
      mapEngine.setActivePlayer(activePlayer);
      mapEngine.setActivePlayerColor(activePlayer.colorHex);
      activePlayerName.textContent = activePlayer.name;
      activePlayerName.style.color = activePlayer.colorHex;
    }
  }

  // --- 2. タイマー制御 ---
  function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  function startTimer() {
    if (isTimerRunning) return;
    isTimerRunning = true;
    labelTimerStart.textContent = '停止';
    btnTimerStart.classList.replace('btn-success', 'btn-danger');
    
    timerInterval = setInterval(() => {
      elapsedSeconds++;
      timerDisplay.textContent = formatTime(elapsedSeconds);

      // 到達可能半径が有効なら毎秒描画更新
      if (mapEngine.showRadiusOverlay && mapEngine.radiusCenter) {
        const speedMultiplier = parseFloat(speedSelect.value) || 1.5;
        mapEngine.setRadiusCircle(mapEngine.radiusCenter, speedMultiplier, elapsedSeconds);
      }
    }, 1000);
  }

  function stopTimer() {
    if (!isTimerRunning) return;
    isTimerRunning = false;
    labelTimerStart.textContent = '開始';
    btnTimerStart.classList.replace('btn-danger', 'btn-success');
    clearInterval(timerInterval);
  }

  function resetTimer() {
    stopTimer();
    elapsedSeconds = 0;
    timerDisplay.textContent = '00:00';
    addEventLog(`[00:00] 🔄 ラウンドタイマーをリセットしました。`);
  }

  btnTimerStart.addEventListener('click', () => {
    if (isTimerRunning) {
      stopTimer();
      addEventLog(`[${formatTime(elapsedSeconds)}] ⏹️ タイマー停止 (会議/ボタン)`);
    } else {
      startTimer();
      addEventLog(`[${formatTime(elapsedSeconds)}] ▶️ ラウンド開始 / タイマースタート`);
    }
  });

  btnTimerReset.addEventListener('click', resetTimer);

  // --- 3. サボタージュボタン連携 ---
  document.querySelectorAll('.btn-sabotage').forEach(btn => {
    btn.addEventListener('click', () => {
      const sabotageType = btn.dataset.sabotage;
      const currentMap = mapSelect.value;
      const record = sabotageManager.triggerSabotage(sabotageType, currentMap, elapsedSeconds);
      
      if (record) {
        addEventLog(`[${formatTime(elapsedSeconds)}] 🚨 サボタージュ発生: ${record.name} (${record.location.name})`, true);
        mapEngine.render();
      }
    });
  });

  // --- 4. ツールバー切り替え ---
  document.querySelectorAll('.tool-btn[data-tool]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tool-btn[data-tool]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const toolId = btn.dataset.tool;
      mapEngine.setTool(toolId);
    });
  });

  mapSelect.addEventListener('change', (e) => {
    mapEngine.setMap(e.target.value);
    addEventLog(`マップを [${e.target.value.toUpperCase()}] に変更しました。`);
  });

  btnClearCanvas.addEventListener('click', () => {
    mapEngine.clearDrawings();
    addEventLog(`[${formatTime(elapsedSeconds)}] 🧹 マップ描画をクリアしました。`);
  });

  // --- 5. ログ追加・管理 ---
  function addEventLog(message, isSabotage = false) {
    if (eventLogList.querySelector('.log-empty')) {
      eventLogList.innerHTML = '';
    }
    const item = document.createElement('div');
    item.className = `log-item ${isSabotage ? 'log-sabotage' : ''}`;
    item.innerHTML = `<span>${message}</span>`;
    eventLogList.prepend(item);
  }

  btnClearLog.addEventListener('click', () => {
    eventLogList.innerHTML = '<div class="log-empty">ログはありません。ラウンドを開始してください。</div>';
    sabotageManager.clearHistory();
  });

  // --- 6. プレイヤー追加モーダル簡易処理 ---
  btnAddPlayer.addEventListener('click', () => {
    const unusedColor = window.PLAYER_COLORS.find(c => !playerManager.getPlayers().some(p => p.id === c.id));
    if (unusedColor) {
      playerManager.addPlayer(unusedColor.id);
      updatePlayerUI();
      addEventLog(`プレイヤー [${unusedColor.name}] を追加しました。`);
    } else {
      alert('これ以上プレイヤーを追加できません (最大15色)');
    }
  });

  // --- 7. ローカルストレージ保存・復元 ---
  function saveData() {
    const data = {
      players: playerManager.getPlayers(),
      memo: deductionText.value,
      mapId: mapSelect.value,
      speed: speedSelect.value,
    };
    localStorage.setItem('au_tactical_helper_data', JSON.stringify(data));
    alert('データをブラウザに保存しました！');
  }

  function loadData() {
    const raw = localStorage.getItem('au_tactical_helper_data');
    if (!raw) return;
    try {
      const data = JSON.parse(raw);
      if (data.memo) deductionText.value = data.memo;
      if (data.mapId) {
        mapSelect.value = data.mapId;
        mapEngine.setMap(data.mapId);
      }
      if (data.speed) speedSelect.value = data.speed;
    } catch (e) {
      console.error('Failed to load local data', e);
    }
  }

  btnSaveData.addEventListener('click', saveData);

  btnClearAll.addEventListener('click', () => {
    if (confirm('すべてのデータとログをクリアして初期状態に戻しますか？')) {
      localStorage.removeItem('au_tactical_helper_data');
      location.reload();
    }
  });

  // 初期読み込み実行
  loadData();
  updatePlayerUI();
});
