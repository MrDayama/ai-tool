# 🗄️ Obsidian ER図・プロジェクト建築ビューア (ER Diagram Viewer)

Obsidian上でプロジェクトを選択し、対応する **ER図（データベース構造図）**、**概念アーキテクチャ図**、**業務フロー**、および **TypeScript型定義** を対話的に切り替えて確認・閲覧できるビューアダッシュボードです。

---

## 🖥️ リアルタイム ER図ビューア UI (Interactive Viewer)

<iframe src="ERDiagramViewer/index.html" width="100%" height="650px" style="border: 1px solid #334155; border-radius: 8px;"></iframe>

---

## 🛠️ プロジェクトデータの再スキャン手順

ワークスペースに新しい `schema.json` や新しいプロジェクトを追加した場合は、以下のコマンドを実行してカタログ (`projects_catalog.json`) を最新状態に更新できます：

```powershell
.\.venv\Scripts\python.exe c:\work\ai\ai-tool\03_AI\ERDiagramViewer\scan_projects.py
```

---

## 📁 登録・検出されている開発ファイル
- 📂 [ERDiagramViewer フォルダ](file:///c:/work/ai/ai-tool/03_AI/ERDiagramViewer)
- 📄 [index.html (ビューアUI本体)](file:///c:/work/ai/ai-tool/03_AI/ERDiagramViewer/index.html)
- 📄 [projects_catalog.json (登録プロジェクト一覧)](file:///c:/work/ai/ai-tool/03_AI/ERDiagramViewer/projects_catalog.json)
- 📄 [SchemaDrivenDevelopment フォルダ](file:///c:/work/ai/ai-tool/03_AI/SchemaDrivenDevelopment)
