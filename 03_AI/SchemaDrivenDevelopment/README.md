# 🚀 単一スキーマ駆動開発 (Schema-Driven Development / Vibe Coding Guide)

> **コンセプト**: 
> 画面やコードをいきなりAIに書かせるのではなく、まず1つの `schema.json` （データ構造・ER図・概念・フロー）を策定します。
> 単一のスキーマから **ER図・概念図・業務フロー・UI構造・TypeScript型定義** を一括自動生成・追従更新させることで、AI開発における手戻りをゼロにします。

---

## 📂 構成ファイル一覧

- 📄 [schema_template.json](file:///c:/work/ai/ai-tool/03_AI/SchemaDrivenDevelopment/schema_template.json) : 新規開発時用の定義テンプレート
- 📄 [example_schema.json](file:///c:/work/ai/ai-tool/03_AI/SchemaDrivenDevelopment/example_schema.json) : サンプルプロジェクトのデータ定義
- 🐍 [generate_diagrams.py](file:///c:/work/ai/ai-tool/03_AI/SchemaDrivenDevelopment/generate_diagrams.py) : 図・ドキュメント・型定義を一括生成する自動スクリプト
- 📄 [generated_output.md](file:///c:/work/ai/ai-tool/03_AI/SchemaDrivenDevelopment/generated_output.md) : 自動生成される統合Markdownドキュメント（Obsidian上で直接プレビュー可能）

---

## 🛠️ 運用手順 (How to Use in Obsidian)

### STEP 1: データスキーマ（`schema.json`）の作成・修正
開発・設計したい機能のデータ構造やフローを `schema.json` （または `example_schema.json`）に記述します。
エンティティのフィールド追加や削除、リレーションシップ、業務フローの手順変更をここだけで管理します。

### STEP 2: 自動生成スクリプトの実行
ターミナルまたはPowerShellで以下を実行します：

```bash
python c:\work\ai\ai-tool\03_AI\SchemaDrivenDevelopment\generate_diagrams.py
```

※特定のスキーマファイルを指定する場合：
```bash
python generate_diagrams.py my_project_schema.json
```

### STEP 3: Obsidianでの確認
生成された `generated_output.md` をObsidianで開くと、以下の可視化図が一瞬で全自動レンダリングされます：
1. **ER図 (Mermaid erDiagram)**: データベースのテーブル構成とリレーション
2. **概念アーキテクチャ図 (Mermaid graph TD)**: レイヤー間の依存関係
3. **業務フロー図 (Mermaid flowchart TD)**: 条件分岐付き処理シーケンス
4. **UIレイアウト構成**: 画面とコンポーネントツリー
5. **TypeScript型定義**: そのままコードへコピペ可能な `export interface` 群

---

## 🤖 AI（バイブコーディング）への指示プロンプトテンプレート

AIに開発・実装を依頼する際は、以下のプロンプトをそのままコピーして `schema.json` または `generated_output.md` の内容を渡してください。

```markdown
【バイブコーディング実装指示】
以下の `schema.json` で定義された単一ソースの仕様・型・フローに基づいて実装を行ってください。

1. データベース定義・型定義は `entities` および生成された TypeScript interface に厳密に従ってください。
2. 業務フローおよび条件分岐は `workflows` のステップの通りにロジックを実装してください。
3. UI画面構成は `ui_screens` で指定されているコンポーネント階層の通りに設計してください。
4. 定義されていないデータ項目や画面を勝手に追加せず、追加が必要な場合はまず `schema.json` を更新してください。

[ここに schema.json または generated_output.md の内容を貼付]
```

---

## ✨ このやり方を取り入れるメリット

- **手戻りゼロ**: AIが画面ごとに異なるデータ構造や勝手な型を作ることがなくなります。
- **仕様変更の超高速化**: `schema.json` の1行を変更してスクリプトを実行するだけで、設計図・フロー・コード型が一括更新されます。
- **ドキュメントの最新化保証**: 設計ドキュメントとコードの乖離（ドキュメントの腐敗）が発生しません。
