---
project: "{{PROJECT_NAME}}"
status: "🟡 In Progress"
ai_model: ""
phase: ""
started_at: "{{CREATED_DATE}}"
last_updated: "{{LAST_UPDATED}}"
tags:
  - ai-dashboard
  - vibe-coding
cssclasses:
  - ai-dashboard
---

# 🤖 {{PROJECT_NAME}} — AI開発ダッシュボード

> [!NOTE]
> このノートはAIが自動更新します。手動編集は `## 📝 メモ` セクションのみ行ってください。
> 更新スクリプト: `03_AI/AIDashboard/_scripts/update_dashboard.py --project {{PROJECT_NAME}}`

---

## 📊 プロジェクト概要

| 項目 | 値 |
|---|---|
| **ステータス** | {{STATUS}} |
| **フェーズ** | {{PHASE}} |
| **AIモデル** | {{AI_MODEL}} |
| **開始日** | {{STARTED_AT}} |
| **最終更新** | {{LAST_UPDATED}} |
| **完了タスク** | {{DONE_COUNT}} / {{TOTAL_COUNT}} |

---

## ✅ タスクリスト

{{TASK_LIST}}

---

## 🔄 AIアクションログ

{{ACTION_LOG}}

---

## ❓ 質問キュー（AI → 人間）

> [!IMPORTANT]
> 以下の質問にSlack/Discord/Telegram等で回答してください

{{QUESTION_QUEUE}}

---

## 📁 成果物・ファイル

{{ARTIFACTS}}

---

## 📝 メモ（手動編集OK）

<!-- ここは自由にメモを書いてください -->

---

## 📈 完了履歴

{{COMPLETED_HISTORY}}

---

*最終更新: {{LAST_UPDATED}} by AI自動更新スクリプト*
