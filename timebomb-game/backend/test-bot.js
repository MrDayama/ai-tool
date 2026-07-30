const { io } = require('socket.io-client');

const SERVER_URL = 'http://localhost:3001';
const PLAYERS = [
    { name: 'Alice', id: 'uuid-1', socket: null },
    { name: 'Bob', id: 'uuid-2', socket: null },
    { name: 'Charlie', id: 'uuid-3', socket: null },
    { name: 'Dave', id: 'uuid-4', socket: null }
];

let roomId = null;
let connectedCount = 0;

console.log('🤖 Starting Automated E2E Bot Test...');

// 1. 全員接続
PLAYERS.forEach(p => {
    p.socket = io(SERVER_URL, { reconnection: false });
    p.socket.on('connect', () => {
        connectedCount++;
        if (connectedCount === PLAYERS.length) {
            console.log('✅ All 4 bots connected.');
            startTestScenario();
        }
    });
});

function startTestScenario() {
    const host = PLAYERS[0];
    
    // ホストが部屋作成
    host.socket.emit('create_room', { nickname: host.name, playerId: host.id });
    
    host.socket.on('room_state', (state) => {
        if (!roomId && state.roomId) {
            roomId = state.roomId;
            console.log(`🏠 Room created: ${roomId}`);
            
            // 他の3人が参加
            for (let i = 1; i < PLAYERS.length; i++) {
                PLAYERS[i].socket.emit('join_room', { 
                    roomId: roomId, 
                    nickname: PLAYERS[i].name, 
                    playerId: PLAYERS[i].id 
                });
            }
        }
        
        // 4人揃ったらゲーム開始
        if (state.status === 'LOBBY' && state.players.length === 4 && state.hostId === host.id) {
            console.log('🎮 4 players in lobby. Host starting game...');
            // 少し待ってから開始（イベント順序担保）
            setTimeout(() => {
                host.socket.emit('start_game');
            }, 500);
        }
        
        if (state.status === 'PLAYING') {
            console.log(`▶️ Round ${state.currentRound} started. Turn: ${state.currentTurnId}`);
            
            // 手番のプレイヤーが自動で適当にカットする
            const turnPlayer = PLAYERS.find(p => p.id === state.currentTurnId);
            if (turnPlayer) {
                // 自分のカード以外を探す
                const targets = state.players.filter(p => p.id !== turnPlayer.id && p.hand.some(c => !c.isRevealed));
                if (targets.length > 0) {
                    const target = targets[0]; // 単純に最初の人の
                    const card = target.hand.find(c => !c.isRevealed);
                    
                    if (card) {
                        console.log(`✂️ ${turnPlayer.name} cuts ${target.name}'s card ${card.id}`);
                        setTimeout(() => {
                            turnPlayer.socket.emit('cut_wire', {
                                targetId: target.id,
                                cardId: card.id
                            });
                        }, 300);
                    }
                }
            }
        }
        
        if (state.status === 'POLICE_WON' || state.status === 'BOMBER_WON') {
            console.log(`🏁 Game Over! Status: ${state.status}`);
            console.log('✅ Test finished successfully.');
            process.exit(0);
        }
    });
}

// タイムアウト設定
setTimeout(() => {
    console.error('❌ Test timed out.');
    process.exit(1);
}, 10000);
