// タイムボム ゲーム人数別の初期設定
const GAME_CONFIG = {
    3: { police: 2, bomber: 1, scutes: 3, empty: 11 },
    4: { police: 3, bomber: 1, scutes: 4, empty: 15 },
    5: { police: 3, bomber: 2, scutes: 5, empty: 19 },
    6: { police: 4, bomber: 2, scutes: 6, empty: 23 },
    7: { police: 5, bomber: 2, scutes: 7, empty: 27 },
    8: { police: 5, bomber: 3, scutes: 8, empty: 31 }
};

// 配列シャッフルヘルパー
function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

class GameEngine {
    constructor(playerIds, playerNames) {
        this.playerCount = playerIds.length;
        this.config = GAME_CONFIG[this.playerCount];
        
        this.currentRound = 1;
        this.remainingCuts = this.playerCount;
        this.scutesFound = 0;
        this.scutesGoal = this.config.scutes;
        this.bombFound = false;
        
        // 最初のニッパー（手番）所持者はランダム
        this.currentCutterIdx = Math.floor(Math.random() * this.playerCount);

        // 1. 役職の決定
        const roles = [];
        for (let i = 0; i < this.config.police; i++) roles.push('POLICE');
        for (let i = 0; i < this.config.bomber; i++) roles.push('BOMBER');
        shuffle(roles);

        // 2. プレイヤー初期化
        this.players = playerIds.map((id, index) => ({
            id: id,
            name: playerNames[index] || `プレイヤー ${index + 1}`,
            role: roles[index],
            cards: []
        }));

        // 3. 全導線カードプールの作成
        this.cardsPool = [];
        let cardId = 1;
        for (let i = 0; i < this.config.scutes; i++) {
            this.cardsPool.push({ id: cardId++, type: 'scute', isRevealed: false });
        }
        this.cardsPool.push({ id: cardId++, type: 'boom', isRevealed: false });
        for (let i = 0; i < this.config.empty; i++) {
            this.cardsPool.push({ id: cardId++, type: 'safe', isRevealed: false });
        }

        // 初期配布
        this.dealCards();
    }

    // 導線カードの配布処理
    dealCards() {
        const unrevealedCards = this.cardsPool.filter(c => !c.isRevealed);
        shuffle(unrevealedCards);

        const cardsPerPlayer = unrevealedCards.length / this.playerCount;

        this.players.forEach((player, idx) => {
            player.cards = unrevealedCards.slice(idx * cardsPerPlayer, (idx + 1) * cardsPerPlayer);
            // 自分の前での位置がわからないようにさらにシャッフル
            shuffle(player.cards);
        });
    }

    // カードをめくる（カットする）
    cutWire(targetPlayerId, cardId, requestPlayerId) {
        // バリデーション
        const currentCutter = this.players[this.currentCutterIdx];
        if (currentCutter.id !== requestPlayerId) {
            throw new Error('あなたの手番ではありません。');
        }
        if (targetPlayerId === requestPlayerId) {
            throw new Error('自分のカードは選択できません。');
        }

        const targetPlayer = this.players.find(p => p.id === targetPlayerId);
        if (!targetPlayer) {
            throw new Error('対象のプレイヤーが見つかりません。');
        }

        const card = targetPlayer.cards.find(c => c.id === cardId);
        if (!card) {
            throw new Error('対象のカードが見つかりません。');
        }
        if (card.isRevealed) {
            throw new Error('すでにオープンされているカードです。');
        }

        // 処理実行
        card.isRevealed = true;
        this.remainingCuts--;

        // カードの種類判定
        if (card.type === 'scute') {
            this.scutesFound++;
        } else if (card.type === 'boom') {
            this.bombFound = true;
        }

        // 手番（ニッパー）の移動
        const nextCutterIdx = this.players.findIndex(p => p.id === targetPlayerId);
        this.currentCutterIdx = nextCutterIdx;

        return card; // めくられたカードの情報を返す
    }

    // 次のラウンドへ移行
    nextRound() {
        if (this.remainingCuts !== 0) {
            throw new Error('現在のラウンドがまだ終了していません。');
        }
        if (this.currentRound >= 4) {
            throw new Error('第4ラウンドが最終ラウンドです。次のラウンドはありません。');
        }
        if (this.scutesFound === this.scutesGoal || this.bombFound) {
            throw new Error('ゲームはすでに終了しています。');
        }

        this.currentRound++;
        this.remainingCuts = this.playerCount;
        this.dealCards();
    }

    // 勝敗・ステータス判定
    getGameStatus() {
        if (this.scutesFound === this.scutesGoal) {
            return 'POLICE_WON';
        }
        if (this.bombFound) {
            return 'BOMBER_WON';
        }
        if (this.remainingCuts === 0) {
            if (this.currentRound === 4) {
                return 'BOMBER_WON'; // 第4ラウンド終了時に解除しきれず爆発
            }
            return 'ROUND_END'; // ラウンドのカードを配り直す必要がある状態
        }
        return 'PLAYING';
    }

    // セキュリティフィルタリングされたゲーム状態をクライアントに返す
    getFilteredState(playerId) {
        const gameStatus = this.getGameStatus();
        const requestPlayer = this.players.find(p => p.id === playerId);
        const isGameOver = (gameStatus === 'POLICE_WON' || gameStatus === 'BOMBER_WON');

        const activePool = this.cardsPool.filter(c => !c.isRevealed);
        const totalSafe = activePool.filter(c => c.type === 'safe').length;
        const totalBoom = activePool.filter(c => c.type === 'boom').length;

        return {
            status: gameStatus,
            currentRound: this.currentRound,
            remainingCuts: this.remainingCuts,
            scutesFound: this.scutesFound,
            scutesGoal: this.scutesGoal,
            currentCutterId: this.players[this.currentCutterIdx].id,
            remainingSafeCount: totalSafe,
            remainingBoomCount: totalBoom,
            self: requestPlayer ? {
                id: requestPlayer.id,
                name: requestPlayer.name,
                role: requestPlayer.role, // 自分の役職は見える
                cards: requestPlayer.cards.map(c => ({
                    id: c.id,
                    type: c.isRevealed || isGameOver ? c.type : c.type, // 自分の手札は種類が見える
                    isRevealed: c.isRevealed
                }))
            } : null,
            players: this.players.map(p => {
                const isSelf = (p.id === playerId);
                return {
                    id: p.id,
                    name: p.name,
                    // ゲーム終了時のみ全員の役職をオープンにする
                    role: isGameOver ? p.role : (isSelf ? p.role : 'unknown'),
                    cardsCount: p.cards.length,
                    cards: p.cards.map(c => ({
                        id: c.id,
                        // 他人の手札はめくられているか、ゲーム終了時のみ種類が見える。それ以外は "unknown" でマスク
                        type: c.isRevealed || isGameOver || isSelf ? c.type : 'unknown',
                        isRevealed: c.isRevealed
                    }))
                };
            })
        };
    }
}

module.exports = GameEngine;
