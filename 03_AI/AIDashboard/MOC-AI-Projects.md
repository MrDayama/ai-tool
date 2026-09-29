---
tags:
  - MOC
  - ai-dashboard
  - vibe-coding
created: 2026-09-29
---

# 🗺️ MOC — AI開発プロジェクト一覧

> [!NOTE]
> @AM09_21のVibe Coding手法を採用した「AIが自律的に更新するダッシュボード」システム
> 新プロジェクト追加: `py -3 03_AI/AIDashboard/_scripts/new_project_dashboard.py --project {name}`

---

## 📊 アクティブプロジェクト

| プロジェクト | ステータス | AIモデル | リンク |
|---|---|---|---|
| timebomb-game | 🟡 In Progress | Claude Sonnet 4.6 | [[timebomb-game-dashboard]] |
| icm-calculator | 🟡 In Progress | - | [[icm-calculator-dashboard]] |
| poker-ev | 🟡 In Progress | - | [[poker-ev-dashboard]] |

---

## 🚀 クイックコマンド

```bash
# 一覧確認
py -3 03_AI/AIDashboard/_scripts/new_project_dashboard.py --list

# 新規プロジェクト
py -3 03_AI/AIDashboard/_scripts/new_project_dashboard.py --project {name}

# タスク追加（AIが実行）
py -3 03_AI/AIDashboard/_scripts/update_dashboard.py --project {name} --add-task "タスク名"

# ログ追加（AIが実行）
py -3 03_AI/AIDashboard/_scripts/update_dashboard.py --project {name} --log "完了内容"

# 質問（AI→人間）
py -3 03_AI/AIDashboard/_scripts/update_dashboard.py --project {name} --question "質問内容"
```

---

## 📖 関連ノート

- [[README]] — システム使い方
- [[03_AI/MOC_AI_Tools]] — AI全般MOC
- [[03_AI/AIDashboard/_templates/AI-Dashboard-Template]] — テンプレート

---

## 💡 仕組みのポイント（@AM09_21方式）

1. **単一MD + JSONデータ** — 超シンプルな構成を保つ
2. **AIが自動更新** — 作業完了ごとにスクリプトを発火
3. **質問キュー** — AIが非同期で質問 → Slack等で人間が回答
4. **プロジェクトごとに作り直す** — 範囲が広がっても柔軟に対応
5. **ダッシュボード形式** — 要素が直感的に分かる、説明過多を防ぐ
