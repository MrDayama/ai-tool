# 単一スキーマ駆動開発 (Schema-Driven Development) 標準適用ルール

ユーザーからシステム、アプリ、ツール、Webサービスの新規設計・ER図作成・開発・改修依頼を受けた際は、システム規模を問わず、必ず本ルールに従って設計プロセスを実行してください。

## 1. 共通単一スキーマ (`schema.json`) の策定
- `03_AI/SchemaDrivenDevelopment/schema_template.json` を活用し、プロジェクト用の単一データ定義（JSON）を作成します。
- データベースのテーブル（entities）、概念アーキテクチャ（concepts）、処理シーケンス（workflows）、UI画面（ui_screens）を1つのJSONに一元管理します。

## 2. 一括自動生成ツールの実行
- スクリプト `c:\work\ai\ai-tool\03_AI\SchemaDrivenDevelopment\generate_diagrams.py` を実行し、Obsidianプレビュー可能な全自動設計ドキュメント (`generated_output.md`) を生成します。

## 3. ER図ビューア自動登録 (Mandatory Auto-Catalog Scanning)
- **ER図作成・スキーマ変更後は、必ず `c:\work\ai\ai-tool\03_AI\ERDiagramViewer\scan_projects.py` を自動実行してください。**
- これにより、作成・修正したプロジェクトが即座に「ER図ビューア（`projects_catalog.js`）」の対象として自動登録され、デスクトップショートカットや Obsidian ノートからドロップダウン選択可能になります。

## 4. 生成された仕様・型定義に基づく実装 (Vibe Coding)
- 自動出力された仕様・型・図を唯一の仕様ソース（Single Source of Truth）とし、手戻りのないコード実装を徹底します。
