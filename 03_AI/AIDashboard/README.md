# 📊 AI開発ダッシュボード — README

> @AM09_21のVibe Coding手法をObsidianで実現するシステムです。
> AIが自律開発する際の進捗・ログ・タスク・質問を1枚のMarkdownで管理します。

---

## 🗂️ フォルダ構成

```
AIDashboard/
├── _templates/
│   └── AI-Dashboard-Template.md   ← Obsidianテンプレート（参考用）
├── _scripts/
│   ├── new_project_dashboard.py   ← 新規プロジェクト作成
│   └── update_dashboard.py        ← AI自動更新スクリプト
├── _data/
│   └── {project}.json             ← プロジェクトデータ（AIが更新）
├── projects/
│   └── {project}-dashboard.md     ← Obsidianダッシュボード
├── README.md                      ← このファイル
└── MOC-AI-Projects.md             ← 全プロジェクト一覧
```

---

## 🚀 クイックスタート

### 1. 新規プロジェクト作成

```bash
cd c:\work\ai\ai-tool\03_AI\AIDashboard\_scripts

# 基本
python new_project_dashboard.py --project my-project

# 詳細指定
python new_project_dashboard.py \
  --project my-project \
  --description "プロジェクトの説明" \
  --ai-model "Claude Sonnet 4.6" \
  --phase "Phase 1: 設計"
```

### 2. AIによる自動更新（AIがこのコマンドを実行する）

```bash
cd c:\work\ai\ai-tool\03_AI\AIDashboard\_scripts

# タスク追加
python update_dashboard.py --project my-project --add-task "ログイン機能実装"

# タスク完了
python update_dashboard.py --project my-project --complete-task "ログイン機能実装"

# ログ追加（作業完了後に呼び出す）
python update_dashboard.py --project my-project --log "WebSocket接続確立完了"

# 質問追加（AI → 人間）
python update_dashboard.py --project my-project --question "タイマーのデフォルト秒数は？"

# 回答記録
python update_dashboard.py --project my-project \
  --answer "タイマーのデフォルト秒数は？" \
  --answer-text "60秒"

# ステータス更新
python update_dashboard.py --project my-project --status "✅ Done"

# 成果物追加
python update_dashboard.py --project my-project --artifact "frontend/index.html"
```

### 3. 一覧確認

```bash
python new_project_dashboard.py --list
```

---

## 🤖 AIへの指示テンプレート

AIに自律開発させる際は、以下の文を最初に伝えてください：

```
作業開始時・完了時・詰まった時に必ず以下のスクリプトでダッシュボードを更新してください：
  python c:\work\ai\ai-tool\03_AI\AIDashboard\_scripts\update_dashboard.py --project {PROJECT_NAME}

- 新しいタスクを始める前に: --add-task "タスク名"
- タスク完了時: --complete-task "タスク名"
- 作業の節目ごと: --log "完了した内容の説明"
- 人間への質問がある時: --question "質問内容"
- 成果物ができたら: --artifact "ファイルパス"
```

---

## 💡 設計思想（@AM09_21のVibe Coding手法より）

- **単一MD + JSONデータ**: シンプルな構成を保つ
- **AIが自動更新**: Hooks・Agentが作業完了ごとに発火
- **質問キュー**: AIが非同期で質問 → 人間がSlack等で回答
- **プロジェクトごとに作り直す**: 範囲が広がったときでもAIが新項目を生やしやすい
- **ダッシュボード形式**: 説明文が多すぎる問題を回避し、要素が何を表すか直感的に分かる

---

## 🔗 関連ファイル

- [[MOC-AI-Projects]] — 全プロジェクト一覧
- [[03_AI/MOC_AI_Tools]] — AI全般のMOC
