---
type: meta
tags: [vault/rules, AI/instructions]
date: 2026-07-07
status: active
---

# CLAUDE.md — AI Agent Vault Operating Guide

> [!abstract] 概要
> 本ファイルはAI（Claude/Gemini/Cursor等）がこのVaultを操作する際の統一ルールです。
> 詳細な運用ルールは [[01_Imo/Obsidian_Usage_Rules]] を参照してください。

---

## Vault哲学 — 4つの原則

### 1. 検索優先 (Retrieval-First)
整理の判断基準は「将来これを探すとき、何を手がかりにするか？」。
カテゴリ分類ではなく、**未来の自分が辿り着ける形**で保存する。

### 2. フォルダは荷さばき場、リンクが本当の構造
フォルダは入口に過ぎない。ノート間の `[[内部リンク]]` こそが知識のネットワーク。
グラフビューで繋がりが見えることを常に意識する。

### 3. 書くより「繋げる」
新しいノートを作るとき、最低1つは既存ノートへのリンクを含める。
孤立ノート（オーファン）は価値を失う。

### 4. AIの出力は必ず構造化
AIが生成するノートには必ず frontmatter（YAML）を付与し、Bases で検索可能にする。

---

## フォルダ構成 & 権限ルール

| フォルダ | 役割 | AI権限 |
|:---|:---|:---|
| `01_Imo/` | 自己の思考・戦略メモ | 🔒 **読取のみ**（書換禁止） |
| `02_Read-only/` | 静的リソース・HTMLツール・データ | 🔒 **読取のみ**（書換禁止） |
| `03_AI/` | AI出力・解析結果・スクリプト | ✅ **自由に出力・上書きOK** |
| `04_Archive/` | 過去ログ・バックアップ | 📦 アーカイブ目的（日常参照から外す） |
| `05_Bases/` | Obsidian Basesビューファイル | ✅ 自動生成OK |

---

## ノート作成規約

### frontmatter（必須）
すべてのノートに以下のYAMLヘッダーを付ける：

```yaml
---
type: research | strategy | tool | log | reference | meta
tags: [階層タグを使用]
date: YYYY-MM-DD
status: active | archived | draft
source: URL or 内部参照
---
```

### タグ規約
階層タグを使用する：
- `#poker/strategy`, `#poker/hands`, `#poker/stud`
- `#AI/agent`, `#AI/memory`, `#AI/codex`
- `#obsidian/bases`, `#obsidian/tips`
- `#vault/rules`, `#vault/structure`

### リンク規約
- 新規ノートには最低1つの `[[内部リンク]]` を含める
- 関連するMOC（Map of Content）があればそこにもリンクを追加
- URLは `[表示名](URL)` 形式で記載

---

## 開発プロジェクトの扱い

以下のフォルダはソースコードであり、パス依存があるためルートに配置：
- `ai-agent/` — 自律型AIエージェント（Python）
- `icm-calculator/` — ICM計算ツール
- `poker-ev/` — EVシミュレーター  
- `project/` — 計算ロジックモジュール

> [!WARNING]
> これらを `02_Read-only` 等に移動すると実行時エラーの原因となります。

---

## 関連ノート
- [[01_Imo/Obsidian_Usage_Rules]] — 運用ルール詳細
- [[Dashboard]] — ポータル・ダッシュボード
- [[03_AI/MOC_AI_Tools]] — AI関連ツール地図
