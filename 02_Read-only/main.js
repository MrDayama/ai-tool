// import { generateContinuation, finalizeStory } from './ai.js';
// 注: サーバー不要で動かすために import をコメントアウトしました。
// ai.js の関数はグローバルに定義されています。

// --- State Management ---
let players = [];
let currentPlayerIndex = 0;
let storyLog = [];
const MAX_TURNS_PER_PLAYER = 2; // 各プレイヤーが何回回ったら終了か
let totalTurnsCompleted = 0;

// --- DOM Elements ---
const screens = {
    setup: document.getElementById('screen-setup'),
    game: document.getElementById('screen-game'),
    result: document.getElementById('screen-result')
};

const setupUI = {
    input: document.getElementById('player-name-input'),
    btnAdd: document.getElementById('btn-add-player'),
    list: document.getElementById('player-list-chips'),
    btnStart: document.getElementById('btn-start-game')
};

const gameUI = {
    playerDisplay: document.getElementById('current-player-display'),
    log: document.getElementById('story-log'),
    input: document.getElementById('story-input'),
    btnSubmit: document.getElementById('btn-submit-story'),
    loading: document.getElementById('ai-loading'),
    firstSentence: document.getElementById('first-sentence')
};

const resultUI = {
    title: document.getElementById('final-title'),
    content: document.getElementById('final-story-content')
};

// --- Initialization ---
function init() {
    setupEventListeners();
    storyLog.push(gameUI.firstSentence.textContent);
}

function setupEventListeners() {
    // Setup Screen
    setupUI.btnAdd.addEventListener('click', addPlayer);
    setupUI.input.addEventListener('keypress', (e) => { if (e.key === 'Enter') addPlayer(); });
    setupUI.btnStart.addEventListener('click', startGame);

    // Game Screen
    gameUI.btnSubmit.addEventListener('click', submitTurn);
    gameUI.input.addEventListener('keypress', (e) => { if (e.key === 'Enter') submitTurn(); });
}

// --- Setup Functions ---
function addPlayer() {
    const name = setupUI.input.value.trim();
    if (!name) return;
    if (players.includes(name)) {
        alert('同じ名前のプレイヤーがいます');
        return;
    }

    players.push(name);
    renderPlayerChips();
    setupUI.input.value = '';
    setupUI.btnStart.disabled = players.length < 2;
}

function renderPlayerChips() {
    setupUI.list.innerHTML = players.map(name => `
        <div class="glass-pane" style="padding: 0.5rem 1rem; display: flex; align-items: center; gap: 0.5rem;">
            <span>${name}</span>
            <span style="cursor: pointer; opacity: 0.5;" onclick="removePlayer('${name}')">×</span>
        </div>
    `).join('');
}

window.removePlayer = (name) => {
    players = players.filter(p => p !== name);
    renderPlayerChips();
    setupUI.btnStart.disabled = players.length < 2;
};

function startGame() {
    switchScreen('game');
    updateTurnDisplay();
}

// --- Game Functions ---
async function submitTurn() {
    const text = gameUI.input.value.trim();
    if (!text) return;

    // UI State: Loading
    gameUI.btnSubmit.disabled = true;
    gameUI.loading.style.display = 'block';
    const playerName = players[currentPlayerIndex];

    // 1. Add Player Input to Log
    addStorySegment(playerName, text, false);
    storyLog.push(text);
    gameUI.input.value = '';

    // 2. AI Contribution
    const fullStoryText = storyLog.join(' ');
    const aiText = await generateContinuation(fullStoryText, text);

    addStorySegment('AI', aiText, true);
    storyLog.push(aiText);

    // 3. Check for Game End
    totalTurnsCompleted++;
    if (totalTurnsCompleted >= players.length * MAX_TURNS_PER_PLAYER) {
        endGame();
    } else {
        // Next Turn
        currentPlayerIndex = (currentPlayerIndex + 1) % players.length;
        updateTurnDisplay();
        gameUI.btnSubmit.disabled = false;
        gameUI.loading.style.display = 'none';
    }
}

function addStorySegment(author, text, isAi) {
    const segment = document.createElement('div');
    segment.className = `story-segment ${isAi ? 'ai' : ''}`;
    segment.innerHTML = `
        <div class="player-info">${author}</div>
        <p>${text}</p>
    `;
    gameUI.log.appendChild(segment);
    gameUI.log.scrollTop = gameUI.log.scrollHeight;
}

function updateTurnDisplay() {
    gameUI.playerDisplay.textContent = `${players[currentPlayerIndex]} のターン`;
}

async function endGame() {
    gameUI.loading.style.display = 'block';
    gameUI.loading.querySelector('p').textContent = '物語を美しく整えています...';

    const finalResult = await finalizeStory(storyLog.join('\n'));

    resultUI.title.textContent = finalResult.title;
    resultUI.content.textContent = finalResult.content;

    switchScreen('result');
}

// --- Utilities ---
function switchScreen(screenName) {
    Object.keys(screens).forEach(key => {
        screens[key].classList.remove('active');
    });
    screens[screenName].classList.add('active');
}

init();
