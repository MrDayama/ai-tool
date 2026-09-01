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
  heroSeatIndex: 0,

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
    isHero: i === AppState.heroSeatIndex,
    holeCards: ['', ''],
  }));

  const sbIdx = getSBIndex();
  const bbIdx = getBBIndex();
  const { sb, bb } = AppState.blind;
  if (AppState.seats[sbIdx] && AppState.seats[bbIdx]) {
    bet(sbIdx, sb);
    bet(bbIdx, bb);
    updateMinRaise(bb, bb);
  }
  AppState.currentSeatIndex = getPreflopFirstSeat();
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
  const heroSeat = AppState.seats[AppState.heroSeatIndex];
  if (!heroSeat || !heroSeat.holeCards || heroSeat.holeCards.filter(c => c !== '').length < 2) {
    showError('⚠️ 【手札未選択】 左サイドバーの「★ Hero(自分)の設定」で自分手札2枚をタップ選択してください');
    return;
  }

  AppState.seats.forEach(s => {
    s.betAmount = 0;
    s.action = null;
    s.isFolded = false;
    s.isAllIn = false;
    s.actedInStreet = false;
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

  // 初期スナップショット (リプレイ再生の開始フレーム) を記録
  recordHistory(AppState.currentSeatIndex, 'start', 0);
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

let isProcessingAction = false;
function lockActionProcessing() {
  isProcessingAction = true;
  setTimeout(() => { isProcessingAction = false; }, 150);
}

function actionFold() {
  if (isProcessingAction) return;
  lockActionProcessing();
  const idx = AppState.currentSeatIndex;
  recordHistory(idx, 'fold', 0);
  AppState.seats[idx].isFolded = true;
  AppState.seats[idx].action = 'fold';
  AppState.seats[idx].actedInStreet = true;
  advanceAction();
}

function actionCheck() {
  if (isProcessingAction) return;
  lockActionProcessing();
  const idx = AppState.currentSeatIndex;
  recordHistory(idx, 'check', 0);
  AppState.seats[idx].action = 'check';
  AppState.seats[idx].actedInStreet = true;
  advanceAction();
}

function actionCall() {
  if (isProcessingAction) return;
  lockActionProcessing();
  const idx = AppState.currentSeatIndex;
  const callAmount = getCallAmount(idx);
  bet(idx, callAmount);
  recordHistory(idx, 'call', callAmount);
  AppState.seats[idx].action = 'call';
  AppState.seats[idx].actedInStreet = true;
  advanceAction();
}

function actionRaise(totalAmount) {
  if (isProcessingAction) return;
  lockActionProcessing();
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

  // レイズ発生時、他アクティブプレイヤーのactionとactedInStreetをクリアして再行動を要求
  AppState.seats.forEach((s, sIdx) => {
    if (sIdx !== idx && !s.isFolded && !s.isAllIn && !s.isAway) {
      s.action = null;
      s.actedInStreet = false;
    }
  });

  bet(idx, additional);
  AppState.seats[idx].action = 'raise';
  AppState.seats[idx].actedInStreet = true;
  recordHistory(idx, 'raise', totalAmount);
  updateMinRaise(totalAmount, raiseDelta);
  document.getElementById('raise-panel')?.classList.add('hidden');
  advanceAction();
}

function toggleRaisePanel() {
  const panel = document.getElementById('raise-panel');
  if (!panel) return;
  panel.classList.toggle('hidden');
  
  if (!panel.classList.contains('hidden')) {
    const input = document.getElementById('raise-input');
    if (input) {
      input.placeholder = `最小: ${formatAmount(AppState.minRaise)}`;
      input.value = AppState.minRaise;
      input.focus();
    }
  }
}

function setPotRaise() {
  const maxBet = Math.max(...AppState.seats.map(s => s.betAmount));
  const currentSeat = AppState.seats[AppState.currentSeatIndex];
  const currentBet = currentSeat ? currentSeat.betAmount : 0;
  const callAmount = maxBet - currentBet;
  
  const potTotal = AppState.pot.main + AppState.seats.reduce((sum, s) => sum + s.betAmount, 0);
  const potRaiseAmount = maxBet + potTotal + callAmount;
  
  const finalAmount = Math.max(potRaiseAmount, AppState.minRaise);
  actionRaise(finalAmount);
  document.getElementById('raise-panel')?.classList.add('hidden');
}

function actionAllIn() {
  if (isProcessingAction) return;
  lockActionProcessing();
  const idx = AppState.currentSeatIndex;
  const allInBet = AppState.seats[idx].betAmount + AppState.seats[idx].stack;
  const maxBetOnTable = Math.max(...AppState.seats.map(s => s.betAmount));

  // オールインがレイズ（最高額更新）になった場合、他プレイヤーの再行動を要求
  if (allInBet > maxBetOnTable) {
    AppState.seats.forEach((s, sIdx) => {
      if (sIdx !== idx && !s.isFolded && !s.isAllIn && !s.isAway) {
        s.action = null;
        s.actedInStreet = false;
      }
    });
  }

  bet(idx, AppState.seats[idx].stack);
  AppState.seats[idx].action = 'all-in';
  AppState.seats[idx].actedInStreet = true;
  recordHistory(idx, 'allin', allInBet);

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

  if (isStreetComplete()) {
    if (activeNoAllIn.length <= 1) {
      runoutAllIn();
    } else {
      advanceStreet();
    }
    return;
  }

  const next = getNextActiveSeat(AppState.currentSeatIndex);
  if (next !== -1) {
    AppState.currentSeatIndex = next;
  }
  renderAll();
}

function runoutAllIn() {
  AppState.street = 'showdown';
  renderAll();
  endHand(getActiveSeats(true));
}

function isStreetComplete() {
  const activeNoAllIn = getActiveSeats(false);
  if (activeNoAllIn.length <= 1) return true;
  const maxBet = Math.max(...AppState.seats.map(s => s.betAmount));

  // 脱落・オールイン以外の全員が「今ストリートで行動済み」かつ「ベット額一致」か
  return activeNoAllIn.every(i => {
    const s = AppState.seats[i];
    return s.actedInStreet && s.betAmount === maxBet;
  });
}

function advanceStreet() {
  const streetOrder = ['preflop', 'flop', 'turn', 'river', 'showdown'];
  const nextIdx = streetOrder.indexOf(AppState.street) + 1;
  if (nextIdx >= streetOrder.length) {
    endHand(getActiveSeats(true));
    return;
  }
  AppState.seats.forEach(s => {
    s.betAmount = 0;
    s.action = null;
    s.actedInStreet = false;
  });
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
// Hero ＆ 参加者設定モーダル 制御関数
// ===================================================

let tempHeroSetup = {
  heroSeatIndex: 0,
  heroCards: ['', ''],
  villainCards: {}
};

function formatCardDisplay(cardCode) {
  if (!cardCode) return '?';
  const rankStr = cardCode.slice(0, -1).replace('T', '10');
  const suitChar = cardCode.slice(-1);
  const suitMap = { s: '♠', h: '♥', d: '♦', c: '♣' };
  return `${rankStr}${suitMap[suitChar] || ''}`;
}

function openHeroSetupModal() {
  const modal = document.getElementById('hero-setup-modal');
  if (!modal) return;

  tempHeroSetup.heroSeatIndex = AppState.heroSeatIndex ?? 0;
  const heroSeat = AppState.seats[tempHeroSetup.heroSeatIndex];
  tempHeroSetup.heroCards = (heroSeat && heroSeat.holeCards && heroSeat.holeCards.length === 2)
    ? [...heroSeat.holeCards]
    : ['', ''];

  tempHeroSetup.villainCards = {};
  AppState.seats.forEach((s, idx) => {
    if (idx !== tempHeroSetup.heroSeatIndex) {
      tempHeroSetup.villainCards[idx] = (s.holeCards && s.holeCards.length === 2)
        ? [...s.holeCards]
        : ['', ''];
    }
  });

  renderHeroSetupUI();
  modal.classList.remove('hidden');
}

function closeHeroSetupModal() {
  const modal = document.getElementById('hero-setup-modal');
  if (modal) modal.classList.add('hidden');
}

function renderHeroSetupUI() {
  const select = document.getElementById('hero-seat-select');
  if (select) {
    select.innerHTML = '';
    AppState.seats.forEach((s, i) => {
      const opt = document.createElement('option');
      opt.value = i;
      opt.textContent = `${s.name} (${getPositionName(i)})`;
      if (i === tempHeroSetup.heroSeatIndex) opt.selected = true;
      select.appendChild(opt);
    });

    select.onchange = (e) => {
      tempHeroSetup.heroSeatIndex = parseInt(e.target.value);
      renderHeroSetupUI();
    };
  }

  ['hero-card1', 'hero-card2'].forEach((id, idx) => {
    const el = document.getElementById(id);
    if (!el) return;
    const cardStr = tempHeroSetup.heroCards[idx];
    if (cardStr) {
      const suitChar = cardStr.slice(-1);
      const suitClassMap = { s: 'spades', h: 'hearts', d: 'diamonds', c: 'clubs' };
      el.textContent = formatCardDisplay(cardStr);
      el.className = `card-slot ${suitClassMap[suitChar] || ''}`;
    } else {
      el.textContent = '?';
      el.className = 'card-slot';
    }
  });

  const list = document.getElementById('villains-setup-list');
  if (list) {
    list.innerHTML = '';
    AppState.seats.forEach((s, i) => {
      if (i === tempHeroSetup.heroSeatIndex) return;

      const vCards = tempHeroSetup.villainCards[i] || ['', ''];
      const row = document.createElement('div');
      row.style.cssText = 'background:var(--surface);border:1px solid var(--border);border-radius:6px;padding:6px 10px;display:flex;align-items:center;justify-content:space-between;gap:8px;';

      const card1Str = vCards[0] ? formatCardDisplay(vCards[0]) : '?';
      const card2Str = vCards[1] ? formatCardDisplay(vCards[1]) : '?';

      row.innerHTML = `
        <div style="display:flex;align-items:center;gap:6px;">
          <span style="font-size:.75rem;color:var(--text-sub);min-width:44px">${getPositionName(i)}</span>
          <span style="font-size:.82rem;font-weight:600">${s.name}</span>
        </div>
        <div style="display:flex;align-items:center;gap:6px;">
          <span style="font-size:.72rem;color:var(--text-sub)">手札(任意):</span>
          <div class="card-slot" onclick="openCardPicker('seat_${i}_card1')" style="width:36px;height:46px;font-size:.78rem;">${card1Str}</div>
          <div class="card-slot" onclick="openCardPicker('seat_${i}_card2')" style="width:36px;height:46px;font-size:.78rem;">${card2Str}</div>
        </div>`;
      list.appendChild(row);
    });
  }
}

function clearHeroCards() {
  tempHeroSetup.heroCards = ['', ''];
  renderHeroSetupUI();
}

function confirmHeroSetup() {
  if (!tempHeroSetup.heroCards[0] || !tempHeroSetup.heroCards[1]) {
    showError('★ Hero (自分) の手札を2枚選択してください (必須)');
    return;
  }

  AppState.heroSeatIndex = tempHeroSetup.heroSeatIndex;

  AppState.seats.forEach((s, i) => {
    s.isHero = (i === AppState.heroSeatIndex);
    if (i === AppState.heroSeatIndex) {
      s.holeCards = [...tempHeroSetup.heroCards];
    } else if (tempHeroSetup.villainCards[i]) {
      s.holeCards = [...tempHeroSetup.villainCards[i]];
    }
  });

  closeHeroSetupModal();
  renderAll();
  showError(`★ Heroを ${AppState.seats[AppState.heroSeatIndex].name} (${getPositionName(AppState.heroSeatIndex)}) [${formatCardDisplay(AppState.seats[AppState.heroSeatIndex].holeCards[0])} ${formatCardDisplay(AppState.seats[AppState.heroSeatIndex].holeCards[1])}] に確定しました`);
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

  const usedCards = new Set();
  AppState.board.filter(c => c).forEach(c => usedCards.add(c));
  tempHeroSetup.heroCards.filter(c => c).forEach(c => usedCards.add(c));
  Object.values(tempHeroSetup.villainCards).forEach(pair => {
    if (pair) pair.filter(c => c).forEach(c => usedCards.add(c));
  });
  AppState.seats.forEach(s => {
    if (s.holeCards) s.holeCards.filter(c => c).forEach(c => usedCards.add(c));
  });

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

  const boardMap = { flop1:0, flop2:1, flop3:2, turn:3, river:4 };
  const heroSeat = AppState.seats[AppState.heroSeatIndex];

  if (boardMap[activePickerSlot] !== undefined) {
    AppState.board[boardMap[activePickerSlot]] = cardCode;
    renderBoard();
  } else if (activePickerSlot === 'hero1') {
    if (heroSeat) {
      if (!heroSeat.holeCards) heroSeat.holeCards = ['', ''];
      heroSeat.holeCards[0] = cardCode;
    }
    renderAll();
  } else if (activePickerSlot === 'hero2') {
    if (heroSeat) {
      if (!heroSeat.holeCards) heroSeat.holeCards = ['', ''];
      heroSeat.holeCards[1] = cardCode;
    }
    renderAll();
  } else if (activePickerSlot.startsWith('seat_')) {
    const parts = activePickerSlot.split('_');
    const sIdx = parseInt(parts[1]);
    const cIdx = parts[2] === 'card1' ? 0 : 1;
    if (AppState.seats[sIdx]) {
      if (!AppState.seats[sIdx].holeCards) AppState.seats[sIdx].holeCards = ['', ''];
      AppState.seats[sIdx].holeCards[cIdx] = cardCode;
    }
    renderAll();
  }

  closeCardPicker();
}

function clearHeroCards() {
  const heroSeat = AppState.seats[AppState.heroSeatIndex];
  if (heroSeat) heroSeat.holeCards = ['', ''];
  renderAll();
}

function clearSeatCards(seatIdx) {
  if (AppState.seats[seatIdx]) {
    AppState.seats[seatIdx].holeCards = ['', ''];
  }
  renderAll();
}
window.clearSeatCards = clearSeatCards;

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
  const boardMap = { flop1:0, flop2:1, flop3:2, turn:3, river:4 };
  if (boardMap[activePickerSlot] !== undefined) {
    AppState.board[boardMap[activePickerSlot]] = '';
    renderBoard();
  } else if (activePickerSlot === 'hero1') {
    tempHeroSetup.heroCards[0] = '';
    renderHeroSetupUI();
  } else if (activePickerSlot === 'hero2') {
    tempHeroSetup.heroCards[1] = '';
    renderHeroSetupUI();
  } else if (activePickerSlot.startsWith('seat_')) {
    const parts = activePickerSlot.split('_');
    const sIdx = parseInt(parts[1]);
    const cIdx = parts[2] === 'card1' ? 0 : 1;
    if (tempHeroSetup.villainCards[sIdx]) tempHeroSetup.villainCards[sIdx][cIdx] = '';
    renderHeroSetupUI();
  }

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
    boardSnapshot: [...AppState.board],
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
// 📚 ハンド履歴ライブラリ (一覧・閲覧・共有・エクスポート・削除)
// ===================================================

async function openHistoryModal() {
  const modal = document.getElementById('history-modal');
  if (modal) modal.classList.remove('hidden');
  await renderSavedHandsList();
}

function closeHistoryModal() {
  const modal = document.getElementById('history-modal');
  if (modal) modal.classList.add('hidden');
}

async function renderSavedHandsList() {
  const container = document.getElementById('saved-hands-container');
  if (!container) return;

  container.innerHTML = '<div style="color:var(--text-sub);font-size:.8rem;padding:8px;">読み込み中...</div>';

  try {
    const hands = await fetchAllHandsFromDB();
    if (hands.length === 0) {
      container.innerHTML = '<div style="color:var(--text-sub);font-size:.82rem;padding:16px;text-align:center;background:var(--surface);border-radius:8px;">保存されているハンド履歴はありません</div>';
      return;
    }

    container.innerHTML = '';
    // 最新順（降順）
    [...hands].reverse().forEach((hand) => {
      const card = document.createElement('div');
      card.style.cssText = 'background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:12px;display:flex;flex-direction:column;gap:8px;';

      const dateStr = hand.savedAt ? new Date(hand.savedAt).toLocaleString('ja-JP') : `Hand #${hand.id}`;
      const heroSeat = hand.seats ? hand.seats[hand.heroSeatIndex] : null;
      const heroCardsStr = (heroSeat && heroSeat.holeCards) 
        ? heroSeat.holeCards.map(formatCardDisplay).join(' ') 
        : '[ ? ? ]';

      const potVal = hand.pot ? formatAmount(hand.pot.main) : '--';
      const winnerName = (hand.winnerIndex !== undefined && hand.seats && hand.seats[hand.winnerIndex])
        ? hand.seats[hand.winnerIndex].name
        : '完了ハンド';

      card.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <span style="font-weight:700;font-size:.85rem;color:var(--accent);">📅 ${dateStr} (${hand.seatCount || 6}-Max)</span>
          <span style="font-size:.78rem;color:var(--yellow);font-weight:700;">Pot: ${potVal}</span>
        </div>
        <div style="font-size:.8rem;color:var(--text-sub);display:flex;gap:12px;">
          <span>Hero: <b style="color:var(--yellow);">${heroCardsStr}</b></span>
          <span>勝者: <b style="color:var(--green);">${winnerName}</b></span>
        </div>
        <div style="display:flex;gap:8px;margin-top:4px;">
          <button onclick="loadHandAndPlay(${hand.id})" style="flex:1;background:var(--green);color:#fff;border:none;border-radius:6px;padding:6px;font-size:.78rem;font-weight:700;cursor:pointer;">
            🎬 再生・読み込み
          </button>
          <button onclick="copySingleHandText(${hand.id})" style="background:var(--surface2);color:var(--text);border:1px solid var(--border);border-radius:6px;padding:6px 10px;font-size:.78rem;cursor:pointer;">
            📋 JSONコピー
          </button>
          <button onclick="deleteHandAndRefresh(${hand.id})" style="background:transparent;color:var(--red);border:1px solid var(--red);border-radius:6px;padding:6px 10px;font-size:.78rem;cursor:pointer;">
            🗑️ 削除
          </button>
        </div>
      `;
      container.appendChild(card);
    });
  } catch (e) {
    container.innerHTML = `<div style="color:var(--red);font-size:.8rem;">読み込みエラー: ${e.message}</div>`;
  }
}

async function loadHandAndPlay(handId) {
  const hands = await fetchAllHandsFromDB();
  const target = hands.find(h => h.id === handId);
  if (!target) return;
  loadHandFromData(target);
  closeHistoryModal();
  switchToTableView();
}

async function copySingleHandText(handId) {
  const hands = await fetchAllHandsFromDB();
  const target = hands.find(h => h.id === handId);
  if (!target) return;
  const jsonStr = JSON.stringify(target, null, 2);
  navigator.clipboard.writeText(jsonStr).then(() => {
    showError('📋 ハンドのJSONデータをクリップボードにコピーしました！');
  });
}

async function deleteHandAndRefresh(handId) {
  if (!confirm('このハンド履歴を削除しますか？')) return;
  await deleteHandFromDB(handId);
  await renderSavedHandsList();
  showError('🗑️ ハンド履歴を削除しました');
}

window.openHistoryModal = openHistoryModal;
window.closeHistoryModal = closeHistoryModal;
window.loadHandAndPlay = loadHandAndPlay;
window.copySingleHandText = copySingleHandText;
window.deleteHandAndRefresh = deleteHandAndRefresh;

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
    this.index = index;
    if (step.potSnapshot) AppState.pot = JSON.parse(JSON.stringify(step.potSnapshot));
    if (step.boardSnapshot) AppState.board = [...step.boardSnapshot];
    if (step.stackSnapshot) {
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
    }
    if (step.street) AppState.street = step.street;
    if (step.currentSeatIndex !== undefined) AppState.currentSeatIndex = step.currentSeatIndex;
    renderAll();
    ['replay-bar', 'replay-bar-m'].forEach(id => {
      const bar = document.getElementById(id);
      if (bar) bar.value = index;
    });
  },

  setSpeed(s) { this.speed = s; },
};
window.Replay = Replay;

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
    const isHero = (i === AppState.heroSeatIndex);
    const isActiveTurn = (i === AppState.currentSeatIndex && !seat.isFolded && !seat.isAway);

    el.classList.toggle('is-hero', isHero);
    el.classList.toggle('active-turn', isActiveTurn);

    let pointerTag = el.querySelector('.turn-pointer-tag');
    if (isActiveTurn) {
      if (!pointerTag) {
        pointerTag = document.createElement('div');
        pointerTag.className = 'turn-pointer-tag';
        pointerTag.textContent = isHero ? '👉 YOUR TURN' : '👉 TURN';
        el.appendChild(pointerTag);
      } else {
        pointerTag.textContent = isHero ? '👉 YOUR TURN' : '👉 TURN';
      }
    } else if (pointerTag) {
      pointerTag.remove();
    }

    let heroTag = el.querySelector('.hero-badge-tag');
    if (isHero) {
      if (!heroTag) {
        heroTag = document.createElement('div');
        heroTag.className = 'hero-badge-tag';
        heroTag.textContent = 'HERO';
        el.appendChild(heroTag);
      }
    } else if (heroTag) {
      heroTag.remove();
    }

    let cardsBadge = el.querySelector('.seat-cards-badge');
    if (!cardsBadge) {
      cardsBadge = document.createElement('div');
      cardsBadge.className = 'seat-cards-badge';
      el.appendChild(cardsBadge);
    }

    if (seat.holeCards && seat.holeCards.filter(c => c).length > 0) {
      cardsBadge.innerHTML = seat.holeCards.map(cardStr => {
        if (!cardStr) return '';
        const rankStr = cardStr.slice(0, -1).replace('T', '10');
        const suitChar = cardStr.slice(-1);
        const suitMap = { s: '♠', h: '♥', d: '♦', c: '♣' };
        const suitClassMap = { s: 'spades', h: 'hearts', d: 'diamonds', c: 'clubs' };
        return `<span class="mini-card ${suitClassMap[suitChar] || ''}">${rankStr}${suitMap[suitChar] || ''}</span>`;
      }).join('');
    } else {
      cardsBadge.innerHTML = '';
    }

    el.querySelector('.seat-name').textContent = seat.name;
    el.querySelector('.seat-stack').textContent = formatAmount(seat.stack);
    el.querySelector('.seat-bet').textContent = seat.betAmount > 0 ? formatAmount(seat.betAmount) : '';
    el.querySelector('.seat-action').textContent = seat.action ? seat.action.toUpperCase() : '';
    el.querySelector('.seat-pos').textContent = getPositionName(i);
    el.classList.toggle('away', seat.isAway);
    el.classList.toggle('folded', seat.isFolded);
    el.classList.toggle('all-in', seat.isAllIn);
  });
}

function renderTimeline() {
  ['action-timeline', 'action-timeline-m'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.innerHTML = '';

    if (!AppState.history || AppState.history.length === 0) {
      el.innerHTML = '<div style="font-size:.74rem;color:var(--text-sub);padding:4px;">まだアクション履歴がありません</div>';
      return;
    }

    let lastStreet = '';
    AppState.history.forEach((step) => {
      if (step.street !== lastStreet) {
        const label = document.createElement('div');
        label.style.cssText = 'font-size:.7rem;font-weight:800;color:var(--accent);margin:6px 0 3px 0;text-transform:uppercase;border-bottom:1px solid var(--border);padding-bottom:2px;';
        label.textContent = `--- ${step.street.toUpperCase()} ---`;
        el.appendChild(label);
        lastStreet = step.street;
      }
      const seat = AppState.seats[step.seatIndex];
      const seatName = seat ? `${seat.name} (${getPositionName(step.seatIndex)})` : `Seat ${step.seatIndex + 1}`;
      const item = document.createElement('div');
      item.style.cssText = 'display:flex;justify-content:space-between;align-items:center;font-size:.76rem;padding:3px 4px;border-bottom:1px solid rgba(255,255,255,0.05);';
      
      const actionColorMap = {
        fold: 'var(--text-sub)',
        check: 'var(--text)',
        call: 'var(--green)',
        raise: 'var(--yellow)',
        allin: 'var(--red)',
        'all-in': 'var(--red)'
      };
      const actColor = actionColorMap[step.action] || 'var(--text)';

      item.innerHTML = `
        <span style="color:var(--text);font-weight:600;">${seatName}</span>
        <span style="color:${actColor};font-weight:800;">${step.action.toUpperCase()} ${step.amount > 0 ? formatAmount(step.amount) : ''}</span>
      `;
      el.appendChild(item);
    });
    el.scrollTop = el.scrollHeight;
  });
}
window.renderTimeline = renderTimeline;

function renderAll() {
  renderSeats();
  renderBoard();
  renderPot();
  renderActionPanel();
  renderStreetBadge();
  renderTimeline();
  if (typeof renderSeatConfigUI === 'function') {
    renderSeatConfigUI();
  }
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
  const currSeat = AppState.seats[AppState.currentSeatIndex];
  const callAmt = currSeat ? getCallAmount(AppState.currentSeatIndex) : 0;

  if (callBtn) {
    callBtn.textContent = callAmt > 0 ? `CALL ${formatAmount(callAmt)}` : 'CHECK';
  }
  if (minLabel) {
    minLabel.textContent = `Min Raise: ${formatAmount(AppState.minRaise)}`;
  }

  const turnNameStr = currSeat
    ? `${currSeat.name} (${getPositionName(AppState.currentSeatIndex)})${currSeat.isHero ? ' ★HERO' : ''}`
    : 'ハンド終了';
  const callTextStr = currSeat
    ? (callAmt > 0 ? `CALL: ${formatAmount(callAmt)}` : 'CHECK 可能')
    : '--';
  const streetTextStr = AppState.street.toUpperCase();

  ['pc', 'm'].forEach(suffix => {
    const nameEl = document.getElementById(`turn-seat-name-${suffix}`);
    const callEl = document.getElementById(`turn-call-label-${suffix}`);
    const streetEl = document.getElementById(`turn-street-label-${suffix}`);
    if (nameEl) nameEl.textContent = turnNameStr;
    if (callEl) callEl.textContent = callTextStr;
    if (streetEl) streetEl.textContent = streetTextStr;
  });
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

  if (!candidates || candidates.length === 0) {
    candidates = AppState.seats.filter(s => !s.isFolded && !s.isAway).map(s => s.id);
  }

  candidates.forEach((idx, i) => {
    const seat = AppState.seats[idx];
    if (!seat) return;

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'winner-btn';
    btn.dataset.seat = idx;

    btn.innerHTML = `
      <span>${seat.name} (${getPositionName(idx)})</span>
      <span class="winner-btn-check">✓</span>`;

    btn.addEventListener('click', (e) => {
      e.preventDefault();
      btn.classList.toggle('selected');
    });

    // 1人だけ残っている場合は自動的に選択状態
    if (candidates.length === 1) {
      btn.classList.add('selected');
    }

    list.appendChild(btn);
  });

  modal.classList.remove('hidden');
}

function selectHeroSeat(idx) {
  AppState.heroSeatIndex = idx;
  AppState.seats.forEach((s, seatIdx) => {
    s.isHero = (seatIdx === idx);
  });
  if (AppState.history.length === 0) {
    AppState.currentSeatIndex = getPreflopFirstSeat();
  }
  renderAll();
  showError(`★ Hero(自分)の位置を ${getPositionName(idx)} に指定しました`);
}
window.selectHeroSeat = selectHeroSeat;

function renderSeatConfigUI() {
  const isBBUnit = AppState.blind.displayUnit === 'bb';
  const bbVal = AppState.blind.bb || 1;

  ['seat-config-list', 'seat-config-list-m'].forEach(listId => {
    const list = document.getElementById(listId);
    if (!list) return;
    list.innerHTML = '';

    AppState.seats.forEach((seat, i) => {
      const isHero = (i === AppState.heroSeatIndex);
      const displayStackVal = isBBUnit ? (seat.stack / bbVal).toFixed(1) : seat.stack;
      const item = document.createElement('div');
      item.className = `seat-config-item ${isHero ? 'is-hero' : ''}`;
      item.style.cssText = isHero 
        ? 'background:#241d0c;border:2px solid var(--yellow);border-radius:8px;padding:10px 12px;margin-bottom:10px;box-shadow:0 2px 8px rgba(210,153,34,0.25);' 
        : 'background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:10px 12px;margin-bottom:10px;';
      
      const c1 = seat.holeCards?.[0];
      const c2 = seat.holeCards?.[1];
      const card1Val = (c1 && c1 !== '') ? formatCardDisplay(c1) : '?';
      const card2Val = (c2 && c2 !== '') ? formatCardDisplay(c2) : '?';
      const slot1Target = isHero ? 'hero1' : `seat_${i}_card1`;
      const slot2Target = isHero ? 'hero2' : `seat_${i}_card2`;

      item.innerHTML = `
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;gap:8px;">
          <div style="display:flex;align-items:center;gap:6px;">
            <span style="font-weight:800;font-size:.9rem;color:${isHero ? 'var(--yellow)' : 'var(--text)'};">
              ${getPositionName(i)}
            </span>
            ${isHero ? '<span style="background:var(--yellow);color:#000;font-size:.68rem;font-weight:800;padding:2px 6px;border-radius:4px;">★ HERO (自分)</span>' : ''}
          </div>
          <div style="display:flex;gap:6px;">
            ${!isHero ? `<button onclick="selectHeroSeat(${i})" style="background:var(--surface2);color:var(--yellow);border:1.5px solid var(--yellow);border-radius:4px;padding:4px 10px;font-size:.75rem;font-weight:800;cursor:pointer;">★ 自分(Hero)に指定</button>` : ''}
            <button class="away-toggle ${seat.isAway ? 'away-on' : ''}" data-seat="${i}" style="padding:4px 8px;font-size:.72rem;border-radius:4px;cursor:pointer;">
              ${seat.isAway ? '離席中' : '在席'}
            </button>
          </div>
        </div>

        <div style="display:flex;gap:8px;align-items:center;margin-bottom:8px;">
          <input type="text" value="${seat.name}" data-seat="${i}" class="player-name-input" placeholder="名前" style="flex:1;min-width:0;padding:6px 8px;font-size:.8rem;background:var(--surface2);border:1px solid var(--border);border-radius:5px;color:var(--text);">
          <div style="display:flex;align-items:center;gap:4px;">
            <input type="number" value="${displayStackVal}" data-seat="${i}" class="stack-input" min="0" step="1" title="${isBBUnit ? 'スタック(BB数)' : 'スタック(金額)'}" style="width:75px;padding:6px 6px;font-size:.8rem;background:var(--surface2);border:1px solid var(--border);border-radius:5px;color:var(--text);text-align:right;">
            <span style="font-size:.72rem;color:var(--text-sub);">${isBBUnit ? 'BB' : ''}</span>
          </div>
        </div>

        <div style="display:flex;align-items:center;gap:8px;background:var(--surface2);padding:6px 10px;border-radius:6px;border:1px solid ${isHero ? 'rgba(210,153,34,0.4)' : 'var(--border)'};">
          <span style="font-size:.76rem;font-weight:700;color:${isHero ? 'var(--yellow)' : 'var(--text-sub)'};min-width:70px;">
            ${isHero ? '★手札(必須):' : '手札(任意):'}
          </span>
          <div class="card-slot ${(c1 && c1 !== '') ? 'filled' : ''}" onclick="openCardPicker('${slot1Target}')" style="width:36px;height:46px;font-size:.82rem;cursor:pointer;border:1.5px solid var(--border);border-radius:5px;display:flex;align-items:center;justify-content:center;background:var(--surface);">
            ${card1Val}
          </div>
          <div class="card-slot ${(c2 && c2 !== '') ? 'filled' : ''}" onclick="openCardPicker('${slot2Target}')" style="width:36px;height:46px;font-size:.82rem;cursor:pointer;border:1.5px solid var(--border);border-radius:5px;display:flex;align-items:center;justify-content:center;background:var(--surface);">
            ${card2Val}
          </div>
          <button onclick="${isHero ? 'clearHeroCards()' : `clearSeatCards(${i})`}" style="padding:4px 8px;background:transparent;border:1px solid var(--border);border-radius:4px;font-size:.72rem;color:var(--red);cursor:pointer;margin-left:auto;">クリア</button>
        </div>`;
      list.appendChild(item);
    });

    list.querySelectorAll('.player-name-input').forEach(input => {
      input.addEventListener('change', e => {
        const idx = parseInt(input.dataset.seat);
        AppState.seats[idx].name = e.target.value;
        renderSeats();
      });
    });

    list.querySelectorAll('.stack-input').forEach(input => {
      input.addEventListener('change', e => {
        const idx = parseInt(input.dataset.seat);
        const val = parseFloat(e.target.value) || 0;
        AppState.seats[idx].stack = isBBUnit ? val * bbVal : val;
        renderSeats();
      });
    });

    list.querySelectorAll('.away-toggle').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.seat);
        AppState.seats[idx].isAway = !AppState.seats[idx].isAway;
        renderSeatConfigUI();
        renderSeats();
      });
    });
  });
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

  // Note: btn-fold, btn-call, btn-allin は HTML 側の onclick で呼び出されているため重複イベント登録を回避

  document.getElementById('btn-raise-confirm')?.addEventListener('click', () => {
    const val = parseFloat(document.getElementById('raise-input').value);
    if (val && !isNaN(val)) actionRaise(val);
  });

  document.getElementById('raise-input')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const val = parseFloat(e.target.value);
      if (val && !isNaN(val)) actionRaise(val);
    }
  });

  document.querySelectorAll('.raise-mult').forEach(btn => {
    btn.addEventListener('click', () => {
      const mult = parseFloat(btn.dataset.mult);
      if (isNaN(mult)) return;
      const maxBet = Math.max(...AppState.seats.map(s => s.betAmount));
      const raiseAmount = maxBet + Math.max(AppState.lastRaiseDelta, AppState.blind.bb) * mult;
      actionRaise(parseFloat(raiseAmount.toFixed(1)));
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

function openManualModal() {
  const modal = document.getElementById('manual-modal');
  if (modal) modal.classList.remove('hidden');
}

function closeManualModal() {
  const modal = document.getElementById('manual-modal');
  if (modal) modal.classList.add('hidden');
}

// グローバル関数バインド（ボタンイベント確実に発火）
window.openManualModal = openManualModal;
window.closeManualModal = closeManualModal;
window.confirmWinner = confirmWinner;
window.actionFold = actionFold;
window.actionCheck = actionCheck;
window.actionCall = actionCall;
window.actionRaise = actionRaise;
window.actionAllIn = actionAllIn;
window.actionUndo = undoAction;
window.startNewHand = startNewHand;
window.openHeroSetupModal = openHeroSetupModal;
window.closeHeroSetupModal = closeHeroSetupModal;
window.confirmHeroSetup = confirmHeroSetup;
window.clearHeroCards = clearHeroCards;
window.openCardPicker = openCardPicker;
window.closeCardPicker = closeCardPicker;
window.switchToTableView = function() {
  const heroSeat = AppState.seats[AppState.heroSeatIndex];
  if (!heroSeat || !heroSeat.holeCards || heroSeat.holeCards.filter(c => c !== '').length < 2) {
    showError('⚠️ 【手札未選択】 自分(Hero)の手札2枚をタップして選択してください');
    return;
  }
  document.getElementById('view-input-mode')?.classList.add('hidden');
  document.getElementById('view-table-mode')?.classList.remove('hidden');
  renderAll();
  Replay.index = 0;
  Replay.stepTo(0);
};
window.switchToInputView = function() {
  document.getElementById('view-table-mode')?.classList.add('hidden');
  document.getElementById('view-input-mode')?.classList.remove('hidden');
  renderAll();
};
window.applyManualCardInput = applyManualCardInput;
window.clearCurrentCardSlot = clearCurrentCardSlot;
window.copyHandText = copyHandText;
window.exportHandsJSON = exportHandsJSON;
window.importHandsJSON = importHandsJSON;
window.loadHandFromData = loadHandFromData;
window.deleteSavedHand = deleteSavedHand;

// ===================================================
// Step 5: テーブルリプレイのアニメーション動画エクスポート (.webm/.mp4)
// ===================================================

async function exportTableVideo() {
  if (!window.MediaRecorder) {
    showError('⚠️ お使いのブラウザは画面動画キャプチャ(MediaRecorder)に対応していません');
    return;
  }

  // 画面2(テーブル画面)へ遷移
  const tableModeEl = document.getElementById('view-table-mode');
  if (tableModeEl && tableModeEl.classList.contains('hidden')) {
    switchToTableView();
  }

  showError('🎬 【動画書き出し開始】 アニメーションを録画しています。完了までお待ちください...');

  // 1. キャプチャ用 Offscreen/Onscreen Canvas の準備 (600x600 高画質)
  const canvas = document.createElement('canvas');
  canvas.width = 600;
  canvas.height = 600;
  const ctx = canvas.getContext('2d');

  // 2. 毎フレーム Canvas レンダリング関数
  function drawCanvasFrame() {
    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, 600, 600);

    // ポーカー卓 (緑のフェルト)
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(300, 300, 260, 190, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#0f5132';
    ctx.fill();
    ctx.lineWidth = 10;
    ctx.strokeStyle = '#2d1b0f';
    ctx.stroke();

    ctx.beginPath();
    ctx.ellipse(300, 300, 240, 170, 0, 0, Math.PI * 2);
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.stroke();
    ctx.restore();

    // 中央ボードカード
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    AppState.board.forEach((c, i) => {
      const x = 200 + i * 42;
      const y = 285;
      ctx.fillStyle = c ? '#161b22' : '#21262d';
      ctx.strokeStyle = '#30363d';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(x, y, 36, 48, 5);
      ctx.fill();
      ctx.stroke();

      if (c) {
        const rankStr = c.slice(0, -1).replace('T', '10');
        const suitChar = c.slice(-1);
        const isRed = suitChar === 'h' || suitChar === 'd';
        ctx.fillStyle = isRed ? '#f85149' : '#e6edf3';
        const suitMap = { s: '♠', h: '♥', d: '♦', c: '♣' };
        ctx.fillText(`${rankStr}${suitMap[suitChar]||''}`, x + 18, y + 28);
      } else {
        ctx.fillStyle = '#8b949e';
        ctx.fillText('?', x + 18, y + 28);
      }
    });

    // ポット表示
    ctx.fillStyle = '#d29922';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText(`Main Pot: ${formatAmount(AppState.pot.main)}`, 300, 260);

    // 座席配置
    const seatCount = AppState.seatCount;
    AppState.seats.forEach((seat, i) => {
      const angle = (i / seatCount) * Math.PI * 2 + Math.PI / 2;
      const rx = 240;
      const ry = 170;
      const sx = 300 + rx * Math.cos(angle);
      const sy = 300 + ry * Math.sin(angle);

      // 座席サークル
      const isCurrent = (i === AppState.currentSeatIndex);
      ctx.fillStyle = isCurrent ? '#d29922' : '#161b22';
      ctx.strokeStyle = seat.isHero ? '#d29922' : '#30363d';
      ctx.lineWidth = seat.isHero ? 3 : 2;
      ctx.beginPath();
      ctx.arc(sx, sy, 34, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // プレイヤー名 ＆ スタック
      ctx.fillStyle = isCurrent ? '#000000' : '#e6edf3';
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText(seat.name.slice(0, 8), sx, sy - 6);

      ctx.fillStyle = isCurrent ? '#111111' : '#8b949e';
      ctx.font = '10px sans-serif';
      ctx.fillText(`${formatAmount(seat.stack)}`, sx, sy + 10);

      // ベット額
      if (seat.betAmount > 0) {
        const bx = sx + (300 - sx) * 0.25;
        const by = sy + (300 - sy) * 0.25;
        ctx.fillStyle = '#3fb950';
        ctx.font = 'bold 11px sans-serif';
        ctx.fillText(`${formatAmount(seat.betAmount)}`, bx, by);
      }
    });
  }

  // 3. MediaRecorder の初期化 (WebM/MP4)
  const stream = canvas.captureStream(30);
  let mimeType = 'video/webm;codecs=vp9';
  if (!MediaRecorder.isTypeSupported(mimeType)) {
    mimeType = MediaRecorder.isTypeSupported('video/webm') ? 'video/webm' : 'video/mp4';
  }

  const recorder = new MediaRecorder(stream, { mimeType });
  const chunks = [];
  recorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };

  recorder.onstop = () => {
    clearInterval(renderInterval);
    const blob = new Blob(chunks, { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const ext = mimeType.includes('mp4') ? 'mp4' : 'webm';
    a.href = url;
    a.download = `poker_hand_replay_${Date.now()}.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showError('✅ 【動画書き出し完了】 リプレイ動画ファイルを保存しました！');
  };

  // 4. 録画と自動リプレイ開始
  recorder.start();
  Replay.index = 0;
  Replay.stepTo(0);

  const renderInterval = setInterval(() => {
    drawCanvasFrame();
  }, 1000 / 30);

  let stepCounter = 0;
  const playInterval = setInterval(() => {
    stepCounter++;
    if (stepCounter < AppState.history.length) {
      Replay.stepTo(stepCounter);
    } else {
      clearInterval(playInterval);
      setTimeout(() => {
        recorder.stop();
      }, 1200);
    }
  }, 800);
}

window.exportTableVideo = exportTableVideo;
window.toggleRaisePanel = toggleRaisePanel;
window.setPotRaise = setPotRaise;

window.addEventListener('DOMContentLoaded', init);

