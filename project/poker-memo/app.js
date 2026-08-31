/**
 * Poker Memo Web Tool - app.js
 * フェーズ1: ライブアクションテーブル & ハンドリプレイ
 *
 * Step 1: データ構造 & 状態管理
 * Step 2: NLHポーカーエンジン (HU判定, Min-Raise, Side Pot自動分割)
 * Step 4: アクション録画 & IndexedDB
 */

// ===================================================
// 定数定義
// ===================================================
const STREETS = ['preflop', 'flop', 'turn', 'river', 'showdown'];
const POSITIONS_BY_COUNT = {
  2:  ['BTN/SB', 'BB'],
  3:  ['BTN', 'SB', 'BB'],
  4:  ['BTN', 'SB', 'BB', 'UTG'],
  5:  ['BTN', 'SB', 'BB', 'UTG', 'CO'],
  6:  ['BTN', 'SB', 'BB', 'UTG', 'MP', 'CO'],
  7:  ['BTN', 'SB', 'BB', 'UTG', 'UTG+1', 'MP', 'CO'],
  8:  ['BTN', 'SB', 'BB', 'UTG', 'UTG+1', 'MP', 'HJ', 'CO'],
  9:  ['BTN', 'SB', 'BB', 'UTG', 'UTG+1', 'UTG+2', 'MP', 'HJ', 'CO'],
};

const PRESET_RATES = [
  { label: '0.5/1', sb: 0.5, bb: 1 },
  { label: '1/2',   sb: 1,   bb: 2 },
  { label: '2/5',   sb: 2,   bb: 5 },
  { label: '5/10',  sb: 5,   bb: 10 },
  { label: '10/20', sb: 10,  bb: 20 },
  { label: '25/50', sb: 25,  bb: 50 },
];

// ===================================================
// Step 1: データ構造
// ===================================================

/** @typedef {{ id: number, name: string, stack: number, betAmount: number,
 *   action: string|null, isAway: boolean, isFolded: boolean, isAllIn: boolean,
 *   holeCards: string[] }} SeatState */

/** @typedef {{ sb: number, bb: number, anteType: 'none'|'regular'|'bb',
 *   anteAmount: number, straddle: boolean, displayUnit: 'cash'|'bb' }} BlindState */

/** @typedef {{ main: number, sides: {amount:number, eligibleSeats:number[]}[] }} PotState */

/** @typedef {{ street: string, actionIndex: number, seats: SeatState[],
 *   board: string[], pot: PotState, currentSeat: number }} GameState */

// ===================================================
// Step 1: ゲームステート初期化
// ===================================================

const AppState = {
  seatCount: 6,
  dealerSeat: 0,   // BTN座席インデックス (0-based)

  blind: /** @type {BlindState} */ ({
    sb: 1, bb: 2, anteType: 'bb', anteAmount: 2,
    straddle: false, displayUnit: 'bb',
  }),

  seats: /** @type {SeatState[]} */ ([]),
  board: ['', '', '', '', ''],   // Flop1, Flop2, Flop3, Turn, River
  pot: /** @type {PotState} */ ({ main: 0, sides: [] }),
  street: 'preflop',
  currentSeatIndex: 0,           // アクション中の座席インデックス
  minRaise: 0,                   // 最小レイズ額 (現在ストリート)
  lastRaiseDelta: 0,             // 直前の上げ幅

  // リプレイ録画
  history: [],     // { street, seatIndex, action, amount, potSnapshot }[]
  replayIndex: 0,
};

/**
 * 座席を初期化（seatCount に合わせて再生成）
 */
function initSeats() {
  const defaultStack = AppState.blind.bb * 100;
  AppState.seats = Array.from({ length: AppState.seatCount }, (_, i) => ({
    id: i,
    name: `Seat ${i + 1}`,
    stack: defaultStack,
    betAmount: 0,
    action: null,
    isAway: false,
    isFolded: false,
    isAllIn: false,
    holeCards: [],
  }));
}

// ===================================================
// Step 2: NLHポーカーエンジン
// ===================================================

/**
 * アクティブ座席インデックス配列を取得（離席・フォルド・オールイン除外）
 * @param {boolean} includeAllIn - All-inも含める場合 true
 */
function getActiveSeats(includeAllIn = false) {
  return AppState.seats
    .map((s, i) => ({ s, i }))
    .filter(({ s }) => !s.isAway && !s.isFolded && (includeAllIn || !s.isAllIn))
    .map(({ i }) => i);
}

/**
 * ヘッズアップ判定
 */
function isHeadsUp() {
  return AppState.seatCount === 2;
}

/**
 * ポジション名を取得
 */
function getPositionName(seatIndex) {
  const positions = POSITIONS_BY_COUNT[AppState.seatCount] || [];
  // ディーラーからの相対インデックスでポジション割り当て
  const relIndex = (seatIndex - AppState.dealerSeat + AppState.seatCount) % AppState.seatCount;
  return positions[relIndex] || `Seat ${seatIndex + 1}`;
}

/**
 * SB/BB座席インデックスを取得
 */
function getSBIndex() {
  if (isHeadsUp()) return AppState.dealerSeat; // HU: BTN = SB
  return (AppState.dealerSeat + 1) % AppState.seatCount;
}
function getBBIndex() {
  return (AppState.dealerSeat + 2) % AppState.seatCount;
}

/**
 * プリフロップ最初のアクション座席を取得
 * HU: BTN(SB)先, 通常: UTG先
 */
function getPreflopFirstSeat() {
  if (isHeadsUp()) return AppState.dealerSeat;
  return (AppState.dealerSeat + 3) % AppState.seatCount;
}

/**
 * ポストフロップ最初のアクション座席を取得
 * HU: BB先, 通常: SB先
 */
function getPostflopFirstSeat() {
  if (isHeadsUp()) return getBBIndex();
  return getSBIndex();
}

/**
 * 次のアクション座席インデックスを取得（離席・フォルド・オールインをスキップ）
 */
function getNextActiveSeat(fromIndex) {
  for (let i = 1; i <= AppState.seatCount; i++) {
    const idx = (fromIndex + i) % AppState.seatCount;
    const s = AppState.seats[idx];
    if (!s.isAway && !s.isFolded && !s.isAllIn) return idx;
  }
  return -1; // 全員フォルドorオールイン
}

/**
 * Min-Raise額を計算して AppState に反映
 * @param {number} callAmount - コール額
 * @param {number} raiseDelta - 前の上げ幅
 */
function updateMinRaise(callAmount, raiseDelta) {
  AppState.lastRaiseDelta = raiseDelta;
  AppState.minRaise = callAmount + Math.max(raiseDelta, AppState.blind.bb);
}

// ===================================================
// Step 2: サイドポット自動分割
// ===================================================

/**
 * オールイン発生時にサイドポットを再計算
 * @param {{ seatIndex: number, totalBet: number }[]} contributions - 各座席の総投入額
 */
function recalcPots(contributions) {
  // 投入額の昇順でソート
  const sorted = [...contributions].sort((a, b) => a.totalBet - b.totalBet);
  let pots = [];
  let prev = 0;

  for (let i = 0; i < sorted.length; i++) {
    const cap = sorted[i].totalBet;
    if (cap <= prev) continue;
    const level = cap - prev;
    const eligible = contributions.filter(c => c.totalBet >= cap).map(c => c.seatIndex);
    const amount = level * eligible.length;
    if (i === 0) {
      AppState.pot.main = amount;
    } else {
      pots.push({ amount, eligibleSeats: eligible });
    }
    prev = cap;
  }
  AppState.pot.sides = pots;
  renderPot();
}

/**
 * チョップ（スプリットポット）処理
 * @param {number[]} winnerSeats - 勝者座席インデックス配列
 * @param {number} potAmount - 分配するポット額
 */
function splitPot(winnerSeats, potAmount) {
  if (winnerSeats.length === 0) return;
  const base = Math.floor(potAmount / winnerSeats.length);
  const remainder = potAmount % winnerSeats.length;
  // 端数チップはSBに最も近い座席に付与
  const sbIdx = getSBIndex();
  const closestToSB = [...winnerSeats].sort((a, b) => {
    const da = (a - sbIdx + AppState.seatCount) % AppState.seatCount;
    const db = (b - sbIdx + AppState.seatCount) % AppState.seatCount;
    return da - db;
  });
  winnerSeats.forEach(idx => {
    AppState.seats[idx].stack += base;
  });
  if (remainder > 0) {
    AppState.seats[closestToSB[0]].stack += remainder;
  }
}

// ===================================================
// Step 2: ハンド開始処理（ブラインド投入）
// ===================================================

function startNewHand() {
  // フォルド・ベット状態リセット
  AppState.seats.forEach(s => {
    s.betAmount = 0;
    s.action = null;
    s.isFolded = false;
    s.isAllIn = false;
    s.holeCards = [];
  });
  AppState.board = ['', '', '', '', ''];
  AppState.pot = { main: 0, sides: [] };
  AppState.street = 'preflop';
  AppState.history = [];
  AppState.replayIndex = 0;

  const { sb, bb, anteType, anteAmount } = AppState.blind;
  const sbIdx = getSBIndex();
  const bbIdx = getBBIndex();

  // BBアンティ処理
  if (anteType === 'bb') {
    const totalAnte = anteAmount * AppState.seatCount;
    AppState.seats[bbIdx].stack -= totalAnte;
    AppState.seats[bbIdx].betAmount += totalAnte;
    AppState.pot.main += totalAnte;
  } else if (anteType === 'regular') {
    AppState.seats.forEach(s => {
      if (!s.isAway) {
        s.stack -= anteAmount;
        s.betAmount += anteAmount;
        AppState.pot.main += anteAmount;
      }
    });
  }

  // SB / BB
  bet(sbIdx, sb);
  bet(bbIdx, bb);

  // Min-Raiseの初期値
  updateMinRaise(bb, bb);

  // 最初のアクション席
  AppState.currentSeatIndex = getPreflopFirstSeat();
  renderAll();
}

/**
 * ベット処理（スタックから差し引き）
 * @param {number} seatIndex
 * @param {number} amount
 */
function bet(seatIndex, amount) {
  const seat = AppState.seats[seatIndex];
  const actual = Math.min(amount, seat.stack);
  seat.stack -= actual;
  seat.betAmount += actual;
  AppState.pot.main += actual;
  if (seat.stack === 0) seat.isAllIn = true;
}

// ===================================================
// Step 2: アクション処理
// ===================================================

function actionFold() {
  const idx = AppState.currentSeatIndex;
  recordHistory(idx, 'fold', 0);
  AppState.seats[idx].isFolded = true;
  AppState.seats[idx].action = 'fold';
  advanceAction();
}

function actionCheck() {
  const idx = AppState.currentSeatIndex;
  recordHistory(idx, 'check', 0);
  AppState.seats[idx].action = 'check';
  advanceAction();
}

function actionCall() {
  const idx = AppState.currentSeatIndex;
  const callAmount = getCallAmount(idx);
  bet(idx, callAmount);
  recordHistory(idx, 'call', callAmount);
  AppState.seats[idx].action = 'call';
  advanceAction();
}

/**
 * レイズ処理
 * @param {number} totalAmount - レイズ後の総ベット額
 */
function actionRaise(totalAmount) {
  const idx = AppState.currentSeatIndex;
  // Min-Raise バリデーション
  const currentBet = AppState.seats[idx].betAmount;
  const maxBetOnTable = Math.max(...AppState.seats.map(s => s.betAmount));
  if (totalAmount < AppState.minRaise && AppState.seats[idx].stack > 0) {
    showError(`最小レイズ額は ${formatAmount(AppState.minRaise)} です`);
    return;
  }
  const raiseDelta = totalAmount - maxBetOnTable;
  const additional = totalAmount - currentBet;
  bet(idx, additional);
  recordHistory(idx, 'raise', totalAmount);
  AppState.seats[idx].action = 'raise';
  updateMinRaise(totalAmount, raiseDelta);
  advanceAction();
}

function actionAllIn() {
  const idx = AppState.currentSeatIndex;
  const allInAmount = AppState.seats[idx].stack + AppState.seats[idx].betAmount;
  bet(idx, AppState.seats[idx].stack);
  recordHistory(idx, 'allin', AppState.seats[idx].betAmount);
  AppState.seats[idx].action = 'all-in';
  // サイドポット再計算
  const contributions = AppState.seats
    .filter(s => !s.isAway && !s.isFolded)
    .map((s, i) => ({ seatIndex: i, totalBet: s.betAmount }));
  recalcPots(contributions);
  advanceAction();
}

/**
 * コール額を計算
 */
function getCallAmount(seatIndex) {
  const maxBet = Math.max(...AppState.seats.map(s => s.betAmount));
  return Math.min(maxBet - AppState.seats[seatIndex].betAmount, AppState.seats[seatIndex].stack);
}

/**
 * 次のアクションへ進む
 */
function advanceAction() {
  const active = getActiveSeats();
  // 1人だけ残った → ハンド終了
  if (active.length <= 1) {
    endHand(active);
    return;
  }
  const next = getNextActiveSeat(AppState.currentSeatIndex);
  // ストリートの終了チェック（全員ベット額が揃っている）
  if (isStreetComplete()) {
    advanceStreet();
    return;
  }
  AppState.currentSeatIndex = next;
  renderAll();
}

/**
 * ストリート完了チェック（全アクティブ座席のベット額が最大値に揃い、全員1度はアクション済み）
 */
function isStreetComplete() {
  const active = getActiveSeats();
  const maxBet = Math.max(...AppState.seats.map(s => s.betAmount));
  return active.every(i => AppState.seats[i].betAmount === maxBet && AppState.seats[i].action !== null);
}

/**
 * 次のストリートへ進む
 */
function advanceStreet() {
  const streetOrder = ['preflop', 'flop', 'turn', 'river', 'showdown'];
  const nextIdx = streetOrder.indexOf(AppState.street) + 1;
  if (nextIdx >= streetOrder.length) {
    endHand(getActiveSeats());
    return;
  }
  // ベット額リセット
  AppState.seats.forEach(s => { s.betAmount = 0; s.action = null; });
  AppState.street = streetOrder[nextIdx];
  updateMinRaise(0, AppState.blind.bb);
  // ポストフロップ先頭座席
  AppState.currentSeatIndex = getPostflopFirstSeat();
  renderAll();
}

/**
 * ハンド終了処理
 * @param {number[]} winnerCandidates
 */
function endHand(winnerCandidates) {
  AppState.street = 'showdown';
  renderAll();
  // Winner選択UIを表示（ユーザーが選択後 splitPot を呼ぶ）
  showWinnerSelector(winnerCandidates);
}

// ===================================================
// Step 4: 録画 & IndexedDB
// ===================================================

function recordHistory(seatIndex, action, amount) {
  AppState.history.push({
    street: AppState.street,
    seatIndex,
    action,
    amount,
    potSnapshot: JSON.parse(JSON.stringify(AppState.pot)),
    stackSnapshot: AppState.seats.map(s => ({ id: s.id, stack: s.stack, betAmount: s.betAmount })),
  });
}

// IndexedDB 保存
const DB_NAME = 'PokerMemo';
const DB_VERSION = 1;
let db;

function initDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = e => {
      const d = e.target.result;
      if (!d.objectStoreNames.contains('hands')) {
        d.createObjectStore('hands', { keyPath: 'id', autoIncrement: true });
      }
    };
    req.onsuccess = e => { db = e.target.result; resolve(); };
    req.onerror = () => reject(req.error);
  });
}

function saveHand(handData) {
  if (!db) return;
  const tx = db.transaction('hands', 'readwrite');
  tx.objectStore('hands').add({ ...handData, savedAt: new Date().toISOString() });
}

function loadHands() {
  return new Promise((resolve, reject) => {
    if (!db) return resolve([]);
    const tx = db.transaction('hands', 'readonly');
    const req = tx.objectStore('hands').getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

// ===================================================
// Step 4: リプレイ再生エンジン
// ===================================================
const Replay = {
  index: 0,
  speed: 1,
  timer: null,

  play() {
    if (this.timer) return;
    this.timer = setInterval(() => {
      if (this.index >= AppState.history.length) {
        this.pause();
        return;
      }
      this.stepTo(this.index);
      this.index++;
    }, 1000 / this.speed);
  },

  pause() {
    clearInterval(this.timer);
    this.timer = null;
  },

  stepTo(index) {
    const step = AppState.history[index];
    if (!step) return;
    // スナップショットを復元して描画
    AppState.pot = step.potSnapshot;
    step.stackSnapshot.forEach(snap => {
      const s = AppState.seats[snap.id];
      if (s) { s.stack = snap.stack; s.betAmount = snap.betAmount; }
    });
    AppState.street = step.street;
    renderAll();
    // リプレイバーの更新
    const bar = document.getElementById('replay-bar');
    if (bar) bar.value = index;
  },

  setSpeed(s) { this.speed = s; },
};

// ===================================================
// ユーティリティ
// ===================================================

function formatAmount(n) {
  if (AppState.blind.displayUnit === 'bb') {
    return (n / AppState.blind.bb).toFixed(1) + ' BB';
  }
  return '$' + n.toFixed(1);
}

function showError(msg) {
  const el = document.getElementById('error-msg');
  if (!el) return;
  el.textContent = msg;
  el.classList.remove('hidden');
  setTimeout(() => el.classList.add('hidden'), 3000);
}

// ===================================================
// レンダリング（DOMへの反映）
// ===================================================

function renderAll() {
  renderSeats();
  renderPot();
  renderBoard();
  renderActionPanel();
  renderStreetBadge();
}

function renderSeats() {
  AppState.seats.forEach((seat, i) => {
    const el = document.getElementById(`seat-${i}`);
    if (!el) return;
    el.querySelector('.seat-name').textContent = seat.name;
    el.querySelector('.seat-stack').textContent = formatAmount(seat.stack);
    el.querySelector('.seat-bet').textContent = seat.betAmount > 0 ? formatAmount(seat.betAmount) : '';
    el.querySelector('.seat-action').textContent = seat.action ? seat.action.toUpperCase() : '';
    el.querySelector('.seat-pos').textContent = getPositionName(i);
    // ハイライト
    el.classList.toggle('active-turn', i === AppState.currentSeatIndex);
    // 離席ディムアウト
    el.classList.toggle('away', seat.isAway);
    // フォルド
    el.classList.toggle('folded', seat.isFolded);
    // オールイン
    el.classList.toggle('all-in', seat.isAllIn);
  });
}

function renderPot() {
  const mainEl = document.getElementById('pot-main');
  const sideEl = document.getElementById('pot-sides');
  if (mainEl) mainEl.textContent = `Main Pot: ${formatAmount(AppState.pot.main)}`;
  if (sideEl) {
    sideEl.innerHTML = AppState.pot.sides.map((s, i) =>
      `<span>Side Pot ${i + 1}: ${formatAmount(s.amount)} [Seats ${s.eligibleSeats.map(x => x + 1).join(',')}]</span>`
    ).join('<br>');
  }
}

function renderBoard() {
  ['flop1','flop2','flop3','turn','river'].forEach((id, i) => {
    const el = document.getElementById(`board-${id}`);
    if (el) el.textContent = AppState.board[i] || '?';
  });
}

function renderActionPanel() {
  const callBtn = document.getElementById('btn-call');
  const raiseBtn = document.getElementById('btn-raise');
  const minLabel = document.getElementById('min-raise-label');
  if (!callBtn) return;
  const callAmt = getCallAmount(AppState.currentSeatIndex);
  callBtn.textContent = callAmt > 0 ? `Call ${formatAmount(callAmt)}` : 'Check';
  if (minLabel) minLabel.textContent = `Min: ${formatAmount(AppState.minRaise)}`;
}

function renderStreetBadge() {
  const el = document.getElementById('street-badge');
  if (el) el.textContent = AppState.street.toUpperCase();
}

function showWinnerSelector(candidates) {
  const modal = document.getElementById('winner-modal');
  const list = document.getElementById('winner-list');
  if (!modal || !list) return;
  list.innerHTML = '';
  candidates.forEach(idx => {
    const btn = document.createElement('button');
    btn.textContent = AppState.seats[idx].name;
    btn.dataset.seat = idx;
    btn.classList.add('winner-btn');
    btn.addEventListener('click', () => btn.classList.toggle('selected'));
    list.appendChild(btn);
  });
  modal.classList.remove('hidden');
}

// ===================================================
// 初期化 & イベントバインド
// ===================================================

async function init() {
  await initDB();
  initSeats();
  bindEvents();
  renderAll();
}

function bindEvents() {
  // ブラインド・卓設定
  document.getElementById('seat-count')?.addEventListener('change', e => {
    AppState.seatCount = parseInt(e.target.value);
    initSeats();
    renderAll();
  });

  // レートプリセット
  document.querySelectorAll('.rate-preset').forEach(btn => {
    btn.addEventListener('click', () => {
      AppState.blind.sb = parseFloat(btn.dataset.sb);
      AppState.blind.bb = parseFloat(btn.dataset.bb);
      AppState.blind.anteAmount = AppState.blind.bb;
      document.getElementById('input-sb').value = AppState.blind.sb;
      document.getElementById('input-bb').value = AppState.blind.bb;
      updateMinRaise(AppState.blind.bb, AppState.blind.bb);
    });
  });

  // カスタム SB/BB
  document.getElementById('input-sb')?.addEventListener('input', e => {
    AppState.blind.sb = parseFloat(e.target.value) || 1;
  });
  document.getElementById('input-bb')?.addEventListener('input', e => {
    AppState.blind.bb = parseFloat(e.target.value) || 2;
  });

  // アンティ種別
  document.getElementById('ante-type')?.addEventListener('change', e => {
    AppState.blind.anteType = e.target.value;
  });

  // 表示単位切替 (BB / Cash)
  document.getElementById('unit-toggle')?.addEventListener('click', () => {
    AppState.blind.displayUnit = AppState.blind.displayUnit === 'bb' ? 'cash' : 'bb';
    document.getElementById('unit-toggle').textContent =
      AppState.blind.displayUnit === 'bb' ? '表示: BB' : '表示: $';
    renderAll();
  });

  // ハンド開始
  document.getElementById('btn-new-hand')?.addEventListener('click', startNewHand);

  // アクション
  document.getElementById('btn-fold')?.addEventListener('click', actionFold);
  document.getElementById('btn-call')?.addEventListener('click', actionCall);
  document.getElementById('btn-allin')?.addEventListener('click', actionAllIn);
  document.getElementById('btn-raise-confirm')?.addEventListener('click', () => {
    const val = parseFloat(document.getElementById('raise-input').value);
    if (val) actionRaise(val);
  });

  // クイックレイズ倍率ボタン
  document.querySelectorAll('.raise-mult').forEach(btn => {
    btn.addEventListener('click', () => {
      const mult = parseFloat(btn.dataset.mult);
      const maxBet = Math.max(...AppState.seats.map(s => s.betAmount));
      const raiseAmount = maxBet + Math.max(AppState.lastRaiseDelta, AppState.blind.bb) * mult;
      const input = document.getElementById('raise-input');
      if (input) input.value = raiseAmount.toFixed(1);
    });
  });

  // リプレイバー
  document.getElementById('btn-replay-play')?.addEventListener('click', () => Replay.play());
  document.getElementById('btn-replay-pause')?.addEventListener('click', () => Replay.pause());
  document.getElementById('btn-replay-prev')?.addEventListener('click', () => {
    Replay.index = Math.max(0, Replay.index - 1);
    Replay.stepTo(Replay.index);
  });
  document.getElementById('btn-replay-next')?.addEventListener('click', () => {
    Replay.index = Math.min(AppState.history.length - 1, Replay.index + 1);
    Replay.stepTo(Replay.index);
  });
  document.getElementById('replay-bar')?.addEventListener('input', e => {
    Replay.index = parseInt(e.target.value);
    Replay.stepTo(Replay.index);
  });
  document.querySelectorAll('.speed-btn').forEach(btn => {
    btn.addEventListener('click', () => Replay.setSpeed(parseFloat(btn.dataset.speed)));
  });

  // Winner確定
  document.getElementById('btn-confirm-winner')?.addEventListener('click', () => {
    const selected = [...document.querySelectorAll('.winner-btn.selected')]
      .map(b => parseInt(b.dataset.seat));
    if (selected.length === 0) return;
    splitPot(selected, AppState.pot.main);
    AppState.pot.sides.forEach(side => {
      const eligible = selected.filter(s => side.eligibleSeats.includes(s));
      if (eligible.length > 0) splitPot(eligible, side.amount);
    });
    saveHand({ history: AppState.history, seats: AppState.seats, board: AppState.board });
    document.getElementById('winner-modal').classList.add('hidden');
    renderAll();
  });

  // Away トグル (各座席)
  document.querySelectorAll('.away-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.dataset.seat);
      AppState.seats[idx].isAway = !AppState.seats[idx].isAway;
      renderSeats();
    });
  });

  // スタック直接編集
  document.querySelectorAll('.stack-input').forEach(input => {
    input.addEventListener('change', e => {
      const idx = parseInt(input.dataset.seat);
      AppState.seats[idx].stack = parseFloat(e.target.value) || 0;
      renderSeats();
    });
  });
}

window.addEventListener('DOMContentLoaded', init);
