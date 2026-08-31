/**
 * Poker Memo Web Tool - app.js
 * フェーズ1: ライブアクションテーブル & ハンドリプレイ
 *
 * Step 1: データ構造 & 状態管理
 * Step 2: NLHポーカーエンジン (HU判定, Min-Raise, Side Pot自動分割, Undo, All-in Runout)
 * Step 4: アクション録画 & IndexedDB
 * 機能拡張: 4x13カードピッカー, ハンド履歴の保存・テキスト共有・JSONエクスポート/インポート
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

// 4x13 カード定義
const SUITS = [
  { symbol: '♠', code: 's', cssClass: 'suit-s', label: 'Spades' },
  { symbol: '♥', code: 'h', cssClass: 'suit-h', label: 'Hearts' },
  { symbol: '♦', code: 'd', cssClass: 'suit-d', label: 'Diamonds' },
  { symbol: '♣', code: 'c', cssClass: 'suit-c', label: 'Clubs' }
];

const RANKS = [
  { rank: 1,  code: 'A', label: 'A' },
  { rank: 2,  code: '2', label: '2' },
  { rank: 3,  code: '3', label: '3' },
  { rank: 4,  code: '4', label: '4' },
  { rank: 5,  code: '5', label: '5' },
  { rank: 6,  code: '6', label: '6' },
  { rank: 7,  code: '7', label: '7' },
  { rank: 8,  code: '8', label: '8' },
  { rank: 9,  code: '9', label: '9' },
  { rank: 10, code: 'T', label: '10' },
  { rank: 11, code: 'J', label: 'J' },
  { rank: 12, code: 'Q', label: 'Q' },
  { rank: 13, code: 'K', label: 'K' }
];

let activePickerSlot = null; // 'flop1', 'flop2', 'flop3', 'turn', 'river'

// ===================================================
// Step 1: データ構造
// ===================================================

const AppState = {
  seatCount: 6,
  dealerSeat: 0,

  blind: {
    sb: 1, bb: 2, anteType: 'bb', anteAmount: 2,
    straddle: false, displayUnit: 'bb',
  },

  seats: [],
  board: ['', '', '', '', ''],
  pot: { main: 0, sides: [] },
  street: 'preflop',
  currentSeatIndex: 0,
  minRaise: 0,
  lastRaiseDelta: 0,

  history: [],
  replayIndex: 0,
};

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

function getActiveSeats(includeAllIn = false) {
  return AppState.seats
    .map((s, i) => ({ s, i }))
    .filter(({ s }) => !s.isAway && !s.isFolded && (includeAllIn || !s.isAllIn))
    .map(({ i }) => i);
}

function isHeadsUp() {
  return AppState.seatCount === 2;
}

function getPositionName(seatIndex) {
  const positions = POSITIONS_BY_COUNT[AppState.seatCount] || [];
  const relIndex = (seatIndex - AppState.dealerSeat + AppState.seatCount) % AppState.seatCount;
  return positions[relIndex] || `Seat ${seatIndex + 1}`;
}

function getSBIndex() {
  if (isHeadsUp()) return AppState.dealerSeat;
  return (AppState.dealerSeat + 1) % AppState.seatCount;
}
function getBBIndex() {
  return (AppState.dealerSeat + 2) % AppState.seatCount;
}

function getPreflopFirstSeat() {
  if (isHeadsUp()) return AppState.dealerSeat;
  return (AppState.dealerSeat + 3) % AppState.seatCount;
}

function getPostflopFirstSeat() {
  if (isHeadsUp()) return getBBIndex();
  return getSBIndex();
}

function getNextActiveSeat(fromIndex) {
  for (let i = 1; i <= AppState.seatCount; i++) {
    const idx = (fromIndex + i) % AppState.seatCount;
    const s = AppState.seats[idx];
    if (!s.isAway && !s.isFolded && !s.isAllIn) return idx;
  }
  return -1;
}

function updateMinRaise(callAmount, raiseDelta) {
  AppState.lastRaiseDelta = Math.max(raiseDelta, AppState.blind.bb);
  AppState.minRaise = callAmount + AppState.lastRaiseDelta;
}

function recalcPots(contributions) {
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

function splitPot(winnerSeats, potAmount) {
  if (!winnerSeats || winnerSeats.length === 0) return;
  const base = Math.floor(potAmount / winnerSeats.length);
  const remainder = potAmount % winnerSeats.length;
  const sbIdx = getSBIndex();
  const closestToSB = [...winnerSeats].sort((a, b) => {
    const da = (a - sbIdx + AppState.seatCount) % AppState.seatCount;
    const db = (b - sbIdx + AppState.seatCount) % AppState.seatCount;
    return da - db;
  });
  winnerSeats.forEach(idx => {
    if (AppState.seats[idx]) AppState.seats[idx].stack += base;
  });
  if (remainder > 0 && AppState.seats[closestToSB[0]]) {
    AppState.seats[closestToSB[0]].stack += remainder;
  }
}

function startNewHand() {
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

  if (anteType === 'bb') {
    const totalAnte = anteAmount * AppState.seatCount;
    bet(bbIdx, totalAnte);
  } else if (anteType === 'regular') {
    AppState.seats.forEach((s, idx) => {
      if (!s.isAway) bet(idx, anteAmount);
    });
  }

  bet(sbIdx, sb);
  bet(bbIdx, bb);
  updateMinRaise(bb, bb);
  AppState.currentSeatIndex = getPreflopFirstSeat();
  renderAll();
}

function bet(seatIndex, amount) {
  const seat = AppState.seats[seatIndex];
  if (!seat) return;
  const actual = Math.min(amount, seat.stack);
  seat.stack -= actual;
  seat.betAmount += actual;
  AppState.pot.main += actual;
  if (seat.stack === 0) seat.isAllIn = true;
}

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

function actionRaise(totalAmount) {
  const idx = AppState.currentSeatIndex;
  const currentBet = AppState.seats[idx].betAmount;
  const maxBetOnTable = Math.max(...AppState.seats.map(s => s.betAmount));

  const maxStackAmount = currentBet + AppState.seats[idx].stack;
  if (totalAmount >= maxStackAmount) {
    actionAllIn();
    return;
  }

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
  const allInBet = AppState.seats[idx].betAmount + AppState.seats[idx].stack;
  bet(idx, AppState.seats[idx].stack);
  recordHistory(idx, 'allin', allInBet);
  AppState.seats[idx].action = 'all-in';

  const contributions = AppState.seats
    .filter(s => !s.isAway && !s.isFolded)
    .map(s => ({ seatIndex: s.id, totalBet: s.betAmount }));
  recalcPots(contributions);
  advanceAction();
}

function undoAction() {
  if (AppState.history.length === 0) {
    showError('戻るアクションがありません');
    return;
  }
  AppState.history.pop();
  if (AppState.history.length > 0) {
    const prevStep = AppState.history[AppState.history.length - 1];
    AppState.pot = JSON.parse(JSON.stringify(prevStep.potSnapshot));
    prevStep.stackSnapshot.forEach(snap => {
      const s = AppState.seats[snap.id];
      if (s) {
        s.stack = snap.stack;
        s.betAmount = snap.betAmount;
        s.isFolded = snap.isFolded ?? false;
        s.isAllIn = snap.isAllIn ?? false;
        s.action = snap.action ?? null;
      }
    });
    AppState.street = prevStep.street;
    AppState.currentSeatIndex = prevStep.currentSeatIndex;
  } else {
    startNewHand();
  }
  renderAll();
}

function getCallAmount(seatIndex) {
  const maxBet = Math.max(...AppState.seats.map(s => s.betAmount));
  return Math.min(maxBet - AppState.seats[seatIndex].betAmount, AppState.seats[seatIndex].stack);
}

function advanceAction() {
  const active = getActiveSeats();
  const activeNoAllIn = getActiveSeats(false);

  if (active.length <= 1) {
    endHand(active);
    return;
  }

  if (activeNoAllIn.length <= 1) {
    runoutAllIn();
    return;
  }

  const next = getNextActiveSeat(AppState.currentSeatIndex);

  if (isStreetComplete()) {
    advanceStreet();
    return;
  }
  AppState.currentSeatIndex = next;
  renderAll();
}

function runoutAllIn() {
  AppState.street = 'showdown';
  renderAll();
  endHand(getActiveSeats(true));
}

function isStreetComplete() {
  const activeNoAllIn = getActiveSeats(false);
  const maxBet = Math.max(...AppState.seats.map(s => s.betAmount));
  return activeNoAllIn.every(i => AppState.seats[i].betAmount === maxBet && AppState.seats[i].action !== null);
}

function advanceStreet() {
  const streetOrder = ['preflop', 'flop', 'turn', 'river', 'showdown'];
  const nextIdx = streetOrder.indexOf(AppState.street) + 1;
  if (nextIdx >= streetOrder.length) {
    endHand(getActiveSeats(true));
    return;
  }
  AppState.seats.forEach(s => { s.betAmount = 0; s.action = null; });
  AppState.street = streetOrder[nextIdx];
  updateMinRaise(0, AppState.blind.bb);
  AppState.currentSeatIndex = getPostflopFirstSeat();

  const next = AppState.seats[AppState.currentSeatIndex];
  if (next && (next.isAway || next.isFolded || next.isAllIn)) {
    AppState.currentSeatIndex = getNextActiveSeat(AppState.currentSeatIndex);
  }
  renderAll();
}

function endHand(winnerCandidates) {
  AppState.street = 'showdown';
  renderAll();
  showWinnerSelector(winnerCandidates);
}

// ===================================================
// 4x13 カードピッカー 制御関数
// ===================================================

function openCardPicker(slotId) {
  activePickerSlot = slotId;
  const labelEl = document.getElementById('picker-target-label');
  if (labelEl) labelEl.textContent = slotId.toUpperCase();
  renderCardPickerMatrix();
  const modal = document.getElementById('card-picker-modal');
  if (modal) modal.classList.remove('hidden');
}

function closeCardPicker() {
  const modal = document.getElementById('card-picker-modal');
  if (modal) modal.classList.add('hidden');
  activePickerSlot = null;
}

function renderCardPickerMatrix() {
  const container = document.getElementById('card-picker-matrix');
  if (!container) return;
  container.innerHTML = '';

  const usedCards = new Set(AppState.board.filter(c => c));

  SUITS.forEach(suit => {
    const row = document.createElement('div');
    row.className = 'card-picker-row';

    const iconLabel = document.createElement('div');
    iconLabel.className = `suit-icon-label ${suit.cssClass}`;
    iconLabel.textContent = suit.symbol;
    row.appendChild(iconLabel);

    RANKS.forEach(rankObj => {
      const cardCode = `${rankObj.code}${suit.code}`;
      const cardDisplay = `${rankObj.label}${suit.symbol}`;
      const cell = document.createElement('div');
      cell.className = `picker-card-cell ${suit.cssClass}`;
      cell.textContent = cardDisplay;

      if (usedCards.has(cardCode)) {
        cell.classList.add('used');
      } else {
        cell.addEventListener('click', () => selectCardFromPicker(cardCode));
      }
      row.appendChild(cell);
    });
    container.appendChild(row);
  });
}

function selectCardFromPicker(cardCode) {
  if (!activePickerSlot) return;
  const map = { flop1:0, flop2:1, flop3:2, turn:3, river:4 };
  if (map[activePickerSlot] !== undefined) {
    AppState.board[map[activePickerSlot]] = cardCode;
  }
  renderBoard();
  closeCardPicker();
}

function applyManualCardInput() {
  const input = document.getElementById('card-manual-input');
  if (!input || !activePickerSlot) return;
  const val = input.value.trim();
  if (val) {
    selectCardFromPicker(val);
    input.value = '';
  }
}

function clearCurrentCardSlot() {
  if (!activePickerSlot) return;
  const map = { flop1:0, flop2:1, flop3:2, turn:3, river:4 };
  if (map[activePickerSlot] !== undefined) {
    AppState.board[map[activePickerSlot]] = '';
  }
  renderBoard();
  closeCardPicker();
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
    currentSeatIndex: AppState.currentSeatIndex,
    potSnapshot: JSON.parse(JSON.stringify(AppState.pot)),
    stackSnapshot: AppState.seats.map(s => ({
      id: s.id, stack: s.stack, betAmount: s.betAmount,
      isFolded: s.isFolded, isAllIn: s.isAllIn, action: s.action
    })),
  });
}

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
  const store = tx.objectStore('hands');
  const record = {
    ...handData,
    seatCount: AppState.seatCount,
    blind: AppState.blind,
    savedAt: new Date().toISOString()
  };
  store.add(record);
}

function fetchAllHandsFromDB() {
  return new Promise((resolve, reject) => {
    if (!db) return resolve([]);
    const tx = db.transaction('hands', 'readonly');
    const req = tx.objectStore('hands').getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

function deleteHandFromDB(id) {
  return new Promise((resolve, reject) => {
    if (!db) return resolve();
    const tx = db.transaction('hands', 'readwrite');
    const req = tx.objectStore('hands').delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

// ===================================================
// 共有・テキスト生成・JSON機能
// ===================================================

function generateHandText() {
  const { sb, bb, anteType, anteAmount } = AppState.blind;
  let txt = `🎴 [Poker Memo Hand History]\n`;
  txt += `Rate: ${sb}/${bb} (${anteType === 'bb' ? `BB Ante: ${anteAmount}` : anteType === 'regular' ? `Ante: ${anteAmount}` : 'No Ante'}) | ${AppState.seatCount}-Max\n`;

  const validBoard = AppState.board.filter(c => c !== '');
  if (validBoard.length > 0) {
    txt += `Board: [${validBoard.join(' ')}]\n`;
  }
  txt += `Total Pot: ${formatAmount(AppState.pot.main)}\n`;
  txt += `-----------------------------------\n`;

  let currentSt = '';
  AppState.history.forEach(step => {
    if (step.street !== currentSt) {
      currentSt = step.street;
      txt += `\n[${currentSt.toUpperCase()}]\n`;
    }
    const name = AppState.seats[step.seatIndex]?.name || `Seat ${step.seatIndex + 1}`;
    const pos = getPositionName(step.seatIndex);
    const amtStr = step.amount > 0 ? ` ${formatAmount(step.amount)}` : '';
    txt += `• ${name} (${pos}): ${step.action.toUpperCase()}${amtStr}\n`;
  });

  return txt;
}

async function copyHandText() {
  const text = generateHandText();
  try {
    await navigator.clipboard.writeText(text);
    showError('✅ ハンドテキストをクリップボードにコピーしました！');
  } catch (err) {
    const area = document.createElement('textarea');
    area.value = text;
    document.body.appendChild(area);
    area.select();
    document.execCommand('copy');
    document.body.removeChild(area);
    showError('✅ ハンドテキストをコピーしました！');
  }
}

async function exportHandsJSON() {
  const hands = await fetchAllHandsFromDB();
  const jsonStr = JSON.stringify(hands, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `poker-memo-backup-${new Date().toISOString().slice(0,10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function importHandsJSON(file) {
  const reader = new FileReader();
  reader.onload = async e => {
    try {
      const hands = JSON.parse(e.target.result);
      if (Array.isArray(hands)) {
        for (const h of hands) {
          saveHand(h);
        }
        showError(`✅ ${hands.length} 件のハンド履歴を復元・追加しました`);
        renderSavedHandsModal();
      }
    } catch (err) {
      showError('❌ 不正なJSONファイルです');
    }
  };
  reader.readAsText(file);
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
      if (this.index >= AppState.history.length - 1) {
        this.pause();
        return;
      }
      this.index++;
      this.stepTo(this.index);
    }, 1000 / this.speed);
  },

  pause() {
    clearInterval(this.timer);
    this.timer = null;
  },

  stepTo(index) {
    if (index < 0 || index >= AppState.history.length) return;
    const step = AppState.history[index];
    if (!step) return;
    AppState.pot = JSON.parse(JSON.stringify(step.potSnapshot));
    step.stackSnapshot.forEach(snap => {
      const s = AppState.seats[snap.id];
      if (s) {
        s.stack = snap.stack;
        s.betAmount = snap.betAmount;
        s.isFolded = snap.isFolded;
        s.isAllIn = snap.isAllIn;
        s.action = snap.action;
      }
    });
    AppState.street = step.street;
    if (step.currentSeatIndex !== undefined) AppState.currentSeatIndex = step.currentSeatIndex;
    renderAll();
    ['replay-bar', 'replay-bar-m'].forEach(id => {
      const bar = document.getElementById(id);
      if (bar) bar.value = index;
    });
  },

  setSpeed(s) { this.speed = s; },
};

// ===================================================
// ユーティリティ
// ===================================================

function formatAmount(n) {
  if (n === undefined || n === null) return '';
  if (AppState.blind.displayUnit === 'bb') {
    return (n / AppState.blind.bb).toFixed(1) + ' BB';
  }
  return '$' + n.toFixed(1);
}

function showError(msg) {
  ['error-msg', 'error-msg-mobile'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = msg;
    el.classList.remove('hidden');
    setTimeout(() => el.classList.add('hidden'), 3500);
  });
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
    el.classList.toggle('active-turn', i === AppState.currentSeatIndex && !seat.isFolded && !seat.isAway);
    el.classList.toggle('away', seat.isAway);
    el.classList.toggle('folded', seat.isFolded);
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
    if (el) {
      const cardStr = AppState.board[i];
      if (cardStr) {
        // 例: 'As' -> 'A♠', 'Th' -> '10♥'
        const rankStr = cardStr.slice(0, -1).replace('T', '10');
        const suitChar = cardStr.slice(-1);
        const suitMap = { s: '♠', h: '♥', d: '♦', c: '♣' };
        const suitClassMap = { s: 'spades', h: 'hearts', d: 'diamonds', c: 'clubs' };
        el.textContent = `${rankStr}${suitMap[suitChar] || ''}`;
        el.className = `card-slot ${suitClassMap[suitChar] || ''}`;
      } else {
        el.textContent = '?';
        el.className = 'card-slot';
      }
    }
  });
}

function renderActionPanel() {
  const callBtn = document.getElementById('btn-call');
  const minLabel = document.getElementById('min-raise-label');
  if (!callBtn) return;
  const callAmt = getCallAmount(AppState.currentSeatIndex);
  callBtn.textContent = callAmt > 0 ? `CALL ${formatAmount(callAmt)}` : 'CHECK';
  if (minLabel) minLabel.textContent = `Min Raise: ${formatAmount(AppState.minRaise)}`;
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
    btn.textContent = `${AppState.seats[idx].name} (${getPositionName(idx)})`;
    btn.dataset.seat = idx;
    btn.classList.add('winner-btn');
    btn.addEventListener('click', () => btn.classList.toggle('selected'));
    list.appendChild(btn);
  });
  modal.classList.remove('hidden');
}

async function renderSavedHandsModal() {
  const modal = document.getElementById('saved-hands-modal');
  const list = document.getElementById('saved-hands-list');
  if (!modal || !list) return;
  list.innerHTML = '';
  const hands = await fetchAllHandsFromDB();
  if (hands.length === 0) {
    list.innerHTML = '<div style="font-size:.85rem;color:var(--text-sub);text-align:center;padding:20px">保存されたハンド履歴はありません</div>';
  } else {
    hands.reverse().forEach(h => {
      const item = document.createElement('div');
      item.style.cssText = 'background:var(--surface2);border:1px solid var(--border);border-radius:8px;padding:10px;display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;';
      const dateStr = new Date(h.savedAt).toLocaleString();
      const boardStr = h.board ? h.board.filter(c => c !== '').join(' ') : '';
      item.innerHTML = `
        <div>
          <div style="font-weight:700;font-size:.85rem">Hand #${h.id} (${h.seatCount || 6}-Max)</div>
          <div style="font-size:.75rem;color:var(--text-sub)">${dateStr} | Board: [${boardStr || 'N/A'}]</div>
        </div>
        <div style="display:flex;gap:6px">
          <button onclick="loadHandFromData(${h.id})" style="padding:4px 10px;background:var(--accent);color:#fff;border:none;border-radius:5px;font-size:.78rem;cursor:pointer">復元</button>
          <button onclick="deleteSavedHand(${h.id})" style="padding:4px 8px;background:var(--red);color:#fff;border:none;border-radius:5px;font-size:.78rem;cursor:pointer">削除</button>
        </div>`;
      list.appendChild(item);
    });
  }
  modal.classList.remove('hidden');
}

async function loadHandFromData(id) {
  const hands = await fetchAllHandsFromDB();
  const target = hands.find(h => h.id === id);
  if (!target) return;
  AppState.history = target.history || [];
  AppState.seats = target.seats || [];
  AppState.board = target.board || ['', '', '', '', ''];
  AppState.seatCount = target.seatCount || AppState.seatCount;
  if (target.blind) AppState.blind = target.blind;
  AppState.replayIndex = 0;
  if (AppState.history.length > 0) {
    Replay.stepTo(0);
  }
  document.getElementById('saved-hands-modal').classList.add('hidden');
  showError(`✅ Hand #${id} を復元しました。リプレイ再生が可能です。`);
}

async function deleteSavedHand(id) {
  await deleteHandFromDB(id);
  renderSavedHandsModal();
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
  document.getElementById('seat-count')?.addEventListener('change', e => {
    AppState.seatCount = parseInt(e.target.value);
    initSeats();
    renderAll();
  });

  document.querySelectorAll('.rate-preset').forEach(btn => {
    btn.addEventListener('click', () => {
      AppState.blind.sb = parseFloat(btn.dataset.sb);
      AppState.blind.bb = parseFloat(btn.dataset.bb);
      AppState.blind.anteAmount = AppState.blind.bb;
      ['input-sb','input-sb-m'].forEach(id => { const el = document.getElementById(id); if (el) el.value = AppState.blind.sb; });
      ['input-bb','input-bb-m'].forEach(id => { const el = document.getElementById(id); if (el) el.value = AppState.blind.bb; });
      updateMinRaise(AppState.blind.bb, AppState.blind.bb);
    });
  });

  document.getElementById('input-sb')?.addEventListener('input', e => {
    AppState.blind.sb = parseFloat(e.target.value) || 1;
  });
  document.getElementById('input-bb')?.addEventListener('input', e => {
    AppState.blind.bb = parseFloat(e.target.value) || 2;
  });

  document.getElementById('ante-type')?.addEventListener('change', e => {
    AppState.blind.anteType = e.target.value;
  });

  document.getElementById('unit-toggle')?.addEventListener('click', () => {
    AppState.blind.displayUnit = AppState.blind.displayUnit === 'bb' ? 'cash' : 'bb';
    document.getElementById('unit-toggle').textContent =
      AppState.blind.displayUnit === 'bb' ? '表示: BB' : '表示: $';
    renderAll();
  });

  document.getElementById('btn-new-hand')?.addEventListener('click', startNewHand);

  document.getElementById('btn-fold')?.addEventListener('click', actionFold);
  document.getElementById('btn-call')?.addEventListener('click', actionCall);
  document.getElementById('btn-allin')?.addEventListener('click', actionAllIn);
  document.getElementById('btn-raise-confirm')?.addEventListener('click', () => {
    const val = parseFloat(document.getElementById('raise-input').value);
    if (val) actionRaise(val);
  });

  document.querySelectorAll('.raise-mult').forEach(btn => {
    btn.addEventListener('click', () => {
      const mult = parseFloat(btn.dataset.mult);
      const maxBet = Math.max(...AppState.seats.map(s => s.betAmount));
      const raiseAmount = maxBet + Math.max(AppState.lastRaiseDelta, AppState.blind.bb) * mult;
      ['raise-input','raise-input-m'].forEach(id => {
        const input = document.getElementById(id);
        if (input) input.value = raiseAmount.toFixed(1);
      });
    });
  });

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
  ['replay-bar', 'replay-bar-m'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', e => {
      Replay.index = parseInt(e.target.value);
      Replay.stepTo(Replay.index);
    });
  });
  document.querySelectorAll('.speed-btn').forEach(btn => {
    btn.addEventListener('click', () => Replay.setSpeed(parseFloat(btn.dataset.speed)));
  });

  document.getElementById('btn-confirm-winner')?.addEventListener('click', confirmWinner);
}

function confirmWinner() {
  const selected = [...document.querySelectorAll('.winner-btn.selected')]
    .map(b => parseInt(b.dataset.seat));

  if (selected.length === 0) {
    showError('勝者を1人以上選択してください');
    return;
  }

  const potToShare = AppState.pot.main;
  splitPot(selected, AppState.pot.main);

  AppState.pot.sides.forEach(side => {
    const eligible = selected.filter(s => side.eligibleSeats.includes(s));
    if (eligible.length > 0) splitPot(eligible, side.amount);
  });

  const winnerNames = selected.map(idx => AppState.seats[idx]?.name || `Seat ${idx + 1}`).join(', ');

  AppState.pot.main = 0;
  AppState.pot.sides = [];
  AppState.currentSeatIndex = -1;

  try {
    saveHand({ history: AppState.history, seats: AppState.seats, board: AppState.board });
  } catch (err) {
    console.error('Hand save error:', err);
  }

  const modal = document.getElementById('winner-modal');
  if (modal) modal.classList.add('hidden');

  renderAll();
  showError(`🏆 【配当完了】 ${winnerNames} に ${formatAmount(potToShare)} を配当しました！「▶ New Hand」で次のゲームを開始できます。`);
}

// グローバル関数バインド（ボタンイベント確実に発火）
window.confirmWinner = confirmWinner;
window.actionFold = actionFold;
window.actionCheck = actionCheck;
window.actionCall = actionCall;
window.actionRaise = actionRaise;
window.actionAllIn = actionAllIn;
window.actionUndo = undoAction;
window.startNewHand = startNewHand;
window.openCardPicker = openCardPicker;
window.closeCardPicker = closeCardPicker;
window.applyManualCardInput = applyManualCardInput;
window.clearCurrentCardSlot = clearCurrentCardSlot;
window.copyHandText = copyHandText;
window.exportHandsJSON = exportHandsJSON;
window.importHandsJSON = importHandsJSON;
window.loadHandFromData = loadHandFromData;
window.deleteSavedHand = deleteSavedHand;

window.addEventListener('DOMContentLoaded', init);

