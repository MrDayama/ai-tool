const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const GameEngine = require('./gameEngine');

const app = express();
app.use(cors());

// ルートパス - ステータス表示
app.get('/', (req, res) => {
    const activeRooms = Object.keys(rooms).length;
    const totalPlayers = Object.values(rooms).reduce((sum, r) => sum + r.players.length, 0);
    res.status(200).send(`
        <!DOCTYPE html>
        <html><head><meta charset="utf-8"><title>TimeBomb Backend</title>
        <style>body{font-family:monospace;background:#1a1a2e;color:#0f0;padding:40px;text-align:center}
        h1{font-size:2rem}p{color:#aaa}span{color:#0ff}</style></head>
        <body><h1>💣 TimeBomb Backend Server</h1>
        <p>Status: <span>🟢 ONLINE</span></p>
        <p>Active Rooms: <span>${activeRooms}</span> | Players: <span>${totalPlayers}</span></p>
        <p style="margin-top:40px;color:#555">Socket.io endpoint ready for connections</p>
        </body></html>
    `);
});

// Render.com等の死活監視（スリープ防止/ヘルスチェック用）
app.get('/health', (req, res) => {
    res.status(200).send('OK');
});

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // Vercelなどあらゆるクライアントからの接続を許可
        methods: ["GET", "POST"]
    }
});

// メモリ上でルーム情報を管理
// 構造: { [roomId]: { players: [{id, name, socketId, connected}], hostId, engine: GameEngine } }
const rooms = {};

// プレイヤーIDと所属ルームIDのマッピング（再接続用）
// 構造: { [playerId]: { roomId, name } }
const playerSessionMap = {};

// ランダムなルームコード生成 (4桁大文字)
function generateRoomId() {
    let result = '';
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    for (let i = 0; i < 4; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    // 重複防止
    if (rooms[result]) return generateRoomId();
    return result;
}

// 特定ルームの全プレイヤーに、それぞれマスクされた最新状態を送信する
function broadcastRoomState(roomId) {
    const room = rooms[roomId];
    if (!room) return;

    room.players.forEach(player => {
        let state;
        if (room.engine) {
            // ゲーム中ならセキュリティフィルタリングされた状態
            state = room.engine.getFilteredState(player.id);
        } else {
            // ロビー待機中なら基本情報のみ
            state = {
                status: 'LOBBY',
                roomId: roomId,
                hostId: room.hostId,
                players: room.players.map(p => ({
                    id: p.id,
                    name: p.name,
                    connected: p.connected
                }))
            };
        }
        
        // 各プレイヤーの個別ソケットに送信
        if (player.socketId && player.connected) {
            io.to(player.socketId).emit('room_state', state);
        }
    });
}

// Botの手番を自動進行する処理
function triggerBotTurnIfNeeded(roomId) {
    const room = rooms[roomId];
    if (!room || !room.engine) return;

    const gameStatus = room.engine.getGameStatus();
    if (gameStatus !== 'PLAYING') return;

    const currentCutter = room.engine.players[room.engine.currentCutterIdx];
    const currentCutterRoomPlayer = room.players.find(p => p.id === currentCutter.id);

    if (currentCutterRoomPlayer && currentCutterRoomPlayer.isBot) {
        setTimeout(() => {
            const activeRoom = rooms[roomId];
            if (!activeRoom || !activeRoom.engine) return;
            if (activeRoom.engine.getGameStatus() !== 'PLAYING') return;

            const validTargets = activeRoom.engine.players.filter(p => 
                p.id !== currentCutter.id && p.cards.some(c => !c.isRevealed)
            );

            if (validTargets.length === 0) return;

            const randomTarget = validTargets[Math.floor(Math.random() * validTargets.length)];
            const unrevealedCards = randomTarget.cards.filter(c => !c.isRevealed);
            const randomCard = unrevealedCards[Math.floor(Math.random() * unrevealedCards.length)];

            try {
                const card = activeRoom.engine.cutWire(randomTarget.id, randomCard.id, currentCutter.id);
                console.log(`[Bot Turn] ${currentCutter.name} cut ${randomTarget.name}'s card (type: ${card.type})`);

                io.to(roomId).emit('wire_cut_animation', {
                    cutterId: currentCutter.id,
                    targetId: randomTarget.id,
                    cardId: randomCard.id,
                    type: card.type
                });

                setTimeout(() => {
                    broadcastRoomState(roomId);
                    triggerBotTurnIfNeeded(roomId);
                }, 600);
            } catch (err) {
                console.error(`Bot Turn Error: ${err.message}`);
            }
        }, 1200);
    }
}

io.on('connection', (socket) => {
    console.log(`Connected: ${socket.id}`);

    // 1. ルーム作成
    socket.on('create_room', ({ playerId, nickname }) => {
        const roomId = generateRoomId();
        
        rooms[roomId] = {
            players: [{
                id: playerId,
                name: nickname,
                socketId: socket.id,
                connected: true
            }],
            hostId: playerId,
            engine: null
        };

        playerSessionMap[playerId] = { roomId, name: nickname };
        socket.join(roomId);
        
        console.log(`Room Created: ${roomId} by ${nickname} (${playerId})`);
        broadcastRoomState(roomId);
    });

    // 2. ルーム参加
    socket.on('join_room', ({ roomId, playerId, nickname }) => {
        const cleanRoomId = roomId.trim().toUpperCase();
        const room = rooms[cleanRoomId];

        if (!room) {
            socket.emit('error', 'ルームが見つかりません。コードを確認してください。');
            return;
        }

        if (room.engine) {
            socket.emit('error', 'このルームはすでにゲームが開始されています。');
            return;
        }

        if (room.players.length >= 8) {
            socket.emit('error', 'ルームが満員です（最大8人）。');
            return;
        }

        // 既存プレイヤーか新規プレイヤーかチェック
        const existingPlayer = room.players.find(p => p.id === playerId);

        if (existingPlayer) {
            existingPlayer.socketId = socket.id;
            existingPlayer.connected = true;
        } else {
            room.players.push({
                id: playerId,
                name: nickname,
                socketId: socket.id,
                connected: true
            });
        }

        playerSessionMap[playerId] = { roomId: cleanRoomId, name: nickname };
        socket.join(cleanRoomId);

        console.log(`Player Joined: ${nickname} (${playerId}) to ${cleanRoomId}`);
        broadcastRoomState(cleanRoomId);
    });

    // 3. 再接続（セッション復旧）
    socket.on('reconnect_session', ({ playerId }) => {
        const session = playerSessionMap[playerId];
        if (!session) {
            socket.emit('reconnect_failed');
            return;
        }

        const room = rooms[session.roomId];
        if (!room) {
            // ルームが消去されている場合
            delete playerSessionMap[playerId];
            socket.emit('reconnect_failed');
            return;
        }

        const player = room.players.find(p => p.id === playerId);
        if (player) {
            player.socketId = socket.id;
            player.connected = true;
            socket.join(session.roomId);
            console.log(`Player Reconnected: ${player.name} (${playerId}) in ${session.roomId}`);
            
            socket.emit('reconnect_success', { roomId: session.roomId, nickname: player.name });
            broadcastRoomState(session.roomId);
        } else {
            socket.emit('reconnect_failed');
        }
    });

    // 4. ゲーム開始
    socket.on('start_game', () => {
        let foundRoomId = null;
        let requestPlayerId = null;

        for (const [rId, room] of Object.entries(rooms)) {
            const player = room.players.find(p => p.socketId === socket.id);
            if (player) {
                foundRoomId = rId;
                requestPlayerId = player.id;
                break;
            }
        }

        if (!foundRoomId) return;
        const room = rooms[foundRoomId];

        if (room.hostId !== requestPlayerId) {
            socket.emit('error', 'ゲームを開始できるのはホストのみです。');
            return;
        }

        if (room.players.length < 3) {
            socket.emit('error', 'ゲーム開始には最低3人のプレイヤーが必要です。');
            return;
        }

        try {
            const ids = room.players.map(p => p.id);
            const names = room.players.map(p => p.name);
            room.engine = new GameEngine(ids, names);
            
            console.log(`Game Started in Room: ${foundRoomId}`);
            broadcastRoomState(foundRoomId);

            // Botの手番チェック
            triggerBotTurnIfNeeded(foundRoomId);
        } catch (err) {
            socket.emit('error', `ゲーム開始エラー: ${err.message}`);
        }
    });

    // 4-A2. 次のゲーム（同じルーム・メンバーで再開）
    socket.on('restart_game', () => {
        let foundRoomId = null;
        let requestPlayerId = null;

        for (const [rId, room] of Object.entries(rooms)) {
            const player = room.players.find(p => p.socketId === socket.id);
            if (player) {
                foundRoomId = rId;
                requestPlayerId = player.id;
                break;
            }
        }

        if (!foundRoomId) return;
        const room = rooms[foundRoomId];

        if (room.hostId !== requestPlayerId) {
            socket.emit('error', '次のゲームを開始できるのはホストのみです。');
            return;
        }

        try {
            const ids = room.players.map(p => p.id);
            const names = room.players.map(p => p.name);
            room.engine = new GameEngine(ids, names);
            
            console.log(`Game Restarted in Room: ${foundRoomId}`);
            broadcastRoomState(foundRoomId);

            // Botの手番チェック
            triggerBotTurnIfNeeded(foundRoomId);
        } catch (err) {
            socket.emit('error', `ゲーム再開エラー: ${err.message}`);
        }
    });

    // 4-B. ダミーBot追加
    socket.on('add_bot', () => {
        let foundRoomId = null;
        let requestPlayerId = null;

        for (const [rId, room] of Object.entries(rooms)) {
            const player = room.players.find(p => p.socketId === socket.id);
            if (player) {
                foundRoomId = rId;
                requestPlayerId = player.id;
                break;
            }
        }

        if (!foundRoomId) return;
        const room = rooms[foundRoomId];

        if (room.hostId !== requestPlayerId) {
            socket.emit('error', 'Botを追加できるのはホストのみです。');
            return;
        }

        if (room.players.length >= 8) {
            socket.emit('error', 'ルームが満員です。');
            return;
        }

        const botNum = room.players.filter(p => p.isBot).length + 1;
        const botId = `bot-${Date.now()}-${botNum}`;
        const botName = `🤖 Bot ${botNum}`;

        room.players.push({
            id: botId,
            name: botName,
            socketId: null,
            connected: true,
            isBot: true
        });

        console.log(`Bot Added: ${botName} to ${foundRoomId}`);
        broadcastRoomState(foundRoomId);
    });

    // 5. ワイヤーカット（カードめくり）
    socket.on('cut_wire', ({ targetPlayerId, cardId }) => {
        let foundRoomId = null;
        let requestPlayerId = null;

        for (const [rId, room] of Object.entries(rooms)) {
            const player = room.players.find(p => p.socketId === socket.id);
            if (player) {
                foundRoomId = rId;
                requestPlayerId = player.id;
                break;
            }
        }

        if (!foundRoomId) return;
        const room = rooms[foundRoomId];

        if (!room.engine) {
            socket.emit('error', 'ゲームが開始されていません。');
            return;
        }

        try {
            const card = room.engine.cutWire(targetPlayerId, cardId, requestPlayerId);
            console.log(`Wire Cut in ${foundRoomId}: ${requestPlayerId} cut ${targetPlayerId}'s card (type: ${card.type})`);
            
            // 全員に結果アニメーションをトリガーするためのイベントを送信（カード位置を特定するため）
            io.to(foundRoomId).emit('wire_cut_animation', {
                cutterId: requestPlayerId,
                targetId: targetPlayerId,
                cardId: cardId,
                type: card.type
            });

            // 少し遅れて状態をブロードキャスト（フリップアニメーションと同期させるため）
            setTimeout(() => {
                broadcastRoomState(foundRoomId);
                triggerBotTurnIfNeeded(foundRoomId);
            }, 600);

        } catch (err) {
            socket.emit('error', err.message);
        }
    });

    // 6. 次のラウンドへ移行
    socket.on('next_round', () => {
        let foundRoomId = null;
        for (const [rId, room] of Object.entries(rooms)) {
            const player = room.players.find(p => p.socketId === socket.id);
            if (player) {
                foundRoomId = rId;
                break;
            }
        }

        if (!foundRoomId) return;
        const room = rooms[foundRoomId];

        if (!room.engine) return;

        try {
            room.engine.nextRound();
            console.log(`Next Round ${room.engine.currentRound} in ${foundRoomId}`);
            broadcastRoomState(foundRoomId);
        } catch (err) {
            socket.emit('error', err.message);
        }
    });

    // 7. 切断ハンドリング
    socket.on('disconnect', () => {
        console.log(`Disconnected: ${socket.id}`);
        
        // どの部屋のどのプレイヤーか特定する
        for (const [roomId, room] of Object.entries(rooms)) {
            const player = room.players.find(p => p.socketId === socket.id);
            if (player) {
                player.connected = false;
                console.log(`Player Offline: ${player.name} in Room ${roomId}`);

                // 30秒〜60秒の猶予を持たせる（切断猶予機能）
                setTimeout(() => {
                    const checkRoom = rooms[roomId];
                    if (!checkRoom) return;

                    const checkPlayer = checkRoom.players.find(p => p.id === player.id);
                    // まだオフラインのままなら退出または部屋解散の処理をする
                    if (checkPlayer && !checkPlayer.connected) {
                        console.log(`Player Timeout Exit: ${checkPlayer.name} from Room ${roomId}`);
                        
                        // プレイヤーを削除
                        checkRoom.players = checkRoom.players.filter(p => p.id !== checkPlayer.id);
                        delete playerSessionMap[checkPlayer.id];

                        if (checkRoom.players.length === 0) {
                            // 誰もいなくなったら部屋を消去
                            delete rooms[roomId];
                            console.log(`Room Deleted (Empty): ${roomId}`);
                        } else {
                            // ホストが切断した場合は他の人に引き継ぐ
                            if (checkRoom.hostId === checkPlayer.id) {
                                checkRoom.hostId = checkRoom.players[0].id;
                                console.log(`Host Transferred to: ${checkRoom.players[0].name} in Room ${roomId}`);
                            }
                            
                            // ゲーム中に誰かが抜けたらゲームが成り立たないので強制終了する
                            if (checkRoom.engine) {
                                checkRoom.engine = null; // ゲームエンジンを破棄してロビーに戻す
                                io.to(roomId).emit('game_aborted', `${checkPlayer.name}さんが切断したため、ゲームを中止してロビーに戻りました。`);
                            }
                            
                            broadcastRoomState(roomId);
                        }
                    }
                }, 30000); // 30秒待機
                
                broadcastRoomState(roomId);
                break;
            }
        }
    });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
