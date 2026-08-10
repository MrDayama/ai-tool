---
type: research
tags: [AI/memory, AI/agent, obsidian/tips]
date: 2026-07-07
status: draft
source: https://x.com/pkm_tk111/status/2071547696016683357
---

# Basic Memory × Obsidian 統合設計ノート

> 出典: [tk @pkm_tk111](https://x.com/pkm_tk111/status/2071547696016683357)
> 「メモリシステム育ってきた。ミソはこれだけ増えててもカオスにならないこと。人間側の管理負担が少ないこと。agent loop様様やね」

---

## 現状のメモリシステム

当Vaultの `ai-agent/` では以下のメモリ構造を使用：
- **格納先**: `ai-agent/memory.json`（24KB）
- **構造**: goal, tasks[], history[] のフラットJSON
- **保存**: `memory_store.py` の `save()` メソッド

### 問題点
1. JSON一極集中で人間が読みにくい
2. Obsidian側から完全に不可視
3. セッション間の知識の継承が弱い
4. 検索・フィルタリングが不可能

---

## 改善案: Markdown連携型メモリ

### 設計方針
agent loopの実行結果を `03_AI/memory/` にMarkdownとして自動保存。
frontmatter付きでObsidian Basesから横断検索可能にする。

### 出力フォーマット例
```yaml
---
type: log
tags: [AI/memory, AI/agent]
date: 2026-07-07
status: active
session_id: session_001
goal: "天気を調べてまとめる"
result: success | failure
---
```

```markdown
# セッションログ: 天気を調べてまとめる

## 実行タスク
1. [x] Web検索で天気情報を取得
2. [x] 結果をweather.txtに保存

## 実行結果
成功。weather.txt に保存完了。

## 学んだこと
- DuckDuckGo APIは日本語クエリに対応
- ファイル保存時はUTF-8エンコーディングを明示的に指定する必要あり
```

### memory_store.py への変更箇所
`save()` メソッドに以下を追加：
- Markdown出力パス: `../03_AI/memory/YYYY-MM-DD_HHmm_session.md`
- frontmatter自動生成
- タスク結果のMarkdownフォーマット出力

---

## Basic Memoryプラグインについて

### 概要
Basic MemoryはObsidianプラグインで、AIエージェントの長期記憶をMarkdownノートとして管理する。

### 導入検討ポイント
- [ ] プラグインのインストールと設定
- [ ] 当ai-agentとの連携方法の調査
- [ ] MCP (Model Context Protocol) 経由でのClaude接続

---

## 関連ノート
- [[03_AI/X_Tweet_Research_20260707]] — 元ツイート調査
- [[03_AI/MOC_AI_Tools]] — AI関連ツール地図
- [[CLAUDE]] — AI統合指示書
