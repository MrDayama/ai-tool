"""
新規AIプロジェクトダッシュボード作成スクリプト
=============================================
新しいプロジェクトのダッシュボードMDとデータJSONを一括生成する。

使い方:
  # 最小限（プロジェクト名だけ）
  python new_project_dashboard.py --project timebomb-game

  # 詳細指定
  python new_project_dashboard.py \\
    --project my-new-app \\
    --description "ポーカー計算ツール" \\
    --ai-model "Claude Sonnet 4.6" \\
    --phase "Phase 1: 設計"

  # 既存プロジェクト一覧表示
  python new_project_dashboard.py --list
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


def get_now() -> str:
    return datetime.now().strftime("%Y-%m-%d %H:%M")


def get_today() -> str:
    return datetime.now().strftime("%Y-%m-%d")


def list_projects():
    """既存プロジェクト一覧を表示"""
    projects = list(DATA_DIR.glob("*.json"))
    if not projects:
        print("プロジェクトはまだありません。")
        return
    print(f"\n📂 登録済みプロジェクト ({len(projects)}件):\n")
    for p in sorted(projects):
        with open(p, encoding="utf-8") as f:
            data = json.load(f)
        status = data.get("status", "?")
        last_updated = data.get("last_updated", "?")
        tasks = data.get("tasks", [])
        done = sum(1 for t in tasks if t["done"])
        print(f"  • {p.stem:30s} {status:20s} {done}/{len(tasks)} tasks  更新:{last_updated}")


def create_initial_data(project: str, description: str, ai_model: str, phase: str) -> dict:
    """初期JSONデータを生成"""
    return {
        "project": project,
        "description": description,
        "status": "🟡 In Progress",
        "ai_model": ai_model,
        "phase": phase,
        "started_at": get_today(),
        "last_updated": get_now(),
        "tasks": [],
        "action_logs": [
            {
                "timestamp": get_now(),
                "message": f"🚀 プロジェクト '{project}' のダッシュボードを作成しました"
            }
        ],
        "questions": [],
        "artifacts": [],
        "memo": "<!-- ここは自由にメモを書いてください -->"
    }


def render_dashboard(data: dict) -> str:
    """JSONデータからMarkdownダッシュボードを生成"""
    # update_dashboard.pyのrender_dashboard関数を流用（スタンドアロン版）
    tasks = data.get("tasks", [])
    done_count = sum(1 for t in tasks if t["done"])
    total_count = len(tasks)
    status = data.get("status", "🟡 In Progress")
    project = data["project"]

    task_section = "_タスクはまだありません。`--add-task` で追加してください_"
    
    log_lines = []
    for log in reversed(data.get("action_logs", [])[-20:]):
        log_lines.append(f"- `{log['timestamp']}` {log['message']}")
    log_section = "\n".join(log_lines) if log_lines else "_ログはまだありません_"

    content = f"""---
project: "{project}"
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

# 🤖 {project} — AI開発ダッシュボード

> [!NOTE]
> このノートはAIが自動更新します。手動編集は `## 📝 メモ` セクションのみ行ってください。
> 更新スクリプト: `python 03_AI/AIDashboard/_scripts/update_dashboard.py --project {project}`

{f"> **概要:** {data.get('description', '')}" if data.get('description') else ""}

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

{task_section}

---

## 🔄 AIアクションログ

{log_section}

---

## ❓ 質問キュー（AI → 人間）

> [!IMPORTANT]
> 以下の質問にSlack/Discord/Telegram等で回答してください

_未回答の質問はありません_ ✨

---

## 📁 成果物・ファイル

_成果物はまだありません_

---

## 📝 メモ（手動編集OK）

<!-- ここは自由にメモを書いてください -->

---

## 📈 完了履歴

_完了したタスクはまだありません_

---

*最終更新: {data.get('last_updated', '-')} by AI自動更新スクリプト*
"""
    return content


def main():
    parser = argparse.ArgumentParser(
        description="新規AIプロジェクトダッシュボード作成",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__
    )
    parser.add_argument("--project", "-p", help="プロジェクト名（英数字・ハイフン推奨）")
    parser.add_argument("--description", "-d", default="", help="プロジェクト説明")
    parser.add_argument("--ai-model", default="", help="使用AIモデル（例: Claude Sonnet 4.6）")
    parser.add_argument("--phase", default="Phase 1", help="現在のフェーズ")
    parser.add_argument("--list", "-l", action="store_true", help="既存プロジェクト一覧を表示")
    parser.add_argument("--force", action="store_true", help="既存プロジェクトを上書き")

    args = parser.parse_args()

    # フォルダ作成
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    PROJECTS_DIR.mkdir(parents=True, exist_ok=True)

    if args.list:
        list_projects()
        return

    if not args.project:
        parser.print_help()
        sys.exit(1)

    project = args.project
    data_file = DATA_DIR / f"{project}.json"
    md_file = PROJECTS_DIR / f"{project}-dashboard.md"

    if data_file.exists() and not args.force:
        print(f"⚠️  プロジェクト '{project}' は既に存在します。")
        print(f"   上書きするには --force を追加してください。")
        print(f"   更新するには: python update_dashboard.py --project {project}")
        sys.exit(1)

    # データ生成
    data = create_initial_data(project, args.description, args.ai_model, args.phase)

    # JSON保存
    with open(data_file, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    # MD生成
    content = render_dashboard(data)
    with open(md_file, "w", encoding="utf-8") as f:
        f.write(content)

    print(f"[OK] Project '{project}' dashboard created!")
    print(f"   Dashboard: {md_file}")
    print(f"   Data:      {data_file}")
    print(f"\nNext steps:")
    print(f"  Add task: python update_dashboard.py --project {project} --add-task \"task name\"")
    print(f"  Add log:  python update_dashboard.py --project {project} --log \"log message\"")



if __name__ == "__main__":
    main()
