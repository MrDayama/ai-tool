---
name: obsidian-ai-dashboard
description: >-
  新しいプロジェクトを開始する際、または調査・設計フェーズが完了した際に必ず使用するスキル。
  Obsidian Vault の 03_AI/AIDashboard/ 配下に、プロジェクトのAI開発ダッシュボード（MDノート）と
  データJSON を自動生成し、タスク・ログ・質問キュー・成果物を構造化記録する。
  @AM09_21 の Vibe Coding 手法（単一HTML+データ群のシンプル構成、AIが自動更新）を踏襲。
---

# Obsidian AI Dashboard Skill

このスキルは、プロジェクト開始時・調査完了時に **必ず** Obsidian ダッシュボードを作成し、
AI が自律開発する際の進捗・ログ・タスク・質問を Obsidian で一元管理するためのルールと手順を定義する。

---

## 📌 発動タイミング（必須）

以下のいずれかに該当する場合、**このスキルを必ず適用**すること：

1. ユーザーから新しいアプリ・ツール・機能の**開発依頼**を受けたとき
2. 調査フェーズが完了し、**実装に入る前**
3. ユーザーが「ダッシュボード作って」「Obsidianで記録して」と明示したとき
4. 複数フェーズにわたる**中・大規模な作業**を開始するとき

---

## 🗂️ ダッシュボードシステムの場所

```
c:\work\ai\ai-tool\03_AI\AIDashboard\
├── _scripts\
│   ├── new_project_dashboard.py   ← 新規作成スクリプト
│   └── update_dashboard.py        ← AI自動更新スクリプト
├── _data\
│   └── {project}.json             ← プロジェクトデータ
├── projects\
│   └── {project}-dashboard.md    ← Obsidianダッシュボード本体
├── _templates\
│   └── AI-Dashboard-Template.md
├── MOC-AI-Projects.md             ← 全プロジェクト一覧MOC
└── README.md
```

---

## 🚀 手順：新規ダッシュボード作成

### Step 1: ダッシュボード生成

```powershell
py -3 "c:\work\ai\ai-tool\03_AI\AIDashboard\_scripts\new_project_dashboard.py" `
  --project {project-name} `
  --description "{日本語の説明}" `
  --ai-model "{使用AIモデル名}" `
  --phase "Phase 1: 設計・調査"
```

- `{project-name}` は **英数字・ハイフン**（例: `mahjong-score`, `poker-ev`）
- `--description` は日本語OK

### Step 2: タスクを一括登録

調査・設計で決まったタスクを全て登録する：

```powershell
py -3 "c:\work\ai\ai-tool\03_AI\AIDashboard\_scripts\update_dashboard.py" `
  --project {project-name} --add-task "Phase1: タスク名"

py -3 "c:\work\ai\ai-tool\03_AI\AIDashboard\_scripts\update_dashboard.py" `
  --project {project-name} --add-task "Phase2: タスク名"
```

### Step 3: 調査ログを記録

```powershell
py -3 "c:\work\ai\ai-tool\03_AI\AIDashboard\_scripts\update_dashboard.py" `
  --project {project-name} `
  --log "調査完了: {調査結果の要点}"
```

### Step 4: 成果物パスを登録

```powershell
py -3 "c:\work\ai\ai-tool\03_AI\AIDashboard\_scripts\update_dashboard.py" `
  --project {project-name} --artifact "project/{project-name}/index.html"
```

---

## 🔄 手順：実装中の継続更新（AIが自律的に実行）

実装作業中は、以下のタイミングで **必ず** update_dashboard.py を呼び出すこと：

| タイミング | コマンド |
|---|---|
| タスク着手前 | `--add-task "タスク名"`（未登録の場合） |
| タスク完了時 | `--complete-task "タスク名"` |
| 作業の節目 | `--log "完了した内容"` |
| 人間への質問 | `--question "質問内容"` |
| 成果物生成時 | `--artifact "ファイルパス"` |
| フェーズ移行時 | `--phase "Phase 2: 実装"` |
| 完了時 | `--status "✅ Done"` |

---

## 📋 update_dashboard.py コマンドリファレンス

```powershell
# 基本構文
py -3 "c:\work\ai\ai-tool\03_AI\AIDashboard\_scripts\update_dashboard.py" --project {name} [OPTIONS]

# オプション一覧
--add-task "タスク名"           # タスク追加
--complete-task "タスク名"      # タスク完了マーク
--log "メッセージ"              # AIアクションログ追加
--question "質問"              # AI→人間への質問追加
--answer "質問" --answer-text "回答"  # 質問への回答記録
--status "🟡 In Progress"     # ステータス更新
--phase "Phase 2: 実装"        # フェーズ更新
--ai-model "Claude Sonnet 4.6" # AIモデル設定
--artifact "path/to/file"      # 成果物追加
--show                         # 現在の状態を表示
```

---

## 📄 Obsidian ダッシュボードの構成

生成される `{project}-dashboard.md` の構成：

```
## 📊 プロジェクト概要     ← ステータス・フェーズ・完了タスク数など
## ✅ タスクリスト         ← ⬜未完了 / ✅完了（打ち消し線）
## 🔄 AIアクションログ     ← 最新20件（降順）
## ❓ 質問キュー（AI→人間）← 未回答の質問 / 回答済み
## 📁 成果物・ファイル     ← 生成ファイルパス一覧
## 📝 メモ                ← 人間が手動編集可能な唯一のセクション
## 📈 完了履歴             ← 完了済みタスクの記録
```

> [!IMPORTANT]
> `## 📝 メモ` セクション以外は AI が自動更新する。
> 人間はそこのみ手動編集すること。

---

## 🗺️ MOC更新（任意）

新プロジェクト追加後、必要に応じて MOC を手動更新する：

```
c:\work\ai\ai-tool\03_AI\AIDashboard\MOC-AI-Projects.md
```

---

## ⚠️ 注意事項

- プロジェクト名は **英数字とハイフンのみ**（スペース・日本語不可）
- 既存プロジェクトに上書きする場合は `--force` を追加
- スクリプトは Python 3 が必要（`py -3` コマンドを使用）
- Windows 環境では `py -3` を使う（`python` や `python3` は動作しない場合あり）
- データは `_data/{project}.json` に保存され、ここから MD が再生成される
