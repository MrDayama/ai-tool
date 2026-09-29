"""
AI開発ダッシュボード 自動更新スクリプト
=====================================
@AM09_21のVibe Coding手法をObsidianで実現するためのスクリプト。
AIが作業完了時・ログ追加時にこのスクリプトを呼び出してダッシュボードを更新する。

使い方:
  # タスクを追加
  python update_dashboard.py --project timebomb-game --add-task "ログイン機能実装"

  # タスクを完了にする
  python update_dashboard.py --project timebomb-game --complete-task "ログイン機能実装"

  # AIアクションログを追加
  python update_dashboard.py --project timebomb-game --log "WebSocketの接続確立完了"

  # AIから人間への質問を追加
  python update_dashboard.py --project timebomb-game --question "タイマーのデフォルト秒数は何秒にしますか？"

  # 質問への回答を記録
  python update_dashboard.py --project timebomb-game --answer "タイマーのデフォルト秒数は何秒にしますか？" --answer-text "60秒"

  # プロジェクトステータスを更新
  python update_dashboard.py --project timebomb-game --status "✅ Done"

  # 成果物を追加
  python update_dashboard.py --project timebomb-game --artifact "frontend/index.html"
"""

import json
import argparse
import sys
import io
from pathlib import Path
from datetime import datetime

# Windows環境でのUnicode出力対応
if hasattr(sys.stdout, 'buffer'):
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
if hasattr(sys.stderr, 'buffer'):
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8", errors="replace")

# パス設定
SCRIPT_DIR = Path(__file__).parent
DASHBOARD_ROOT = SCRIPT_DIR.parent
DATA_DIR = DASHBOARD_ROOT / "_data"
PROJECTS_DIR = DASHBOARD_ROOT / "projects"
TEMPLATE_DIR = DASHBOARD_ROOT / "_templates"


def get_now() -> str:
    return datetime.now().strftime("%Y-%m-%d %H:%M")


def load_data(project: str) -> dict:
    data_file = DATA_DIR / f"{project}.json"
    if not data_file.exists():
        print(f"❌ プロジェクト '{project}' が見つかりません。")
        print(f"   新規作成は: python new_project_dashboard.py --project {project}")
        sys.exit(1)
    with open(data_file, encoding="utf-8") as f:
        return json.load(f)


def save_data(project: str, data: dict):
    data_file = DATA_DIR / f"{project}.json"
    data["last_updated"] = get_now()
    with open(data_file, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def render_task_list(tasks: list) -> str:
    if not tasks:
        return "_タスクはまだありません_"
    lines = []
    for t in tasks:
        icon = "✅" if t["done"] else "⬜"
        done_info = f" ~~{t['title']}~~" if t["done"] else f" {t['title']}"
        completed_at = f" `{t.get('completed_at', '')}` " if t["done"] else ""
        lines.append(f"- {icon}{done_info}{completed_at}")
    return "\n".join(lines)


def render_action_log(logs: list) -> str:
    if not logs:
        return "_ログはまだありません_"
    lines = []
    for log in reversed(logs[-20:]):  # 最新20件
        lines.append(f"- `{log['timestamp']}` {log['message']}")
    return "\n".join(lines)


def render_question_queue(questions: list) -> str:
    pending = [q for q in questions if not q.get("answered")]
    answered = [q for q in questions if q.get("answered")]

    lines = []
    if not pending:
        lines.append("_未回答の質問はありません_ ✨")
    else:
        for q in pending:
            lines.append(f"- 🔴 **Q:** {q['question']}  ")
            lines.append(f"  `{q['asked_at']}`")
    
    if answered:
        lines.append("\n### ✅ 回答済み")
        for q in answered[-5:]:  # 最新5件
            lines.append(f"- **Q:** {q['question']}")
            lines.append(f"  **A:** {q.get('answer', '')}")

    return "\n".join(lines)


def render_artifacts(artifacts: list) -> str:
    if not artifacts:
        return "_成果物はまだありません_"
    lines = []
    for a in artifacts:
        lines.append(f"- `{a}`")
    return "\n".join(lines)


def render_completed_history(tasks: list) -> str:
    done_tasks = [t for t in tasks if t["done"]]
    if not done_tasks:
        return "_完了したタスクはまだありません_"
    lines = []
    for t in done_tasks:
        lines.append(f"- ✅ `{t.get('completed_at', '?')}` {t['title']}")
    return "\n".join(lines)


def render_dashboard(data: dict) -> str:
    """JSONデータからMarkdownダッシュボードを生成"""
    tasks = data.get("tasks", [])
    done_count = sum(1 for t in tasks if t["done"])
    total_count = len(tasks)

    # ステータスアイコン判定
    status = data.get("status", "🟡 In Progress")

    content = f"""---
project: "{data['project']}"
status: "{status}"
ai_model: "{data.get('ai_model', '')}"
phase: "{data.get('phase', '')}"
started_at: "{data.get('started_at', '')}"
last_updated: "{data.get('last_updated', '')}"
tags:
  - ai-dashboard
  - vibe-coding
cssclasses:
  - ai-dashboard
---

# 🤖 {data['project']} — AI開発ダッシュボード

> [!NOTE]
> このノートはAIが自動更新します。手動編集は `## 📝 メモ` セクションのみ行ってください。
> 更新スクリプト: `python 03_AI/AIDashboard/_scripts/update_dashboard.py --project {data['project']}`

---

## 📊 プロジェクト概要

| 項目 | 値 |
|---|---|
| **ステータス** | {status} |
| **フェーズ** | {data.get('phase', '-')} |
| **AIモデル** | {data.get('ai_model', '-')} |
| **開始日** | {data.get('started_at', '-')} |
| **最終更新** | {data.get('last_updated', '-')} |
| **完了タスク** | {done_count} / {total_count} |

---

## ✅ タスクリスト

{render_task_list(tasks)}

---

## 🔄 AIアクションログ

{render_action_log(data.get('action_logs', []))}

---

## ❓ 質問キュー（AI → 人間）

> [!IMPORTANT]
> 以下の質問にSlack/Discord/Telegram等で回答してください

{render_question_queue(data.get('questions', []))}

---

## 📁 成果物・ファイル

{render_artifacts(data.get('artifacts', []))}

---

## 📝 メモ（手動編集OK）

{data.get('memo', '<!-- ここは自由にメモを書いてください -->')}

---

## 📈 完了履歴

{render_completed_history(tasks)}

---

*最終更新: {data.get('last_updated', '-')} by AI自動更新スクリプト*
"""
    return content


def write_dashboard(project: str, data: dict):
    """ダッシュボードMDを書き込む"""
    md_file = PROJECTS_DIR / f"{project}-dashboard.md"
    content = render_dashboard(data)
    with open(md_file, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"✅ ダッシュボード更新: {md_file}")


def main():
    parser = argparse.ArgumentParser(
        description="AI開発ダッシュボード自動更新スクリプト",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__
    )
    parser.add_argument("--project", "-p", required=True, help="プロジェクト名")
    parser.add_argument("--add-task", metavar="TASK", help="タスクを追加")
    parser.add_argument("--complete-task", metavar="TASK", help="タスクを完了にする")
    parser.add_argument("--log", metavar="MESSAGE", help="AIアクションログを追加")
    parser.add_argument("--question", metavar="QUESTION", help="質問を追加（AI→人間）")
    parser.add_argument("--answer", metavar="QUESTION", help="回答する質問テキスト")
    parser.add_argument("--answer-text", metavar="ANSWER", help="回答内容")
    parser.add_argument("--status", metavar="STATUS", help="プロジェクトステータスを更新")
    parser.add_argument("--phase", metavar="PHASE", help="フェーズを更新")
    parser.add_argument("--ai-model", metavar="MODEL", help="使用AIモデルを設定")
    parser.add_argument("--artifact", metavar="PATH", help="成果物ファイルパスを追加")
    parser.add_argument("--show", action="store_true", help="現在の状態を表示のみ")

    args = parser.parse_args()

    data = load_data(args.project)

    if args.show:
        tasks = data.get("tasks", [])
        done = sum(1 for t in tasks if t["done"])
        print(f"\n📊 {args.project}")
        print(f"   ステータス: {data.get('status', '-')}")
        print(f"   タスク: {done}/{len(tasks)} 完了")
        print(f"   最終更新: {data.get('last_updated', '-')}")
        return

    changed = False

    # タスク追加
    if args.add_task:
        tasks = data.setdefault("tasks", [])
        if not any(t["title"] == args.add_task for t in tasks):
            tasks.append({"title": args.add_task, "done": False, "created_at": get_now()})
            print(f"➕ タスク追加: {args.add_task}")
            changed = True
        else:
            print(f"⚠️  タスク '{args.add_task}' は既に存在します")

    # タスク完了
    if args.complete_task:
        tasks = data.setdefault("tasks", [])
        found = False
        for t in tasks:
            if t["title"] == args.complete_task and not t["done"]:
                t["done"] = True
                t["completed_at"] = get_now()
                print(f"✅ タスク完了: {args.complete_task}")
                found = True
                changed = True
                break
        if not found:
            print(f"⚠️  タスク '{args.complete_task}' が見つからないか、既に完了です")

    # ログ追加
    if args.log:
        logs = data.setdefault("action_logs", [])
        logs.append({"timestamp": get_now(), "message": args.log})
        print(f"📝 ログ追加: {args.log}")
        changed = True

    # 質問追加
    if args.question:
        questions = data.setdefault("questions", [])
        if not any(q["question"] == args.question for q in questions):
            questions.append({
                "question": args.question,
                "asked_at": get_now(),
                "answered": False
            })
            print(f"❓ 質問追加: {args.question}")
            changed = True

    # 回答
    if args.answer and args.answer_text:
        questions = data.setdefault("questions", [])
        for q in questions:
            if q["question"] == args.answer:
                q["answered"] = True
                q["answer"] = args.answer_text
                q["answered_at"] = get_now()
                print(f"💬 回答記録: {args.answer_text}")
                changed = True
                break

    # ステータス更新
    if args.status:
        data["status"] = args.status
        print(f"🔄 ステータス更新: {args.status}")
        changed = True

    # フェーズ更新
    if args.phase:
        data["phase"] = args.phase
        print(f"🔄 フェーズ更新: {args.phase}")
        changed = True

    # AIモデル設定
    if args.ai_model:
        data["ai_model"] = args.ai_model
        print(f"🤖 AIモデル設定: {args.ai_model}")
        changed = True

    # 成果物追加
    if args.artifact:
        artifacts = data.setdefault("artifacts", [])
        if args.artifact not in artifacts:
            artifacts.append(args.artifact)
            print(f"📁 成果物追加: {args.artifact}")
            changed = True

    if changed:
        save_data(args.project, data)
        write_dashboard(args.project, data)
    else:
        print("変更なし")


if __name__ == "__main__":
    main()
