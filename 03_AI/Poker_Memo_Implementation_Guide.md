---
type: log
tags: [poker/tools, AI/handover, web/implementation, git/guide]
date: 2026-08-31
status: active
source: ユーザー依頼・プロジェクト引継ぎ書
---

# 📖 ポーカーメモ統合Webツール 実装・引継ぎ手順書 (Handover Guide)

> [!abstract] 概要
> 本ドキュメントは、**ポーカーメモ統合Webツール**のフェーズ1（ライブアクションテーブル＆ハンド入力、ハンドリプレイアニメーション、レスポンシブUI、GitHub Pagesデプロイ）を、他の開発者やAIエージェントが円滑に引き継いで開発・運用できるように整理した**ステップバイステップ実装手順書**です。
> Obsidian Vault の運用ルール（[[CLAUDE]] / [[01_Imo/Obsidian_Usage_Rules]]）に基づき、`03_AI/` フォルダに格納しています。

---

## 📁 1. ディレクトリ構造 & 作成ファイル

本プロジェクトのコードはルート配下の `project/` ディレクトリ内に配置し、`gh-pages` デプロイ用の公開成果物としてルートの `poker-memo.html` にコピー・公開します。

```text
c:\work\ai\ai-tool\
 ├── project/
 │    └── poker-memo/
 │         ├── index.html   (Webアプリ UIメインフレーム)
 │         ├── style.css    (レスポンシブデザイン・円形SVGテーブルスタイル)
 │         └── app.js       (NLHポーカーエンジン・ポット計算・アニメーション・IndexedDB)
 ├── poker-memo.html        (GitHub Pages 公開用ルートエントリポイント)
 └── 03_AI/
      ├── Poker_Memo_Tool_Specification.md (全体機能・ハード・デプロイ仕様書)
      └── Poker_Memo_Implementation_Guide.md (本引継ぎ手順書)
```

---

## 🛠️ 2. ステップバイステップ実装手順

他の開発者が引き継いで実装を進める際は、以下のステップ順に従って作成・テストを行ってください。

### 【Step 1】 ポーカーデータ構造 & 状態管理 (`app.js`)
* **データモデルの定義**:
  * `GameState`: ラウンド（Preflop/Flop/Turn/River/Showdown）、現在のストリート、現在のターン座席、アクティブ座席数。
  * `SeatState`: 座席ID (1〜9), プレイヤー名, スタック量, 投入チップ額, アクション状態 (Fold/Check/Call/Raise/All-in), 離席フラグ (isAway)。
  * `BlindState`: SB額, BB額, Ante額, Ante形式 (None/Regular/BBAnte), BB/Cash 表示切替フラグ。
  * `PotState`: Main Pot 額, Side Pot オブジェクト配列 (`[{ id, amount, eligibleSeats }]`)。

### 【Step 2】 NLHポーカーエンジン & 計算ロジックの実装
* **アクション順序制御**:
  * 通常時: Preflop は UTG スタート、Post-flop は SB（または最先のアクティブ座席）スタート。
  * **HU（2名時）特殊判定**: BTN=SB とし、Preflop は BTN 先、Post-flop は BB 先となる自動判定。
  * **離席 (Away) 判定**: `isAway === true` の座席をアクション巡回リストから自動スキップ。
* **Min-Raise / Min Re-raise 計算**:
  * 直前上げ幅（Raise Delta）を加算した最小必要額をリアルタイム計算し、バリデーション。
* **サイドポット自動分割アルゴリズム**:
  * オールイン発生時、投入額の昇順で各アクティブ座席の投入額を階層化し、メインポットとサイドポット 1, 2... を自動生成。

### 【Step 3】 レスポンシブ UI & 円形SVGテーブル描画 (`index.html`, `style.css`)
* **レイアウト構成**:
  * **PC (横幅 1280px 以上)**: 3カラム（左: 操作キーパッド/設定, 中央: SVGテーブル, 右: ポット/ログ/リプレイ）。
  * **スマホ (縦幅 360px〜430px)**: 上部 SVGテーブル ＋ 下部 引き出し式ボトムシート（`入力` | `ブラインド/スタック` | `履歴` タブ）。
* **SVGポーカー卓描画**:
  * 2〜9名に応じた円形・楕円座席配置。
  * 離席座席の**減光ディムアウトエフェクト**。
  * アクション中座席の光彩ハイライトリング。

### 【Step 4】 ハンドリプレイ ＆ ローカルストレージ (IndexedDB)
* **リプレイ録画・再生エンジン**:
  * ハンド開始からショウダウンまでのアクションステップを配列録画。
  * アニメーション再生（Play/Pause）、ステップ送り（← / →）、再生速度（0.5x, 1x, 2x, 4x）切り替え。
* **IndexedDB ストレージ**:
  * ネットワーク非接続時（オフライン環境）でもデータが消えないローカル保存。

---

## 🧪 3. 動作検証・テストチェックリスト

実装完了後、以下のテストケースを実行して動作を確認してください。

| テスト項目 | 検証内容 | 期待結果 |
|---|---|---|
| **ヘッズアップ動作** | 卓人数を「2名」に変更 | プリフロップは BTN 先、フロップ以降は BB 先にハイライトが移動すること |
| **Min-Raiseバリデーション** | 1/2 レートで 3BB にレイズ後、リレイズを試行 | 5BB 未満の入力が制限され、エラー表示またはボタン非活性となること |
| **サイドポット計算** | Seat1 (20BB), Seat2 (50BB), Seat3 (100BB) が全員 All-in | Main Pot 60BB [1,2,3], Side Pot 60BB [2,3] に自動分割されること |
| **離席 (Away) 動作** | Seat 3 を「離席」に切替 | 離席座席が減光され、アクション番が Seat 3 をスキップして次に回ること |
| **オフライン動作** | Chrome DevTools で Offline モードにする | 通信エラーが発生せず、データの入力・保存・リプレイが完全動作すること |

---

## 🚀 4. 公式デプロイ手順 (GitHub Pages)

引き継いだ開発者が本Webツールをデプロイ・公開する際は、Vault公式スキル（`deploy-pages-render` / `git-management`）に基づき以下のコマンドを実行します。

```bash
# 1. main ブランチでのコミット & プッシュ
git add -A
git commit -m "feat: ポーカーメモ機能の実装・更新"
git push origin main

# 2. 追跡ブランチへの強制同期
git push origin main:ai-dev --force
git push origin main:deploy-timebomb --force
git push origin main:dev --force

# 3. gh-pages ブランチに切り替えて公開ファイルを配置
git checkout gh-pages
git checkout main -- project/poker-memo/index.html
git checkout main -- project/poker-memo/style.css
git checkout main -- project/poker-memo/app.js

# ルートの公開エントリポイント (poker-memo.html) にコピー
copy project\poker-memo\index.html poker-memo.html   # Windows環境の場合

git add poker-memo.html project/poker-memo/
git commit -m "deploy: ポーカーメモ Webアプリ公開"
git push origin gh-pages

# 4. main ブランチに復帰
git checkout main
```

* **公開URL**: `https://mrdayama.github.io/ai-tool/poker-memo.html`

---

## 🔗 関連ドキュメント・内部リンク
* [[03_AI/Poker_Memo_Tool_Specification]] — ポーカーメモ詳細仕様書
* [[CLAUDE]] — AI Agent Vault 運用ルール
* [[Dashboard]] — ポータル・ダッシュボード
* [[01_Imo/Obsidian_Usage_Rules]] — Vault運用ガイド
