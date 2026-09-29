---
type: specification
tags: [poker/gto, obsidian/iframe, AI/specification, web/architecture, schema-driven]
date: 2026-09-15
status: active
source: ユーザーリクエスト & GTO Wizard Architecture Design
---

# 🎴 ローカルGTOウィザード (Local GTO Wizard) プロジェクト仕様書

> [!abstract] 概要
> 本ドキュメントは、完全無料・ローカル環境（PC上）で動作する**「ローカルGTOポーカー学習ツール (Local GTO Wizard)」**のプロジェクト仕様書です。
> Obsidian Vault の運用ルール（[[CLAUDE]] / [[01_Imo/Obsidian_Usage_Rules]]）に基づき、`03_AI/` フォルダに出力・管理されています。
> 本ツールは Obsidian のノート内に `<iframe src="...">` 経由で埋め込み、Obsidian上で直接操作・学習できるよう設計されています。

---

## 🎯 1. プロジェクト目的 & 特徴

1. **完全無料 (0円)**: クラウドサーバーや有料APIを使わず、全機能をローカルPC上で動作。
2. **Obsidian完全統合**: 単一HTML/Webアプリとしてビルドし、Obsidianノート内で直接動かせるUI構造。
3. **ローカルリソースのフル活用**: C++製のオープンソースGTOソルバー（`TexasSolver`等）をローカルCPUでバックグラウンド実行。

---

## 📐 2. システムアーキテクチャ & ER図

```mermaid
erDiagram
    GAME_FORMAT ||--|{ SCENARIO : "contains"
    SCENARIO ||--|{ SOLUTION_DATA : "has GTO results"
    SCENARIO ||--o{ QUIZ_QUESTION : "used in"
    SCENARIO ||--o{ HAND_HISTORY : "matched with"

    QUIZ_SESSION ||--|{ QUIZ_QUESTION : "contains"
    CUSTOM_SOLVER_CONFIG ||--o{ SCENARIO : "generates"

    GAME_FORMAT {
        string id PK "フォーマットID (CASH_100BB)"
        string name "名称"
        string rake_structure "レーキ構造"
    }

    SCENARIO {
        string id PK "シナリオID"
        string game_format_id FK "フォーマットID"
        string hero_position "Heroポジション"
        string villain_position "Villainポジション"
        string street "ストリート"
        string board_cards "ボードカード"
    }

    SOLUTION_DATA {
        string id PK "ソリューションID"
        string scenario_id FK "シナリオID"
        string hand_combo "ハンド (AhKh, 72o)"
        json action_frequencies "アクション頻度"
        float ev "期待値 (EV)"
    }

    QUIZ_SESSION {
        string id PK "セッションID"
        datetime created_at "日時"
        int total_questions "問題数"
        float total_ev_loss "合計EV Loss"
    }

    QUIZ_QUESTION {
        string id PK "問題ID"
        string session_id FK "セッションID"
        string user_action "回答"
        string optimal_action "最適解"
        float ev_loss "EV Loss"
    }
```

---

## 🛠️ 3. 実装機能 & 開発フェーズ

### フェーズ 1: コアWebビューア ＆ クイズトレーナー
- **13x13 ハンドマトリクス描画**: 169コンボの色分け頻度表示。
- **GTO対戦クイズ**: ランダムシチュエーション出題とリアルタイム EV Loss 判定。
- **Obsidian iframe 埋め込み対応**: レスポンシブUIの最適化。

### フェーズ 2: ローカルソルバー連携 ＆ HHアナライザー
- **TexasSolver CLI 連携**: 任意条件のローカルリアルタイムGTO計算。
- **ハンド履歴 (HH) パース**: テキストログの一括読み込みとミスの自動判定。

---

## 🔗 関連ドキュメント・関連ノート

* [[03_AI/Poker_Memo_Tool_Specification]] — ポーカーメモ統合Webツール仕様書
* [[01_Imo/Poker_Strategy_Embed]] — Obsidian HTML埋め込みノート一覧
* [[Dashboard]] — ポータル・ダッシュボード
