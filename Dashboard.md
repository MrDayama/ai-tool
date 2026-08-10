---
type: meta
tags: [vault/portal, poker/strategy]
date: 2026-07-07
status: active
---
# 🏠 Poker Strategy Portal & Dashboard

> [!abstract] 概要
> 松濤Vimmer式に整理した、ポーカー学習・戦略ツールの総合ダッシュボードです。
> ここから各戦略ツールやAIナレッジに直接アクセスできます。

---

## 🗂️ メイン・ナビゲーション

| 🤖 AI・自動化 | 🃏 ポーカー戦略 / 🎮 ゲーム | 🗃️ 管理・検索 |
|:---|:---|:---|
| [[ai-agent/README\|自律AIエージェント]] | [[01_Imo/Poker_Strategy_Embed\|ポーカー戦略一覧]] | [[05_Bases/全リサーチノート\|🔍 リサーチ検索]] |
| [[03_AI/MOC_AI_Tools\|AIツール総合ハブ]] | [[poker-ev/index\|EVシミュレーター]] | [[05_Bases/アクティブ戦略\|🎯 アクティブ戦略]] |
| [[CLAUDE\|AI向け指示書]] | [[icm-calculator/README\|ICM計算ツール]] | [[05_Bases/全ツイート調査\|🐦 ツイート調査]] |
| [[03_AI/game_ui_research_project\|🎮 UI調査・改善案]] | [[timebomb-game/frontend/spec\|💣 タイムボム仕様書]] | |

---

## 🃏 戦略ツール & 🎮 ゲーム プレビュー (iframe)

> [!info] 戦略ツールとゲームの直接操作
> 以下のiframeから直接計算機やゲームを操作できます。ポーカーツールは `01_Imo/Poker_Strategy_Embed` に統合されています。

### 📊 Starting Hands Mobile
モバイルや狭いペインでも快適に動作するスターティングハンド表。

<iframe src="02_Read-only/starting-hands-mobile.html" width="100%" height="600px" style="border: 1px solid var(--background-modifier-border); border-radius: 8px;"></iframe>

### 🤠 Seven Card Stud Strategy
セブンカードスタッドの戦略解説・スターティングハンドTier表。

<iframe src="02_Read-only/Seven_Card_Stud_Strategy.html" width="100%" height="600px" style="border: 1px solid var(--background-modifier-border); border-radius: 8px;"></iframe>

### 💣 タイムボム Online (GitHub Pages 埋め込み)
3カラムレスポンシブレイアウト・進行ログ・動的背景を実装した最新のタイムボムゲームを直接プレイ・テスト可能です。

<iframe src="https://mrdayama.github.io/ai-tool/timebomb.html" width="100%" height="700px" style="border: 1px solid var(--background-modifier-border); border-radius: 8px;"></iframe>

---

> [!tip] さらにツールを見る
> 上記以外の Archie や統合版ツールを見るには [[01_Imo/Poker_Strategy_Embed]] を開いてください。
